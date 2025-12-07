/**
 * Test Admin Login Script
 * Tests the admin login query to verify password is returned
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAdminLogin() {
  const adminEmail = 'admin@inheritx.com';
  const adminPassword = 'admin123456';

  console.log('🧪 Testing admin login query...');
  console.log('📧 Email:', adminEmail);

  // Simulate the exact query from auth route
  const user = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
    select: {
      id: true,
      walletAddress: true,
      email: true,
      password: true,
      name: true,
      role: true,
      isActive: true,
      kyc: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!user) {
    console.error('❌ User not found');
    process.exit(1);
  }

  console.log('\n✅ User found:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ID:', user.id);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Password field:', user.password ? `✅ SET (${user.password.substring(0, 20)}...)` : '❌ NULL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!user.password) {
    console.error('\n❌ Password field is NULL in query result!');
    process.exit(1);
  }

  // Test password verification
  const isValid = await bcrypt.compare(adminPassword, user.password);
  console.log('\n🔐 Password verification:', isValid ? '✅ VALID' : '❌ INVALID');

  if (!isValid) {
    console.error('\n❌ Password does not match!');
    process.exit(1);
  }

  console.log('\n✅ Admin login test passed!');
}

testAdminLogin()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
