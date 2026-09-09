import { Request, Response, NextFunction } from 'express';
import { KitModel } from '../models/Kit.js';
import { PracticeService } from '../services/practice/practiceService.js';

export class PracticeController {
  public static async recordConfidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const flashcardId = req.params.flashcardId as string;
      const { rating } = req.body;
      const userId = req.user!._id.toString();

      const kitDoc = await KitModel.findById(id);
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

      const updated = await PracticeService.recordConfidence(kitDoc, flashcardId, rating);

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

  public static async getNextPracticeQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();

      const kitDoc = await KitModel.findById(id);
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

      const queue = PracticeService.getPrioritizedQueue(kitDoc);

      res.status(200).json({
        success: true,
        data: { queue }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getWeakSpotsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id.toString();

      const kitDoc = await KitModel.findById(id);
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
