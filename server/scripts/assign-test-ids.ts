
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛠 Updating test plans with globalPlanIds...');

    // Update first plan
    await prisma.plan.update({
        where: { id: '48a6f0c8-9cd7-418e-b6e8-2cec9c91ad99' },
        data: { globalPlanId: 101 }
    });
    console.log('Updated 48a6f0... to ID 101');

    // Update second plan
    await prisma.plan.update({
        where: { id: '331606db-c0de-474d-aaf1-f889f3e03fe2' },
        data: { globalPlanId: 102 }
    });
    console.log('Updated 331606... to ID 102');
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
