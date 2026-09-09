import { LLMService } from '../llm/llm.interface.js';
import { CrawledPage } from '../crawler/companyCrawler.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

export interface HiringProcessResearch {
  found: boolean;
  processDescription: string;
  stages: string[];
  sources: string[];
}

export async function researchHiringProcess(
  pages: CrawledPage[],
  llm: LLMService
): Promise<HiringProcessResearch> {
  const hiringPages = pages.filter(p => p.category === 'hiring' || p.category === 'culture');

  if (hiringPages.length === 0) {
    return {
      found: false,
      processDescription: 'No publicly discoverable hiring process information was found.',
      stages: [],
      sources: []
    };
  }

  const combinedContent = hiringPages
    .map(p => `[URL: ${p.url}]\nTITLE: ${p.title}\nCONTENT:\n${p.cleanText.slice(0, 3000)}`)
    .join('\n\n---\n\n');

  if (!combinedContent.trim()) {
    return {
      found: false,
      processDescription: 'No publicly discoverable hiring process information was found.',
      stages: [],
      sources: []
    };
  }

  const trustedInstructions = `
You are an expert technical recruiter analyzing an organization's hiring and interview process.
CRITICAL RULES:
1. Examine the provided careers/culture text for mention of interview rounds, take-home tasks, system design rounds, pair programming, or culture screens.
2. If the text does NOT describe specific interview steps, DO NOT fabricate them. Set found = false and processDescription = "No publicly discoverable hiring process information was found."
3. If specific steps are documented, describe them succinctly and list the stages in order.

Output JSON format:
{
  "found": boolean,
  "processDescription": "string",
  "stages": ["string"],
  "sources": ["string"]
}
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      hiring_pages_content: combinedContent
    }
  });

  try {
    const res = await llm.generateJson<HiringProcessResearch>(
      systemPrompt,
      userPrompt,
      '{"found": boolean, "processDescription": "string", "stages": ["string"], "sources": ["string"]}'
    );

    return {
      found: Boolean(res.found),
      processDescription: res.processDescription || 'No publicly discoverable hiring process information was found.',
      stages: Array.isArray(res.stages) ? res.stages : [],
      sources: Array.isArray(res.sources) ? res.sources : hiringPages.map(p => p.url)
    };
  } catch {
    return {
      found: false,
      processDescription: 'No publicly discoverable hiring process information was found.',
      stages: [],
      sources: hiringPages.map(p => p.url)
    };
  }
}
