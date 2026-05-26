import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey, ApiKeyRequest } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';
import { srsService } from '../services/srs.service';

const router = Router();
router.use(requireAuth);

router.get('/words', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const status = req.query.status as string | undefined;
    const take = 20;
    const skip = (page - 1) * take;
    const where: Record<string, unknown> = { userId: req.userId };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.userWord.findMany({
        where,
        include: { word: true },
        orderBy: { nextReview: 'asc' },
        take,
        skip,
      }),
      prisma.userWord.count({ where }),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / take) });
  } catch (err) {
    console.error('[vocabulary/words]', err);
    res.status(500).json({ error: 'Kelimeler alınamadı' });
  }
});

router.get('/due', async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.userWord.findMany({
      where: {
        userId: req.userId,
        nextReview: { lte: new Date() },
      },
      include: { word: true },
      orderBy: { nextReview: 'asc' },
      take: 50,
    });
    res.json({ items, count: items.length });
  } catch (err) {
    console.error('[vocabulary/due]', err);
    res.status(500).json({ error: 'Tekrar edilecek kelimeler alınamadı' });
  }
});

router.post('/review', async (req: AuthRequest, res: Response) => {
  try {
    const { wordId, quality } = req.body as { wordId: string; quality: 0 | 1 | 2 | 3 };
    if (!wordId || ![0, 1, 2, 3].includes(quality)) {
      res.status(400).json({ error: 'Geçersiz parametre' });
      return;
    }
    const userWord = await prisma.userWord.findUnique({
      where: { userId_wordId: { userId: req.userId!, wordId } },
    });
    if (!userWord) {
      res.status(404).json({ error: 'Kelime bulunamadı' });
      return;
    }
    const result = srsService.calculate(
      quality,
      userWord.interval,
      userWord.easeFactor,
      userWord.repetitions
    );
    const updated = await prisma.userWord.update({
      where: { userId_wordId: { userId: req.userId!, wordId } },
      data: {
        interval: result.interval,
        easeFactor: result.easeFactor,
        repetitions: result.repetitions,
        nextReview: result.nextReview,
        status: result.status,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[vocabulary/review]', err);
    res.status(500).json({ error: 'Tekrar kaydedilemedi' });
  }
});

router.get(
  '/:wordId/explain',
  requireApiKey,
  async (req: ApiKeyRequest, res: Response) => {
    try {
      const { wordId } = req.params;
      const userWord = await prisma.userWord.findUnique({
        where: { userId_wordId: { userId: req.userId!, wordId } },
        include: { word: true },
      });
      if (!userWord) {
        res.status(404).json({ error: 'Kelime bulunamadı' });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { level: true },
      });
      const explanation = await claudeService.explainWord(
        req.apiKey!,
        userWord.word.word,
        userWord.word.examples[0] ?? '',
        user?.level ?? 'B1'
      );
      res.json(explanation);
    } catch (err) {
      console.error('[vocabulary/explain]', err);
      res.status(500).json({ error: 'Açıklama alınamadı' });
    }
  }
);

router.post('/words', async (req: AuthRequest, res: Response) => {
  try {
    const { word, definition, definitionTr, examples, phonetic, level } = req.body as {
      word: string;
      definition: string;
      definitionTr: string;
      examples?: string[];
      phonetic?: string;
      level: string;
    };
    if (!word || !definition || !level) {
      res.status(400).json({ error: 'word, definition ve level zorunlu' });
      return;
    }
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'UNSET'];
    if (!validLevels.includes(level)) {
      res.status(400).json({ error: 'Geçersiz seviye' });
      return;
    }
    const wordRecord = await prisma.word.upsert({
      where: { word: word.toLowerCase() },
      update: {},
      create: {
        word: word.toLowerCase(),
        definition,
        definitionTr: definitionTr ?? '',
        examples: examples ?? [],
        phonetic,
        level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
      },
    });
    const userWord = await prisma.userWord.upsert({
      where: { userId_wordId: { userId: req.userId!, wordId: wordRecord.id } },
      update: {},
      create: { userId: req.userId!, wordId: wordRecord.id },
      include: { word: true },
    });
    res.status(201).json(userWord);
  } catch (err) {
    console.error('[vocabulary/words POST]', err);
    res.status(500).json({ error: 'Kelime eklenemedi' });
  }
});

export default router;
