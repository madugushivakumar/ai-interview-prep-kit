import { Requirement, Question, Schedule, ScheduleDay } from '../../types/kit.js';

export interface AllocateScheduleParams {
  days: number;
  requirements: Requirement[];
  questions: Question[];
}

/**
 * Deterministic Schedule Allocator
 *
 * Implements Section 19 of the Trao Assessment specification:
 * - Exactly requested number of days.
 * - Integer minutes.
 * - Every must-have requirement covered by questions appears in the schedule.
 * - Harder (difficulty 3 > 2 > 1) and higher-priority (must > nice) scheduled earlier.
 * - Handles 1-day, 60-day, small, and large question sets deterministically.
 * - The LLM has zero involvement in this calculation.
 */
export function allocateSchedule(params: AllocateScheduleParams): Schedule {
  const { days, requirements, questions } = params;

  if (!Number.isInteger(days) || days < 1) {
    throw new Error(`Schedule days must be an integer >= 1, received: ${days}`);
  }

  // 1. Build lookup for requirements
  const reqMap = new Map<string, Requirement>();
  for (const r of requirements) {
    reqMap.set(r.id, r);
  }

  // 2. Score questions deterministically for front-loading
  function getQuestionScore(q: Question): number {
    let score = 0;

    // Has any MUST requirement?
    const hasMust = q.requirement_ids.some(rid => reqMap.get(rid)?.priority === 'must');
    if (hasMust) score += 100;

    // Difficulty score: 3 (30), 2 (20), 1 (10)
    score += (q.difficulty || 2) * 10;

    // Category weighting
    switch (q.category) {
      case 'system-design':
        score += 8;
        break;
      case 'technical':
        score += 6;
        break;
      case 'behavioural':
        score += 4;
        break;
      case 'company-fit':
        score += 2;
        break;
    }

    return score;
  }

  // 3. Sort questions descending by score, with stable ID tiebreaker
  const sortedQuestions = [...questions].sort((a, b) => {
    const scoreDiff = getQuestionScore(b) - getQuestionScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.id.localeCompare(b.id);
  });

  // 4. Initialize days array
  const scheduleDays: ScheduleDay[] = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    focus: '',
    question_ids: [],
    minutes: 0
  }));

  // Handle case of 0 questions
  if (sortedQuestions.length === 0) {
    scheduleDays.forEach(d => {
      d.focus = d.day === days ? 'Final Preparation & Review' : `General Revision (Day ${d.day})`;
      d.question_ids = [];
      d.minutes = 45;
    });
    return { days_available: days, days: scheduleDays };
  }

  // 5. Allocation Logic
  if (days === 1) {
    // Single-day schedule: allocate all questions to Day 1
    scheduleDays[0].question_ids = sortedQuestions.map(q => q.id);
  } else if (days <= sortedQuestions.length) {
    // More questions than days: front-load by distributing questions across available days
    // Front-loaded distribution curve: earlier days take more questions or higher weight
    sortedQuestions.forEach((q, idx) => {
      // Map index to a day index with front-load bias
      const dayIndex = Math.min(Math.floor((idx / sortedQuestions.length) * days), days - 1);
      scheduleDays[dayIndex].question_ids.push(q.id);
    });
  } else {
    // More days than questions (e.g., 60 days, 15 questions):
    // Phase 1: Deep dive across the first N days (1 question per day or spaced)
    // Phase 2: Targeted review & consolidation cycles, ensuring no day is empty
    const questionCount = sortedQuestions.length;
    
    // Allocate original questions to earlier days
    sortedQuestions.forEach((q, idx) => {
      scheduleDays[idx].question_ids.push(q.id);
    });

    // For remaining days (questionCount to days - 1), cycle spaced revision questions
    for (let dayIdx = questionCount; dayIdx < days; dayIdx++) {
      // Pick a question to revisit (prioritizing hard / must questions)
      const reviewQuestion = sortedQuestions[dayIdx % questionCount];
      scheduleDays[dayIdx].question_ids.push(reviewQuestion.id);
    }
  }

  // 6. Guarantee that EVERY MUST requirement with at least one question appears somewhere in the schedule
  const scheduledQids = new Set<string>();
  for (const d of scheduleDays) {
    for (const qid of d.question_ids) {
      scheduledQids.add(qid);
    }
  }

  const mustRequirements = requirements.filter(r => r.priority === 'must');
  for (const mustReq of mustRequirements) {
    const candidateQ = questions.find(q => q.requirement_ids.includes(mustReq.id));
    if (candidateQ && !scheduledQids.has(candidateQ.id)) {
      // Add to Day 1 so it is covered early
      scheduleDays[0].question_ids.unshift(candidateQ.id);
      scheduledQids.add(candidateQ.id);
    }
  }

  // 7. Calculate focus and integer minutes for each day
  const qMap = new Map(questions.map(q => [q.id, q]));

  scheduleDays.forEach(day => {
    const dayQuestions = day.question_ids
      .map(id => qMap.get(id))
      .filter((q): q is Question => q !== undefined);

    if (dayQuestions.length > 0) {
      // Categorize questions in this day
      const categories = Array.from(new Set(dayQuestions.map(q => q.category)));
      
      if (day.day === days && days > 3) {
        day.focus = 'Final Review & Behavioral Confidence';
      } else if (categories.length === 1) {
        const catName = formatCategoryName(categories[0]);
        day.focus = `${catName} Mastery & Technical Drills`;
      } else if (categories.includes('system-design') || categories.includes('technical')) {
        day.focus = 'Architecture, System Design & Core Technicals';
      } else {
        day.focus = `Interview Practice: ${categories.map(formatCategoryName).join(' & ')}`;
      }

      // Compute integer minutes:
      // Base 20 minutes + 15 min per question + (difficulty * 5 min)
      const calculatedMinutes = 20 + dayQuestions.reduce((sum, q) => sum + 15 + (q.difficulty * 5), 0);
      // Clamp between 30 and 180 minutes
      day.minutes = Math.round(Math.min(Math.max(calculatedMinutes, 30), 180));
    } else {
      // Non-question consolidation day
      day.focus = day.day === days 
        ? 'Final Review & Mental Preparation' 
        : `Topic Consolidation & Flashcard Revision (Day ${day.day})`;
      day.minutes = 45;
    }
  });

  return {
    days_available: days,
    days: scheduleDays
  };
}

function formatCategoryName(category: string): string {
  switch (category) {
    case 'technical': return 'Technical';
    case 'behavioural': return 'Behavioural';
    case 'system-design': return 'System Design';
    case 'company-fit': return 'Company Fit';
    default: return category;
  }
}
