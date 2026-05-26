import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';

export interface User {
  id: string;
  email: string;
  level: string;
  uiLanguage: string;
  hasApiKey: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  setToken: async (token) => {
    set({ token });
    if (token) {
      await secureStorage.setItem('auth_token', token);
    } else {
      await secureStorage.deleteItem('auth_token');
    }
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    set({ token: null, user: null });
    await secureStorage.deleteItem('auth_token');
  },
}));
