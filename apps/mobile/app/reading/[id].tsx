import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readingApi, ReadingTextDetail } from '../../services/api';

const LEVEL_COLORS: Record<string, string> = {
  A1: '#0E9E80', A2: '#0E9E80',
  B1: '#D97706', B2: '#D97706',
  C1: '#E84E32', C2: '#E84E32',
};

type QuizState = 'reading' | 'quiz' | 'results';

export default function ReadingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [quizState, setQuizState] = useState<QuizState>('reading');
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { data: text, isLoading } = useQuery({
    queryKey: ['reading-text', id],
    queryFn: () => readingApi.getText(id).then((r) => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (score: number) => readingApi.complete(id, score).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-texts'] });
      queryClient.invalidateQueries({ queryKey: ['reading-text', id] });
    },
  });

  function startQuiz() {
    if (!text) return;
    setAnswers(new Array(text.comprehensionQs.length).fill(null));
    setQuizState('quiz');
    setSubmitted(false);
  }

  function selectAnswer(qIdx: number, optIdx: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }

  function submitQuiz() {
    if (!text) return;
    const correct = text.comprehensionQs.filter((q, i) => answers[i] === q.answerIndex).length;
    setSubmitted(true);
    setQuizState('results');
    completeMutation.mutate(correct);
  }

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  if (isLoading || !text) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7355F7" size="large" />
      </SafeAreaView>
    );
  }

  const levelColor = LEVEL_COLORS[text.level] ?? '#7355F7';
  const correctCount = submitted
    ? text.comprehensionQs.filter((q, i) => answers[i] === q.answerIndex).length
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E1F5', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={20} color="#110D24" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#110D24' }} numberOfLines={1}>
            {text.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={{ backgroundColor: levelColor + '18', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: levelColor + '40' }}>
              <Text style={{ color: levelColor, fontSize: 10, fontWeight: '700' }}>{text.level}</Text>
            </View>
            <Text style={{ color: '#9B94CC', fontSize: 11 }}>
              {text.readingTimeMin} dk · {text.wordCount} kelime
            </Text>
            {text.completed && (
              <Ionicons name="checkmark-circle" size={14} color="#0E9E80" />
            )}
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {quizState === 'reading' && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Reading text */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E4E1F5', marginBottom: 16, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 15, lineHeight: 26, color: '#2D2547' }}>
                {text.text}
              </Text>
            </View>

            {/* Key phrases */}
            {text.keyPhrases.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#9B94CC', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                  Önemli İfadeler
                </Text>
                <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E4E1F5', overflow: 'hidden' }}>
                  {text.keyPhrases.map((kp, i) => (
                    <View
                      key={i}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderBottomWidth: i < text.keyPhrases.length - 1 ? 1 : 0, borderBottomColor: '#F0EEF9' }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7355F7', flexShrink: 0 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#110D24' }}>{kp.phrase}</Text>
                        <Text style={{ fontSize: 12, color: '#9B94CC', marginTop: 1 }}>{kp.tr}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Start quiz button */}
            <TouchableOpacity
              onPress={startQuiz}
              style={{ backgroundColor: '#7355F7', borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
            >
              <Ionicons name="help-circle-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Anlama Soruları</Text>
            </TouchableOpacity>

            {text.completed && (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: '#0E9E80', fontSize: 12, fontWeight: '600' }}>
                  ✓ Bu metni tamamladın
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {quizState === 'quiz' && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingTop: 8, paddingBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#110D24' }}>Anlama Soruları</Text>
              <Text style={{ fontSize: 12, color: '#9B94CC', marginTop: 2 }}>
                {text.comprehensionQs.length} soru — +15 XP
              </Text>
            </View>

            {text.comprehensionQs.map((q, qi) => (
              <View key={qi} style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#110D24', marginBottom: 10, lineHeight: 21 }}>
                  {qi + 1}. {q.question}
                </Text>
                <View style={{ gap: 8 }}>
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    return (
                      <TouchableOpacity
                        key={oi}
                        onPress={() => selectAnswer(qi, oi)}
                        style={{
                          backgroundColor: selected ? 'rgba(115,85,247,0.08)' : '#fff',
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderWidth: 1.5,
                          borderColor: selected ? '#7355F7' : '#E4E1F5',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? '#7355F7' : '#C8C3E0', backgroundColor: selected ? '#7355F7' : 'transparent', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, color: selected ? '#110D24' : '#6B638F', fontWeight: selected ? '600' : '400', lineHeight: 19 }}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={submitQuiz}
              disabled={!allAnswered || completeMutation.isPending}
              style={{ backgroundColor: allAnswered ? '#7355F7' : '#E4E1F5', borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: allAnswered ? 0.3 : 0, shadowRadius: 10, elevation: allAnswered ? 4 : 0 }}
            >
              {completeMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: allAnswered ? '#fff' : '#9B94CC', fontWeight: '700', fontSize: 15 }}>Cevapları Gönder</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        )}

        {quizState === 'results' && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Score card */}
            <View style={{ backgroundColor: correctCount === text.comprehensionQs.length ? '#0E9E80' : correctCount >= Math.ceil(text.comprehensionQs.length / 2) ? '#7355F7' : '#E84E32', borderRadius: 20, padding: 24, marginTop: 8, marginBottom: 20, alignItems: 'center', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 }}>
              <Text style={{ fontSize: 48, marginBottom: 4 }}>
                {correctCount === text.comprehensionQs.length ? '🏆' : correctCount >= Math.ceil(text.comprehensionQs.length / 2) ? '👍' : '📖'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>
                {correctCount}/{text.comprehensionQs.length}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                {correctCount === text.comprehensionQs.length ? 'Mükemmel!' : correctCount >= Math.ceil(text.comprehensionQs.length / 2) ? 'İyi iş!' : 'Tekrar okuyabilirsin'}
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+15 XP kazandın!</Text>
              </View>
            </View>

            {/* Question review */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#9B94CC', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Cevaplar
            </Text>
            {text.comprehensionQs.map((q, qi) => {
              const isCorrect = answers[qi] === q.answerIndex;
              return (
                <View key={qi} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: isCorrect ? 'rgba(14,158,128,0.25)' : 'rgba(232,78,50,0.25)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={isCorrect ? '#0E9E80' : '#E84E32'}
                    />
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#110D24', lineHeight: 19 }}>
                      {q.question}
                    </Text>
                  </View>
                  <View style={{ gap: 4 }}>
                    {q.options.map((opt, oi) => {
                      const isUserAnswer = answers[qi] === oi;
                      const isCorrectAnswer = q.answerIndex === oi;
                      let bg = 'transparent';
                      let textColor = '#9B94CC';
                      if (isCorrectAnswer) { bg = 'rgba(14,158,128,0.08)'; textColor = '#0E9E80'; }
                      else if (isUserAnswer && !isCorrectAnswer) { bg = 'rgba(232,78,50,0.08)'; textColor = '#E84E32'; }
                      return (
                        <View key={oi} style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isCorrectAnswer && <Ionicons name="checkmark" size={12} color="#0E9E80" />}
                          {isUserAnswer && !isCorrectAnswer && <Ionicons name="close" size={12} color="#E84E32" />}
                          {!isCorrectAnswer && !isUserAnswer && <View style={{ width: 12 }} />}
                          <Text style={{ fontSize: 12, color: textColor, fontWeight: isCorrectAnswer || isUserAnswer ? '600' : '400' }}>{opt}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Buttons */}
            <TouchableOpacity
              onPress={() => setQuizState('reading')}
              style={{ backgroundColor: '#7355F7', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Metne Dön</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ backgroundColor: '#F0EEF9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#6B638F', fontWeight: '600', fontSize: 14 }}>Listeye Dön</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
