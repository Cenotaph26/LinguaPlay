import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { contentApi, vocabularyApi } from '../../services/api';

const TABS = ['Kelimeler', 'İfadeler', 'Transkript'] as const;

export default function ContentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<typeof TABS[number]>('Kelimeler');

  const { data: item, isLoading } = useQuery({
    queryKey: ['content-detail', id],
    queryFn: () => contentApi.getContentById(id).then((r) => r.data),
    enabled: !!id,
  });

  const addWordMutation = useMutation({
    mutationFn: (word: { word: string; definition: string; definitionTr: string; level: string; examples: string[] }) =>
      vocabularyApi.addWord(word).then((r) => r.data),
    onSuccess: () => Alert.alert('', 'Kelime listeye eklendi'),
    onError: () => Alert.alert('Hata', 'Kelime eklenemedi'),
  });

  const quizMutation = useMutation({
    mutationFn: () => contentApi.generateQuiz(id).then((r) => r.data),
    onSuccess: (data) => {
      router.push({ pathname: '/quiz', params: { questions: JSON.stringify(data.questions) } });
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.response?.data?.error ?? 'Quiz oluşturulamadı');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#71717a' }}>İçerik bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
        </TouchableOpacity>
        <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 16, flex: 1 }} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity
          onPress={() => quizMutation.mutate()}
          disabled={quizMutation.isPending || item.words.length < 3}
          style={{ backgroundColor: '#6366f122', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          {quizMutation.isPending
            ? <ActivityIndicator size="small" color="#6366f1" />
            : <Text style={{ color: '#6366f1', fontWeight: '600', fontSize: 13 }}>Quiz</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 4 }}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: tab === t ? '#6366f1' : '#18181b',
              borderWidth: 1,
              borderColor: tab === t ? '#6366f1' : '#27272a',
            }}
          >
            <Text style={{ color: tab === t ? '#fff' : '#71717a', fontWeight: '600', fontSize: 13 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
        {tab === 'Kelimeler' && (
          item.words.length === 0 ? (
            <Text style={{ color: '#71717a', textAlign: 'center', marginTop: 40 }}>Kelime bulunamadı</Text>
          ) : (
            item.words.map((cw) => (
              <View key={cw.id} style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#27272a', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 16, marginBottom: 2 }}>{cw.word.word}</Text>
                    <Text style={{ color: '#a1a1aa', fontSize: 13 }}>{cw.word.definition}</Text>
                    <Text style={{ color: '#6366f1', fontSize: 13 }}>{cw.word.definitionTr}</Text>
                    {cw.contexts[0] ? (
                      <Text style={{ color: '#71717a', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>"{cw.contexts[0]}"</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => addWordMutation.mutate({
                      word: cw.word.word,
                      definition: cw.word.definition,
                      definitionTr: cw.word.definitionTr,
                      level: cw.word.level,
                      examples: cw.word.examples,
                    })}
                    style={{ backgroundColor: '#6366f122', borderRadius: 8, padding: 8, marginLeft: 8 }}
                  >
                    <Ionicons name="add" size={18} color="#6366f1" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: '#52525b', fontSize: 11 }}>{cw.occurrences}x kullanım</Text>
                  <Text style={{ color: '#52525b', fontSize: 11 }}>{cw.word.level}</Text>
                </View>
              </View>
            ))
          )
        )}

        {tab === 'İfadeler' && (
          item.phrases.length === 0 ? (
            <Text style={{ color: '#71717a', textAlign: 'center', marginTop: 40 }}>İfade bulunamadı</Text>
          ) : (
            item.phrases.map((p) => (
              <View key={p.id} style={{ backgroundColor: '#18181b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#27272a', marginBottom: 8 }}>
                <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 15, marginBottom: 4 }}>{p.phrase}</Text>
                <Text style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 2 }}>{p.meaning}</Text>
                <Text style={{ color: '#6366f1', fontSize: 13, marginBottom: 6 }}>{p.meaningTr}</Text>
                {p.examples[0] ? (
                  <Text style={{ color: '#71717a', fontSize: 12, fontStyle: 'italic' }}>"{p.examples[0]}"</Text>
                ) : null}
              </View>
            ))
          )
        )}

        {tab === 'Transkript' && (
          <Text style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 22 }}>
            {item.transcript || 'Transkript mevcut değil'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
