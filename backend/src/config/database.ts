import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err: any) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${config.MONGODB_URI}: ${err.message}`);
    console.warn('[MongoDB Warning] Operating in degraded mode or awaiting database reconnection.');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
