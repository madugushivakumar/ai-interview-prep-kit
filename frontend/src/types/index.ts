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
  researched_at: string;
  pages_used: string[];
}

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
}

export interface Requirement {
  id: string;
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
  id: string;
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  metadata?: ItemMetadata;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  metadata?: ItemMetadata;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface Schedule {
  days_available: number;
  days: ScheduleDay[];
}

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

export interface Kit {
  source: SourceInfo;
  company_brief: CompanyBrief;
  role: RoleBreakdown;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: Schedule;
  coverage: Coverage;
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface GenerationState {
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStep: string;
  progress: number;
  steps: PipelineStep[];
  error?: {
    code: string;
    message: string;
  };
}

export interface KitDocument {
  _id: string;
  userId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  input: {
    jd: string;
    company_url: string;
    days: number;
  };
  kit: Kit;
  generationState: GenerationState;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface WeakSpotItem {
  requirementId: string;
  requirementText: string;
  kind: string;
  averageRating: number;
  practiceCount: number;
  status: 'critical_weak' | 'needs_review' | 'proficient';
  recommendedQuestions: Question[];
}

export interface WeakSpotsReport {
  overallProficiencyScore: number;
  totalCardsPracticed: number;
  totalUniqueCards: number;
  completionRate: number;
  weakSpots: WeakSpotItem[];
  strengths: WeakSpotItem[];
  summaryMessage: string;
}
