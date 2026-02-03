/**
 * Waitlist Routes
 * Handles waitlist signups and admin listing
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     summary: Add a new entry to the waitlist
 *     tags: [Waitlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: Successfully added to waitlist
 *       400:
 *         description: Invalid input or email already exists
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;

        // Validate input
        if (!name || !email) {
            return res.status(400).json({
                error: 'Name and email are required',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
            });
        }

        // Check if email already exists
        const existing = await prisma.waitlist.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
            return res.status(400).json({
                error: 'This email is already on the waitlist',
            });
        }

        // Create waitlist entry
        const entry = await prisma.waitlist.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
            },
        });

        logger.info(`New waitlist signup: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Successfully added to waitlist!',
            data: {
                id: entry.id,
                name: entry.name,
                email: entry.email,
            },
        });
    } catch (error: any) {
        logger.error('Waitlist signup error:', error);
        res.status(500).json({
            error: 'Failed to add to waitlist. Please try again.',
        });
    }
});

/**
 * @swagger
 * /api/waitlist:
 *   get:
 *     summary: Get all waitlist entries (admin only)
 *     tags: [Waitlist]
 *     responses:
 *       200:
 *         description: List of waitlist entries
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const entries = await prisma.waitlist.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const count = await prisma.waitlist.count();

        res.json({
            success: true,
            count,
            data: entries,
        });
    } catch (error: any) {
        logger.error('Waitlist fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch waitlist entries',
        });
    }
});

/**
 * @swagger
 * /api/waitlist/count:
 *   get:
 *     summary: Get total waitlist count
 *     tags: [Waitlist]
 *     responses:
 *       200:
 *         description: Total count of waitlist entries
 */
router.get('/count', async (req: Request, res: Response) => {
    try {
        const count = await prisma.waitlist.count();
        res.json({ count });
    } catch (error: any) {
        logger.error('Waitlist count error:', error);
        res.status(500).json({ error: 'Failed to get count' });
    }
});

export default router;
