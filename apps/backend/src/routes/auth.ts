import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const USER_SELECT = {
  id: true,
  email: true,
  level: true,
  uiLanguage: true,
  apiKeyEnc: true,
} as const;

function userPayload(user: { id: string; email: string; level: string; uiLanguage: string; apiKeyEnc: string | null }) {
  return {
    id: user.id,
    email: user.email,
    level: user.level,
    uiLanguage: user.uiLanguage,
    hasApiKey: !!user.apiKeyEnc,
  };
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password || password.length < 6) {
      res.status(400).json({ error: 'Email ve en az 6 karakter şifre gerekli' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'Bu email zaten kayıtlı' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash },
      select: USER_SELECT,
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? 'dev_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    });
    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Kayıt işlemi başarısız' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email ve şifre gerekli' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { ...USER_SELECT, passwordHash: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Geçersiz email veya şifre' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET ?? 'dev_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    });
    res.json({ token, user: userPayload(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Giriş işlemi başarısız' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
    });
    if (!user) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json(userPayload(user));
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
