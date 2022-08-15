import 'dotenv/config';
import { getMovieBriefInfo, getMovieDetails, handleDataExpiry } from './services/movie/movie';
import { initDatabase } from './utils/database';
import logger from './utils/logger';

async function main(remainingRetry: number): Promise<void> {
  // TODO: set up yaml script
  if (!process.env.MONGODB_URI) {
    throw new Error('Database connection credentials not provided');
  }
  try {
    logger.info('start cron job');
    await initDatabase(process.env.MONGODB_URI);
    const movieBriefInfo = await getMovieBriefInfo();
    await getMovieDetails(movieBriefInfo);
    await handleDataExpiry(movieBriefInfo);
    logger.info('end cron job');
  } catch (err) {
    logger.error(err);
    console.log('here1');
    if (remainingRetry > 0) {
      console.log('here2');
      remainingRetry -= 1;
      logger.info(`retying cron job:: tried ${maxRetry - remainingRetry} times`);
      main(remainingRetry);
    } else {
      logger.info(`cron job failed after ${maxRetry - remainingRetry} retries`);
      // send email alert
    }
  }
}

const maxRetry = 1;
main(maxRetry);
