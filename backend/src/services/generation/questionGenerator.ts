import { LLMService } from '../llm/llm.interface.js';
import { Requirement, Question, QuestionCategory } from '../../types/kit.js';
import { CompanyBrief } from '../../types/kit.js';
import { HiringProcessResearch } from '../research/hiringProcess.js';
import { PublicDiscussionResearch } from '../research/publicDiscussion.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawQuestion {
  requirement_ids: string[];
  prompt: string;
  answer_outline: string;
  difficulty: number;
}

/**
 * Generates interview questions partitioned strictly by category and grounded in requirements.
 */
export async function generateCategorizedQuestions(options: {
  category: QuestionCategory;
  requirements: Requirement[];
  companyBrief: CompanyBrief;
  hiringResearch?: HiringProcessResearch;
  publicDiscussion?: PublicDiscussionResearch;
  jdExcerpt: string;
  startQuestionNumber: number;
  llm: LLMService;
}): Promise<Question[]> {
  const { category, requirements, companyBrief, hiringResearch, publicDiscussion, jdExcerpt, startQuestionNumber, llm } = options;

  // Filter requirements relevant to this category
  let relevantReqs: Requirement[] = [];
  if (category === 'technical') {
    relevantReqs = requirements.filter(r => r.kind === 'technical');
  } else if (category === 'behavioural') {
    relevantReqs = requirements.filter(r => r.kind === 'behavioural');
  } else if (category === 'system-design') {
    relevantReqs = requirements.filter(r => 
      r.kind === 'technical' && 
      /system|design|architect|scale|distributed|database|pipeline|cluster|cloud/i.test(r.text)
    );
    // If no specific system design requirements, use technical requirements with high priority
    if (relevantReqs.length === 0) {
      relevantReqs = requirements.filter(r => r.kind === 'technical');
    }
  } else if (category === 'company-fit') {
    relevantReqs = requirements.filter(r => r.kind === 'domain' || r.kind === 'behavioural');
    if (relevantReqs.length === 0) {
      relevantReqs = requirements.slice(0, 2);
    }
  }

  // Fallback: if no category-specific requirements exist, use all available requirements
  if (relevantReqs.length === 0) {
    relevantReqs = requirements;
  }

  if (relevantReqs.length === 0) {
    return [];
  }

  const categoryGuidance = getCategoryGuidance(category);

  const trustedInstructions = `
You are a Staff Technical Interviewer formulating specialized ${category.toUpperCase()} interview questions.

CATEGORY GUIDANCE:
${categoryGuidance}

REQUIREMENTS TO TARGET:
${relevantReqs.map(r => `- [${r.id}] (${r.priority.toUpperCase()} | ${r.kind}): ${r.text}`).join('\n')}

STRICT RULES:
1. For every generated question, 'requirement_ids' MUST contain one or more exact IDs from the list above (e.g. ["${relevantReqs[0].id}"]).
2. Do NOT invent requirement IDs.
3. 'difficulty' must be an integer: 1 (fundamental/entry), 2 (mid-level/solid competency), or 3 (staff/complex trade-offs).
4. 'answer_outline' must provide a structured bulleted summary of key points an exceptional candidate should mention.
5. Generate 1 to 3 high-impact questions for this category.

Output JSON format:
[
  {
    "requirement_ids": ["${relevantReqs[0].id}"],
    "prompt": "Detailed question prompt",
    "answer_outline": "Structured outline of optimal answer and key evaluation criteria",
    "difficulty": 2
  }
]
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      category,
      company_summary: companyBrief.summary,
      company_what_they_do: companyBrief.what_they_do,
      hiring_process: hiringResearch?.found ? hiringResearch.processDescription : 'Standard hiring process',
      public_discussion: publicDiscussion?.found ? publicDiscussion.discussionSummary : 'No public discussion found',
      job_description_excerpt: jdExcerpt.slice(0, 1500)
    }
  });

  let rawQuestions: RawQuestion[] = [];
  try {
    rawQuestions = await llm.generateJson<RawQuestion[]>(
      systemPrompt,
      userPrompt,
      '[{"requirement_ids": ["string"], "prompt": "string", "answer_outline": "string", "difficulty": 2}]',
      parsed => ({
        isValid: Array.isArray(parsed),
        error: 'Expected array of questions'
      })
    );
  } catch {
    // Graceful fallback question generation
    rawQuestions = relevantReqs.slice(0, 2).map((r, i) => ({
      requirement_ids: [r.id],
      prompt: `Can you discuss your in-depth experience with ${r.text} and provide a real-world project example?`,
      answer_outline: 'Explain architecture decisions, performance challenges, and measurable outcomes.',
      difficulty: (i === 0 ? 2 : 3) as 1 | 2 | 3
    }));
    if (!Array.isArray(rawQuestions)) {
      rawQuestions = [];
    }
  }

  if (!Array.isArray(rawQuestions)) {
    rawQuestions = [];
  }

  const validReqIds = new Set(requirements.map(r => r.id));
  let currentNum = startQuestionNumber;

  return rawQuestions.map(item => {
    // Filter requirement_ids to only valid existing IDs
    const filteredRids = (item.requirement_ids || []).filter(rid => validReqIds.has(rid));
    // If empty, fall back to first relevant requirement ID
    if (filteredRids.length === 0 && relevantReqs.length > 0) {
      filteredRids.push(relevantReqs[0].id);
    }

    const difficulty = (item.difficulty === 1 || item.difficulty === 2 || item.difficulty === 3) 
      ? item.difficulty 
      : 2;

    const question: Question = {
      id: `q${currentNum++}`,
      requirement_ids: filteredRids,
      category,
      prompt: item.prompt?.trim() || `Interview question regarding ${category}`,
      answer_outline: item.answer_outline?.trim() || 'Comprehensive evaluation outline.',
      difficulty,
      metadata: {
        source: 'generated',
        isEdited: false,
        isPinned: false
      }
    };

    return question;
  });
}

function getCategoryGuidance(category: QuestionCategory): string {
  switch (category) {
    case 'technical':
      return 'Formulate concrete, deep technical coding or architecture questions evaluating language mechanics, concurrency, performance profiling, and APIs grounded in the extracted requirements.';
    case 'behavioural':
      return 'Formulate STAR-method behavioral scenarios evaluating engineering leadership, resolving architectural disagreements, mentorship, and ownership, taking into account known company culture or interview format.';
    case 'system-design':
      return 'Formulate scalable distributed system design problems considering data ingestion, caching, partitioning, consistency models, and fault tolerance, framed in scenarios relevant to the company product space and scale where available.';
    case 'company-fit':
      return 'Formulate questions evaluating candidate alignment with what the company actually does, its core product architecture, mission, and cross-functional autonomy, directly referencing information in the company overview.';
  }
}
