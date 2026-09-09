import { LLMService } from '../llm/llm.interface.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

export interface PublicDiscussionResearch {
  found: boolean;
  discussionSummary: string;
  commonTopics: string[];
  sources: string[];
}

export async function researchPublicDiscussion(
  companyName: string,
  companyUrl: string,
  llm: LLMService
): Promise<PublicDiscussionResearch> {
  // If company is generic or unknown, record honestly
  if (!companyName || companyName.toLowerCase().includes('example') || companyName.toLowerCase().includes('localhost')) {
    return {
      found: false,
      discussionSummary: 'No useful public interview discussion was found.',
      commonTopics: [],
      sources: []
    };
  }

  const trustedInstructions = `
You are analyzing public developer discourse and interview experiences for '${companyName}'.
CRITICAL RULES:
1. If you have verifiable, well-known public interview knowledge regarding this company's typical engineering interview format (e.g. standard multi-round formats, emphasis on distributed systems or live coding), summarize it conservatively.
2. If the company is obscure, small, or not publicly documented, DO NOT invent interview rumors or specific question topics.
3. If no reliable public discussion is known, set found = false and discussionSummary = "No useful public interview discussion was found."

Output JSON format:
{
  "found": boolean,
  "discussionSummary": "string",
  "commonTopics": ["string"],
  "sources": ["string"]
}
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      company_name: companyName,
      company_url: companyUrl
    }
  });

  try {
    const res = await llm.generateJson<PublicDiscussionResearch>(
      systemPrompt,
      userPrompt,
      '{"found": boolean, "discussionSummary": "string", "commonTopics": ["string"], "sources": ["string"]}'
    );

    return {
      found: Boolean(res.found),
      discussionSummary: res.discussionSummary || 'No useful public interview discussion was found.',
      commonTopics: Array.isArray(res.commonTopics) ? res.commonTopics : [],
      sources: Array.isArray(res.sources) ? res.sources : []
    };
  } catch {
    return {
      found: false,
      discussionSummary: 'No useful public interview discussion was found.',
      commonTopics: [],
      sources: []
    };
  }
}
