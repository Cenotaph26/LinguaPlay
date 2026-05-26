import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi, UserWord } from '../services/api';

const QUALITY_BUTTONS: Array<{ label: string; quality: 0 | 1 | 2 | 3; color: string }> = [
  { label: 'Tekrar', quality: 0, color: '#ef4444' },
  { label: 'Zor', quality: 1, color: '#f59e0b' },
  { label: 'Iyi', quality: 2, color: '#6366f1' },
  { label: 'Kolay', quality: 3, color: '#22c55e' },
];

export default function Review() {
  const queryClient = useQueryClient();
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [done, setDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ wordId, quality }: { wordId: string; quality: 0 | 1 | 2 | 3 }) =>
      vocabularyApi.review(wordId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-words'] });
    },
  });

  const items: UserWord[] = data?.items ?? [];
  const current = items[cardIndex];
  const progress = items.length > 0 ? reviewedCount / items.length : 0;

  async function handleRate(quality: 0 | 1 | 2 | 3) {
    if (!current) return;
    await reviewMutation.mutateAsync({ wordId: current.wordId, quality });
    const next = cardIndex + 1;
    setReviewedCount(reviewedCount + 1);
    if (next >= items.length) {
      setDone(true);
    } else {
      setCardIndex(next);
      setRevealed(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </SafeAreaView>
    );
  }

  if (done || items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <View
          style={{
            backgroundColor: '#22c55e22',
            borderRadius: 60,
            width: 100,
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 40 }}>+</Text>
        </View>
        <Text className="text-text1 text-2xl font-bold mb-2">Tamamlandı!</Text>
        {items.length === 0 ? (
          <Text className="text-text3 text-center mb-8">Bugün tekrar edilecek kelime yok.</Text>
        ) : (
          <Text className="text-text3 text-center mb-8">
            {reviewedCount} kelimeyi tekrar ettiniz.
          </Text>
        )}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/vocabulary')}
          className="bg-accent rounded-xl py-4 px-8"
        >
          <Text className="text-white font-semibold text-base">Kelimelerime Don</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-5 pt-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#6366f1', fontSize: 15 }}>Geri</Text>
        </TouchableOpacity>
        <Text className="text-text3 text-sm">{reviewedCount}/{items.length}</Text>
      </View>

      <View className="px-5 mt-3 mb-6">
        <View className="bg-bg3 rounded-full h-2">
          <View
            style={{
              width: `${progress * 100}%`,
              height: 8,
              backgroundColor: '#6366f1',
              borderRadius: 4,
            }}
          />
        </View>
      </View>

      <View className="flex-1 px-5">
        <TouchableOpacity
          onPress={() => setRevealed(true)}
          activeOpacity={revealed ? 1 : 0.8}
          className="bg-bg2 border border-border rounded-2xl p-6 mb-6"
          style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text className="text-text1 text-3xl font-bold mb-2">{current.word.word}</Text>
          {current.word.phonetic ? (
            <Text className="text-text3 text-base mb-4">{current.word.phonetic}</Text>
          ) : null}

          {!revealed ? (
            <Text className="text-text3 text-sm mt-4">Dokunarak cevabı goster</Text>
          ) : (
            <View className="mt-4 w-full">
              <View
                style={{
                  height: 1,
                  backgroundColor: '#27272a',
                  marginBottom: 16,
                }}
              />
              <Text className="text-text2 text-base mb-2">{current.word.definition}</Text>
              <Text className="text-text3 text-sm mb-3">{current.word.definitionTr}</Text>
              {current.word.examples.slice(0, 1).map((ex, i) => (
                <Text key={i} className="text-text3 text-sm italic">"{ex}"</Text>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {revealed && (
          <View className="flex-row" style={{ gap: 8 }}>
            {QUALITY_BUTTONS.map(({ label, quality, color }) => (
              <TouchableOpacity
                key={quality}
                onPress={() => handleRate(quality)}
                disabled={reviewMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: color + '22',
                  borderColor: color,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color, fontWeight: '600', fontSize: 13 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
