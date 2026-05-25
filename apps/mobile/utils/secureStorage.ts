import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export const secureStorage = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === 'web'
      ? AsyncStorage.getItem(key)
      : SecureStore!.getItemAsync(key),

  setItem: (key: string, value: string): Promise<void> =>
    Platform.OS === 'web'
      ? AsyncStorage.setItem(key, value)
      : SecureStore!.setItemAsync(key, value),

  deleteItem: (key: string): Promise<void> =>
    Platform.OS === 'web'
      ? AsyncStorage.removeItem(key)
      : SecureStore!.deleteItemAsync(key),
};
