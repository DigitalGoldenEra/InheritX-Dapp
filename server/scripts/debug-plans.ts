
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plans = await prisma.plan.findMany({
        where: {
            status: 'ACTIVE',
            distributionMethod: 'LUMP_SUM',
        },
        select: {
            id: true,
            planName: true,
            globalPlanId: true,
        }
    });

    console.log('Plans:', JSON.stringify(plans, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
