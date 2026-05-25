import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#22c55e',
  B1: '#6366f1', B2: '#6366f1',
  C1: '#f59e0b', C2: '#f59e0b',
};

const SCENES: Array<{ id: string; titleTr: string; titleEn: string; category: string; level: string; icon: IconName }> = [
  { id: '1', titleTr: 'Kahvede Sipariş', titleEn: 'Ordering Coffee', category: 'Günlük', level: 'A2', icon: 'cafe-outline' },
  { id: '2', titleTr: 'İş Görüşmesi', titleEn: 'Job Interview', category: 'İş', level: 'B2', icon: 'briefcase-outline' },
  { id: '3', titleTr: 'Havalimanı Check-in', titleEn: 'Airport Check-in', category: 'Seyahat', level: 'B1', icon: 'airplane-outline' },
  { id: '4', titleTr: 'Doktor Ziyareti', titleEn: 'Doctor Visit', category: 'Acil', level: 'B1', icon: 'medical-outline' },
  { id: '5', titleTr: 'Restoran Siparişi', titleEn: 'Restaurant Order', category: 'Günlük', level: 'A2', icon: 'restaurant-outline' },
  { id: '6', titleTr: 'Alışveriş Merkezi', titleEn: 'Shopping Mall', category: 'Alışveriş', level: 'A2', icon: 'bag-outline' },
];

export default function Roleplay() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5">
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Konuşma Pratiği</Text>
          <Text className="text-text3 text-sm mt-1">Gerçek senaryolarla pratik yap</Text>
        </View>

        <TouchableOpacity
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
        <View style={{ gap: 10, paddingBottom: 24 }}>
          {SCENES.map((scene) => {
            const lc = LEVEL_COLORS[scene.level] ?? '#71717a';
            return (
              <TouchableOpacity
                key={scene.id}
                className="bg-bg2 border border-border rounded-2xl p-4 flex-row items-center"
                style={{ gap: 12 }}
              >
                <View className="bg-bg3 rounded-xl p-2">
                  <Ionicons name={scene.icon} size={22} color="#a1a1aa" />
                </View>
                <View className="flex-1">
                  <Text className="text-text1 font-medium">{scene.titleTr}</Text>
                  <Text className="text-text3 text-sm">{scene.titleEn}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={{ backgroundColor: lc + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                    <Text style={{ color: lc, fontSize: 11, fontWeight: '600' }}>{scene.level}</Text>
                  </View>
                  <Text className="text-text3 text-xs">{scene.category}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
