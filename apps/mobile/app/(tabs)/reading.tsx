import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { readingApi, ReadingTextSummary } from '../../services/api';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const LEVELS = ['Tümü', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: 'rgba(14,158,128,0.10)', text: '#0E9E80', border: 'rgba(14,158,128,0.25)' },
  A2: { bg: 'rgba(14,158,128,0.10)', text: '#0E9E80', border: 'rgba(14,158,128,0.25)' },
  B1: { bg: 'rgba(245,158,11,0.10)', text: '#D97706', border: 'rgba(245,158,11,0.25)' },
  B2: { bg: 'rgba(245,158,11,0.10)', text: '#D97706', border: 'rgba(245,158,11,0.25)' },
  C1: { bg: 'rgba(232,78,50,0.10)', text: '#E84E32', border: 'rgba(232,78,50,0.25)' },
  C2: { bg: 'rgba(232,78,50,0.10)', text: '#E84E32', border: 'rgba(232,78,50,0.25)' },
};

const CAT_ICONS: Record<string, IconName> = {
  story:    'book-outline',
  article:  'newspaper-outline',
  dialogue: 'chatbubbles-outline',
  science:  'flask-outline',
  business: 'briefcase-outline',
  news:     'megaphone-outline',
};

export default function Reading() {
  const [activeLevel, setActiveLevel] = useState('Tümü');

  const { data: texts = [], isLoading } = useQuery({
    queryKey: ['reading-texts', activeLevel],
    queryFn: () =>
      readingApi.getTexts(activeLevel === 'Tümü' ? undefined : { level: activeLevel })
        .then((r) => r.data),
  });

  const totalCount = texts.length;
  const completedCount = texts.filter((t) => t.completed).length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#110D24' }}>Okuma</Text>
            <Text style={{ fontSize: 13, color: '#9B94CC', marginTop: 2 }}>
              Seviyene göre metinleri oku ve kelime öğren
            </Text>
          </View>

          {/* Progress card */}
          <View style={{ backgroundColor: '#7355F7', borderRadius: 18, padding: 18, marginBottom: 20, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                  TOPLAM İLERLEME
                </Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                  {completedCount}/{totalCount} metin
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>%{completionPct}</Text>
              </View>
            </View>
            {/* Progress bar */}
            <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100 }}>
              <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 100, width: `${completionPct}%` }} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 6 }}>
              Her metin 15 XP kazandırır
            </Text>
          </View>

          {/* Level filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LEVELS.map((lvl) => {
                const active = activeLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setActiveLevel(lvl)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? '#7355F7' : '#fff',
                      borderWidth: 1,
                      borderColor: active ? '#7355F7' : '#E4E1F5',
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : '#6B638F', fontWeight: '600', fontSize: 13 }}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* List */}
          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color="#7355F7" size="large" />
            </View>
          ) : texts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="document-text-outline" size={48} color="#E4E1F5" />
              <Text style={{ color: '#9B94CC', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                Bu seviyede metin bulunamadı
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {(texts as ReadingTextSummary[]).map((t) => {
                const lc = LEVEL_COLORS[t.level] ?? LEVEL_COLORS.A1;
                const catIcon = CAT_ICONS[t.category] ?? 'document-text-outline';
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => router.push(`/reading/${t.id}` as any)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 14,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderWidth: 1,
                      borderColor: t.completed ? 'rgba(14,158,128,0.25)' : '#E4E1F5',
                      shadowColor: '#7355F7',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    {/* Icon */}
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.completed ? 'rgba(14,158,128,0.10)' : 'rgba(115,85,247,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ionicons
                        name={t.completed ? 'checkmark-circle' : catIcon}
                        size={22}
                        color={t.completed ? '#0E9E80' : '#7355F7'}
                      />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#110D24', marginBottom: 4 }} numberOfLines={2}>
                        {t.title}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {/* Level badge */}
                        <View style={{ backgroundColor: lc.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: lc.border }}>
                          <Text style={{ color: lc.text, fontSize: 10, fontWeight: '700' }}>{t.level}</Text>
                        </View>
                        {/* Reading time */}
                        <View style={{ backgroundColor: '#F0EEF9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="time-outline" size={10} color="#9B94CC" />
                          <Text style={{ color: '#9B94CC', fontSize: 10 }}>{t.readingTimeMin} dk</Text>
                        </View>
                        {/* Word count */}
                        <View style={{ backgroundColor: '#F0EEF9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="text-outline" size={10} color="#9B94CC" />
                          <Text style={{ color: '#9B94CC', fontSize: 10 }}>{t.wordCount} kelime</Text>
                        </View>
                        {t.completed && t.score != null && (
                          <View style={{ backgroundColor: 'rgba(14,158,128,0.08)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ color: '#0E9E80', fontSize: 10, fontWeight: '600' }}>
                              %{Math.round((t.score / 3) * 100)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#C8C3E0" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
