import mongoose from 'mongoose';
import logger from '../logger';

export async function initDatabase(connectionStr: string): Promise<void> {
  try {
    await mongoose.connect(connectionStr);
    logger.info('connected to MongoDB');
  } catch (err: unknown) {
    let errMsg = 'error connecting to MongoDB; ';
    if (err instanceof Error) errMsg += err.message;
    logger.error(errMsg);
  }
}
