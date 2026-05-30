import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) { setError('E-posta ve şifre gerekli'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      await setToken(res.data.token);
      setUser(res.data.user);
      if (!res.data.user.hasApiKey && res.data.user.level === 'UNSET') {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)/');
      }
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          <View className="mb-10">
            <Text className="text-4xl font-bold text-text1 mb-2">LinguaPlay</Text>
            <Text className="text-text2 text-base">İngilizce öğrenmeye başla</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text className="text-text2 text-sm mb-2">E-posta</Text>
              <TextInput
                className="bg-bg2 border border-border rounded-xl px-4 py-3 text-text1 text-base"
                placeholder="ornek@email.com"
                placeholderTextColor="#9B94CC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View>
              <Text className="text-text2 text-sm mb-2">Şifre</Text>
              <TextInput
                className="bg-bg2 border border-border rounded-xl px-4 py-3 text-text1 text-base"
                placeholder="Şifrenizi girin"
                placeholderTextColor="#9B94CC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text className="text-danger text-sm">{error}</Text> : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-accent rounded-xl py-4 items-center mt-2"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Giriş Yap</Text>
              }
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-text3">Hesabın yok mu? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-accent-lt font-medium">Kayıt ol</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
