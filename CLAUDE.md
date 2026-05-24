# CLAUDE.md — LinguaPlay: AI-Powered English Learning App

## Project Overview

**LinguaPlay** is a mobile-first (React Native + Expo) English learning application powered by the Anthropic Claude API. Users enter their own API key. The backend runs on Railway (Node.js + PostgreSQL via Prisma). The UI language adapts to user preference (Turkish / English at launch).

---

## Tech Stack

### Frontend
- **React Native** (Expo SDK 51+)
- **Expo Router** (file-based navigation)
- **NativeWind** (Tailwind CSS for React Native)
- **React Query** (TanStack Query v5) — server state
- **Zustand** — client/local state
- **i18next + react-i18next** — TR/EN localization
- **Expo AV** — audio playback (pronunciation, podcasts)
- **Expo Document Picker** — PDF upload
- **React Native Reanimated** — animations
- **Victory Native** — progress charts

### Backend (Railway)
- **Node.js + Express** (TypeScript)
- **Prisma ORM** + **PostgreSQL** (Railway managed)
- **JWT** authentication
- **youtube-transcript** — YouTube transcript extraction
- **pdf-parse** — PDF text extraction
- **OpenSubtitles API** / subtitle parser — Netflix/series subtitles
- **Bull + Redis** (Railway Redis) — background job queue for content analysis

### AI
- **Anthropic Claude API** (`claude-sonnet-4-20250514`)
- User provides their own API key (stored encrypted in DB, never logged)
- All Claude calls proxied through backend (key never exposed to frontend)

---

## Project Structure

```
linguaplay/
├── apps/
│   ├── mobile/                    # Expo React Native app
│   │   ├── app/                   # Expo Router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx          # Dashboard / Home
│   │   │   │   ├── vocabulary.tsx     # Vocabulary module
│   │   │   │   ├── roleplay.tsx       # Role-play scenes
│   │   │   │   ├── content.tsx        # Content analysis
│   │   │   │   └── profile.tsx        # Settings, API key, progress
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   ├── vocabulary/
│   │   │   ├── roleplay/
│   │   │   ├── content/
│   │   │   └── shared/
│   │   ├── hooks/
│   │   ├── stores/                    # Zustand stores
│   │   ├── services/                  # API client functions
│   │   ├── locales/
│   │   │   ├── tr.json
│   │   │   └── en.json
│   │   └── utils/
│   └── backend/                   # Express API
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── vocabulary.ts
│       │   │   ├── roleplay.ts
│       │   │   ├── content.ts
│       │   │   ├── quiz.ts
│       │   │   └── placement.ts
│       │   ├── services/
│       │   │   ├── claude.service.ts
│       │   │   ├── youtube.service.ts
│       │   │   ├── subtitle.service.ts
│       │   │   ├── pdf.service.ts
│       │   │   └── spaced-repetition.service.ts
│       │   ├── middleware/
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   └── jobs/              # Bull queue workers
│       └── railway.json
└── CLAUDE.md
```

---

## Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  apiKeyEnc     String?  // Encrypted Claude API key
  level         Level    @default(UNSET)
  uiLanguage    String   @default("tr")
  createdAt     DateTime @default(now())

  words         UserWord[]
  sessions      RolePlaySession[]
  contentItems  ContentItem[]
  quizResults   QuizResult[]
}

enum Level {
  UNSET
  A1 A2 B1 B2 C1 C2
}

model Word {
  id            String   @id @default(cuid())
  word          String   @unique
  definition    String
  definitionTr  String
  examples      String[]
  phonetic      String?
  audioUrl      String?
  level         Level

  userWords     UserWord[]
  contentWords  ContentWord[]
}

model UserWord {
  id            String   @id @default(cuid())
  userId        String
  wordId        String
  status        WordStatus @default(NEW)
  nextReview    DateTime   @default(now())
  interval      Int        @default(1)   // SRS interval in days
  easeFactor    Float      @default(2.5)
  repetitions   Int        @default(0)
  user          User       @relation(fields: [userId], references: [id])
  word          Word       @relation(fields: [wordId], references: [id])
}

enum WordStatus {
  NEW LEARNING REVIEW MASTERED
}

model RolePlayScene {
  id            String   @id @default(cuid())
  titleEn       String
  titleTr       String
  descriptionEn String
  descriptionTr String
  category      String   // travel, work, daily, emergency, shopping...
  difficulty    Level
  systemPrompt  String   // Claude system prompt for this scene
  isPreset      Boolean  @default(true)
  createdBy     String?  // null = system preset

  sessions      RolePlaySession[]
}

model RolePlaySession {
  id            String   @id @default(cuid())
  userId        String
  sceneId       String?
  customScene   String?  // User's own scene description
  messages      Json     // [{role, content, timestamp, corrections?}]
  feedback      String?  // Claude's end-of-session feedback
  wordsUsed     String[] // New words encountered
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  scene         RolePlayScene? @relation(fields: [sceneId], references: [id])
}

model ContentItem {
  id            String      @id @default(cuid())
  userId        String
  type          ContentType
  url           String?
  title         String
  transcript    String?
  status        JobStatus   @default(PENDING)
  createdAt     DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id])
  words         ContentWord[]
  phrases       ContentPhrase[]
}

enum ContentType {
  YOUTUBE SUBTITLE PDF ARTICLE PODCAST
}

enum JobStatus {
  PENDING PROCESSING DONE FAILED
}

model ContentWord {
  id            String  @id @default(cuid())
  contentId     String
  wordId        String
  occurrences   Int
  contexts      String[] // sentences where word appears
  content       ContentItem @relation(fields: [contentId], references: [id])
  word          Word        @relation(fields: [wordId], references: [id])
}

model ContentPhrase {
  id            String  @id @default(cuid())
  contentId     String
  phrase        String
  meaning       String
  meaningTr     String
  examples      String[]
  content       ContentItem @relation(fields: [contentId], references: [id])
}
```

---

## Modules & Features

### 1. Placement Test (Onboarding)
- 20-question adaptive test generated by Claude
- Covers grammar, vocabulary, reading comprehension
- Claude evaluates answers and assigns CEFR level (A1–C2)
- Result stored on `User.level`
- Can be retaken from profile

**Claude Prompt Pattern:**
```
You are an English placement test examiner. Generate a 20-question test for a Turkish speaker. 
Mix grammar, vocabulary, and reading. Return JSON: { questions: [{id, type, question, options?, correctAnswer, level}] }
After answers submitted, evaluate and return: { level: "B1", explanation: "..." }
```

---

### 2. Vocabulary Module
- **Word cards** with definition (EN + TR), example sentences, phonetic, audio
- **Spaced Repetition System (SRS)** — SM-2 algorithm
  - Daily review queue based on `nextReview` date
  - User rates recall: Again / Hard / Good / Easy → updates interval & easeFactor
- **AI Word Explainer**: tap any word → Claude explains in context, gives 3 example sentences at user's level
- **Word lists**: My Words, Due Today, Mastered, By Topic
- Words auto-added from Role-play sessions and Content analysis

**SRS Update Logic (SM-2):**
```typescript
function updateSRS(word: UserWord, quality: 0|1|2|3): UserWord {
  // quality: 0=Again, 1=Hard, 2=Good, 3=Easy
  // standard SM-2 formula
}
```

---

### 3. Role-Play Module ⭐ (Core Feature)

#### Preset Scenes (library)
Categorized scene cards the user can browse and start:
- **Daily Life**: ordering coffee, asking for directions, making appointments
- **Travel**: airport check-in, hotel issues, lost luggage, customs
- **Work**: job interview, meeting, email follow-up, presenting
- **Emergency**: doctor visit, pharmacy, reporting theft
- **Social**: making friends, dating, parties, small talk
- **Shopping**: returns, bargaining, online order issues

Each preset has: title (TR/EN), difficulty badge, scene description, and a pre-written Claude system prompt that defines the AI character and scenario.

#### Custom Scenes (user-created)
User describes their own scenario in Turkish or English:
> "Yeni bir şehre taşındım, komşumla tanışıyorum ve internet kurdurmam gerekiyor."

Claude receives this description and:
1. Generates a character (name, personality, context)
2. Starts the scene naturally
3. Responds in character throughout

#### During Role-Play
- Chat-style UI (WhatsApp-like bubbles)
- User types in English
- Claude responds in character
- **Inline corrections**: after each user message, Claude optionally shows a subtle correction badge (tap to see: "You said X → better: Y")
- **Hint button**: "I don't know how to say..." → Claude gives a suggestion without breaking character
- **Vocabulary tap**: long-press any word in Claude's response → quick definition popup

#### End of Session
- Claude provides a structured feedback card:
  - Grammar mistakes summary
  - New vocabulary used / suggested
  - Fluency score (1–10)
  - "What to practice next" suggestion
- Option to save session transcript
- New words from session → auto-added to Vocabulary module

**System Prompt Template:**
```
You are roleplaying as [CHARACTER] in this scene: [SCENE_DESCRIPTION].
The user is a [LEVEL] English learner (native language: Turkish).
Stay in character. Keep sentences at [LEVEL]-appropriate complexity.
After EACH user message, append a JSON block (hidden from display, parsed by app):
{"correction": null | {"original": "...", "suggestion": "...", "explanation": "..."}, "newWords": ["..."]}
```

---

### 4. Content Analysis Module ⭐ (Core Feature)

User adds a content source. Backend processes it asynchronously (Bull queue). Frontend polls for status.

#### Supported Sources

| Type | Input | Extraction Method |
|------|-------|-------------------|
| YouTube | URL | `youtube-transcript` npm package → transcript |
| Netflix/Series | .srt / .vtt subtitle file upload | Subtitle parser |
| Article / Book URL | URL | `axios` + `cheerio` scraper |
| PDF | File upload | `pdf-parse` |
| Podcast | URL or audio upload | Whisper API transcription |

#### Processing Pipeline (per content item)
1. **Extract** raw text / transcript
2. **Chunk** into segments (paragraphs or ~30s chunks)
3. **Send to Claude** with user's level → returns:
   - Key vocabulary list (word + definition EN + TR + level tag)
   - Important phrases / idioms (phrase + meaning + example)
   - Grammar patterns worth noting
4. **Store** words → `ContentWord`, phrases → `ContentPhrase`
5. Status → `DONE`

#### Content Detail Screen
- Original transcript shown with **highlighted words** (tap for definition)
- **Vocabulary tab**: all extracted words, filterable by level
- **Phrases tab**: idioms and collocations from the content
- **Quiz tab**: auto-generated quiz from this content's vocabulary
- **Flashcard tab**: review just this content's words with SRS
- **Search**: find any word/phrase within the content

**Claude Prompt for Content Analysis:**
```
Analyze this English text for a [LEVEL] learner (native language: Turkish).
Text: [CHUNK]
Return JSON only:
{
  "vocabulary": [{"word": "...", "definition": "...", "definitionTr": "...", "level": "B2", "context": "sentence from text"}],
  "phrases": [{"phrase": "...", "meaning": "...", "meaningTr": "...", "example": "..."}],
  "grammarNotes": ["..."]
}
```

---

### 5. Quiz Module
- Auto-generated from: vocabulary deck, content items, or role-play session words
- Question types:
  - Multiple choice (definition → word)
  - Fill in the blank (sentence with gap)
  - Translation (TR → EN)
  - Context match (pick the sentence where word is used correctly)
- Results feed back into SRS scores

---

### 6. Profile & Settings
- **API Key management**: input, test connection, update, delete
- **Level**: current CEFR level + retake test
- **UI Language**: Turkish / English toggle
- **Daily goal**: words per day, practice minutes
- **Streak** tracker
- **Statistics**: words learned, sessions completed, content analyzed, quiz accuracy
- **Notifications**: daily review reminders (Expo Notifications)

---

## API Endpoints

```
POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /placement/test
POST   /placement/evaluate

GET    /vocabulary/words          # paginated, filterable
GET    /vocabulary/due            # SRS due today
POST   /vocabulary/review         # submit SRS rating
GET    /vocabulary/:wordId/explain # Claude explanation

GET    /roleplay/scenes           # preset scene library
POST   /roleplay/sessions         # start session (preset or custom)
POST   /roleplay/sessions/:id/message  # send message, get reply + correction
POST   /roleplay/sessions/:id/end      # end session, get feedback
GET    /roleplay/sessions/:id     # session history

POST   /content                   # add content item (url or file upload)
GET    /content                   # user's content list
GET    /content/:id               # detail with words & phrases
GET    /content/:id/status        # polling endpoint for job status
POST   /content/:id/quiz          # generate quiz for this content

GET    /quiz/generate             # generate quiz (params: source, count, type)
POST   /quiz/submit               # submit answers, get results + SRS updates

PUT    /profile/apikey            # update encrypted API key
PUT    /profile/settings          # language, level, goals
GET    /profile/stats
```

---

## Claude API Integration (Backend Service)

```typescript
// backend/src/services/claude.service.ts

import Anthropic from "@anthropic-ai/sdk";

export class ClaudeService {
  private getClient(apiKey: string) {
    return new Anthropic({ apiKey });
  }

  async chat(apiKey: string, messages: MessageParam[], system: string) {
    const client = this.getClient(apiKey);
    return client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages,
    });
  }

  async analyzeContent(apiKey: string, text: string, level: string) { ... }
  async generatePlacementTest(apiKey: string) { ... }
  async evaluatePlacement(apiKey: string, answers: any[]) { ... }
  async explainWord(apiKey: string, word: string, context: string, level: string) { ... }
  async generateQuiz(apiKey: string, words: string[], level: string) { ... }
  async sessionFeedback(apiKey: string, transcript: any[]) { ... }
}
```

---

## Railway Deployment

### Services on Railway
1. **backend** — Node.js Express app
2. **postgres** — Railway managed PostgreSQL
3. **redis** — Railway managed Redis (for Bull queues)

### Environment Variables
```env
DATABASE_URL=postgresql://...       # Railway injects automatically
REDIS_URL=redis://...               # Railway injects automatically
JWT_SECRET=
JWT_EXPIRES_IN=7d
API_KEY_ENCRYPTION_SECRET=          # 32-byte hex for AES-256 encryption
PORT=3000
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/index.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Security Considerations

- User API keys encrypted with AES-256 before DB storage (`crypto` module)
- Keys decrypted in-memory per request, never logged
- JWT tokens with short expiry + refresh token pattern
- Rate limiting on all Claude-proxied endpoints (express-rate-limit)
- File upload size limits (PDF max 10MB)
- Input sanitization on all user-provided text before sending to Claude

---

## Implementation Order (Suggested Phases)

### Phase 1 — Foundation (Week 1–2)
- [ ] Project scaffolding (monorepo, Expo + Express)
- [ ] Auth (register/login/JWT)
- [ ] API key input + encrypted storage
- [ ] Railway + Postgres + Redis setup
- [ ] i18n setup (TR/EN)

### Phase 2 — Core Learning (Week 3–4)
- [ ] Placement test (Claude-generated)
- [ ] Vocabulary module + SRS engine
- [ ] Word card UI + daily review screen

### Phase 3 — Role-Play (Week 5–6)
- [ ] Preset scene library
- [ ] Chat UI with streaming Claude responses
- [ ] Inline corrections system
- [ ] Custom scene creation
- [ ] End-of-session feedback

### Phase 4 — Content Analysis (Week 7–9)
- [ ] YouTube transcript extraction
- [ ] PDF upload + parsing
- [ ] Article scraper
- [ ] Bull queue processing pipeline
- [ ] Content detail screen with word highlights
- [ ] Subtitle (.srt) upload support
- [ ] Podcast / Whisper integration

### Phase 5 — Polish (Week 10–11)
- [ ] Quiz module
- [ ] Statistics & streak
- [ ] Push notifications (daily review reminders)
- [ ] Performance optimization
- [ ] App store prep (Expo EAS Build)

---

## Key Design Principles for Claude

1. **Always pass user level** in every Claude prompt so language complexity is calibrated
2. **Streaming responses** for role-play chat (better UX, use `stream: true`)
3. **Structured JSON output** for content analysis and quizzes — instruct Claude to return only JSON, parse with try/catch
4. **System prompts in English** always — more reliable Claude behavior
5. **Chunk large content** — max ~3000 tokens per Claude call for content analysis
6. **Cache placement tests** — don't regenerate if user hasn't retaken the test
7. **Role-play correction JSON** appended to response and stripped before display

---

## Notes for Claude Code

- Use `npx create-expo-app` with TypeScript template for mobile
- Use `npm create` or manual setup for Express backend
- Prisma migrations: always run `npx prisma migrate dev` locally, `migrate deploy` on Railway
- For streaming in React Native: use `fetch` with `ReadableStream`, not axios
- NativeWind v4 requires Babel config update — check NativeWind docs
- Expo Router requires `expo-router` and correct `main` field in package.json
- Test API key encryption/decryption before implementing role-play (critical dependency)
