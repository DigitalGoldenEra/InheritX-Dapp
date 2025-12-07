/**
 * Check Admin User Script
 * Verifies admin user exists and has password set
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inheritx.com';

  console.log('🔍 Checking admin user...');
  console.log('📧 Looking for:', adminEmail);

  // Find admin by email
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      walletAddress: true,
      password: true,
      isActive: true,
    },
  });

  if (!admin) {
    console.error('❌ Admin user not found with email:', adminEmail);
    console.log('\n💡 Searching for all admin users...');
    
    const allAdmins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        walletAddress: true,
        password: true,
      },
    });

    if (allAdmins.length === 0) {
      console.log('❌ No admin users found in database');
    } else {
      console.log('\n📋 Found admin users:');
      allAdmins.forEach((a, i) => {
        console.log(`\n${i + 1}. ID: ${a.id}`);
        console.log(`   Email: ${a.email || '(no email)'}`);
        console.log(`   Name: ${a.name || '(no name)'}`);
        console.log(`   Role: ${a.role}`);
        console.log(`   Wallet: ${a.walletAddress}`);
        console.log(`   Password: ${a.password ? '✅ SET' : '❌ NOT SET'}`);
      });
    }
    process.exit(1);
  }

  console.log('\n✅ Admin user found!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ID:', admin.id);
  console.log('Email:', admin.email);
  console.log('Name:', admin.name);
  console.log('Role:', admin.role);
  console.log('Wallet:', admin.walletAddress);
  console.log('Active:', admin.isActive);
  console.log('Password:', admin.password ? '✅ SET' : '❌ NOT SET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!admin.password) {
    console.log('\n⚠️  Password is NOT set!');
    console.log('💡 Run: npm run set:admin:password');
    process.exit(1);
  }

  console.log('\n✅ Admin user is ready for login!');
}

checkAdmin()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
