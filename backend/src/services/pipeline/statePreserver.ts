import { Kit, Question, QuestionCategory } from '../../types/kit.js';
import { generateCategorizedQuestions } from '../generation/questionGenerator.js';
import { checkCoverage } from '../coverage/coverageChecker.js';
import { allocateSchedule } from '../scheduling/scheduleAllocator.js';
import { LLMService } from '../llm/llm.interface.js';
import { researchCompanyOverview } from '../research/companyOverview.js';
import { CompanyCrawler } from '../crawler/companyCrawler.js';

/**
 * State Preservation & Targeted Section Regeneration Engine
 *
 * Implements Section 24 & Section 25 of the Trao Assessment specification:
 * Ensures user-created, user-edited, and user-pinned items survive regenerations.
 */
export class StatePreserver {
  /**
   * Regenerates questions for a single category while strictly preserving:
   * - Any question edited by the user (isEdited === true)
   * - Any question pinned by the user (isPinned === true)
   * - Any question created manually by the user (source === 'user')
   * - All questions belonging to other categories
   */
  public static async regenerateCategory(options: {
    kit: Kit;
    category: QuestionCategory;
    llm: LLMService;
  }): Promise<Kit> {
    const { kit, category, llm } = options;

    const existingQuestions = kit.questions;

    // 1. Separate current category questions into Protected vs Eligible
    const protectedQuestions: Question[] = [];
    const eligibleToRemoveIds = new Set<string>();

    for (const q of existingQuestions) {
      if (q.category !== category) {
        // Other categories are 100% protected
        protectedQuestions.push(q);
      } else {
        const isUserEdited = Boolean(q.metadata?.isEdited);
        const isUserPinned = Boolean(q.metadata?.isPinned);
        const isUserCreated = q.metadata?.source === 'user';

        if (isUserEdited || isUserPinned || isUserCreated) {
          // PROTECTED: User touched this question
          protectedQuestions.push(q);
        } else {
          // ELIGIBLE: Untouched generated question
          eligibleToRemoveIds.add(q.id);
        }
      }
    }

    // 2. Generate replacement questions for this category
    const startQNum = existingQuestions.length + 10;
    const newQuestions = await generateCategorizedQuestions({
      category,
      requirements: kit.role.requirements,
      companyBrief: kit.company_brief,
      jdExcerpt: '',
      startQuestionNumber: startQNum,
      llm
    });

    // 3. Merge Protected + Newly Generated
    const updatedQuestions = [...protectedQuestions, ...newQuestions];

    // 4. Re-calculate deterministic coverage
    const coverageAnalysis = checkCoverage(kit.role.requirements, updatedQuestions);

    // 5. Re-allocate schedule deterministically with the updated questions
    const updatedSchedule = allocateSchedule({
      days: kit.schedule.days_available,
      requirements: kit.role.requirements,
      questions: updatedQuestions
    });

    return {
      ...kit,
      questions: updatedQuestions,
      schedule: updatedSchedule,
      coverage: {
        uncovered_requirement_ids: coverageAnalysis.uncovered_requirement_ids,
        passes: kit.coverage.passes
      }
    };
  }

  /**
   * Targeted Company Brief Regeneration
   * Re-synthesizes company brief without altering role, questions, flashcards, or schedule.
   */
  public static async regenerateCompanyBrief(options: {
    kit: Kit;
    llm: LLMService;
    allowLocalUrls?: boolean;
  }): Promise<Kit> {
    const { kit, llm, allowLocalUrls } = options;

    const crawler = new CompanyCrawler({ allowLocal: allowLocalUrls });
    const crawlResult = await crawler.crawl(kit.source.company_url);
    const newBrief = await researchCompanyOverview(kit.source.company_url, crawlResult.pages, llm);

    return {
      ...kit,
      company_brief: newBrief,
      source: {
        ...kit.source,
        researched_at: new Date().toISOString(),
        pages_used: Array.from(new Set([...kit.source.pages_used, ...crawlResult.pagesUsed]))
      }
    };
  }

  /**
   * Targeted Schedule Regeneration
   * Re-computes arithmetic schedule without altering any questions or flashcards.
   */
  public static regenerateSchedule(kit: Kit, days?: number): Kit {
    const targetDays = days || kit.schedule.days_available;
    const newSchedule = allocateSchedule({
      days: targetDays,
      requirements: kit.role.requirements,
      questions: kit.questions
    });

    return {
      ...kit,
      schedule: newSchedule
    };
  }
}
