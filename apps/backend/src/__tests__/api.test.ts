import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'dev_secret';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  level: 'B1',
  uiLanguage: 'tr',
  apiKeyEnc: null,
  aiProvider: null,
  onboardingDone: false,
  passwordHash: bcrypt.hashSync('password123', 1),
};

const mockWord = {
  id: 'word-1',
  word: 'hello',
  level: 'A1',
  definition: 'a greeting',
  definitionTr: 'merhaba',
  phonetic: '/həˈloʊ/',
  examples: ['Hello, how are you?'],
  synonyms: [],
  collocations: [],
  audioUrl: null,
  partOfSpeech: null,
  themeId: null,
  isActive: true,
  userWords: [], // included by findMany in browse route
};

const mockScene = {
  id: 'scene-1',
  titleEn: 'Ordering Coffee',
  titleTr: 'Kahve Sipariş Etme',
  category: 'daily',
  difficulty: 'A1',
  descriptionTr: 'Bir kafede kahve siparişi veriyorsunuz',
  descriptionEn: 'You are ordering coffee at a cafe',
  isPreset: true,
  staticDialogue: [],
  vocabulary: ['coffee', 'please', 'thank you'],
  keyPhrases: [],
  tips: [],
  aiSystemPrompt: '',
  aiCharacterName: 'Barista',
  aiCharacterDesc: '',
};

const mockText = {
  id: 'text-1',
  title: 'A Day in the Park',
  level: 'A1',
  category: 'story',
  text: 'It was a sunny day...',
  wordCount: 150,
  readingTimeMin: 2,
  audioUrl: null,
  highlightedWords: [],
  comprehensionQs: [],
  keyPhrases: [],
  userProgress: [], // included by findMany in reading route
};

vi.mock('../lib/prisma', () => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    word: {
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    userWord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    readingText: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    rolePlayScene: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    userTextProgress: {
      findUnique: vi.fn(),
    },
    rolePlaySession: {
      findMany: vi.fn(),
    },
    quizResult: {
      findMany: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn(),
    },
  };
  return { prisma: prismaMock };
});

import app from '../app';
import { prisma } from '../lib/prisma';

function makeToken(userId = 'user-1') {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

describe('LinguaPlay Backend API', () => {

  describe('Health & Root', () => {
    it('GET /health → 200 ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET / → API info', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('LinguaPlay API');
    });
  });

  describe('Auth — POST /auth/register', () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);
    });

    it('registers new user → 201 + token', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'new@test.com', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(mockUser.email);
      expect(res.body.user.hasApiKey).toBe(false);
    });

    it('rejects duplicate email → 409', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(409);
    });

    it('rejects short password → 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'x@test.com', password: '123' });
      expect(res.status).toBe(400);
    });

    it('rejects missing fields → 400', async () => {
      const res = await request(app).post('/auth/register').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('Auth — POST /auth/login', () => {
    it('logs in with correct credentials → 200 + token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects wrong password → 401', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email → 401', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });

  describe('Auth — middleware', () => {
    it('rejects missing token → 401', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token → 401', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('Placement — GET /placement/test', () => {
    it('returns questions with auth', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/placement/test')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.questions).toBeDefined();
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBeGreaterThan(0);
    });

    it('questions have required fields', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/placement/test')
        .set('Authorization', `Bearer ${token}`);
      const q = res.body.questions[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('level');
    });

    it('requires auth → 401 without token', async () => {
      const res = await request(app).get('/placement/test');
      expect(res.status).toBe(401);
    });
  });

  describe('Vocabulary — GET /vocabulary/browse', () => {
    beforeEach(() => {
      vi.mocked(prisma.word.count).mockResolvedValue(1);
      vi.mocked(prisma.word.upsert).mockResolvedValue(mockWord as any);
      vi.mocked(prisma.word.findMany).mockResolvedValue([mockWord as any]);
      vi.mocked(prisma.userWord.findMany).mockResolvedValue([]);
    });

    it('returns words list with pagination', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/vocabulary/browse?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.words).toBeDefined();
      expect(Array.isArray(res.body.words)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pages');
    });

    it('requires auth → 401 without token', async () => {
      const res = await request(app).get('/vocabulary/browse');
      expect(res.status).toBe(401);
    });

    it('words have added:bool and status fields', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/vocabulary/browse')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      if (res.body.words.length > 0) {
        const w = res.body.words[0];
        expect(w).toHaveProperty('added');
        expect(typeof w.added).toBe('boolean');
      }
    });
  });

  describe('Roleplay — GET /roleplay/scenes', () => {
    beforeEach(() => {
      vi.mocked(prisma.rolePlayScene.count).mockResolvedValue(1);
      vi.mocked(prisma.rolePlayScene.upsert).mockResolvedValue(mockScene as any);
      vi.mocked(prisma.rolePlayScene.findMany).mockResolvedValue([mockScene as any]);
    });

    it('returns scenes list with auth', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/roleplay/scenes')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('scene has required fields', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/roleplay/scenes')
        .set('Authorization', `Bearer ${token}`);
      if (res.body.length > 0) {
        const s = res.body[0];
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('titleTr');
        expect(s).toHaveProperty('titleEn');
        expect(s).toHaveProperty('category');
        expect(s).toHaveProperty('difficulty');
      }
    });
  });

  describe('Reading — GET /reading/texts', () => {
    beforeEach(() => {
      vi.mocked(prisma.readingText.count).mockResolvedValue(1);
      vi.mocked(prisma.readingText.upsert).mockResolvedValue(mockText as any);
      vi.mocked(prisma.readingText.findMany).mockResolvedValue([mockText as any]);
      vi.mocked(prisma.userTextProgress.findUnique).mockResolvedValue(null);
    });

    it('returns reading texts with auth', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/reading/texts')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('text summary has required fields', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/reading/texts')
        .set('Authorization', `Bearer ${token}`);
      if (res.body.length > 0) {
        const t = res.body[0];
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('title');
        expect(t).toHaveProperty('level');
        expect(t).toHaveProperty('wordCount');
        expect(t).toHaveProperty('completed');
      }
    });

    it('filters by level', async () => {
      const token = makeToken();
      const res = await request(app)
        .get('/reading/texts?level=A1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('requires auth → 401 without token', async () => {
      const res = await request(app).get('/reading/texts');
      expect(res.status).toBe(401);
    });
  });

  describe('Quiz — GET /quiz/generate', () => {
    it('requires auth → 401 without token', async () => {
      const res = await request(app).get('/quiz/generate');
      expect(res.status).toBe(401);
    });
  });
});
