import * as cheerio from 'cheerio';

export interface CleanedPage {
  title: string;
  description: string;
  headings: string[];
  cleanText: string;
  rawHrefs: string[];
}

/**
 * Cleans raw HTML into normalized, readable content and extracts structured metadata.
 */
export function cleanHtml(htmlContent: string, maxChars: number = 10000): CleanedPage {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return { title: '', description: '', headings: [], cleanText: '', rawHrefs: [] };
  }

  const $ = cheerio.load(htmlContent);

  // Extract raw links before stripping elements
  const rawHrefs: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) rawHrefs.push(href);
  });

  // Extract title and meta description
  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || '';
  const description = $('meta[name="description"]').attr('content')?.trim() || 
                      $('meta[property="og:description"]').attr('content')?.trim() || '';

  // Extract key headings for topic context
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && text.length > 2 && text.length < 150) {
      headings.push(text);
    }
  });

  // Remove boilerplate, interactive elements, styling, scripts, and navigation
  $(
    'script, style, svg, nav, footer, header, noscript, iframe, ' +
    '.cookie-banner, #cookie-banner, .cookie-notice, #cookie-consent, ' +
    '.nav, .navbar, .menu, .sidebar, .ad, .advertisement'
  ).remove();

  // Extract readable text from main semantic containers if available
  let bodyText = '';
  const mainContainer = $('main, article, #content, .content, #root, body');
  if (mainContainer.length > 0) {
    bodyText = mainContainer.first().text();
  } else {
    bodyText = $.text();
  }

  // Normalize whitespace: collapse multiple spaces and empty lines
  const cleanText = bodyText
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n')
    .slice(0, maxChars);

  return {
    title,
    description,
    headings: headings.slice(0, 20),
    cleanText,
    rawHrefs
  };
}
