/**
 * Trao Full-Stack Engineering Assessment - Source of Truth Kit Interfaces
 * Corresponds to Appendix A and internal state management.
 */

export type RequirementKind = 'technical' | 'behavioural' | 'domain';
export type RequirementPriority = 'must' | 'nice';
export type QuestionCategory = 'technical' | 'behavioural' | 'system-design' | 'company-fit';

export interface ItemMetadata {
  source: 'generated' | 'user';
  isEdited: boolean;
  isPinned?: boolean;
  order?: number;
}

export interface SourceInfo {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_chars: number;
  researched_at: string; // ISO 8601 string
  pages_used: string[];
}

export interface DetailedSource {
  id?: string;
  title: string;
  url: string;
  source_type: 'official' | 'community' | 'public' | 'unknown';
  retrieved_at?: string;
  relevance?: string;
}

export interface CompanyProductService {
  name: string;
  description: string;
  source?: string;
}

export interface CompanyValue {
  value: string;
  description: string;
  source?: string;
}

export interface EngineeringContext {
  themes?: string[];
  challenges?: string[];
  tech_areas?: string[];
  blog_urls?: string[];
  source?: string;
}

export interface HiringProcessContext {
  official_stages?: string[];
  public_discussions?: string[];
  interview_themes?: string[];
  evaluation_focus?: string[];
  sources?: string[];
}

export interface PreparationInsight {
  priority: number;
  category: string;
  title: string;
  recommendation: string;
  source_type: 'jd_grounded' | 'company_research' | 'public_interview';
}

export interface RoleCompanyContext {
  relevant_engineering_areas?: string[];
  why_they_matter?: string;
  distinction_notes?: string;
}

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
  research_status?: 'verified' | 'partially_researched' | 'unavailable';
  researched_at?: string;
  industry?: string;
  primary_domains?: string[];
  engineering_domains?: string[];
  business_model?: string;
  company_scale?: string;
  products_services?: CompanyProductService[];
  mission?: string;
  values?: CompanyValue[];
  engineering_context?: EngineeringContext;
  role_company_context?: RoleCompanyContext;
  engineering_challenges?: Array<{ challenge: string; details: string; source?: string }>;
  hiring_process?: HiringProcessContext;
  public_interview_research?: {
    candidate_experience_summary?: string;
    recurring_technical_areas?: string[];
    reported_question_themes?: string[];
    reported_behavioral_topics?: string[];
    sources?: string[];
  };
  what_to_prepare?: PreparationInsight[];
  detailed_sources?: DetailedSource[];
  company_questions?: Array<{
    question: string;
    connection_to_company: string;
    connection_to_role: string;
    sample_angle?: string;
  }>;
  [key: string]: any;
}

export interface Requirement {
  id: string; // Stable ID, e.g. "r1", "r2"
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
  metadata?: ItemMetadata;
  [key: string]: any;
}

export interface RoleBreakdown {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
  overview?: string;
  normalized_title?: string;
  employment_type?: string;
  work_mode?: string;
  location?: string;
  department?: string;
  job_family?: string;
  experience?: string;
  education?: string[];
  certifications?: string[];
  technical_skills?: Record<string, string[]>;
  soft_skills?: string[];
  domain_skills?: string[];
  responsibility_skill_map?: Record<string, string[]>;
  requirement_skill_map?: Record<string, string[]>;
  compensation?: string;
  benefits?: string[];
  work_authorization?: string;
  [key: string]: any;
}

export interface Question {
  id: string; // Stable ID, e.g. "q1", "q2"
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  metadata?: ItemMetadata;
  [key: string]: any;
}

export interface Flashcard {
  id: string; // Stable ID, e.g. "f1", "f2"
  front: string;
  back: string;
  requirement_ids: string[];
  metadata?: ItemMetadata;
  [key: string]: any;
}

export interface ScheduleDay {
  day: number; // 1-indexed (1, 2, ..., days_available)
  focus: string;
  question_ids: string[];
  minutes: number; // strictly integer
}

export interface Schedule {
  days_available: number;
  days: ScheduleDay[];
}

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

/**
 * EXACT Appendix A Kit Structure
 */
export interface Kit {
  source: SourceInfo;
  company_brief: CompanyBrief;
  role: RoleBreakdown;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: Schedule;
  coverage: Coverage;
}

/**
 * Strips internal metadata to yield exact Appendix A structure
 */
export function sanitizeKitForExport(kit: Kit): Kit {
  return {
    source: {
      company: kit.source.company || '',
      company_url: kit.source.company_url || '',
      role: kit.source.role || '',
      location: kit.source.location || '',
      jd_chars: kit.source.jd_chars || 0,
      researched_at: kit.source.researched_at || new Date().toISOString(),
      pages_used: kit.source.pages_used || []
    },
    company_brief: {
      summary: kit.company_brief.summary || '',
      what_they_do: kit.company_brief.what_they_do || '',
      sources: kit.company_brief.sources || [],
      ...(kit.company_brief.research_status ? { research_status: kit.company_brief.research_status } : {}),
      ...(kit.company_brief.researched_at ? { researched_at: kit.company_brief.researched_at } : {}),
      ...(kit.company_brief.industry ? { industry: kit.company_brief.industry } : {}),
      ...(kit.company_brief.primary_domains ? { primary_domains: kit.company_brief.primary_domains } : {}),
      ...(kit.company_brief.engineering_domains ? { engineering_domains: kit.company_brief.engineering_domains } : {}),
      ...(kit.company_brief.business_model ? { business_model: kit.company_brief.business_model } : {}),
      ...(kit.company_brief.company_scale ? { company_scale: kit.company_brief.company_scale } : {}),
      ...(kit.company_brief.products_services ? { products_services: kit.company_brief.products_services } : {}),
      ...(kit.company_brief.mission ? { mission: kit.company_brief.mission } : {}),
      ...(kit.company_brief.values ? { values: kit.company_brief.values } : {}),
      ...(kit.company_brief.engineering_context ? { engineering_context: kit.company_brief.engineering_context } : {}),
      ...(kit.company_brief.role_company_context ? { role_company_context: kit.company_brief.role_company_context } : {}),
      ...(kit.company_brief.engineering_challenges ? { engineering_challenges: kit.company_brief.engineering_challenges } : {}),
      ...(kit.company_brief.hiring_process ? { hiring_process: kit.company_brief.hiring_process } : {}),
      ...(kit.company_brief.public_interview_research ? { public_interview_research: kit.company_brief.public_interview_research } : {}),
      ...(kit.company_brief.what_to_prepare ? { what_to_prepare: kit.company_brief.what_to_prepare } : {}),
      ...(kit.company_brief.detailed_sources ? { detailed_sources: kit.company_brief.detailed_sources } : {}),
      ...(kit.company_brief.company_questions ? { company_questions: kit.company_brief.company_questions } : {})
    },
    role: {
      title: kit.role.title || '',
      seniority: kit.role.seniority || '',
      responsibilities: kit.role.responsibilities || [],
      requirements: (kit.role.requirements || []).map(r => ({
        id: r.id,
        text: r.text,
        kind: r.kind,
        priority: r.priority
      })),
      ...(kit.role.overview ? { overview: kit.role.overview } : {}),
      ...(kit.role.normalized_title ? { normalized_title: kit.role.normalized_title } : {}),
      ...(kit.role.employment_type ? { employment_type: kit.role.employment_type } : {}),
      ...(kit.role.work_mode ? { work_mode: kit.role.work_mode } : {}),
      ...(kit.role.location ? { location: kit.role.location } : {}),
      ...(kit.role.department ? { department: kit.role.department } : {}),
      ...(kit.role.job_family ? { job_family: kit.role.job_family } : {}),
      ...(kit.role.experience ? { experience: kit.role.experience } : {}),
      ...(kit.role.education ? { education: kit.role.education } : {}),
      ...(kit.role.certifications ? { certifications: kit.role.certifications } : {}),
      ...(kit.role.technical_skills ? { technical_skills: kit.role.technical_skills } : {}),
      ...(kit.role.soft_skills ? { soft_skills: kit.role.soft_skills } : {}),
      ...(kit.role.domain_skills ? { domain_skills: kit.role.domain_skills } : {}),
      ...(kit.role.responsibility_skill_map ? { responsibility_skill_map: kit.role.responsibility_skill_map } : {}),
      ...(kit.role.requirement_skill_map ? { requirement_skill_map: kit.role.requirement_skill_map } : {}),
      ...(kit.role.compensation ? { compensation: kit.role.compensation } : {}),
      ...(kit.role.benefits ? { benefits: kit.role.benefits } : {}),
      ...(kit.role.work_authorization ? { work_authorization: kit.role.work_authorization } : {})
    },
    questions: (kit.questions || []).map(q => ({
      id: q.id,
      requirement_ids: q.requirement_ids || [],
      category: q.category,
      prompt: q.prompt,
      answer_outline: q.answer_outline,
      difficulty: q.difficulty
    })),
    flashcards: (kit.flashcards || []).map(f => ({
      id: f.id,
      front: f.front,
      back: f.back,
      requirement_ids: f.requirement_ids || []
    })),
    schedule: {
      days_available: kit.schedule.days_available,
      days: (kit.schedule.days || []).map(d => ({
        day: d.day,
        focus: d.focus,
        question_ids: d.question_ids || [],
        minutes: Math.round(d.minutes)
      }))
    },
    coverage: {
      uncovered_requirement_ids: kit.coverage.uncovered_requirement_ids || [],
      passes: kit.coverage.passes || 1
    }
  };
}
