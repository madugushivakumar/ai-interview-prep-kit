import { Kit } from './kit.js';

export interface PipelineInput {
  jd: string;
  company_url: string;
  days: number;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineStep {
  name: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface GenerationState {
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStep: string;
  progress: number; // 0 to 100
  steps: PipelineStep[];
  error?: {
    code: string;
    message: string;
  };
}

export interface PipelineOptions {
  onProgress?: (stepName: string, progress: number, details?: string) => Promise<void> | void;
  allowLocalUrls?: boolean;
  maxCoveragePasses?: number;
  existingKit?: Kit; // For section regeneration
}
