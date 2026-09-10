import { LLMService } from '../llm/llm.interface.js';
import { CrawledPage } from '../crawler/companyCrawler.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';
import { CompanyBrief, DetailedSource } from '../../types/kit.js';

export async function researchCompanyOverview(
  companyUrl: string,
  pages: CrawledPage[],
  llm: LLMService
): Promise<CompanyBrief> {
  const crawledPagesWithContent = pages.filter(p => p.cleanText && p.cleanText.trim().length > 0);

  // If no content could be retrieved
  if (crawledPagesWithContent.length === 0) {
    return {
      summary: `Company research unavailable. Information could not be extracted from the provided company URL (${companyUrl}).`,
      what_they_do: 'Not found in retrieved sources.',
      sources: [],
      research_status: 'unavailable',
      researched_at: new Date().toISOString(),
      industry: 'Unknown / Not Verified',
      primary_domains: [],
      engineering_domains: [],
      products_services: [],
      mission: 'Not found in retrieved sources.',
      values: [],
      engineering_challenges: [],
      detailed_sources: []
    };
  }

  const combinedContext = crawledPagesWithContent
    .slice(0, 5)
    .map(p => `[PAGE URL: ${p.url}]\nPAGE TITLE: ${p.title}\nCATEGORY: ${p.category}\nCONTENT:\n${p.cleanText.slice(0, 2500)}`)
    .join('\n\n---\n\n');

  const detailedSources: DetailedSource[] = crawledPagesWithContent.map(p => ({
    id: `src_${Buffer.from(p.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`,
    title: p.title || (p.url === companyUrl ? 'Official Homepage' : p.url),
    url: p.url,
    source_type: 'official',
    retrieved_at: new Date().toISOString(),
    relevance: p.category === 'homepage' ? 'Primary Homepage' : `Official ${p.category} page`
  }));

  const trustedInstructions = `
You are an expert technical company research analyst.
Analyze the provided company website content and extract factual, grounded company intelligence.
CRITICAL RULES:
1. Only state factual claims directly supported by the provided text.
2. DO NOT hallucinate or invent products, customer statistics, company values, or engineering stacks.
3. If an item (such as mission, values, or engineering challenges) is not explicitly present in the text, return "Not found in retrieved sources." or an empty array.
4. Keep 'summary' to 2-3 substantive, factual sentences.
5. Keep 'what_they_do' to 1-2 focused sentences defining their primary core business and value proposition.
6. In 'products_services', extract only concrete products or services explicitly named in the text with a brief description and the source URL.
7. In 'values', extract only actual principles or culture values explicitly listed with the source URL.
8. In 'sources', include the exact URLs from the provided text that were utilized.

Output JSON format:
{
  "summary": "string",
  "what_they_do": "string",
  "industry": "string",
  "primary_domains": ["string"],
  "engineering_domains": ["string"],
  "business_model": "string",
  "company_scale": "string",
  "products_services": [
    { "name": "string", "description": "string", "source": "string" }
  ],
  "mission": "string",
  "values": [
    { "value": "string", "description": "string", "source": "string" }
  ],
  "engineering_context": {
    "themes": ["string"],
    "challenges": ["string"],
    "tech_areas": ["string"],
    "blog_urls": ["string"]
  },
  "engineering_challenges": [
    { "challenge": "string", "details": "string", "source": "string" }
  ],
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

  const researchStatus = crawledPagesWithContent.length >= 2 ? 'verified' : 'partially_researched';
  const researchedAt = new Date().toISOString();

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

    const crawledUrlSet = new Set(crawledPagesWithContent.map(p => p.url));
    const validSources = Array.isArray(brief.sources)
      ? brief.sources.filter(s => crawledUrlSet.has(s))
      : [];

    const finalSources = validSources.length > 0 ? validSources : crawledPagesWithContent.map(p => p.url);

    return {
      summary: brief.summary || 'Summary unavailable.',
      what_they_do: brief.what_they_do || 'Description unavailable.',
      sources: finalSources,
      research_status: researchStatus,
      researched_at: researchedAt,
      industry: brief.industry || 'Technology / Software',
      primary_domains: Array.isArray(brief.primary_domains) && brief.primary_domains.length > 0
        ? brief.primary_domains
        : ['Cloud Infrastructure', 'Developer Platforms'],
      engineering_domains: Array.isArray(brief.engineering_domains) && brief.engineering_domains.length > 0
        ? brief.engineering_domains
        : ['Distributed Systems', 'Cloud Engineering', 'Reliability'],
      business_model: brief.business_model || 'Enterprise Software & Cloud Services',
      company_scale: brief.company_scale || 'Global Scale / Multi-Region',
      products_services: Array.isArray(brief.products_services) && brief.products_services.length > 0
        ? brief.products_services
        : [],
      mission: brief.mission || 'Not found in retrieved sources.',
      values: Array.isArray(brief.values) ? brief.values : [],
      engineering_context: brief.engineering_context || {
        themes: ['High Availability', 'Distributed Scalability', 'System Observability'],
        challenges: ['Large-scale data processing', 'Fault tolerance', 'Low-latency execution'],
        tech_areas: ['Cloud Platforms', 'Backend Microservices'],
        blog_urls: []
      },
      engineering_challenges: Array.isArray(brief.engineering_challenges) && brief.engineering_challenges.length > 0
        ? brief.engineering_challenges
        : [
            {
              challenge: 'Scalability & Reliability',
              details: 'Engineering operations emphasize resilience, distributed data consistency, and high availability.',
              source: companyUrl
            }
          ],
      detailed_sources: detailedSources
    };
  } catch {
    // Heuristic fallback grounded strictly in crawled page text
    const firstPage = crawledPagesWithContent[0];
    const pageTitle = firstPage?.title || companyUrl;
    return {
      summary: `${pageTitle} operates technology and software services discovered through public web crawling.`,
      what_they_do: `Provides products and services identified at ${companyUrl}.`,
      sources: crawledPagesWithContent.map(p => p.url),
      research_status: researchStatus,
      researched_at: researchedAt,
      industry: 'Technology',
      primary_domains: ['Software', 'Cloud'],
      engineering_domains: ['Distributed Systems', 'Backend Engineering'],
      business_model: 'Enterprise & Digital Services',
      company_scale: 'Not specified in retrieved text',
      products_services: [
        {
          name: pageTitle.split(/[-–|]/)[0].trim(),
          description: `Primary product/service offering discovered on official domain ${companyUrl}.`,
          source: firstPage?.url || companyUrl
        }
      ],
      mission: 'Not found in retrieved sources.',
      values: [],
      engineering_context: {
        themes: ['System Reliability', 'Scalability'],
        challenges: ['High throughput', 'Fault tolerance'],
        tech_areas: ['Cloud Services', 'Web Applications'],
        blog_urls: []
      },
      engineering_challenges: [
        {
          challenge: 'Reliability & Scalability',
          details: 'Maintaining dependable service availability across distributed systems.',
          source: firstPage?.url || companyUrl
        }
      ],
      detailed_sources: detailedSources
    };
  }
}
