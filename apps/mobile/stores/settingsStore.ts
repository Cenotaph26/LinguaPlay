import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsStore {
  language: 'tr' | 'en';
  setLanguage: (lang: 'tr' | 'en') => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: 'tr',
  setLanguage: async (language) => {
    set({ language });
    await AsyncStorage.setItem('ui_language', language);
  },
  loadSettings: async () => {
    const lang = await AsyncStorage.getItem('ui_language');
    if (lang === 'tr' || lang === 'en') set({ language: lang });
  },
}));
