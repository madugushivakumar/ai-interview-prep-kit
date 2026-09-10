export type RequirementKind = 'technical' | 'behavioural' | 'domain';
export type RequirementPriority = 'must' | 'nice';
export type QuestionCategory = 'technical' | 'behavioural' | 'system-design' | 'company-fit';
export type PracticeMode =
  | 'all'
  | 'quick'
  | 'technical'
  | 'behavioural'
  | 'system-design'
  | 'company-fit'
  | 'must-have'
  | 'must'
  | 'weak-areas'
  | 'weak'
  | 'unpracticed'
  | 'starred'
  | 'pinned'
  | 'flashcards';

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

export interface PracticeCard {
  flashcardId: string;
  confidenceHistory: Array<{
    rating: number;
    practicedAt: string;
  }>;
  lastRating?: number;
  lastPracticedAt?: string;
  practiceCount: number;
}

export interface PracticeAttempt {
  attemptId: string;
  itemId: string;
  itemType: 'question' | 'flashcard';
  category?: string;
  confidence: number;
  answerText?: string;
  notes?: string;
  practicedAt: string;
}

export interface ItemProgress {
  itemId: string;
  itemType: 'question' | 'flashcard';
  category?: string;
  lastRating: number;
  practiceCount: number;
  isMastered: boolean;
  lastPracticedAt: string;
  notes?: string;
  userAnswer?: string;
  isStarred?: boolean;
}

export interface PracticeState {
  cards: PracticeCard[];
  attempts?: PracticeAttempt[];
  itemProgress?: Record<string, ItemProgress>;
  totalSessions: number;
  lastPracticedAt?: string;
}

export interface PracticeProgressStats {
  totalQuestions: number;
  totalFlashcards: number;
  questionsPracticed: number;
  questionsMastered: number;
  questionsWeak: number;
  averageConfidence: number;
  mustHavePracticed: number;
  mustHaveTotal: number;
  mustHaveCoveragePercent: number;
  overallProgressPercent: number;
  categoryStats: Record<string, {
    total: number;
    practiced: number;
    mastered: number;
    weak: number;
    averageRating: number;
    progressPercent: number;
  }>;
  recentAttempts: Array<{
    attemptId: string;
    itemId: string;
    itemType: string;
    category?: string;
    prompt?: string;
    confidence: number;
    practicedAt: string;
    notes?: string;
  }>;
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
  practiceState?: PracticeState;
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
