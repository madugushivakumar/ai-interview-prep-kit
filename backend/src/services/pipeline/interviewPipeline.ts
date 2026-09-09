import { PipelineInput, PipelineOptions } from '../../types/pipeline.js';
import { Kit, sanitizeKitForExport } from '../../types/kit.js';
import { KitSchema } from '../../schemas/kit.schema.js';
import { extractRequirements } from '../generation/requirementExtractor.js';
import { CompanyCrawler } from '../crawler/companyCrawler.js';
import { researchCompanyOverview } from '../research/companyOverview.js';
import { researchHiringProcess } from '../research/hiringProcess.js';
import { researchPublicDiscussion } from '../research/publicDiscussion.js';
import { generateRoleBreakdown } from '../generation/roleGenerator.js';
import { generateCategorizedQuestions } from '../generation/questionGenerator.js';
import { generateFlashcards } from '../generation/flashcardGenerator.js';
import { checkCoverage } from '../coverage/coverageChecker.js';
import { generateGapQuestions } from './gapGenerator.js';
import { allocateSchedule } from '../scheduling/scheduleAllocator.js';
import { LLMFactory } from '../llm/llm.factory.js';
import { config } from '../../config/env.js';

/**
 * Central Reusable Interview Pipeline
 *
 * Implements Section 4 of the Trao Assessment specification:
 * The single source of truth used identically by both the Web Application and the Batch CLI.
 */
export async function runInterviewPipeline(
  input: PipelineInput,
  options: PipelineOptions = {}
): Promise<Kit> {
  const { onProgress, allowLocalUrls, maxCoveragePasses = config.MAX_COVERAGE_PASSES } = options;

  async function notify(stepName: string, progress: number, details?: string) {
    if (onProgress) {
      await onProgress(stepName, progress, details);
    }
  }

  // 1. Validate Input
  await notify('Validating Input', 5);
  if (!input.jd || typeof input.jd !== 'string' || input.jd.trim().length === 0) {
    const err: any = new Error('Job description (jd) is required and cannot be empty');
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (!input.company_url || typeof input.company_url !== 'string') {
    const err: any = new Error('Company URL is required');
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 60) {
    const err: any = new Error(`Days must be an integer between 1 and 60. Received: ${input.days}`);
    err.code = 'INVALID_INPUT';
    throw err;
  }

  const llm = LLMFactory.getProvider();

  // 2. Extract Requirements from JD
  await notify('Extracting Requirements', 15);
  const requirements = await extractRequirements(input.jd, llm);

  // 3. Crawl Company Website
  await notify('Crawling Company Site', 25);
  const crawler = new CompanyCrawler({
    allowLocal: allowLocalUrls ?? config.ALLOW_LOCAL_CRAWL,
    timeoutMs: config.CRAWL_TIMEOUT_MS,
    maxPages: config.MAX_CRAWL_PAGES
  });

  const crawlResult = await crawler.crawl(input.company_url);

  // Derive company name from domain or homepage title
  let companyName = 'Company';
  try {
    const urlObj = new URL(crawlResult.companyUrl);
    const hostParts = urlObj.hostname.replace(/^www\./, '').split('.');
    companyName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
    if (crawlResult.pages[0]?.title && !crawlResult.pages[0].title.toLowerCase().includes('homepage')) {
      const pageTitleCompany = crawlResult.pages[0].title.split(/[-–|]/)[0].trim();
      if (pageTitleCompany.length > 1 && pageTitleCompany.length < 30) {
        companyName = pageTitleCompany;
      }
    }
  } catch {
    // Keep fallback
  }

  // 4. Research Stage A: Company Overview
  await notify('Synthesizing Company Overview', 35);
  const company_brief = await researchCompanyOverview(crawlResult.companyUrl, crawlResult.pages, llm);

  // 5. Research Stage B: Hiring Process
  await notify('Researching Hiring Process', 45);
  const hiringResearch = await researchHiringProcess(crawlResult.pages, llm);

  // 6. Research Stage C: Public Interview Discussion
  await notify('Researching Public Interview Discussions', 52);
  const publicDiscussion = await researchPublicDiscussion(companyName, crawlResult.companyUrl, llm);

  // 7. Generate Role Breakdown
  await notify('Generating Role Breakdown', 60);
  const role = await generateRoleBreakdown(input.jd, requirements, companyName, llm);

  // 8. Generate Categorized Questions
  await notify('Generating Question Bank', 70);
  let allQuestions: any[] = [];
  let questionCounter = 1;

  const categories: Array<'technical' | 'behavioural' | 'system-design' | 'company-fit'> = [
    'technical',
    'behavioural',
    'system-design',
    'company-fit'
  ];

  for (const cat of categories) {
    const catQuestions = await generateCategorizedQuestions({
      category: cat,
      requirements: role.requirements,
      companyBrief: company_brief,
      hiringResearch,
      publicDiscussion,
      jdExcerpt: input.jd,
      startQuestionNumber: questionCounter,
      llm
    });

    allQuestions.push(...catQuestions);
    questionCounter += catQuestions.length;
  }

  // 9. Generate Flashcards
  await notify('Generating Flashcards', 78);
  const flashcards = await generateFlashcards(role.requirements, llm);

  // 10. Deterministic Coverage Checking & Second-Pass Gap Closure Loop
  await notify('Checking Coverage', 85);
  let passes = 1;
  let coverageResult = checkCoverage(role.requirements, allQuestions);

  // Second-pass loop for uncovered must-have requirements
  while (!coverageResult.is_fully_covered && passes < maxCoveragePasses) {
    await notify(`Closing Coverage Gaps (Pass ${passes + 1})`, 88);

    const uncoveredReqs = role.requirements.filter(r => 
      coverageResult.uncovered_requirement_ids.includes(r.id)
    );

    const gapQuestions = await generateGapQuestions({
      uncoveredRequirements: uncoveredReqs,
      startQuestionNumber: questionCounter,
      llm
    });

    if (gapQuestions.length === 0) {
      break; // No more questions could be generated
    }

    allQuestions.push(...gapQuestions);
    questionCounter += gapQuestions.length;
    passes++;

    // Re-check coverage deterministically
    coverageResult = checkCoverage(role.requirements, allQuestions);
  }

  // 11. Deterministic Schedule Allocation
  await notify('Allocating Schedule', 92);
  const schedule = allocateSchedule({
    days: input.days,
    requirements: role.requirements,
    questions: allQuestions
  });

  // 12. Build Complete Kit
  await notify('Validating Kit Structure', 96);
  const source = {
    company: companyName,
    company_url: crawlResult.companyUrl,
    role: role.title,
    location: 'Remote / Hybrid',
    jd_chars: input.jd.length,
    researched_at: new Date().toISOString(),
    pages_used: crawlResult.pagesUsed
  };

  const rawKit: Kit = {
    source,
    company_brief,
    role,
    questions: allQuestions,
    flashcards,
    schedule,
    coverage: {
      uncovered_requirement_ids: coverageResult.uncovered_requirement_ids,
      passes
    }
  };

  // 13. Validate against strict Appendix A Zod schema
  const sanitized = sanitizeKitForExport(rawKit);
  const validationResult = KitSchema.safeParse(sanitized);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const err: any = new Error(`Kit structure validation failed: ${errorMessages}`);
    err.code = 'INVALID_KIT_STRUCTURE';
    throw err;
  }

  await notify('Completed', 100);
  return sanitized;
}
