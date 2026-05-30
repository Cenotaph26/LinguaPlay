# CLAUDE.md — LinguaPlay: AI-Powered English Learning App
> **v4** — Freemium-free model: tüm içerikler API key olmadan kullanılabilir. API key ekledikçe AI özellikleri açılır.

---

## Temel Felsefe: "Zero Barrier, Progressive AI"

```
API KEY YOK                    API KEY VAR
─────────────────────────────────────────────────────
Tüm kelime listeleri           + AI kelime açıklama
Tüm hazır sahneler             + Canlı role-play chat
Tüm okuma metinleri            + Otomatik gramer düzeltme
Tüm diyaloglar                 + İçerik analizi (YouTube/PDF)
SRS tekrar sistemi             + Sesli konuşma değerlendirme
Quiz (statik sorular)          + AI quiz üretimi
Placement test (statik)        + Adaptif AI testi
Gamification (XP, rozetler)    + Kişiselleştirilmiş öneriler
```

Kullanıcı hiçbir zaman duvarla karşılaşmaz. API key olmadan da
tam teşekküllü bir öğrenme deneyimi yaşar. Key ekleyince AI
katmanı üstüne oturur, her şey daha akıllı ve dinamik olur.

---

## Project Overview

**LinguaPlay** is a mobile-first (React Native + Expo) English learning app.
- **No API key required** — all static content works forever, free
- **Optional AI layer** — Gemini (free tier) or Claude (paid) for AI features
- Backend: Railway (Node.js + PostgreSQL + Redis)
- UI language: user's choice (TR / EN)

---

## Access Model

### Tier 1 — Free Forever (no API key)

| Modül | İçerik | Miktar |
|---|---|---|
| Kelime Listeleri | A1–C2 CEFR, tema grupları | 3.000+ kelime |
| Hazır Rol-play | Statik senaryo + örnek diyalog | 50+ sahne |
| Okuma Metinleri | Seviyeli hikayeler, makaleler | 200+ metin |
| Dinleme | İnsan sesi kaydı (TTS pre-generated) | 3.000+ ses |
| SRS Tekrar | SM-2 algoritması, tam çalışır | — |
| Quiz | Statik soru havuzu | 2.000+ soru |
| Placement Test | Statik 20 soruluk test | — |
| Gamification | XP, streak, rozetler | — |
| Kelime Temaları | Seyahat, iş, günlük, akademik... | 20+ tema |

### Tier 2 — AI Layer (API key ile açılır, kademeli)

```
TEMEL AI (Gemini Free / Claude)
├── Rol-play chat (canlı AI karakter)
├── Inline gramer düzeltme
├── Kelime popup AI açıklaması
└── Quiz: AI üretimi (kişiselleştirilmiş)

GELİŞMİŞ AI (daha fazla kullanım)
├── İçerik analizi (YouTube URL, PDF, makale)
├── Sesli konuşma pratiği (Whisper STT)
├── Adaptif placement test
└── Kişisel öğrenme yol haritası
```

### UI'da Gösterim Kuralı

- 🔓 **Hiçbir şey kilitli değil** — tüm statik içerik erişilebilir
- ✨ **AI rozeti** — AI özelliği olan buton/alan belli, ama bloke değil
- Tıklayınca: "Bu özellik AI kullanıyor. API key ekle → hemen aktif ol"
- Onboarding'de API key **isteğe bağlı** — "Şimdi değil, sonra eklerim" seçeneği var

---

## Static Content Architecture (Seed Data)

### Kelime Listeleri — `words` + `word_themes` tabloları

```typescript
// Seed kaynakları:
// - Oxford 3000 / 5000 word list
// - CEFR vocabulary lists (A1–C2)
// - Corpus of Contemporary American English (COCA)

// Her kelime için:
interface SeedWord {
  word: string;
  level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2';
  definition: string;       // EN
  definitionTr: string;     // TR
  examples: string[];       // 3 örnek cümle
  phonetic: string;         // IPA
  audioUrl: string;         // pre-generated TTS (Google TTS batch)
  themeIds: string[];       // ilgili temalar
  partOfSpeech: string;
  synonyms: string[];
  collocations: string[];
}

// Tema grupları (20):
const THEMES = [
  'travel', 'work', 'food', 'health', 'technology',
  'nature', 'emotions', 'sports', 'shopping', 'academic',
  'family', 'home', 'city', 'time', 'money',
  'education', 'media', 'science', 'culture', 'relationships'
];
```

### Hazır Rol-play Sahneleri — `roleplay_scenes` tablosu

```typescript
interface StaticScene {
  id: string;
  titleTr: string;
  titleEn: string;
  category: string;
  difficulty: Level;
  description: string;

  // STATIK MOD (API key yok)
  staticDialogue: DialogueLine[];  // hazır yazılmış diyalog
  vocabulary: string[];            // sahnede geçen anahtar kelimeler
  keyPhrases: KeyPhrase[];         // kalıplar + TR açıklamaları
  tips: string[];                  // "Bu sahnede dikkat et:" ipuçları

  // AI MOD (API key var)
  aiSystemPrompt: string;          // canlı AI karakteri için sistem prompt
  aiCharacterName: string;
  aiCharacterDesc: string;
}

interface DialogueLine {
  speaker: 'user' | 'ai';
  text: string;
  translation: string;
  audioUrl?: string;
}
```

**Sahne listesi (50+):**

| Kategori | Sahneler |
|---|---|
| ✈️ Seyahat | Havalimanı check-in, Otel check-in, Kayıp bavul, Kira araba, Tren bileti, Turistik soru, Gümrük |
| 💼 İş | Mülakat, Toplantı, E-posta yazımı, Telefon görüşmesi, Sunum, İş teklifi reddi, Zam isteme |
| 🏥 Sağlık | Doktor randevusu, Eczane, Acil servis, Diş hekimi, Sigorta |
| 🛍️ Alışveriş | İade, Pazarlık, Online sipariş, Kıyafet denerken, Süpermarket |
| 🍽️ Yemek | Restoran siparişi, Allerji bildirme, Hesap isteme, Şikayet |
| 🏠 Günlük | Komşu tanışma, Ev kirası, Tamirci, Banka, Posta |
| 🎓 Eğitim | Öğrenci danışmanı, Kütüphane, Sınav sonuçları |
| 🚗 Ulaşım | Taksi, Yol tarifi, Araba arızası, Metro |

### Okuma Metinleri — `reading_texts` tablosu

```typescript
interface ReadingText {
  id: string;
  title: string;
  level: Level;
  category: string;         // news, story, article, dialogue
  text: string;             // tam metin
  wordCount: number;
  readingTimeMin: number;

  // Statik analiz (pre-processed)
  highlightedWords: HighlightedWord[];  // kelime pozisyonları + definitionTr
  comprehensionQuestions: Question[];   // anlama soruları
  keyPhrases: KeyPhrase[];
  audioUrl?: string;        // pre-generated TTS
}
```

**200+ metin, kategoriler:**
- Güncel haberler (BBC Learning English seviyeli)
- Kısa hikayeler (A1–B2)
- Popüler kültür (dizi/film açıklamaları)
- Bilim & teknoloji makaleleri (B2–C2)
- İş dünyası metinleri

### Quiz Soru Havuzu — `quiz_questions` tablosu

```typescript
// 2.000+ statik soru, türleri:
type QuestionType =
  | 'multiple_choice'     // 4 seçenek, kelime anlamı
  | 'fill_in_blank'       // boşluk doldur
  | 'translation_tr_en'   // TR → EN çeviri
  | 'sentence_order'      // cümle sıralama
  | 'error_correction'    // yanlış kelimeyi bul
  | 'collocation'         // doğru eşleşmeyi seç
  | 'dialogue_complete';  // diyalogu tamamla
```

### Pre-generated Audio — `word_audio` + `dialogue_audio`

```bash
# Build-time script: kelime sesleri toplu üret
# Google TTS veya ElevenLabs batch API
# Output: /storage/audio/words/{wordId}.mp3
#         /storage/audio/dialogues/{sceneId}/{lineIndex}.mp3
# CDN'e yükle (Cloudflare R2 veya AWS S3)

node scripts/generate-audio-batch.ts
```

---

## Database Schema (Prisma) — v4

```prisma
model User {
  id              String      @id @default(cuid())
  email           String      @unique
  passwordHash    String
  aiProvider      AIProvider? // null = API key yok, özgür
  apiKeyEnc       String?
  level           Level       @default(UNSET)
  uiLanguage      String      @default("tr")
  xp              Int         @default(0)
  streak          Int         @default(0)
  lastActiveDate  DateTime?
  onboardingDone  Boolean     @default(false)
  createdAt       DateTime    @default(now())

  words            UserWord[]
  sessions         RolePlaySession[]
  contentItems     ContentItem[]
  quizResults      QuizResult[]
  badges           UserBadge[]
  speakingSessions SpeakingSession[]
  textProgress     UserTextProgress[]
}

enum AIProvider {
  GEMINI CLAUDE
}

enum Level {
  UNSET A1 A2 B1 B2 C1 C2
}

model Word {
  id             String    @id @default(cuid())
  word           String    @unique
  level          Level
  definition     String
  definitionTr   String
  examples       String[]
  phonetic       String?
  audioUrl       String?   // CDN URL
  partOfSpeech   String?
  synonyms       String[]
  collocations   String[]
  themeId        String?
  isActive       Boolean   @default(true)

  theme     WordTheme?   @relation(fields: [themeId], references: [id])
  userWords UserWord[]
  contentWords ContentWord[]
}

model WordTheme {
  id          String  @id @default(cuid())
  key         String  @unique  // 'travel', 'work'...
  nameEn      String
  nameTr      String
  emoji       String
  wordCount   Int     @default(0)
  words       Word[]
}

model UserWord {
  id          String     @id @default(cuid())
  userId      String
  wordId      String
  status      WordStatus @default(NEW)
  nextReview  DateTime   @default(now())
  interval    Int        @default(1)
  easeFactor  Float      @default(2.5)
  repetitions Int        @default(0)
  addedFrom   String?
  user        User       @relation(fields: [userId], references: [id])
  word        Word       @relation(fields: [wordId], references: [id])
  @@unique([userId, wordId])
}

enum WordStatus { NEW LEARNING REVIEW MASTERED }

model RolePlayScene {
  id              String  @id @default(cuid())
  titleEn         String
  titleTr         String
  category        String
  difficulty      Level
  descriptionTr   String
  isPreset        Boolean @default(true)

  // Statik içerik (her zaman erişilebilir)
  staticDialogue  Json    // DialogueLine[]
  vocabulary      String[]
  keyPhrases      Json    // KeyPhrase[]
  tips            String[]

  // AI modu (key gerekir)
  aiSystemPrompt  String
  aiCharacterName String
  aiCharacterDesc String

  sessions RolePlaySession[]
}

model RolePlaySession {
  id          String   @id @default(cuid())
  userId      String
  sceneId     String?
  customScene String?
  mode        SessionMode @default(STATIC)  // STATIC | AI
  messages    Json
  feedback    Json?
  wordsUsed   String[]
  xpEarned    Int      @default(0)
  createdAt   DateTime @default(now())

  user  User           @relation(fields: [userId], references: [id])
  scene RolePlayScene? @relation(fields: [sceneId], references: [id])
}

enum SessionMode { STATIC AI }

model ReadingText {
  id           String  @id @default(cuid())
  title        String
  level        Level
  category     String
  text         String
  wordCount    Int
  readingTimeMin Int
  audioUrl     String?
  highlightedWords Json   // [{word, start, end, definitionTr}]
  comprehensionQs  Json   // Question[]
  keyPhrases       Json

  userProgress UserTextProgress[]
}

model UserTextProgress {
  id        String   @id @default(cuid())
  userId    String
  textId    String
  completed Boolean  @default(false)
  score     Int?
  readAt    DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  text      ReadingText @relation(fields: [textId], references: [id])
  @@unique([userId, textId])
}

model QuizQuestion {
  id           String       @id @default(cuid())
  type         QuestionType
  level        Level
  question     String
  options      String[]
  correctIndex Int
  explanation  String?
  wordId       String?
  themeId      String?
  source       String       @default("static")  // "static" | "ai_generated"
}

enum QuestionType {
  MULTIPLE_CHOICE FILL_IN_BLANK TRANSLATION
  SENTENCE_ORDER ERROR_CORRECTION COLLOCATION DIALOGUE_COMPLETE
}

model ContentItem {
  id         String      @id @default(cuid())
  userId     String
  type       ContentType
  url        String?
  title      String
  transcript String?
  timestamps Json?
  status     JobStatus   @default(PENDING)
  createdAt  DateTime    @default(now())
  user       User        @relation(fields: [userId], references: [id])
  words      ContentWord[]
  phrases    ContentPhrase[]
}

enum ContentType { YOUTUBE SUBTITLE PDF ARTICLE PODCAST }
enum JobStatus { PENDING PROCESSING DONE FAILED }

model ContentWord {
  id          String   @id @default(cuid())
  contentId   String
  wordId      String
  occurrences Int
  contexts    String[]
  content     ContentItem @relation(fields: [contentId], references: [id])
  word        Word        @relation(fields: [wordId], references: [id])
}

model ContentPhrase {
  id        String @id @default(cuid())
  contentId String
  phrase    String
  meaning   String
  meaningTr String
  examples  String[]
  content   ContentItem @relation(fields: [contentId], references: [id])
}

model Badge {
  id            String @id @default(cuid())
  key           String @unique
  nameEn        String
  nameTr        String
  descriptionTr String
  emoji         String
  xpReward      Int
  condition     Json
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

model SpeakingSession {
  id           String   @id @default(cuid())
  userId       String
  topic        String
  transcript   String
  fluencyScore Int
  grammarScore Int
  vocabScore   Int
  feedback     Json
  xpEarned     Int      @default(0)
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}

model QuizResult {
  id        String   @id @default(cuid())
  userId    String
  source    String
  score     Int
  total     Int
  xpEarned  Int      @default(0)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## API Endpoints — v4

```
// AUTH
POST   /auth/register
POST   /auth/login
GET    /auth/me
POST   /auth/skip-api-key       // onboarding'de "şimdi değil"
PUT    /auth/ai-provider         // key ekle/güncelle/kaldır

// PLACEMENT
GET    /placement/test           // statik test (her zaman)
POST   /placement/evaluate       // statik değerlendirme
POST   /placement/evaluate-ai    // AI değerlendirme (key gerekir)

// VOCABULARY
GET    /vocabulary/words         // filtreleme: level, theme, status
GET    /vocabulary/due           // SRS günlük kuyruk
POST   /vocabulary/review        // SRS oylama
GET    /vocabulary/:wordId       // kelime detayı (statik, her zaman)
POST   /vocabulary/:wordId/explain-ai  // AI açıklama (key gerekir)
GET    /themes                   // tema listesi
GET    /themes/:id/words

// ROLEPLAY
GET    /roleplay/scenes          // sahne listesi
GET    /roleplay/scenes/:id      // statik diyalog + vocab (her zaman)
POST   /roleplay/sessions        // yeni oturum (mode: static | ai)
POST   /roleplay/sessions/:id/message     // AI mesaj (key gerekir)
POST   /roleplay/sessions/:id/end
GET    /roleplay/sessions/:id

// READING
GET    /reading/texts            // metin listesi (level, category filtre)
GET    /reading/texts/:id        // tam metin + highlighted words (her zaman)
POST   /reading/texts/:id/complete
GET    /reading/texts/:id/words  // tıklanabilir kelimeler (statik)
POST   /reading/texts/:id/words/:wordId/explain-ai  // AI (key gerekir)

// CONTENT ANALYSIS — AI only
POST   /content                  // URL/dosya ekle (key gerekir)
GET    /content
GET    /content/:id
GET    /content/:id/status

// QUIZ
GET    /quiz/static              // statik soru havuzundan quiz
POST   /quiz/ai-generate         // AI quiz üretimi (key gerekir)
POST   /quiz/submit

// SPEAKING — AI only
POST   /speaking/sessions        // key gerekir
POST   /speaking/sessions/:id/audio

// GAMIFICATION
GET    /gamification/stats
GET    /gamification/badges
POST   /gamification/streak/check

// PROFILE
GET    /profile
PUT    /profile/settings
GET    /profile/stats
```

---

## Frontend: AI Feature Gate Pattern

```typescript
// hooks/useAIFeature.ts
export function useAIFeature() {
  const { user } = useAuth();
  const hasKey = !!user?.apiKeyEnc;

  function requireAI(onHasKey: () => void) {
    if (hasKey) {
      onHasKey();
    } else {
      // Bottom sheet göster: "AI özelliği — key ekle"
      router.push('/settings/add-api-key');
    }
  }

  return { hasKey, requireAI };
}

// Kullanım örneği:
function WordCard({ word }) {
  const { requireAI } = useAIFeature();

  return (
    <View>
      <Text>{word.definition}</Text>
      {/* Her zaman görünür, tıklayınca ya açar ya key ister */}
      <TouchableOpacity
        onPress={() => requireAI(() => explainWithAI(word))}
      >
        <SparkleIcon />
        <Text>AI ile açıkla</Text>
        {!hasKey && <LockBadge />}
      </TouchableOpacity>
    </View>
  );
}
```

### AI Feature Badge Kuralları

```
✨ simgesi    → AI özelliği, key varsa hemen çalışır
✨ + kilit    → AI özelliği, key yoksa prompt göster
(rozet yok)  → Tamamen statik, her zaman çalışır
```

---

## Onboarding Flow — v4

```
1. Dil seç (TR / EN)
2. Placement test (statik, zorunlu)
   → Seviye belirlenir (A1–C2)
3. Uygulama tanıtımı (3 slide)
   → Kelimeler, Sahneler, Okuma
4. AI özelliği tanıtımı
   ┌──────────────────────────────┐
   │ 🚀 AI ile süper güçlen       │
   │                              │
   │ API key ekle → role-play     │
   │ canlı, içerik analizi, sesli │
   │ pratik aktif olsun           │
   │                              │
   │ [Gemini key ekle — ücretsiz] │
   │ [Claude key ekle]            │
   │ [Şimdi değil →]              │
   └──────────────────────────────┘
5. Dashboard → kullanmaya başla
```

---

## Seed Script

```bash
# Tüm statik içeriği yükle
npx tsx scripts/seed-all.ts

# Ayrı ayrı:
npx tsx scripts/seed-words.ts        # 3000+ kelime (Oxford 3000)
npx tsx scripts/seed-themes.ts       # 20 tema
npx tsx scripts/seed-scenes.ts       # 50+ rol-play sahnesi
npx tsx scripts/seed-texts.ts        # 200+ okuma metni
npx tsx scripts/seed-quiz.ts         # 2000+ soru
npx tsx scripts/seed-badges.ts       # rozet tanımları

# Ses dosyalarını toplu üret (opsiyonel, pahalı)
npx tsx scripts/generate-audio.ts --words --scenes
```

---

## Gamification — v4

### XP Kaynakları
| Eylem | XP | API Key gerekir mi? |
|---|---|---|
| Kelime tekrarı (Good) | +5 | ❌ |
| Kelime tekrarı (Easy) | +10 | ❌ |
| Statik quiz tamamlama | +20 | ❌ |
| Okuma metni bitirme | +15 | ❌ |
| Statik sahne tamamlama | +10 | ❌ |
| Günlük streak | +20 | ❌ |
| AI role-play oturumu | +30 | ✅ |
| AI sesli pratik | +25 | ✅ |
| AI quiz (100%) | +50 | ✅ |
| İçerik analizi ekleme | +15 | ✅ |

### Rozetler (key olmadan kazanılabilir olanlar işaretli)
| Key | Emoji | Koşul | Key gerekir? |
|---|---|---|---|
| first_word | 🌱 | İlk kelime | ❌ |
| streak_7 | 🔥 | 7 gün | ❌ |
| words_100 | 🎯 | 100 kelime | ❌ |
| first_scene_static | 🎭 | İlk statik sahne | ❌ |
| first_reading | 📖 | İlk okuma metni | ❌ |
| quiz_perfect | ⚡ | Quiz 100% | ❌ |
| first_ai_roleplay | 🤖 | İlk AI role-play | ✅ |
| first_content | 📺 | İlk içerik analizi | ✅ |
| first_speaking | 🎤 | İlk sesli pratik | ✅ |

---

## Tech Stack

### Frontend
- React Native (Expo SDK 51+), Expo Router
- NativeWind v4, React Query v5, Zustand
- i18next (TR/EN), Expo AV, Expo Speech
- React Native Reanimated, Victory Native

### Backend (Railway)
- Node.js + Express (TypeScript), Prisma + PostgreSQL
- Bull + Redis (content analysis jobs)
- JWT auth, AES-256 API key encryption
- `@google/generative-ai`, `@anthropic-ai/sdk`
- `youtube-transcript`, `pdf-parse`, OpenAI Whisper

### Static Content CDN
- Kelime ses dosyaları → Cloudflare R2 / AWS S3
- Pre-generated, build-time, ~500MB toplam

---

## Railway Environment Variables

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=                    # openssl rand -hex 32
JWT_EXPIRES_IN=7d
API_KEY_ENCRYPTION_SECRET=     # openssl rand -hex 32
PORT=3000
OPENAI_API_KEY=                # Whisper STT (opsiyonel)
GOOGLE_TTS_KEY=                # Toplu ses üretimi (build-time)
CDN_BASE_URL=                  # R2 veya S3 URL
```

---

## Implementation Phases — v4

### Phase 1 — Foundation (Hafta 1–2)
- [ ] Monorepo, Expo + Express
- [ ] Auth (register/login/JWT)
- [ ] Onboarding flow (statik placement test + AI key opsiyonel)
- [ ] Railway + Postgres + Redis

### Phase 2 — Static Content (Hafta 3–5)
- [ ] Seed: 3000+ kelime, 20 tema
- [ ] Seed: 50+ sahne (statik diyaloglar)
- [ ] Seed: 200+ okuma metni
- [ ] Seed: 2000+ quiz sorusu
- [ ] SRS motoru (SM-2)
- [ ] Gamification (XP, streak, rozetler)
- [ ] Toplu ses üretimi scripti

### Phase 3 — AI Layer (Hafta 6–8)
- [ ] AI provider seçim + key yönetimi
- [ ] `useAIFeature` hook + gate pattern
- [ ] AI role-play chat (streaming)
- [ ] AI kelime açıklama popup
- [ ] AI quiz üretimi

### Phase 4 — Advanced AI (Hafta 9–11)
- [ ] İçerik analizi (YouTube, PDF, makale)
- [ ] Sesli konuşma pratiği (Whisper)
- [ ] Tıklanabilir kelimeler (content ekranı)
- [ ] Timestamp player

### Phase 5 — Polish (Hafta 12–13)
- [ ] Push bildirimler (Expo Notifications)
- [ ] İstatistik & streak takvimi
- [ ] Performans optimizasyonu
- [ ] Expo EAS Build (App Store / Play Store)

---

## Notes for Claude Code

- Static content hiçbir zaman AI API gerektirmez
- `useAIFeature()` hook tüm AI butonlarında kullanılmalı
- API key yoksa AI endpoint'leri 403 döner, frontend gate gösterir
- Placement test statik → server-side hardcoded sorular + kural tabanlı seviye atama
- Ses dosyaları CDN'den, fallback olarak Expo Speech (device TTS)
- Statik sahne "okuma modu": diyalog scroll edilir, kelimeler tıklanabilir, quiz var
- AI sahne "chat modu": canlı mesajlaşma, streaming, düzeltme
- Her ikisi de aynı `RolePlayScene` verisini kullanır, mode farklı
