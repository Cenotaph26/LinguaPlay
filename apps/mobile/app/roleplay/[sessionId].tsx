import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleplayApi, vocabularyApi, BASE_URL } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  correction?: { original: string; suggestion: string; explanation: string } | null;
}

interface WordExplain {
  word: string;
  definition: string;
  definitionTr: string;
  phonetic: string;
  examples: string[];
  synonyms: string[];
}

function TappableText({ text, onWordLongPress }: { text: string; onWordLongPress: (word: string) => void }) {
  const tokens = text.split(/(\s+)/);
  return (
    <Text style={{ color: '#110D24', fontSize: 15, lineHeight: 22 }}>
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
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: 500 }}>
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

function FeedbackScreen({ feedback }: { feedback: { fluencyScore: number; grammarMistakes: string[]; newVocabulary: string[]; suggestions: string } }) {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  async function saveWord(word: string) {
    setSaving((s) => ({ ...s, [word]: true }));
    try {
      await vocabularyApi.saveWord(word);
      setSaved((s) => ({ ...s, [word]: true }));
    } catch {
      Alert.alert('Hata', 'Kelime kaydedilemedi. Kelime veritabanında olmayabilir.');
    } finally {
      setSaving((s) => ({ ...s, [word]: false }));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Text style={{ color: '#110D24', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>Oturum Bitti</Text>
        <Text style={{ color: '#9B94CC', fontSize: 14, marginBottom: 24 }}>Geri bildiriminiz hazır</Text>

        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: '#6B638F', fontSize: 14 }}>Akıcılık Puanı</Text>
            <Text style={{ color: '#7355F7', fontSize: 28, fontWeight: 'bold' }}>{feedback.fluencyScore}/10</Text>
          </View>
          {feedback.grammarMistakes.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#110D24', fontWeight: '600', marginBottom: 8 }}>Dilbilgisi Düzeltmeleri</Text>
              {feedback.grammarMistakes.map((m, i) => (
                <Text key={i} style={{ color: '#6B638F', fontSize: 13, marginBottom: 4 }}>• {m}</Text>
              ))}
            </View>
          )}
          {feedback.newVocabulary.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#110D24', fontWeight: '600', marginBottom: 8 }}>Yeni Kelimeler</Text>
              <View style={{ gap: 8 }}>
                {feedback.newVocabulary.map((w, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ color: '#8B6EFF', fontSize: 13 }}>{w}</Text>
                    </View>
                    {saved[w] ? (
                      <View style={{ backgroundColor: 'rgba(14,158,128,0.10)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <Ionicons name="checkmark" size={14} color="#0E9E80" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => saveWord(w)}
                        disabled={saving[w]}
                        style={{ backgroundColor: 'rgba(115,85,247,0.10)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(115,85,247,0.2)' }}
                      >
                        {saving[w]
                          ? <ActivityIndicator size="small" color="#7355F7" />
                          : <Text style={{ color: '#7355F7', fontSize: 12, fontWeight: '600' }}>Ekle</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
          {feedback.suggestions && (
            <View>
              <Text style={{ color: '#110D24', fontWeight: '600', marginBottom: 6 }}>Öneri</Text>
              <Text style={{ color: '#6B638F', fontSize: 13 }}>{feedback.suggestions}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/roleplay')}
          style={{ backgroundColor: '#7355F7', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sahne Listesine Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function CorrectionBadge({ correction }: { correction: { original: string; suggestion: string; explanation: string } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      style={{ marginTop: 6, backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 8, padding: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="warning-outline" size={14} color="#f59e0b" />
        <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>Düzeltme</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color="#f59e0b" />
      </View>
      {expanded && (
        <View style={{ marginTop: 6, gap: 4 }}>
          <Text style={{ color: '#fbbf24', fontSize: 12 }}>
            <Text style={{ fontWeight: '600' }}>Yazdığın:</Text> {correction.original}
          </Text>
          <Text style={{ color: '#fbbf24', fontSize: 12 }}>
            <Text style={{ fontWeight: '600' }}>Daha iyi:</Text> {correction.suggestion}
          </Text>
          {correction.explanation ? (
            <Text style={{ color: '#6B638F', fontSize: 11 }}>{correction.explanation}</Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RoleplayChat() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ended, setEnded] = useState(false);
  const [feedback, setFeedback] = useState<{
    fluencyScore: number;
    grammarMistakes: string[];
    newVocabulary: string[];
    suggestions: string;
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [wordModal, setWordModal] = useState<{ visible: boolean; word: string; loading: boolean; data: WordExplain | null }>({
    visible: false, word: '', loading: false, data: null,
  });
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['roleplay-session', sessionId],
    queryFn: () => roleplayApi.getSession(sessionId).then((r) => r.data),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (sessionData?.messages) {
      setMessages(sessionData.messages as Message[]);
    }
  }, [sessionData]);

  async function handleWordLongPress(word: string) {
    setWordModal({ visible: true, word, loading: true, data: null });
    try {
      const { data } = await vocabularyApi.explainWordByString(word);
      setWordModal((prev) => ({ ...prev, loading: false, data }));
    } catch {
      setWordModal((prev) => ({ ...prev, loading: false, data: null }));
    }
  }

  async function sendMessageStreaming(text: string) {
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const token = useAuthStore.getState().token;
    let displayBuffer = '';
    let jsonStarted = false;

    try {
      const response = await fetch(`${BASE_URL}/roleplay/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'token' && !jsonStarted) {
              displayBuffer += data.text;
              const jsonIdx = displayBuffer.indexOf('{"correction"');
              if (jsonIdx !== -1) {
                jsonStarted = true;
                displayBuffer = displayBuffer.slice(0, jsonIdx).trimEnd();
              }
              setStreamingText(displayBuffer);
              scrollRef.current?.scrollToEnd({ animated: false });
            } else if (data.type === 'done') {
              setIsStreaming(false);
              setStreamingText('');
              setMessages((prev) => {
                const updated = [...prev];
                if (data.correction) {
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === 'user') {
                      updated[i] = { ...updated[i], correction: data.correction };
                      break;
                    }
                  }
                }
                return [...updated, {
                  role: 'assistant',
                  content: data.displayText,
                  timestamp: new Date().toISOString(),
                }];
              });
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch {
            // ignore individual parse errors
          }
        }
      }
    } catch (err: any) {
      setIsStreaming(false);
      setStreamingText('');
      Alert.alert('Hata', err.message ?? 'Mesaj gönderilemedi');
    }
  }

  const endMutation = useMutation({
    mutationFn: () => roleplayApi.endSession(sessionId).then((r) => r.data),
    onSuccess: (data) => {
      setFeedback(data);
      setEnded(true);
      queryClient.invalidateQueries({ queryKey: ['roleplay-sessions'] });
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.response?.data?.error ?? 'Geri bildirim alınamadı');
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessageStreaming(text);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (ended && feedback) {
    return <FeedbackScreen feedback={feedback} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E4E1F5', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 2 }}>
            <Ionicons name="arrow-back" size={22} color="#6B638F" />
          </TouchableOpacity>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0EEF9', borderWidth: 1, borderColor: '#E4E1F5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ionicons name="person-outline" size={16} color="#6B638F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
              {sessionData?.scene?.titleTr ?? sessionData?.customScene?.slice(0, 30) ?? 'Konuşma Pratiği'}
            </Text>
            <Text style={{ color: '#9B94CC', fontSize: 11 }}>
              {sessionData?.scene ? `${sessionData.scene.category} · Aktif` : 'Özel sahne · Aktif'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              const hintMsg = "Could you give me a hint or suggestion for what I should say next?";
              sendMessageStreaming(hintMsg);
            }}
            disabled={isStreaming}
            style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(115,85,247,0.2)' }}
          >
            <Text style={{ color: '#7355F7', fontSize: 11, fontWeight: '600' }}>İpucu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Oturumu Bitir', 'Oturumu bitirip geri bildirim almak istiyor musun?', [
              { text: 'Devam Et' },
              { text: 'Bitir', style: 'destructive', onPress: () => endMutation.mutate() },
            ])}
            disabled={endMutation.isPending || messages.length < 2}
            style={{ paddingLeft: 4 }}
          >
            {endMutation.isPending
              ? <ActivityIndicator size="small" color="#7355F7" />
              : <Text style={{ color: messages.length >= 2 ? '#7355F7' : '#E4E1F5', fontWeight: '600', fontSize: 13 }}>Bitir</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {sessionLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <ActivityIndicator color="#7355F7" />
            </View>
          ) : (
            messages.map((msg, index) => (
              <View key={index} style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View
                  style={{
                    maxWidth: '80%',
                    backgroundColor: msg.role === 'user' ? 'rgba(115,85,247,0.08)' : '#ffffff',
                    borderWidth: 1,
                    borderColor: msg.role === 'user' ? 'rgba(115,85,247,0.25)' : '#E4E1F5',
                    borderRadius: 16,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                    padding: 12,
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <TappableText text={msg.content} onWordLongPress={handleWordLongPress} />
                  ) : (
                    <Text style={{ color: '#110D24', fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>
                  )}
                </View>
                {msg.role === 'user' && msg.correction && (
                  <View style={{ maxWidth: '80%' }}>
                    <CorrectionBadge correction={msg.correction} />
                  </View>
                )}
              </View>
            ))
          )}
          {isStreaming && streamingText ? (
            <View style={{ alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ maxWidth: '80%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 16, borderBottomLeftRadius: 4, padding: 12 }}>
                <Text style={{ color: '#110D24', fontSize: 15, lineHeight: 22 }}>{streamingText}</Text>
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7355F7', opacity: 0.8 }} />
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7355F7', opacity: 0.5 }} />
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7355F7', opacity: 0.3 }} />
                </View>
              </View>
            </View>
          ) : isStreaming ? (
            <View style={{ alignItems: 'flex-start', paddingLeft: 4, marginBottom: 8 }}>
              <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E4E1F5' }}>
                <ActivityIndicator size="small" color="#7355F7" />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={{ flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#E4E1F5', alignItems: 'flex-end' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor="#9B94CC"
            multiline
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: '#110D24',
              fontSize: 15,
              maxHeight: 120,
            }}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              backgroundColor: input.trim() && !isStreaming ? '#7355F7' : '#F0EEF9',
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={18} color={input.trim() && !isStreaming ? '#fff' : '#9B94CC'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
