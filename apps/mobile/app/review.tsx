import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi } from '../services/api';
import * as Speech from 'expo-speech';

const QUALITY_BUTTONS: Array<{ label: string; quality: 0 | 1 | 2 | 3; color: string }> = [
  { label: 'Tekrar', quality: 0, color: '#E84E32' },
  { label: 'Zor', quality: 1, color: '#F59E0B' },
  { label: 'İyi', quality: 2, color: '#7355F7' },
  { label: 'Kolay', quality: 3, color: '#0E9E80' },
];

export default function Review() {
  const queryClient = useQueryClient();
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  function speakWord(word: string) {
    if (speaking) { Speech.stop(); setSpeaking(false); return; }
    setSpeaking(true);
    Speech.speak(word, {
      language: 'en',
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  const { data, isLoading } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userWordId, quality }: { userWordId: string; quality: 0 | 1 | 2 | 3 }) =>
      vocabularyApi.review(userWordId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-words'] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary-due'] });
    },
  });

  const items = Array.isArray(data) ? data : [];
  const current = items[cardIndex];
  const progress = items.length > 0 ? reviewedCount / items.length : 0;

  async function handleRate(quality: 0 | 1 | 2 | 3) {
    if (!current) return;
    const userWordId = current.userWord?.id;
    if (!userWordId) return;
    await reviewMutation.mutateAsync({ userWordId, quality });
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
        <ActivityIndicator color="#7355F7" size="large" />
      </SafeAreaView>
    );
  }

  if (done || items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <View
          style={{
            backgroundColor: 'rgba(14,158,128,0.10)',
            borderRadius: 60,
            width: 100,
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 40 }}>✓</Text>
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
          <Text className="text-white font-semibold text-base">Kelimelerime Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-5 pt-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#7355F7', fontSize: 15 }}>Geri</Text>
        </TouchableOpacity>
        <Text className="text-text3 text-sm">{reviewedCount}/{items.length}</Text>
      </View>

      <View className="px-5 mt-3 mb-6">
        <View className="bg-bg3 rounded-full h-2">
          <View
            style={{
              width: `${progress * 100}%`,
              height: 8,
              backgroundColor: '#7355F7',
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Text className="text-text1 text-3xl font-bold">{current.word}</Text>
            <TouchableOpacity
              onPress={() => speakWord(current.word)}
              style={{ backgroundColor: speaking ? 'rgba(115,85,247,0.15)' : '#F0EEF9', borderRadius: 20, padding: 7, borderWidth: 1, borderColor: speaking ? '#7355F7' : '#E4E1F5' }}
            >
              <Ionicons name={speaking ? 'stop' : 'volume-medium-outline'} size={16} color={speaking ? '#7355F7' : '#9B94CC'} />
            </TouchableOpacity>
          </View>
          {current.phonetic ? (
            <Text className="text-text3 text-base mb-4">{current.phonetic}</Text>
          ) : null}

          {!revealed ? (
            <Text className="text-text3 text-sm mt-4">Dokunarak cevabı göster</Text>
          ) : (
            <View className="mt-4 w-full">
              <View style={{ height: 1, backgroundColor: '#E4E1F5', marginBottom: 16 }} />
              <Text className="text-text2 text-base mb-2">{current.definition}</Text>
              <Text className="text-text3 text-sm mb-3">{current.definitionTr}</Text>
              {(current.examples ?? []).slice(0, 1).map((ex: string, i: number) => (
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
