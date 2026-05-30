import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export function useAIFeature() {
  const user = useAuthStore((s) => s.user);
  const hasKey = user?.hasApiKey ?? false;

  function requireAI(onHasKey: () => void, featureName?: string) {
    if (hasKey) {
      onHasKey();
    } else {
      Alert.alert(
        `${featureName ?? 'Bu özellik'} AI kullanıyor`,
        'Claude API key ekleyerek tüm AI özelliklerini aktif et.',
        [
          { text: 'API Key Ekle', onPress: () => router.push('/(tabs)/profile') },
          { text: 'Şimdi Değil', style: 'cancel' },
        ]
      );
    }
  }

  return { hasKey, requireAI };
}
