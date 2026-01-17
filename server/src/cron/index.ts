/**
 * Cron Jobs
 * Scheduled tasks for distribution notifications and maintenance
 */

import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { decryptClaimCode } from '../utils/crypto';
import { sendClaimNotification } from '../utils/email';
import { logger } from '../utils/logger';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Process due distributions and send notifications
 * Runs daily at 8:00 AM
 */
async function processDueDistributions() {
  logger.info('🔄 Starting distribution processing cron job...');

  const now = new Date();

  try {
    // Find all plans that are due for distribution
    const duePlans = await prisma.plan.findMany({
      where: {
        status: 'ACTIVE',
        transferDate: { lte: now },
        isClaimedFully: false,
      },
      include: {
        beneficiaries: {
          where: {
            hasClaimed: false,
            notificationSent: false,
          },
        },
      },
    });

    logger.info(`Found ${duePlans.length} plans due for distribution`);

    for (const plan of duePlans) {
      // Process Lump Sum distributions
      if (plan.distributionMethod === 'LUMP_SUM') {
        await processLumpSumDistribution(plan);
      } else {
        // Process periodic distributions
        await processPeriodicDistribution(plan);
      }
    }

    logger.info('✅ Distribution processing completed');
  } catch (error) {
    logger.error('❌ Error processing distributions:', error);
  }
}

/**
 * Process Lump Sum distribution - send notifications to all beneficiaries
 */
async function processLumpSumDistribution(plan: any) {
  logger.info(`Processing lump sum distribution for plan ${plan.id}`);

  // Send notifications to each beneficiary
  for (const beneficiary of plan.beneficiaries) {
    // Decrypt beneficiary's unique claim code
    let claimCode: string;
    try {
      claimCode = decryptClaimCode(beneficiary.claimCodeEncrypted);
    } catch (error) {
      logger.error(`Failed to decrypt claim code for beneficiary ${beneficiary.id}:`, error);
      continue;
    }

    const claimUrl = `${FRONTEND_URL}/claim/${plan.globalPlanId}`;

    const sent = await sendClaimNotification(
      beneficiary.email,
      beneficiary.name,
      plan.planName,
      claimCode,
      beneficiary.allocatedAmount,
      getAssetTypeName(plan.assetType),
      claimUrl,
      plan.globalPlanId
    );

    if (sent) {
      await prisma.beneficiary.update({
        where: { id: beneficiary.id },
        data: {
          notificationSent: true,
          notificationSentAt: new Date(),
        },
      });

      await prisma.activity.create({
        data: {
          planId: plan.id,
          type: 'DISTRIBUTION_NOTIFIED',
          description: `Claim notification sent to ${beneficiary.email}`,
          metadata: { beneficiaryId: beneficiary.id },
        },
      });

      logger.info(`Notification sent to ${beneficiary.email} for plan ${plan.id}`);
    } else {
      logger.error(`Failed to send notification to ${beneficiary.email}`);
    }
  }
}

/**
 * Process periodic distribution - check and send for due periods
 */
async function processPeriodicDistribution(plan: any) {
  logger.info(`Processing periodic distribution for plan ${plan.id}`);

  const now = new Date();

  // Find pending distributions that are due
  const dueDistributions = await prisma.distribution.findMany({
    where: {
      planId: plan.id,
      status: 'PENDING',
      scheduledDate: { lte: now },
    },
    orderBy: { periodNumber: 'asc' },
  });

  if (dueDistributions.length === 0) {
    logger.info(`No due distributions for plan ${plan.id}`);
    return;
  }

  // Process each due distribution
  for (const distribution of dueDistributions) {
    // Send notifications to beneficiaries who haven't been notified for this period
    for (const beneficiary of plan.beneficiaries) {
      // Decrypt beneficiary's unique claim code
      let claimCode: string;
      try {
        claimCode = decryptClaimCode(beneficiary.claimCodeEncrypted);
      } catch (error) {
        logger.error(`Failed to decrypt claim code for beneficiary ${beneficiary.id}:`, error);
        continue;
      }

      const claimUrl = `${FRONTEND_URL}/claim/${plan.globalPlanId}?period=${distribution.periodNumber}`;

      const periodName = getPeriodName(plan.distributionMethod);
      const amount = calculatePeriodAmount(beneficiary.allocatedAmount, plan.periodicPercentage || 100);

      const sent = await sendClaimNotification(
        beneficiary.email,
        beneficiary.name,
        `${plan.planName} - ${periodName} ${distribution.periodNumber}`,
        claimCode,
        amount,
        getAssetTypeName(plan.assetType),
        claimUrl,
        plan.globalPlanId
      );

      if (sent) {
        logger.info(`Period ${distribution.periodNumber} notification sent to ${beneficiary.email}`);
      }
    }

    // Update distribution status
    await prisma.distribution.update({
      where: { id: distribution.id },
      data: {
        status: 'NOTIFIED',
        notificationSent: true,
        notificationSentAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        planId: plan.id,
        type: 'DISTRIBUTION_NOTIFIED',
        description: `Period ${distribution.periodNumber} notifications sent`,
        metadata: {
          periodNumber: distribution.periodNumber,
          amount: distribution.amount,
        },
      },
    });
  }
}

/**
 * Clean up expired email queue entries
 * Runs daily at 2:00 AM
 */
async function cleanupEmailQueue() {
  logger.info('🧹 Cleaning up email queue...');

  try {
    // Delete old failed emails (older than 7 days)
    const deleted = await prisma.emailQueue.deleteMany({
      where: {
        status: 'FAILED',
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    logger.info(`Deleted ${deleted.count} old failed emails`);
  } catch (error) {
    logger.error('Error cleaning up email queue:', error);
  }
}

/**
 * Process pending emails in queue
 * Runs every 5 minutes
 */
async function processEmailQueue() {
  try {
    const pendingEmails = await prisma.emailQueue.findMany({
      where: {
        status: 'PENDING',
        attempts: { lt: prisma.emailQueue.fields.maxAttempts },
        scheduledAt: { lte: new Date() },
      },
      take: 10,
    });

    for (const email of pendingEmails) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { status: 'SENDING', attempts: { increment: 1 } },
      });

      try {
        const { sendEmail } = await import('../utils/email');
        const sent = await sendEmail(email.to, email.subject, email.body, email.htmlBody || undefined);

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: sent ? 'SENT' : 'FAILED',
            sentAt: sent ? new Date() : null,
            lastError: sent ? null : 'Send failed',
          },
        });
      } catch (error: any) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'PENDING',
            lastError: error.message,
          },
        });
      }
    }
  } catch (error) {
    logger.error('Error processing email queue:', error);
  }
}

// Helper functions
function getAssetTypeName(assetType: string): string {
  const names: Record<string, string> = {
    ERC20_TOKEN1: 'ETH',
    ERC20_TOKEN2: 'USDT',
    ERC20_TOKEN3: 'USDC',
  };
  return names[assetType] || assetType;
}

function getPeriodName(method: string): string {
  const names: Record<string, string> = {
    QUARTERLY: 'Quarter',
    YEARLY: 'Year',
    MONTHLY: 'Month',
  };
  return names[method] || 'Period';
}

function calculatePeriodAmount(totalAmount: string, percentage: number): string {
  const total = BigInt(totalAmount);
  const periodAmount = (total * BigInt(percentage)) / BigInt(100);
  return periodAmount.toString();
}

// ============================================
// SCHEDULE CRON JOBS
// ============================================

export function startCronJobs() {
  logger.info('📅 Starting cron jobs...');

  // Process due distributions - daily at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    processDueDistributions();
  });

  // Clean up email queue - daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    cleanupEmailQueue();
  });

  // Process email queue - every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    processEmailQueue();
  });

  logger.info('✅ Cron jobs scheduled');
}

// If running as standalone
if (require.main === module) {
  startCronJobs();
  logger.info('Cron jobs running in standalone mode');
}

export default {
  startCronJobs,
  processDueDistributions,
  cleanupEmailQueue,
  processEmailQueue,
};

