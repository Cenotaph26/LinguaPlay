import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://linguaplay-production-94c0.up.railway.app';

export interface UserData {
  id: string;
  email: string;
  level: string;
  uiLanguage: string;
  hasApiKey: boolean;
}

export interface PlacementQuestion {
  id: string;
  level: string;
  question: string;
  options: string[];
}

export interface PlacementResult {
  score: number;
  total: number;
  level: string;
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
  wordId: string;
  status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
  nextReview: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  word: Word;
}

export interface ContentItem {
  id: string;
  type: string;
  url?: string;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  createdAt: string;
}

export interface ContentDetail extends ContentItem {
  words: Array<{ id: string; word: Word; occurrences: number; contexts: string[] }>;
  phrases: Array<{ id: string; phrase: string; meaning: string; meaningTr: string; examples: string[] }>;
}

export interface RolePlayScene {
  id: string;
  titleEn: string;
  titleTr: string;
  category: string;
  level: string;
  icon: string;
}

export interface RolePlaySession {
  id: string;
  sceneId?: string;
  customScene?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  feedback?: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  word: string;
  question: string;
  options: string[];
  correctIndex: number;
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
    api.get<{ wordCount: number; sessionCount: number; contentCount: number; masteredCount: number }>('/profile/stats'),
};

export const placementApi = {
  getTest: () => api.get<{ questions: PlacementQuestion[] }>('/placement/test'),
  evaluate: (answers: Array<{ id: string; selectedIndex: number }>) =>
    api.post<PlacementResult>('/placement/evaluate', { answers }),
};

export const vocabularyApi = {
  getWords: (params?: { status?: string; page?: number }) =>
    api.get<{ items: UserWord[]; total: number; page: number; pages: number }>('/vocabulary/words', { params }),
  getDue: () => api.get<{ items: UserWord[]; count: number }>('/vocabulary/due'),
  review: (wordId: string, quality: 0 | 1 | 2 | 3) =>
    api.post<UserWord>('/vocabulary/review', { wordId, quality }),
  explainWord: (wordId: string) => api.get(`/vocabulary/${wordId}/explain`),
  addWord: (data: {
    word: string;
    definition: string;
    definitionTr: string;
    examples?: string[];
    phonetic?: string;
    level: string;
  }) => api.post<UserWord>('/vocabulary/words', data),
};

export const roleplayApi = {
  getScenes: () => api.get<{ scenes: RolePlayScene[] }>('/roleplay/scenes'),
  startSession: (data: { sceneId?: string; customScene?: string }) =>
    api.post<RolePlaySession>('/roleplay/sessions', data),
  sendMessage: (sessionId: string, content: string) =>
    api.post<{ message: string; session: RolePlaySession }>(`/roleplay/sessions/${sessionId}/message`, { content }),
  endSession: (sessionId: string) =>
    api.post<{ feedback: string }>(`/roleplay/sessions/${sessionId}/end`),
  getSession: (sessionId: string) => api.get<RolePlaySession>(`/roleplay/sessions/${sessionId}`),
};

export const contentApi = {
  addContent: (data: { type: string; url?: string }) =>
    api.post<ContentItem>('/content', data),
  getContent: () => api.get<{ items: ContentItem[] }>('/content'),
  getContentById: (id: string) => api.get<ContentDetail>(`/content/${id}`),
  getStatus: (id: string) => api.get<{ status: string }>(`/content/${id}/status`),
};

export const quizApi = {
  generate: (wordCount?: number) =>
    api.get<{ questions: QuizQuestion[] }>('/quiz/generate', { params: { wordCount } }),
  submit: (answers: Array<{ questionId: string; selectedIndex: number }>, questions: QuizQuestion[]) =>
    api.post<{ score: number; total: number; results: Array<{ questionId: string; correct: boolean }> }>('/quiz/submit', { answers, questions }),
};
