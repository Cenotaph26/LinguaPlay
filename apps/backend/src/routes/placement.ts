import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { claudeService } from '../services/claude.service';

const router = Router();
router.use(requireAuth);

const PLACEMENT_QUESTIONS = [
  { id: 1, type: 'grammar', question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 'goes', level: 'A1' },
  { id: 2, type: 'vocabulary', question: 'What is the opposite of "happy"?', options: ['sad', 'angry', 'tired', 'hungry'], correctAnswer: 'sad', level: 'A1' },
  { id: 3, type: 'grammar', question: 'I ___ a doctor when I grow up.', options: ['am', 'be', 'will be', 'was'], correctAnswer: 'will be', level: 'A2' },
  { id: 4, type: 'vocabulary', question: 'Which word means "very big"?', options: ['tiny', 'enormous', 'narrow', 'shallow'], correctAnswer: 'enormous', level: 'A2' },
  { id: 5, type: 'grammar', question: 'By the time she arrived, we ___ dinner.', options: ['finished', 'have finished', 'had finished', 'finish'], correctAnswer: 'had finished', level: 'B2' },
  { id: 6, type: 'vocabulary', question: 'He was ___ by the difficult question.', options: ['perplexed', 'pleased', 'praised', 'prepared'], correctAnswer: 'perplexed', level: 'B2' },
  { id: 7, type: 'grammar', question: 'If I ___ rich, I would travel the world.', options: ['am', 'was', 'were', 'be'], correctAnswer: 'were', level: 'B1' },
  { id: 8, type: 'vocabulary', question: 'The politician gave an ___ speech that moved the crowd.', options: ['eloquent', 'elegant', 'elusive', 'elastic'], correctAnswer: 'eloquent', level: 'C1' },
  { id: 9, type: 'grammar', question: 'I prefer ___ coffee to tea.', options: ['drink', 'drinking', 'to drink', 'drunk'], correctAnswer: 'drinking', level: 'B1' },
  { id: 10, type: 'vocabulary', question: 'The new policy will ___ affect thousands of workers.', options: ['adversely', 'adventurously', 'adequately', 'acutely'], correctAnswer: 'adversely', level: 'C1' },
  { id: 11, type: 'grammar', question: 'He ___ here for five years.', options: ['works', 'worked', 'has worked', 'is working'], correctAnswer: 'has worked', level: 'B1' },
  { id: 12, type: 'vocabulary', question: 'What does "ubiquitous" mean?', options: ['rare', 'everywhere', 'ancient', 'expensive'], correctAnswer: 'everywhere', level: 'C1' },
  { id: 13, type: 'grammar', question: 'The report ___ by the committee next week.', options: ['will review', 'will be reviewed', 'reviews', 'reviewed'], correctAnswer: 'will be reviewed', level: 'B2' },
  { id: 14, type: 'vocabulary', question: 'To "procrastinate" means to:', options: ['work hard', 'delay tasks', 'celebrate', 'criticize'], correctAnswer: 'delay tasks', level: 'B2' },
  { id: 15, type: 'grammar', question: '___ she studies hard, she might fail.', options: ['Although', 'Unless', 'Because', 'While'], correctAnswer: 'Unless', level: 'B2' },
  { id: 16, type: 'vocabulary', question: 'The scientist\'s ___ research led to a breakthrough.', options: ['meticulous', 'mediocre', 'melodic', 'merciful'], correctAnswer: 'meticulous', level: 'C1' },
  { id: 17, type: 'grammar', question: 'I wish I ___ more time yesterday.', options: ['have', 'had', 'will have', 'have had'], correctAnswer: 'had', level: 'B2' },
  { id: 18, type: 'vocabulary', question: 'An "ephemeral" thing lasts:', options: ['forever', 'a short time', 'a long time', 'occasionally'], correctAnswer: 'a short time', level: 'C2' },
  { id: 19, type: 'grammar', question: 'Had she known about it, she ___ differently.', options: ['acts', 'would act', 'would have acted', 'acted'], correctAnswer: 'would have acted', level: 'C1' },
  { id: 20, type: 'vocabulary', question: 'To "ameliorate" a situation means to:', options: ['worsen it', 'ignore it', 'improve it', 'describe it'], correctAnswer: 'improve it', level: 'C2' },
];

router.get('/test', requireAuth, (req: AuthRequest, res: Response) => {
  const questions = PLACEMENT_QUESTIONS.map(({ id, type, question, options, level }) => ({
    id, type, question, options, level,
  }));
  res.json({ questions });
});

router.post('/evaluate', async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body as { answers?: { questionId: number; answer: string }[] };
    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'Cevaplar gerekli' });
      return;
    }

    const correct = answers.filter(a => {
      const q = PLACEMENT_QUESTIONS.find(q => q.id === a.questionId);
      return q?.correctAnswer === a.answer;
    }).length;

    let result: { level: string; explanation: string; score: number };

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { apiKeyEnc: true } });
    if (user?.apiKeyEnc) {
      try {
        const { decrypt } = await import('../services/encryption.service');
        const apiKey = decrypt(user.apiKeyEnc);
        result = await claudeService.evaluatePlacement(apiKey, answers, PLACEMENT_QUESTIONS);
      } catch {
        const pct = correct / PLACEMENT_QUESTIONS.length;
        const level = pct >= 0.9 ? 'C2' : pct >= 0.8 ? 'C1' : pct >= 0.65 ? 'B2' : pct >= 0.5 ? 'B1' : pct >= 0.35 ? 'A2' : 'A1';
        result = { level, explanation: `${correct}/${PLACEMENT_QUESTIONS.length} doğru cevap.`, score: correct };
      }
    } else {
      const pct = correct / PLACEMENT_QUESTIONS.length;
      const level = pct >= 0.9 ? 'C2' : pct >= 0.8 ? 'C1' : pct >= 0.65 ? 'B2' : pct >= 0.5 ? 'B1' : pct >= 0.35 ? 'A2' : 'A1';
      const LEVEL_NAMES: Record<string, string> = { A1: 'Başlangıç', A2: 'Temel', B1: 'Orta Altı', B2: 'Orta', C1: 'İleri', C2: 'Ustalık' };
      result = { level, explanation: `${correct}/${PLACEMENT_QUESTIONS.length} doğru — ${LEVEL_NAMES[level]} seviyesindesiniz.`, score: correct };
    }

    const validLevel = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(result.level) ? result.level : 'B1';
    await prisma.user.update({
      where: { id: req.userId },
      data: { level: validLevel as any },
    });

    res.json({ level: validLevel, explanation: result.explanation, score: result.score });
  } catch (err) {
    console.error('[placement/evaluate]', err);
    res.status(500).json({ error: 'Değerlendirme başarısız' });
  }
});

export default router;
