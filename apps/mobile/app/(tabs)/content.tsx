import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CONTENT_TYPES: Array<{ type: string; icon: IconName; label: string; color: string }> = [
  { type: 'YOUTUBE', icon: 'logo-youtube', label: 'YouTube', color: '#ef4444' },
  { type: 'PDF', icon: 'document-text-outline', label: 'PDF', color: '#6366f1' },
  { type: 'SUBTITLE', icon: 'film-outline', label: 'Altyazı', color: '#f59e0b' },
  { type: 'ARTICLE', icon: 'newspaper-outline', label: 'Makale', color: '#22c55e' },
];

export default function Content() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5">
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">İçerik Analizi</Text>
          <Text className="text-text3 text-sm mt-1">Seviyene göre içerik öğren</Text>
        </View>

        <View className="flex-row mb-5" style={{ gap: 8 }}>
          {CONTENT_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.type}
              className="flex-1 bg-bg2 border border-border rounded-xl py-3 items-center"
              style={{ gap: 4 }}
            >
              <Ionicons name={ct.icon} size={20} color={ct.color} />
              <Text className="text-text3 text-xs">{ct.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="items-center justify-center py-16">
            <Ionicons name="play-circle-outline" size={48} color="#3f3f46" />
            <Text className="text-text3 mt-4 text-center">
              Henüz içerik eklenmedi{'\n'}YouTube, PDF veya makale ekleyerek başlayın
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
