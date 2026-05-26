import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { vocabularyApi, UserWord } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  NEW: '#71717a',
  LEARNING: '#f59e0b',
  REVIEW: '#6366f1',
  MASTERED: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Yeni',
  LEARNING: 'Ogreniliyor',
  REVIEW: 'Tekrar',
  MASTERED: 'Ustalasildi',
};

export default function Vocabulary() {
  const { data: wordsData, isLoading: wordsLoading } = useQuery({
    queryKey: ['vocabulary-words'],
    queryFn: () => vocabularyApi.getWords().then((r) => r.data),
  });

  const { data: dueData } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
  });

  const items: UserWord[] = wordsData?.items ?? [];
  const total = wordsData?.total ?? 0;
  const dueCount = dueData?.count ?? 0;
  const masteredCount = items.filter((w) => w.status === 'MASTERED').length;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5">
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Kelimelerim</Text>
          <Text className="text-text3 text-sm mt-1">Kelime haznenizi gelistirin</Text>
        </View>

        <View className="flex-row mb-5" style={{ gap: 10 }}>
          {[
            { label: 'Toplam', value: String(total), color: '#6366f1' },
            { label: 'Bugün', value: String(dueCount), color: '#f59e0b' },
            { label: 'Ustalasildi', value: String(masteredCount), color: '#22c55e' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-bg2 border border-border rounded-xl p-3">
              <Text className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-text3 text-xs mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/review')}
          className="bg-accent rounded-xl py-3 flex-row items-center justify-center mb-5"
          style={{ gap: 8 }}
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text className="text-white font-semibold">Tekrar Başlat ({dueCount})</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {wordsLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : items.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="book-outline" size={48} color="#3f3f46" />
              <Text className="text-text3 mt-4 text-center">
                Henüz kelime yok{"\n"}Rol yapma veya içerik ekleyerek başlayın
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8, paddingBottom: 24 }}>
              {items.map((item) => {
                const sc = STATUS_COLORS[item.status] ?? '#71717a';
                return (
                  <View
                    key={item.id}
                    className="bg-bg2 border border-border rounded-xl p-4 flex-row items-center"
                    style={{ gap: 12 }}
                  >
                    <View className="flex-1">
                      <Text className="text-text1 font-medium">{item.word.word}</Text>
                      <Text className="text-text3 text-sm" numberOfLines={1}>
                        {item.word.definitionTr || item.word.definition}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: sc + '22',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ color: sc, fontSize: 11, fontWeight: '600' }}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
