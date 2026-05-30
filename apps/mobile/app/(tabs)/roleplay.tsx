import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { roleplayApi, RolePlayScene } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON: Record<string, { icon: IconName; color: string }> = {
  daily:     { icon: 'cafe-outline',      color: '#F59E0B' },
  work:      { icon: 'briefcase-outline', color: '#7355F7' },
  travel:    { icon: 'airplane-outline',  color: '#0E9E80' },
  emergency: { icon: 'medical-outline',   color: '#E84E32' },
  social:    { icon: 'people-outline',    color: '#7355F7' },
  shopping:  { icon: 'bag-outline',       color: '#0E9E80' },
};

const CATEGORY_FILTERS: Array<{ id: string; label: string; icon: IconName }> = [
  { id: 'all',       label: 'Tümü',      icon: 'globe-outline' },
  { id: 'travel',    label: 'Seyahat',   icon: 'airplane-outline' },
  { id: 'work',      label: 'İş',        icon: 'briefcase-outline' },
  { id: 'social',    label: 'Sosyal',    icon: 'people-outline' },
  { id: 'emergency', label: 'Sağlık',    icon: 'medical-outline' },
  { id: 'daily',     label: 'Günlük',    icon: 'cafe-outline' },
  { id: 'shopping',  label: 'Alışveriş', icon: 'bag-outline' },
];

const LEVEL_COLORS: Record<string, string> = {
  A1: '#0E9E80', A2: '#0E9E80',
  B1: '#7355F7', B2: '#7355F7',
  C1: '#F59E0B', C2: '#F59E0B',
};

export default function Roleplay() {
  const { user } = useAuthStore();
  const [customModal, setCustomModal] = useState(false);
  const [customScene, setCustomScene] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sceneModal, setSceneModal] = useState<RolePlayScene | null>(null);

  const hasApiKey = user?.hasApiKey ?? false;

  const { data: scenes = [], isLoading } = useQuery({
    queryKey: ['roleplay-scenes'],
    queryFn: () => roleplayApi.getScenes().then((r) => r.data),
  });

  const filteredScenes = selectedCategory === 'all'
    ? scenes
    : (scenes as RolePlayScene[]).filter((s) => s.category === selectedCategory);

  const startMutation = useMutation({
    mutationFn: (data: { sceneId?: string; customScene?: string }) =>
      roleplayApi.startSession(data).then((r) => r.data),
    onSuccess: (data) => {
      setCustomModal(false);
      setSceneModal(null);
      router.push(`/roleplay/${data.session.id}`);
    },
    onError: (err: any) => {
      if (err.response?.status === 402) {
        Alert.alert('API Anahtarı Gerekli', 'Lütfen önce Profil sayfasından API anahtarınızı ekleyin.', [
          { text: 'Profil', onPress: () => router.push('/(tabs)/profile') },
          { text: 'İptal' },
        ]);
      } else {
        Alert.alert('Hata', err.response?.data?.error ?? 'Oturum başlatılamadı');
      }
    },
  });

  function handleScenePress(scene: RolePlayScene) {
    setSceneModal(scene);
  }

  function handleStartAI() {
    if (!sceneModal) return;
    if (!user?.level || user.level === 'UNSET') {
      Alert.alert('Seviye Gerekli', 'AI konuşma pratiği için önce seviye testini tamamlamalısın.', [
        { text: 'Teste Git', onPress: () => { setSceneModal(null); router.push('/placement'); } },
        { text: 'İptal' },
      ]);
      return;
    }
    startMutation.mutate({ sceneId: sceneModal.id });
  }

  function handleReadStatic() {
    if (!sceneModal) return;
    setSceneModal(null);
    router.push(`/roleplay/static/${sceneModal.id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 20, paddingBottom: 14 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#110D24' }}>Sahne Seç</Text>
            <Text style={{ fontSize: 12, color: '#9B94CC', marginTop: 2 }}>Gerçek hayat senaryolarını pratik yap</Text>
          </View>

          {/* Custom scene */}
          <TouchableOpacity
            onPress={() => setCustomModal(true)}
            style={{ marginBottom: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(115,85,247,0.08)', borderWidth: 1, borderColor: 'rgba(115,85,247,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles-outline" size={18} color="#8B6EFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#110D24', fontWeight: '500', fontSize: 13 }}>Kendi sahneni yaz</Text>
              <Text style={{ color: '#9B94CC', fontSize: 11, marginTop: 2 }}>AI senaryona göre canlandırır ✨</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#9B94CC" />
          </TouchableOpacity>

          {/* Category filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CATEGORY_FILTERS.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, backgroundColor: active ? 'rgba(115,85,247,0.08)' : '#ffffff', borderColor: active ? 'rgba(115,85,247,0.25)' : '#E4E1F5' }}
                  >
                    <Ionicons name={cat.icon} size={14} color={active ? '#8B6EFF' : '#6B638F'} />
                    <Text style={{ color: active ? '#8B6EFF' : '#6B638F', fontSize: 12, fontWeight: '500' }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: '#9B94CC', marginBottom: 8 }}>
            Hazır Sahneler
          </Text>

          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator color="#7355F7" />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(filteredScenes as RolePlayScene[]).map((scene) => {
                const lc = LEVEL_COLORS[scene.difficulty] ?? '#9B94CC';
                const catIcon = CATEGORY_ICON[scene.category] ?? { icon: 'chatbubble-outline' as IconName, color: '#7355F7' };
                return (
                  <TouchableOpacity
                    key={scene.id}
                    onPress={() => handleScenePress(scene)}
                    style={{ width: '48.5%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E4E1F5', borderRadius: 14, padding: 14, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: catIcon.color + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Ionicons name={catIcon.icon} size={18} color={catIcon.color} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#110D24', lineHeight: 18, marginBottom: 8, flex: 1 }}>{scene.titleTr}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ backgroundColor: lc + '1a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: lc + '40' }}>
                        <Text style={{ color: lc, fontSize: 10, fontWeight: '600' }}>{scene.difficulty}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <View style={{ backgroundColor: '#F0EEF9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
                          <Text style={{ color: '#6B638F', fontSize: 10, fontWeight: '600' }}>Oku</Text>
                        </View>
                        {hasApiKey && (
                          <View style={{ backgroundColor: 'rgba(115,85,247,0.10)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
                            <Text style={{ color: '#7355F7', fontSize: 10, fontWeight: '600' }}>AI ✨</Text>
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

      {/* Scene Mode Modal */}
      <Modal visible={!!sceneModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(17,13,36,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            {sceneModal && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {(() => { const ci = CATEGORY_ICON[sceneModal.category] ?? { icon: 'chatbubble-outline' as IconName, color: '#7355F7' }; return (
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: ci.color + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ionicons name={ci.icon} size={22} color={ci.color} />
                    </View>
                  ); })()}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#110D24', fontSize: 17, fontWeight: '700' }}>{sceneModal.titleTr}</Text>
                    <Text style={{ color: '#9B94CC', fontSize: 12, marginTop: 2 }}>{sceneModal.descriptionTr}</Text>
                  </View>
                </View>

                <Text style={{ color: '#6B638F', fontSize: 13, marginBottom: 16 }}>Nasıl pratik yapmak istersin?</Text>

                <TouchableOpacity
                  onPress={handleReadStatic}
                  style={{ backgroundColor: '#F0EEF9', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ backgroundColor: '#E4E1F5', borderRadius: 10, padding: 8 }}>
                    <Ionicons name="book-outline" size={20} color="#6B638F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 15 }}>Diyalog Oku</Text>
                    <Text style={{ color: '#9B94CC', fontSize: 12, marginTop: 1 }}>Hazır diyalogu oku, kelime öğren</Text>
                  </View>
                  <View style={{ backgroundColor: '#E4E1F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#6B638F', fontSize: 10, fontWeight: '600' }}>ÜCRETSİZ</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartAI}
                  disabled={startMutation.isPending}
                  style={{ backgroundColor: hasApiKey ? '#7355F7' : '#F0EEF9', borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ backgroundColor: hasApiKey ? 'rgba(255,255,255,0.2)' : '#E4E1F5', borderRadius: 10, padding: 8 }}>
                    {startMutation.isPending
                      ? <ActivityIndicator size="small" color={hasApiKey ? '#fff' : '#6B638F'} />
                      : <Ionicons name="chatbubbles-outline" size={20} color={hasApiKey ? '#fff' : '#6B638F'} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: hasApiKey ? '#fff' : '#110D24', fontWeight: '600', fontSize: 15 }}>AI ile Konuş</Text>
                    <Text style={{ color: hasApiKey ? 'rgba(255,255,255,0.75)' : '#9B94CC', fontSize: 12, marginTop: 1 }}>
                      {hasApiKey ? 'Canlı AI ile pratik yap' : 'API key gerekli'}
                    </Text>
                  </View>
                  {!hasApiKey && (
                    <View style={{ backgroundColor: 'rgba(115,85,247,0.10)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#7355F7', fontSize: 10, fontWeight: '600' }}>✨ KEY</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSceneModal(null)}
                  style={{ alignItems: 'center', paddingVertical: 8 }}
                >
                  <Text style={{ color: '#9B94CC', fontWeight: '500' }}>İptal</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Scene Modal */}
      <Modal visible={customModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(17,13,36,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#110D24', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Özel Senaryo</Text>
            <Text style={{ color: '#9B94CC', fontSize: 14, marginBottom: 16 }}>Senaryonu Türkçe veya İngilizce anlat</Text>
            <TextInput
              value={customScene}
              onChangeText={setCustomScene}
              placeholder="Örnek: Bir iş toplantısında proje sunumu yapıyorum..."
              placeholderTextColor="#9B94CC"
              multiline
              numberOfLines={4}
              style={{ backgroundColor: '#F0EEF9', borderRadius: 12, padding: 12, color: '#110D24', fontSize: 14, minHeight: 100, marginBottom: 16, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCustomModal(false)}
                style={{ flex: 1, backgroundColor: '#F0EEF9', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ color: '#6B638F', fontWeight: '600' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { if (customScene.trim()) startMutation.mutate({ customScene: customScene.trim() }); }}
                disabled={!customScene.trim() || startMutation.isPending}
                style={{ flex: 1, backgroundColor: '#7355F7', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                {startMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Başla ✨</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
