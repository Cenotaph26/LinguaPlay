import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { profileApi, vocabularyApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const LEVEL_XP: Record<string, { name: string; min: number; max: number }> = {
  UNSET: { name: '—', min: 0, max: 100 },
  A1: { name: 'Başlangıç', min: 0, max: 500 },
  A2: { name: 'Temel', min: 500, max: 1200 },
  B1: { name: 'Orta Altı', min: 1200, max: 2500 },
  B2: { name: 'Orta', min: 2500, max: 4500 },
  C1: { name: 'İleri', min: 4500, max: 7000 },
  C2: { name: 'Ustalık', min: 7000, max: 10000 },
};

const QUICK_ACTIONS: Array<{ label: string; sub: string; icon: IconName; route: string; color: string }> = [
  { label: 'Role-play',   sub: 'Sahne seç veya yaz', icon: 'chatbubbles-outline',  route: '/(tabs)/roleplay', color: '#7355F7' },
  { label: 'İçerik Ekle', sub: 'Video · PDF · dizi',  icon: 'play-circle-outline', route: '/(tabs)/content',  color: '#F59E0B' },
  { label: 'Quiz',        sub: '10 soruluk test',      icon: 'help-circle-outline', route: '/quiz',           color: '#0E9E80' },
  { label: 'Tekrar',      sub: 'Günlük SRS tekrarı',   icon: 'refresh-outline',     route: '/review',         color: '#7355F7' },
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
  const xp = stats?.xp ?? 0;
  const streak = stats?.streak ?? 0;
  const levelKey = user?.level ?? 'UNSET';
  const levelInfo = LEVEL_XP[levelKey] ?? LEVEL_XP.UNSET;
  const xpInLevel = Math.max(0, xp - levelInfo.min);
  const xpNeeded = levelInfo.max - levelInfo.min;
  const xpPct = Math.min(1, xpInLevel / xpNeeded);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="py-5" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text className="text-text3 text-sm">Hoş geldin</Text>
            <Text className="text-2xl font-bold text-text1">{user?.email?.split('@')[0] ?? 'Öğrenci'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {streak > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>{streak}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <View style={{ backgroundColor: '#7355F7', borderRadius: 9999, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  {(user?.email ?? 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Level + XP Card */}
        {user?.level && user.level !== 'UNSET' && (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View>
                <Text style={{ color: '#9B94CC', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>SEVİYE</Text>
                <Text style={{ color: '#110D24', fontSize: 22, fontWeight: '800', marginTop: 1 }}>{user.level}</Text>
                <Text style={{ color: '#6B638F', fontSize: 12 }}>{levelInfo.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#9B94CC', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>TOPLAM XP</Text>
                <Text style={{ color: '#7355F7', fontSize: 22, fontWeight: '800', marginTop: 1 }}>{xp.toLocaleString()}</Text>
                <Text style={{ color: '#6B638F', fontSize: 12 }}>{xpInLevel}/{xpNeeded} sonraki seviye</Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: '#F0EEF9', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${xpPct * 100}%`, height: 8, backgroundColor: '#7355F7', borderRadius: 4 }} />
            </View>
            {!user.hasApiKey && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                style={{ marginTop: 10, backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="sparkles-outline" size={14} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontWeight: '600', fontSize: 12, flex: 1 }}>API key ekle → AI özellikleri aktif olsun</Text>
                <Ionicons name="chevron-forward" size={14} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {user?.level === 'UNSET' && (
          <TouchableOpacity
            onPress={() => router.push('/placement')}
            style={{ marginBottom: 16, backgroundColor: '#7355F7', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Ionicons name="school-outline" size={20} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Seviye Testi Al</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 }}>Seviyeni belirle, kişiselleştirilmiş içerik gör</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Due words banner */}
        {dueCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/review')}
            style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)' }}
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

        {/* Stats */}
        <View className="flex-row mb-5" style={{ gap: 8 }}>
          {[
            { label: 'Kelime', value: stats?.wordCount ?? 0, icon: 'book-outline' as IconName, color: '#7355F7' },
            { label: 'Seans', value: stats?.sessionCount ?? 0, icon: 'chatbubbles-outline' as IconName, color: '#7355F7' },
            { label: 'İçerik', value: stats?.contentCount ?? 0, icon: 'film-outline' as IconName, color: '#F59E0B' },
            { label: 'Ustalaşıldı', value: stats?.masteredCount ?? 0, icon: 'checkmark-circle-outline' as IconName, color: '#0E9E80' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-bg2 border border-border rounded-xl p-3 items-center">
              <Ionicons name={stat.icon} size={16} color={stat.color} />
              <Text className="text-text1 font-bold text-base mt-1">{stat.value}</Text>
              <Text className="text-text3" style={{ fontSize: 10, marginTop: 1 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text className="text-text2 text-sm font-semibold mb-3">Hızlı Erişim</Text>
        <View className="flex-row flex-wrap" style={{ gap: 10, marginBottom: 24 }}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={{ flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
            >
              <View style={{ backgroundColor: action.color + '18', borderRadius: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 14 }}>{action.label}</Text>
              <Text style={{ color: '#9B94CC', fontSize: 11 }}>{action.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
