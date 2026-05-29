import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi, UserWord } from '../../services/api';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const LEVEL_COLORS: Record<string, string> = {
  A1: '#0E9E80', A2: '#0E9E80', B1: '#7355F7', B2: '#7355F7', C1: '#F59E0B', C2: '#F59E0B',
};

const SRS_BUTTONS: Array<{ label: string; quality: 0 | 1 | 2 | 3; color: string; icon: IconName }> = [
  { label: 'Tekrar', quality: 0, color: '#E84E32', icon: 'refresh-outline' },
  { label: 'Zor',    quality: 1, color: '#F59E0B', icon: 'remove-outline' },
  { label: 'İyi',    quality: 2, color: '#7355F7', icon: 'checkmark-outline' },
  { label: 'Kolay',  quality: 3, color: '#0E9E80', icon: 'star-outline' },
];

const STATUS_COLORS: Record<string, string> = {
  NEW: '#9B94CC', LEARNING: '#F59E0B', REVIEW: '#7355F7', MASTERED: '#0E9E80',
};

const FILTER_OPTS = [
  { label: 'Tümü', value: '' },
  { label: 'Öğreniliyor', value: 'LEARNING' },
  { label: 'Tekrar', value: 'REVIEW' },
  { label: 'Ustalaşıldı', value: 'MASTERED' },
];

interface ExplainData {
  definition: string;
  definitionTr: string;
  phonetic: string;
  examples: string[];
  synonyms: string[];
}

export default function Vocabulary() {
  const [tab, setTab] = useState<'review' | 'list'>('review');
  const [cardIndex, setCardIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [listFilter, setListFilter] = useState('');
  const [selectedWord, setSelectedWord] = useState<UserWord | null>(null);
  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: dueData, isLoading: dueLoading } = useQuery({
    queryKey: ['vocabulary-due'],
    queryFn: () => vocabularyApi.getDue().then((r) => r.data),
    staleTime: 30000,
  });

  const { data: wordsData, isLoading: listLoading } = useQuery({
    queryKey: ['vocabulary-words', listFilter],
    queryFn: () => vocabularyApi.getWords(listFilter ? { status: listFilter } : {}).then((r) => r.data),
    staleTime: 30000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userWordId, quality }: { userWordId: string; quality: 0 | 1 | 2 | 3 }) =>
      vocabularyApi.review(userWordId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-due'] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary-words'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });

  const dueItems: UserWord[] = Array.isArray(dueData) ? dueData : [];
  const listWords: UserWord[] = wordsData?.words ?? [];
  const dueCount = dueItems.length;
  const current = dueItems[cardIndex];

  async function handleRate(quality: 0 | 1 | 2 | 3) {
    if (!current?.userWord?.id) return;
    await reviewMutation.mutateAsync({ userWordId: current.userWord.id, quality });
    const next = cardIndex + 1;
    setReviewedCount((c) => c + 1);
    if (next >= dueItems.length) {
      setDoneToday(true);
    } else {
      setCardIndex(next);
    }
  }

  async function handleExplainWord(word: UserWord) {
    setSelectedWord(word);
    setExplainData(null);
  }

  async function fetchExplanation() {
    if (!selectedWord) return;
    setExplainLoading(true);
    try {
      const res = await vocabularyApi.explainWord(selectedWord.id);
      setExplainData(res.data);
    } catch {
      Alert.alert('Hata', 'AI açıklaması alınamadı. API key gerekli.');
    } finally {
      setExplainLoading(false);
    }
  }

  function startOver() {
    setCardIndex(0);
    setReviewedCount(0);
    setDoneToday(false);
    queryClient.invalidateQueries({ queryKey: ['vocabulary-due'] });
  }

  const nextReviewLabel = (item: UserWord) => {
    const status = item.userWord?.status ?? 'NEW';
    if (status === 'MASTERED') return 'Tamam';
    if (status === 'NEW') return 'Yeni';
    const nr = item.userWord?.nextReview;
    if (!nr) return '';
    const days = Math.ceil((new Date(nr).getTime() - Date.now()) / 86400000);
    return days <= 0 ? 'Bugün' : days === 1 ? 'Yarın' : `${days} gün`;
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Word Detail Modal */}
      <Modal
        visible={!!selectedWord}
        transparent
        animationType="slide"
        onRequestClose={() => { setSelectedWord(null); setExplainData(null); }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(17,13,36,0.45)', justifyContent: 'flex-end' }}
          onPress={() => { setSelectedWord(null); setExplainData(null); }}
        >
          <Pressable onPress={() => {}} style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            {selectedWord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Handle bar */}
                <View style={{ width: 36, height: 4, backgroundColor: '#E4E1F5', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#110D24', flex: 1 }}>{selectedWord.word}</Text>
                  <View style={{ backgroundColor: (LEVEL_COLORS[selectedWord.level] ?? '#9B94CC') + '1a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: (LEVEL_COLORS[selectedWord.level] ?? '#9B94CC') + '40' }}>
                    <Text style={{ color: LEVEL_COLORS[selectedWord.level] ?? '#9B94CC', fontSize: 11, fontWeight: '700' }}>{selectedWord.level}</Text>
                  </View>
                </View>
                {selectedWord.phonetic && (
                  <Text style={{ color: '#6B638F', fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>{selectedWord.phonetic}</Text>
                )}
                <Text style={{ color: '#6B638F', fontSize: 14, lineHeight: 21, marginBottom: 4 }}>{selectedWord.definition}</Text>
                <Text style={{ color: '#7355F7', fontSize: 14, marginBottom: 12 }}>{selectedWord.definitionTr}</Text>
                {selectedWord.examples?.[0] && (
                  <View style={{ borderLeftWidth: 2, borderLeftColor: '#7355F7', paddingLeft: 10, backgroundColor: '#F0EEF9', borderRadius: 6, padding: 10, marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: '#6B638F', fontStyle: 'italic', lineHeight: 19 }}>"{selectedWord.examples[0]}"</Text>
                  </View>
                )}

                {/* AI Explanation Section */}
                {explainData ? (
                  <View style={{ backgroundColor: '#F0EEF9', borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="sparkles" size={14} color="#7355F7" />
                      <Text style={{ color: '#7355F7', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>AI AÇIKLAMASI</Text>
                    </View>
                    <Text style={{ color: '#110D24', fontSize: 13, lineHeight: 20 }}>{explainData.definition}</Text>
                    <Text style={{ color: '#6B638F', fontSize: 13 }}>{explainData.definitionTr}</Text>
                    {explainData.synonyms?.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        <Text style={{ color: '#9B94CC', fontSize: 12 }}>Eş anlamlı: </Text>
                        {explainData.synonyms.map((s, i) => (
                          <View key={i} style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ color: '#7355F7', fontSize: 12 }}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {explainData.examples?.[0] && (
                      <Text style={{ color: '#9B94CC', fontSize: 12, fontStyle: 'italic' }}>"{explainData.examples[0]}"</Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={fetchExplanation}
                    disabled={explainLoading}
                    style={{ backgroundColor: '#7355F7', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}
                  >
                    {explainLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="sparkles-outline" size={16} color="#fff" />
                    }
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                      {explainLoading ? 'Açıklanıyor...' : 'AI ile Açıkla'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => { setSelectedWord(null); setExplainData(null); }}
                  style={{ borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#E4E1F5' }}
                >
                  <Text style={{ color: '#9B94CC', fontWeight: '600', fontSize: 14 }}>Kapat</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#110D24' }}>Kelimeler</Text>
            {dueCount > 0 && tab === 'list' && (
              <View style={{ backgroundColor: 'rgba(115,85,247,0.10)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: '#7355F7', fontSize: 12, fontWeight: '700' }}>{dueCount} bekliyor</Text>
              </View>
            )}
          </View>

          {/* Tab switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F0EEF9', borderRadius: 10, padding: 3, marginTop: 14 }}>
            {([['review', 'Tekrar Et'], ['list', 'Kelime Listem']] as const).map(([t, label]) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                  backgroundColor: tab === t ? '#7355F7' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t ? '#fff' : '#6B638F' }}>
                  {label}{t === 'review' && dueCount > 0 ? ` (${dueCount})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'review' ? (
            <>
              {dueLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator color="#7355F7" />
                </View>
              ) : dueItems.length === 0 || doneToday ? (
                <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E4E1F5', marginBottom: 20 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
                  <Text style={{ color: '#110D24', fontWeight: '700', fontSize: 17, marginBottom: 4 }}>
                    {doneToday ? `${reviewedCount} kelime tamamlandı!` : 'Bugün tekrar yok'}
                  </Text>
                  <Text style={{ color: '#9B94CC', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                    {doneToday ? 'Harika iş! Bugünkü tekrarlarını bitirdin.' : 'Tüm kelimelerin güncel.'}
                  </Text>
                  {doneToday && (
                    <TouchableOpacity
                      onPress={startOver}
                      style={{ backgroundColor: '#F0EEF9', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
                    >
                      <Text style={{ color: '#7355F7', fontWeight: '600', fontSize: 13 }}>Yenile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  {/* Progress counter */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#9B94CC', fontSize: 12 }}>Günlük Tekrar</Text>
                    <Text style={{ color: '#7355F7', fontWeight: '700', fontSize: 13 }}>
                      {reviewedCount}/{dueItems.length}
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={{ height: 4, backgroundColor: '#F0EEF9', borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
                    <View style={{ height: 4, backgroundColor: '#7355F7', borderRadius: 4, width: `${(reviewedCount / dueItems.length) * 100}%` }} />
                  </View>

                  {/* SRS Card */}
                  {current && (
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, position: 'relative' }}>
                      {/* Level badge */}
                      <View style={{ position: 'absolute', top: 14, right: 14, backgroundColor: (LEVEL_COLORS[current.level] ?? '#9B94CC') + '1a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: (LEVEL_COLORS[current.level] ?? '#9B94CC') + '40' }}>
                        <Text style={{ color: LEVEL_COLORS[current.level] ?? '#9B94CC', fontSize: 10, fontWeight: '700' }}>{current.level}</Text>
                      </View>

                      <Text style={{ fontSize: 26, fontWeight: '700', color: '#110D24', marginBottom: 3, marginRight: 40 }}>{current.word}</Text>
                      {current.phonetic && (
                        <Text style={{ fontSize: 12, color: '#6B638F', fontStyle: 'italic', marginBottom: 10 }}>{current.phonetic}</Text>
                      )}
                      <Text style={{ fontSize: 13, color: '#6B638F', lineHeight: 20, marginBottom: 4 }}>{current.definition}</Text>
                      <Text style={{ fontSize: 12, color: '#9B94CC', marginBottom: 12 }}>{current.definitionTr}</Text>
                      {current.examples?.[0] && (
                        <View style={{ borderLeftWidth: 2, borderLeftColor: '#7355F7', paddingLeft: 10, backgroundColor: '#F0EEF9', borderRadius: 6, padding: 10 }}>
                          <Text style={{ fontSize: 12, color: '#6B638F', fontStyle: 'italic', lineHeight: 18 }}>"{current.examples[0]}"</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* SRS Buttons */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                    {SRS_BUTTONS.map((btn) => (
                      <TouchableOpacity
                        key={btn.quality}
                        onPress={() => handleRate(btn.quality)}
                        disabled={reviewMutation.isPending}
                        style={{
                          flex: 1, paddingVertical: 10, borderRadius: 10,
                          alignItems: 'center', gap: 3,
                          backgroundColor: btn.color + '1a',
                          borderWidth: 1, borderColor: btn.color + '40',
                          opacity: reviewMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <Ionicons name={btn.icon} size={16} color={btn.color} />
                        <Text style={{ color: btn.color, fontSize: 11, fontWeight: '600' }}>{btn.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Son Öğrenilen */}
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>
                Son Öğrenilen
              </Text>
              {listLoading ? (
                <ActivityIndicator color="#7355F7" style={{ marginVertical: 12 }} />
              ) : listWords.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="book-outline" size={36} color="#E4E1F5" />
                  <Text style={{ color: '#9B94CC', marginTop: 8, fontSize: 13 }}>Henüz kelime yok</Text>
                </View>
              ) : (
                <View style={{ gap: 6 }}>
                  {listWords.slice(0, 15).map((item) => {
                    const sc = STATUS_COLORS[item.userWord?.status ?? 'NEW'] ?? '#9B94CC';
                    return (
                      <View key={item.id} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc, flexShrink: 0 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#110D24' }}>{item.word}</Text>
                          <Text style={{ fontSize: 12, color: '#9B94CC' }} numberOfLines={1}>{item.definitionTr || item.definition}</Text>
                        </View>
                        <Text style={{ fontSize: 10, color: '#9B94CC' }}>{nextReviewLabel(item)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {FILTER_OPTS.map((f) => (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => setListFilter(f.value)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                        backgroundColor: listFilter === f.value ? 'rgba(115,85,247,0.08)' : '#ffffff',
                        borderWidth: 1, borderColor: listFilter === f.value ? 'rgba(115,85,247,0.25)' : '#E4E1F5',
                      }}
                    >
                      <Text style={{ color: listFilter === f.value ? '#7355F7' : '#9B94CC', fontSize: 12, fontWeight: '600' }}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {listLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator color="#7355F7" />
                </View>
              ) : listWords.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                  <Ionicons name="book-outline" size={48} color="#E4E1F5" />
                  <Text style={{ color: '#9B94CC', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                    Henüz kelime yok{'\n'}Rol yapma veya içerik ekleyerek başlayın
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 6 }}>
                  {listWords.map((item) => {
                    const sc = STATUS_COLORS[item.userWord?.status ?? 'NEW'] ?? '#9B94CC';
                    return (
                      <TouchableOpacity key={item.id} onPress={() => { setExplainData(null); handleExplainWord(item); }} activeOpacity={0.7} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sc, flexShrink: 0 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#110D24' }}>{item.word}</Text>
                          <Text style={{ fontSize: 12, color: '#9B94CC' }} numberOfLines={1}>{item.definitionTr || item.definition}</Text>
                        </View>
                        <Text style={{ fontSize: 10, color: '#9B94CC' }}>{nextReviewLabel(item)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={{ color: '#9B94CC', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                    {wordsData?.total ?? 0} kelime toplam
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
