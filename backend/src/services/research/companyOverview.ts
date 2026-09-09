import { LLMService } from '../llm/llm.interface.js';
import { CrawledPage } from '../crawler/companyCrawler.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';
import { CompanyBrief } from '../../types/kit.js';

export async function researchCompanyOverview(
  companyUrl: string,
  pages: CrawledPage[],
  llm: LLMService
): Promise<CompanyBrief> {
  const relevantPages = pages.filter(p => p.category === 'homepage' || p.category === 'about');
  const combinedContext = relevantPages
    .map(p => `[URL: ${p.url}]\nTITLE: ${p.title}\nCONTENT:\n${p.cleanText.slice(0, 3000)}`)
    .join('\n\n---\n\n');

  // If no content could be retrieved
  if (!combinedContext.trim()) {
    return {
      summary: `Information could not be extracted from the provided company URL (${companyUrl}).`,
      what_they_do: 'No public information discovered.',
      sources: []
    };
  }

  const trustedInstructions = `
You are an expert company research analyst.
Extract a concise company overview and clear description of what this organization does, strictly based on the provided website content.
CRITICAL RULES:
1. Only state factual claims directly supported by the text.
2. Do NOT invent products, customer numbers, or achievements.
3. Keep 'summary' to 2-3 clear sentences.
4. Keep 'what_they_do' to 1-2 focused sentences defining their primary product, service, or value proposition.
5. In 'sources', include the exact URLs from the provided text that were utilized.

Output JSON format:
{
  "summary": "string",
  "what_they_do": "string",
  "sources": ["string"]
}
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      company_url: companyUrl,
      website_content: combinedContext
    }
  });

  try {
    const brief = await llm.generateJson<CompanyBrief>(
      systemPrompt,
      userPrompt,
      '{"summary": "string", "what_they_do": "string", "sources": ["string"]}',
      parsed => ({
        isValid: typeof parsed?.summary === 'string' && typeof parsed?.what_they_do === 'string',
        error: 'Invalid company brief structure'
      })
    );

    const crawledUrlSet = new Set(pages.map(p => p.url));
    const validSources = Array.isArray(brief.sources)
      ? brief.sources.filter(s => crawledUrlSet.has(s))
      : [];

    return {
      summary: brief.summary || 'Summary unavailable.',
      what_they_do: brief.what_they_do || 'Description unavailable.',
      sources: validSources.length > 0 ? validSources : (pages[0]?.url ? [pages[0].url] : [companyUrl])
    };
  } catch {
    return {
      summary: `Company overview for ${companyUrl}.`,
      what_they_do: 'Information could not be extracted from retrieved website content.',
      sources: pages[0]?.url ? [pages[0].url] : [companyUrl]
    };
  }
}
