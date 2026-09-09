import axios from 'axios';
import { validateAndNormalizeUrl } from './urlValidator.js';
import { RobotsParser } from './robotsParser.js';
import { extractAndRankLinks } from './linkRanker.js';
import { cleanHtml } from './htmlCleaner.js';
import { config } from '../../config/env.js';

export interface CrawledPage {
  url: string;
  title: string;
  category: 'homepage' | 'hiring' | 'about' | 'culture' | 'tech' | 'general';
  cleanText: string;
  headings: string[];
}

export interface CrawlResult {
  companyUrl: string;
  pages: CrawledPage[];
  pagesUsed: string[];
  hasHiringPage: boolean;
  hasAboutPage: boolean;
  warnings: string[];
}

/**
 * Robust, Bounded, Heuristic Company Website Crawler
 */
export class CompanyCrawler {
  private timeoutMs: number;
  private maxPages: number;
  private maxBytes: number;
  private allowLocal: boolean;

  constructor(options: {
    timeoutMs?: number;
    maxPages?: number;
    maxBytes?: number;
    allowLocal?: boolean;
  } = {}) {
    this.timeoutMs = options.timeoutMs ?? config.CRAWL_TIMEOUT_MS;
    this.maxPages = options.maxPages ?? config.MAX_CRAWL_PAGES;
    this.maxBytes = options.maxBytes ?? config.MAX_PAGE_BYTES;
    this.allowLocal = options.allowLocal ?? config.ALLOW_LOCAL_CRAWL;
  }

  /**
   * Crawls the company website with bounded retries, link ranking, and content cleaning.
   */
  public async crawl(rawUrl: string): Promise<CrawlResult> {
    const warnings: string[] = [];

    // 1. Validate & normalize target URL
    const valResult = await validateAndNormalizeUrl(rawUrl, this.allowLocal);
    if (!valResult.isValid || !valResult.normalizedUrl) {
      const err: any = new Error(valResult.error || 'Invalid company URL');
      err.code = 'INVALID_COMPANY_URL';
      throw err;
    }

    const normalizedBaseUrl = valResult.normalizedUrl;

    // 2. Fetch initial homepage with bounded retries (1s, 2s, 4s)
    let initialHtml = '';
    let lastError: any = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resp = await axios.get(normalizedBaseUrl, {
          timeout: this.timeoutMs,
          maxContentLength: this.maxBytes,
          maxRedirects: 5,
          beforeRedirect: (options: any, responseDetails: any) => {
            const target = responseDetails.headers?.location || options?.href;
            if (target) {
              try {
                const u = new URL(target, options.href || normalizedBaseUrl);
                if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                  throw new Error(`Disallowed protocol ${u.protocol}`);
                }
                if (!this.allowLocal) {
                  const h = u.hostname.toLowerCase();
                  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
                    throw new Error('Redirect to localhost blocked');
                  }
                }
              } catch (err: any) {
                throw new Error(`SSRF Redirect Blocked: ${err.message}`);
              }
            }
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AIInterviewPrepBot/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (resp.status >= 200 && resp.status < 400 && typeof resp.data === 'string') {
          initialHtml = resp.data;
          break;
        } else {
          throw new Error(`HTTP status ${resp.status}`);
        }
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt - 1) * 1000;
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    if (!initialHtml) {
      const err: any = new Error(`Company site unreachable after ${maxRetries} retries: ${lastError?.message || 'Connection failed'}`);
      err.code = 'COMPANY_UNREACHABLE';
      throw err;
    }

    // 3. Clean initial homepage
    const cleanedHome = cleanHtml(initialHtml);
    const pages: CrawledPage[] = [{
      url: normalizedBaseUrl,
      title: cleanedHome.title || 'Homepage',
      category: 'homepage',
      cleanText: cleanedHome.cleanText,
      headings: cleanedHome.headings
    }];
    const pagesUsed: string[] = [normalizedBaseUrl];

    // 4. Fetch robots.txt
    const robots = await RobotsParser.fetch(normalizedBaseUrl, 2500);

    // 5. Extract and rank internal links
    const rankedLinks = extractAndRankLinks(cleanedHome.rawHrefs, normalizedBaseUrl);

    // Filter by robots.txt
    const eligibleLinks = rankedLinks.filter(l => {
      try {
        const u = new URL(l.url);
        return robots.isAllowed(u.pathname);
      } catch {
        return false;
      }
    });

    // 6. Select top pages to fetch up to (maxPages - 1)
    const pagesToFetch = eligibleLinks.slice(0, this.maxPages - 1);

    for (const scoredLink of pagesToFetch) {
      try {
        const resp = await axios.get(scoredLink.url, {
          timeout: this.timeoutMs,
          maxContentLength: this.maxBytes,
          maxRedirects: 5,
          beforeRedirect: (options: any, responseDetails: any) => {
            const target = responseDetails.headers?.location || options?.href;
            if (target && !this.allowLocal) {
              try {
                const u = new URL(target, options.href || scoredLink.url);
                const h = u.hostname.toLowerCase();
                if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
                  throw new Error('Redirect to localhost blocked');
                }
              } catch (err: any) {
                throw new Error(`SSRF Redirect Blocked: ${err.message}`);
              }
            }
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIInterviewPrepBot/1.0'
          }
        });

        if (resp.status >= 200 && resp.status < 400 && typeof resp.data === 'string') {
          const cleaned = cleanHtml(resp.data);
          pages.push({
            url: scoredLink.url,
            title: cleaned.title || scoredLink.category,
            category: scoredLink.category,
            cleanText: cleaned.cleanText,
            headings: cleaned.headings
          });
          pagesUsed.push(scoredLink.url);
        }
      } catch (pageErr: any) {
        // Individual page failure does not abort the crawl
        warnings.push(`Could not retrieve linked page ${scoredLink.url}: ${pageErr.message}`);
      }
    }

    // 7. Assess discovered hiring & about pages
    const hasHiringPage = pages.some(p => p.category === 'hiring');
    const hasAboutPage = pages.some(p => p.category === 'about');

    if (!hasHiringPage) {
      warnings.push('No publicly discoverable hiring or careers page found on the company website.');
    }
    if (!hasAboutPage) {
      warnings.push('No dedicated about page found; utilizing homepage context.');
    }

    return {
      companyUrl: normalizedBaseUrl,
      pages,
      pagesUsed,
      hasHiringPage,
      hasAboutPage,
      warnings
    };
  }
}
