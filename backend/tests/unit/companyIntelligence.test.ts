import { describe, it, expect, vi } from 'vitest';
import { researchCompanyOverview } from '../../src/services/research/companyOverview.js';
import { researchHiringProcess } from '../../src/services/research/hiringProcess.js';
import { researchPublicDiscussion } from '../../src/services/research/publicDiscussion.js';
import { StatePreserver } from '../../src/services/pipeline/statePreserver.js';
import { MockLLMProvider } from '../../src/services/llm/mock.provider.js';
import { CompanyCrawler, CrawledPage } from '../../src/services/crawler/companyCrawler.js';
import { Kit } from '../../src/types/kit.js';
import { validateAndNormalizeUrl } from '../../src/services/crawler/urlValidator.js';

describe('Company Intelligence & Research Pipeline Tests', () => {
  const llm = new MockLLMProvider();

  const mockCrawledPages: CrawledPage[] = [
    {
      url: 'https://example.com',
      title: 'Acme Cloud — High-Performance Distributed Observability',
      category: 'homepage',
      cleanText: 'Acme Cloud develops distributed telemetry, logging, and metrics ingestion platforms for enterprise microservices.',
      headings: ['Observability for Enterprise Cloud', 'High-Throughput Ingestion']
    },
    {
      url: 'https://example.com/about',
      title: 'About Acme Cloud — Company and Engineering',
      category: 'about',
      cleanText: 'Founded to bring radical transparency to distributed systems. Mission: Empower engineering teams to operate resilient systems. Core Values: Customer-Obsessed Reliability, Engineering Rigor.',
      headings: ['Our Mission', 'Culture & Values']
    },
    {
      url: 'https://example.com/careers',
      title: 'Careers & Hiring Process at Acme Cloud',
      category: 'hiring',
      cleanText: 'Our engineering interview loop consists of a Recruiter Screen, Technical Architecture & System Design, Live Coding, and Engineering Leadership.',
      headings: ['How We Hire', 'Interview Process']
    }
  ];

  it('1. should extract rich, structured company brief from crawled pages', async () => {
    const brief = await researchCompanyOverview('https://example.com', mockCrawledPages, llm);

    expect(brief.summary).toBeDefined();
    expect(brief.what_they_do).toBeDefined();
    expect(brief.industry).toBeDefined();
    expect(Array.isArray(brief.primary_domains)).toBe(true);
    expect(Array.isArray(brief.engineering_domains)).toBe(true);
    expect(Array.isArray(brief.products_services)).toBe(true);
  });

  it('2, 3, 4, 11. should label official crawled sources and deduplicate sources', async () => {
    const brief = await researchCompanyOverview('https://example.com', mockCrawledPages, llm);

    expect(brief.sources.length).toBeGreaterThanOrEqual(1);
    expect(brief.detailed_sources).toBeDefined();

    const officialSources = (brief.detailed_sources || []).filter(s => s.source_type === 'official');
    expect(officialSources.length).toBeGreaterThanOrEqual(1);

    // Verify all source URLs are unique (deduplication)
    const urls = (brief.detailed_sources || []).map(s => s.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('5 & 6. should track research timestamp and research status', async () => {
    const brief = await researchCompanyOverview('https://example.com', mockCrawledPages, llm);

    expect(brief.researched_at).toBeDefined();
    expect(new Date(brief.researched_at!).toString()).not.toBe('Invalid Date');
    expect(brief.research_status).toBe('verified');
  });

  it('7. should regenerate company brief without touching questions, role, or schedule', async () => {
    // Mock crawler to avoid network dependence in unit test
    vi.spyOn(CompanyCrawler.prototype, 'crawl').mockResolvedValueOnce({
      companyUrl: 'https://example.com',
      pages: mockCrawledPages,
      pagesUsed: ['https://example.com', 'https://example.com/about'],
      hasHiringPage: true,
      hasAboutPage: true,
      warnings: []
    });

    const sampleKit: Kit = {
      source: {
        company: 'Acme Cloud',
        company_url: 'https://example.com',
        role: 'Senior Backend Engineer',
        location: 'Remote',
        jd_chars: 1000,
        researched_at: '2026-09-01T00:00:00.000Z',
        pages_used: ['https://example.com']
      },
      company_brief: {
        summary: 'Old summary',
        what_they_do: 'Old what they do',
        sources: ['https://example.com']
      },
      role: {
        title: 'Senior Backend Engineer',
        seniority: 'Senior',
        responsibilities: ['Build backend services'],
        requirements: [
          { id: 'r1', text: 'Distributed Go services', kind: 'technical', priority: 'must' }
        ]
      },
      questions: [
        {
          id: 'q1',
          requirement_ids: ['r1'],
          category: 'company-fit',
          prompt: 'Why do you want to work on distributed telemetry at Acme Cloud?',
          answer_outline: 'Explain passion for high-throughput streaming systems.',
          difficulty: 2
        }
      ],
      flashcards: [],
      schedule: {
        days_available: 1,
        days: [{ day: 1, focus: 'Day 1 Focus', question_ids: ['q1'], minutes: 60 }]
      },
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1
      }
    };

    const regenerated = await StatePreserver.regenerateCompanyBrief({
      kit: sampleKit,
      llm,
      allowLocalUrls: true
    });

    // Questions and role must be identical
    expect(regenerated.questions.length).toBe(1);
    expect(regenerated.questions[0].id).toBe('q1');
    expect(regenerated.role.title).toBe('Senior Backend Engineer');
    expect(regenerated.schedule.days.length).toBe(1);

    // Company brief is refreshed
    expect(regenerated.company_brief.summary).toBeDefined();
    expect(regenerated.source.researched_at).not.toBe('2026-09-01T00:00:00.000Z');
  });

  it('8 & 9. should handle unreachable company research gracefully without hallucinations', async () => {
    const brief = await researchCompanyOverview('https://unreachable-company-test.invalid', [], llm);

    expect(brief.research_status).toBe('unavailable');
    expect(brief.summary).toContain('Company research unavailable');
    expect(brief.what_they_do).toContain('Not found in retrieved sources');
    expect(brief.mission).toContain('Not found in retrieved sources');
    expect(brief.values).toEqual([]);
    expect(brief.products_services).toEqual([]);
  });

  it('10. should reject SSRF attempts to private networks or loopback addresses', async () => {
    const localhostResult = await validateAndNormalizeUrl('http://127.0.0.1:8080', false);
    expect(localhostResult.isValid).toBe(false);
    expect(localhostResult.error).toContain('loopback');

    const metadataResult = await validateAndNormalizeUrl('http://169.254.169.254/latest/meta-data', false);
    expect(metadataResult.isValid).toBe(false);
    expect(metadataResult.error).toContain('Private IP');

    const privateClassAResult = await validateAndNormalizeUrl('http://10.0.0.1/admin', false);
    expect(privateClassAResult.isValid).toBe(false);
    expect(privateClassAResult.error).toContain('Private IP');
  });

  it('12. should research hiring process and public discussions with attribution', async () => {
    const hiring = await researchHiringProcess(mockCrawledPages, llm);
    expect(hiring.found).toBe(true);
    expect(hiring.stages.length).toBeGreaterThan(0);
    expect(hiring.sources.length).toBeGreaterThan(0);

    const publicDiscussions = await researchPublicDiscussion('Acme Cloud', 'https://example.com', llm);
    expect(publicDiscussions.found).toBe(true);
    expect(publicDiscussions.commonTopics.length).toBeGreaterThan(0);
  });
});
