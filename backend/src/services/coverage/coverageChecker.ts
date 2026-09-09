import { Requirement, Question } from '../../types/kit.js';

export interface CoverageAnalysis {
  uncovered_requirement_ids: string[];
  must_requirement_ids: string[];
  covered_requirement_ids: string[];
  coverage_percentage: number;
  is_fully_covered: boolean;
}

/**
 * Deterministic Coverage Checker
 *
 * Implements Section 17 of the Trao Assessment specification:
 * Evaluates whether all MUST requirements are covered by at least one question.
 * The LLM has zero involvement in this calculation.
 */
export function checkCoverage(
  requirements: Requirement[],
  questions: Question[]
): CoverageAnalysis {
  // 1. Identify all MUST requirement IDs
  const mustRequirements = requirements.filter(r => r.priority === 'must');
  const mustRequirementIds = mustRequirements.map(r => r.id);
  const mustIdSet = new Set(mustRequirementIds);

  // 2. Identify all requirement IDs referenced by questions
  const coveredMustIdSet = new Set<string>();

  for (const q of questions) {
    if (Array.isArray(q.requirement_ids)) {
      for (const rid of q.requirement_ids) {
        if (mustIdSet.has(rid)) {
          coveredMustIdSet.add(rid);
        }
      }
    }
  }

  // 3. Compute uncovered must requirements: mustRequirementIds - coveredMustIdSet
  const uncovered_requirement_ids: string[] = [];
  for (const mustId of mustRequirementIds) {
    if (!coveredMustIdSet.has(mustId)) {
      uncovered_requirement_ids.push(mustId);
    }
  }

  // 4. Calculate coverage percentage
  const totalMust = mustRequirementIds.length;
  const totalCovered = coveredMustIdSet.size;
  const coverage_percentage = totalMust === 0 
    ? 100 
    : Math.round((totalCovered / totalMust) * 100);

  return {
    uncovered_requirement_ids,
    must_requirement_ids: mustRequirementIds,
    covered_requirement_ids: Array.from(coveredMustIdSet),
    coverage_percentage,
    is_fully_covered: uncovered_requirement_ids.length === 0
  };
}
