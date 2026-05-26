import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const PLACEMENT_QUESTIONS = [
  {
    id: '1', level: 'A1',
    question: 'What ___ your name?',
    options: ['is', 'are', 'am', 'be'],
    correctIndex: 0,
  },
  {
    id: '2', level: 'A1',
    question: 'I ___ a student.',
    options: ['is', 'are', 'am', 'be'],
    correctIndex: 2,
  },
  {
    id: '3', level: 'A1',
    question: 'She ___ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correctIndex: 1,
  },
  {
    id: '4', level: 'A2',
    question: 'I ___ TV when you called.',
    options: ['watch', 'watched', 'was watching', 'have watched'],
    correctIndex: 2,
  },
  {
    id: '5', level: 'A2',
    question: 'They have lived here ___ 2010.',
    options: ['for', 'since', 'ago', 'from'],
    correctIndex: 1,
  },
  {
    id: '6', level: 'A2',
    question: 'This is the most ___ film I have ever seen.',
    options: ['good', 'better', 'best', 'well'],
    correctIndex: 2,
  },
  {
    id: '7', level: 'B1',
    question: 'If I ___ rich, I would travel the world.',
    options: ['am', 'was', 'were', 'be'],
    correctIndex: 2,
  },
  {
    id: '8', level: 'B1',
    question: 'The report ___ by the manager yesterday.',
    options: ['wrote', 'was written', 'is written', 'has written'],
    correctIndex: 1,
  },
  {
    id: '9', level: 'B1',
    question: 'Despite ___ hard, he failed the exam.',
    options: ['study', 'studied', 'studying', 'to study'],
    correctIndex: 2,
  },
  {
    id: '10', level: 'B1',
    question: 'She suggested ___ to the theatre.',
    options: ['go', 'to go', 'going', 'gone'],
    correctIndex: 2,
  },
  {
    id: '11', level: 'B2',
    question: 'By the time she arrived, I ___ waiting for two hours.',
    options: ['was', 'had been', 'have been', 'am'],
    correctIndex: 1,
  },
  {
    id: '12', level: 'B2',
    question: 'The word "ubiquitous" means:',
    options: ['rare', 'present everywhere', 'dangerous', 'old-fashioned'],
    correctIndex: 1,
  },
  {
    id: '13', level: 'B2',
    question: 'She is known for her ___ attention to detail.',
    options: ['meticulous', 'careless', 'rapid', 'ordinary'],
    correctIndex: 0,
  },
  {
    id: '14', level: 'B2',
    question: 'Had he studied harder, he ___ passed.',
    options: ['would have', 'will have', 'would', 'had'],
    correctIndex: 0,
  },
  {
    id: '15', level: 'C1',
    question: 'The politician was accused of ___ the public.',
    options: ['misleading', 'misled', 'mislead', 'misleads'],
    correctIndex: 0,
  },
  {
    id: '16', level: 'C1',
    question: 'The word "ephemeral" most closely means:',
    options: ['permanent', 'short-lived', 'enormous', 'frightening'],
    correctIndex: 1,
  },
  {
    id: '17', level: 'C1',
    question: 'Not only ___ late, but he also forgot his report.',
    options: ['he was', 'was he', 'he is', 'is he'],
    correctIndex: 1,
  },
  {
    id: '18', level: 'C1',
    question: 'The proposal was met with ___ from the committee.',
    options: ['approbation', 'appreciation', 'trepidation', 'consternation'],
    correctIndex: 3,
  },
  {
    id: '19', level: 'C2',
    question: 'The ___ of the ancient manuscript has baffled scholars.',
    options: ['provenance', 'providence', 'prominence', 'profoundness'],
    correctIndex: 0,
  },
  {
    id: '20', level: 'C2',
    question: 'The law was passed ___ considerable opposition.',
    options: ['in spite', 'despite of', 'notwithstanding', 'although'],
    correctIndex: 2,
  },
];

function scoreToLevel(score: number, total: number): string {
  const pct = score / total;
  if (pct < 0.15) return 'A1';
  if (pct < 0.3) return 'A2';
  if (pct < 0.5) return 'B1';
  if (pct < 0.65) return 'B2';
  if (pct < 0.8) return 'C1';
  return 'C2';
}

router.get('/test', (_req, res) => {
  const questions = PLACEMENT_QUESTIONS.map(({ id, level, question, options }) => ({
    id,
    level,
    question,
    options,
  }));
  res.json({ questions });
});

router.post('/evaluate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body as { answers: Array<{ id: string; selectedIndex: number }> };
    if (!Array.isArray(answers)) {
      res.status(400).json({ error: 'answers must be an array' });
      return;
    }
    let score = 0;
    for (const answer of answers) {
      const q = PLACEMENT_QUESTIONS.find((q) => q.id === answer.id);
      if (q && q.correctIndex === answer.selectedIndex) score++;
    }
    const level = scoreToLevel(score, PLACEMENT_QUESTIONS.length) as
      | 'A1'
      | 'A2'
      | 'B1'
      | 'B2'
      | 'C1'
      | 'C2';
    await prisma.user.update({
      where: { id: req.userId },
      data: { level },
    });
    res.json({ score, total: PLACEMENT_QUESTIONS.length, level });
  } catch (err) {
    console.error('[placement/evaluate]', err);
    res.status(500).json({ error: 'Değerlendirme başarısız' });
  }
});

export default router;
