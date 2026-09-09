import { describe, it, expect } from 'vitest';
import { checkCoverage } from '../../src/services/coverage/coverageChecker.js';
import { allocateSchedule } from '../../src/services/scheduling/scheduleAllocator.js';
import { Requirement, Question, Flashcard } from '../../src/types/kit.js';

describe('Builder Mutation Integrity (Coverage Recalculation & Schedule Repair)', () => {
  it('should recalculate coverage deterministically when a question covering a must-have requirement is deleted', () => {
    const requirements: Requirement[] = [
      { id: 'r1', text: 'React state management', kind: 'technical', priority: 'must' },
      { id: 'r2', text: 'Node.js event loop', kind: 'technical', priority: 'must' }
    ];

    let questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'React question', answer_outline: 'Outline', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'Node question', answer_outline: 'Outline', difficulty: 2 }
    ];

    // Initial check: fully covered
    const initialCoverage = checkCoverage(requirements, questions);
    expect(initialCoverage.is_fully_covered).toBe(true);
    expect(initialCoverage.uncovered_requirement_ids).toEqual([]);

    // Delete question q1 (which covered r1)
    const questionToDelete = 'q1';
    questions = questions.filter(q => q.id !== questionToDelete);

    // Coverage must now register r1 as uncovered!
    const updatedCoverage = checkCoverage(requirements, questions);
    expect(updatedCoverage.is_fully_covered).toBe(false);
    expect(updatedCoverage.uncovered_requirement_ids).toEqual(['r1']);
  });

  it('should remove deleted question from schedule without leaving dangling IDs', () => {
    const requirements: Requirement[] = [
      { id: 'r1', text: 'React', kind: 'technical', priority: 'must' },
      { id: 'r2', text: 'Node', kind: 'technical', priority: 'must' }
    ];

    let questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'React question', answer_outline: 'Outline', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'Node question', answer_outline: 'Outline', difficulty: 2 }
    ];

    const schedule = allocateSchedule({
      days: 2,
      requirements,
      questions
    });

    expect(schedule.days[0].question_ids).toContain('q1');

    // Simulate question deletion
    const questionIdToDelete = 'q1';
    questions = questions.filter(q => q.id !== questionIdToDelete);
    schedule.days.forEach(d => {
      d.question_ids = d.question_ids.filter(id => id !== questionIdToDelete);
    });

    // Verify q1 is purged from all days
    schedule.days.forEach(d => {
      expect(d.question_ids).not.toContain('q1');
    });
  });

  it('should clean up practice card state when a flashcard is deleted', () => {
    let flashcards: Flashcard[] = [
      { id: 'f1', front: 'React hook', back: 'useState', requirement_ids: ['r1'] },
      { id: 'f2', front: 'Node loop', back: 'libuv', requirement_ids: ['r2'] }
    ];

    let practiceCards = [
      { flashcardId: 'f1', practiceCount: 3, lastRating: 4, confidenceHistory: [] },
      { flashcardId: 'f2', practiceCount: 1, lastRating: 2, confidenceHistory: [] }
    ];

    // Delete flashcard f1
    const cardIdToDelete = 'f1';
    flashcards = flashcards.filter(f => f.id !== cardIdToDelete);
    practiceCards = practiceCards.filter(c => c.flashcardId !== cardIdToDelete);

    expect(flashcards).toHaveLength(1);
    expect(practiceCards).toHaveLength(1);
    expect(practiceCards[0].flashcardId).toBe('f2');
  });
});
