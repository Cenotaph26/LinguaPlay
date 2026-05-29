import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { profileApi, vocabularyApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: Array<{ label: string; icon: IconName; route: string; color: string }> = [
  { label: 'Tekrar', icon: 'refresh-outline', route: '/review', color: '#7355F7' },
  { label: 'Rol Yapma', icon: 'chatbubbles-outline', route: '/(tabs)/roleplay', color: '#7355F7' },
  { label: 'İçerik', icon: 'play-circle-outline', route: '/(tabs)/content', color: '#F59E0B' },
  { label: 'Quiz', icon: 'help-circle-outline', route: '/quiz', color: '#0E9E80' },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => profileApi.getStats().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: dueWords } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
    staleTime: 60000,
  });

  const dueCount = Array.isArray(dueWords) ? dueWords.length : 0;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="py-6" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
          <Text className="text-text3 text-sm">Hoş geldin</Text>
          <Text className="text-2xl font-bold text-text1">{user?.email?.split('@')[0] ?? 'Öğrenci'}</Text>
          {user?.level && user.level !== 'UNSET' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <View style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: '#8B6EFF', fontWeight: '600', fontSize: 13 }}>{user.level}</Text>
              </View>
              {!user.hasApiKey && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile')}
                  style={{ backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Ionicons name="warning-outline" size={12} color="#f59e0b" />
                  <Text style={{ color: '#f59e0b', fontWeight: '600', fontSize: 12 }}>API anahtarı yok</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {user?.level === 'UNSET' && (
            <TouchableOpacity
              onPress={() => router.push('/placement')}
              style={{ marginTop: 12, backgroundColor: '#7355F7', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Ionicons name="school-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Seviye Testi Al</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
          </View>
          <View style={{ backgroundColor: '#7355F7', borderRadius: 9999, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              {(user?.email ?? 'U').slice(0, 1).toUpperCase()}
            </Text>
          </View>
        </View>

        {dueCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/review')}
            style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)' }}
          >
            <View style={{ backgroundColor: '#7355F7', borderRadius: 10, padding: 8 }}>
              <Ionicons name="time-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 15 }}>Tekrar Zamanı!</Text>
              <Text style={{ color: '#6B638F', fontSize: 13 }}>{dueCount} kelime seni bekliyor</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7355F7" />
          </TouchableOpacity>
        )}

        <View className="flex-row mb-5" style={{ gap: 10 }}>
          {[
            { label: 'Kelime', value: String(stats?.wordCount ?? 0), icon: 'book-outline' as IconName, color: '#7355F7' },
            { label: 'Seans', value: String(stats?.sessionCount ?? 0), icon: 'chatbubbles-outline' as IconName, color: '#7355F7' },
            { label: 'İçerik', value: String(stats?.contentCount ?? 0), icon: 'film-outline' as IconName, color: '#F59E0B' },
            { label: 'Ustalaşıldı', value: String(stats?.masteredCount ?? 0), icon: 'checkmark-circle-outline' as IconName, color: '#0E9E80' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-bg2 border border-border rounded-xl p-3 items-center">
              <Ionicons name={stat.icon} size={18} color={stat.color} />
              <Text className="text-text1 font-bold text-lg mt-1">{stat.value}</Text>
              <Text className="text-text3" style={{ fontSize: 10, marginTop: 1 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-text2 text-sm font-medium mb-3">Hızlı Erişim</Text>
        <View className="flex-row flex-wrap" style={{ gap: 10, marginBottom: 24 }}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={{ flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
            >
              <View style={{ backgroundColor: action.color + '22', borderRadius: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 14 }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
