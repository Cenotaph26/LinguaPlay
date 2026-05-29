import { useState } from 'react';
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
  LEARNING: 'Öğreniliyor',
  REVIEW: 'Tekrar',
  MASTERED: 'Ustalaşıldı',
};

const FILTERS = ['Tümü', 'NEW', 'LEARNING', 'REVIEW', 'MASTERED'] as const;

export default function Vocabulary() {
  const [filter, setFilter] = useState<string>('Tümü');

  const { data: wordsData, isLoading } = useQuery({
    queryKey: ['vocabulary-words', filter],
    queryFn: () =>
      vocabularyApi
        .getWords(filter === 'Tümü' ? {} : { status: filter })
        .then((r) => r.data),
  });

  const { data: dueData } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
  });

  const words: UserWord[] = wordsData?.words ?? [];
  const total = wordsData?.total ?? 0;
  const dueCount = Array.isArray(dueData) ? dueData.length : 0;
  const masteredCount = words.filter((w) => w.userWord?.status === 'MASTERED').length;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5">
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Kelimelerim</Text>
          <Text className="text-text3 text-sm mt-1">Kelime haznenizi geliştirin</Text>
        </View>

        <View className="flex-row mb-5" style={{ gap: 10 }}>
          {[
            { label: 'Toplam', value: String(total), color: '#6366f1' },
            { label: 'Bugün', value: String(dueCount), color: '#f59e0b' },
            { label: 'Ustalaşıldı', value: String(masteredCount), color: '#22c55e' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-bg2 border border-border rounded-xl p-3">
              <Text className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-text3 text-xs mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/review')}
          className="bg-accent rounded-xl py-3 flex-row items-center justify-center mb-4"
          style={{ gap: 8 }}
          disabled={dueCount === 0}
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text className="text-white font-semibold">
            {dueCount > 0 ? `Tekrar Başlat (${dueCount})` : 'Bugün tekrar yok'}
          </Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginBottom: 12 }}>
          <View className="flex-row" style={{ gap: 8 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filter === f ? '#6366f1' : '#18181b',
                  borderWidth: 1,
                  borderColor: filter === f ? '#6366f1' : '#27272a',
                }}
              >
                <Text style={{ color: filter === f ? '#fff' : '#71717a', fontSize: 12, fontWeight: '600' }}>
                  {f === 'Tümü' ? 'Tümü' : STATUS_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : words.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="book-outline" size={48} color="#3f3f46" />
              <Text className="text-text3 mt-4 text-center">
                Henüz kelime yok{"\n"}Rol yapma veya içerik ekleyerek başlayın
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6, paddingBottom: 24 }}>
              {words.map((item) => {
                const status = item.userWord?.status ?? 'NEW';
                const sc = STATUS_COLORS[status] ?? '#71717a';
                const nextReview = item.userWord?.nextReview;
                const reviewLabel = status === 'MASTERED' ? 'Tamam' : status === 'NEW' ? 'Yeni' : nextReview ? (() => {
                  const days = Math.ceil((new Date(nextReview).getTime() - Date.now()) / 86400000);
                  return days <= 0 ? 'Bugün' : days === 1 ? 'Yarın' : `${days} gün`;
                })() : '';
                return (
                  <View
                    key={item.id}
                    style={{ backgroundColor: '#27272a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc, flexShrink: 0 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#fafafa' }}>{item.word}</Text>
                      <Text style={{ fontSize: 12, color: '#52525b' }} numberOfLines={1}>
                        {item.definitionTr || item.definition}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#52525b', textAlign: 'right' }}>{reviewLabel}</Text>
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
