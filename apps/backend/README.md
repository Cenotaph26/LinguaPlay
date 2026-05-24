# LinguaPlay Backend

Express.js + TypeScript + Prisma + PostgreSQL backend for the LinguaPlay English learning application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and Redis URLs
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run migrations:
```bash
npm run prisma:migrate
```

5. Start development server:
```bash
npm run dev
```

## Build & Deploy

```bash
npm run build
npm start
```

## Project Structure

- `src/index.ts` - Express app entry point
- `src/routes/` - API route handlers
- `src/services/` - Business logic (Claude, content analysis, etc.)
- `src/middleware/` - Express middleware (auth, validation, etc.)
- `src/jobs/` - Bull queue workers for async tasks
- `prisma/schema.prisma` - Database schema

## API Endpoints

See CLAUDE.md in the project root for full API documentation.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - JWT expiration time (e.g., "7d")
- `API_KEY_ENCRYPTION_SECRET` - 32-byte hex secret for AES-256 encryption
- `PORT` - Server port (default: 3000)
