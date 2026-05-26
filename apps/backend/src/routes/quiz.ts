import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';
import { srsService } from '../services/srs.service';

const router = Router();
router.use(requireAuth);

router.get('/generate', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { source = 'vocabulary', count = '10' } = req.query as { source?: string; count?: string };
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const level = user?.level ?? 'B1';

    let words: { word: string; definition: string; level: string }[] = [];

    if (source === 'due') {
      const due = await prisma.userWord.findMany({
        where: { userId: req.userId, nextReview: { lte: new Date() }, status: { not: 'MASTERED' } },
        include: { word: true },
        take: 20,
      });
      words = due.map(uw => ({ word: uw.word.word, definition: uw.word.definition, level: uw.word.level }));
    } else {
      const userWords = await prisma.userWord.findMany({
        where: { userId: req.userId },
        include: { word: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      });
      words = userWords.map(uw => ({ word: uw.word.word, definition: uw.word.definition, level: uw.word.level }));
    }

    if (words.length < 3) {
      res.status(400).json({ error: 'Quiz için en az 3 kelime gerekli. Önce kelime ekleyin.' });
      return;
    }

    const quiz = await claudeService.generateQuiz(req.apiKey!, words, level, parseInt(count));
    res.json(quiz);
  } catch (err) {
    console.error('[quiz/generate]', err);
    res.status(500).json({ error: 'Quiz oluşturulamadı' });
  }
});

router.post('/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { answers, questions, sourceId, sourceType } = req.body as {
      answers: { questionId: number; answer: string; wordId?: string }[];
      questions: { id: number; correctAnswer: string; wordId?: string }[];
      sourceId?: string;
      sourceType?: string;
    };

    if (!answers || !questions) {
      res.status(400).json({ error: 'answers ve questions gerekli' });
      return;
    }

    let score = 0;
    const results = questions.map(q => {
      const userAnswer = answers.find(a => a.questionId === q.id);
      const correct = userAnswer?.answer?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (correct) score++;
      return { questionId: q.id, correct, correctAnswer: q.correctAnswer, userAnswer: userAnswer?.answer };
    });

    const quizResult = await prisma.quizResult.create({
      data: {
        userId: req.userId,
        sourceId,
        sourceType,
        score,
        totalQuestions: questions.length,
        answers: results,
      },
    });

    for (const result of results) {
      const q = questions.find(q => q.id === result.questionId);
      if (!q?.wordId) continue;
      const uw = await prisma.userWord.findFirst({ where: { userId: req.userId, wordId: q.wordId } });
      if (!uw) continue;
      const quality = result.correct ? 3 : 0;
      const { interval, easeFactor, repetitions, nextReview, status } = srsService.calculate(quality as 0 | 3, uw.interval, uw.easeFactor, uw.repetitions);
      await prisma.userWord.update({
        where: { id: uw.id },
        data: { interval, easeFactor, repetitions, nextReview, status },
      });
    }

    res.json({ score, total: questions.length, percentage: Math.round((score / questions.length) * 100), results, quizResultId: quizResult.id });
  } catch (err) {
    console.error('[quiz/submit]', err);
    res.status(500).json({ error: 'Cevaplar kaydedilemedi' });
  }
});

export default router;
