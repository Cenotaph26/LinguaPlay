import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://linguaplay-production-94c0.up.railway.app';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; email: string; level: string; uiLanguage: string } }>(
      '/auth/register', { email, password }
    ),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; email: string; level: string; uiLanguage: string } }>(
      '/auth/login', { email, password }
    ),
  me: () =>
    api.get<{ id: string; email: string; level: string; uiLanguage: string }>('/auth/me'),
};

export const vocabularyApi = {
  getWords: (params?: { status?: string; page?: number }) =>
    api.get('/vocabulary/words', { params }),
  getDue: () => api.get('/vocabulary/due'),
  review: (wordId: string, quality: 0 | 1 | 2 | 3) =>
    api.post('/vocabulary/review', { wordId, quality }),
};

export const roleplayApi = {
  getScenes: () => api.get('/roleplay/scenes'),
  startSession: (data: { sceneId?: string; customScene?: string }) =>
    api.post('/roleplay/sessions', data),
  sendMessage: (sessionId: string, content: string) =>
    api.post(`/roleplay/sessions/${sessionId}/message`, { content }),
  endSession: (sessionId: string) =>
    api.post(`/roleplay/sessions/${sessionId}/end`),
};

export const contentApi = {
  addContent: (data: { type: string; url?: string }) =>
    api.post('/content', data),
  getContent: () => api.get('/content'),
  getContentById: (id: string) => api.get(`/content/${id}`),
  getStatus: (id: string) => api.get(`/content/${id}/status`),
};
