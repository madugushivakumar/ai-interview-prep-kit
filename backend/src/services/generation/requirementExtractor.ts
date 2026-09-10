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
Your task is to extract ALL requirements explicitly stated in the provided Job Description (JD).

STRICT RULES:
1. DO NOT INVENT OR ASSUME REQUIREMENTS. If the posting mentions React, extract React. Do NOT add Redux, Next.js, or TypeScript unless explicitly written in the text.
2. EXTRACT EVERY MEANINGFUL REQUIREMENT. Do not stop at 1 or 3. Extract all must-have and nice-to-have requirements stated in the JD.
3. For thin job descriptions (e.g. 1-2 sentences), extract ONLY the stated requirements. Do NOT extrapolate.
4. Classify each requirement into exactly one 'kind':
   - "technical": Specific programming languages, frameworks, databases, architectures, technical protocols, tools.
   - "behavioural": Mentoring, cross-functional collaboration, team communication, conflict resolution, leadership, code reviews.
   - "domain": Industry-specific domain knowledge (e.g. FinTech, HIPAA compliance, e-commerce, telemetry, high-throughput systems).
5. Classify each requirement into exactly one 'priority':
   - "must": If phrased as required, must have, essential, minimum, 5+ years, or listed under core requirements/minimum qualifications.
   - "nice": If phrased as nice to have, bonus, preferred, plus, desirable, optional, or listed under preferred qualifications.

Output JSON format:
[
  {
    "text": "Exact or closely phrased requirement statement from JD",
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
        isValid: Array.isArray(parsed) && parsed.length > 0,
        error: 'Expected a non-empty array of requirement objects'
      })
    );
  } catch {
    // Fallback heuristic extraction if LLM fails
    rawList = heuristicExtract(cleanJd);
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    rawList = heuristicExtract(cleanJd);
  }

  // Deduplicate semantically identical requirements
  const seenTexts = new Set<string>();
  const deduplicatedList: RawExtractedRequirement[] = [];

  for (const item of rawList) {
    const norm = (item.text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!norm || norm.length < 5) continue;
    if (!seenTexts.has(norm)) {
      seenTexts.add(norm);
      deduplicatedList.push(item);
    }
  }

  const finalList = deduplicatedList.length > 0 ? deduplicatedList : rawList;

  // Post-process with deterministic code:
  // 1. Assign sequential stable IDs: r1, r2, r3, ...
  // 2. Validate and clamp kind and priority
  return finalList.map((item, index) => {
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
 * Deterministic fallback extractor with section and bullet awareness
 */
export function heuristicExtract(jd: string): RawExtractedRequirement[] {
  const lines = jd
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let inMustSection = false;
  let inNiceSection = false;
  const rawRequirements: RawExtractedRequirement[] = [];

  for (const line of lines) {
    const lLower = line.toLowerCase();

    // Detect section headers
    if (lLower.includes('nice to have') || lLower.includes('preferred qualification') || lLower.includes('bonus') || lLower.includes('pluses')) {
      inNiceSection = true;
      inMustSection = false;
      continue;
    }
    if (lLower.includes('must have') || lLower.includes('minimum qualification') || lLower.includes('basic qualification') || lLower.includes('required qualification') || (lLower.includes('requirement') && !lLower.includes('education requirements not'))) {
      inMustSection = true;
      inNiceSection = false;
      continue;
    }
    if (lLower.includes('about us') || lLower.includes('company overview') || lLower.includes('responsibilities') || lLower.includes('what you\'ll do')) {
      inMustSection = false;
      inNiceSection = false;
      continue;
    }

    const isBullet = /^[-*•\d.]+\s+/.test(line);
    const cleanLine = line.replace(/^[-*•\d.]+\s*/, '').trim();

    if (cleanLine.length < 10) continue;

    // Check if line is within a section or has explicit indicators
    if (inMustSection || inNiceSection || isBullet) {
      const isNice = inNiceSection || /\b(?:bonus|nice to have|plus|preferred|desirable|optional)\b/i.test(cleanLine);
      const isBehavioural = /\b(?:mentor|lead|leadership|collaborat|team|culture|manage|communicat|ownership|feedback)\b/i.test(cleanLine);
      const isDomain = /\b(?:fintech|financial technology|e-?commerce|telemetry|observability|compliance|hipaa|high-?reliability|high-?throughput|payments?)\b/i.test(cleanLine);

      // Filter out pure boilerplate
      if (/equal opportunity|affirmative action|benefits include|compensation range/i.test(cleanLine)) {
        continue;
      }

      // If we are outside designated sections, ensure line resembles an engineering requirement
      if (!inMustSection && !inNiceSection) {
        const hasTech = /\b(?:experience|proficien|knowledge|degree|years?|react|node|go|golang|python|java|sql|mongo|docker|kubernetes|aws|cloud|api|database|distributed)\b/i.test(cleanLine);
        if (!hasTech && !isBehavioural && !isDomain) {
          continue;
        }
      }

      rawRequirements.push({
        text: cleanLine,
        kind: isBehavioural ? 'behavioural' : (isDomain ? 'domain' : 'technical'),
        priority: isNice ? 'nice' : 'must'
      });
    }
  }

  // Fallback if section-based extraction found nothing
  if (rawRequirements.length === 0) {
    const candidateLines = lines
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(l => l.length > 15 && !l.toLowerCase().includes('about us') && !l.toLowerCase().includes('responsibilit'));

    if (candidateLines.length === 0) {
      return [
        {
          text: jd.slice(0, 150) || 'General software engineering capabilities',
          kind: 'technical',
          priority: 'must'
        }
      ];
    }

    return candidateLines.map(line => {
      const isNice = /\b(?:bonus|nice|plus|prefer|optional)\b/i.test(line);
      const isBehavioural = /\b(?:mentor|lead|collaborat|team|culture|manage|communicat)\b/i.test(line);
      const isDomain = /\b(?:fintech|e-?commerce|telemetry|observability|payments)\b/i.test(line);
      return {
        text: line,
        kind: isBehavioural ? 'behavioural' : (isDomain ? 'domain' : 'technical'),
        priority: isNice ? 'nice' : 'must'
      };
    });
  }

  return rawRequirements;
}
