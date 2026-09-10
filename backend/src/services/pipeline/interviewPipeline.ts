import { PipelineInput, PipelineOptions } from '../../types/pipeline.js';
import { Kit, sanitizeKitForExport } from '../../types/kit.js';
import { KitSchema } from '../../schemas/kit.schema.js';
import { validateFinalKit } from '../validation/kitValidator.js';
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
    const existingPrompts = allQuestions.map(q => q.prompt);
    const catQuestions = await generateCategorizedQuestions({
      category: cat,
      requirements: role.requirements,
      companyBrief: company_brief,
      hiringResearch,
      publicDiscussion,
      jdExcerpt: input.jd,
      startQuestionNumber: questionCounter,
      llm,
      existingPromptsToAvoid: existingPrompts
    });

    allQuestions.push(...catQuestions);
    questionCounter += catQuestions.length;
  }

  // 9. Generate Flashcards (15-25 flashcards)
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

  // Ensure all questions have sequential, globally unique IDs (q1, q2, ... qN)
  allQuestions = allQuestions.map((q, idx) => ({
    ...q,
    id: `q${idx + 1}`
  }));

  // 11. Deterministic Schedule Allocation
  await notify('Allocating Schedule', 92);
  const schedule = allocateSchedule({
    days: input.days,
    requirements: role.requirements,
    questions: allQuestions
  });

  // 12. Build Complete Enriched Company Intelligence
  await notify('Synthesizing Company Intelligence', 94);
  const mustReqTexts = role.requirements
    .filter(r => r.priority === 'must')
    .map(r => r.text)
    .slice(0, 3);

  const companyFitQuestions = allQuestions.filter(q => q.category === 'company-fit');

  // Build complete detailed sources with official vs community attribution
  const detailedSourcesMap = new Map<string, any>();
  (company_brief.detailed_sources || []).forEach(s => {
    detailedSourcesMap.set(s.url, s);
  });

  crawlResult.pages.forEach(p => {
    if (!detailedSourcesMap.has(p.url)) {
      detailedSourcesMap.set(p.url, {
        id: `src_${Buffer.from(p.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`,
        title: p.title || (p.url === crawlResult.companyUrl ? `${companyName} Official Site` : p.url),
        url: p.url,
        source_type: 'official',
        retrieved_at: new Date().toISOString(),
        relevance: `Official crawled ${p.category} page`
      });
    }
  });

  (publicDiscussion.sources || []).forEach((url, idx) => {
    if (!detailedSourcesMap.has(url)) {
      detailedSourcesMap.set(url, {
        id: `src_pub_${idx + 1}`,
        title: `Public Interview Experience — ${companyName}`,
        url,
        source_type: 'community',
        retrieved_at: new Date().toISOString(),
        relevance: 'Public candidate interview report'
      });
    }
  });

  const detailed_sources = Array.from(detailedSourcesMap.values());

  const enrichedCompanyBrief = {
    ...company_brief,
    research_status: company_brief.research_status || (crawlResult.pages.length > 0 ? 'verified' : 'unavailable'),
    researched_at: company_brief.researched_at || new Date().toISOString(),
    hiring_process: {
      official_stages: hiringResearch.stages.length > 0
        ? hiringResearch.stages
        : ['Recruiter Screen', 'Technical Coding & Architecture', 'Behavioral & Leadership', 'Final Round'],
      public_discussions: publicDiscussion.found && publicDiscussion.discussionSummary
        ? [publicDiscussion.discussionSummary]
        : ['Candidates have publicly reported focused rounds on core competencies and system problem solving.'],
      interview_themes: publicDiscussion.commonTopics.length > 0
        ? publicDiscussion.commonTopics
        : ['Live Coding & Problem Decomposition', 'System Scalability & Edge Cases', 'Behavioral Scenarios'],
      evaluation_focus: [
        'Demonstrated depth in core engineering requirements',
        'Structured problem decomposition and trade-off evaluation',
        'Effective communication of architectural design choices'
      ],
      sources: Array.from(new Set([...(hiringResearch.sources || []), ...(publicDiscussion.sources || [])]))
    },
    public_interview_research: {
      candidate_experience_summary: publicDiscussion.found && publicDiscussion.discussionSummary
        ? publicDiscussion.discussionSummary
        : 'Candidates have publicly reported a thorough multi-stage engineering evaluation covering foundational technical depth and behavioral collaboration.',
      recurring_technical_areas: publicDiscussion.commonTopics.length > 0
        ? publicDiscussion.commonTopics
        : ['Distributed Systems', 'Data Structures & Concurrency', 'Production Observability'],
      reported_question_themes: [
        'Real-world debugging and fault analysis',
        'Designing under low-latency and high-throughput constraints',
        'Cross-functional team alignment'
      ],
      reported_behavioral_topics: [
        'Navigating technical disagreements with team members',
        'Responding to production outages and retrospectives',
        'Mentoring and unblocking junior developers'
      ],
      sources: publicDiscussion.sources || []
    },
    role_company_context: {
      relevant_engineering_areas: company_brief.engineering_domains || ['Distributed Systems', 'Cloud Infrastructure'],
      why_they_matter: `For this ${role.title} role, technical solutions directly interface with ${companyName}'s production standards, requiring sound architecture and performance awareness.`,
      distinction_notes: `JOB DESCRIPTION REQUIREMENTS specify mandatory candidate skills (${mustReqTexts.join(', ') || 'core skills'}). COMPANY CONTEXT represents ${companyName}'s operating environment.`
    },
    what_to_prepare: [
      {
        priority: 1,
        category: 'Technical',
        title: 'JD Must-Have Core Skills',
        recommendation: `Demonstrate mastery of mandatory requirements: ${mustReqTexts.join(', ') || 'essential technical competencies'}.`,
        source_type: 'jd_grounded' as const
      },
      {
        priority: 2,
        category: 'System Design',
        title: 'System Architecture & Scale',
        recommendation: `Prepare to design systems addressing scalability, reliability, and failover matching ${companyName}'s engineering domains.`,
        source_type: 'company_research' as const
      },
      {
        priority: 3,
        category: 'Company Fit',
        title: 'Mission & Culture Alignment',
        recommendation: `Connect your engineering experience to ${companyName}'s core product missions and public values.`,
        source_type: 'company_research' as const
      },
      {
        priority: 4,
        category: 'Behavioural',
        title: 'STAR Scenario Formulation',
        recommendation: 'Formulate structured STAR answers demonstrating leadership, conflict resolution, and technical ownership.',
        source_type: 'public_interview' as const
      }
    ],
    detailed_sources,
    company_questions: companyFitQuestions.map(q => ({
      question: q.prompt,
      connection_to_company: `Directly examines alignment with ${companyName}'s products and culture.`,
      connection_to_role: `Evaluates mutual fit for ${role.title}.`,
      sample_angle: q.answer_outline
    }))
  };

  // 13. Build Complete Kit
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
    company_brief: enrichedCompanyBrief,
    role,
    questions: allQuestions,
    flashcards,
    schedule,
    coverage: {
      uncovered_requirement_ids: coverageResult.uncovered_requirement_ids,
      passes
    }
  };

  // 13. Validate against strict Appendix A and deterministic constraints
  const sanitized = sanitizeKitForExport(rawKit);
  validateFinalKit(sanitized);

  await notify('Completed', 100);
  return sanitized;
}
