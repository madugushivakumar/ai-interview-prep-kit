import { LLMService } from '../llm/llm.interface.js';
import { Requirement, RequirementKind, RequirementPriority } from '../../types/kit.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawExtractedRequirement {
  text: string;
  kind: string;
  priority: string;
}

/**
 * Requirement Extraction Service
 *
 * Implements Section 8 & Section 9 of the Trao Assessment specification:
 * - Strictly extracts requirements from the JD text alone.
 * - Does NOT hallucinate or invent unstated technologies.
 * - Distinguishes must-have vs nice-to-have / bonus.
 * - Assigns deterministic stable IDs (r1, r2, ...).
 */
export async function extractRequirements(
  jd: string,
  llm: LLMService
): Promise<Requirement[]> {
  const cleanJd = (jd || '').trim();

  if (!cleanJd) {
    return [
      {
        id: 'r1',
        text: 'General software development capabilities (No detailed JD provided)',
        kind: 'technical',
        priority: 'must'
      }
    ];
  }

  const trustedInstructions = `
You are a rigorous technical job description parser.
Your task is to extract requirements explicitly stated in the provided Job Description (JD).

STRICT RULES:
1. DO NOT INVENT OR ASSUME REQUIREMENTS. If the posting mentions React, extract React. Do NOT add Redux, Next.js, or TypeScript unless explicitly written in the text.
2. For thin job descriptions (e.g. 1-2 sentences), extract ONLY the few stated requirements. Do NOT extrapolate.
3. Classify each requirement into exactly one 'kind':
   - "technical": Specific programming languages, frameworks, databases, architectures, technical protocols.
   - "behavioural": Mentoring, cross-functional collaboration, team communication, conflict resolution, leadership.
   - "domain": Industry-specific domain knowledge (e.g. FinTech, HIPAA compliance, e-commerce, cybersecurity).
4. Classify each requirement into exactly one 'priority':
   - "must": If phrased as required, must have, essential, minimum, 5+ years, or listed under core requirements.
   - "nice": If phrased as nice to have, bonus, preferred, plus, desirable, or optional.

Output JSON format:
[
  {
    "text": "Exact or closely phrased requirement statement",
    "kind": "technical | behavioural | domain",
    "priority": "must | nice"
  }
]
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      job_description: cleanJd
    }
  });

  let rawList: RawExtractedRequirement[] = [];

  try {
    rawList = await llm.generateJson<RawExtractedRequirement[]>(
      systemPrompt,
      userPrompt,
      '[{"text": "string", "kind": "technical | behavioural | domain", "priority": "must | nice"}]',
      parsed => ({
        isValid: Array.isArray(parsed),
        error: 'Expected an array of requirement objects'
      })
    );
  } catch {
    // Fallback heuristic extraction if LLM fails
    rawList = heuristicExtract(cleanJd);
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    rawList = heuristicExtract(cleanJd);
  }

  // Post-process with deterministic code:
  // 1. Assign sequential stable IDs: r1, r2, r3, ...
  // 2. Validate and clamp kind and priority
  return rawList.map((item, index) => {
    let kind: RequirementKind = 'technical';
    const k = (item.kind || '').toLowerCase();
    if (k === 'behavioural' || k === 'behavioral') kind = 'behavioural';
    else if (k === 'domain') kind = 'domain';

    let priority: RequirementPriority = 'must';
    const p = (item.priority || '').toLowerCase();
    if (p === 'nice' || p === 'bonus' || p === 'preferred' || p === 'plus' || p === 'optional') {
      priority = 'nice';
    }

    return {
      id: `r${index + 1}`,
      text: item.text?.trim() || `Requirement ${index + 1}`,
      kind,
      priority,
      metadata: {
        source: 'generated',
        isEdited: false
      }
    };
  });
}

/**
 * Deterministic fallback extractor for thin or unparsed JDs
 */
function heuristicExtract(jd: string): RawExtractedRequirement[] {
  const lines = jd
    .split(/\r?\n/)
    .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(l => l.length > 5 && !l.toLowerCase().includes('about us') && !l.toLowerCase().includes('responsibilities'));

  if (lines.length === 0) {
    return [
      {
        text: jd.slice(0, 150) || 'General engineering responsibilities',
        kind: 'technical',
        priority: 'must'
      }
    ];
  }

  return lines.slice(0, 8).map(line => {
    const isNice = /bonus|nice|plus|prefer|optional/i.test(line);
    const isBehavioural = /mentor|lead|collaborat|team|culture|manage|communicat/i.test(line);
    return {
      text: line,
      kind: isBehavioural ? 'behavioural' : 'technical',
      priority: isNice ? 'nice' : 'must'
    };
  });
}
