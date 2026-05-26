import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { placementApi, PlacementQuestion } from '../services/api';
import { useQuery, useMutation } from '@tanstack/react-query';

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#22c55e',
  B1: '#6366f1', B2: '#6366f1',
  C1: '#f59e0b', C2: '#f59e0b',
};

export default function Placement() {
  const { setUser, user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ id: string; selectedIndex: number }>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; level: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['placement-test'],
    queryFn: () => placementApi.getTest().then((r) => r.data),
  });

  const evaluateMutation = useMutation({
    mutationFn: (ans: Array<{ id: string; selectedIndex: number }>) =>
      placementApi.evaluate(ans).then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      setFinished(true);
      if (user) setUser({ ...user, level: data.level });
    },
    onError: () => Alert.alert('Hata', 'Sonuç hesaplanamadı.'),
  });

  const questions: PlacementQuestion[] = data?.questions ?? [];
  const current = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) : 0;

  function handleSelect(index: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    const newAnswers = [...answers, { id: current.id, selectedIndex: index }];
    setAnswers(newAnswers);
    setTimeout(() => {
      setSelectedIndex(null);
      if (currentIndex + 1 >= questions.length) {
        evaluateMutation.mutate(newAnswers);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }, 600);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
        <Text className="text-text3 mt-4">Sorular yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (finished && result) {
    const lc = LEVEL_COLORS[result.level] ?? '#71717a';
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 px-6 items-center justify-center">
          <View
            style={{
              backgroundColor: lc + '22',
              borderRadius: 80,
              width: 140,
              height: 140,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ color: lc, fontSize: 48, fontWeight: '800' }}>{result.level}</Text>
          </View>
          <Text className="text-text1 text-2xl font-bold mb-2">Seviyeniz Belirlendi</Text>
          <Text className="text-text3 text-center mb-2">
            {result.score} / {result.total} soru doğru
          </Text>
          <Text className="text-text3 text-center mb-8">
            CEFR seviyeniz: <Text style={{ color: lc, fontWeight: '700' }}>{result.level}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="bg-accent rounded-xl py-4 px-8"
          >
            <Text className="text-white font-semibold text-base">Devam Et</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (evaluateMutation.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
        <Text className="text-text3 mt-4">Sonuc hesaplanıyor...</Text>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text3">Sorular yüklenemedi.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-5 pt-4 pb-2 flex-row items-center" style={{ gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#6366f1', fontSize: 15 }}>Geri</Text>
        </TouchableOpacity>
        <View className="flex-1 bg-bg3 rounded-full h-2">
          <View
            style={{
              width: `${progress * 100}%`,
              height: 8,
              backgroundColor: '#6366f1',
              borderRadius: 4,
            }}
          />
        </View>
        <Text className="text-text3 text-sm">{currentIndex + 1}/{questions.length}</Text>
      </View>

      <View className="flex-1 px-5 justify-center">
        <View
          style={{
            backgroundColor: LEVEL_COLORS[current.level] + '22',
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: LEVEL_COLORS[current.level], fontSize: 12, fontWeight: '600' }}>
            {current.level}
          </Text>
        </View>

        <Text className="text-text1 text-xl font-semibold mb-8 leading-8">
          {current.question}
        </Text>

        <View style={{ gap: 12 }}>
          {current.options.map((option, idx) => {
            let bg = '#18181b';
            let border = '#27272a';
            let textColor = '#fafafa';
            if (selectedIndex !== null) {
              if (idx === selectedIndex) {
                bg = '#6366f133';
                border = '#6366f1';
              }
            }
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSelect(idx)}
                disabled={selectedIndex !== null}
                style={{
                  backgroundColor: bg,
                  borderColor: border,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <Text style={{ color: textColor, fontSize: 15 }}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
