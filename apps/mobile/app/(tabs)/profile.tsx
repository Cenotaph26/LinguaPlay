import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const MENU_ITEMS: Array<{ icon: IconName; label: string; sub: string }> = [
  { icon: 'key-outline', label: 'API Anahtarı', sub: 'Claude API key gir' },
  { icon: 'school-outline', label: 'Seviye Testi', sub: 'CEFR seviyeni belirle' },
  { icon: 'language-outline', label: 'Arayüz Dili', sub: 'Türkçe' },
  { icon: 'notifications-outline', label: 'Bildirimler', sub: 'Günlük hatırlatıcı' },
];

export default function Profile() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5">
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Profil</Text>
        </View>

        <View className="bg-bg2 border border-border rounded-2xl p-4 mb-5 flex-row items-center" style={{ gap: 12 }}>
          <View style={{ backgroundColor: '#6366f122', borderRadius: 9999, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={26} color="#6366f1" />
          </View>
          <View>
            <Text className="text-text1 font-semibold">{user?.email ?? '—'}</Text>
            <Text className="text-text3 text-sm">Seviye: {user?.level === 'UNSET' ? 'Belirlenmedi' : (user?.level ?? '—')}</Text>
          </View>
        </View>

        <View className="bg-bg2 border border-border rounded-2xl mb-4 overflow-hidden">
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center p-4"
              style={[
                { gap: 12 },
                i < MENU_ITEMS.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#27272a' } : {},
              ]}
            >
              <Ionicons name={item.icon} size={20} color="#a1a1aa" />
              <View className="flex-1">
                <Text className="text-text1 text-sm font-medium">{item.label}</Text>
                <Text className="text-text3 text-xs">{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#71717a" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center justify-center"
          style={{ gap: 8 }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontWeight: '500' }}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
