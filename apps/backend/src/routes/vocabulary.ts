import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';
import { srsService } from '../services/srs.service';

const router = Router();
router.use(requireAuth);

router.get('/words', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = { userId: req.userId };
    if (status) where.status = status;

    const [userWords, total] = await Promise.all([
      prisma.userWord.findMany({
        where,
        include: { word: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.userWord.count({ where }),
    ]);

    res.json({
      words: userWords.map(uw => ({ ...uw.word, userWord: { id: uw.id, status: uw.status, nextReview: uw.nextReview, interval: uw.interval, easeFactor: uw.easeFactor, repetitions: uw.repetitions } })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('[vocabulary/words]', err);
    res.status(500).json({ error: 'Kelimeler alınamadı' });
  }
});

router.get('/due', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const due = await prisma.userWord.findMany({
      where: { userId: req.userId, nextReview: { lte: now }, status: { not: 'MASTERED' } },
      include: { word: true },
      orderBy: { nextReview: 'asc' },
      take: 50,
    });
    res.json(due.map(uw => ({ ...uw.word, userWord: { id: uw.id, status: uw.status, nextReview: uw.nextReview, interval: uw.interval, easeFactor: uw.easeFactor, repetitions: uw.repetitions } })));
  } catch (err) {
    console.error('[vocabulary/due]', err);
    res.status(500).json({ error: 'Tekrar edilecek kelimeler alınamadı' });
  }
});

router.post('/review', async (req: AuthRequest, res: Response) => {
  try {
    const { userWordId, quality } = req.body as { userWordId?: string; quality?: number };
    if (!userWordId || quality === undefined || quality < 0 || quality > 3) {
      res.status(400).json({ error: 'userWordId ve quality (0-3) gerekli' });
      return;
    }
    const uw = await prisma.userWord.findFirst({
      where: { id: userWordId, userId: req.userId },
    });
    if (!uw) {
      res.status(404).json({ error: 'Kelime bulunamadı' });
      return;
    }
    const { interval, easeFactor, repetitions } = srsService.updateSRS(
      quality as 0 | 1 | 2 | 3,
      uw.interval,
      uw.easeFactor,
      uw.repetitions,
    );
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    let status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED' = 'LEARNING';
    if (repetitions >= 5 && interval >= 14) status = 'MASTERED';
    else if (repetitions >= 2) status = 'REVIEW';

    const updated = await prisma.userWord.update({
      where: { id: userWordId },
      data: { interval, easeFactor, repetitions, nextReview, status },
    });
    res.json(updated);
  } catch (err) {
    console.error('[vocabulary/review]', err);
    res.status(500).json({ error: 'İnceleme kaydedilemedi' });
  }
});

router.post('/add', async (req: AuthRequest, res: Response) => {
  try {
    const { word, definition, definitionTr, examples, phonetic, level } = req.body as {
      word?: string; definition?: string; definitionTr?: string;
      examples?: string[]; phonetic?: string; level?: string;
    };
    if (!word || !definition || !definitionTr || !level) {
      res.status(400).json({ error: 'word, definition, definitionTr ve level gerekli' });
      return;
    }
    const dbWord = await prisma.word.upsert({
      where: { word: word.toLowerCase() },
      create: { word: word.toLowerCase(), definition, definitionTr, examples: examples ?? [], phonetic, level: level as any },
      update: {},
    });
    const userWord = await prisma.userWord.upsert({
      where: { userId_wordId: { userId: req.userId, wordId: dbWord.id } },
      create: { userId: req.userId, wordId: dbWord.id },
      update: {},
    });
    res.json({ ...dbWord, userWord });
  } catch (err) {
    console.error('[vocabulary/add]', err);
    res.status(500).json({ error: 'Kelime eklenemedi' });
  }
});

router.get('/:wordId/explain', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { wordId } = req.params;
    const { context = '' } = req.query as { context?: string };
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      res.status(404).json({ error: 'Kelime bulunamadı' });
      return;
    }
    const explanation = await claudeService.explainWord(req.apiKey!, word.word, context, user?.level ?? 'B1');
    res.json(explanation);
  } catch (err) {
    console.error('[vocabulary/explain]', err);
    res.status(500).json({ error: 'Açıklama alınamadı' });
  }
});

export default router;
