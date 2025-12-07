/**
 * Database Seed Script
 * Creates initial admin user and settings
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create super admin user
  const adminWallet = '0x0000000000000000000000000000000000000001'; // Replace with actual admin wallet
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inheritx.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'; // Default password
  
  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Check if admin exists by email (more reliable)
  let existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  // If not found by email, try wallet address
  if (!existingAdmin) {
    existingAdmin = await prisma.user.findUnique({
      where: { walletAddress: adminWallet },
    });
  }

  const admin = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          // Always set password if it doesn't exist, or if explicitly updating
          password: existingAdmin.password || hashedPassword,
          email: adminEmail,
          walletAddress: existingAdmin.walletAddress || adminWallet,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        },
      })
    : await prisma.user.create({
        data: {
          walletAddress: adminWallet,
          email: adminEmail,
          password: hashedPassword,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        },
      });

  console.log('✅ Created admin user:', admin.id);
  console.log('📧 Admin Email:', adminEmail);
  console.log('🔑 Admin Password:', adminPassword);
  console.log('⚠️  Please change the default password after first login!');

  // Create default settings
  const settings = [
    { key: 'kyc_required', value: 'true', type: 'boolean' },
    { key: 'max_beneficiaries', value: '10', type: 'number' },
    { key: 'plan_creation_fee_bps', value: '500', type: 'number' },
    { key: 'service_fee_bps', value: '200', type: 'number' },
    { key: 'email_notifications_enabled', value: 'true', type: 'boolean' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Created default settings');

  // Log initial activity
  await prisma.activity.create({
    data: {
      type: 'SYSTEM_EVENT',
      description: 'Database seeded successfully',
    },
  });

  console.log('✅ Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

