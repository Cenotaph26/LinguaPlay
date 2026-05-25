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

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useAuthStore();

  async function handleRegister() {
    if (!email || !password) { setError('Tüm alanları doldurun'); return; }
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(email, password);
      await setToken(res.data.token);
      setUser(res.data.user);
      router.replace('/(tabs)/');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Kayıt başarısız');
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
            <Text className="text-3xl font-bold text-text1 mb-2">Hesap Oluştur</Text>
            <Text className="text-text2 text-base">LinguaPlay'e hoş geldin</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text className="text-text2 text-sm mb-2">E-posta</Text>
              <TextInput
                className="bg-bg2 border border-border rounded-xl px-4 py-3 text-text1 text-base"
                placeholder="ornek@email.com"
                placeholderTextColor="#71717a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-text2 text-sm mb-2">Şifre</Text>
              <TextInput
                className="bg-bg2 border border-border rounded-xl px-4 py-3 text-text1 text-base"
                placeholder="En az 6 karakter"
                placeholderTextColor="#71717a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-text2 text-sm mb-2">Şifre Tekrar</Text>
              <TextInput
                className="bg-bg2 border border-border rounded-xl px-4 py-3 text-text1 text-base"
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor="#71717a"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            </View>

            {error ? <Text className="text-danger text-sm">{error}</Text> : null}

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="bg-accent rounded-xl py-4 items-center mt-2"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Kayıt Ol</Text>
              }
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-text3">Zaten hesabın var mı? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-accent-lt font-medium">Giriş yap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
