import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { KitModel, IKitDocument } from '../models/Kit.js';
import { runInterviewPipeline } from '../services/pipeline/interviewPipeline.js';
import { StatePreserver } from '../services/pipeline/statePreserver.js';
import { LLMFactory } from '../services/llm/llm.factory.js';
import { Question, Flashcard, QuestionCategory } from '../types/kit.js';
import { checkCoverage } from '../services/coverage/coverageChecker.js';
import { allocateSchedule } from '../services/scheduling/scheduleAllocator.js';
import { validateFinalKit } from '../services/validation/kitValidator.js';
import { MultiRoleParser } from '../services/batch/multiRoleParser.js';

export class KitController {
  /**
   * Helper to verify user ownership of a kit
   */
  private static async findUserKit(kitId: string | string[] | undefined, userId: string): Promise<IKitDocument> {
    const actualId = Array.isArray(kitId) ? kitId[0] : kitId;
    const kitDoc = actualId ? await KitModel.findById(actualId) : null;
    if (!kitDoc) {
      const err: any = new Error('Interview prep kit not found.');
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (kitDoc.userId.toString() !== userId) {
      const err: any = new Error('Access denied. You do not own this kit.');
      err.code = 'FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }

    return kitDoc;
  }

  /**
   * List user's kits
   */
  public static async listKits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;
      const kits = await KitModel.find({ userId })
        .sort({ createdAt: -1 })
        .select('status input kit.source kit.role.title kit.coverage createdAt updatedAt generationState practiceState');

      res.status(200).json({
        success: true,
        data: { kits }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create kit & launch background pipeline
   */
  public static async createKit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;
      const { jd, company_url, days, forceNew } = req.body;

      // Duplicate fingerprint: SHA-256(normalized URL + normalized JD)
      const normalizedUrl = company_url.toLowerCase().trim().replace(/\/+$/, '');
      const normalizedJd = jd.toLowerCase().replace(/\s+/g, ' ').trim();
      const fingerprint = crypto
        .createHash('sha256')
        .update(`${normalizedUrl}:::${normalizedJd}`)
        .digest('hex');

      if (!forceNew) {
        // 1. Check if user already generated this exact kit
        const existingKit = await KitModel.findOne({
          userId,
          inputFingerprint: fingerprint,
          status: 'completed'
        });

        if (existingKit) {
          res.status(200).json({
            success: true,
            data: {
              kit: existingKit,
              kitId: existingKit._id.toString(),
              isExisting: true,
              message: 'Existing kit matching this job description and company reused.'
            }
          });
          return;
        }

        // 2. Prevent simultaneous in-flight runs (double-click defense)
        const runningKit = await KitModel.findOne({
          userId,
          inputFingerprint: fingerprint,
          status: 'running'
        });

        if (runningKit) {
          res.status(202).json({
            success: true,
            data: {
              kitId: runningKit._id.toString(),
              status: 'running',
              isExisting: true,
              message: 'Kit generation is already in progress.'
            }
          });
          return;
        }
      }

      // Create queued kit record
      const kitDoc = await KitModel.create({
        userId,
        status: 'running',
        input: { jd, company_url, days },
        inputFingerprint: fingerprint,
        generationState: {
          status: 'running',
          currentStep: 'Initiating Research Pipeline',
          progress: 5,
          steps: []
        }
      });

      // Respond immediately with queued kit ID
      res.status(202).json({
        success: true,
        data: {
          kitId: kitDoc._id.toString(),
          status: 'running',
          message: 'Kit generation initiated.'
        }
      });

      // Execute pipeline asynchronously
      (async () => {
        try {
          const generatedKit = await runInterviewPipeline(
            { jd, company_url, days },
            {
              onProgress: async (stepName, progress) => {
                await KitModel.findByIdAndUpdate(kitDoc._id, {
                  'generationState.currentStep': stepName,
                  'generationState.progress': progress,
                  $push: {
                    'generationState.steps': {
                      name: stepName,
                      status: 'completed',
                      completedAt: new Date().toISOString()
                    }
                  }
                });
              }
            }
          );

          await KitModel.findByIdAndUpdate(kitDoc._id, {
            status: 'completed',
            kit: generatedKit,
            'generationState.status': 'completed',
            'generationState.progress': 100,
            'generationState.currentStep': 'Completed'
          });
        } catch (pipelineErr: any) {
          await KitModel.findByIdAndUpdate(kitDoc._id, {
            status: 'failed',
            'generationState.status': 'failed',
            'generationState.error': {
              code: pipelineErr.code || 'PIPELINE_ERROR',
              message: pipelineErr.message || 'Generation failed'
            }
          });
        }
      })();
    } catch (err) {
      next(err);
    }
  }

  /**
   * Batch Kit Creation (Multi-Role Support)
   * Generates independent Kit records for each role; partial failure does not corrupt successful roles.
   */
  public static async createBatchKits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id;
      const { roles, forceNew } = req.body as {
        roles: Array<{ id?: string; jd: string; company_url: string; days: number }>;
        forceNew?: boolean;
      };

      const batchResponses: Array<{
        id: string;
        kitId: string;
        status: string;
        isExisting?: boolean;
      }> = [];

      for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const roleId = role.id || `role-${i + 1}`;
        const normalizedUrl = role.company_url.toLowerCase().trim().replace(/\/+$/, '');
        const normalizedJd = role.jd.toLowerCase().replace(/\s+/g, ' ').trim();
        const fingerprint = crypto
          .createHash('sha256')
          .update(`${normalizedUrl}:::${normalizedJd}`)
          .digest('hex');

        if (!forceNew) {
          const existing = await KitModel.findOne({
            userId,
            inputFingerprint: fingerprint,
            status: 'completed'
          });
          if (existing) {
            batchResponses.push({
              id: roleId,
              kitId: existing._id.toString(),
              status: 'completed',
              isExisting: true
            });
            continue;
          }

          const running = await KitModel.findOne({
            userId,
            inputFingerprint: fingerprint,
            status: 'running'
          });
          if (running) {
            batchResponses.push({
              id: roleId,
              kitId: running._id.toString(),
              status: 'running',
              isExisting: true
            });
            continue;
          }
        }

        const kitDoc = await KitModel.create({
          userId,
          status: 'running',
          input: { jd: role.jd, company_url: role.company_url, days: role.days || 5 },
          inputFingerprint: fingerprint,
          generationState: {
            status: 'running',
            currentStep: 'Initiating Pipeline',
            progress: 5,
            steps: []
          }
        });

        batchResponses.push({
          id: roleId,
          kitId: kitDoc._id.toString(),
          status: 'running'
        });

        // Launch independent pipeline
        (async () => {
          try {
            const generatedKit = await runInterviewPipeline(
              { jd: role.jd, company_url: role.company_url, days: role.days || 5 },
              {
                onProgress: async (stepName, progress) => {
                  await KitModel.findByIdAndUpdate(kitDoc._id, {
                    'generationState.currentStep': stepName,
                    'generationState.progress': progress,
                    $push: {
                      'generationState.steps': {
                        name: stepName,
                        status: 'completed',
                        completedAt: new Date().toISOString()
                      }
                    }
                  });
                }
              }
            );

            await KitModel.findByIdAndUpdate(kitDoc._id, {
              status: 'completed',
              kit: generatedKit,
              'generationState.status': 'completed',
              'generationState.progress': 100,
              'generationState.currentStep': 'Completed'
            });
          } catch (pipelineErr: any) {
            await KitModel.findByIdAndUpdate(kitDoc._id, {
              status: 'failed',
              'generationState.status': 'failed',
              'generationState.error': {
                code: pipelineErr.code || 'PIPELINE_ERROR',
                message: pipelineErr.message || 'Generation failed'
              }
            });
          }
        })();
      }

      res.status(202).json({
        success: true,
        data: {
          items: batchResponses,
          total: batchResponses.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Multi-Role File Upload (JSON / CSV parsing with preview support)
   */
  public static async uploadMultiRoleFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isPreviewOnly = req.query.preview === 'true';
      let content = '';

      if (typeof req.body === 'string') {
        content = req.body;
      } else if (req.body?.content) {
        content = req.body.content;
      } else if (req.body?.file) {
        content = req.body.file;
      } else {
        content = JSON.stringify(req.body);
      }

      const fileName = (req.query.filename as string) || req.body?.fileName || 'upload.json';
      const format = (req.query.format as any) || (fileName.endsWith('.csv') ? 'csv' : 'json');

      const parsed = MultiRoleParser.parse(content, { format, fileName });

      if (!parsed.success && parsed.roles.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_PARSE_ERROR',
            message: 'Failed to parse roles from uploaded file.',
            details: { errors: parsed.errors, warnings: parsed.warnings }
          }
        });
        return;
      }

      if (isPreviewOnly) {
        res.status(200).json({
          success: true,
          data: {
            roles: parsed.roles,
            errors: parsed.errors,
            warnings: parsed.warnings,
            totalRows: parsed.totalRows
          }
        });
        return;
      }

      req.body = { roles: parsed.roles };
      return KitController.createBatchKits(req, res, next);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get full kit details
   */
  public static async getKitById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: { kit: kitDoc }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete kit
   */
  public static async deleteKit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      await kitDoc.deleteOne();
      res.status(200).json({
        success: true,
        data: { message: 'Kit deleted successfully.' }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get generation status (polling endpoint)
   */
  public static async getGenerationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: {
          status: kitDoc.status,
          generationState: kitDoc.generationState
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Inline Edit: Company Brief
   */
  public static async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { summary, what_they_do, industry, mission, values, products_services } = req.body;

      if (summary !== undefined) kitDoc.kit.company_brief.summary = summary;
      if (what_they_do !== undefined) kitDoc.kit.company_brief.what_they_do = what_they_do;
      if (industry !== undefined) kitDoc.kit.company_brief.industry = industry;
      if (mission !== undefined) kitDoc.kit.company_brief.mission = mission;
      if (values !== undefined) kitDoc.kit.company_brief.values = values;
      if (products_services !== undefined) kitDoc.kit.company_brief.products_services = products_services;

      kitDoc.markModified('kit.company_brief');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { company_brief: kitDoc.kit.company_brief }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Company Brief and Sources
   */
  public static async getCompanyBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      res.status(200).json({
        success: true,
        data: {
          company: kitDoc.kit?.source?.company || 'Company',
          company_url: kitDoc.kit?.source?.company_url,
          company_brief: kitDoc.kit?.company_brief
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Inline Edit: Role
   */
  public static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { title, seniority, responsibilities, requirements } = req.body;

      kitDoc.kit.role.title = title;
      kitDoc.kit.role.seniority = seniority;
      kitDoc.kit.role.responsibilities = responsibilities;

      if (requirements && Array.isArray(requirements)) {
        kitDoc.kit.role.requirements = requirements;

        // Clean any dangling requirement references from questions & flashcards
        const validReqIds = new Set(requirements.map(r => r.id));
        kitDoc.kit.questions.forEach(q => {
          q.requirement_ids = q.requirement_ids.filter(id => validReqIds.has(id));
        });
        kitDoc.kit.flashcards.forEach(f => {
          f.requirement_ids = f.requirement_ids.filter(id => validReqIds.has(id));
        });

        // Recalculate deterministic coverage
        const cov = checkCoverage(kitDoc.kit.role.requirements, kitDoc.kit.questions);
        kitDoc.kit.coverage = {
          uncovered_requirement_ids: cov.uncovered_requirement_ids,
          passes: kitDoc.kit.coverage?.passes || 1
        };

        // Recalculate deterministic schedule
        kitDoc.kit.schedule = allocateSchedule({
          days: kitDoc.kit.schedule.days_available,
          requirements: kitDoc.kit.role.requirements,
          questions: kitDoc.kit.questions
        });

        kitDoc.markModified('kit.questions');
        kitDoc.markModified('kit.flashcards');
        kitDoc.markModified('kit.coverage');
        kitDoc.markModified('kit.schedule');
      }

      validateFinalKit(kitDoc.kit);

      kitDoc.markModified('kit.role');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { role: kitDoc.kit.role, kit: kitDoc.kit }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add a new question manually
   */
  public static async addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { prompt, answer_outline, category, difficulty, requirement_ids } = req.body;

      const nextId = `q_user_${Date.now()}`;
      const newQuestion: Question = {
        id: nextId,
        prompt,
        answer_outline,
        category,
        difficulty,
        requirement_ids: requirement_ids || [],
        metadata: {
          source: 'user',
          isEdited: false,
          isPinned: true
        }
      };

      kitDoc.kit.questions.push(newQuestion);
      kitDoc.markModified('kit.questions');
      await kitDoc.save();

      res.status(201).json({
        success: true,
        data: { question: newQuestion }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update question (edit prompt, outline, or pin)
   */
  public static async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { questionId } = req.params;
      const { prompt, answer_outline, difficulty, category, isPinned, requirement_ids } = req.body;

      const qIndex = kitDoc.kit.questions.findIndex(q => q.id === questionId);
      if (qIndex === -1) {
        const err: any = new Error('Question not found');
        err.statusCode = 404;
        throw err;
      }

      const q = kitDoc.kit.questions[qIndex];
      if (prompt !== undefined) q.prompt = prompt;
      if (answer_outline !== undefined) q.answer_outline = answer_outline;
      if (difficulty !== undefined) q.difficulty = difficulty;
      if (category !== undefined) q.category = category;
      if (requirement_ids !== undefined) q.requirement_ids = requirement_ids;

      if (!q.metadata) {
        q.metadata = { source: 'generated', isEdited: true, isPinned: Boolean(isPinned) };
      } else {
        q.metadata.isEdited = true;
        if (isPinned !== undefined) q.metadata.isPinned = isPinned;
      }

      kitDoc.markModified('kit.questions');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { question: q }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete question
   */
  public static async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { questionId } = req.params;
      const qId = Array.isArray(questionId) ? questionId[0] : questionId;

      kitDoc.kit.questions = kitDoc.kit.questions.filter(q => q.id !== qId);
      // Also remove from schedule
      kitDoc.kit.schedule.days.forEach(d => {
        d.question_ids = d.question_ids.filter(id => id !== qId);
      });

      // Recalculate deterministic coverage
      if (kitDoc.kit.role?.requirements) {
        const cov = checkCoverage(kitDoc.kit.role.requirements, kitDoc.kit.questions);
        kitDoc.kit.coverage = {
          uncovered_requirement_ids: cov.uncovered_requirement_ids,
          passes: kitDoc.kit.coverage?.passes || 1
        };
        kitDoc.markModified('kit.coverage');
      }

      // Clean up practice state so no dangling question references exist
      if (kitDoc.practiceState?.itemProgress?.[qId]) {
        delete kitDoc.practiceState.itemProgress[qId];
        kitDoc.markModified('practiceState');
      }

      validateFinalKit(kitDoc.kit);

      kitDoc.markModified('kit.questions');
      kitDoc.markModified('kit.schedule');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { message: 'Question deleted successfully.' }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reorder questions
   */
  public static async reorderQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { questionIds } = req.body;

      const qMap = new Map(kitDoc.kit.questions.map(q => [q.id, q]));
      const reordered: Question[] = [];

      for (const id of questionIds) {
        const q = qMap.get(id);
        if (q) reordered.push(q);
      }

      // Append any questions not explicitly in the order list
      kitDoc.kit.questions.forEach(q => {
        if (!questionIds.includes(q.id)) reordered.push(q);
      });

      kitDoc.kit.questions = reordered;
      kitDoc.markModified('kit.questions');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { questions: kitDoc.kit.questions }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Move question between categories
   */
  public static async moveQuestionCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { questionId } = req.params;
      const { category } = req.body;

      const q = kitDoc.kit.questions.find(item => item.id === questionId);
      if (!q) {
        const err: any = new Error('Question not found');
        err.statusCode = 404;
        throw err;
      }

      q.category = category;
      if (!q.metadata) {
        q.metadata = { source: 'generated', isEdited: true };
      } else {
        q.metadata.isEdited = true;
      }

      kitDoc.markModified('kit.questions');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { question: q }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Targeted Regeneration: Question Category (Preserving user edits & pins)
   */
  public static async regenerateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { category } = req.params;

      let normalizedCategory: QuestionCategory;
      const rawCat = Array.isArray(category) ? category[0] : category;
      const catLower = (typeof rawCat === 'string' ? rawCat : '').toLowerCase().trim();
      if (catLower === 'technical') {
        normalizedCategory = 'technical';
      } else if (catLower === 'behavioural' || catLower === 'behavioral') {
        normalizedCategory = 'behavioural';
      } else if (catLower === 'system-design' || catLower === 'system' || catLower === 'systemdesign') {
        normalizedCategory = 'system-design';
      } else if (catLower === 'company-fit' || catLower === 'company' || catLower === 'companyfit') {
        normalizedCategory = 'company-fit';
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: `Invalid question category: "${category}". Expected: "technical", "behavioural", "system-design", or "company-fit".`
          }
        });
        return;
      }

      const llm = LLMFactory.getProvider();

      const updatedKit = await StatePreserver.regenerateCategory({
        kit: kitDoc.kit,
        category: normalizedCategory,
        llm
      });

      kitDoc.kit = updatedKit;
      kitDoc.markModified('kit');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { kit: kitDoc.kit }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Targeted Regeneration: Company Brief
   */
  public static async regenerateCompanyBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const llm = LLMFactory.getProvider();

      const updatedKit = await StatePreserver.regenerateCompanyBrief({
        kit: kitDoc.kit,
        llm
      });

      kitDoc.kit = updatedKit;
      kitDoc.markModified('kit');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { company_brief: kitDoc.kit.company_brief }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Targeted Regeneration: Schedule
   */
  public static async regenerateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const updatedKit = StatePreserver.regenerateSchedule(kitDoc.kit);

      kitDoc.kit = updatedKit;
      kitDoc.markModified('kit.schedule');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { schedule: kitDoc.kit.schedule }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add flashcard
   */
  public static async addFlashcard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { front, back, requirement_ids } = req.body;

      const newCard: Flashcard = {
        id: `f_user_${Date.now()}`,
        front,
        back,
        requirement_ids: requirement_ids || [],
        metadata: {
          source: 'user',
          isEdited: false
        }
      };

      kitDoc.kit.flashcards.push(newCard);
      kitDoc.markModified('kit.flashcards');
      await kitDoc.save();

      res.status(201).json({
        success: true,
        data: { flashcard: newCard }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update flashcard
   */
  public static async updateFlashcard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { flashcardId } = req.params;
      const { front, back, requirement_ids } = req.body;

      const card = kitDoc.kit.flashcards.find(f => f.id === flashcardId);
      if (!card) {
        const err: any = new Error('Flashcard not found');
        err.statusCode = 404;
        throw err;
      }

      if (front !== undefined) card.front = front;
      if (back !== undefined) card.back = back;
      if (requirement_ids !== undefined) card.requirement_ids = requirement_ids;

      if (!card.metadata) {
        card.metadata = { source: 'generated', isEdited: true };
      } else {
        card.metadata.isEdited = true;
      }

      kitDoc.markModified('kit.flashcards');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { flashcard: card }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete flashcard
   */
  public static async deleteFlashcard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kitDoc = await KitController.findUserKit(req.params.id, req.user!._id.toString());
      const { flashcardId } = req.params;
      const fId = Array.isArray(flashcardId) ? flashcardId[0] : flashcardId;

      kitDoc.kit.flashcards = kitDoc.kit.flashcards.filter(f => f.id !== fId);
      // Clean up practice state so no dangling flashcard IDs exist
      if (kitDoc.practiceState?.cards) {
        kitDoc.practiceState.cards = kitDoc.practiceState.cards.filter(c => c.flashcardId !== fId);
        kitDoc.markModified('practiceState');
      }
      if (kitDoc.practiceState?.itemProgress?.[fId]) {
        delete kitDoc.practiceState.itemProgress[fId];
        kitDoc.markModified('practiceState');
      }

      validateFinalKit(kitDoc.kit);

      kitDoc.markModified('kit.flashcards');
      await kitDoc.save();

      res.status(200).json({
        success: true,
        data: { message: 'Flashcard deleted successfully.' }
      });
    } catch (err) {
      next(err);
    }
  }
}

