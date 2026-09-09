import { IKitDocument, IPracticeCard } from '../../models/Kit.js';
import { Flashcard, Question } from '../../types/kit.js';

export interface WeakSpotItem {
  requirementId: string;
  requirementText: string;
  kind: string;
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

export class PracticeService {
  /**
   * Records a user's confidence rating (1-5) on a specific flashcard.
   */
  public static async recordConfidence(
    kitDoc: IKitDocument,
    flashcardId: string,
    rating: number
  ): Promise<IKitDocument> {
    if (!kitDoc.practiceState) {
      kitDoc.practiceState = { cards: [], totalSessions: 0 };
    }

    let cardEntry = kitDoc.practiceState.cards.find(c => c.flashcardId === flashcardId);

    if (!cardEntry) {
      cardEntry = {
        flashcardId,
        confidenceHistory: [],
        lastRating: rating,
        lastPracticedAt: new Date(),
        practiceCount: 0
      };
      kitDoc.practiceState.cards.push(cardEntry);
    }

    cardEntry.confidenceHistory.push({
      rating,
      practicedAt: new Date()
    });
    cardEntry.lastRating = rating;
    cardEntry.lastPracticedAt = new Date();
    cardEntry.practiceCount += 1;

    kitDoc.practiceState.totalSessions += 1;
    kitDoc.markModified('practiceState');
    await kitDoc.save();

    return kitDoc;
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

    return [...flashcards].sort((a, b) => {
      const pA = practiceMap.get(a.id);
      const pB = practiceMap.get(b.id);

      const ratingA = pA?.lastRating ?? 0; // 0 means never practiced
      const ratingB = pB?.lastRating ?? 0;

      // 0 (never practiced) has highest priority, then 1, then 2, etc.
      if (ratingA !== ratingB) {
        if (ratingA === 0) return -1;
        if (ratingB === 0) return 1;
        return ratingA - ratingB; // Ascending: lowest confidence first
      }

      // If same rating, sort by least practiced count
      const countA = pA?.practiceCount ?? 0;
      const countB = pB?.practiceCount ?? 0;
      return countA - countB;
    });
  }

  /**
   * Generates the Creative Feature: Weak Spots Report & Targeted Revision Plan
   */
  public static generateWeakSpotsReport(kitDoc: IKitDocument): WeakSpotsReport {
    const flashcards: Flashcard[] = kitDoc.kit?.flashcards || [];
    const requirements = kitDoc.kit?.role?.requirements || [];
    const questions: Question[] = kitDoc.kit?.questions || [];
    const practiceCards = kitDoc.practiceState?.cards || [];

    const practiceMap = new Map<string, IPracticeCard>();
    practiceCards.forEach(c => practiceMap.set(c.flashcardId, c));

    // Map requirements to their linked flashcards and confidence
    const reqAnalysis = requirements.map(req => {
      const linkedCards = flashcards.filter(f => f.requirement_ids?.includes(req.id));
      const ratings: number[] = [];
      let totalPracticeCount = 0;

      linkedCards.forEach(card => {
        const p = practiceMap.get(card.id);
        if (p) {
          totalPracticeCount += p.practiceCount;
          p.confidenceHistory.forEach(h => ratings.push(h.rating));
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

      // Find questions drilling this requirement
      const recommendedQuestions = questions.filter(q => q.requirement_ids?.includes(req.id));

      const item: WeakSpotItem = {
        requirementId: req.id,
        requirementText: req.text,
        kind: req.kind,
        averageRating: avgRating,
        practiceCount: totalPracticeCount,
        status,
        recommendedQuestions
      };

      return item;
    });

    const weakSpots = reqAnalysis.filter(r => r.status === 'critical_weak' || (r.status === 'needs_review' && r.averageRating > 0))
      .sort((a, b) => a.averageRating - b.averageRating);

    const strengths = reqAnalysis.filter(r => r.status === 'proficient' && r.practiceCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating);

    const totalUniqueCards = flashcards.length;
    const cardsPracticedAtLeastOnce = practiceCards.filter(c => c.practiceCount > 0).length;
    const completionRate = totalUniqueCards === 0 
      ? 100 
      : Math.round((cardsPracticedAtLeastOnce / totalUniqueCards) * 100);

    const allRecordedRatings = practiceCards.flatMap(c => c.confidenceHistory.map(h => h.rating));
    const overallProficiencyScore = allRecordedRatings.length === 0
      ? 0
      : Math.round((allRecordedRatings.reduce((sum, r) => sum + r, 0) / (allRecordedRatings.length * 5)) * 100);

    let summaryMessage = 'Start practicing your flashcards to unlock real-time weak spot detection!';
    if (weakSpots.length > 0) {
      summaryMessage = `Attention Needed: You have ${weakSpots.length} requirement areas with low confidence. Review the recommended questions below to shore up knowledge gaps.`;
    } else if (strengths.length > 0) {
      summaryMessage = `Outstanding Progress! You are demonstrating high retention across all practiced areas. Keep up the review routine!`;
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
