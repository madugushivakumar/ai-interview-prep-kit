import { LLMService } from '../llm/llm.interface.js';
import { Requirement, Flashcard } from '../../types/kit.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawFlashcard {
  front: string;
  back: string;
  requirement_ids: string[];
}

export const TARGET_FLASHCARD_COUNT = 20;

export async function generateFlashcards(
  requirements: Requirement[],
  llm: LLMService,
  targetCount: number = TARGET_FLASHCARD_COUNT
): Promise<Flashcard[]> {
  if (requirements.length === 0) {
    return [];
  }

  const trustedInstructions = `
You are an expert technical study guide creator.
Create high-retention technical, architectural, and conceptual flashcards based strictly on the provided job requirements.

REQUIREMENTS:
${requirements.map(r => `- [${r.id}] ${r.text}`).join('\n')}

STRICT RULES:
1. Generate ${targetCount} unique, high-yield flashcards covering key technical topics, system design concepts, and engineering principles from the requirements.
2. Each flashcard must have a concise, question-based 'front' and an authoritative, clear, and comprehensive 'back' (key explanation, mechanism, formula, or trade-off).
3. 'requirement_ids' MUST be an array containing at least one valid ID from the list above (e.g. ["${requirements[0].id}"]).
4. Do NOT generate duplicate cards.

Output JSON format:
[
  {
    "front": "string",
    "back": "string",
    "requirement_ids": ["${requirements[0].id}"]
  }
]
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      total_requirements: requirements.length,
      target_count: targetCount
    }
  });

  let rawList: RawFlashcard[] = [];
  try {
    rawList = await llm.generateJson<RawFlashcard[]>(
      systemPrompt,
      userPrompt,
      '[{"front": "string", "back": "string", "requirement_ids": ["string"]}]'
    );
  } catch {
    rawList = [];
  }

  if (!Array.isArray(rawList)) {
    rawList = [];
  }

  // Deduplicate on normalized front text
  const seenFronts = new Set<string>();
  const validList: RawFlashcard[] = [];

  for (const card of rawList) {
    if (!card.front || !card.back) continue;
    const norm = card.front.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!norm || seenFronts.has(norm)) continue;
    seenFronts.add(norm);
    validList.push(card);
  }

  // If fewer than 15, generate diverse fallbacks from requirements
  if (validList.length < 15) {
    const needed = targetCount - validList.length;
    const fallbacks = generateFlashcardFallbacks(requirements, needed, seenFronts);
    validList.push(...fallbacks);
  }

  const validReqIds = new Set(requirements.map(r => r.id));
  let cardCount = 1;

  return validList.slice(0, 25).map(card => {
    const validRids = (card.requirement_ids || []).filter(rid => validReqIds.has(rid));
    if (validRids.length === 0 && requirements.length > 0) {
      validRids.push(requirements[0].id);
    }

    return {
      id: `f${cardCount++}`,
      front: card.front.trim(),
      back: card.back.trim(),
      requirement_ids: validRids,
      metadata: {
        source: 'generated',
        isEdited: false
      }
    };
  });
}

function generateFlashcardFallbacks(
  requirements: Requirement[],
  needed: number,
  seenFronts: Set<string>
): RawFlashcard[] {
  const fallbacks: RawFlashcard[] = [];
  const templates = [
    {
      q: (t: string) => `What are the key production failure modes and mitigations when scaling ${t}?`,
      a: () => 'Identify resource saturation (CPU/memory/network), implement circuit breakers, configure graceful fallbacks, and establish proactive alerting thresholds.'
    },
    {
      q: (t: string) => `What architectural trade-offs must be evaluated when introducing ${t} into a distributed system?`,
      a: () => 'Evaluate added operational complexity, network latency, consistency guarantees (strong vs eventual), and deployment observability.'
    },
    {
      q: (t: string) => `How do you verify data consistency and correctness in systems utilizing ${t}?`,
      a: () => 'Use atomic transactions where supported, implement idempotent consumer handlers, and maintain audit logs with reconciliation jobs.'
    },
    {
      q: (t: string) => `What are the core security best practices and attack vectors relevant to ${t}?`,
      a: () => 'Enforce principle of least privilege, sanitize all untrusted inputs, use TLS encryption in transit and at rest, and keep dependencies patched.'
    },
    {
      q: (t: string) => `How does observability and distributed tracing work in services implementing ${t}?`,
      a: () => 'Propagate W3C trace context headers across service boundaries, emit RED metrics (Rate, Errors, Duration), and centralize structured JSON logs.'
    },
    {
      q: (t: string) => `What testing strategies ensure high regression coverage for ${t}?`,
      a: () => 'Maintain testing pyramid: comprehensive unit tests for core domain logic, integration tests with containerized dependencies, and contract tests.'
    }
  ];

  let reqIdx = 0;
  let tmplIdx = 0;
  let attempts = 0;

  while (fallbacks.length < needed && attempts < 60) {
    attempts++;
    const req = requirements[reqIdx % requirements.length];
    const tmpl = templates[tmplIdx % templates.length];
    const front = tmpl.q(req.text);
    const norm = front.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    if (!seenFronts.has(norm)) {
      seenFronts.add(norm);
      fallbacks.push({
        front,
        back: tmpl.a(),
        requirement_ids: [req.id]
      });
    }

    reqIdx++;
    tmplIdx++;
  }

  return fallbacks;
}
