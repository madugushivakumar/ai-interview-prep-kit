import { LLMService } from '../llm/llm.interface.js';
import { Requirement, Question, QuestionCategory } from '../../types/kit.js';
import { CompanyBrief } from '../../types/kit.js';
import { HiringProcessResearch } from '../research/hiringProcess.js';
import { PublicDiscussionResearch } from '../research/publicDiscussion.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

export interface RawQuestion {
  requirement_ids: string[];
  prompt: string;
  answer_outline: string;
  difficulty: number;
}

export const DEFAULT_QUESTION_TARGETS: Record<QuestionCategory, number> = {
  technical: 10,
  behavioural: 8,
  'system-design': 8,
  'company-fit': 8
};

export interface GenerateQuestionsOptions {
  category: QuestionCategory;
  requirements: Requirement[];
  companyBrief: CompanyBrief;
  hiringResearch?: HiringProcessResearch;
  publicDiscussion?: PublicDiscussionResearch;
  jdExcerpt: string;
  startQuestionNumber: number;
  llm: LLMService;
  targetCount?: number;
  existingPromptsToAvoid?: string[];
}

/**
 * Normalizes prompt text for duplicate detection (collapses whitespace, lowercases, removes punctuation)
 */
export function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks for obvious category contamination
 */
export function isCategoryContaminated(prompt: string, category: QuestionCategory): boolean {
  const pLower = prompt.toLowerCase();

  // Behavioral questions must not be in Technical or System Design
  const behavioralTriggers = [
    'tell me about a time',
    'describe a time when you',
    'describe a situation where you',
    'give an example of when you',
    'can you describe a time',
    'how did you handle a situation where you',
    'walk me through a time'
  ];

  if (category === 'technical' || category === 'system-design') {
    if (behavioralTriggers.some(t => pLower.startsWith(t) || pLower.includes(t))) {
      return true;
    }
  }

  // System design should not be in Behavioral
  if (category === 'behavioural') {
    if (pLower.startsWith('design a ') || pLower.startsWith('architect a ')) {
      return true;
    }
  }

  return false;
}

/**
 * Generates interview questions partitioned strictly by category and grounded in requirements.
 */
export async function generateCategorizedQuestions(options: GenerateQuestionsOptions): Promise<Question[]> {
  const {
    category,
    requirements,
    companyBrief,
    hiringResearch,
    publicDiscussion,
    jdExcerpt,
    startQuestionNumber,
    llm,
    targetCount = DEFAULT_QUESTION_TARGETS[category],
    existingPromptsToAvoid = []
  } = options;

  // Filter requirements relevant to this category
  let relevantReqs: Requirement[] = [];
  if (category === 'technical') {
    relevantReqs = requirements.filter(r => r.kind === 'technical');
  } else if (category === 'behavioural') {
    relevantReqs = requirements.filter(r => r.kind === 'behavioural');
  } else if (category === 'system-design') {
    relevantReqs = requirements.filter(r => 
      r.kind === 'technical' && 
      /system|design|architect|scale|distributed|database|pipeline|cluster|cloud|network|infra/i.test(r.text)
    );
    if (relevantReqs.length === 0) {
      relevantReqs = requirements.filter(r => r.kind === 'technical');
    }
  } else if (category === 'company-fit') {
    relevantReqs = requirements.filter(r => r.kind === 'domain' || r.kind === 'behavioural');
    if (relevantReqs.length === 0) {
      relevantReqs = requirements.slice(0, 3);
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
  const existingSet = new Set(existingPromptsToAvoid.map(normalizePrompt));

  const avoidSection = existingPromptsToAvoid.length > 0
    ? `\nEXISTING QUESTIONS TO AVOID (DO NOT REPEAT ANY OF THESE):\n${existingPromptsToAvoid.slice(0, 15).map(p => `- ${p}`).join('\n')}\n`
    : '';

  const trustedInstructions = `
You are a Staff Technical Interviewer formulating specialized ${category.toUpperCase()} interview questions.

CATEGORY GUIDANCE:
${categoryGuidance}

REQUIREMENTS TO TARGET:
${relevantReqs.map(r => `- [${r.id}] (${r.priority.toUpperCase()} | ${r.kind}): ${r.text}`).join('\n')}
${avoidSection}
STRICT RULES:
1. Generate exactly ${targetCount} high-impact, completely distinct interview questions for this category.
2. Every question must be genuinely different in concept, scenario, and technical focus.
3. For every generated question, 'requirement_ids' MUST contain one or more exact IDs from the list above (e.g. ["${relevantReqs[0].id}"]). Do NOT invent requirement IDs.
4. 'difficulty' must be an integer: 1 (fundamental/entry), 2 (mid-level/solid competency), or 3 (staff/complex trade-offs). Strive for a realistic distribution (~25% L1, ~50% L2, ~25% L3).
5. 'answer_outline' must provide a structured summary matching the category requirements:
   - Technical: Concept, implementation details, trade-offs, pitfalls. (DO NOT USE STAR).
   - Behavioural: Situation, Task, Action, Result, Reflection (STAR framework).
   - System Design: Requirements, scale/assumptions, architecture, data model, APIs, bottlenecks & reliability trade-offs. (DO NOT USE STAR).
   - Company Fit: Company evidence, role connection, relevant experience, motivation.
6. Under NO circumstances generate a behavioural/STAR question in Technical or System Design.

Output JSON format:
[
  {
    "requirement_ids": ["${relevantReqs[0].id}"],
    "category": "${category}",
    "prompt": "Detailed unique question prompt",
    "answer_outline": "Structured outline of optimal answer and evaluation criteria",
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
    rawQuestions = [];
  }

  if (!Array.isArray(rawQuestions)) {
    rawQuestions = [];
  }

  // Filter out contaminated or duplicate questions
  const seenNormPrompts = new Set<string>();
  const validQuestions: RawQuestion[] = [];

  for (const item of rawQuestions) {
    if (!item.prompt || typeof item.prompt !== 'string') continue;
    const norm = normalizePrompt(item.prompt);
    if (!norm || norm.length < 15) continue;
    if (existingSet.has(norm) || seenNormPrompts.has(norm)) continue;
    if (isCategoryContaminated(item.prompt, category)) continue;

    seenNormPrompts.add(norm);
    validQuestions.push(item);
  }

  // If LLM returned fewer questions than targetCount, generate category-specific diverse fallbacks
  if (validQuestions.length < targetCount) {
    const needed = targetCount - validQuestions.length;
    const fallbacks = generateCategoryFallbacks(category, relevantReqs, companyBrief, needed, seenNormPrompts, existingSet);
    validQuestions.push(...fallbacks);
  }

  const validReqIds = new Set(requirements.map(r => r.id));
  let currentNum = startQuestionNumber;

  return validQuestions.slice(0, targetCount).map(item => {
    const filteredRids = (item.requirement_ids || []).filter(rid => validReqIds.has(rid));
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
      prompt: item.prompt.trim(),
      answer_outline: item.answer_outline?.trim() || getDefaultAnswerOutline(category),
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
      return 'Formulate concrete, deep technical coding or architecture questions evaluating language mechanics, concurrency, performance profiling, and APIs grounded in the extracted requirements. Strictly avoid behavioral or STAR phrasing.';
    case 'behavioural':
      return 'Formulate STAR-method behavioral scenarios evaluating engineering leadership, resolving architectural disagreements, mentorship, and ownership, taking into account known company culture or interview format.';
    case 'system-design':
      return 'Formulate scalable distributed system design problems considering data ingestion, caching, partitioning, consistency models, and fault tolerance, framed in scenarios relevant to the company product space and scale where available. Strictly avoid STAR phrasing.';
    case 'company-fit':
      return 'Formulate questions evaluating candidate alignment with what the company actually does, its core product architecture, mission, and cross-functional autonomy, directly referencing information in the company overview.';
  }
}

function getDefaultAnswerOutline(category: QuestionCategory): string {
  switch (category) {
    case 'technical':
      return 'Concept: Core technical principle. Implementation: Key architectural or code mechanics. Trade-offs: Latency, memory, and scalability considerations. Pitfalls: Edge cases and common anti-patterns.';
    case 'behavioural':
      return 'Situation: Context and team baseline. Task: Specific engineering challenge. Action: Concrete leadership and architectural steps taken. Result: Measurable outcome and team impact. Reflection: Key lesson learned.';
    case 'system-design':
      return 'Requirements: Functional and non-functional bounds. Scale: Throughput, latency, and data size. Architecture: Component breakdown and API contracts. Data Model: Storage engine and partitioning. Bottlenecks: Failure recovery and trade-offs.';
    case 'company-fit':
      return 'Company Evidence: Direct reference to company products and mission. Role Connection: How past engineering experience maps to this team. Motivation: Core drivers for joining the engineering culture.';
  }
}

/**
 * Produces rich, diverse category-appropriate fallback questions when LLM output is incomplete
 */
function generateCategoryFallbacks(
  category: QuestionCategory,
  relevantReqs: Requirement[],
  companyBrief: CompanyBrief,
  needed: number,
  seenNormPrompts: Set<string>,
  existingSet: Set<string>
): RawQuestion[] {
  const fallbacks: RawQuestion[] = [];
  const reqLen = relevantReqs.length;

  for (let i = 0; i < needed && i < 20; i++) {
    const req = relevantReqs[i % reqLen];
    let prompt = '';
    let outline = '';
    let diff: 1 | 2 | 3 = (i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 3);

    switch (category) {
      case 'technical':
        const techPrompts = [
          `How would you architect and benchmark the performance of a high-throughput module built with ${req.text}?`,
          `What are the most critical concurrency, memory management, or caching challenges when implementing ${req.text}?`,
          `Walk through how you would design automated integration testing and regression prevention for ${req.text}.`,
          `How would you diagnose and resolve a severe latency degradation in a service depending on ${req.text}?`,
          `What architectural trade-offs exist between different implementation patterns for ${req.text}, and how do you choose?`,
          `How do you enforce type safety, input sanitization, and security best practices when working with ${req.text}?`,
          `Explain the low-level execution model and failure modes associated with ${req.text} in production environments.`,
          `How would you design a zero-downtime database or schema migration strategy for services utilizing ${req.text}?`,
          `What profiling tools and metrics would you use to trace distributed bottlenecks across ${req.text}?`,
          `How do you handle backpressure and resource contention in high-volume services powered by ${req.text}?`
        ];
        prompt = techPrompts[i % techPrompts.length];
        outline = `Concept: Technical foundations of ${req.text}. Implementation: Code architecture and API structure. Trade-offs: Resource utilization vs complexity. Pitfalls: Failure cases and concurrency pitfalls.`;
        break;

      case 'behavioural':
        const behPrompts = [
          `Describe a time when you coached or mentored an engineer through a challenging task related to ${req.text}. How did you structure your guidance?`,
          `Tell me about a technical disagreement you had with senior engineers regarding the adoption or architecture of ${req.text}. How was it resolved?`,
          `Can you describe a production incident involving ${req.text}? Walk through how you led diagnosis, mitigation, and stakeholder communication.`,
          `Give an example of a situation where you had to push back on unrealistic delivery timelines to protect engineering quality in ${req.text}.`,
          `Tell me about a time you took end-to-end ownership of refactoring an unstable legacy component involving ${req.text}.`,
          `Describe how you navigated ambiguous requirements from product stakeholders when building features around ${req.text}.`,
          `Tell me about a time you advocated for addressing technical debt in ${req.text} when product roadmap pressure was high.`,
          `Describe a scenario where a project involving ${req.text} was at risk of missing a major launch deadline. How did you realign the team?`
        ];
        prompt = behPrompts[i % behPrompts.length];
        outline = `Situation: Background and team context regarding ${req.text}. Task: Specific technical and leadership objective. Action: Specific proactive steps you led. Result: Measurable business impact and uptime. Reflection: Engineering leadership takeaway.`;
        break;

      case 'system-design':
        const sysPrompts = [
          `Design a scalable, fault-tolerant distributed system that leverages ${req.text} to support 100,000 concurrent active users.`,
          `Design an event-driven data ingestion and processing pipeline incorporating ${req.text} with sub-second end-to-end latency SLAs.`,
          `How would you architect a globally distributed, multi-region deployment of a service relying on ${req.text}, ensuring data consistency?`,
          `Design a resilient asynchronous task execution and retry engine with dead-letter queuing around ${req.text}.`,
          `Design a multi-tenant API gateway and rate limiting layer that protects core backend services implementing ${req.text}.`,
          `How would you design an automated observability, distributed tracing, and alerting architecture for services using ${req.text}?`,
          `Design an asset storage and distributed caching infrastructure optimized for fast CDN delivery and cache invalidation with ${req.text}.`,
          `Design a real-time event aggregation and analytics dashboard system handling millions of events daily using ${req.text}.`
        ];
        prompt = sysPrompts[i % sysPrompts.length];
        outline = `Requirements: Scale and SLAs for ${req.text}. Architecture: High-level microservices and queue boundaries. Data Model: Partitioning keys and storage engines. Reliability: Circuit breakers, idempotency, and failover mechanics.`;
        break;

      case 'company-fit':
        const compWhat = companyBrief.what_they_do || 'our core distributed platform';
        const fitPrompts = [
          `How does your technical experience with ${req.text} position you to accelerate our mission in ${compWhat}?`,
          `Based on our focus on ${compWhat}, how would you approach collaborating across product and infrastructure teams here?`,
          `What aspects of our engineering scale and technical architecture in ${compWhat} do you find most compelling?`,
          `How do you balance rapid delivery for customer value with rigorous production reliability in an environment like ours?`,
          `How would you foster engineering excellence, blameless incident culture, and continuous learning within our teams?`,
          `What technical or architectural bottlenecks do you anticipate our engineering organization will face as we scale ${compWhat}?`,
          `In an autonomous engineering culture like ours, how do you self-direct priorities and validate your technical decisions?`,
          `What questions would you ask our engineering leads regarding our deployment pipeline, architectural vision, and team topology?`
        ];
        prompt = fitPrompts[i % fitPrompts.length];
        outline = `Company Evidence: Direct connection to ${compWhat}. Role Alignment: Concrete synergy with ${req.text}. Motivation: Genuine interest in company scaling and culture.`;
        break;
    }

    const norm = normalizePrompt(prompt);
    if (!seenNormPrompts.has(norm) && !existingSet.has(norm)) {
      seenNormPrompts.add(norm);
      fallbacks.push({
        requirement_ids: [req.id],
        prompt,
        answer_outline: outline,
        difficulty: diff
      });
    }
  }

  return fallbacks;
}
