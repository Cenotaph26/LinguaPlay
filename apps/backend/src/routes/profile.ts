import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { encrypt } from '../services/encryption.service';

const router = Router();
router.use(requireAuth);

router.post('/apikey/test', async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, provider = 'CLAUDE' } = req.body as { apiKey?: string; provider?: string };
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
      res.json({ valid: false, error: 'Geçersiz API anahtarı' });
      return;
    }
    if (provider === 'GEMINI') {
      await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
        { contents: [{ parts: [{ text: 'Hi' }] }] },
        { timeout: 10000 },
      );
    } else {
      const client = new Anthropic({ apiKey: apiKey.trim() });
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
    }
    res.json({ valid: true });
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode ?? err?.response?.status;
    if (status === 400 || status === 401 || status === 403) {
      res.json({ valid: false, error: 'Geçersiz API anahtarı' });
    } else {
      res.json({ valid: false, error: 'Bağlantı hatası: ' + (err?.message ?? 'Bilinmeyen hata') });
    }
  }
});

router.put('/apikey', async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, provider = 'CLAUDE' } = req.body as { apiKey?: string; provider?: string };
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
      res.status(400).json({ error: 'Geçersiz API anahtarı' });
      return;
    }
    const validProvider = provider === 'GEMINI' ? 'GEMINI' : 'CLAUDE';
    const apiKeyEnc = encrypt(apiKey.trim());
    await prisma.user.update({ where: { id: req.userId }, data: { apiKeyEnc, aiProvider: validProvider as any } });
    res.json({ success: true });
  } catch (err) {
    console.error('[profile/apikey PUT]', err);
    res.status(500).json({ error: 'API anahtarı kaydedilemedi' });
  }
});

router.delete('/apikey', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.userId }, data: { apiKeyEnc: null, aiProvider: null } });
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
    if (level && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'UNSET'].includes(level)) data.level = level;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, level: true, uiLanguage: true, apiKeyEnc: true },
    });
    res.json({
      id: user.id,
      email: user.email,
      level: user.level,
      uiLanguage: user.uiLanguage,
      hasApiKey: !!user.apiKeyEnc,
    });
  } catch (err) {
    console.error('[profile/settings]', err);
    res.status(500).json({ error: 'Ayarlar kaydedilemedi' });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [wordCount, sessionCount, contentCount, masteredCount, user] = await Promise.all([
      prisma.userWord.count({ where: { userId: req.userId } }),
      prisma.rolePlaySession.count({ where: { userId: req.userId } }),
      prisma.contentItem.count({ where: { userId: req.userId, status: 'DONE' } }),
      prisma.userWord.count({ where: { userId: req.userId, status: 'MASTERED' } }),
      prisma.user.findUnique({ where: { id: req.userId }, select: { xp: true, streak: true } }),
    ]);
    res.json({ wordCount, sessionCount, contentCount, masteredCount, xp: user?.xp ?? 0, streak: user?.streak ?? 0 });
  } catch (err) {
    console.error('[profile/stats]', err);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

export default router;
