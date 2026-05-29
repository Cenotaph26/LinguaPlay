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
      style={{ marginTop: 6, backgroundColor: '#f59e0b22', borderRadius: 8, padding: 8 }}
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
            <Text style={{ color: '#a1a1aa', fontSize: 11 }}>{correction.explanation}</Text>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ color: '#fafafa', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>Oturum Bitti</Text>
          <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Geri bildiriminiz hazır</Text>

          <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: '#a1a1aa', fontSize: 14 }}>Akıcılık Puanı</Text>
              <Text style={{ color: '#6366f1', fontSize: 28, fontWeight: 'bold' }}>{feedback.fluencyScore}/10</Text>
            </View>
            {feedback.grammarMistakes.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#fafafa', fontWeight: '600', marginBottom: 8 }}>Dilbilgisi Düzeltmeleri</Text>
                {feedback.grammarMistakes.map((m, i) => (
                  <Text key={i} style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 4 }}>• {m}</Text>
                ))}
              </View>
            )}
            {feedback.newVocabulary.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#fafafa', fontWeight: '600', marginBottom: 8 }}>Yeni Kelimeler</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {feedback.newVocabulary.map((w, i) => (
                    <View key={i} style={{ backgroundColor: '#6366f122', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#818cf8', fontSize: 13 }}>{w}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {feedback.suggestions && (
              <View>
                <Text style={{ color: '#fafafa', fontWeight: '600', marginBottom: 6 }}>Öneri</Text>
                <Text style={{ color: '#a1a1aa', fontSize: 13 }}>{feedback.suggestions}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/roleplay')}
            style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sahne Listesine Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#a1a1aa" />
          </TouchableOpacity>
          <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 16, flex: 1 }}>Konuşma Pratiği</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Oturumu Bitir', 'Oturumu bitirip geri bildirim almak istiyor musun?', [
              { text: 'Devam Et' },
              { text: 'Bitir', style: 'destructive', onPress: () => endMutation.mutate() },
            ])}
            disabled={endMutation.isPending || messages.length < 2}
          >
            {endMutation.isPending
              ? <ActivityIndicator size="small" color="#6366f1" />
              : <Text style={{ color: messages.length >= 2 ? '#6366f1' : '#3f3f46', fontWeight: '600' }}>Bitir</Text>
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
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : (
            messages.map((msg, index) => (
              <View key={index} style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View
                  style={{
                    maxWidth: '80%',
                    backgroundColor: msg.role === 'user' ? 'rgba(99,102,241,0.12)' : '#27272a',
                    borderWidth: 1,
                    borderColor: msg.role === 'user' ? 'rgba(99,102,241,0.30)' : 'rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: '#fafafa', fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>
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
              <View style={{ backgroundColor: '#18181b', borderRadius: 16, padding: 12 }}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={{ flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#27272a', alignItems: 'flex-end' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor="#52525b"
            multiline
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: '#fafafa',
              fontSize: 15,
              maxHeight: 120,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            style={{
              backgroundColor: input.trim() ? '#6366f1' : '#27272a',
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#fff' : '#52525b'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
