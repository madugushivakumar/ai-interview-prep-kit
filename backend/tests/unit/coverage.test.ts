import { describe, it, expect } from 'vitest';
import { checkCoverage } from '../../src/services/coverage/coverageChecker.js';
import { Requirement, Question } from '../../src/types/kit.js';

describe('Deterministic Coverage Checker (checkCoverage)', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'r1', text: 'React & TypeScript', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Node.js & Express', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'MongoDB optimization', kind: 'technical', priority: 'must' },
    { id: 'r4', text: 'Docker & Kubernetes', kind: 'technical', priority: 'nice' },
    { id: 'r5', text: 'Mentoring junior engineers', kind: 'behavioural', priority: 'must' }
  ];

  it('should return 100% coverage and empty uncovered list when all must-haves are covered', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'P1', answer_outline: 'A1', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'P2', answer_outline: 'A2', difficulty: 2 },
      { id: 'q3', requirement_ids: ['r3'], category: 'technical', prompt: 'P3', answer_outline: 'A3', difficulty: 3 },
      { id: 'q4', requirement_ids: ['r5'], category: 'behavioural', prompt: 'P4', answer_outline: 'A4', difficulty: 1 }
    ];

    const result = checkCoverage(sampleRequirements, questions);

    expect(result.is_fully_covered).toBe(true);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.coverage_percentage).toBe(100);
    expect(result.must_requirement_ids).toEqual(['r1', 'r2', 'r3', 'r5']);
    expect(result.covered_requirement_ids).toEqual(['r1', 'r2', 'r3', 'r5']);
  });

  it('should correctly identify uncovered must-have requirements', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'P1', answer_outline: 'A1', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'P2', answer_outline: 'A2', difficulty: 2 }
    ];

    const result = checkCoverage(sampleRequirements, questions);

    expect(result.is_fully_covered).toBe(false);
    expect(result.uncovered_requirement_ids).toEqual(['r3', 'r5']);
    expect(result.coverage_percentage).toBe(50);
  });

  it('should NOT flag nice-to-have requirements as uncovered if unaddressed', () => {
    // r4 is priority: 'nice' and is not covered by any question
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'P1', answer_outline: 'A1', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'P2', answer_outline: 'A2', difficulty: 2 },
      { id: 'q3', requirement_ids: ['r3'], category: 'technical', prompt: 'P3', answer_outline: 'A3', difficulty: 3 },
      { id: 'q4', requirement_ids: ['r5'], category: 'behavioural', prompt: 'P4', answer_outline: 'A4', difficulty: 1 }
    ];

    const result = checkCoverage(sampleRequirements, questions);

    expect(result.uncovered_requirement_ids).not.toContain('r4');
    expect(result.is_fully_covered).toBe(true);
  });

  it('should correctly handle multiple questions covering the same requirement', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'P1', answer_outline: 'A1', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r1'], category: 'technical', prompt: 'P2', answer_outline: 'A2', difficulty: 3 },
      { id: 'q3', requirement_ids: ['r2', 'r3'], category: 'technical', prompt: 'P3', answer_outline: 'A3', difficulty: 3 }
    ];

    const result = checkCoverage(sampleRequirements, questions);

    expect(result.covered_requirement_ids).toContain('r1');
    expect(result.covered_requirement_ids).toContain('r2');
    expect(result.covered_requirement_ids).toContain('r3');
    expect(result.uncovered_requirement_ids).toEqual(['r5']);
    expect(result.coverage_percentage).toBe(75);
  });

  it('should handle empty requirements gracefully with 100% coverage', () => {
    const result = checkCoverage([], []);
    expect(result.is_fully_covered).toBe(true);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.coverage_percentage).toBe(100);
  });
});
