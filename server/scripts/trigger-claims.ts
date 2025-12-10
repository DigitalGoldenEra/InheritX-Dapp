
/**
 * Test Script to Trigger Claim Notifications
 * 
 * Usage: npx ts-node scripts/trigger-claims.ts
 */

import { PrismaClient } from '@prisma/client';
import { sendClaimNotification } from '../src/utils/email';
import { decryptClaimCode } from '../src/utils/crypto';

const prisma = new PrismaClient();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function main() {
    const args = process.argv.slice(2);
    const shouldReset = args.includes('--reset');

    if (shouldReset) {
        console.log('🔄 Resetting notification status for all beneficiaries...');
        await prisma.beneficiary.updateMany({
            data: {
                notificationSent: false,
                notificationSentAt: null
            }
        });
        console.log('✓ Reset complete. Running claim check...');
    }

    console.log('🔍 Checking for claimable plans...');

    const now = new Date();

    // Find all active plans that have reached transfer date
    const claimablePlans = await prisma.plan.findMany({
        where: {
            status: 'ACTIVE',
            transferDate: {
                lte: now,
            },
            distributionMethod: 'LUMP_SUM',
        },
        include: {
            beneficiaries: {
                where: {
                    notificationSent: false,
                    hasClaimed: false,
                },
            },
        },
    });

    console.log(`Found ${claimablePlans.length} plans with potential claims.`);

    for (const plan of claimablePlans) {
        if (plan.beneficiaries.length === 0) continue;

        console.log(`\nProcessing Plan: ${plan.planName} (${plan.id})`);

        // Decrypt claim code
        let claimCode: string;
        try {
            claimCode = decryptClaimCode(plan.claimCodeEncrypted);
        } catch (error) {
            console.error(`Failed to decrypt claim code for plan ${plan.id}:`, error);
            continue;
        }

        for (const beneficiary of plan.beneficiaries) {
            console.log(`  - Notifying: ${beneficiary.name} (${beneficiary.email})`);

            try {
                // Calculate amount for display
                // Asset amount is stored as string in plan, e.g. "100"
                // Allocated percentage is in basis points (10000 = 100%)
                const planAmount = parseFloat(plan.assetAmount);
                const beneficiaryAmount = (planAmount * beneficiary.allocatedPercentage) / 10000;

                // Determine asset symbol
                let assetSymbol = 'Tokens';
                switch (plan.assetType) {
                    case 'ERC20_TOKEN1': assetSymbol = 'WETH (Mock)'; break;
                    case 'ERC20_TOKEN2': assetSymbol = 'USDT (Mock)'; break;
                    case 'ERC20_TOKEN3': assetSymbol = 'USDC (Mock)'; break;
                }

                const claimUrl = plan.globalPlanId
                    ? `${FRONTEND_URL}/claim/${plan.globalPlanId}`
                    : `${FRONTEND_URL}/claim`; // Fallback if globalPlanId is missing

                const sent = await sendClaimNotification(
                    beneficiary.email,
                    beneficiary.name,
                    plan.planName,
                    claimCode,
                    beneficiaryAmount.toString(),
                    assetSymbol,
                    claimUrl,
                    plan.globalPlanId || undefined
                );

                if (sent) {
                    // Update beneficiary notification status
                    await prisma.beneficiary.update({
                        where: { id: beneficiary.id },
                        data: {
                            notificationSent: true,
                            notificationSentAt: new Date(),
                        },
                    });

                    // Log activity
                    await prisma.activity.create({
                        data: {
                            planId: plan.id,
                            type: 'DISTRIBUTION_NOTIFIED',
                            description: `Claim notification sent to ${beneficiary.name}`,
                            metadata: {
                                beneficiaryId: beneficiary.id,
                                email: beneficiary.email,
                            },
                        },
                    });

                    console.log('    ✓ Email sent and logged');
                } else {
                    console.error('    ✗ Failed to send email');
                }
            } catch (error) {
                console.error(`    Error processing beneficiary ${beneficiary.id}:`, error);
            }
        }
    }

    console.log('\n✨ Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
