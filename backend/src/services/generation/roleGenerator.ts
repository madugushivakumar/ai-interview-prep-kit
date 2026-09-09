import { LLMService } from '../llm/llm.interface.js';
import { Requirement, RoleBreakdown } from '../../types/kit.js';
import { buildSafePrompt } from '../llm/promptSanitizer.js';

interface RawRoleInfo {
  title: string;
  seniority: string;
  responsibilities: string[];
}

export async function generateRoleBreakdown(
  jd: string,
  requirements: Requirement[],
  companyName: string,
  llm: LLMService
): Promise<RoleBreakdown> {
  const trustedInstructions = `
You are an executive tech recruiter.
Analyze the job description and extract:
1. "title": Exact job title (e.g. "Senior Backend Engineer", "Staff Frontend Architect").
2. "seniority": Seniority level (e.g. "Junior", "Mid-Level", "Senior", "Staff", "Principal", "Lead").
3. "responsibilities": 3-5 core day-to-day responsibilities mentioned or directly implied in the JD.

Output JSON format:
{
  "title": "string",
  "seniority": "string",
  "responsibilities": ["string"]
}
`;

  const { systemPrompt, userPrompt } = buildSafePrompt({
    trustedInstructions,
    untrustedData: {
      company_name: companyName,
      job_description: jd
    }
  });

  let rawRole: RawRoleInfo;
  try {
    rawRole = await llm.generateJson<RawRoleInfo>(
      systemPrompt,
      userPrompt,
      '{"title": "string", "seniority": "string", "responsibilities": ["string"]}'
    );
  } catch {
    // Fallback extraction
    const firstLine = jd.split('\n')[0]?.trim() || 'Software Engineer';
    rawRole = {
      title: firstLine.slice(0, 60),
      seniority: /senior|lead|principal|staff/i.test(firstLine) ? 'Senior' : 'Mid-Level',
      responsibilities: ['Build and maintain high quality software systems.']
    };
  }

  return {
    title: rawRole.title || 'Software Engineer',
    seniority: rawRole.seniority || 'Mid-Level',
    responsibilities: Array.isArray(rawRole.responsibilities) && rawRole.responsibilities.length > 0 
      ? rawRole.responsibilities 
      : ['Deliver software solutions aligned with business goals.'],
    requirements
  };
}
