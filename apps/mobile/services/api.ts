import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://linguaplay-production-94c0.up.railway.app';

export interface UserData {
  id: string;
  email: string;
  level: string;
  uiLanguage: string;
  hasApiKey: boolean;
  xp?: number;
  streak?: number;
}

export interface Word {
  id: string;
  word: string;
  definition: string;
  definitionTr: string;
  examples: string[];
  phonetic?: string;
  level: string;
}

export interface UserWord {
  id: string;
  word: string;
  definition: string;
  definitionTr: string;
  examples: string[];
  phonetic?: string;
  audioUrl?: string;
  level: string;
  userWord: {
    id: string;
    status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
    nextReview: string;
    interval: number;
    easeFactor: number;
    repetitions: number;
  };
}

export interface ContentItem {
  id: string;
  type: string;
  url?: string;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  createdAt: string;
  _count?: { words: number; phrases: number };
}

export interface ContentDetail extends ContentItem {
  transcript?: string;
  words: Array<{ id: string; word: Word; occurrences: number; contexts: string[] }>;
  phrases: Array<{ id: string; phrase: string; meaning: string; meaningTr: string; examples: string[] }>;
}

export interface RolePlayScene {
  id: string;
  titleEn: string;
  titleTr: string;
  descriptionTr: string;
  descriptionEn: string;
  category: string;
  difficulty: string;
  isPreset: boolean;
}

export interface RolePlaySession {
  id: string;
  sceneId?: string;
  customScene?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  feedback?: string;
  wordsUsed: string[];
  createdAt: string;
  scene?: { titleTr: string; titleEn: string; category: string } | null;
}

export interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'translation';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ token: string; user: UserData }>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: UserData }>('/auth/login', { email, password }),
  me: () => api.get<UserData>('/auth/me'),
};

export const profileApi = {
  setApiKey: (apiKey: string) => api.put('/profile/apikey', { apiKey }),
  deleteApiKey: () => api.delete('/profile/apikey'),
  updateSettings: (data: { uiLanguage?: string; level?: string }) =>
    api.put<UserData>('/profile/settings', data),
  getStats: () =>
    api.get<{ wordCount: number; sessionCount: number; contentCount: number; masteredCount: number; xp: number; streak: number }>('/profile/stats'),
};

export const placementApi = {
  getTest: () => api.get<{ questions: Array<{ id: number; type: string; question: string; options: string[]; level: string }> }>('/placement/test'),
  evaluate: (answers: Array<{ questionId: number; answer: string }>) =>
    api.post<{ level: string; explanation: string; score: number }>('/placement/evaluate', { answers }),
};

export const vocabularyApi = {
  getWords: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{ words: UserWord[]; total: number; page: number; pages: number }>('/vocabulary/words', { params }),
  getDue: () => api.get<UserWord[]>('/vocabulary/due'),
  review: (userWordId: string, quality: 0 | 1 | 2 | 3) =>
    api.post('/vocabulary/review', { userWordId, quality }),
  explainWord: (wordId: string, context?: string) =>
    api.get<{ definition: string; definitionTr: string; phonetic: string; examples: string[]; synonyms: string[] }>(`/vocabulary/${wordId}/explain`, { params: { context } }),
  addWord: (data: { word: string; definition: string; definitionTr: string; examples?: string[]; phonetic?: string; level: string }) =>
    api.post<UserWord>('/vocabulary/add', data),
};

export const roleplayApi = {
  getScenes: () => api.get<RolePlayScene[]>('/roleplay/scenes'),
  getSessions: () => api.get<RolePlaySession[]>('/roleplay/sessions'),
  startSession: (data: { sceneId?: string; customScene?: string }) =>
    api.post<{ session: RolePlaySession; greeting: string }>('/roleplay/sessions', data),
  sendMessage: (sessionId: string, content: string) =>
    api.post<{ reply: string; correction: { original: string; suggestion: string; explanation: string } | null; newWords: string[] }>(`/roleplay/sessions/${sessionId}/message`, { content }),
  endSession: (sessionId: string) =>
    api.post<{ fluencyScore: number; grammarMistakes: string[]; newVocabulary: string[]; suggestions: string }>(`/roleplay/sessions/${sessionId}/end`),
  getSession: (sessionId: string) => api.get<RolePlaySession>(`/roleplay/sessions/${sessionId}`),
};

export const contentApi = {
  addContent: (data: { type: string; url?: string; title?: string; transcript?: string }) =>
    api.post<ContentItem>('/content', data),
  getContent: () => api.get<ContentItem[]>('/content'),
  getContentById: (id: string) => api.get<ContentDetail>(`/content/${id}`),
  getStatus: (id: string) => api.get<{ id: string; status: string; title: string }>(`/content/${id}/status`),
  generateQuiz: (id: string) => api.post<{ questions: QuizQuestion[] }>(`/content/${id}/quiz`),
};

export const quizApi = {
  generate: (params?: { source?: string; count?: number }) =>
    api.get<{ questions: QuizQuestion[] }>('/quiz/generate', { params }),
  submit: (answers: Array<{ questionId: number; answer: string }>, questions: Array<{ id: number; correctAnswer: string }>) =>
    api.post<{ score: number; total: number; percentage: number; results: Array<{ questionId: number; correct: boolean; correctAnswer: string; userAnswer: string }> }>('/quiz/submit', { answers, questions }),
};
