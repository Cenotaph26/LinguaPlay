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
  { label: 'İçerik',      sub: 'Video · PDF · dizi',  icon: 'play-circle-outline', route: '/(tabs)/content',  color: '#F59E0B' },
  { label: 'Quiz',        sub: '10 soruluk test',      icon: 'help-circle-outline', route: '/quiz',           color: '#0E9E80' },
  { label: 'Sesli',       sub: 'Whisper AI',           icon: 'mic-outline',         route: '/quiz',           color: '#F59E0B' },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi Günler' : 'İyi Akşamlar';

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
            <Text className="text-text3 text-sm">{greeting}</Text>
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

        {/* Level Hero Card */}
        {user?.level && user.level !== 'UNSET' && (
          <>
            <View style={{ backgroundColor: '#7355F7', borderRadius: 20, padding: 20, marginBottom: 10, position: 'relative', overflow: 'hidden', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 28, elevation: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Seviye</Text>
              <Text style={{ fontSize: 40, fontWeight: '800', color: '#fff', lineHeight: 44 }}>{user.level}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 14, marginTop: 2 }}>{levelInfo.name} · {xp.toLocaleString()} XP</Text>
              <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 100, overflow: 'hidden' }}>
                <View style={{ height: 5, width: `${xpPct * 100}%`, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 100 }} />
              </View>
              {/* Watermark */}
              <Text style={{ position: 'absolute', right: -10, bottom: -8, fontSize: 80, fontWeight: '800', color: 'rgba(255,255,255,0.06)', lineHeight: 88 }}>{user.level}</Text>
            </View>

            {/* XP Sub-card */}
            <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#110D24', fontSize: 13, fontWeight: '600' }}>Seviye {user.level} — XP</Text>
                <Text style={{ color: '#7355F7', fontSize: 12, fontWeight: '700' }}>+{xpNeeded - xpInLevel} SONRAKI</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#F0EEF9', borderRadius: 100, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${xpPct * 100}%`, backgroundColor: '#7355F7', borderRadius: 100 }} />
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
          </>
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

        {/* Stats */}
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>İstatistikler</Text>
        <View className="flex-row mb-4" style={{ gap: 8 }}>
          {[
            { label: 'Gün Serisi', value: streak, icon: 'flame-outline' as IconName, color: '#F59E0B' },
            { label: 'Kelime öğrenildi', value: stats?.wordCount ?? 0, icon: 'book-outline' as IconName, color: '#0E9E80' },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <Ionicons name={stat.icon} size={20} color={stat.color} style={{ marginBottom: 6 }} />
              <Text style={{ color: '#110D24', fontWeight: '700', fontSize: 26 }}>{stat.value}</Text>
              <Text style={{ color: '#9B94CC', fontSize: 11, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Bugünkü tekrar */}
        {dueCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/review')}
            style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)' }}
          >
            <View style={{ width: 40, height: 40, backgroundColor: '#7355F7', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="layers-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 14 }}>{dueCount} kelime sırada</Text>
              <Text style={{ color: '#6B638F', fontSize: 12 }}>Bugünkü tekrar zamanı</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#7355F7" />
          </TouchableOpacity>
        )}

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
