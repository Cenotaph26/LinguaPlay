import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Vocabulary() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5">
        <View className="py-5">
          <Text className="text-2xl font-bold text-text1">Kelimelerim</Text>
          <Text className="text-text3 text-sm mt-1">Kelime haznenizi geliştirin</Text>
        </View>

        <View className="flex-row mb-5" style={{ gap: 10 }}>
          {[
            { label: 'Toplam', value: '0', color: '#6366f1' },
            { label: 'Bugün', value: '0', color: '#f59e0b' },
            { label: 'Ustalaşılan', value: '0', color: '#22c55e' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-bg2 border border-border rounded-xl p-3">
              <Text className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-text3 text-xs mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity className="bg-accent rounded-xl py-3 flex-row items-center justify-center mb-5" style={{ gap: 8 }}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text className="text-white font-semibold">Tekrar Başlat (0)</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="items-center justify-center py-16">
            <Ionicons name="book-outline" size={48} color="#3f3f46" />
            <Text className="text-text3 mt-4 text-center">
              Henüz kelime yok{'\n'}Rol yapma veya içerik ekleyerek başlayın
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
