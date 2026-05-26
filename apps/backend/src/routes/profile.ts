import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { encrypt } from '../services/encryption.service';

const router = Router();
router.use(requireAuth);

router.put('/apikey', async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey } = req.body as { apiKey?: string };
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
      res.status(400).json({ error: 'Geçersiz API anahtarı' });
      return;
    }
    const apiKeyEnc = encrypt(apiKey.trim());
    await prisma.user.update({ where: { id: req.userId }, data: { apiKeyEnc } });
    res.json({ success: true });
  } catch (err) {
    console.error('[profile/apikey PUT]', err);
    res.status(500).json({ error: 'API anahtarı kaydedilemedi' });
  }
});

router.delete('/apikey', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.userId }, data: { apiKeyEnc: null } });
    res.json({ success: true });
  } catch (err) {
    console.error('[profile/apikey DELETE]', err);
    res.status(500).json({ error: 'API anahtarı silinemedi' });
  }
});

router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const { uiLanguage, level } = req.body as { uiLanguage?: string; level?: string };
    const data: Record<string, string> = {};
    if (uiLanguage && ['tr', 'en'].includes(uiLanguage)) data.uiLanguage = uiLanguage;
    if (level && ['UNSET', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) data.level = level;
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Güncellenecek alan yok' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, level: true, uiLanguage: true, apiKeyEnc: true },
    });
    res.json({ id: user.id, email: user.email, level: user.level, uiLanguage: user.uiLanguage, hasApiKey: !!user.apiKeyEnc });
  } catch (err) {
    console.error('[profile/settings]', err);
    res.status(500).json({ error: 'Ayarlar güncellenemedi' });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [wordCount, sessionCount, contentCount, masteredCount] = await Promise.all([
      prisma.userWord.count({ where: { userId: req.userId } }),
      prisma.rolePlaySession.count({ where: { userId: req.userId } }),
      prisma.contentItem.count({ where: { userId: req.userId, status: 'DONE' } }),
      prisma.userWord.count({ where: { userId: req.userId, status: 'MASTERED' } }),
    ]);
    res.json({ wordCount, sessionCount, contentCount, masteredCount });
  } catch (err) {
    console.error('[profile/stats]', err);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

export default router;
