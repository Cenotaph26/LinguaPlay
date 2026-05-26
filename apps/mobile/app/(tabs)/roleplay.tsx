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

const CATEGORY_ICONS: Record<string, IconName> = {
  daily: 'cafe-outline',
  work: 'briefcase-outline',
  travel: 'airplane-outline',
  emergency: 'medical-outline',
  social: 'people-outline',
  shopping: 'bag-outline',
};

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#22c55e',
  B1: '#6366f1', B2: '#6366f1',
  C1: '#f59e0b', C2: '#f59e0b',
};

export default function Roleplay() {
  const { user } = useAuthStore();
  const [customModal, setCustomModal] = useState(false);
  const [customScene, setCustomScene] = useState('');

  const levelUnset = !user?.level || user.level === 'UNSET';

  const { data: scenes = [], isLoading } = useQuery({
    queryKey: ['roleplay-scenes'],
    queryFn: () => roleplayApi.getScenes().then((r) => r.data),
  });

  const startMutation = useMutation({
    mutationFn: (data: { sceneId?: string; customScene?: string }) =>
      roleplayApi.startSession(data).then((r) => r.data),
    onSuccess: (data) => {
      setCustomModal(false);
      router.push(`/roleplay/${data.session.id}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'Oturum başlatılamadı';
      if (err.response?.status === 402) {
        Alert.alert('API Anahtarı Gerekli', 'Lütfen önce Profil sayfasından Claude API anahtarınızı ekleyin.', [
          { text: 'Profil', onPress: () => router.push('/(tabs)/profile') },
          { text: 'İptal' },
        ]);
      } else {
        Alert.alert('Hata', msg);
      }
    },
  });

  const handleStartCustom = () => {
    if (!customScene.trim()) return;
    startMutation.mutate({ customScene: customScene.trim() });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Konuşma Pratiği</Text>
          <Text className="text-text3 text-sm mt-1">Gerçek senaryolarla pratik yap</Text>
        </View>

        {levelUnset && (
          <TouchableOpacity
            onPress={() => router.push('/placement')}
            style={{ backgroundColor: '#f59e0b22', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Ionicons name="school-outline" size={20} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f59e0b', fontWeight: '600', fontSize: 14 }}>Seviye Belirlenmedi</Text>
              <Text style={{ color: '#d97706', fontSize: 12, marginTop: 2 }}>Rol yapma için önce seviye testini tamamla →</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            if (levelUnset) {
              Alert.alert('Seviye Gerekli', 'Konuşma pratiği için önce seviye testini tamamlamalısın.', [
                { text: 'Teste Git', onPress: () => router.push('/placement') },
                { text: 'İptal' },
              ]);
              return;
            }
            setCustomModal(true);
          }}
          className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center mb-5"
          style={{ gap: 12 }}
        >
          <View style={{ backgroundColor: '#6366f122', borderRadius: 10, padding: 8 }}>
            <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-text1 font-semibold">Özel Senaryo</Text>
            <Text className="text-text3 text-sm">Kendi senaryonu tanımla</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#71717a" />
        </TouchableOpacity>

        <Text className="text-text2 text-sm font-medium mb-3">Hazır Sahneler</Text>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#6366f1" />
          </View>
        ) : (
          <View style={{ gap: 10, paddingBottom: 24 }}>
            {scenes.map((scene: RolePlayScene) => {
              const lc = LEVEL_COLORS[scene.difficulty] ?? '#71717a';
              const icon = CATEGORY_ICONS[scene.category] ?? 'chatbubble-outline';
              return (
                <View
                  key={scene.id}
                  className="bg-bg2 border border-border rounded-2xl p-4"
                >
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View className="bg-bg3 rounded-xl p-2">
                      <Ionicons name={icon} size={22} color="#a1a1aa" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-text1 font-medium">{scene.titleTr}</Text>
                      <Text className="text-text3 text-sm">{scene.titleEn}</Text>
                    </View>
                    <View style={{
                      backgroundColor: lc + '22',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 20,
                    }}>
                      <Text style={{ color: lc, fontSize: 11, fontWeight: '600' }}>{scene.difficulty}</Text>
                    </View>
                  </View>
                  <Text className="text-text3 text-sm mt-2 mb-3">{scene.descriptionTr}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (levelUnset) {
                        Alert.alert('Seviye Gerekli', 'Konuşma pratiği için önce seviye testini tamamlamalısın.', [
                          { text: 'Teste Git', onPress: () => router.push('/placement') },
                          { text: 'İptal' },
                        ]);
                        return;
                      }
                      startMutation.mutate({ sceneId: scene.id });
                    }}
                    disabled={startMutation.isPending}
                    style={{
                      backgroundColor: '#6366f1',
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    {startMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Başla</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={customModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fafafa', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Özel Senaryo</Text>
            <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 16 }}>
              Senaryonu Türkçe veya İngilizce anlat
            </Text>
            <TextInput
              value={customScene}
              onChangeText={setCustomScene}
              placeholder="Örnek: Bir iş toplantısında proje sunumu yapıyorum..."
              placeholderTextColor="#52525b"
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: '#27272a',
                borderRadius: 12,
                padding: 12,
                color: '#fafafa',
                fontSize: 14,
                minHeight: 100,
                marginBottom: 16,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCustomModal(false)}
                style={{ flex: 1, backgroundColor: '#27272a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ color: '#a1a1aa', fontWeight: '600' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartCustom}
                disabled={!customScene.trim() || startMutation.isPending}
                style={{ flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                {startMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Başla</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
