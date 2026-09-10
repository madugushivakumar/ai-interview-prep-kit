import { KitSchema } from '../../schemas/kit.schema.js';
import { Kit } from '../../types/kit.js';

export interface ValidationIssue {
  path: string;
  message: string;
}

export class KitValidationError extends Error {
  public code: string;
  public issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[] = []) {
    super(message);
    this.name = 'KitValidationError';
    this.code = 'INVALID_KIT_STRUCTURE';
    this.issues = issues;
  }
}

/**
 * Deterministic Final Kit Validator (validateFinalKit)
 * Strictly audits generated kits against Appendix A specifications,
 * referential integrity, unique ID constraints, and exact coverage calculations.
 * The LLM is NEVER trusted as the final validator.
 */
export function validateFinalKit(raw: unknown): Kit {
  const issues: ValidationIssue[] = [];

  // 1. Zod schema validation for base types and structural constraints
  const zodResult = KitSchema.safeParse(raw);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      issues.push({
        path: issue.path.join('.'),
        message: issue.message
      });
    }
    const msg = issues.map(i => `${i.path}: ${i.message}`).join('; ');
    throw new KitValidationError(`Kit structure validation failed: ${msg}`, issues);
  }

  const kit = zodResult.data as Kit;

  // 2. Source validation
  if (!kit.source.company || kit.source.company.trim().length === 0) {
    issues.push({ path: 'source.company', message: 'Company name is required and non-empty' });
  }
  if (!kit.source.company_url || kit.source.company_url.trim().length === 0) {
    issues.push({ path: 'source.company_url', message: 'Company URL is required and non-empty' });
  }
  if (!kit.source.role || kit.source.role.trim().length === 0) {
    issues.push({ path: 'source.role', message: 'Role title is required and non-empty' });
  }

  // 3. Company brief validation
  if (!kit.company_brief.summary || kit.company_brief.summary.trim().length === 0) {
    issues.push({ path: 'company_brief.summary', message: 'Company summary is required and non-empty' });
  }
  if (!kit.company_brief.what_they_do || kit.company_brief.what_they_do.trim().length === 0) {
    issues.push({ path: 'company_brief.what_they_do', message: 'Company what_they_do is required and non-empty' });
  }

  // 4. Role details validation
  if (!kit.role.title || kit.role.title.trim().length === 0) {
    issues.push({ path: 'role.title', message: 'Role title is required' });
  }
  if (!kit.role.seniority || kit.role.seniority.trim().length === 0) {
    issues.push({ path: 'role.seniority', message: 'Seniority is required' });
  }
  if (!Array.isArray(kit.role.responsibilities) || kit.role.responsibilities.length === 0) {
    issues.push({ path: 'role.responsibilities', message: 'At least one responsibility is required' });
  }
  if (!Array.isArray(kit.role.requirements) || kit.role.requirements.length === 0) {
    issues.push({ path: 'role.requirements', message: 'At least one requirement is required' });
  }

  // 5. Unique ID checks
  const reqIdSet = new Set<string>();
  const duplicateReqIds = new Set<string>();
  for (const r of kit.role.requirements || []) {
    if (reqIdSet.has(r.id)) duplicateReqIds.add(r.id);
    reqIdSet.add(r.id);
  }
  if (duplicateReqIds.size > 0) {
    issues.push({
      path: 'role.requirements',
      message: `Duplicate requirement ID(s) detected: ${Array.from(duplicateReqIds).join(', ')}`
    });
  }

  const questionIdSet = new Set<string>();
  const duplicateQuestionIds = new Set<string>();
  for (const q of kit.questions || []) {
    if (questionIdSet.has(q.id)) duplicateQuestionIds.add(q.id);
    questionIdSet.add(q.id);
  }
  if (duplicateQuestionIds.size > 0) {
    issues.push({
      path: 'questions',
      message: `Duplicate question ID(s) detected: ${Array.from(duplicateQuestionIds).join(', ')}`
    });
  }

  const flashcardIdSet = new Set<string>();
  const duplicateFlashcardIds = new Set<string>();
  for (const f of kit.flashcards || []) {
    if (flashcardIdSet.has(f.id)) duplicateFlashcardIds.add(f.id);
    flashcardIdSet.add(f.id);
  }
  if (duplicateFlashcardIds.size > 0) {
    issues.push({
      path: 'flashcards',
      message: `Duplicate flashcard ID(s) detected: ${Array.from(duplicateFlashcardIds).join(', ')}`
    });
  }

  // 6. Referential integrity: questions & flashcards -> requirements
  kit.questions.forEach((q, idx) => {
    for (const rid of q.requirement_ids) {
      if (!reqIdSet.has(rid)) {
        issues.push({
          path: `questions.${idx}.requirement_ids`,
          message: `Question '${q.id}' references non-existent requirement ID '${rid}'`
        });
      }
    }
  });

  kit.flashcards.forEach((f, idx) => {
    for (const rid of f.requirement_ids) {
      if (!reqIdSet.has(rid)) {
        issues.push({
          path: `flashcards.${idx}.requirement_ids`,
          message: `Flashcard '${f.id}' references non-existent requirement ID '${rid}'`
        });
      }
    }
  });

  // 7. Schedule integrity: days_available, sequential days, integer minutes, question existence
  if (kit.schedule.days_available !== kit.schedule.days.length) {
    issues.push({
      path: 'schedule.days',
      message: `schedule.days length (${kit.schedule.days.length}) does not match days_available (${kit.schedule.days_available})`
    });
  }

  kit.schedule.days.forEach((d, idx) => {
    if (d.day !== idx + 1) {
      issues.push({
        path: `schedule.days.${idx}.day`,
        message: `Day number must be sequential: expected ${idx + 1}, found ${d.day}`
      });
    }
    if (!Number.isInteger(d.minutes) || d.minutes < 0) {
      issues.push({
        path: `schedule.days.${idx}.minutes`,
        message: `Day minutes must be a non-negative integer: found ${d.minutes}`
      });
    }
    for (const qid of d.question_ids) {
      if (!questionIdSet.has(qid)) {
        issues.push({
          path: `schedule.days.${idx}.question_ids`,
          message: `Schedule references non-existent question ID '${qid}'`
        });
      }
    }
  });

  // 8. Coverage integrity & deterministic calculation
  const coveredReqIds = new Set<string>();
  for (const q of kit.questions) {
    for (const rid of q.requirement_ids) {
      coveredReqIds.add(rid);
    }
  }

  const mustReqs = kit.role.requirements.filter(r => r.priority === 'must');
  const expectedUncovered = mustReqs
    .filter(r => !coveredReqIds.has(r.id))
    .map(r => r.id);

  const reportedUncoveredSet = new Set(kit.coverage.uncovered_requirement_ids);
  for (const uid of kit.coverage.uncovered_requirement_ids) {
    if (!reqIdSet.has(uid)) {
      issues.push({
        path: 'coverage.uncovered_requirement_ids',
        message: `Reported uncovered requirement ID '${uid}' does not exist in role requirements`
      });
    }
  }

  const expectedSet = new Set(expectedUncovered);
  const mismatch = expectedUncovered.length !== kit.coverage.uncovered_requirement_ids.length ||
    expectedUncovered.some(id => !reportedUncoveredSet.has(id));

  if (mismatch) {
    issues.push({
      path: 'coverage.uncovered_requirement_ids',
      message: `Must-have coverage calculation mismatch: expected [${expectedUncovered.join(', ')}], found [${kit.coverage.uncovered_requirement_ids.join(', ')}]`
    });
  }

  if (issues.length > 0) {
    const msg = issues.map(i => `${i.path}: ${i.message}`).join('; ');
    throw new KitValidationError(`Kit structure validation failed: ${msg}`, issues);
  }

  return kit;
}
