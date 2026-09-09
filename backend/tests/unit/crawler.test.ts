import { describe, it, expect } from 'vitest';
import { validateAndNormalizeUrl, isPrivateIp } from '../../src/services/crawler/urlValidator.js';
import { extractAndRankLinks } from '../../src/services/crawler/linkRanker.js';
import { cleanHtml } from '../../src/services/crawler/htmlCleaner.js';
import { RobotsParser } from '../../src/services/crawler/robotsParser.js';

describe('Crawler Security & Processing Services', () => {
  describe('URL Validator (validateAndNormalizeUrl)', () => {
    it('should normalize and accept a valid HTTPS URL', async () => {
      const res = await validateAndNormalizeUrl('example.com/about');
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe('https://example.com/about');
    });

    it('should reject dangerous or invalid schemes', async () => {
      const res1 = await validateAndNormalizeUrl('javascript:alert(1)');
      expect(res1.isValid).toBe(false);

      const res2 = await validateAndNormalizeUrl('file:///etc/passwd');
      expect(res2.isValid).toBe(false);

      const res3 = await validateAndNormalizeUrl('ftp://ftp.example.com');
      expect(res3.isValid).toBe(false);
    });

    it('should allow localhost only when allowLocal is true', async () => {
      const resAllowed = await validateAndNormalizeUrl('http://localhost:8099/acme/', true);
      expect(resAllowed.isValid).toBe(true);
      expect(resAllowed.normalizedUrl).toBe('http://localhost:8099/acme/');

      const resDisallowed = await validateAndNormalizeUrl('http://localhost:8099/acme/', false);
      expect(resDisallowed.isValid).toBe(false);
      expect(resDisallowed.error).toContain('Localhost');
    });

    it('should correctly identify private IP ranges', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.1.5')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('192.168.1.100')).toBe(true);
      expect(isPrivateIp('169.254.169.254')).toBe(true); // AWS metadata IP
      expect(isPrivateIp('93.184.216.34')).toBe(false); // example.com public IP
    });
  });

  describe('Link Ranker (extractAndRankLinks)', () => {
    const baseUrl = 'http://localhost:8099/acme/';
    const rawHrefs = [
      '/acme/careers',
      'engineering/handbook',
      '/acme/about',
      '/login',
      'https://twitter.com/acme',
      'annual_report.pdf',
      '/acme/careers?utm_source=linkedin#openings'
    ];

    it('should rank hiring and culture links higher than general links and strip tracking params', () => {
      const ranked = extractAndRankLinks(rawHrefs, baseUrl);

      expect(ranked.length).toBeGreaterThan(0);
      // /acme/careers should be the top ranked link
      expect(ranked[0].category).toBe('hiring');
      expect(ranked[0].url).toBe('http://localhost:8099/acme/careers');

      // Twitter link should be excluded (external domain)
      expect(ranked.some(l => l.url.includes('twitter.com'))).toBe(false);

      // .pdf should be excluded
      expect(ranked.some(l => l.url.includes('annual_report.pdf'))).toBe(false);

      // /login should be excluded
      expect(ranked.some(l => l.url.includes('/login'))).toBe(false);
    });

    it('should correctly resolve relative URLs without leading slash', () => {
      const ranked = extractAndRankLinks(['engineering/handbook'], baseUrl);
      expect(ranked[0].url).toBe('http://localhost:8099/acme/engineering/handbook');
    });
  });

  describe('HTML Cleaner (cleanHtml)', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Acme Engineering - Careers</title>
          <script>console.log("evil code");</script>
          <style>body { color: red; }</style>
        </head>
        <body>
          <nav><a href="/home">Home</a></nav>
          <main>
            <h1>Join Acme Engineering</h1>
            <h2>Our Hiring Philosophy</h2>
            <p>We build mission-critical distributed telemetry systems.</p>
            <p>Our interview consists of a technical conversation and a system design review.</p>
          </main>
          <footer>Copyright 2026</footer>
        </body>
      </html>
    `;

    it('should strip scripts, styles, nav, and footers while extracting clean content', () => {
      const cleaned = cleanHtml(sampleHtml);

      expect(cleaned.title).toBe('Acme Engineering - Careers');
      expect(cleaned.headings).toContain('Join Acme Engineering');
      expect(cleaned.headings).toContain('Our Hiring Philosophy');
      expect(cleaned.cleanText).toContain('We build mission-critical distributed telemetry systems.');
      expect(cleaned.cleanText).not.toContain('console.log');
      expect(cleaned.cleanText).not.toContain('Copyright 2026');
    });
  });

  describe('Robots Parser (RobotsParser)', () => {
    const robotsTxtContent = `
      User-agent: *
      Disallow: /admin
      Disallow: /private/
      Disallow: /internal
    `;

    it('should correctly evaluate allowed and disallowed paths', () => {
      const parser = RobotsParser.parse(robotsTxtContent);

      expect(parser.isAllowed('/careers')).toBe(true);
      expect(parser.isAllowed('/about')).toBe(true);
      expect(parser.isAllowed('/admin')).toBe(false);
      expect(parser.isAllowed('/private/docs')).toBe(false);
    });
  });
});
