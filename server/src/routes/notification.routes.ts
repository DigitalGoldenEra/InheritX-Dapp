/**
 * Notification Routes
 * Provides notifications for the user dashboard
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications for current user
 *     description: Returns recent activity and important alerts for the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kyc:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     reviewedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const [user, activities] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          kyc: {
            select: {
              status: true,
              submittedAt: true,
              reviewedAt: true,
            },
          },
        },
      }),
      prisma.activity.findMany({
        where: {
          OR: [
            { userId },
            {
              plan: {
                userId,
              },
            },
          ],
        },
        include: {
          plan: {
            select: {
              id: true,
              planName: true,
              globalPlanId: true,
              status: true,
              transferDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      kyc: {
        status: user?.kyc?.status || 'NOT_SUBMITTED',
        submittedAt: user?.kyc?.submittedAt || null,
        reviewedAt: user?.kyc?.reviewedAt || null,
      },
      recentActivity: activities,
    });
  }),
);

export default router;


