import axios from 'axios';
import { URL } from 'url';

export class RobotsParser {
  private disallowedPatterns: string[] = [];

  constructor(disallowedPatterns: string[] = []) {
    this.disallowedPatterns = disallowedPatterns;
  }

  /**
   * Fetches and parses robots.txt for a given base URL.
   * Fails open gracefully if robots.txt is missing (404) or unreachable.
   */
  public static async fetch(baseUrl: string, timeoutMs: number = 3000): Promise<RobotsParser> {
    try {
      const parsed = new URL(baseUrl);
      const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

      const response = await axios.get(robotsUrl, {
        timeout: timeoutMs,
        validateStatus: status => status >= 200 && status < 400,
        headers: { 'User-Agent': 'AIInterviewPrepBot/1.0' }
      });

      const content = typeof response.data === 'string' ? response.data : '';
      return RobotsParser.parse(content);
    } catch {
      // 404, network error, or timeout: allow crawling by default
      return new RobotsParser([]);
    }
  }

  public static parse(content: string): RobotsParser {
    const lines = content.split(/\r?\n/);
    const disallowed: string[] = [];
    let isTargetAgent = false;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      const [directive, ...rest] = cleanLine.split(':');
      const val = rest.join(':').trim();

      if (directive.toLowerCase() === 'user-agent') {
        isTargetAgent = val === '*' || val.toLowerCase().includes('bot');
      } else if (isTargetAgent && directive.toLowerCase() === 'disallow') {
        if (val) {
          disallowed.push(val);
        }
      }
    }

    return new RobotsParser(disallowed);
  }

  /**
   * Checks whether a given path is permitted
   */
  public isAllowed(urlPath: string): boolean {
    if (this.disallowedPatterns.length === 0) return true;

    for (const pattern of this.disallowedPatterns) {
      if (pattern === '/') return false;
      if (urlPath.startsWith(pattern)) return false;
    }

    return true;
  }
}
