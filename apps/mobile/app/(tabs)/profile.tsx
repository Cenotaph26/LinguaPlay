import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { profileApi } from '../../services/api';
import i18n from '../../utils/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [deletingKey, setDeletingKey] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [changingLang, setChangingLang] = useState(false);

  const hasApiKey = user?.hasApiKey ?? false;
  const lang = user?.uiLanguage ?? 'tr';

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => profileApi.getStats().then((r) => r.data),
    staleTime: 60000,
  });

  const STATS: Array<{ label: string; value: number | undefined; icon: IconName; color: string }> = [
    { label: 'Kelime', value: stats?.wordCount, icon: 'book-outline', color: '#7355F7' },
    { label: 'Ustalaşıldı', value: stats?.masteredCount, icon: 'checkmark-circle-outline', color: '#0E9E80' },
    { label: 'Seans', value: stats?.sessionCount, icon: 'chatbubbles-outline', color: '#7355F7' },
    { label: 'İçerik', value: stats?.contentCount, icon: 'film-outline', color: '#F59E0B' },
  ];

  async function handleSaveApiKey() {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      await profileApi.setApiKey(apiKey.trim());
      setUser({ ...user!, hasApiKey: true });
      setApiKey('');
      setEditingKey(false);
    } catch {
      Alert.alert('Hata', 'API anahtarı kaydedilemedi.');
    } finally {
      setSavingKey(false);
    }
  }

  async function handleDeleteApiKey() {
    Alert.alert(
      'API Anahtarını Sil',
      'Silmek istediğinizden emin misiniz? AI özellikleri devre dışı kalacak.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            setDeletingKey(true);
            try {
              await profileApi.deleteApiKey();
              setUser({ ...user!, hasApiKey: false });
            } catch {
              Alert.alert('Hata', 'API anahtarı silinemedi');
            } finally {
              setDeletingKey(false);
            }
          },
        },
      ]
    );
  }

  async function handleLanguageChange(newLang: 'tr' | 'en') {
    if (newLang === lang || changingLang) return;
    setChangingLang(true);
    try {
      const { data } = await profileApi.updateSettings({ uiLanguage: newLang });
      setUser(data);
      i18n.changeLanguage(newLang);
    } catch {
      // silent
    } finally {
      setChangingLang(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Profil</Text>
        </View>

        {/* User Card */}
        <View className="bg-bg2 border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#7355F7', borderRadius: 9999, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
                {(user?.email ?? 'U').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-text1 font-semibold" numberOfLines={1}>{user?.email ?? '—'}</Text>
              <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                <View style={{ backgroundColor: 'rgba(115,85,247,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)' }}>
                  <Text style={{ color: '#8B6EFF', fontWeight: '600', fontSize: 11 }}>
                    {user?.level === 'UNSET' ? 'Seviye yok' : user?.level}
                  </Text>
                </View>
                {hasApiKey && (
                  <View style={{ backgroundColor: 'rgba(14,158,128,0.10)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(14,158,128,0.25)' }}>
                    <Text style={{ color: '#0E9E80', fontSize: 10, fontWeight: '600' }}>API Aktif</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/placement')}
              style={{ backgroundColor: '#F0EEF9', borderRadius: 10, padding: 8 }}
            >
              <Ionicons name="school-outline" size={18} color="#6B638F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-4" style={{ gap: 8 }}>
          {STATS.map((s) => (
            <View key={s.label} className="flex-1 bg-bg2 border border-border rounded-xl p-3 items-center">
              <Ionicons name={s.icon} size={16} color={s.color} />
              <Text className="text-text1 font-bold text-base mt-1">{s.value ?? 0}</Text>
              <Text className="text-text3" style={{ fontSize: 10 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* API Key Card */}
        <View className="bg-bg2 border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Ionicons name="key-outline" size={18} color="#6B638F" />
              <Text className="text-text1 font-semibold">Claude API Anahtarı</Text>
            </View>
            {hasApiKey && !editingKey && (
              <TouchableOpacity onPress={() => setEditingKey(true)}>
                <Text style={{ color: '#7355F7', fontSize: 13 }}>Değiştir</Text>
              </TouchableOpacity>
            )}
          </View>

          {(!hasApiKey || editingKey) ? (
            <View style={{ gap: 10 }}>
              <Text className="text-text3 text-xs">
                Claude API anahtarınızı girin. AES-256 ile şifrelenip saklanır.
              </Text>
              <View className="bg-bg3 border border-border rounded-xl flex-row items-center px-3">
                <TextInput
                  style={{ flex: 1, paddingVertical: 12, color: '#110D24', fontSize: 13 }}
                  placeholder="sk-ant-api03-..."
                  placeholderTextColor="#9B94CC"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowKey(!showKey)} style={{ padding: 4 }}>
                  <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9B94CC" />
                </TouchableOpacity>
              </View>
              <View className="flex-row" style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={handleSaveApiKey}
                  disabled={savingKey || apiKey.trim().length < 20}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ backgroundColor: savingKey || apiKey.trim().length < 20 ? '#E4E1F5' : '#7355F7' }}
                >
                  {savingKey
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: savingKey || apiKey.trim().length < 20 ? '#9B94CC' : '#fff', fontWeight: '600', fontSize: 14 }}>Kaydet</Text>
                  }
                </TouchableOpacity>
                {editingKey && (
                  <TouchableOpacity
                    onPress={() => { setEditingKey(false); setApiKey(''); }}
                    className="bg-bg3 rounded-xl py-3 px-5 items-center"
                  >
                    <Text className="text-text2 text-sm">İptal</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Ionicons name="checkmark-circle" size={18} color="#0E9E80" />
                <Text className="text-text2 text-sm">API anahtarı aktif</Text>
              </View>
              <TouchableOpacity onPress={handleDeleteApiKey} disabled={deletingKey}>
                {deletingKey
                  ? <ActivityIndicator size="small" color="#E84E32" />
                  : <Text style={{ color: '#E84E32', fontSize: 13 }}>Sil</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Language Toggle */}
        <View className="bg-bg2 border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
            <Ionicons name="language-outline" size={18} color="#6B638F" />
            <Text className="text-text1 font-semibold">Arayüz Dili</Text>
          </View>
          <View className="flex-row" style={{ gap: 8 }}>
            {(['tr', 'en'] as const).map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => handleLanguageChange(l)}
                disabled={changingLang}
                className="flex-1 rounded-xl items-center border"
                style={{
                  paddingVertical: 10,
                  backgroundColor: lang === l ? '#7355F7' : '#F0EEF9',
                  borderColor: lang === l ? '#7355F7' : '#E4E1F5',
                  opacity: changingLang ? 0.5 : 1,
                }}
              >
                <Text style={{ color: lang === l ? '#fff' : '#6B638F', fontWeight: '600', fontSize: 14 }}>
                  {l === 'tr' ? 'Türkçe' : 'English'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center justify-center mb-8"
          style={{ gap: 8 }}
        >
          <Ionicons name="log-out-outline" size={18} color="#E84E32" />
          <Text style={{ color: '#E84E32', fontWeight: '500' }}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
