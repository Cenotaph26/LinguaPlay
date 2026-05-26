import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizApi, QuizQuestion } from '../services/api';

interface Answer {
  questionId: number;
  answer: string;
}

export default function Quiz() {
  const params = useLocalSearchParams<{ questions?: string; source?: string }>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [textInputs, setTextInputs] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ score: number; total: number; percentage: number; results: Array<{ questionId: number; correct: boolean; correctAnswer: string; userAnswer: string }> } | null>(null);

  const preloadedQuestions: QuizQuestion[] | null = params.questions
    ? JSON.parse(params.questions)
    : null;

  const { data: generatedQuiz, isLoading } = useQuery({
    queryKey: ['quiz-generate'],
    queryFn: () => quizApi.generate({ source: params.source ?? 'vocabulary', count: 10 }).then((r) => r.data),
    enabled: !preloadedQuestions,
  });

  const questions: QuizQuestion[] = preloadedQuestions ?? generatedQuiz?.questions ?? [];

  const submitMutation = useMutation({
    mutationFn: (submittedAnswers: Answer[]) =>
      quizApi.submit(
        submittedAnswers,
        questions.map((q) => ({ id: q.id, correctAnswer: q.correctAnswer }))
      ).then((r) => r.data),
    onSuccess: (data) => {
      setResults(data);
      setSubmitted(true);
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.response?.data?.error ?? 'Sonuçlar gönderilemedi');
    },
  });

  const setAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId, answer };
        return updated;
      }
      return [...prev, { questionId, answer }];
    });
  };

  const getAnswer = (questionId: number) =>
    answers.find((a) => a.questionId === questionId)?.answer ?? null;

  const handleSubmit = () => {
    if (answers.length < questions.length) {
      Alert.alert('Eksik Cevap', 'Lütfen tüm soruları cevaplayın');
      return;
    }
    submitMutation.mutate(answers);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={{ color: '#71717a' }}>Quiz hazırlanıyor...</Text>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="help-circle-outline" size={48} color="#3f3f46" />
        <Text style={{ color: '#71717a', textAlign: 'center', marginTop: 12 }}>
          Quiz oluşturulamadı. Önce kelime ekleyin.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20, backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (submitted && results) {
    const pct = results.percentage;
    const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ color: '#fafafa', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>Sonuçlar</Text>
          <Text style={{ color: '#71717a', marginBottom: 24 }}>Quiz tamamlandı</Text>

          <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color, fontSize: 48, fontWeight: 'bold' }}>{pct}%</Text>
            <Text style={{ color: '#a1a1aa', fontSize: 16, marginTop: 4 }}>
              {results.score}/{results.total} doğru
            </Text>
            <Text style={{ color: pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444', fontSize: 14, marginTop: 8, fontWeight: '600' }}>
              {pct >= 70 ? 'Harika!' : pct >= 50 ? 'İyi' : 'Çalışmaya devam et'}
            </Text>
          </View>

          {results.results.map((r, i) => {
            const q = questions.find((q) => q.id === r.questionId);
            return (
              <View key={i} style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: r.correct ? '#22c55e' : '#ef4444' }}>
                <Text style={{ color: '#fafafa', fontSize: 14, marginBottom: 6 }}>{q?.question}</Text>
                <Text style={{ color: r.correct ? '#22c55e' : '#ef4444', fontSize: 13 }}>
                  {r.correct ? '✓' : '✗'} {r.userAnswer || '(boş)'}
                </Text>
                {!r.correct && (
                  <Text style={{ color: '#a1a1aa', fontSize: 12, marginTop: 3 }}>Doğru: {r.correctAnswer}</Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/vocabulary')}
            style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Kelimelerime Dön</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </TouchableOpacity>
        <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 16, flex: 1 }}>Quiz</Text>
        <Text style={{ color: '#71717a', fontSize: 13 }}>{answers.length}/{questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {questions.map((q, index) => {
          const selected = getAnswer(q.id);
          return (
            <View key={q.id} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                <View style={{ backgroundColor: '#27272a', borderRadius: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#a1a1aa', fontWeight: '600', fontSize: 13 }}>{index + 1}</Text>
                </View>
                <Text style={{ color: '#fafafa', fontSize: 15, flex: 1, lineHeight: 22 }}>{q.question}</Text>
              </View>

              {q.type === 'multiple_choice' && q.options ? (
                <View style={{ gap: 8 }}>
                  {q.options.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setAnswer(q.id, opt)}
                      style={{
                        backgroundColor: selected === opt ? '#6366f133' : '#18181b',
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: selected === opt ? '#6366f1' : '#27272a',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <View style={{
                        width: 20, height: 20, borderRadius: 10,
                        borderWidth: 2,
                        borderColor: selected === opt ? '#6366f1' : '#3f3f46',
                        backgroundColor: selected === opt ? '#6366f1' : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected === opt && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                      </View>
                      <Text style={{ color: selected === opt ? '#fafafa' : '#a1a1aa', fontSize: 14, flex: 1 }}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  value={textInputs[q.id] ?? ''}
                  onChangeText={(text) => {
                    setTextInputs((prev) => ({ ...prev, [q.id]: text }));
                    setAnswer(q.id, text);
                  }}
                  placeholder="Cevabınızı yazın..."
                  placeholderTextColor="#52525b"
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: 12,
                    padding: 14,
                    color: '#fafafa',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: textInputs[q.id] ? '#6366f1' : '#27272a',
                  }}
                />
              )}
            </View>
          );
        })}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 24 }}
        >
          {submitMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Tamamla ({answers.length}/{questions.length})</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
