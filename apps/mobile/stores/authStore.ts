import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  level: string;
  uiLanguage: string;
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
      await SecureStore.setItemAsync('auth_token', token);
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    set({ token: null, user: null });
    await SecureStore.deleteItemAsync('auth_token');
  },
}));
