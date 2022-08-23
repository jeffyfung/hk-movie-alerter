import mongoose from 'mongoose';
import logger from '../logger';

export async function initDatabase(connectionStr: string): Promise<void> {
  try {
    await mongoose.connect(connectionStr);
    logger.info('connected to MongoDB');
    throw new Error('test');
  } catch (err: any) {
    logger.error('error connecting to MongoDB; ', err.stack);
    throw new Error(err);
  }
}
