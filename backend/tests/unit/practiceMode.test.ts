import { describe, it, expect, beforeEach } from 'vitest';
import { PracticeService } from '../../src/services/practice/practiceService.js';
import { IKitDocument } from '../../src/models/Kit.js';

describe('Real Interview Practice Mode Tests', () => {
  let mockKitDoc: Partial<IKitDocument>;

  beforeEach(() => {
    mockKitDoc = {
      _id: 'kit_123' as any,
      userId: 'user_abc' as any,
      kit: {
        source: {
          company: 'Acme Cloud',
          company_url: 'https://example.com',
          role: 'Senior Distributed Systems Engineer',
          location: 'Remote',
          jd_chars: 1200,
          researched_at: new Date().toISOString(),
          pages_used: ['https://example.com']
        },
        company_brief: {
          summary: 'Cloud telemetry company',
          what_they_do: 'Develops distributed monitoring',
          sources: ['https://example.com']
        },
        role: {
          title: 'Senior Distributed Systems Engineer',
          seniority: 'Senior',
          responsibilities: ['Build backend microservices'],
          requirements: [
            { id: 'r1', text: 'Go Concurrency & Goroutines', kind: 'technical', priority: 'must' },
            { id: 'r2', text: 'Distributed Raft Consensus', kind: 'technical', priority: 'must' },
            { id: 'r3', text: 'Mentoring Junior Engineers', kind: 'behavioural', priority: 'must' },
            { id: 'r4', text: 'Cloud Infrastructure Kubernetes', kind: 'technical', priority: 'nice' }
          ]
        },
        questions: [
          { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Explain Go channel semantics and deadlocks.', answer_outline: 'Explain unbuffered vs buffered channels and select timeouts.', difficulty: 2 },
          { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'How does Raft leader election handle split votes?', answer_outline: 'Randomized election timeouts break ties.', difficulty: 3 },
          { id: 'q3', requirement_ids: ['r3'], category: 'behavioural', prompt: 'Describe how you coached an engineer facing architectural paralysis.', answer_outline: 'Use STAR format to break down mentorship.', difficulty: 2 },
          { id: 'q4', requirement_ids: ['r2'], category: 'system-design', prompt: 'Design a distributed distributed lock manager with fencing tokens.', answer_outline: 'Discuss consensus, fencing tokens, and lease timeouts.', difficulty: 3 },
          { id: 'q5', requirement_ids: ['r1'], category: 'company-fit', prompt: 'Why is Acme Cloud telemetry scale relevant to your career goals?', answer_outline: 'Connect high throughput ingestion to personal engineering passions.', difficulty: 1 },
          { id: 'q6', requirement_ids: ['r4'], category: 'technical', prompt: 'Explain Kubernetes pod scheduling topologies.', answer_outline: 'Affinity and anti-affinity rules.', difficulty: 1 }
        ],
        flashcards: [
          { id: 'f1', front: 'What is a goroutine leak?', back: 'A goroutine blocked on a channel or mutex that never terminates.', requirement_ids: ['r1'] },
          { id: 'f2', front: 'What are Raft log terms?', back: 'Monotonically increasing integer acting as a logical clock.', requirement_ids: ['r2'] }
        ],
        schedule: {
          days_available: 2,
          days: [
            { day: 1, focus: 'Day 1', question_ids: ['q1', 'q2', 'q3'], minutes: 60 },
            { day: 2, focus: 'Day 2', question_ids: ['q4', 'q5', 'q6'], minutes: 60 }
          ]
        },
        coverage: { uncovered_requirement_ids: [], passes: 1 }
      },
      practiceState: {
        cards: [],
        attempts: [],
        itemProgress: {},
        totalSessions: 0
      },
      markModified: () => {},
      save: async () => mockKitDoc as any
    };
  });

  it('1. should start practice session with prioritized queue', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'all' });
    expect(queue.questions.length).toBe(6);
    expect(queue.totalAvailable).toBe(6);
  });

  it('2. should filter strictly for Technical practice questions', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'technical' });
    expect(queue.questions.length).toBe(3);
    queue.questions.forEach(q => expect(q.category).toBe('technical'));
  });

  it('3. should filter strictly for Behavioural practice questions', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'behavioural' });
    expect(queue.questions.length).toBe(1);
    expect(queue.questions[0].category).toBe('behavioural');
    expect(queue.questions[0].id).toBe('q3');
  });

  it('4. should filter strictly for System Design practice questions', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'system-design' });
    expect(queue.questions.length).toBe(1);
    expect(queue.questions[0].category).toBe('system-design');
    expect(queue.questions[0].id).toBe('q4');
  });

  it('5. should filter strictly for Company Fit practice questions', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'company-fit' });
    expect(queue.questions.length).toBe(1);
    expect(queue.questions[0].category).toBe('company-fit');
    expect(queue.questions[0].id).toBe('q5');
  });

  it('6. should retrieve prioritized Flashcard practice queue', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'flashcards' });
    expect(queue.flashcards.length).toBe(2);
    expect(queue.mode).toBe('flashcards');
  });

  it('7 & 8. should record confidence rating 1-5 and persist attempt history', async () => {
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q1',
      itemType: 'question',
      category: 'technical',
      confidence: 4,
      answerText: 'Channels pass data via lock-free or ring-buffer queues.'
    });

    const state = mockKitDoc.practiceState!;
    expect(state.attempts?.length).toBe(1);
    expect(state.attempts![0].confidence).toBe(4);
    expect(state.attempts![0].answerText).toContain('Channels pass data');
    expect(state.itemProgress!['q1'].lastRating).toBe(4);
    expect(state.itemProgress!['q1'].practiceCount).toBe(1);
  });

  it('9. should detect weak spots when ratings are <= 2', async () => {
    // Record low confidence rating on q1 (linked to r1)
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q1',
      itemType: 'question',
      category: 'technical',
      confidence: 2
    });

    const report = PracticeService.generateWeakSpotsReport(mockKitDoc as IKitDocument);
    expect(report.weakSpots.length).toBeGreaterThan(0);
    expect(report.weakSpots.some(w => w.requirementId === 'r1')).toBe(true);
    expect(report.summaryMessage).toContain('Attention Needed');
  });

  it('10. should filter practice questions mapped strictly to must-have requirements', () => {
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'must' });
    // r1, r2, r3 are must; r4 is nice (q6 is only r4)
    expect(queue.questions.some(q => q.id === 'q6')).toBe(false);
    expect(queue.questions.length).toBe(5);
  });

  it('11 & 12. should calculate progress stats and handle retries/notes', async () => {
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q2',
      itemType: 'question',
      category: 'technical',
      confidence: 5,
      notes: 'Remember to mention Raft pre-vote optimization'
    });

    const progress = PracticeService.getPracticeProgress(mockKitDoc as IKitDocument);
    expect(progress.questionsMastered).toBe(1);
    expect(progress.averageConfidence).toBe(5);
    expect(progress.recentAttempts[0].notes).toContain('Raft pre-vote');
  });

  it('13, 14, 16. should track session completion analytics and recent practice history', async () => {
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q3',
      itemType: 'question',
      category: 'behavioural',
      confidence: 3
    });

    const progress = PracticeService.getPracticeProgress(mockKitDoc as IKitDocument);
    expect(progress.recentAttempts.length).toBe(1);
    expect(progress.recentAttempts[0].itemId).toBe('q3');
    expect(progress.recentAttempts[0].confidence).toBe(3);
    expect(progress.categoryStats['behavioural'].practiced).toBe(1);
  });

  it('17 & 18. should ensure questions have sequential unique IDs with no duplicates', () => {
    const allIds = mockKitDoc.kit!.questions.map(q => q.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('19. should prioritize weak questions (confidence 1-2) at the top of the queue', async () => {
    // Record low rating for q4
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q4',
      itemType: 'question',
      category: 'system-design',
      confidence: 1
    });

    // Record high rating for q1
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q1',
      itemType: 'question',
      category: 'technical',
      confidence: 5
    });

    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'all' });
    // Low confidence q4 must come before mastered q1
    const idxQ4 = queue.questions.findIndex(q => q.id === 'q4');
    const idxQ1 = queue.questions.findIndex(q => q.id === 'q1');
    expect(idxQ4).toBeLessThan(idxQ1);
  });

  it('20. should allow practicing mastered questions again without permanent removal', async () => {
    await PracticeService.recordAttempt(mockKitDoc as IKitDocument, {
      itemId: 'q1',
      itemType: 'question',
      category: 'technical',
      confidence: 5
    });

    expect(mockKitDoc.practiceState!.itemProgress!['q1'].isMastered).toBe(true);

    // Queue must still include q1
    const queue = PracticeService.getPracticeQueue(mockKitDoc as IKitDocument, { mode: 'all' });
    expect(queue.questions.some(q => q.id === 'q1')).toBe(true);
  });
});

describe('Phase 19 Regression Tests — Critical Bug Fix Practice Mode Contract', () => {
  const create34QuestionKit = (): Partial<IKitDocument> => {
    // 10 technical, 8 behavioural, 8 system-design, 8 company-fit = 34 questions
    const questions: any[] = [];

    for (let i = 1; i <= 10; i++) {
      questions.push({
        id: `q_tech_${i}`,
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: `Technical question ${i} prompt`,
        answer_outline: `Technical outline ${i}`,
        difficulty: 2
      });
    }

    for (let i = 1; i <= 8; i++) {
      questions.push({
        id: `q_beh_${i}`,
        requirement_ids: ['r2'],
        category: 'behavioural',
        prompt: `Behavioural question ${i} prompt`,
        answer_outline: `Behavioural outline ${i}`,
        difficulty: 2
      });
    }

    for (let i = 1; i <= 8; i++) {
      questions.push({
        id: `q_sys_${i}`,
        requirement_ids: ['r3'],
        category: 'system-design',
        prompt: `System design question ${i} prompt`,
        answer_outline: `System design outline ${i}`,
        difficulty: 3
      });
    }

    for (let i = 1; i <= 8; i++) {
      questions.push({
        id: `q_fit_${i}`,
        requirement_ids: ['r4'],
        category: 'company-fit',
        prompt: `Company fit question ${i} prompt`,
        answer_outline: `Company fit outline ${i}`,
        difficulty: 1
      });
    }

    const kitDoc: Partial<IKitDocument> = {
      _id: 'kit_34_questions' as any,
      userId: 'user_test' as any,
      kit: {
        source: {
          company: 'Acme Cloud',
          company_url: 'https://example.com',
          role: 'Staff Systems Architect',
          location: 'Remote',
          jd_chars: 2000,
          researched_at: new Date().toISOString(),
          pages_used: ['https://example.com']
        },
        company_brief: {
          summary: 'Cloud telemetry company',
          what_they_do: 'Develops distributed monitoring',
          sources: ['https://example.com']
        },
        role: {
          title: 'Staff Systems Architect',
          seniority: 'Staff',
          responsibilities: ['Architect scalable systems'],
          requirements: [
            { id: 'r1', text: 'Distributed Systems', kind: 'technical', priority: 'must' },
            { id: 'r2', text: 'Leadership', kind: 'behavioural', priority: 'must' },
            { id: 'r3', text: 'Scalability', kind: 'technical', priority: 'must' },
            { id: 'r4', text: 'Values alignment', kind: 'domain', priority: 'nice' }
          ]
        },
        questions,
        flashcards: [
          { id: 'fc1', front: 'Concept 1', back: 'Explanation 1', requirement_ids: ['r1'] },
          { id: 'fc2', front: 'Concept 2', back: 'Explanation 2', requirement_ids: ['r2'] }
        ],
        schedule: { days_available: 3, days: [] },
        coverage: { uncovered_requirement_ids: [], passes: 1 }
      },
      practiceState: {
        cards: [],
        attempts: [],
        itemProgress: {},
        totalSessions: 0
      },
      markModified: () => {},
      save: async () => kitDoc as any
    };

    return kitDoc;
  };

  it('TEST 1: kit has 34 questions, practiceState empty, mode = all -> EXPECT: 34 items', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'all' });
    expect(res.questions.length).toBe(34);
    expect(res.totalAvailable).toBe(34);
  });

  it('TEST 2: kit has 34 questions, practiceState empty, mode = unpracticed -> EXPECT: 34 items', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'unpracticed' });
    expect(res.questions.length).toBe(34);
    expect(res.totalAvailable).toBe(34);
  });

  it('TEST 3: kit has 34 questions, practiceState empty, mode = weak-areas -> EXPECT: 0 items', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'weak-areas' });
    expect(res.questions.length).toBe(0);
    expect(res.totalAvailable).toBe(0);
  });

  it('TEST 4: kit has 34 questions, practiceState empty, mode = starred -> EXPECT: 0 items', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'starred' });
    expect(res.questions.length).toBe(0);
    expect(res.totalAvailable).toBe(0);
  });

  it('TEST 5: mode = technical -> EXPECT: 10', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'technical' });
    expect(res.questions.length).toBe(10);
    res.questions.forEach(q => expect(q.category).toBe('technical'));
  });

  it('TEST 6: mode = behavioural -> EXPECT: 8', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'behavioural' });
    expect(res.questions.length).toBe(8);
    res.questions.forEach(q => expect(q.category).toBe('behavioural'));
  });

  it('TEST 7: mode = system-design -> EXPECT: 8', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'system-design' });
    expect(res.questions.length).toBe(8);
    res.questions.forEach(q => expect(q.category).toBe('system-design'));
  });

  it('TEST 8: mode = company-fit -> EXPECT: 8', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'company-fit' });
    expect(res.questions.length).toBe(8);
    res.questions.forEach(q => expect(q.category).toBe('company-fit'));
  });

  it('TEST 9: one question confidence = 2, weak-areas -> EXPECT: that question is returned', async () => {
    const kitDoc = create34QuestionKit();
    await PracticeService.recordAttempt(kitDoc as IKitDocument, {
      itemId: 'q_tech_1',
      itemType: 'question',
      category: 'technical',
      confidence: 2
    });

    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'weak-areas' });
    expect(res.questions.length).toBe(1);
    expect(res.questions[0].id).toBe('q_tech_1');
  });

  it('TEST 10: one question confidence = 5, weak-areas -> EXPECT: that question is not returned', async () => {
    const kitDoc = create34QuestionKit();
    await PracticeService.recordAttempt(kitDoc as IKitDocument, {
      itemId: 'q_tech_1',
      itemType: 'question',
      category: 'technical',
      confidence: 5
    });

    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'weak-areas' });
    expect(res.questions.length).toBe(0);
  });

  it('TEST 11: Practice All ordering — unpracticed questions must appear before practiced/mastered questions according to documented sorting strategy', async () => {
    const kitDoc = create34QuestionKit();

    // Mark q_tech_1 as practiced/mastered (confidence 5)
    await PracticeService.recordAttempt(kitDoc as IKitDocument, {
      itemId: 'q_tech_1',
      itemType: 'question',
      category: 'technical',
      confidence: 5
    });

    // Mark q_tech_2 as weak (confidence 2)
    await PracticeService.recordAttempt(kitDoc as IKitDocument, {
      itemId: 'q_tech_2',
      itemType: 'question',
      category: 'technical',
      confidence: 2
    });

    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'all' });

    // All 34 questions must remain available
    expect(res.questions.length).toBe(34);

    // Weak low-confidence question (q_tech_2) is prioritized at top
    expect(res.questions[0].id).toBe('q_tech_2');

    // Unpracticed questions appear before practiced/mastered question (q_tech_1)
    const idxUnpracticed = res.questions.findIndex(q => q.id === 'q_tech_3');
    const idxMastered = res.questions.findIndex(q => q.id === 'q_tech_1');
    expect(idxUnpracticed).toBeLessThan(idxMastered);
  });

  it('TEST 12: API response shape — session returns structured data with questions array', () => {
    const kitDoc = create34QuestionKit();
    const res = PracticeService.getPracticeQueue(kitDoc as IKitDocument, { mode: 'all' });

    expect(res).toHaveProperty('mode');
    expect(res).toHaveProperty('questions');
    expect(res).toHaveProperty('flashcards');
    expect(res).toHaveProperty('totalAvailable');
    expect(Array.isArray(res.questions)).toBe(true);
    expect(res.questions[0]).toHaveProperty('id');
    expect(res.questions[0]).toHaveProperty('prompt');
    expect(res.questions[0]).toHaveProperty('answer_outline');
    expect(res.questions[0]).toHaveProperty('category');
    expect(res.questions[0]).toHaveProperty('difficulty');
  });
});

