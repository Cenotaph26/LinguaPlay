import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /gamification/stats — already covered by profile/stats, but provide here too
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [wordCount, sessionCount, masteredCount, user] = await Promise.all([
      prisma.userWord.count({ where: { userId: req.userId } }),
      prisma.rolePlaySession.count({ where: { userId: req.userId } }),
      prisma.userWord.count({ where: { userId: req.userId, status: 'MASTERED' } }),
      prisma.user.findUnique({ where: { id: req.userId }, select: { xp: true, streak: true, level: true } }),
    ]);
    res.json({ wordCount, sessionCount, masteredCount, xp: user?.xp ?? 0, streak: user?.streak ?? 0, level: user?.level });
  } catch (err) {
    console.error('[gamification/stats]', err);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

// GET /gamification/badges — return all badges with user's earned status
router.get('/badges', async (req: AuthRequest, res: Response) => {
  try {
    const [allBadges, userBadges, stats] = await Promise.all([
      prisma.badge.findMany({ orderBy: { xpReward: 'asc' } }),
      prisma.userBadge.findMany({ where: { userId: req.userId }, select: { badgeId: true, earnedAt: true } }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          xp: true,
          streak: true,
          _count: { select: { words: true } },
        },
      }),
    ]);

    const earnedMap = new Map(userBadges.map((b) => [b.badgeId, b.earnedAt]));

    const badges = allBadges.map((b) => ({
      ...b,
      earned: earnedMap.has(b.id),
      earnedAt: earnedMap.get(b.id) ?? null,
    }));

    res.json({ badges, stats: { xp: stats?.xp ?? 0, streak: stats?.streak ?? 0, wordCount: stats?._count?.words ?? 0 } });
  } catch (err) {
    console.error('[gamification/badges]', err);
    res.status(500).json({ error: 'Rozetler alınamadı' });
  }
});

export default router;
