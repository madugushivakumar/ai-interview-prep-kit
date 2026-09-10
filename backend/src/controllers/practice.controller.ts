import { Request, Response, NextFunction } from 'express';
import { KitModel } from '../models/Kit.js';
import { PracticeService } from '../services/practice/practiceService.js';

export class PracticeController {
  /**
   * Helper to verify user ownership of a kit
   */
  private static async findUserKit(id: string | string[] | undefined, userId: string) {
    const actualId = Array.isArray(id) ? id[0] : id;
    const kitDoc = actualId ? await KitModel.findById(actualId) : null;
    if (!kitDoc) {
      const err: any = new Error('Kit not found');
      err.statusCode = 404;
      throw err;
    }

    if (kitDoc.userId.toString() !== userId) {
      const err: any = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    return kitDoc;
  }

  /**
   * Record practice attempt for either a question or flashcard
   * POST /api/practice/:id/attempt
   */
  public static async recordAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      const { itemId, itemType, category, confidence, answerText, notes } = req.body;

      const updated = await PracticeService.recordAttempt(kitDoc, {
        itemId,
        itemType: itemType || 'question',
        category,
        confidence,
        answerText,
        notes
      });

      res.status(200).json({
        success: true,
        data: {
          practiceState: updated.practiceState
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Legacy Flashcard confidence rating
   * POST /api/practice/:id/confidence/:flashcardId
   */
  public static async recordConfidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, flashcardId } = req.params;
      const actualCardId = Array.isArray(flashcardId) ? flashcardId[0] : flashcardId;
      const { rating } = req.body;
      const userId = req.user!._id.toString();

      const kitDoc = await PracticeController.findUserKit(id, userId);
      const updated = await PracticeService.recordConfidence(kitDoc, actualCardId, rating);

      res.status(200).json({
        success: true,
        data: {
          practiceState: updated.practiceState
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get dynamic practice session queue by mode (all, technical, behavioural, system-design, company-fit, must, weak, etc.)
   * GET /api/practice/:id/session
   */
  public static async getPracticeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      const mode = (req.query.mode as string) || 'all';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const sessionData = PracticeService.getPracticeQueue(kitDoc, { mode, limit });

      res.status(200).json({
        success: true,
        data: sessionData
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Legacy prioritized flashcards queue
   * GET /api/practice/:id/next
   */
  public static async getNextPracticeQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      const queue = PracticeService.getPrioritizedQueue(kitDoc);

      res.status(200).json({
        success: true,
        data: { queue }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get practice progress analytics
   * GET /api/practice/:id/progress
   */
  public static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      const progress = PracticeService.getPracticeProgress(kitDoc);

      res.status(200).json({
        success: true,
        data: { progress }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save personal user notes for a question or flashcard
   * PATCH /api/practice/:id/notes/:itemId
   */
  public static async saveNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const actualItemId = Array.isArray(itemId) ? itemId[0] : itemId;
      const { notes } = req.body;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      await PracticeService.saveItemNote(kitDoc, actualItemId, notes || '');

      res.status(200).json({
        success: true,
        data: { message: 'Note saved successfully.' }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle star/pinned on a practice item
   * POST /api/practice/:id/star/:itemId
   */
  public static async toggleStar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, itemId } = req.params;
      const actualItemId = Array.isArray(itemId) ? itemId[0] : itemId;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      const isStarred = await PracticeService.toggleStar(kitDoc, actualItemId);

      res.status(200).json({
        success: true,
        data: { isStarred }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get weak spots report
   * GET /api/practice/:id/weak-spots
   */
  public static async getWeakSpotsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();
      const kitDoc = await PracticeController.findUserKit(id, userId);

      const report = PracticeService.generateWeakSpotsReport(kitDoc);

      res.status(200).json({
        success: true,
        data: { report }
      });
    } catch (err) {
      next(err);
    }
  }
}
