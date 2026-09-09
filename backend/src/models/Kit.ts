import mongoose, { Document, Schema, Types } from 'mongoose';
import { Kit as IKitData } from '../types/kit.js';
import { GenerationState } from '../types/pipeline.js';

export interface IPracticeCard {
  flashcardId: string;
  confidenceHistory: Array<{
    rating: number; // 1 to 5
    practicedAt: Date;
  }>;
  lastRating?: number;
  lastPracticedAt?: Date;
  practiceCount: number;
}

export interface IPracticeState {
  cards: IPracticeCard[];
  totalSessions: number;
}

export interface IKitDocument extends Document {
  userId: Types.ObjectId;
  status: 'queued' | 'running' | 'completed' | 'failed';
  input: {
    jd: string;
    company_url: string;
    days: number;
  };
  inputFingerprint: string;
  kit: IKitData;
  generationState: GenerationState;
  practiceState: IPracticeState;
  createdAt: Date;
  updatedAt: Date;
}

const StepSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
      default: 'pending'
    },
    startedAt: { type: String },
    completedAt: { type: String },
    error: { type: String }
  },
  { _id: false }
);

const PracticeCardSchema = new Schema(
  {
    flashcardId: { type: String, required: true },
    confidenceHistory: [
      {
        rating: { type: Number, min: 1, max: 5 },
        practicedAt: { type: Date, default: Date.now }
      }
    ],
    lastRating: { type: Number, min: 1, max: 5 },
    lastPracticedAt: { type: Date },
    practiceCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const KitSchemaModel = new Schema<IKitDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
      index: true
    },
    input: {
      jd: { type: String, required: true },
      company_url: { type: String, required: true },
      days: { type: Number, required: true, min: 1, max: 60 }
    },
    inputFingerprint: {
      type: String,
      required: true,
      index: true
    },
    kit: {
      type: Schema.Types.Mixed,
      default: {}
    },
    generationState: {
      status: {
        type: String,
        enum: ['queued', 'running', 'completed', 'failed'],
        default: 'queued'
      },
      currentStep: { type: String, default: '' },
      progress: { type: Number, default: 0 },
      steps: [StepSchema],
      error: {
        code: { type: String },
        message: { type: String }
      }
    },
    practiceState: {
      cards: [PracticeCardSchema],
      totalSessions: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Compound Index for fast user kit retrieval sorted by creation date
KitSchemaModel.index({ userId: 1, createdAt: -1 });
// Compound Index for duplicate detection
KitSchemaModel.index({ userId: 1, inputFingerprint: 1 });

export const KitModel = mongoose.model<IKitDocument>('Kit', KitSchemaModel);
