import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { contentApi, vocabularyApi } from '../../services/api';

const TABS = ['Kelimeler', 'İfadeler', 'Transkript', 'Flashcard'] as const;

interface WordExplain {
  word: string;
  definition: string;
  definitionTr: string;
  phonetic: string;
  examples: string[];
  synonyms: string[];
}

function TappableTranscript({ text, onWordLongPress }: { text: string; onWordLongPress: (word: string) => void }) {
  const tokens = text.split(/(\s+)/);
  return (
    <Text style={{ color: '#6B638F', fontSize: 14, lineHeight: 24 }}>
      {tokens.map((token, i) => {
        if (/\s+/.test(token)) return token;
        return (
          <Text
            key={i}
            onLongPress={() => {
              const clean = token.replace(/[^a-zA-Z']/g, '').toLowerCase();
              if (clean.length > 1) onWordLongPress(clean);
            }}
            delayLongPress={400}
          >
            {token}
          </Text>
        );
      })}
    </Text>
  );
}

function WordExplainModal({
  visible, word, data, loading, onClose,
}: {
  visible: boolean; word: string; data: WordExplain | null;
  loading: boolean; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(17,13,36,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: 480 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#110D24' }}>{word}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color="#9B94CC" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <ActivityIndicator color="#7355F7" />
                <Text style={{ color: '#9B94CC', marginTop: 8, fontSize: 13 }}>Claude açıklıyor...</Text>
              </View>
            ) : data ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {data.phonetic ? (
                  <Text style={{ color: '#9B94CC', fontSize: 13, marginBottom: 8 }}>{data.phonetic}</Text>
                ) : null}
                <View style={{ backgroundColor: '#F0EEF9', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <Text style={{ color: '#6B638F', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>İNGİLİZCE</Text>
                  <Text style={{ color: '#110D24', fontSize: 14 }}>{data.definition}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(14,158,128,0.08)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <Text style={{ color: '#0E9E80', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>TÜRKÇE</Text>
                  <Text style={{ color: '#110D24', fontSize: 14 }}>{data.definitionTr}</Text>
                </View>
                {data.examples.length > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: '#6B638F', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>ÖRNEKLER</Text>
                    {data.examples.map((ex, i) => (
                      <Text key={i} style={{ color: '#6B638F', fontSize: 13, marginBottom: 4 }}>• {ex}</Text>
                    ))}
                  </View>
                )}
                {data.synonyms.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {data.synonyms.map((s, i) => (
                      <View key={i} style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: '#7355F7', fontSize: 12 }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={{ color: '#9B94CC', fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
                Açıklama bulunamadı
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ContentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<typeof TABS[number]>('Kelimeler');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashRevealed, setFlashRevealed] = useState(false);
  const [flashAdded, setFlashAdded] = useState<Record<string, boolean>>({});
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wordModal, setWordModal] = useState<{ visible: boolean; word: string; loading: boolean; data: WordExplain | null }>({
    visible: false, word: '', loading: false, data: null,
  });

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

  async function handleWordLongPress(word: string) {
    setWordModal({ visible: true, word, loading: true, data: null });
    try {
      const { data } = await vocabularyApi.explainWordByString(word);
      setWordModal((prev) => ({ ...prev, loading: false, data }));
    } catch {
      setWordModal((prev) => ({ ...prev, loading: false, data: null }));
    }
  }

  const q = searchQuery.toLowerCase().trim();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7355F7" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9B94CC' }}>İçerik bulunamadı</Text>
      </SafeAreaView>
    );
  }

  const filteredWords = q
    ? item.words.filter((cw) =>
        cw.word.word.toLowerCase().includes(q) ||
        cw.word.definition.toLowerCase().includes(q) ||
        cw.word.definitionTr.toLowerCase().includes(q)
      )
    : item.words;

  const filteredPhrases = q
    ? item.phrases.filter((p) =>
        p.phrase.toLowerCase().includes(q) ||
        p.meaning.toLowerCase().includes(q) ||
        p.meaningTr.toLowerCase().includes(q)
      )
    : item.phrases;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
      {/* Header */}
      {searchVisible ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E4E1F5', gap: 8 }}>
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Kelime veya ifade ara..."
            placeholderTextColor="#9B94CC"
            style={{ flex: 1, backgroundColor: '#F0EEF9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#110D24', fontSize: 14 }}
          />
          <TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery(''); }}>
            <Text style={{ color: '#7355F7', fontWeight: '600', fontSize: 14 }}>İptal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E4E1F5', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#6B638F" />
          </TouchableOpacity>
          <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 16, flex: 1 }} numberOfLines={1}>{item.title}</Text>
          <TouchableOpacity onPress={() => setSearchVisible(true)} style={{ padding: 4 }}>
            <Ionicons name="search-outline" size={20} color="#6B638F" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => quizMutation.mutate()}
            disabled={quizMutation.isPending || item.words.length < 3}
            style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            {quizMutation.isPending
              ? <ActivityIndicator size="small" color="#7355F7" />
              : <Text style={{ color: '#7355F7', fontWeight: '600', fontSize: 13 }}>Quiz</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 4 }}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => { setTab(t); if (t === 'Flashcard') { setFlashcardIndex(0); setFlashRevealed(false); } }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: tab === t ? '#7355F7' : '#ffffff',
              borderWidth: 1,
              borderColor: tab === t ? '#7355F7' : '#E4E1F5',
            }}
          >
            <Text style={{ color: tab === t ? '#fff' : '#9B94CC', fontWeight: '600', fontSize: 13 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
        {tab === 'Kelimeler' && (
          filteredWords.length === 0 ? (
            <Text style={{ color: '#9B94CC', textAlign: 'center', marginTop: 40 }}>
              {q ? 'Arama sonucu bulunamadı' : 'Kelime bulunamadı'}
            </Text>
          ) : (
            filteredWords.map((cw) => (
              <View key={cw.id} style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E1F5', marginBottom: 8, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 16, marginBottom: 2 }}>{cw.word.word}</Text>
                    <Text style={{ color: '#6B638F', fontSize: 13 }}>{cw.word.definition}</Text>
                    <Text style={{ color: '#7355F7', fontSize: 13 }}>{cw.word.definitionTr}</Text>
                    {cw.contexts[0] ? (
                      <Text style={{ color: '#9B94CC', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>"{cw.contexts[0]}"</Text>
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
                    style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 8, padding: 8, marginLeft: 8 }}
                  >
                    <Ionicons name="add" size={18} color="#7355F7" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: '#9B94CC', fontSize: 11 }}>{cw.occurrences}x kullanım</Text>
                  <Text style={{ color: '#9B94CC', fontSize: 11 }}>{cw.word.level}</Text>
                </View>
              </View>
            ))
          )
        )}

        {tab === 'İfadeler' && (
          filteredPhrases.length === 0 ? (
            <Text style={{ color: '#9B94CC', textAlign: 'center', marginTop: 40 }}>
              {q ? 'Arama sonucu bulunamadı' : 'İfade bulunamadı'}
            </Text>
          ) : (
            filteredPhrases.map((p) => (
              <View key={p.id} style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E1F5', marginBottom: 8, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
                <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 15, marginBottom: 4 }}>{p.phrase}</Text>
                <Text style={{ color: '#6B638F', fontSize: 13, marginBottom: 2 }}>{p.meaning}</Text>
                <Text style={{ color: '#7355F7', fontSize: 13, marginBottom: 6 }}>{p.meaningTr}</Text>
                {p.examples[0] ? (
                  <Text style={{ color: '#9B94CC', fontSize: 12, fontStyle: 'italic' }}>"{p.examples[0]}"</Text>
                ) : null}
              </View>
            ))
          )
        )}

        {tab === 'Transkript' && (
          <View>
            {item.transcript ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, backgroundColor: 'rgba(115,85,247,0.06)', borderRadius: 8, padding: 8 }}>
                  <Ionicons name="information-circle-outline" size={14} color="#9B94CC" />
                  <Text style={{ color: '#9B94CC', fontSize: 11 }}>Herhangi bir kelimeye uzun basarak tanımını görebilirsin</Text>
                </View>
                <TappableTranscript text={item.transcript} onWordLongPress={handleWordLongPress} />
              </>
            ) : (
              <Text style={{ color: '#9B94CC', textAlign: 'center', marginTop: 40 }}>Transkript mevcut değil</Text>
            )}
          </View>
        )}

        {tab === 'Flashcard' && (() => {
          const cards = item.words;
          if (cards.length === 0) {
            return (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Ionicons name="layers-outline" size={48} color="#E4E1F5" />
                <Text style={{ color: '#9B94CC', marginTop: 12, fontSize: 14 }}>Flashcard için kelime yok</Text>
              </View>
            );
          }
          if (flashcardIndex >= cards.length) {
            return (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🎉</Text>
                <Text style={{ color: '#110D24', fontWeight: '700', fontSize: 18, marginBottom: 6 }}>Tamamlandı!</Text>
                <Text style={{ color: '#9B94CC', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>{cards.length} kelimeyi gözden geçirdin</Text>
                <TouchableOpacity
                  onPress={() => { setFlashcardIndex(0); setFlashRevealed(false); }}
                  style={{ backgroundColor: '#7355F7', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Yeniden Başla</Text>
                </TouchableOpacity>
              </View>
            );
          }
          const card = cards[flashcardIndex];
          const isAdded = flashAdded[card.id];
          return (
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <View style={{ flex: 1, height: 4, backgroundColor: '#F0EEF9', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${(flashcardIndex / cards.length) * 100}%`, height: 4, backgroundColor: '#7355F7', borderRadius: 4 }} />
                </View>
                <Text style={{ color: '#9B94CC', fontSize: 12 }}>{flashcardIndex + 1}/{cards.length}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setFlashRevealed((r) => !r)}
                activeOpacity={0.85}
                style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: '#E4E1F5', alignItems: 'center', minHeight: 200, justifyContent: 'center', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 5 }}
              >
                {!flashRevealed ? (
                  <>
                    <Text style={{ color: '#9B94CC', fontSize: 11, fontWeight: '600', letterSpacing: 0.7, marginBottom: 14 }}>KELIME</Text>
                    <Text style={{ color: '#110D24', fontSize: 28, fontWeight: '700', textAlign: 'center' }}>{card.word.word}</Text>
                    {card.word.phonetic && (
                      <Text style={{ color: '#9B94CC', fontSize: 13, fontStyle: 'italic', marginTop: 6 }}>{card.word.phonetic}</Text>
                    )}
                    <Text style={{ color: '#C4C0E0', fontSize: 12, marginTop: 20 }}>Cevabı görmek için dokun</Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: '#9B94CC', fontSize: 11, fontWeight: '600', letterSpacing: 0.7, marginBottom: 14 }}>ANLAM</Text>
                    <Text style={{ color: '#110D24', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 6 }}>{card.word.definition}</Text>
                    <Text style={{ color: '#7355F7', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>{card.word.definitionTr}</Text>
                    {card.contexts[0] && (
                      <View style={{ borderLeftWidth: 2, borderLeftColor: '#E4E1F5', paddingLeft: 10 }}>
                        <Text style={{ color: '#9B94CC', fontSize: 12, fontStyle: 'italic' }}>"{card.contexts[0]}"</Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
                {isAdded ? (
                  <View style={{ flex: 1, backgroundColor: 'rgba(14,158,128,0.08)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(14,158,128,0.20)' }}>
                    <Ionicons name="checkmark-circle" size={16} color="#0E9E80" />
                    <Text style={{ color: '#0E9E80', fontWeight: '600', fontSize: 13 }}>Eklendi</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      addWordMutation.mutate({ word: card.word.word, definition: card.word.definition, definitionTr: card.word.definitionTr, level: card.word.level, examples: card.word.examples });
                      setFlashAdded((s) => ({ ...s, [card.id]: true }));
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(115,85,247,0.20)' }}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#7355F7" />
                    <Text style={{ color: '#7355F7', fontWeight: '600', fontSize: 13 }}>Kelime Listeme Ekle</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => { setFlashcardIndex((i) => i + 1); setFlashRevealed(false); }}
                  style={{ flex: 1, backgroundColor: '#7355F7', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>İleri</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </ScrollView>

      <WordExplainModal
        visible={wordModal.visible}
        word={wordModal.word}
        data={wordModal.data}
        loading={wordModal.loading}
        onClose={() => setWordModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
