import { LLMService } from '../llm/llm.interface.js';
import { Requirement, Question, QuestionCategory } from '../../types/kit.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawGapQuestion {
  requirement_ids: string[];
  category?: string;
  prompt: string;
  answer_outline: string;
  difficulty: number;
}

/**
 * Second-Pass Gap Generator
 *
 * Implements Section 18 of the Trao Assessment specification:
 * Targets precisely the uncovered MUST-have requirements identified by the deterministic coverage checker.
 */
export async function generateGapQuestions(options: {
  uncoveredRequirements: Requirement[];
  startQuestionNumber: number;
  llm: LLMService;
}): Promise<Question[]> {
  const { uncoveredRequirements, startQuestionNumber, llm } = options;

  if (uncoveredRequirements.length === 0) {
    return [];
  }

  const trustedInstructions = `
You are a Staff Technical Interviewer tasked with closing coverage gaps for critical MUST-HAVE requirements.
The automated coverage check revealed that the following MUST-HAVE requirements currently have zero questions addressing them.

UNCOVERED MUST-HAVE REQUIREMENTS:
${uncoveredRequirements.map(r => `- [${r.id}] (${r.kind}): ${r.text}`).join('\n')}

STRICT RULES:
1. For EACH uncovered requirement above, generate exactly ONE comprehensive, high-quality interview question.
2. In 'requirement_ids', include the exact requirement ID it covers (e.g. ["${uncoveredRequirements[0].id}"]).
3. Categorize appropriately based on the requirement kind:
   - technical -> "technical" or "system-design"
   - behavioural -> "behavioural"
   - domain -> "company-fit"
4. 'difficulty' must be an integer: 1, 2, or 3.
5. Provide a category-appropriate answer outline:
   - Technical: Concept, Implementation, Trade-offs.
   - Behavioural: STAR framework (Situation, Task, Action, Result).
   - System Design: Requirements, Architecture, Data Model, Bottlenecks.

Output JSON format:
[
  {
    "requirement_ids": ["${uncoveredRequirements[0].id}"],
    "category": "technical",
    "prompt": "Targeted interview question",
    "answer_outline": "Key evaluation points",
    "difficulty": 2
  }
]
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      gap_count: uncoveredRequirements.length
    }
  });

  let rawGaps: RawGapQuestion[] = [];
  try {
    rawGaps = await llm.generateJson<RawGapQuestion[]>(
      systemPrompt,
      userPrompt,
      '[{"requirement_ids": ["string"], "category": "technical", "prompt": "string", "answer_outline": "string", "difficulty": 2}]'
    );
  } catch {
    // Fallback gap generation
    rawGaps = uncoveredRequirements.map(r => {
      const isBeh = r.kind === 'behavioural';
      return {
        requirement_ids: [r.id],
        category: isBeh ? 'behavioural' : 'technical',
        prompt: isBeh
          ? `Tell me about a time you applied ${r.text} in a challenging team environment.`
          : `Explain how you would architect and validate an enterprise implementation of ${r.text}.`,
        answer_outline: isBeh
          ? `Situation: Team background regarding ${r.text}. Task: Leadership objective. Action: Specific steps taken. Result: Measurable outcome.`
          : `Concept: Technical foundations of ${r.text}. Implementation: Code architecture. Trade-offs: Scalability vs complexity.`,
        difficulty: 2
      };
    });
  }

  let nextId = startQuestionNumber;
  const validIds = new Set(uncoveredRequirements.map(r => r.id));

  return (rawGaps || []).map((item, idx) => {
    // Guarantee requirement_id matches an uncovered requirement
    let rids = (item.requirement_ids || []).filter(id => validIds.has(id));
    if (rids.length === 0 && idx < uncoveredRequirements.length) {
      rids = [uncoveredRequirements[idx].id];
    } else if (rids.length === 0) {
      rids = [uncoveredRequirements[0].id];
    }

    const matchedReq = uncoveredRequirements.find(r => r.id === rids[0]);
    let category: QuestionCategory = 'technical';
    if (item.category && ['technical', 'behavioural', 'system-design', 'company-fit'].includes(item.category)) {
      category = item.category as QuestionCategory;
    } else if (matchedReq?.kind === 'behavioural') {
      category = 'behavioural';
    } else if (matchedReq?.kind === 'domain') {
      category = 'company-fit';
    }

    const difficulty = (item.difficulty === 1 || item.difficulty === 2 || item.difficulty === 3) 
      ? item.difficulty 
      : 2;

    const defaultOutline = category === 'behavioural'
      ? 'Situation: Context. Task: Challenge. Action: Solution implemented. Result: Impact and reflection.'
      : 'Concept: Core principle. Implementation: Architectural design. Trade-offs: Operational considerations.';

    return {
      id: `q${nextId++}`,
      requirement_ids: rids,
      category,
      prompt: item.prompt?.trim() || `Deep-dive interview question on ${rids.join(', ')}`,
      answer_outline: item.answer_outline?.trim() || defaultOutline,
      difficulty,
      metadata: {
        source: 'generated',
        isEdited: false,
        isPinned: false
      }
    };
  });
}
