/**
 * Set Admin Password Script
 * Manually sets password for admin user
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setAdminPassword() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inheritx.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  console.log('🔧 Setting admin password...');
  console.log('📧 Looking for admin with email:', adminEmail);

  // Find admin by email
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    console.error('❌ Admin user not found with email:', adminEmail);
    console.log('💡 Available users:');
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, walletAddress: true },
    });
    console.table(allUsers);
    process.exit(1);
  }

  // Check if user is admin
  if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
    console.error('❌ User is not an admin. Role:', admin.role);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hashedPassword },
  });

  console.log('✅ Password set successfully!');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('⚠️  Please change the password after first login!');
}

setAdminPassword()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
