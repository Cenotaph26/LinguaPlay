import AsyncStorage from '@react-native-async-storage/async-storage';

export const secureStorage = {
  getItem: (key: string): Promise<string | null> => AsyncStorage.getItem(key),
  setItem: (key: string, value: string): Promise<void> => AsyncStorage.setItem(key, value),
  deleteItem: (key: string): Promise<void> => AsyncStorage.removeItem(key),
};
