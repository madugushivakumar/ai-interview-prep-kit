import { LLMService } from '../llm/llm.interface.js';
import { Requirement, Flashcard } from '../../types/kit.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawFlashcard {
  front: string;
  back: string;
  requirement_ids: string[];
}

export async function generateFlashcards(
  requirements: Requirement[],
  llm: LLMService
): Promise<Flashcard[]> {
  if (requirements.length === 0) {
    return [];
  }

  const trustedInstructions = `
You are an expert technical study guide creator.
Create high-retention technical and conceptual flashcards based strictly on the provided job requirements.

REQUIREMENTS:
${requirements.map(r => `- [${r.id}] ${r.text}`).join('\n')}

STRICT RULES:
1. Each flashcard must have a concise 'front' (clear question or concept prompt) and a sharp, authoritative 'back' (key explanation, principle, or formula).
2. 'requirement_ids' MUST be an array containing at least one valid ID from the list above (e.g. ["${requirements[0].id}"]).
3. Generate 1 to 2 flashcards per requirement.

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
      total_requirements: requirements.length
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
    // Fallback flashcard creation
    rawList = requirements.slice(0, 4).map(r => ({
      front: `What are the key production considerations for: ${r.text}?`,
      back: 'Focus on reliability, performance monitoring, test coverage, and scalability.',
      requirement_ids: [r.id]
    }));
  }

  const validReqIds = new Set(requirements.map(r => r.id));
  let cardCount = 1;

  return (rawList || []).map(card => {
    const validRids = (card.requirement_ids || []).filter(rid => validReqIds.has(rid));
    if (validRids.length === 0 && requirements.length > 0) {
      validRids.push(requirements[0].id);
    }

    return {
      id: `f${cardCount++}`,
      front: card.front?.trim() || 'Core interview concept',
      back: card.back?.trim() || 'Key technical concept details.',
      requirement_ids: validRids,
      metadata: {
        source: 'generated',
        isEdited: false
      }
    };
  });
}
