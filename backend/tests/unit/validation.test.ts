import { describe, it, expect } from 'vitest';
import { KitSchema } from '../../src/schemas/kit.schema.js';
import { Kit } from '../../src/types/kit.js';

describe('Appendix A Kit Schema Validation (KitSchema)', () => {
  const validKit: Kit = {
    source: {
      company: 'Acme Corp',
      company_url: 'https://example.com',
      role: 'Staff Platform Engineer',
      location: 'San Francisco, CA / Remote',
      jd_chars: 1420,
      researched_at: '2026-09-01T09:12:44Z',
      pages_used: ['https://example.com/careers', 'https://example.com/about']
    },
    company_brief: {
      summary: 'Acme builds distributed telemetry infra.',
      what_they_do: 'Real-time observability platform.',
      sources: ['https://example.com/about']
    },
    role: {
      title: 'Staff Platform Engineer',
      seniority: 'Staff',
      responsibilities: ['Architect Kubernetes clusters', 'Mentor senior engineers'],
      requirements: [
        { id: 'r1', text: '5+ years with Kubernetes', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Go microservices', kind: 'technical', priority: 'must' },
        { id: 'r3', text: 'Cross-functional leadership', kind: 'behavioural', priority: 'nice' }
      ]
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'How do you tune the Kubernetes scheduler for high pod density?',
        answer_outline: 'Discuss scheduler plugins, node affinities, and pod priority classes.',
        difficulty: 3
      },
      {
        id: 'q2',
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'Explain memory management and garbage collection tuning in Go.',
        answer_outline: 'Discuss GOGC, memory limits, and pprof profiling.',
        difficulty: 2
      }
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What is GOMEMLIMIT in Go?',
        back: 'A soft memory limit introduced in Go 1.19 to prevent OOM kills in containers.',
        requirement_ids: ['r2']
      }
    ],
    schedule: {
      days_available: 2,
      days: [
        { day: 1, focus: 'Kubernetes Deep Dive', question_ids: ['q1'], minutes: 60 },
        { day: 2, focus: 'Go Performance & Memory', question_ids: ['q2'], minutes: 45 }
      ]
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 2
    }
  };

  it('should accept a completely valid Kit matching Appendix A', () => {
    const parseResult = KitSchema.safeParse(validKit);
    expect(parseResult.success).toBe(true);
  });

  it('should reject a kit where days_available does not match schedule.days length', () => {
    const invalidKit = {
      ...validKit,
      schedule: {
        days_available: 3, // Mismatch! length is 2
        days: validKit.schedule.days
      }
    };

    const parseResult = KitSchema.safeParse(invalidKit);
    expect(parseResult.success).toBe(false);
  });

  it('should reject a question referencing a non-existent requirement ID', () => {
    const invalidKit = {
      ...validKit,
      questions: [
        {
          id: 'q1',
          requirement_ids: ['r999'], // Non-existent!
          category: 'technical' as const,
          prompt: 'Test prompt',
          answer_outline: 'Test answer',
          difficulty: 2 as const
        }
      ]
    };

    const parseResult = KitSchema.safeParse(invalidKit);
    expect(parseResult.success).toBe(false);
  });

  it('should reject a schedule referencing a non-existent question ID', () => {
    const invalidKit = {
      ...validKit,
      schedule: {
        days_available: 1,
        days: [
          { day: 1, focus: 'Day 1', question_ids: ['q999'], minutes: 60 } // q999 does not exist!
        ]
      }
    };

    const parseResult = KitSchema.safeParse(invalidKit);
    expect(parseResult.success).toBe(false);
  });

  it('should reject non-integer minutes in the schedule', () => {
    const invalidKit = {
      ...validKit,
      schedule: {
        days_available: 1,
        days: [
          { day: 1, focus: 'Day 1', question_ids: ['q1'], minutes: 45.5 } // Float!
        ]
      }
    };

    const parseResult = KitSchema.safeParse(invalidKit);
    expect(parseResult.success).toBe(false);
  });

  it('should reject invalid difficulty values outside 1, 2, or 3', () => {
    const invalidKit = {
      ...validKit,
      questions: [
        {
          id: 'q1',
          requirement_ids: ['r1'],
          category: 'technical' as const,
          prompt: 'P',
          answer_outline: 'A',
          difficulty: 4 as any // Invalid!
        }
      ]
    };

    const parseResult = KitSchema.safeParse(invalidKit);
    expect(parseResult.success).toBe(false);
  });
});
