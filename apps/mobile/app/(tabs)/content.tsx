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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SourceType {
  type: string;
  icon: IconName;
  label: string;
  color: string;
  placeholder: string;
  multiline?: boolean;
}

const SOURCE_TYPES: SourceType[] = [
  { type: 'YOUTUBE',  icon: 'logo-youtube',     label: 'YouTube',       color: '#E84E32', placeholder: 'YouTube video URL...' },
  { type: 'SUBTITLE', icon: 'film-outline',      label: 'Altyazı (.srt)', color: '#F59E0B', placeholder: 'Altyazı metnini yapıştır...', multiline: true },
  { type: 'PDF',      icon: 'document-outline',  label: 'PDF',           color: '#7355F7', placeholder: 'PDF metnini yapıştır...', multiline: true },
  { type: 'ARTICLE',  icon: 'globe-outline',     label: 'Makale URL',    color: '#0E9E80', placeholder: 'Makale URL...' },
];

const STATUS_META: Record<string, { label: string; color: string; icon: IconName }> = {
  PENDING:    { label: 'Bekliyor',   color: '#F59E0B', icon: 'time-outline' },
  PROCESSING: { label: 'İşleniyor', color: '#7355F7', icon: 'sync-outline' },
  DONE:       { label: 'Hazır',     color: '#0E9E80', icon: 'checkmark-circle' },
  FAILED:     { label: 'Hata',      color: '#E84E32', icon: 'close-circle' },
};

export default function Content() {
  const [addModal, setAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState('YOUTUBE');
  const [inputText, setInputText] = useState('');
  const [pickedFile, setPickedFile] = useState<{ name: string; base64: string } | null>(null);
  const [pickingFile, setPickingFile] = useState(false);
  const queryClient = useQueryClient();

  const isFilePicker = selectedType === 'PDF' || selectedType === 'SUBTITLE';

  async function handlePickFile() {
    setPickingFile(true);
    try {
      const mimeTypes = selectedType === 'PDF'
        ? ['application/pdf']
        : ['application/x-subrip', 'text/plain', 'application/octet-stream'];
      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPickedFile({ name: asset.name, base64 });
    } catch {
      Alert.alert('Hata', 'Dosya okunamadı');
    } finally {
      setPickingFile(false);
    }
  }

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
        Alert.alert('API Anahtarı Gerekli', 'İçerik analizi için Claude API anahtarı gerekli.', [
          { text: 'Profil', onPress: () => router.push('/(tabs)/profile') },
          { text: 'İptal' },
        ]);
      } else {
        Alert.alert('Hata', err.response?.data?.error ?? 'İçerik eklenemedi');
      }
    },
  });

  function openModal(type: string) {
    setSelectedType(type);
    setInputText('');
    setPickedFile(null);
    setAddModal(true);
  }

  function handleAdd() {
    if (isFilePicker) {
      if (!pickedFile) return;
      addMutation.mutate({
        type: selectedType,
        fileBase64: pickedFile.base64,
        fileName: pickedFile.name,
      } as any);
    } else {
      if (!inputText.trim()) return;
      addMutation.mutate({ type: selectedType, url: inputText.trim() });
    }
  }

  const canSubmit = isFilePicker ? !!pickedFile : !!inputText.trim();

  const currentSource = SOURCE_TYPES.find((s) => s.type === selectedType)!;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#110D24' }}>İçeriklerim</Text>
              <Text style={{ fontSize: 12, color: '#9B94CC', marginTop: 2 }}>Video, makale ve altyazıdan kelime öğren</Text>
            </View>
            <TouchableOpacity
              onPress={() => openModal('YOUTUBE')}
              style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(115,85,247,0.08)', borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={20} color="#7355F7" />
            </TouchableOpacity>
          </View>

          {/* Source chips — single horizontal row */}
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>
            Kaynak Ekle
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SOURCE_TYPES.map((src) => (
                <TouchableOpacity
                  key={src.type}
                  onPress={() => openModal(src.type)}
                  style={{ backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#E4E1F5' }}
                >
                  <Ionicons name={src.icon} size={16} color={src.color} />
                  <Text style={{ color: '#6B638F', fontSize: 12, fontWeight: '500' }}>{src.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Content list */}
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 10 }}>
            Analizlerim
          </Text>

          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator color="#7355F7" />
            </View>
          ) : (items as ContentItem[]).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="play-circle-outline" size={48} color="#E4E1F5" />
              <Text style={{ color: '#9B94CC', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                Henüz içerik eklenmedi{'\n'}Yukarıdan kaynak seçerek başlayın
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {(items as ContentItem[]).map((item) => {
                const src = SOURCE_TYPES.find((s) => s.type === item.type);
                const sm = STATUS_META[item.status] ?? STATUS_META.PENDING;
                const wc = item._count?.words ?? 0;
                const pc = item._count?.phrases ?? 0;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => item.status === 'DONE' && router.push(`/content/${item.id}`)}
                    activeOpacity={item.status === 'DONE' ? 0.7 : 1}
                    style={{ backgroundColor: '#ffffff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E4E1F5', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: 'row', alignItems: 'stretch' }}
                  >
                    {/* Thumbnail — left column, 72px wide */}
                    <View style={{ width: 72, backgroundColor: '#F0EEF9', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                      <Ionicons name={src?.icon ?? 'document-outline'} size={26} color={(src?.color ?? '#9B94CC') + '99'} />
                      {/* Type badge */}
                      <View style={{ position: 'absolute', bottom: 6, left: 4, right: 4, backgroundColor: (src?.color ?? '#9B94CC') + '22', borderRadius: 5, paddingVertical: 2, borderWidth: 1, borderColor: (src?.color ?? '#9B94CC') + '40', alignItems: 'center' }}>
                        <Text style={{ color: src?.color ?? '#9B94CC', fontSize: 9, fontWeight: '700' }}>{src?.label ?? item.type}</Text>
                      </View>
                      {/* Status dot */}
                      <View style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: sm.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                        {item.status === 'PROCESSING'
                          ? <ActivityIndicator size="small" color={sm.color} style={{ transform: [{ scale: 0.55 }] }} />
                          : <Ionicons name={sm.icon} size={11} color={sm.color} />
                        }
                      </View>
                    </View>

                    {/* Info — right column */}
                    <View style={{ flex: 1, padding: 11, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#110D24', lineHeight: 18, marginBottom: 6 }} numberOfLines={2}>{item.title}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {item.status === 'DONE' && wc > 0 ? (
                          <>
                            <View style={{ backgroundColor: '#F0EEF9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <Ionicons name="book-outline" size={10} color="#9B94CC" />
                              <Text style={{ color: '#9B94CC', fontSize: 10 }}>{wc} kelime</Text>
                            </View>
                            {pc > 0 && (
                              <View style={{ backgroundColor: '#F0EEF9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Ionicons name="language-outline" size={10} color="#9B94CC" />
                                <Text style={{ color: '#9B94CC', fontSize: 10 }}>{pc} kalıp</Text>
                              </View>
                            )}
                          </>
                        ) : (
                          <View style={{ backgroundColor: sm.color + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ color: sm.color, fontSize: 10, fontWeight: '600' }}>{sm.label}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add Modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(17,13,36,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#110D24', fontSize: 18, fontWeight: '700', marginBottom: 14 }}>İçerik Ekle</Text>

            {/* Type selector */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
              {SOURCE_TYPES.map((src) => (
                <TouchableOpacity
                  key={src.type}
                  onPress={() => { setSelectedType(src.type); setInputText(''); }}
                  style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', gap: 3, backgroundColor: selectedType === src.type ? src.color + '22' : '#F0EEF9', borderWidth: 1, borderColor: selectedType === src.type ? src.color : '#E4E1F5' }}
                >
                  <Ionicons name={src.icon} size={16} color={selectedType === src.type ? src.color : '#9B94CC'} />
                  <Text style={{ color: selectedType === src.type ? src.color : '#9B94CC', fontSize: 10, fontWeight: '600' }}>{src.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isFilePicker ? (
              <TouchableOpacity
                onPress={handlePickFile}
                disabled={pickingFile}
                style={{ backgroundColor: '#F0EEF9', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: pickedFile ? '#7355F7' : '#E4E1F5', gap: 8 }}
              >
                {pickingFile ? (
                  <ActivityIndicator color="#7355F7" />
                ) : pickedFile ? (
                  <>
                    <Ionicons name="checkmark-circle" size={28} color="#0E9E80" />
                    <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 13, textAlign: 'center' }} numberOfLines={2}>{pickedFile.name}</Text>
                    <Text style={{ color: '#9B94CC', fontSize: 11 }}>Farklı dosya seçmek için tekrar dokun</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name={currentSource.icon} size={28} color="#9B94CC" />
                    <Text style={{ color: '#6B638F', fontWeight: '600', fontSize: 13 }}>
                      {selectedType === 'PDF' ? 'PDF Seç' : '.srt / .vtt Dosyası Seç'}
                    </Text>
                    <Text style={{ color: '#9B94CC', fontSize: 11 }}>Dosya yöneticisinden seç</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={currentSource.placeholder}
                placeholderTextColor="#9B94CC"
                style={{ backgroundColor: '#F0EEF9', borderRadius: 12, padding: 12, color: '#110D24', fontSize: 14, minHeight: 48, marginBottom: 16 }}
              />
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setAddModal(false); setInputText(''); setPickedFile(null); }}
                style={{ flex: 1, backgroundColor: '#F0EEF9', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ color: '#6B638F', fontWeight: '600' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!canSubmit || addMutation.isPending}
                style={{ flex: 1, backgroundColor: canSubmit ? '#7355F7' : '#E4E1F5', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                {addMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: canSubmit ? '#fff' : '#9B94CC', fontWeight: '600' }}>Analiz Et ✨</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
