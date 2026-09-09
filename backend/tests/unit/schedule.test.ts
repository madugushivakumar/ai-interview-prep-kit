import { describe, it, expect } from 'vitest';
import { allocateSchedule } from '../../src/services/scheduling/scheduleAllocator.js';
import { Requirement, Question } from '../../src/types/kit.js';

describe('Deterministic Schedule Allocator (allocateSchedule)', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'r1', text: 'React & TypeScript', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Node.js & Express', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'System Design of Distributed Queues', kind: 'technical', priority: 'must' },
    { id: 'r4', text: 'Mentoring junior engineers', kind: 'behavioural', priority: 'nice' }
  ];

  const sampleQuestions: Question[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'P1', answer_outline: 'A1', difficulty: 1 },
    { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'P2', answer_outline: 'A2', difficulty: 2 },
    { id: 'q3', requirement_ids: ['r3'], category: 'system-design', prompt: 'P3', answer_outline: 'A3', difficulty: 3 },
    { id: 'q4', requirement_ids: ['r4'], category: 'behavioural', prompt: 'P4', answer_outline: 'A4', difficulty: 1 },
    { id: 'q5', requirement_ids: ['r1', 'r2'], category: 'technical', prompt: 'P5', answer_outline: 'A5', difficulty: 3 }
  ];

  it('should produce exactly the requested number of days for a standard 5-day schedule', () => {
    const schedule = allocateSchedule({
      days: 5,
      requirements: sampleRequirements,
      questions: sampleQuestions
    });

    expect(schedule.days_available).toBe(5);
    expect(schedule.days).toHaveLength(5);
    expect(schedule.days.map(d => d.day)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should support a 1-day schedule with all questions and integer minutes', () => {
    const schedule = allocateSchedule({
      days: 1,
      requirements: sampleRequirements,
      questions: sampleQuestions
    });

    expect(schedule.days_available).toBe(1);
    expect(schedule.days).toHaveLength(1);
    expect(schedule.days[0].day).toBe(1);
    expect(schedule.days[0].question_ids.length).toBeGreaterThanOrEqual(sampleQuestions.length);
    expect(Number.isInteger(schedule.days[0].minutes)).toBe(true);
    expect(schedule.days[0].minutes).toBeGreaterThan(0);
  });

  it('should support a 60-day schedule with exactly 60 days and no gaps', () => {
    const schedule = allocateSchedule({
      days: 60,
      requirements: sampleRequirements,
      questions: sampleQuestions
    });

    expect(schedule.days_available).toBe(60);
    expect(schedule.days).toHaveLength(60);
    expect(schedule.days[0].day).toBe(1);
    expect(schedule.days[59].day).toBe(60);

    // Verify all days have integer minutes and valid focus
    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
      expect(day.focus.length).toBeGreaterThan(0);
    }
  });

  it('should ensure every must-have requirement with a question appears in the schedule', () => {
    const schedule = allocateSchedule({
      days: 3,
      requirements: sampleRequirements,
      questions: sampleQuestions
    });

    const scheduledQids = new Set<string>();
    for (const day of schedule.days) {
      for (const qid of day.question_ids) {
        scheduledQids.add(qid);
      }
    }

    // Must-have requirements are r1, r2, r3
    const mustCovered = new Set<string>();
    for (const qid of scheduledQids) {
      const q = sampleQuestions.find(item => item.id === qid);
      if (q) {
        for (const rid of q.requirement_ids) {
          mustCovered.add(rid);
        }
      }
    }

    expect(mustCovered.has('r1')).toBe(true);
    expect(mustCovered.has('r2')).toBe(true);
    expect(mustCovered.has('r3')).toBe(true);
  });

  it('should schedule harder and higher-priority questions earlier than easier questions', () => {
    const schedule = allocateSchedule({
      days: 5,
      requirements: sampleRequirements,
      questions: sampleQuestions
    });

    // Day 1 should receive the highest difficulty / priority items (e.g. q3 or q5 with difficulty 3)
    const day1Qids = schedule.days[0].question_ids;
    expect(day1Qids.length).toBeGreaterThan(0);

    const day1Questions = day1Qids.map(id => sampleQuestions.find(q => q.id === id)!);
    const hasHighDifficulty = day1Questions.some(q => q.difficulty === 3);
    expect(hasHighDifficulty).toBe(true);
  });

  it('should only reference existing questions', () => {
    const schedule = allocateSchedule({
      days: 4,
      requirements: sampleRequirements,
      questions: sampleQuestions
    });

    const existingQids = new Set(sampleQuestions.map(q => q.id));
    for (const day of schedule.days) {
      for (const qid of day.question_ids) {
        expect(existingQids.has(qid)).toBe(true);
      }
    }
  });

  it('should throw an error if days is invalid', () => {
    expect(() => {
      allocateSchedule({
        days: 0,
        requirements: sampleRequirements,
        questions: sampleQuestions
      });
    }).toThrow();

    expect(() => {
      allocateSchedule({
        days: -5,
        requirements: sampleRequirements,
        questions: sampleQuestions
      });
    }).toThrow();
  });
});
