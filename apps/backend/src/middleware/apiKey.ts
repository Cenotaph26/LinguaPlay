import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { decrypt } from '../services/encryption.service';
import { AuthRequest } from './auth';

export interface ApiKeyRequest extends AuthRequest {
  apiKey?: string;
}

export async function requireApiKey(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { apiKeyEnc: true },
    });
    if (!user || !user.apiKeyEnc) {
      res.status(402).json({ error: 'API anahtarı gerekli', code: 'NO_API_KEY' });
      return;
    }
    req.apiKey = decrypt(user.apiKeyEnc);
    next();
  } catch {
    res.status(500).json({ error: 'API anahtarı çözülemedi' });
  }
}
