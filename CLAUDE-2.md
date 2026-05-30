# CLAUDE.md — LinguaPlay: AI-Powered English Learning App
> **v3** — Gemini API desteği eklendi, Gamification, Sesli telaffuz, Kelime temaları, Tıklanabilir kelimeler, Video timestamp, Sesli konuşma pratiği

## Project Overview

**LinguaPlay** is a mobile-first (React Native + Expo) English learning application. Users choose between **Google Gemini API** (free) or **Anthropic Claude API** (paid, more powerful). The backend runs on Railway (Node.js + PostgreSQL via Prisma). The UI language adapts to user preference (Turkish / English at launch).

---

## AI Provider Strategy

### Kullanıcı Seçimi (Onboarding ekranında)

```
┌─────────────────────────────────┐
│  AI Sağlayıcı Seç               │
│                                 │
│  ◉ Google Gemini  — ÜCRETSİZ   │
│    Günlük 1.000 istek, Flash    │
│                                 │
│  ○ Anthropic Claude — Ücretli  │
│    ~$2-3/ay, daha güçlü         │
└─────────────────────────────────┘
```

### Gemini Ücretsiz Tier Limitleri (2026)
| Model | RPM | Günlük | TPM |
|---|---|---|---|
| Gemini 2.5 Flash | 15 | 1.000 | 250.000 |
| Gemini 2.5 Flash-Lite | 15 | 1.000 | 250.000 |
| Gemini 2.5 Pro | 5 | 50 | 250.000 |

> ⚠️ Ücretsiz tier: Google prompt/yanıtları model eğitiminde kullanabilir.
> Billing aktif edilirse ücretsiz tier tamamen kalkar.

### AI Service Abstraction (backend)

```typescript
// src/services/ai.service.ts

type AIProvider = 'gemini' | 'claude';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export class AIService {
  async chat(config: AIConfig, messages: ChatMessage[], system: string): Promise<string> {
    if (config.provider === 'gemini') {
      return this.geminiChat(config.apiKey, messages, system);
    }
    return this.claudeChat(config.apiKey, messages, system);
  }

  async analyzeContent(config: AIConfig, text: string, level: string) { ... }
  async explainWord(config: AIConfig, word: string, context: string, level: string) { ... }
  async generatePlacementTest(config: AIConfig) { ... }
  async evaluatePlacement(config: AIConfig, answers: any[]) { ... }
  async generateQuiz(config: AIConfig, words: string[], level: string) { ... }
  async sessionFeedback(config: AIConfig, transcript: any[]) { ... }
  async evaluateSpeaking(config: AIConfig, transcript: string, topic: string, level: string) { ... }

  // --- Gemini ---
  private async geminiChat(apiKey: string, messages: ChatMessage[], system: string): Promise<string> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: system,
    });
    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last.content);
    return result.response.text();
  }

  // --- Claude ---
  private async claudeChat(apiKey: string, messages: ChatMessage[], system: string): Promise<string> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });
    const valid = messages.filter(m =>
      typeof m.content === 'string' ? m.content.trim() !== '' : false
    );
    if (valid.length === 0) throw new Error('No valid messages');
    const res = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system,
      messages: valid.map(m => ({ role: m.role, content: m.content })),
    });
    return res.content[0].type === 'text' ? res.content[0].text : '';
  }
}
```

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
- **Expo Speech** — text-to-speech (kelime telaffuzu, fallback)
- **Expo Document Picker** — PDF upload
- **React Native Reanimated** — animations (XP, rozet kutlamaları)
- **Victory Native** — progress charts
- **react-native-sound** — ses efektleri

### Backend (Railway)
- **Node.js + Express** (TypeScript)
- **Prisma ORM** + **PostgreSQL** (Railway managed)
- **JWT** authentication
- **youtube-transcript** — YouTube transcript extraction
- **pdf-parse** — PDF text extraction
- **subtitle parser** — .srt / .vtt dosya işleme
- **Bull + Redis** (Railway Redis) — background job queue
- **OpenAI Whisper API** — speech-to-text
- **Google TTS / ElevenLabs** — kelime sesli telaffuz

### AI Paketleri
```bash
npm install @google/generative-ai   # Gemini
npm install @anthropic-ai/sdk       # Claude
```

---

## Project Structure

```
linguaplay/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   └── onboarding/
│   │   │   │       ├── ai-provider.tsx    # ⭐ Gemini vs Claude seçimi
│   │   │   │       └── placement.tsx      # Seviye testi
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx              # Dashboard
│   │   │   │   ├── vocabulary.tsx         # SRS + Gamification
│   │   │   │   ├── roleplay.tsx           # Role-play sahneleri
│   │   │   │   ├── content.tsx            # İçerik analizi
│   │   │   │   └── profile.tsx            # Ayarlar, API key
│   │   │   ├── vocabulary/
│   │   │   │   ├── review.tsx             # SRS günlük tekrar
│   │   │   │   ├── themes.tsx             # Kelime temaları
│   │   │   │   └── [themeId].tsx          # Tema detayı
│   │   │   ├── content/
│   │   │   │   ├── [id].tsx               # Tıklanabilir kelimeler
│   │   │   │   └── player.tsx             # Video timestamp player
│   │   │   ├── roleplay/
│   │   │   │   ├── [sessionId].tsx        # Aktif sahne chat
│   │   │   │   └── speaking.tsx           # Sesli konuşma pratiği
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── vocabulary/
│   │   │   │   ├── WordCard.tsx           # SRS kart
│   │   │   │   ├── WordPopup.tsx          # ⭐ Tıklanabilir kelime popup
│   │   │   │   ├── AudioButton.tsx        # Telaffuz butonu
│   │   │   │   ├── XPBar.tsx              # XP çubuğu
│   │   │   │   ├── BadgeCard.tsx          # Rozet
│   │   │   │   └── ThemeCard.tsx          # Tema kartı
│   │   │   ├── content/
│   │   │   │   ├── ClickableText.tsx      # ⭐ Tıklanabilir metin
│   │   │   │   ├── TimestampPlayer.tsx    # ⭐ Video timestamp
│   │   │   │   └── SubtitleLine.tsx
│   │   │   ├── roleplay/
│   │   │   │   ├── ChatBubble.tsx
│   │   │   │   ├── CorrectionBadge.tsx
│   │   │   │   └── VoiceRecorder.tsx      # ⭐ Sesli kayıt
│   │   │   └── shared/
│   │   │       └── AIProviderBadge.tsx    # Gemini/Claude göstergesi
│   │   ├── hooks/
│   │   │   ├── useWordPopup.ts
│   │   │   ├── useAudio.ts
│   │   │   ├── useSpeechRecognition.ts
│   │   │   └── useXP.ts
│   │   ├── stores/
│   │   │   ├── ai.store.ts                # provider + apiKey
│   │   │   ├── gamification.store.ts      # XP, streak, rozetler
│   │   │   └── vocabulary.store.ts
│   │   ├── services/
│   │   ├── locales/
│   │   │   ├── tr.json
│   │   │   └── en.json
│   │   └── utils/
│   └── backend/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── vocabulary.ts
│       │   │   ├── themes.ts
│       │   │   ├── roleplay.ts
│       │   │   ├── content.ts
│       │   │   ├── quiz.ts
│       │   │   ├── speaking.ts
│       │   │   ├── gamification.ts
│       │   │   └── placement.ts
│       │   ├── services/
│       │   │   ├── ai.service.ts          # ⭐ Gemini + Claude abstraction
│       │   │   ├── youtube.service.ts
│       │   │   ├── subtitle.service.ts
│       │   │   ├── pdf.service.ts
│       │   │   ├── tts.service.ts
│       │   │   ├── stt.service.ts         # Whisper
│       │   │   ├── gamification.service.ts
│       │   │   └── spaced-repetition.service.ts
│       │   ├── middleware/
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   └── jobs/
│       └── railway.json
└── CLAUDE.md
```

---

## Database Schema (Prisma)

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  aiProvider      AIProvider @default(GEMINI)
  apiKeyEnc       String?   // Encrypted (AES-256)
  level           Level     @default(UNSET)
  uiLanguage      String    @default("tr")
  xp              Int       @default(0)
  streak          Int       @default(0)
  lastActiveDate  DateTime?
  createdAt       DateTime  @default(now())

  words            UserWord[]
  sessions         RolePlaySession[]
  contentItems     ContentItem[]
  quizResults      QuizResult[]
  badges           UserBadge[]
  speakingSessions SpeakingSession[]
}

enum AIProvider {
  GEMINI
  CLAUDE
}

enum Level {
  UNSET A1 A2 B1 B2 C1 C2
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
  themeId       String?

  theme         WordTheme?   @relation(fields: [themeId], references: [id])
  userWords     UserWord[]
  contentWords  ContentWord[]
}

model WordTheme {
  id          String @id @default(cuid())
  nameEn      String
  nameTr      String
  emoji       String
  description String
  level       Level
  wordCount   Int    @default(0)
  words       Word[]
}

// Seed: travel ✈️, work 💼, food 🍕, health 🏥, tech 💻,
//       nature 🌿, emotions 😊, sports ⚽, shopping 🛍️, academic 📚

model UserWord {
  id          String     @id @default(cuid())
  userId      String
  wordId      String
  status      WordStatus @default(NEW)
  nextReview  DateTime   @default(now())
  interval    Int        @default(1)
  easeFactor  Float      @default(2.5)
  repetitions Int        @default(0)
  addedFrom   String?    // "content:{id}", "roleplay:{id}", "theme:{id}", "manual"

  user        User       @relation(fields: [userId], references: [id])
  word        Word       @relation(fields: [wordId], references: [id])
}

enum WordStatus {
  NEW LEARNING REVIEW MASTERED
}

model Badge {
  id            String @id @default(cuid())
  key           String @unique
  nameEn        String
  nameTr        String
  descriptionTr String
  emoji         String
  xpReward      Int
  condition     Json   // { type: "streak"|"words"|"sessions", value: number }

  userBadges    UserBadge[]
}

model UserBadge {
  id       String   @id @default(cuid())
  userId   String
  badgeId  String
  earnedAt DateTime @default(now())

  user     User   @relation(fields: [userId], references: [id])
  badge    Badge  @relation(fields: [badgeId], references: [id])

  @@unique([userId, badgeId])
}

model XPEvent {
  id        String   @id @default(cuid())
  userId    String
  amount    Int
  reason    String   // "word_mastered","quiz_perfect","roleplay_session","streak_bonus"
  createdAt DateTime @default(now())
}

model RolePlayScene {
  id            String  @id @default(cuid())
  titleEn       String
  titleTr       String
  descriptionEn String
  descriptionTr String
  category      String
  difficulty    Level
  systemPrompt  String
  isPreset      Boolean @default(true)
  createdBy     String?

  sessions RolePlaySession[]
}

model RolePlaySession {
  id          String  @id @default(cuid())
  userId      String
  sceneId     String?
  customScene String?
  messages    Json    // [{role, content, timestamp, correction?}]
  feedback    String?
  wordsUsed   String[]
  xpEarned    Int     @default(0)
  createdAt   DateTime @default(now())

  user  User            @relation(fields: [userId], references: [id])
  scene RolePlayScene?  @relation(fields: [sceneId], references: [id])
}

model ContentItem {
  id         String      @id @default(cuid())
  userId     String
  type       ContentType
  url        String?
  title      String
  transcript String?
  timestamps Json?       // [{start, end, text}]
  status     JobStatus   @default(PENDING)
  createdAt  DateTime    @default(now())

  user    User           @relation(fields: [userId], references: [id])
  words   ContentWord[]
  phrases ContentPhrase[]
}

enum ContentType {
  YOUTUBE SUBTITLE PDF ARTICLE PODCAST
}

enum JobStatus {
  PENDING PROCESSING DONE FAILED
}

model ContentWord {
  id          String   @id @default(cuid())
  contentId   String
  wordId      String
  occurrences Int
  contexts    String[]

  content ContentItem @relation(fields: [contentId], references: [id])
  word    Word        @relation(fields: [wordId], references: [id])
}

model ContentPhrase {
  id        String @id @default(cuid())
  contentId String
  phrase    String
  meaning   String
  meaningTr String
  examples  String[]

  content ContentItem @relation(fields: [contentId], references: [id])
}

model SpeakingSession {
  id            String   @id @default(cuid())
  userId        String
  topic         String
  transcript    String
  fluencyScore  Int
  grammarScore  Int
  vocabScore    Int
  feedback      Json
  xpEarned      Int      @default(0)
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model QuizResult {
  id        String   @id @default(cuid())
  userId    String
  source    String
  score     Int
  total     Int
  xpEarned  Int      @default(0)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

## Gamification System

### XP Tablosu
| Eylem | XP |
|---|---|
| Kelime tekrarı (Good) | +5 |
| Kelime ustası (Easy) | +10 |
| Quiz %100 doğru | +50 |
| Role-play tamamlama | +30 |
| Sesli pratik | +25 |
| Günlük streak bonusu | +20 |
| İçerik analizi ekleme | +15 |

### Rozet Listesi (Seed)
| Key | Emoji | Koşul |
|---|---|---|
| first_word | 🌱 | İlk kelime öğrenildi |
| streak_3 | 🔥 | 3 gün seri |
| streak_7 | 🔥🔥 | 7 gün seri |
| streak_30 | 👑 | 30 gün seri |
| words_10 | 📚 | 10 kelime öğrenildi |
| words_100 | 🎯 | 100 kelime öğrenildi |
| words_500 | 🏆 | 500 kelime öğrenildi |
| first_roleplay | 🎭 | İlk role-play |
| roleplay_10 | 🌟 | 10 role-play |
| first_content | 📺 | İlk içerik analizi |
| quiz_perfect | ⚡ | Quiz'de 100% |
| first_speaking | 🎤 | İlk sesli pratik |

---

## API Endpoints

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
PUT    /auth/ai-provider          # provider + apiKey güncelle

GET    /placement/test
POST   /placement/evaluate

GET    /vocabulary/words
GET    /vocabulary/due
POST   /vocabulary/review
GET    /vocabulary/:wordId/explain

GET    /themes                    # kelime temaları listesi
GET    /themes/:id/words

GET    /roleplay/scenes
POST   /roleplay/sessions
POST   /roleplay/sessions/:id/message
POST   /roleplay/sessions/:id/voice
POST   /roleplay/sessions/:id/end
GET    /roleplay/sessions/:id

POST   /speaking/sessions
POST   /speaking/sessions/:id/audio
GET    /speaking/sessions/:id

POST   /content
GET    /content
GET    /content/:id
GET    /content/:id/status
POST   /content/:id/quiz
GET    /content/:id/words         # tıklanabilir kelime pozisyonları

GET    /quiz/generate
POST   /quiz/submit

GET    /gamification/stats
GET    /gamification/badges
POST   /gamification/streak/check

PUT    /profile/settings
GET    /profile/stats
```

---

## AI Prompt Patterns

### Kelime Popup (Tıklama)
```
You are an English vocabulary assistant for a [LEVEL] Turkish learner.
The user tapped "[WORD]" in this context: "[SENTENCE]"
Return JSON only:
{
  "word": "...", "phonetic": "...",
  "definitionEn": "...", "definitionTr": "...",
  "examples": ["...", "...", "..."],
  "derivatives": ["..."],
  "level": "B2"
}
```

### İçerik Analizi
```
Analyze this English text for a [LEVEL] learner (native: Turkish).
Text: [CHUNK — max 3000 tokens]
Return JSON only:
{
  "vocabulary": [{"word":"...","definition":"...","definitionTr":"...","level":"B2","context":"..."}],
  "phrases": [{"phrase":"...","meaning":"...","meaningTr":"...","example":"..."}],
  "grammarNotes": ["..."]
}
```

### Konuşma Değerlendirme
```
You are an English speaking coach for a [LEVEL] Turkish learner.
Topic: [TOPIC] | Student said: "[TRANSCRIPT]"
Return JSON only:
{
  "fluencyScore": 7, "grammarScore": 6, "vocabularyScore": 8,
  "strengths": ["..."], "improvements": ["..."],
  "correctedVersion": "...", "suggestedPhrases": ["..."]
}
```

### Role-Play System Prompt
```
You are [CHARACTER] in this scene: [SCENE_DESCRIPTION].
The user is a [LEVEL] English learner (native: Turkish).
Stay in character. Keep sentences [LEVEL]-appropriate.
After EACH user message, append hidden JSON (app strips before display):
{"correction": null | {"original":"...","suggestion":"...","explanation":"..."}, "newWords":["..."]}
```

---

## Railway Environment Variables

```env
DATABASE_URL=               # Railway otomatik
REDIS_URL=                  # Railway otomatik
JWT_SECRET=                 # openssl rand -hex 32
JWT_EXPIRES_IN=7d
API_KEY_ENCRYPTION_SECRET=  # openssl rand -hex 32
PORT=3000
OPENAI_API_KEY=             # Whisper STT
GOOGLE_TTS_API_KEY=         # Kelime telaffuzu (opsiyonel)
ELEVENLABS_API_KEY=         # Alternatif TTS (opsiyonel)
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/index.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Security

- API keyleri AES-256 ile şifreli saklanır, loglanmaz
- JWT kısa ömürlü + refresh token
- Rate limiting (express-rate-limit) — özellikle AI endpoint'lerinde
- Ses dosyası max 10MB
- Kullanıcı girdileri AI'a gönderilmeden sanitize edilir
- STT transkriptleri loglanmaz
- Gemini ücretsiz tier: kullanıcıya veri gizliliği uyarısı göster

---

## Implementation Phases

### Phase 1 — Foundation (Hafta 1–2)
- [ ] Monorepo (Expo + Express)
- [ ] Auth + JWT
- [ ] AI provider seçim ekranı (Gemini / Claude)
- [ ] API key şifreli saklama
- [ ] Railway + Postgres + Redis
- [ ] i18n (TR/EN)

### Phase 2 — Core Vocabulary (Hafta 3–4)
- [ ] Placement test
- [ ] SRS motoru (SM-2)
- [ ] Kelime kartı + günlük tekrar
- [ ] TTS (telaffuz)
- [ ] Gamification (XP, streak, rozetler)
- [ ] Kelime temaları + seed data

### Phase 3 — Role-Play (Hafta 5–6)
- [ ] Preset sahne kütüphanesi
- [ ] Streaming AI yanıtları
- [ ] Inline düzeltme sistemi
- [ ] Özel sahne oluşturma
- [ ] Sesli konuşma (Whisper STT)

### Phase 4 — İçerik Analizi (Hafta 7–9)
- [ ] YouTube transkript + timestamp
- [ ] PDF yükleme
- [ ] Makale scraper
- [ ] Bull queue pipeline
- [ ] ClickableText bileşeni
- [ ] WordPopup (tek tık + uzun basış)
- [ ] TimestampPlayer
- [ ] Altyazı (.srt) desteği
- [ ] Podcast (Whisper)

### Phase 5 — Cila (Hafta 10–11)
- [ ] Quiz modülü
- [ ] Rozet galerisi
- [ ] İstatistik & streak takvimi
- [ ] Push bildirimler
- [ ] Performans optimizasyonu
- [ ] Expo EAS Build (App Store)

---

## Key Design Principles

1. **AI abstraction** — tüm AI çağrıları `ai.service.ts` üzerinden geçer, provider değiştirmek 1 satır
2. **Her AI çağrısında level** — dil karmaşıklığı kalibre edilsin
3. **Streaming role-play** — `stream: true` (Gemini + Claude her ikisi destekler)
4. **JSON output** — content analizi ve quiz için, try/catch ile parse et
5. **Boş mesaj koruması** — `content.trim() !== ''` kontrolü zorunlu
6. **Chunk'la** — max ~3000 token/çağrı içerik analizinde
7. **TTS lazy** — ilk istek gelince üret, URL cache'le
8. **Timestamp sakla** — YouTube transkriptinde start/end koru
9. **WordPopup pozisyon** — ekran kenarı overflow kontrolü
10. **XP animasyon** — Reanimated ile rozet / seviye atlama kutlaması

## Notes for Claude Code

- `npx create-expo-app` TypeScript template
- Prisma: local → `migrate dev`, Railway → `migrate deploy`
- Streaming React Native: `fetch` + `ReadableStream`, axios değil
- NativeWind v4 → Babel config güncelle
- `ClickableText`: her kelime ayrı `<Text onPress>`, FlatList değil
- Ses kaydı: `expo-av` `Audio.Recording` API
- Whisper: `openai` npm, `openai.audio.transcriptions.create()`
- Gemini streaming: `generateContentStream()` kullan
- Rozet kontrolü: her XP olayından sonra `gamification.service` tetikle
- AI provider bilgisi her request'te header'dan al: `x-ai-provider: gemini|claude`
