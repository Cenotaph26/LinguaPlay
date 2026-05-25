import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];

function userPayload(user: { id: string; email: string; level: string; uiLanguage: string }) {
  return { id: user.id, email: user.email, level: user.level, uiLanguage: user.uiLanguage };
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    return;
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Geçerli bir e-posta girin' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, level: true, uiLanguage: true },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Kayıt işlemi başarısız' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'E-posta veya şifre hatalı' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'E-posta veya şifre hatalı' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: userPayload(user) });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Giriş işlemi başarısız' });
  }
});

// GET /auth/me  (protected)
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, level: true, uiLanguage: true },
    });
    if (!user) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json(userPayload(user));
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı' });
  }
});

export default router;
