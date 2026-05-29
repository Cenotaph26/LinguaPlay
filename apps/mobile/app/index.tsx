import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { secureStorage } from '../utils/secureStorage';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';
import i18n from '../utils/i18n';

export default function Index() {
  const { token, setToken, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secureStorage.getItem('auth_token').then(async (t) => {
      if (t) {
        setToken(t);
        try {
          const { data } = await authApi.me();
          setUser(data);
          i18n.changeLanguage(data.uiLanguage ?? 'tr');
        } catch {
          await secureStorage.deleteItem('auth_token');
          setToken(null);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7355F7" size="large" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)/' : '/(auth)/login'} />;
}
