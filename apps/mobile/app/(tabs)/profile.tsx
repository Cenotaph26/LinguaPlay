import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { profileApi } from '../../services/api';
import i18n from '../../utils/i18n';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function SettingRow({ icon, label, value, onPress, iconBg, iconColor, danger }: {
  icon: IconName; label: string; value?: string; onPress: () => void;
  iconBg?: string; iconColor?: string; danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: iconBg ?? '#F0EEF9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name={icon} size={16} color={iconColor ?? '#6B638F'} />
      </View>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: danger ? '#E84E32' : '#110D24' }}>{label}</Text>
      {value !== undefined && (
        <Text style={{ fontSize: 12, color: '#9B94CC' }}>{value}</Text>
      )}
      <Ionicons name="chevron-forward" size={16} color="#C8C3E0" />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [notifTime, setNotifTime] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
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

  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase();
  const displayName = user?.email?.split('@')[0] ?? '—';
  const streak = stats?.streak ?? 0;
  const xp = stats?.xp ?? 0;

  async function handleTestApiKey() {
    if (!apiKey.trim()) return;
    setTestingKey(true);
    try {
      const { data } = await profileApi.testApiKey(apiKey.trim());
      if (data.valid) {
        Alert.alert('Bağlantı Başarılı', 'API anahtarı geçerli. Kaydedebilirsiniz.');
      } else {
        Alert.alert('Geçersiz Anahtar', data.error ?? 'API anahtarı doğrulanamadı.');
      }
    } catch {
      Alert.alert('Hata', 'Test sırasında hata oluştu.');
    } finally {
      setTestingKey(false);
    }
  }

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
    Alert.alert('API Anahtarını Sil', 'Silmek istediğinizden emin misiniz? AI özellikleri devre dışı kalacak.', [
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
    ]);
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

  async function scheduleReminder(time: string) {
    const [hour, minute] = time.split(':').map(Number);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Bildirim izni verilmedi. Ayarlardan açabilirsiniz.');
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Kelime tekrar zamanı!',
          body: 'Bugünkü kelimelerini tekrar etmeyi unutma.',
          data: { screen: 'review' },
        },
        trigger: { hour, minute, repeats: true } as any,
      });
    }
    setNotifTime(time);
    Alert.alert('Hatırlatıcı Kuruldu', `Her gün ${time}'de hatırlatıcı alacaksın.`);
  }

  async function cancelReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setNotifTime(null);
  }

  function handleLanguageTap() {
    Alert.alert('Arayüz Dili', 'Kullanmak istediğiniz dili seçin', [
      { text: 'Türkçe', onPress: () => handleLanguageChange('tr') },
      { text: 'English', onPress: () => handleLanguageChange('en') },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#110D24' }}>Profil</Text>
          </View>

          {/* ── Profile Hero ───────────────────────────────── */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E4E1F5', flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#7355F7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#110D24', fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{displayName}</Text>
              <Text style={{ color: '#9B94CC', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{user?.email ?? '—'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {user?.level && user.level !== 'UNSET' && (
                  <View style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="school-outline" size={11} color="#7355F7" />
                    <Text style={{ color: '#7355F7', fontWeight: '700', fontSize: 11 }}>{user.level}</Text>
                  </View>
                )}
                {streak > 0 && (
                  <View style={{ backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={{ fontSize: 11 }}>🔥</Text>
                    <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 11 }}>{streak} gün seri</Text>
                  </View>
                )}
                {hasApiKey && (
                  <View style={{ backgroundColor: 'rgba(14,158,128,0.10)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(14,158,128,0.25)', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="sparkles-outline" size={11} color="#0E9E80" />
                    <Text style={{ color: '#0E9E80', fontWeight: '700', fontSize: 11 }}>AI Aktif</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── API Key ─────────────────────────────────────── */}
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>
            Claude API Anahtarı
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E4E1F5' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <Ionicons name="key-outline" size={16} color="#7355F7" />
              <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 14 }}>API Anahtarı</Text>
            </View>
            <Text style={{ color: '#9B94CC', fontSize: 11, marginBottom: 10 }}>
              Kendi Anthropic API anahtarınızı girin. AES-256 ile şifrelenip saklanır.
            </Text>

            {(!hasApiKey || editingKey) ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1, backgroundColor: '#F0EEF9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={{ flex: 1, color: '#110D24', fontSize: 13 }}
                      placeholder="sk-ant-api03-..."
                      placeholderTextColor="#9B94CC"
                      value={apiKey}
                      onChangeText={setApiKey}
                      secureTextEntry={!showKey}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                      <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={16} color="#9B94CC" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleTestApiKey}
                    disabled={testingKey || apiKey.trim().length < 20}
                    style={{ flex: 1, backgroundColor: '#F0EEF9', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: apiKey.trim().length >= 20 ? '#7355F7' : '#E4E1F5' }}
                  >
                    {testingKey
                      ? <ActivityIndicator color="#7355F7" size="small" />
                      : <Text style={{ color: apiKey.trim().length >= 20 ? '#7355F7' : '#9B94CC', fontWeight: '600', fontSize: 13 }}>Test Et</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveApiKey}
                    disabled={savingKey || apiKey.trim().length < 20}
                    style={{ flex: 1, backgroundColor: apiKey.trim().length >= 20 ? '#7355F7' : '#E4E1F5', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                  >
                    {savingKey
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ color: apiKey.trim().length >= 20 ? '#fff' : '#9B94CC', fontWeight: '600', fontSize: 13 }}>Kaydet</Text>
                    }
                  </TouchableOpacity>
                </View>
                {editingKey && (
                  <TouchableOpacity onPress={() => { setEditingKey(false); setApiKey(''); }} style={{ marginTop: 8 }}>
                    <Text style={{ color: '#9B94CC', fontSize: 12, textAlign: 'center' }}>İptal</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#0E9E80" />
                  <Text style={{ color: '#6B638F', fontSize: 13 }}>API anahtarı aktif</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setEditingKey(true)}>
                    <Text style={{ color: '#7355F7', fontSize: 13 }}>Değiştir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteApiKey} disabled={deletingKey}>
                    {deletingKey
                      ? <ActivityIndicator size="small" color="#E84E32" />
                      : <Text style={{ color: '#E84E32', fontSize: 13 }}>Sil</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ── Settings ─────────────────────────────────────── */}
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>
            Uygulama Ayarları
          </Text>
          <View style={{ gap: 6, marginBottom: 16 }}>
            <SettingRow
              icon="language-outline"
              label="Arayüz dili"
              value={lang === 'tr' ? 'Türkçe' : 'English'}
              onPress={handleLanguageTap}
            />
            <SettingRow
              icon="trophy-outline"
              label="Günlük hedef"
              value="10 kelime"
              onPress={() => Alert.alert('Yakında', 'Günlük hedef ayarı yakında geliyor.')}
            />
            <SettingRow
              icon="notifications-outline"
              label="Hatırlatıcılar"
              value={notifTime ?? 'Kapalı'}
              onPress={async () => {
                const TIMES = ['08:00', '09:00', '12:00', '18:00', '21:00'];
                const options = [
                  ...TIMES.map((t) => ({ text: t, onPress: () => scheduleReminder(t) })),
                  { text: 'Bildirimi Kapat', style: 'destructive' as const, onPress: cancelReminder },
                  { text: 'İptal', style: 'cancel' as const },
                ];
                Alert.alert('Günlük Hatırlatıcı', 'Tekrar hatırlatma saatini seç', options);
              }}
            />
            <SettingRow
              icon="clipboard-outline"
              label="Seviye testini tekrarla"
              onPress={() => router.push('/placement')}
              iconBg="rgba(115,85,247,0.08)"
              iconColor="#7355F7"
            />
          </View>

          {/* ── Progress ─────────────────────────────────────── */}
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>
            İlerleme
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Kelime öğrenildi', value: stats?.wordCount ?? 0, icon: 'book-outline' as IconName, color: '#0E9E80' },
              { label: 'Sahne tamamlandı', value: stats?.sessionCount ?? 0, icon: 'chatbubbles-outline' as IconName, color: '#7355F7' },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E1F5', alignItems: 'flex-start' }}>
                <Ionicons name={s.icon} size={18} color={s.color} style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#110D24' }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: '#9B94CC', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* XP stat */}
          {xp > 0 && (
            <View style={{ backgroundColor: 'rgba(115,85,247,0.06)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(115,85,247,0.15)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <View>
                <Text style={{ color: '#110D24', fontWeight: '700', fontSize: 16 }}>{xp.toLocaleString()} XP</Text>
                <Text style={{ color: '#9B94CC', fontSize: 12 }}>Toplam kazanılan deneyim</Text>
              </View>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
            style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 12, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="log-out-outline" size={18} color="#E84E32" />
            <Text style={{ color: '#E84E32', fontWeight: '600' }}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
