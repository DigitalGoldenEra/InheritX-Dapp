import { processDueDistributions } from '../src/cron';
import { prisma } from '../src/utils/prisma';
import { logger } from '../src/utils/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the server root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    logger.info('🚀 Manually triggering distribution scheduler...');

    try {
        // Connect to database
        await prisma.$connect();

        // Run the distribution logic
        // This looks for all plans with transferDate <= NOW that haven't been fully claimed
        // ensuring "yesterday's" missed schedules are processed.
        await processDueDistributions();

        logger.info('✅ Manual trigger completed successfully');
    } catch (error) {
        logger.error('❌ Manual trigger failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
