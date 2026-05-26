import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { vocabularyApi } from '../../services/api';

const LEVEL_COLORS: Record<string, string> = {
  UNSET: '#71717a',
  A1: '#22c55e', A2: '#22c55e',
  B1: '#6366f1', B2: '#6366f1',
  C1: '#f59e0b', C2: '#f59e0b',
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const level = user?.level ?? 'UNSET';
  const levelColor = LEVEL_COLORS[level] ?? '#71717a';

  const { data: dueData } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
    enabled: true,
  });

  const dueCount = dueData?.count ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-text3 text-sm">Hos geldin</Text>
            <Text className="text-text1 text-2xl font-bold">LinguaPlay</Text>
          </View>
          <View
            style={{ backgroundColor: levelColor + '22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}
          >
            <Text style={{ color: levelColor, fontWeight: '600', fontSize: 13 }}>
              {level === 'UNSET' ? 'Seviye Yok' : level}
            </Text>
          </View>
        </View>

        {level === 'UNSET' && (
          <TouchableOpacity
            onPress={() => router.push('/placement')}
            className="bg-bg2 border border-border rounded-2xl p-4 mb-4 flex-row items-center"
            style={{ gap: 12 }}
          >
            <View style={{ backgroundColor: '#6366f122', borderRadius: 10, padding: 8 }}>
              <Ionicons name="school-outline" size={22} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-text1 font-semibold">Seviye Testi</Text>
              <Text className="text-text3 text-sm">CEFR seviyeni ogren</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
          </TouchableOpacity>
        )}

        <View className="bg-bg2 border border-border rounded-2xl p-4 mb-5">
          <Text className="text-text2 text-sm mb-3">Günlük Tekrar</Text>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#6366f122', borderRadius: 10, padding: 8 }}>
              <Ionicons name="time-outline" size={22} color="#6366f1" />
            </View>
            <View>
              <Text className="text-text1 text-2xl font-bold">{dueCount}</Text>
              <Text className="text-text3 text-sm">bekleyen kelime</Text>
            </View>
          </View>
        </View>

        <Text className="text-text2 text-sm font-medium mb-3">Hızlı Başlat</Text>
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/roleplay')}
            className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center"
            style={{ gap: 12 }}
          >
            <View style={{ backgroundColor: '#6366f122', borderRadius: 10, padding: 8 }}>
              <Ionicons name="chatbubbles-outline" size={22} color="#6366f1" />
            </View>
            <View>
              <Text className="text-text1 font-medium">Rol Yapma</Text>
              <Text className="text-text3 text-sm">Konusma pratiği yap</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/content')}
            className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center"
            style={{ gap: 12 }}
          >
            <View style={{ backgroundColor: '#f59e0b22', borderRadius: 10, padding: 8 }}>
              <Ionicons name="play-circle-outline" size={22} color="#f59e0b" />
            </View>
            <View>
              <Text className="text-text1 font-medium">Icerik Ekle</Text>
              <Text className="text-text3 text-sm">YouTube, makale</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/review')}
            className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center"
            style={{ gap: 12 }}
          >
            <View style={{ backgroundColor: '#22c55e22', borderRadius: 10, padding: 8 }}>
              <Ionicons name="book-outline" size={22} color="#22c55e" />
            </View>
            <View>
              <Text className="text-text1 font-medium">Kelime Çalis</Text>
              <Text className="text-text3 text-sm">SRS kartlari ({dueCount} bekliyor)</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
