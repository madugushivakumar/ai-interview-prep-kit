import { describe, it, expect } from 'vitest';
import { StatePreserver } from '../../src/services/pipeline/statePreserver.js';
import { Kit, Question } from '../../src/types/kit.js';
import { MockLLMProvider } from '../../src/services/llm/mock.provider.js';

describe('State Preservation & Regeneration (StatePreserver)', () => {
  const mockKit: Kit = {
    source: {
      company: 'Acme',
      company_url: 'https://example.com',
      role: 'Engineer',
      location: 'Remote',
      jd_chars: 500,
      researched_at: '2026-09-01T00:00:00Z',
      pages_used: ['https://example.com']
    },
    company_brief: {
      summary: 'Old summary',
      what_they_do: 'Old what they do',
      sources: ['https://example.com']
    },
    role: {
      title: 'Engineer',
      seniority: 'Mid',
      responsibilities: ['Build stuff'],
      requirements: [
        { id: 'r1', text: 'React', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Mentoring', kind: 'behavioural', priority: 'must' }
      ]
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Untouched generated question',
        answer_outline: 'Outline 1',
        difficulty: 2,
        metadata: { source: 'generated', isEdited: false, isPinned: false }
      },
      {
        id: 'q2',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'User edited technical question',
        answer_outline: 'Outline 2',
        difficulty: 3,
        metadata: { source: 'generated', isEdited: true, isPinned: false }
      },
      {
        id: 'q3',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Pinned technical question',
        answer_outline: 'Outline 3',
        difficulty: 2,
        metadata: { source: 'generated', isEdited: false, isPinned: true }
      },
      {
        id: 'q4',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Custom user-created question',
        answer_outline: 'Outline 4',
        difficulty: 1,
        metadata: { source: 'user', isEdited: false, isPinned: false }
      },
      {
        id: 'q5',
        requirement_ids: ['r2'],
        category: 'behavioural',
        prompt: 'Untouched behavioural question',
        answer_outline: 'Outline 5',
        difficulty: 2,
        metadata: { source: 'generated', isEdited: false, isPinned: false }
      }
    ],
    flashcards: [],
    schedule: {
      days_available: 3,
      days: [
        { day: 1, focus: 'Focus 1', question_ids: ['q1', 'q2'], minutes: 60 },
        { day: 2, focus: 'Focus 2', question_ids: ['q3'], minutes: 45 },
        { day: 3, focus: 'Focus 3', question_ids: ['q4', 'q5'], minutes: 45 }
      ]
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1
    }
  };

  it('should preserve edited, pinned, and user-created questions when regenerating technical category', async () => {
    const mockLlm = new MockLLMProvider();

    const updatedKit = await StatePreserver.regenerateCategory({
      kit: mockKit,
      category: 'technical',
      llm: mockLlm
    });

    const questionIds = updatedKit.questions.map(q => q.id);

    // Q2 (edited), Q3 (pinned), and Q4 (user-created) MUST SURVIVE
    expect(questionIds).toContain('q2');
    expect(questionIds).toContain('q3');
    expect(questionIds).toContain('q4');

    // Q5 (behavioural) MUST SURVIVE intact
    expect(questionIds).toContain('q5');

    // Q1 (untouched generated) SHOULD BE REPLACED
    expect(questionIds).not.toContain('q1');

    // Check prompts of preserved questions
    const q2 = updatedKit.questions.find(q => q.id === 'q2');
    expect(q2?.prompt).toBe('User edited technical question');

    const q3 = updatedKit.questions.find(q => q.id === 'q3');
    expect(q3?.prompt).toBe('Pinned technical question');

    const q4 = updatedKit.questions.find(q => q.id === 'q4');
    expect(q4?.prompt).toBe('Custom user-created question');
  });

  it('should regenerate schedule while keeping questions and requirements completely untouched', () => {
    const updatedKit = StatePreserver.regenerateSchedule(mockKit, 5);

    expect(updatedKit.schedule.days_available).toBe(5);
    expect(updatedKit.schedule.days).toHaveLength(5);
    expect(updatedKit.questions).toEqual(mockKit.questions);
    expect(updatedKit.role.requirements).toEqual(mockKit.role.requirements);
  });
});
