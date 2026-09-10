import { describe, it, expect } from 'vitest';
import { StatePreserver } from '../../src/services/pipeline/statePreserver.js';
import { Kit, Question } from '../../src/types/kit.js';
import { MockLLMProvider } from '../../src/services/llm/mock.provider.js';

describe('Targeted Regeneration & State Preservation Tests', () => {
  const sampleKit: Kit = {
    source: {
      company: 'Acme Cloud',
      company_url: 'https://example.com',
      role: 'Senior Full-Stack Engineer',
      location: 'Remote',
      jd_chars: 800,
      researched_at: '2026-09-01T00:00:00Z',
      pages_used: ['https://example.com']
    },
    company_brief: {
      summary: 'Enterprise cloud distributed monitoring company.',
      what_they_do: 'Develops distributed telemetry platforms.',
      sources: ['https://example.com']
    },
    role: {
      title: 'Senior Full-Stack Engineer',
      seniority: 'Senior',
      responsibilities: ['Build distributed services'],
      requirements: [
        { id: 'r1', text: 'React & TypeScript', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Node.js & Express', kind: 'technical', priority: 'must' },
        { id: 'r3', text: 'MongoDB Schema Optimization', kind: 'technical', priority: 'must' },
        { id: 'r4', text: 'Mentoring Junior Engineers', kind: 'behavioural', priority: 'must' }
      ]
    },
    questions: [
      // Technical
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Untouched tech Q1', answer_outline: 'Out 1', difficulty: 2, metadata: { source: 'generated', isEdited: false, isPinned: false } },
      { id: 'q2', requirement_ids: ['r1'], category: 'technical', prompt: 'User edited tech question', answer_outline: 'Out 2', difficulty: 3, metadata: { source: 'generated', isEdited: true, isPinned: false } },
      { id: 'q3', requirement_ids: ['r2'], category: 'technical', prompt: 'Pinned tech question', answer_outline: 'Out 3', difficulty: 2, metadata: { source: 'generated', isEdited: false, isPinned: true } },
      { id: 'q4', requirement_ids: ['r2'], category: 'technical', prompt: 'Custom user-created tech question', answer_outline: 'Out 4', difficulty: 1, metadata: { source: 'user', isEdited: false, isPinned: false } },

      // Behavioural
      { id: 'q5', requirement_ids: ['r4'], category: 'behavioural', prompt: 'Untouched behavioural question', answer_outline: 'Out 5', difficulty: 2, metadata: { source: 'generated', isEdited: false, isPinned: false } },
      { id: 'q6', requirement_ids: ['r4'], category: 'behavioural', prompt: 'Pinned behavioural question', answer_outline: 'Out 6', difficulty: 3, metadata: { source: 'generated', isEdited: false, isPinned: true } },

      // System Design
      { id: 'q7', requirement_ids: ['r3'], category: 'system-design', prompt: 'Untouched system design question', answer_outline: 'Out 7', difficulty: 3, metadata: { source: 'generated', isEdited: false, isPinned: false } },

      // Company Fit
      { id: 'q8', requirement_ids: ['r1'], category: 'company-fit', prompt: 'Untouched company fit question', answer_outline: 'Out 8', difficulty: 1, metadata: { source: 'generated', isEdited: false, isPinned: false } }
    ],
    flashcards: [],
    schedule: {
      days_available: 3,
      days: [
        { day: 1, focus: 'Day 1', question_ids: ['q1', 'q2', 'q3'], minutes: 60 },
        { day: 2, focus: 'Day 2', question_ids: ['q4', 'q5', 'q6'], minutes: 60 },
        { day: 3, focus: 'Day 3', question_ids: ['q7', 'q8'], minutes: 60 }
      ]
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1
    }
  };

  const llm = new MockLLMProvider();

  it('10, 14, 15, 16, 17. should regenerate Technical questions while strictly preserving edited (q2), pinned (q3), and custom (q4)', async () => {
    const updatedKit = await StatePreserver.regenerateCategory({
      kit: sampleKit,
      category: 'technical',
      llm
    });

    const qMap = new Map(updatedKit.questions.map(q => [q.id, q]));

    // Protected questions must survive with exact content
    expect(qMap.has('q2')).toBe(true);
    expect(qMap.get('q2')?.prompt).toBe('User edited tech question');

    expect(qMap.has('q3')).toBe(true);
    expect(qMap.get('q3')?.prompt).toBe('Pinned tech question');

    expect(qMap.has('q4')).toBe(true);
    expect(qMap.get('q4')?.prompt).toBe('Custom user-created tech question');

    // Untouched q1 must be replaced
    expect(qMap.has('q1')).toBe(false);

    // Other categories (q5, q6, q7, q8) must survive completely intact
    expect(qMap.has('q5')).toBe(true);
    expect(qMap.has('q6')).toBe(true);
    expect(qMap.has('q7')).toBe(true);
    expect(qMap.has('q8')).toBe(true);

    // Total technical questions should now meet or exceed target
    const techQuestions = updatedKit.questions.filter(q => q.category === 'technical');
    expect(techQuestions.length).toBeGreaterThanOrEqual(10);

    // Ensure all question IDs are globally unique (no duplicates)
    const allIds = updatedKit.questions.map(q => q.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('11 & 15. should regenerate Behavioural questions while preserving pinned (q6)', async () => {
    const updatedKit = await StatePreserver.regenerateCategory({
      kit: sampleKit,
      category: 'behavioural',
      llm
    });

    const qMap = new Map(updatedKit.questions.map(q => [q.id, q]));

    // Pinned q6 survives
    expect(qMap.has('q6')).toBe(true);
    expect(qMap.get('q6')?.prompt).toBe('Pinned behavioural question');

    // Untouched q5 replaced
    expect(qMap.has('q5')).toBe(false);

    // Technical, System Design, and Company Fit unchanged
    expect(qMap.has('q1')).toBe(true);
    expect(qMap.has('q2')).toBe(true);
    expect(qMap.has('q7')).toBe(true);
    expect(qMap.has('q8')).toBe(true);

    // Behavioural count meets target
    const behQuestions = updatedKit.questions.filter(q => q.category === 'behavioural');
    expect(behQuestions.length).toBeGreaterThanOrEqual(8);
  });

  it('12. should regenerate System Design questions without touching other categories', async () => {
    const updatedKit = await StatePreserver.regenerateCategory({
      kit: sampleKit,
      category: 'system-design',
      llm
    });

    const qMap = new Map(updatedKit.questions.map(q => [q.id, q]));

    // Untouched q7 replaced
    expect(qMap.has('q7')).toBe(false);

    // Technical and behavioural untouched
    expect(qMap.has('q1')).toBe(true);
    expect(qMap.has('q5')).toBe(true);
    expect(qMap.has('q8')).toBe(true);

    const sysQuestions = updatedKit.questions.filter(q => q.category === 'system-design');
    expect(sysQuestions.length).toBeGreaterThanOrEqual(8);
  });

  it('13 & 33. should regenerate Company Fit questions with distinct content', async () => {
    const updatedKit = await StatePreserver.regenerateCategory({
      kit: sampleKit,
      category: 'company-fit',
      llm
    });

    const qMap = new Map(updatedKit.questions.map(q => [q.id, q]));

    // Untouched q8 replaced
    expect(qMap.has('q8')).toBe(false);

    // All other categories untouched
    expect(qMap.has('q1')).toBe(true);
    expect(qMap.has('q5')).toBe(true);
    expect(qMap.has('q7')).toBe(true);

    const fitQuestions = updatedKit.questions.filter(q => q.category === 'company-fit');
    expect(fitQuestions.length).toBeGreaterThanOrEqual(8);

    // Check that company fit questions do NOT duplicate behavioral questions
    fitQuestions.forEach(q => {
      expect(q.prompt).not.toContain('guided a junior engineer');
    });
  });

  it('18. should preserve schedule integrity with zero dangling IDs after regeneration', async () => {
    const updatedKit = await StatePreserver.regenerateCategory({
      kit: sampleKit,
      category: 'technical',
      llm
    });

    const validIds = new Set(updatedKit.questions.map(q => q.id));

    updatedKit.schedule.days.forEach(day => {
      expect(day.minutes).toBeGreaterThan(0);
      day.question_ids.forEach(qid => {
        // Every scheduled ID must exist in the kit questions
        expect(validIds.has(qid)).toBe(true);
      });
    });
  });

  it('19. should maintain coverage integrity after category regeneration', async () => {
    const updatedKit = await StatePreserver.regenerateCategory({
      kit: sampleKit,
      category: 'technical',
      llm
    });

    // Verify all must requirements are still covered
    const coveredReqs = new Set(
      updatedKit.questions.flatMap(q => q.requirement_ids)
    );

    const mustReqs = sampleKit.role.requirements.filter(r => r.priority === 'must');
    mustReqs.forEach(req => {
      expect(coveredReqs.has(req.id)).toBe(true);
    });
  });
});
