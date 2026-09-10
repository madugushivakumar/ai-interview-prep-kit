import { IKitDocument, IPracticeCard, IPracticeAttempt, IItemProgress } from '../../models/Kit.js';
import { Flashcard, Question, QuestionCategory } from '../../types/kit.js';

export interface WeakSpotItem {
  requirementId: string;
  requirementText: string;
  kind: string;
  priority?: 'must' | 'nice';
  averageRating: number;
  practiceCount: number;
  status: 'critical_weak' | 'needs_review' | 'proficient';
  recommendedQuestions: Question[];
}

export interface WeakSpotsReport {
  overallProficiencyScore: number; // 0 to 100
  totalCardsPracticed: number;
  totalUniqueCards: number;
  completionRate: number; // percentage of cards practiced at least once
  weakSpots: WeakSpotItem[];
  strengths: WeakSpotItem[];
  summaryMessage: string;
}

export interface PracticeProgressStats {
  totalQuestions: number;
  totalFlashcards: number;
  questionsPracticed: number;
  questionsMastered: number;
  questionsWeak: number;
  averageConfidence: number;
  mustHavePracticed: number;
  mustHaveTotal: number;
  mustHaveCoveragePercent: number;
  overallProgressPercent: number;
  categoryStats: Record<string, {
    total: number;
    practiced: number;
    mastered: number;
    weak: number;
    averageRating: number;
    progressPercent: number;
  }>;
  recentAttempts: Array<{
    attemptId: string;
    itemId: string;
    itemType: string;
    category?: string;
    prompt?: string;
    confidence: number;
    practicedAt: Date;
    notes?: string;
  }>;
}

export class PracticeService {
  /**
   * Records a user's confidence rating (1-5) on a specific flashcard.
   * Preserved for backward compatibility.
   */
  public static async recordConfidence(
    kitDoc: IKitDocument,
    flashcardId: string,
    rating: number
  ): Promise<IKitDocument> {
    return this.recordAttempt(kitDoc, {
      itemId: flashcardId,
      itemType: 'flashcard',
      confidence: rating
    });
  }

  /**
   * Records a practice attempt for either a question or flashcard.
   */
  public static async recordAttempt(
    kitDoc: IKitDocument,
    attempt: {
      itemId: string;
      itemType: 'question' | 'flashcard';
      category?: string;
      confidence: number;
      answerText?: string;
      notes?: string;
    }
  ): Promise<IKitDocument> {
    const { itemId, itemType, category, confidence, answerText, notes } = attempt;

    if (!confidence || confidence < 1 || confidence > 5) {
      const err: any = new Error('Confidence rating must be an integer between 1 and 5');
      err.statusCode = 400;
      throw err;
    }

    if (!kitDoc.practiceState) {
      kitDoc.practiceState = {
        cards: [],
        attempts: [],
        itemProgress: {},
        totalSessions: 0
      };
    }

    if (!kitDoc.practiceState.attempts) kitDoc.practiceState.attempts = [];
    if (!kitDoc.practiceState.itemProgress) kitDoc.practiceState.itemProgress = {};
    if (!kitDoc.practiceState.cards) kitDoc.practiceState.cards = [];

    const now = new Date();

    // 1. Record Attempt Entry
    const newAttempt: IPracticeAttempt = {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      itemId,
      itemType,
      category,
      confidence,
      answerText: answerText?.trim(),
      notes: notes?.trim(),
      practicedAt: now
    };
    kitDoc.practiceState.attempts.push(newAttempt);

    // 2. Update Item Progress
    const existingProgress = kitDoc.practiceState.itemProgress[itemId] || {
      itemId,
      itemType,
      category,
      lastRating: confidence,
      practiceCount: 0,
      isMastered: false,
      lastPracticedAt: now
    };

    existingProgress.lastRating = confidence;
    existingProgress.practiceCount += 1;
    existingProgress.isMastered = confidence === 5;
    existingProgress.lastPracticedAt = now;
    if (notes !== undefined && notes.trim().length > 0) {
      existingProgress.notes = notes.trim();
    }
    if (answerText !== undefined && answerText.trim().length > 0) {
      existingProgress.userAnswer = answerText.trim();
    }
    if (category) {
      existingProgress.category = category;
    }

    kitDoc.practiceState.itemProgress[itemId] = existingProgress;

    // 3. Update IPracticeCard if flashcard (for backward compatibility)
    if (itemType === 'flashcard') {
      let cardEntry = kitDoc.practiceState.cards.find(c => c.flashcardId === itemId);
      if (!cardEntry) {
        cardEntry = {
          flashcardId: itemId,
          confidenceHistory: [],
          lastRating: confidence,
          lastPracticedAt: now,
          practiceCount: 0
        };
        kitDoc.practiceState.cards.push(cardEntry);
      }
      cardEntry.confidenceHistory.push({ rating: confidence, practicedAt: now });
      cardEntry.lastRating = confidence;
      cardEntry.lastPracticedAt = now;
      cardEntry.practiceCount += 1;
    }

    kitDoc.practiceState.totalSessions += 1;
    kitDoc.practiceState.lastPracticedAt = now;

    kitDoc.markModified('practiceState');
    await kitDoc.save();

    return kitDoc;
  }

  /**
   * Retrieves prioritized questions or flashcards for a tailored practice session.
   */
  public static getPracticeQueue(
    kitDoc: IKitDocument,
    options: {
      mode?: string;
      category?: string;
      limit?: number;
    } = {}
  ): {
    mode: string;
    questions: Question[];
    flashcards: Flashcard[];
    totalAvailable: number;
  } {
    const rawMode = (options.mode || 'all').toLowerCase().trim();
    const allQuestions: Question[] = kitDoc.kit?.questions || [];
    const allFlashcards: Flashcard[] = kitDoc.kit?.flashcards || [];
    const mustRequirementIds = new Set(
      (kitDoc.kit?.role?.requirements || [])
        .filter(r => r.priority === 'must')
        .map(r => r.id)
    );

    const progressMap: Record<string, IItemProgress> = kitDoc.practiceState?.itemProgress || {};

    if (rawMode === 'flashcards') {
      const flashcards = this.getPrioritizedQueue(kitDoc);
      return {
        mode: 'flashcards',
        questions: [],
        flashcards,
        totalAvailable: flashcards.length
      };
    }

    let filtered = [...allQuestions];

    if (rawMode === 'technical') {
      filtered = allQuestions.filter(q => q.category === 'technical');
    } else if (rawMode === 'behavioural') {
      filtered = allQuestions.filter(q => q.category === 'behavioural');
    } else if (rawMode === 'system-design' || rawMode === 'system_design') {
      filtered = allQuestions.filter(q => q.category === 'system-design');
    } else if (rawMode === 'company-fit' || rawMode === 'company_fit') {
      filtered = allQuestions.filter(q => q.category === 'company-fit');
    } else if (rawMode === 'must' || rawMode === 'must-have' || rawMode === 'must_have') {
      filtered = allQuestions.filter(q => q.requirement_ids?.some(rid => mustRequirementIds.has(rid)));
    } else if (rawMode === 'weak' || rawMode === 'weak-areas' || rawMode === 'weak_areas') {
      filtered = allQuestions.filter(q => {
        const prog = progressMap[q.id];
        return Boolean(prog && prog.practiceCount > 0 && prog.lastRating > 0 && prog.lastRating <= 2);
      });
    } else if (rawMode === 'unpracticed') {
      filtered = allQuestions.filter(q => {
        const prog = progressMap[q.id];
        return !prog || prog.practiceCount === 0;
      });
    } else if (rawMode === 'starred' || rawMode === 'pinned') {
      filtered = allQuestions.filter(q => {
        const prog = progressMap[q.id];
        return Boolean(prog?.isStarred || q.metadata?.isPinned);
      });
    }

    // Deterministic Practice Priority Sorting:
    // Priority 0: Low confidence / weak questions (lastRating 1 or 2) - urgent reinforcement
    // Priority 1: Unpracticed questions (practiceCount === 0) - fresh questions to learn
    // Priority 2: Moderate confidence (lastRating 3)
    // Priority 3: High confidence (lastRating 4)
    // Priority 4: Mastered (lastRating 5)
    filtered.sort((a, b) => {
      const pA = progressMap[a.id];
      const pB = progressMap[b.id];

      const countA = pA?.practiceCount ?? 0;
      const countB = pB?.practiceCount ?? 0;

      const ratingA = pA?.lastRating ?? 0;
      const ratingB = pB?.lastRating ?? 0;

      const getTier = (count: number, rating: number): number => {
        if (count > 0 && rating > 0 && rating <= 2) return 0; // low confidence / weak areas first
        if (count === 0) return 1; // unpracticed
        if (rating === 3) return 2;
        if (rating === 4) return 3;
        if (rating >= 5) return 4;
        return 1;
      };

      const tierA = getTier(countA, ratingA);
      const tierB = getTier(countB, ratingB);

      if (tierA !== tierB) {
        return tierA - tierB;
      }

      // Within weak tier (ratings 1 and 2): lower confidence first
      if (tierA === 0 && ratingA !== ratingB) {
        return ratingA - ratingB;
      }

      // Within practiced tiers (ratings 3, 4, 5): lower confidence first
      if (tierA >= 2 && ratingA !== ratingB) {
        return ratingA - ratingB;
      }

      // Older last-practiced date first
      if (pA?.lastPracticedAt && pB?.lastPracticedAt) {
        const timeA = new Date(pA.lastPracticedAt).getTime();
        const timeB = new Date(pB.lastPracticedAt).getTime();
        if (timeA !== timeB) return timeA - timeB;
      }

      // Deterministic tie-breaker by question ID
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    const totalAvailable = filtered.length;
    const limit = options.limit || (rawMode === 'quick' ? Math.min(10, filtered.length) : filtered.length);
    const selected = filtered.slice(0, limit);

    return {
      mode: rawMode,
      questions: selected,
      flashcards: [],
      totalAvailable
    };
  }

  /**
   * Computes comprehensive practice progress and category analytics.
   */
  public static getPracticeProgress(kitDoc: IKitDocument): PracticeProgressStats {
    const questions: Question[] = kitDoc.kit?.questions || [];
    const flashcards: Flashcard[] = kitDoc.kit?.flashcards || [];
    const requirements = kitDoc.kit?.role?.requirements || [];
    const mustReqIds = new Set(requirements.filter(r => r.priority === 'must').map(r => r.id));

    const progressMap: Record<string, IItemProgress> = kitDoc.practiceState?.itemProgress || {};
    const attempts: IPracticeAttempt[] = kitDoc.practiceState?.attempts || [];

    const categories: QuestionCategory[] = ['technical', 'behavioural', 'system-design', 'company-fit'];
    const categoryStats: PracticeProgressStats['categoryStats'] = {};

    let totalPracticedQuestions = 0;
    let totalMasteredQuestions = 0;
    let totalWeakQuestions = 0;
    const allQuestionRatings: number[] = [];

    categories.forEach(cat => {
      const catQuestions = questions.filter(q => q.category === cat);
      let catPracticed = 0;
      let catMastered = 0;
      let catWeak = 0;
      const catRatings: number[] = [];

      catQuestions.forEach(q => {
        const p = progressMap[q.id];
        if (p && p.practiceCount > 0) {
          catPracticed++;
          catRatings.push(p.lastRating);
          allQuestionRatings.push(p.lastRating);
          if (p.isMastered || p.lastRating === 5) {
            catMastered++;
          } else if (p.lastRating <= 2) {
            catWeak++;
          }
        }
      });

      const avgRating = catRatings.length > 0
        ? Math.round((catRatings.reduce((sum, r) => sum + r, 0) / catRatings.length) * 10) / 10
        : 0;

      const progressPercent = catQuestions.length > 0
        ? Math.round((catPracticed / catQuestions.length) * 100)
        : 0;

      categoryStats[cat] = {
        total: catQuestions.length,
        practiced: catPracticed,
        mastered: catMastered,
        weak: catWeak,
        averageRating: avgRating,
        progressPercent
      };

      totalPracticedQuestions += catPracticed;
      totalMasteredQuestions += catMastered;
      totalWeakQuestions += catWeak;
    });

    const averageConfidence = allQuestionRatings.length > 0
      ? Math.round((allQuestionRatings.reduce((sum, r) => sum + r, 0) / allQuestionRatings.length) * 10) / 10
      : 0;

    // Must-have requirements practiced count
    const practicedReqIds = new Set<string>();
    questions.forEach(q => {
      const p = progressMap[q.id];
      if (p && p.practiceCount > 0) {
        q.requirement_ids?.forEach(rid => practicedReqIds.add(rid));
      }
    });

    const mustHavePracticedCount = Array.from(mustReqIds).filter(id => practicedReqIds.has(id)).length;
    const mustHaveTotal = mustReqIds.size;
    const mustHaveCoveragePercent = mustHaveTotal > 0
      ? Math.round((mustHavePracticedCount / mustHaveTotal) * 100)
      : 100;

    const overallProgressPercent = questions.length > 0
      ? Math.round((totalPracticedQuestions / questions.length) * 100)
      : 0;

    // Recent attempts with question prompt
    const qMap = new Map<string, Question>();
    questions.forEach(q => qMap.set(q.id, q));

    const recentAttempts = [...attempts]
      .reverse()
      .slice(0, 15)
      .map(att => ({
        attemptId: att.attemptId,
        itemId: att.itemId,
        itemType: att.itemType,
        category: att.category || qMap.get(att.itemId)?.category,
        prompt: qMap.get(att.itemId)?.prompt,
        confidence: att.confidence,
        practicedAt: att.practicedAt,
        notes: att.notes
      }));

    return {
      totalQuestions: questions.length,
      totalFlashcards: flashcards.length,
      questionsPracticed: totalPracticedQuestions,
      questionsMastered: totalMasteredQuestions,
      questionsWeak: totalWeakQuestions,
      averageConfidence,
      mustHavePracticed: mustHavePracticedCount,
      mustHaveTotal,
      mustHaveCoveragePercent,
      overallProgressPercent,
      categoryStats,
      recentAttempts
    };
  }

  /**
   * Saves a personal note for a question/item without altering generated prompt or outline.
   */
  public static async saveItemNote(
    kitDoc: IKitDocument,
    itemId: string,
    notes: string
  ): Promise<IKitDocument> {
    if (!kitDoc.practiceState) {
      kitDoc.practiceState = { cards: [], attempts: [], itemProgress: {}, totalSessions: 0 };
    }
    if (!kitDoc.practiceState.itemProgress) {
      kitDoc.practiceState.itemProgress = {};
    }

    const item = kitDoc.practiceState.itemProgress[itemId] || {
      itemId,
      itemType: itemId.startsWith('f') ? 'flashcard' : 'question',
      lastRating: 0,
      practiceCount: 0,
      isMastered: false,
      lastPracticedAt: new Date()
    };

    item.notes = notes.trim();
    kitDoc.practiceState.itemProgress[itemId] = item;

    kitDoc.markModified('practiceState');
    await kitDoc.save();
    return kitDoc;
  }

  /**
   * Toggles star/pinned state for a practice item.
   */
  public static async toggleStar(
    kitDoc: IKitDocument,
    itemId: string
  ): Promise<boolean> {
    if (!kitDoc.practiceState) {
      kitDoc.practiceState = { cards: [], attempts: [], itemProgress: {}, totalSessions: 0 };
    }
    if (!kitDoc.practiceState.itemProgress) {
      kitDoc.practiceState.itemProgress = {};
    }

    const item = kitDoc.practiceState.itemProgress[itemId] || {
      itemId,
      itemType: itemId.startsWith('f') ? 'flashcard' : 'question',
      lastRating: 0,
      practiceCount: 0,
      isMastered: false,
      lastPracticedAt: new Date()
    };

    item.isStarred = !item.isStarred;
    kitDoc.practiceState.itemProgress[itemId] = item;

    kitDoc.markModified('practiceState');
    await kitDoc.save();
    return Boolean(item.isStarred);
  }

  /**
   * Retrieves the flashcards prioritized for the next practice session.
   * Lower confidence cards (ratings 1 and 2) and unpracticed cards are prioritized first.
   */
  public static getPrioritizedQueue(kitDoc: IKitDocument): Flashcard[] {
    const flashcards: Flashcard[] = kitDoc.kit?.flashcards || [];
    if (flashcards.length === 0) return [];

    const practiceMap = new Map<string, IPracticeCard>();
    (kitDoc.practiceState?.cards || []).forEach(c => {
      practiceMap.set(c.flashcardId, c);
    });

    const itemProgress = kitDoc.practiceState?.itemProgress || {};

    return [...flashcards].sort((a, b) => {
      const pA = practiceMap.get(a.id);
      const pB = practiceMap.get(b.id);
      const progA = itemProgress[a.id];
      const progB = itemProgress[b.id];

      const ratingA = progA?.lastRating ?? pA?.lastRating ?? 0;
      const ratingB = progB?.lastRating ?? pB?.lastRating ?? 0;

      if (ratingA !== ratingB) {
        if (ratingA === 0) return -1;
        if (ratingB === 0) return 1;
        return ratingA - ratingB;
      }

      const countA = progA?.practiceCount ?? pA?.practiceCount ?? 0;
      const countB = progB?.practiceCount ?? pB?.practiceCount ?? 0;
      return countA - countB;
    });
  }

  /**
   * Generates the Creative Feature: Weak Spots Report & Targeted Revision Plan
   * Aggregates ratings across both flashcards and questions.
   */
  public static generateWeakSpotsReport(kitDoc: IKitDocument): WeakSpotsReport {
    const flashcards: Flashcard[] = kitDoc.kit?.flashcards || [];
    const requirements = kitDoc.kit?.role?.requirements || [];
    const questions: Question[] = kitDoc.kit?.questions || [];
    const practiceCards = kitDoc.practiceState?.cards || [];
    const itemProgress = kitDoc.practiceState?.itemProgress || {};

    const practiceMap = new Map<string, IPracticeCard>();
    practiceCards.forEach(c => practiceMap.set(c.flashcardId, c));

    // Map requirements to their linked flashcards, questions and confidence
    const reqAnalysis = requirements.map(req => {
      const linkedCards = flashcards.filter(f => f.requirement_ids?.includes(req.id));
      const linkedQuestions = questions.filter(q => q.requirement_ids?.includes(req.id));
      const ratings: number[] = [];
      let totalPracticeCount = 0;

      linkedCards.forEach(card => {
        const p = practiceMap.get(card.id);
        const prog = itemProgress[card.id];
        if (p) {
          totalPracticeCount += p.practiceCount;
          p.confidenceHistory.forEach(h => ratings.push(h.rating));
        } else if (prog) {
          totalPracticeCount += prog.practiceCount;
          ratings.push(prog.lastRating);
        }
      });

      linkedQuestions.forEach(q => {
        const prog = itemProgress[q.id];
        if (prog && prog.practiceCount > 0) {
          totalPracticeCount += prog.practiceCount;
          ratings.push(prog.lastRating);
        }
      });

      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        : 0;

      let status: WeakSpotItem['status'] = 'proficient';
      if (avgRating > 0 && avgRating <= 2.5) {
        status = 'critical_weak';
      } else if (avgRating > 2.5 && avgRating < 3.8) {
        status = 'needs_review';
      } else if (avgRating === 0) {
        status = 'needs_review';
      }

      const item: WeakSpotItem = {
        requirementId: req.id,
        requirementText: req.text,
        kind: req.kind,
        priority: req.priority,
        averageRating: avgRating,
        practiceCount: totalPracticeCount,
        status,
        recommendedQuestions: linkedQuestions
      };

      return item;
    });

    const weakSpots = reqAnalysis
      .filter(r => r.status === 'critical_weak' || (r.status === 'needs_review' && r.averageRating > 0))
      .sort((a, b) => a.averageRating - b.averageRating);

    const strengths = reqAnalysis
      .filter(r => r.status === 'proficient' && r.practiceCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating);

    const totalUniqueCards = flashcards.length;
    const cardsPracticedAtLeastOnce = practiceCards.filter(c => c.practiceCount > 0).length;
    const completionRate = totalUniqueCards === 0
      ? 100
      : Math.round((cardsPracticedAtLeastOnce / totalUniqueCards) * 100);

    const allRecordedRatings = [
      ...practiceCards.flatMap(c => c.confidenceHistory.map(h => h.rating)),
      ...(kitDoc.practiceState?.attempts || []).map(a => a.confidence)
    ];

    const overallProficiencyScore = allRecordedRatings.length === 0
      ? 0
      : Math.round((allRecordedRatings.reduce((sum, r) => sum + r, 0) / (allRecordedRatings.length * 5)) * 100);

    let summaryMessage = 'Start practicing questions or flashcards to unlock real-time weak spot detection!';
    if (weakSpots.length > 0) {
      summaryMessage = `Attention Needed: You have ${weakSpots.length} requirement areas with low confidence. Review the recommended questions below to shore up knowledge gaps.`;
    } else if (strengths.length > 0) {
      summaryMessage = `Outstanding Progress! You are demonstrating high retention across practiced areas. Keep up the review routine!`;
    }

    return {
      overallProficiencyScore,
      totalCardsPracticed: allRecordedRatings.length,
      totalUniqueCards,
      completionRate,
      weakSpots,
      strengths,
      summaryMessage
    };
  }
}
