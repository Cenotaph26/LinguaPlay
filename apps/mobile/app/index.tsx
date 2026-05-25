import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { token, setToken } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('auth_token')
      .then((t) => { if (t) setToken(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)/' : '/(auth)/login'} />;
}
