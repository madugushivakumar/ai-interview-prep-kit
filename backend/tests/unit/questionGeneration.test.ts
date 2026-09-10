import { describe, it, expect } from 'vitest';
import { generateCategorizedQuestions, normalizePrompt, isCategoryContaminated } from '../../src/services/generation/questionGenerator.js';
import { generateFlashcards } from '../../src/services/generation/flashcardGenerator.js';
import { MockLLMProvider } from '../../src/services/llm/mock.provider.js';
import { Requirement, CompanyBrief } from '../../src/types/kit.js';

describe('Question Generation Integrity & Category Specificity', () => {
  const mockRequirements: Requirement[] = [
    { id: 'r1', text: '5+ years experience with React and modern frontend state management', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Strong proficiency in Node.js, Express, and RESTful API architecture', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Database schema design and query optimization with MongoDB', kind: 'technical', priority: 'must' },
    { id: 'r4', text: '3+ years writing concurrent backend services in Go', kind: 'technical', priority: 'must' },
    { id: 'r5', text: 'Experience with containerization (Docker, Kubernetes) and cloud infrastructure', kind: 'technical', priority: 'nice' },
    { id: 'r6', text: 'Mentoring junior and mid-level software engineers through structured feedback', kind: 'behavioural', priority: 'must' }
  ];

  const mockCompanyBrief: CompanyBrief = {
    summary: 'Leading cloud-native distributed platform organization.',
    what_they_do: 'Develops enterprise-grade distributed telemetry and observability infrastructure.',
    sources: ['https://example.com/about']
  };

  const llm = new MockLLMProvider();

  it('1 & 6. should generate at least 10 high-impact technical questions without STAR outlines', async () => {
    const techQuestions = await generateCategorizedQuestions({
      category: 'technical',
      requirements: mockRequirements,
      companyBrief: mockCompanyBrief,
      jdExcerpt: 'Senior Full-Stack Engineer role requiring React, Node.js, and MongoDB.',
      startQuestionNumber: 1,
      llm
    });

    expect(techQuestions.length).toBeGreaterThanOrEqual(10);
    techQuestions.forEach(q => {
      expect(q.category).toBe('technical');
      expect(q.prompt).toBeTruthy();
      expect(q.answer_outline).not.toContain('Use the STAR method: Situation, Task, Coaching Approach, and Result');
      expect(isCategoryContaminated(q.prompt, 'technical')).toBe(false);
    });
  });

  it('1 & 7. should generate at least 8 distinct behavioural questions using the STAR framework', async () => {
    const behQuestions = await generateCategorizedQuestions({
      category: 'behavioural',
      requirements: mockRequirements,
      companyBrief: mockCompanyBrief,
      jdExcerpt: 'Senior Software Engineer mentoring junior engineers and leading design reviews.',
      startQuestionNumber: 11,
      llm
    });

    expect(behQuestions.length).toBeGreaterThanOrEqual(8);
    behQuestions.forEach(q => {
      expect(q.category).toBe('behavioural');
      expect(q.answer_outline.toLowerCase()).toContain('situation');
      expect(isCategoryContaminated(q.prompt, 'behavioural')).toBe(false);
    });
  });

  it('1 & 8. should generate at least 8 actual system design architecture problems without STAR outlines', async () => {
    const sysQuestions = await generateCategorizedQuestions({
      category: 'system-design',
      requirements: mockRequirements,
      companyBrief: mockCompanyBrief,
      jdExcerpt: 'Architect scalable distributed systems handling high-throughput telemetry.',
      startQuestionNumber: 21,
      llm
    });

    expect(sysQuestions.length).toBeGreaterThanOrEqual(8);
    sysQuestions.forEach(q => {
      expect(q.category).toBe('system-design');
      expect(q.prompt.toLowerCase()).not.toContain('guided a junior engineer');
      expect(q.answer_outline).not.toContain('Use the STAR method: Situation, Task, Coaching Approach, and Result');
      expect(isCategoryContaminated(q.prompt, 'system-design')).toBe(false);
    });
  });

  it('1 & 9. should generate at least 8 company-fit questions grounded in company research', async () => {
    const fitQuestions = await generateCategorizedQuestions({
      category: 'company-fit',
      requirements: mockRequirements,
      companyBrief: mockCompanyBrief,
      jdExcerpt: 'Senior Full-Stack Engineer at cloud-native platform organization.',
      startQuestionNumber: 31,
      llm
    });

    expect(fitQuestions.length).toBeGreaterThanOrEqual(8);
    fitQuestions.forEach(q => {
      expect(q.category).toBe('company-fit');
      expect(q.prompt.toLowerCase()).not.toContain('guided a junior engineer through an architectural bottleneck');
      expect(q.answer_outline).not.toContain('Use the STAR method: Situation, Task, Coaching Approach, and Result');
    });
  });

  it('2. should assign globally unique question IDs across all categories', async () => {
    const tech = await generateCategorizedQuestions({ category: 'technical', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: 1, llm });
    const beh = await generateCategorizedQuestions({ category: 'behavioural', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: tech.length + 1, llm });
    const sys = await generateCategorizedQuestions({ category: 'system-design', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: tech.length + beh.length + 1, llm });
    const fit = await generateCategorizedQuestions({ category: 'company-fit', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: tech.length + beh.length + sys.length + 1, llm });

    const all = [...tech, ...beh, ...sys, ...fit];
    const ids = all.map(q => q.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
    expect(all.length).toBeGreaterThanOrEqual(34);
  });

  it('3 & 4. should ensure zero duplicate questions across categories', async () => {
    const tech = await generateCategorizedQuestions({ category: 'technical', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: 1, llm });
    const beh = await generateCategorizedQuestions({ category: 'behavioural', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: 20, llm });
    const sys = await generateCategorizedQuestions({ category: 'system-design', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: 40, llm });
    const fit = await generateCategorizedQuestions({ category: 'company-fit', requirements: mockRequirements, companyBrief: mockCompanyBrief, jdExcerpt: '', startQuestionNumber: 60, llm });

    const all = [...tech, ...beh, ...sys, ...fit];
    const normalizedPrompts = all.map(q => normalizePrompt(q.prompt));
    const uniquePrompts = new Set(normalizedPrompts);

    expect(uniquePrompts.size).toBe(all.length);

    // Explicitly verify the previously observed duplicate question is NOT shared
    const juniorMentoringQuestions = all.filter(q => q.prompt.includes('guided a junior engineer'));
    expect(juniorMentoringQuestions.length).toBeLessThanOrEqual(1);
    if (juniorMentoringQuestions.length === 1) {
      expect(juniorMentoringQuestions[0].category).toBe('behavioural');
    }
  });

  it('5. should reject contaminated questions using isCategoryContaminated', () => {
    expect(isCategoryContaminated('Tell me about a time you resolved a database outage', 'technical')).toBe(true);
    expect(isCategoryContaminated('Describe a time when you mentored a junior engineer', 'system-design')).toBe(true);
    expect(isCategoryContaminated('Explain how React Fiber reconciles virtual DOM trees', 'technical')).toBe(false);
    expect(isCategoryContaminated('Design a distributed message broker with partition consensus', 'system-design')).toBe(false);
    expect(isCategoryContaminated('Design a distributed message broker with partition consensus', 'behavioural')).toBe(true);
  });

  it('20. should generate 15 to 25 distinct flashcards with unique IDs', async () => {
    const flashcards = await generateFlashcards(mockRequirements, llm);

    expect(flashcards.length).toBeGreaterThanOrEqual(15);
    expect(flashcards.length).toBeLessThanOrEqual(25);

    const ids = flashcards.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);

    const fronts = flashcards.map(f => normalizePrompt(f.front));
    expect(new Set(fronts).size).toBe(flashcards.length);
  });
});
