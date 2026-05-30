import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import placementRouter from './routes/placement';
import vocabularyRouter from './routes/vocabulary';
import roleplayRouter from './routes/roleplay';
import contentRouter from './routes/content';
import quizRouter from './routes/quiz';
import gamificationRouter from './routes/gamification';
import readingRouter from './routes/reading';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (_req, res) => res.json({ name: 'LinguaPlay API', version: '1.0.0', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/placement', placementRouter);
app.use('/vocabulary', vocabularyRouter);
app.use('/roleplay', roleplayRouter);
app.use('/content', contentRouter);
app.use('/quiz', quizRouter);
app.use('/gamification', gamificationRouter);
app.use('/reading', readingRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`LinguaPlay backend running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
