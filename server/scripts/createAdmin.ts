/**
 * Create Admin User Script
 * Creates a new admin user or promotes an existing one
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@inheritx.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminWallet = process.env.ADMIN_WALLET || '0x0000000000000000000000000000000000000001';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    console.log('🔧 Starting admin user creation...');
    console.log('📧 Target Email:', adminEmail);
    console.log('💼 Target Wallet:', adminWallet);

    // 1. Check for existing user by Email
    const existingByEmail = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    // 2. Check for existing user by Wallet
    const existingByWallet = await prisma.user.findUnique({
        where: { walletAddress: adminWallet },
    });

    // Decide what to do
    let targetUser = existingByEmail || existingByWallet;

    if (existingByEmail && existingByWallet && existingByEmail.id !== existingByWallet.id) {
        console.error('❌ Conflict: Email and Wallet belong to different users!');
        console.log('Email User ID:', existingByEmail.id);
        console.log('Wallet User ID:', existingByWallet.id);
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (targetUser) {
        console.log(`ℹ️  User found (ID: ${targetUser.id}). Updating to Admin...`);

        // Update existing user
        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: {
                email: adminEmail, // Ensure email is set/correct
                walletAddress: adminWallet, // Ensure wallet is set/correct
                password: hashedPassword,
                name: targetUser.name || adminName,
                role: 'SUPER_ADMIN',
                isActive: true,
            },
        });
        console.log('✅ User updated to SUPER_ADMIN successfully!');
    } else {
        console.log('💡 User not found. Creating new Admin user...');

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email: adminEmail,
                walletAddress: adminWallet,
                password: hashedPassword,
                name: adminName,
                role: 'SUPER_ADMIN',
                isActive: true,
            },
        });
        console.log('✅ New SUPER_ADMIN created successfully!');
        console.log('🆔 ID:', newUser.id);
    }

    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the password after first login!');
}

createAdmin()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
