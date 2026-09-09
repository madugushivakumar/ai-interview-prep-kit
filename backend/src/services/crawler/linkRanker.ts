import { URL } from 'url';

export interface ScoredLink {
  url: string;
  score: number;
  category: 'hiring' | 'culture' | 'about' | 'tech' | 'general';
}

const HIRING_KEYWORDS = [
  'career', 'careers', 'job', 'jobs', 'hiring', 'interview', 
  'recruiting', 'recruitment', 'work-with-us', 'join-us', 'vacancies', 'positions'
];

const CULTURE_KEYWORDS = [
  'handbook', 'culture', 'engineering', 'team', 'life', 'working', 
  'people', 'inside', 'values'
];

const ABOUT_KEYWORDS = [
  'about', 'company', 'who-we-are', 'our-story', 'mission', 'overview'
];

const TECH_KEYWORDS = [
  'tech', 'technology', 'blog', 'stack', 'architecture', 'engineering-blog'
];

const EXCLUDED_EXTENSIONS = new Set([
  '.pdf', '.zip', '.tar', '.gz', '.png', '.jpg', '.jpeg', '.gif', 
  '.svg', '.ico', '.css', '.js', '.mp4', '.mov', '.avi', '.mp3'
]);

const EXCLUDED_PATHS = [
  '/login', '/signin', '/signup', '/register', '/cart', '/checkout', 
  '/terms', '/privacy', '/cookie', '/legal', '/cdn-cgi/'
];

/**
 * Extracts, normalizes, and ranks internal company links based on heuristic value.
 */
export function extractAndRankLinks(
  rawHrefs: string[],
  currentPageUrl: string
): ScoredLink[] {
  let base: URL;
  try {
    base = new URL(currentPageUrl);
  } catch {
    return [];
  }

  const seenUrls = new Set<string>();
  const scoredLinks: ScoredLink[] = [];

  for (const rawHref of rawHrefs) {
    if (!rawHref || typeof rawHref !== 'string') continue;
    const cleanHref = rawHref.trim();
    if (cleanHref.startsWith('javascript:') || cleanHref.startsWith('mailto:') || cleanHref.startsWith('tel:')) {
      continue;
    }

    let resolved: URL;
    try {
      // Handles relative links: /careers, ./about, careers.html, etc.
      resolved = new URL(cleanHref, base);
    } catch {
      continue;
    }

    // Must be same origin / domain
    if (resolved.host.toLowerCase() !== base.host.toLowerCase()) {
      continue;
    }

    // Remove hash/fragment and tracking parameters
    resolved.hash = '';
    const paramsToDelete: string[] = [];
    resolved.searchParams.forEach((_, key) => {
      if (key.startsWith('utm_') || key === 'ref' || key === 'source') {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach(k => resolved.searchParams.delete(k));

    const finalUrl = resolved.toString();
    const pathname = resolved.pathname.toLowerCase();

    // Check extension exclusion
    const dotIdx = pathname.lastIndexOf('.');
    if (dotIdx !== -1) {
      const ext = pathname.substring(dotIdx);
      if (EXCLUDED_EXTENSIONS.has(ext)) continue;
    }

    // Check path exclusion
    if (EXCLUDED_PATHS.some(p => pathname.includes(p))) continue;

    // Do not rank the exact current page URL again
    if (finalUrl === currentPageUrl || finalUrl === currentPageUrl + '/') continue;

    if (seenUrls.has(finalUrl)) continue;
    seenUrls.add(finalUrl);

    // Compute score based on keywords in pathname and full URL
    let score = 0;
    let category: ScoredLink['category'] = 'general';

    if (HIRING_KEYWORDS.some(kw => pathname.includes(kw))) {
      score += 50;
      category = 'hiring';
    } else if (CULTURE_KEYWORDS.some(kw => pathname.includes(kw))) {
      score += 35;
      category = 'culture';
    } else if (ABOUT_KEYWORDS.some(kw => pathname.includes(kw))) {
      score += 25;
      category = 'about';
    } else if (TECH_KEYWORDS.some(kw => pathname.includes(kw))) {
      score += 15;
      category = 'tech';
    }

    // Favor shallower paths slightly
    const depth = pathname.split('/').filter(Boolean).length;
    score -= depth * 2;

    if (score > 0) {
      scoredLinks.push({ url: finalUrl, score, category });
    }
  }

  // Sort descending by score
  return scoredLinks.sort((a, b) => b.score - a.score);
}
