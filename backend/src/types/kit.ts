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

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
}

export interface Requirement {
  id: string; // Stable ID, e.g. "r1", "r2"
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
  metadata?: ItemMetadata;
}

export interface RoleBreakdown {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
}

export interface Question {
  id: string; // Stable ID, e.g. "q1", "q2"
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  metadata?: ItemMetadata;
}

export interface Flashcard {
  id: string; // Stable ID, e.g. "f1", "f2"
  front: string;
  back: string;
  requirement_ids: string[];
  metadata?: ItemMetadata;
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
      sources: kit.company_brief.sources || []
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
      }))
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
