import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { decrypt } from '../services/encryption.service';

export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { apiKeyEnc: true },
    });
    if (!user?.apiKeyEnc) {
      res.status(402).json({ error: 'API_KEY_REQUIRED' });
      return;
    }
    req.apiKey = decrypt(user.apiKeyEnc);
    next();
  } catch (err) {
    console.error('[apiKey middleware]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
