import { z } from 'zod';

export interface ParsedRoleItem {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

export interface MultiRoleRowError {
  row: number;
  id?: string;
  error: string;
}

export interface MultiRoleParseResult {
  success: boolean;
  roles: ParsedRoleItem[];
  errors: MultiRoleRowError[];
  totalRows: number;
  warnings: string[];
}

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const SingleRoleInputSchema = z.object({
  id: z.string().optional(),
  jd: z.string().min(10, 'Job description must be at least 10 characters'),
  company_url: z.string().url('Invalid company URL format'),
  days: z.number().int().min(1, 'Days must be at least 1').max(60, 'Days cannot exceed 60')
});

/**
 * Robust, secure multi-role file and text parser for JSON and CSV formats.
 */
export class MultiRoleParser {
  /**
   * Parses raw file content or text string into structured role items.
   */
  public static parse(
    content: string | Buffer,
    options: {
      format?: 'json' | 'csv' | 'auto';
      fileName?: string;
      maxSizeBytes?: number;
    } = {}
  ): MultiRoleParseResult {
    const maxBytes = options.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');

    // 1. Enforce size limits
    if (buffer.length > maxBytes) {
      return {
        success: false,
        roles: [],
        errors: [{ row: 0, error: `File exceeds maximum allowed size of ${Math.round(maxBytes / (1024 * 1024))}MB.` }],
        totalRows: 0,
        warnings: []
      };
    }

    const text = buffer.toString('utf-8').trim();

    // 2. Reject empty input
    if (!text) {
      return {
        success: false,
        roles: [],
        errors: [{ row: 0, error: 'File content is empty.' }],
        totalRows: 0,
        warnings: []
      };
    }

    // 3. Determine format
    let format = options.format || 'auto';
    if (format === 'auto') {
      if (options.fileName?.toLowerCase().endsWith('.csv')) {
        format = 'csv';
      } else if (options.fileName?.toLowerCase().endsWith('.json')) {
        format = 'json';
      } else if (text.startsWith('[') || text.startsWith('{')) {
        format = 'json';
      } else {
        format = 'csv';
      }
    }

    if (format === 'json') {
      return MultiRoleParser.parseJson(text);
    } else {
      return MultiRoleParser.parseCsv(text);
    }
  }

  /**
   * Safe JSON parsing for multi-role arrays
   */
  private static parseJson(text: string): MultiRoleParseResult {
    let rawJson: any;
    try {
      rawJson = JSON.parse(text);
    } catch (err: any) {
      return {
        success: false,
        roles: [],
        errors: [{ row: 0, error: `Malformed JSON: ${err.message}` }],
        totalRows: 0,
        warnings: []
      };
    }

    // Handle single object or array
    const rawList = Array.isArray(rawJson) ? rawJson : [rawJson];
    if (rawList.length === 0) {
      return {
        success: false,
        roles: [],
        errors: [{ row: 0, error: 'JSON array contains no items.' }],
        totalRows: 0,
        warnings: []
      };
    }

    return MultiRoleParser.validateRows(rawList);
  }

  /**
   * RFC 4180-compliant CSV parser handling multiline quotes, commas, and escapes
   */
  private static parseCsv(text: string): MultiRoleParseResult {
    const rawRows = MultiRoleParser.tokenizeCsv(text);
    if (rawRows.length < 2) {
      return {
        success: false,
        roles: [],
        errors: [{ row: 0, error: 'CSV must contain a header row and at least one data row.' }],
        totalRows: 0,
        warnings: []
      };
    }

    // Normalize header names
    const headers = rawRows[0].map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));
    const idIdx = headers.findIndex(h => h === 'id' || h === 'roleid');
    const jdIdx = headers.findIndex(h => h === 'jd' || h === 'jobdescription' || h === 'description');
    const urlIdx = headers.findIndex(h => h === 'companyurl' || h === 'url' || h === 'company' || h === 'website');
    const daysIdx = headers.findIndex(h => h === 'days' || h === 'daysavailable' || h === 'duration');

    if (jdIdx === -1 || urlIdx === -1) {
      return {
        success: false,
        roles: [],
        errors: [{
          row: 1,
          error: `CSV header missing required columns: must include "jd" (or "job_description") and "company_url" (or "url"). Found: [${headers.join(', ')}]`
        }],
        totalRows: 0,
        warnings: []
      };
    }

    const rowObjects: any[] = [];
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Skip empty blank rows
      if (row.length === 1 && row[0].trim() === '') continue;

      const rawDays = daysIdx !== -1 && row[daysIdx] !== undefined ? parseInt(row[daysIdx], 10) : 5;
      rowObjects.push({
        id: idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : undefined,
        jd: row[jdIdx] ? row[jdIdx].trim() : '',
        company_url: row[urlIdx] ? row[urlIdx].trim() : '',
        days: Number.isNaN(rawDays) ? 5 : rawDays
      });
    }

    return MultiRoleParser.validateRows(rowObjects);
  }

  /**
   * Tokenizes CSV content supporting multiline quotes and RFC 4180 escapes
   */
  private static tokenizeCsv(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
          i++;
          continue;
        }
      }

      if (!insideQuotes) {
        if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
          i++;
          continue;
        } else if (char === '\r' && nextChar === '\n') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          i += 2;
          continue;
        } else if (char === '\n' || char === '\r') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          i++;
          continue;
        }
      }

      currentField += char;
      i++;
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  }

  /**
   * Row-level schema validation and duplicate detection
   */
  private static validateRows(rawList: any[]): MultiRoleParseResult {
    const validRoles: ParsedRoleItem[] = [];
    const errors: MultiRoleRowError[] = [];
    const warnings: string[] = [];

    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();

    rawList.forEach((rawRow, index) => {
      const rowNum = index + 1;
      let candidateId = rawRow.id ? String(rawRow.id).trim() : `role-${rowNum}`;

      // Enforce unique ID if duplicate is provided
      if (seenIds.has(candidateId)) {
        warnings.push(`Duplicate ID "${candidateId}" at row ${rowNum}; auto-assigning unique ID.`);
        candidateId = `${candidateId}-${rowNum}`;
      }

      const rowToValidate = {
        id: candidateId,
        jd: typeof rawRow.jd === 'string' ? rawRow.jd.trim() : '',
        company_url: typeof rawRow.company_url === 'string' ? rawRow.company_url.trim() : '',
        days: typeof rawRow.days === 'number' ? rawRow.days : parseInt(String(rawRow.days || 5), 10)
      };

      const val = SingleRoleInputSchema.safeParse(rowToValidate);
      if (!val.success) {
        const msg = val.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        errors.push({
          row: rowNum,
          id: candidateId,
          error: msg
        });
        return;
      }

      // Check for exact duplicate input (same company URL and JD)
      const signature = `${val.data.company_url.toLowerCase()}:::${val.data.jd.toLowerCase()}`;
      if (seenSignatures.has(signature)) {
        warnings.push(`Row ${rowNum} is an exact duplicate of a previous role; flagged as duplicate.`);
      }
      seenSignatures.add(signature);
      seenIds.add(candidateId);

      validRoles.push({
        id: candidateId,
        jd: val.data.jd,
        company_url: val.data.company_url,
        days: val.data.days
      });
    });

    return {
      success: validRoles.length > 0,
      roles: validRoles,
      errors,
      totalRows: rawList.length,
      warnings
    };
  }
}
