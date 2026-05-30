import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';
import { youtubeService } from '../services/youtube.service';
import axios from 'axios';
import pdfParse from 'pdf-parse';

function parseSrt(srt: string): string {
  return srt
    .replace(/^\d+\s*$/gm, '')
    .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g, '')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const router = Router();
router.use(requireAuth);

async function fetchArticleText(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000,
  });
  const text = (data as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 5000);
}

async function processContent(itemId: string, apiKey: string, level: string) {
  const item = await prisma.contentItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  await prisma.contentItem.update({ where: { id: itemId }, data: { status: 'PROCESSING' } });

  try {
    let text = item.transcript ?? '';

    if (item.type === 'YOUTUBE' && item.url && !text) {
      text = await youtubeService.getTranscript(item.url);
      await prisma.contentItem.update({ where: { id: itemId }, data: { transcript: text } });
    } else if (item.type === 'ARTICLE' && item.url && !text) {
      text = await fetchArticleText(item.url);
      await prisma.contentItem.update({ where: { id: itemId }, data: { transcript: text } });
    }

    if (!text) {
      await prisma.contentItem.update({ where: { id: itemId }, data: { status: 'FAILED' } });
      return;
    }

    const result = await claudeService.analyzeContent(apiKey, text, level);

    for (const vocab of result.vocabulary) {
      const word = await prisma.word.upsert({
        where: { word: vocab.word.toLowerCase() },
        create: {
          word: vocab.word.toLowerCase(),
          definition: vocab.definition,
          definitionTr: vocab.definitionTr,
          examples: [vocab.context],
          level: (vocab.level ?? level) as any,
        },
        update: {},
      });
      await prisma.contentWord.upsert({
        where: { contentId_wordId: { contentId: itemId, wordId: word.id } },
        create: { contentId: itemId, wordId: word.id, occurrences: 1, contexts: [vocab.context] },
        update: { occurrences: { increment: 1 } },
      });
    }

    for (const phrase of result.phrases) {
      await prisma.contentPhrase.create({
        data: { contentId: itemId, phrase: phrase.phrase, meaning: phrase.meaning, meaningTr: phrase.meaningTr, examples: [phrase.example] },
      });
    }

    await prisma.contentItem.update({ where: { id: itemId }, data: { status: 'DONE' } });
  } catch (err) {
    console.error('[content/process]', err);
    await prisma.contentItem.update({ where: { id: itemId }, data: { status: 'FAILED' } });
  }
}

router.post('/', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { url, type, title, transcript, fileBase64, fileName } = req.body as {
      url?: string; type?: string; title?: string; transcript?: string;
      fileBase64?: string; fileName?: string;
    };
    if (!type || !['YOUTUBE', 'ARTICLE', 'SUBTITLE', 'PDF'].includes(type)) {
      res.status(400).json({ error: 'Geçerli bir içerik türü seçin' });
      return;
    }
    if (!url && !transcript && !fileBase64) {
      res.status(400).json({ error: 'URL, transcript veya dosya gerekli' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const level = user?.level ?? 'B1';

    let resolvedTranscript = transcript;
    let itemTitle = title ?? url ?? 'İçerik';

    if (fileBase64 && type === 'PDF') {
      const buffer = Buffer.from(fileBase64, 'base64');
      const pdfData = await pdfParse(buffer);
      resolvedTranscript = pdfData.text.slice(0, 10000);
      itemTitle = title ?? fileName?.replace(/\.pdf$/i, '') ?? 'PDF';
    } else if (fileBase64 && type === 'SUBTITLE') {
      const srtText = Buffer.from(fileBase64, 'base64').toString('utf-8');
      resolvedTranscript = parseSrt(srtText);
      itemTitle = title ?? fileName?.replace(/\.(srt|vtt)$/i, '') ?? 'Altyazı';
    } else if (!title && url && type === 'YOUTUBE') {
      itemTitle = `YouTube: ${url.slice(-11)}`;
    }

    const item = await prisma.contentItem.create({
      data: { userId: req.userId, type: type as any, url, title: itemTitle, transcript: resolvedTranscript, status: 'PENDING' },
    });

    processContent(item.id, req.apiKey!, level).catch(err => console.error('[content bg process]', err));

    res.status(202).json(item);
  } catch (err) {
    console.error('[content POST]', err);
    res.status(500).json({ error: 'İçerik eklenemedi' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.contentItem.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, url: true, title: true, status: true, createdAt: true, updatedAt: true, _count: { select: { words: true, phrases: true } } },
    });
    res.json(items);
  } catch (err) {
    console.error('[content GET]', err);
    res.status(500).json({ error: 'İçerikler alınamadı' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.contentItem.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        words: { include: { word: true }, orderBy: { occurrences: 'desc' } },
        phrases: true,
      },
    });
    if (!item) { res.status(404).json({ error: 'İçerik bulunamadı' }); return; }
    res.json(item);
  } catch (err) {
    console.error('[content/:id GET]', err);
    res.status(500).json({ error: 'İçerik alınamadı' });
  }
});

router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.contentItem.findFirst({
      where: { id: req.params.id, userId: req.userId },
      select: { id: true, status: true, title: true },
    });
    if (!item) { res.status(404).json({ error: 'İçerik bulunamadı' }); return; }
    res.json(item);
  } catch (err) {
    console.error('[content/:id/status]', err);
    res.status(500).json({ error: 'Durum alınamadı' });
  }
});

router.post('/:id/quiz', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.contentItem.findFirst({
      where: { id: req.params.id, userId: req.userId, status: 'DONE' },
      include: { words: { include: { word: true }, take: 20 } },
    });
    if (!item) { res.status(404).json({ error: 'İçerik bulunamadı veya işlenmedi' }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const words = item.words.map(cw => ({ word: cw.word.word, definition: cw.word.definition, level: cw.word.level }));
    const quiz = await claudeService.generateQuiz(req.apiKey!, words, user?.level ?? 'B1');
    res.json(quiz);
  } catch (err) {
    console.error('[content/:id/quiz]', err);
    res.status(500).json({ error: 'Quiz oluşturulamadı' });
  }
});

export default router;
