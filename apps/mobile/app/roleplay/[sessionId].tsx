import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleplayApi } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  correction?: { original: string; suggestion: string; explanation: string } | null;
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

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      roleplayApi.sendMessage(sessionId, content).then((r) => r.data),
    onSuccess: (data) => {
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'user') {
            updated[i] = { ...updated[i], correction: data.correction ?? null };
            break;
          }
        }
        return [
          ...updated,
          { role: 'assistant', content: data.reply, timestamp: new Date().toISOString(), correction: null },
        ];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.response?.data?.error ?? 'Mesaj gönderilemedi');
    },
  });

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
    if (!text || sendMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, timestamp: new Date().toISOString() },
    ]);
    setInput('');
    sendMutation.mutate(text);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (ended && feedback) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
        <View style={{ flex: 1, padding: 24 }}>
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
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {feedback.newVocabulary.map((w, i) => (
                    <View key={i} style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#8B6EFF', fontSize: 13 }}>{w}</Text>
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
        </View>
      </SafeAreaView>
    );
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
          {/* AI avatar */}
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
          {/* Hint button */}
          <TouchableOpacity
            onPress={() => {
              const hintMsg = "Could you give me a hint or suggestion for what I should say next?";
              setMessages((prev) => [...prev, { role: 'user', content: hintMsg, timestamp: new Date().toISOString() }]);
              sendMutation.mutate(hintMsg);
            }}
            disabled={sendMutation.isPending}
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
                  <Text style={{ color: '#110D24', fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>
                </View>
                {msg.role === 'user' && msg.correction && (
                  <View style={{ maxWidth: '80%' }}>
                    <CorrectionBadge correction={msg.correction} />
                  </View>
                )}
              </View>
            ))
          )}
          {sendMutation.isPending && (
            <View style={{ alignItems: 'flex-start', paddingLeft: 4, marginBottom: 8 }}>
              <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E4E1F5' }}>
                <ActivityIndicator size="small" color="#7355F7" />
              </View>
            </View>
          )}
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
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            style={{
              backgroundColor: input.trim() ? '#7355F7' : '#F0EEF9',
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#fff' : '#9B94CC'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
