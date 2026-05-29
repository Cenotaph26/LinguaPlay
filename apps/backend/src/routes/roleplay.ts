import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';

const router = Router();
router.use(requireAuth);

const PRESET_SCENES = [
  {
    titleEn: 'Ordering Coffee',
    titleTr: 'Kahve Sipariş Etmek',
    descriptionEn: 'Order your favorite drink at a busy coffee shop.',
    descriptionTr: 'Kalabalık bir kafede favori içeceğini sipariş et.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are Alex, a friendly barista at a coffee shop. The customer is learning English. Be patient, use simple vocabulary, and help them order naturally. Keep sentences short and clear.',
  },
  {
    titleEn: 'Job Interview',
    titleTr: 'İş Görüşmesi',
    descriptionEn: 'Practice a formal job interview for a marketing position.',
    descriptionTr: 'Pazarlama pozisyonu için resmi bir iş görüşmesi pratiği yap.',
    category: 'work',
    difficulty: 'B2',
    systemPrompt: 'You are Sarah, an HR manager at a tech company conducting a job interview. Ask professional questions about experience, skills, and motivation. Be formal but encouraging.',
  },
  {
    titleEn: 'Airport Check-in',
    titleTr: 'Havalimanı Check-in',
    descriptionEn: 'Navigate airport check-in procedures and answer security questions.',
    descriptionTr: 'Havalimanı check-in sürecini yönet ve güvenlik sorularını yanıtla.',
    category: 'travel',
    difficulty: 'A2',
    systemPrompt: 'You are Tom, a check-in agent at an international airport. Guide the passenger through check-in, ask about luggage, seat preferences, and travel documents. Use standard aviation English.',
  },
  {
    titleEn: 'Doctor Visit',
    titleTr: 'Doktor Ziyareti',
    descriptionEn: 'Describe your symptoms and understand medical advice.',
    descriptionTr: 'Belirtilerini anlat ve tıbbi tavsiye al.',
    category: 'emergency',
    difficulty: 'B1',
    systemPrompt: 'You are Dr. James, a general practitioner. Listen to the patient\'s symptoms, ask follow-up questions, and give clear medical advice. Use simple English for non-native speakers.',
  },
  {
    titleEn: 'Shopping Return',
    titleTr: 'Mağazada İade',
    descriptionEn: 'Return a defective product and negotiate with the store staff.',
    descriptionTr: 'Arızalı bir ürünü iade et ve mağaza çalışanıyla müzakere et.',
    category: 'shopping',
    difficulty: 'B1',
    systemPrompt: 'You are Emma, a customer service representative at a clothing store. Handle return requests professionally. Sometimes the policy is strict — be firm but polite.',
  },
  {
    titleEn: 'Making New Friends',
    titleTr: 'Yeni Arkadaş Edinmek',
    descriptionEn: 'Start a conversation at a party and make a new friend.',
    descriptionTr: 'Bir partide sohbet başlat ve yeni bir arkadaş edin.',
    category: 'social',
    difficulty: 'A2',
    systemPrompt: 'You are Chris, a friendly person at a house party. Start casual conversation, ask about hobbies and interests, share stories. Be warm and conversational.',
  },
  {
    titleEn: 'Asking for Directions',
    titleTr: 'Yol Tarifi İsteme',
    descriptionEn: 'Find your way around a new city by asking locals for directions.',
    descriptionTr: 'Yerel halktan yol tarifi alarak yeni bir şehirde yolunu bul.',
    category: 'daily',
    difficulty: 'A1',
    systemPrompt: 'You are a local resident in a busy city. Give clear directions using landmarks and street names. If the tourist seems confused, offer to repeat or simplify.',
  },
  {
    titleEn: 'Business Meeting',
    titleTr: 'İş Toplantısı',
    descriptionEn: 'Present your project idea and handle questions from colleagues.',
    descriptionTr: 'Proje fikrini sun ve meslektaşlarından gelen soruları yanıtla.',
    category: 'work',
    difficulty: 'C1',
    systemPrompt: 'You are Marcus, a senior manager in a business meeting. Challenge the presenter with tough questions about budget, timeline, and ROI. Use professional business English.',
  },
];

async function ensureScenesSeeded() {
  const count = await prisma.rolePlayScene.count({ where: { isPreset: true } });
  if (count === 0) {
    await prisma.rolePlayScene.createMany({
      data: PRESET_SCENES.map(s => ({ ...s, difficulty: s.difficulty as any })),
      skipDuplicates: true,
    });
  }
}

router.get('/scenes', async (req: AuthRequest, res: Response) => {
  try {
    await ensureScenesSeeded();
    const { category } = req.query as { category?: string };
    const where: Record<string, unknown> = { isPreset: true };
    if (category) where.category = category;
    const scenes = await prisma.rolePlayScene.findMany({ where, orderBy: { difficulty: 'asc' } });
    res.json(scenes);
  } catch (err) {
    console.error('[roleplay/scenes]', err);
    res.status(500).json({ error: 'Sahneler alınamadı' });
  }
});

router.post('/sessions', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { sceneId, customScene } = req.body as { sceneId?: string; customScene?: string };
    if (!sceneId && !customScene) {
      res.status(400).json({ error: 'sceneId veya customScene gerekli' });
      return;
    }
    let systemPrompt = '';
    let title = '';

    if (sceneId) {
      const scene = await prisma.rolePlayScene.findUnique({ where: { id: sceneId } });
      if (!scene) { res.status(404).json({ error: 'Sahne bulunamadı' }); return; }
      systemPrompt = scene.systemPrompt;
      title = scene.titleTr;
    } else {
      title = 'Özel Sahne';
      systemPrompt = `You are playing a character in this scenario described by the user: "${customScene}". Create an appropriate character, introduce yourself naturally in English, and engage in conversation. The user is an English learner.`;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const level = user?.level ?? 'B1';
    const fullSystem = `${systemPrompt}\n\nThe user is a ${level} English learner (native language: Turkish). After each of their messages, append exactly this JSON on a new line: {"correction":null,"newWords":[]}\nIf you notice a grammar mistake, set correction to {"original":"...","suggestion":"...","explanation":"..."}.\nIf you use interesting vocabulary they might not know, add words to newWords array.`;

    const greeting = await claudeService.chat(req.apiKey!, [{ role: 'user', content: 'Hello, let\'s start!' }], fullSystem);
    const greetingText = greeting.content[0].type === 'text' ? greeting.content[0].text : 'Hello!';
    const { displayText } = parseRoleplayMessage(greetingText);

    const session = await prisma.rolePlaySession.create({
      data: {
        userId: req.userId,
        sceneId: sceneId ?? null,
        customScene: customScene ?? null,
        messages: [{ role: 'assistant', content: displayText, timestamp: new Date().toISOString() }],
      },
    });
    res.json({ session, greeting: displayText });
  } catch (err) {
    console.error('[roleplay/sessions POST]', err);
    res.status(500).json({ error: 'Oturum başlatılamadı' });
  }
});

function parseRoleplayMessage(text: string): { displayText: string; correction: unknown; newWords: string[] } {
  const jsonMatch = text.match(/\{"correction"[\s\S]*\}(?:\s*)$/);
  let correction = null;
  let newWords: string[] = [];
  let displayText = text;
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      correction = parsed.correction ?? null;
      newWords = parsed.newWords ?? [];
      displayText = text.slice(0, text.lastIndexOf(jsonMatch[0])).trimEnd();
    } catch { /* keep original */ }
  }
  return { displayText, correction, newWords };
}

router.post('/sessions/:id/message', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ error: 'Mesaj içeriği gerekli' });
      return;
    }
    const session = await prisma.rolePlaySession.findFirst({ where: { id, userId: req.userId }, include: { scene: true } });
    if (!session) { res.status(404).json({ error: 'Oturum bulunamadı' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const level = user?.level ?? 'B1';

    let systemPrompt = session.scene?.systemPrompt ?? `You are playing a character in this scenario: "${session.customScene}".`;
    systemPrompt += `\n\nThe user is a ${level} English learner (native language: Turkish). After each of their messages, append exactly this JSON on a new line: {"correction":null,"newWords":[]}\nIf you notice a grammar mistake, set correction to {"original":"...","suggestion":"...","explanation":"..."}.\nIf you use interesting vocabulary they might not know, add words to newWords array.`;

    const history = session.messages as { role: string; content: string }[];
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    apiMessages.push({ role: 'user', content: content.trim() });

    // SSE streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullText = '';
    const stream = claudeService.chatStream(req.apiKey!, apiMessages, systemPrompt);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = (event.delta as any).text as string;
        fullText += text;
        res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
      }
    }

    const { displayText, correction, newWords } = parseRoleplayMessage(fullText);

    const updatedMessages = [
      ...history,
      { role: 'user', content: content.trim(), timestamp: new Date().toISOString() },
      { role: 'assistant', content: displayText, timestamp: new Date().toISOString() },
    ];

    const currentWords = session.wordsUsed ?? [];
    const allWords = [...new Set([...currentWords, ...(newWords as string[])])];

    await prisma.rolePlaySession.update({
      where: { id },
      data: { messages: updatedMessages, wordsUsed: allWords },
    });

    res.write(`data: ${JSON.stringify({ type: 'done', displayText, correction, newWords })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[roleplay/message]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Mesaj gönderilemedi' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Mesaj gönderilemedi' })}\n\n`);
      res.end();
    }
  }
});

router.post('/sessions/:id/end', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await prisma.rolePlaySession.findFirst({ where: { id, userId: req.userId } });
    if (!session) { res.status(404).json({ error: 'Oturum bulunamadı' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const messages = session.messages as { role: string; content: string }[];
    const feedback = await claudeService.sessionFeedback(req.apiKey!, messages, user?.level ?? 'B1');

    await prisma.rolePlaySession.update({ where: { id }, data: { feedback: JSON.stringify(feedback) } });

    // Auto-add encountered words to user's vocabulary
    const wordsUsed = (session.wordsUsed ?? []) as string[];
    if (wordsUsed.length > 0) {
      const dbWords = await prisma.word.findMany({
        where: { word: { in: wordsUsed.map((w) => w.toLowerCase()) } },
      });
      await Promise.all(
        dbWords.map((dbWord) =>
          prisma.userWord.upsert({
            where: { userId_wordId: { userId: req.userId, wordId: dbWord.id } },
            create: { userId: req.userId, wordId: dbWord.id },
            update: {},
          })
        )
      );
    }

    res.json(feedback);
  } catch (err) {
    console.error('[roleplay/end]', err);
    res.status(500).json({ error: 'Geri bildirim alınamadı' });
  }
});

router.get('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.rolePlaySession.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { scene: true },
    });
    if (!session) { res.status(404).json({ error: 'Oturum bulunamadı' }); return; }
    res.json(session);
  } catch (err) {
    console.error('[roleplay/session GET]', err);
    res.status(500).json({ error: 'Oturum alınamadı' });
  }
});

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.rolePlaySession.findMany({
      where: { userId: req.userId },
      include: { scene: { select: { titleTr: true, titleEn: true, category: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(sessions);
  } catch (err) {
    console.error('[roleplay/sessions GET]', err);
    res.status(500).json({ error: 'Oturumlar alınamadı' });
  }
});

export default router;
