import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi, ContentItem } from '../../services/api';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CONTENT_TYPES: Array<{ type: string; icon: IconName; label: string; color: string; placeholder: string }> = [
  { type: 'YOUTUBE', icon: 'logo-youtube', label: 'YouTube', color: '#ef4444', placeholder: 'YouTube video URL...' },
  { type: 'ARTICLE', icon: 'newspaper-outline', label: 'Makale', color: '#22c55e', placeholder: 'Makale URL...' },
  { type: 'SUBTITLE', icon: 'film-outline', label: 'Altyazı', color: '#f59e0b', placeholder: 'Altyazı metnini yapıştır...' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#6366f1',
  DONE: '#22c55e',
  FAILED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  PROCESSING: 'İşleniyor',
  DONE: 'Hazır',
  FAILED: 'Hata',
};

export default function Content() {
  const [addModal, setAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState('YOUTUBE');
  const [inputText, setInputText] = useState('');
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-list'],
    queryFn: () => contentApi.getContent().then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (Array.isArray(data) && data.some((item: ContentItem) => item.status === 'PROCESSING' || item.status === 'PENDING')) {
        return 3000;
      }
      return false;
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { type: string; url?: string; transcript?: string; title?: string }) =>
      contentApi.addContent(data).then((r) => r.data),
    onSuccess: () => {
      setAddModal(false);
      setInputText('');
      queryClient.invalidateQueries({ queryKey: ['content-list'] });
    },
    onError: (err: any) => {
      if (err.response?.status === 402) {
        Alert.alert('API Anahtarı Gerekli', 'Lütfen önce Profil sayfasından Claude API anahtarınızı ekleyin.', [
          { text: 'Profil', onPress: () => router.push('/(tabs)/profile') },
          { text: 'İptal' },
        ]);
      } else {
        Alert.alert('Hata', err.response?.data?.error ?? 'İçerik eklenemedi');
      }
    },
  });

  const handleAdd = () => {
    const ct = CONTENT_TYPES.find((c) => c.type === selectedType)!;
    if (!inputText.trim()) return;
    if (selectedType === 'SUBTITLE') {
      addMutation.mutate({ type: selectedType, transcript: inputText.trim(), title: 'Altyazı' });
    } else {
      addMutation.mutate({ type: selectedType, url: inputText.trim() });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5">
        <View className="py-5 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-text1">İçerik Analizi</Text>
            <Text className="text-text3 text-sm mt-1">Seviyene göre içerik öğren</Text>
          </View>
          <TouchableOpacity
            onPress={() => setAddModal(true)}
            style={{ backgroundColor: '#6366f1', borderRadius: 10, padding: 10 }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : items.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="play-circle-outline" size={48} color="#3f3f46" />
              <Text className="text-text3 mt-4 text-center">
                Henüz içerik eklenmedi{'\n'}YouTube veya makale ekleyerek başlayın
              </Text>
              <TouchableOpacity
                onPress={() => setAddModal(true)}
                style={{ marginTop: 16, backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>İçerik Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10, paddingBottom: 24 }}>
              {items.map((item: ContentItem) => {
                const sc = STATUS_COLORS[item.status] ?? '#71717a';
                const typeData = CONTENT_TYPES.find((c) => c.type === item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => item.status === 'DONE' && router.push(`/content/${item.id}`)}
                    className="bg-bg2 border border-border rounded-xl p-4"
                  >
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <View style={{ backgroundColor: (typeData?.color ?? '#6366f1') + '22', borderRadius: 10, padding: 8 }}>
                        <Ionicons name={typeData?.icon ?? 'document-outline'} size={20} color={typeData?.color ?? '#6366f1'} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-text1 font-medium" numberOfLines={1}>{item.title}</Text>
                        <Text className="text-text3 text-xs mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: sc + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                        <Text style={{ color: sc, fontSize: 11, fontWeight: '600' }}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </Text>
                      </View>
                    </View>
                    {item.status === 'PROCESSING' && (
                      <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
                        <ActivityIndicator size="small" color="#6366f1" />
                        <Text className="text-text3 text-xs">Analiz ediliyor...</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal visible={addModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fafafa', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>İçerik Ekle</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {CONTENT_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.type}
                  onPress={() => { setSelectedType(ct.type); setInputText(''); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: selectedType === ct.type ? ct.color + '33' : '#27272a',
                    borderWidth: 1,
                    borderColor: selectedType === ct.type ? ct.color : '#3f3f46',
                  }}
                >
                  <Ionicons name={ct.icon} size={18} color={selectedType === ct.type ? ct.color : '#71717a'} />
                  <Text style={{ color: selectedType === ct.type ? ct.color : '#71717a', fontSize: 11, fontWeight: '600' }}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={CONTENT_TYPES.find((c) => c.type === selectedType)?.placeholder}
              placeholderTextColor="#52525b"
              multiline={selectedType === 'SUBTITLE'}
              numberOfLines={selectedType === 'SUBTITLE' ? 4 : 1}
              style={{
                backgroundColor: '#27272a',
                borderRadius: 12,
                padding: 12,
                color: '#fafafa',
                fontSize: 14,
                minHeight: selectedType === 'SUBTITLE' ? 100 : 48,
                marginBottom: 16,
                textAlignVertical: selectedType === 'SUBTITLE' ? 'top' : 'center',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setAddModal(false); setInputText(''); }}
                style={{ flex: 1, backgroundColor: '#27272a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ color: '#a1a1aa', fontWeight: '600' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!inputText.trim() || addMutation.isPending}
                style={{ flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                {addMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Analiz Et</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
