import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const features_free: Array<{ icon: IconName; color: string; bg: string; title: string; sub: string }> = [
  { icon: 'book-outline',          color: '#7355F7', bg: 'rgba(115,85,247,0.08)', title: '3.000+ Kelime',       sub: "A1'den C2'ye, 20 tema" },
  { icon: 'people-outline',        color: '#0E9E80', bg: 'rgba(14,158,128,0.08)', title: '50+ Hazır Sahne',     sub: 'Diyalog, kelimeler, ipuçları' },
  { icon: 'document-text-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', title: '200+ Okuma Metni',    sub: 'Tıklanabilir kelimeler, quiz' },
];

const features_ai = ['✨ Canlı role-play', '✨ İçerik analizi', '✨ AI quiz', '✨ Kelime açıklama'];

export default function Onboarding() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#7355F7', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
            <Ionicons name="language-outline" size={34} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#110D24' }}>LinguaPlay</Text>
          <Text style={{ fontSize: 13, color: '#9B94CC', marginTop: 2 }}>İngilizce öğrenmenin en eğlenceli yolu</Text>
        </View>

        {/* Hero Card */}
        <View style={{ backgroundColor: '#7355F7', borderRadius: 20, padding: 22, marginBottom: 16, position: 'relative', overflow: 'hidden', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 28, elevation: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Hoş Geldin</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 34, marginBottom: 8 }}>Her şey{'\n'}ücretsiz.</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 20, marginBottom: 16 }}>
            Temel özellikler API key olmadan tam çalışır. İstersen eklersen AI güçlü özellikler de senin.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 3, height: 5, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 100 }} />
            <View style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 100 }} />
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600' }}>+AI</Text>
          </View>
          <Text style={{ position: 'absolute', right: -10, bottom: -8, fontSize: 80, fontWeight: '800', color: 'rgba(255,255,255,0.06)', lineHeight: 88 }}>✓</Text>
        </View>

        {/* Free Features */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#110D24' }}>Hep ücretsiz</Text>
            <View style={{ backgroundColor: 'rgba(14,158,128,0.10)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(14,158,128,0.25)' }}>
              <Text style={{ color: '#0E9E80', fontSize: 10, fontWeight: '700' }}>ÜCRETSİZ</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E4E1F5', overflow: 'hidden', shadowColor: '#7355F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            {features_free.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: i < features_free.length - 1 ? 1 : 0, borderBottomColor: '#F0EEF9' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#110D24', fontWeight: '600', fontSize: 14 }}>{f.title}</Text>
                  <Text style={{ color: '#9B94CC', fontSize: 12, marginTop: 1 }}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#0E9E80" />
              </View>
            ))}
          </View>
        </View>

        {/* AI Features */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#110D24', marginBottom: 10 }}>✨ API key ile açılır</Text>
          <View style={{ backgroundColor: '#7355F7', borderRadius: 16, padding: 16, shadowColor: '#7355F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {features_ai.map((f, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{f}</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 12, lineHeight: 18 }}>
              Kendi Claude API key'ini ekle — tamamen ücretsiz planla başlayabilirsin.
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          onPress={() => {
            router.push('/(tabs)/profile');
            router.replace('/(tabs)/index' as any);
          }}
          style={{ backgroundColor: '#0E9E80', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: '#0E9E80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}
        >
          <Ionicons name="key-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>API Key Ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/index' as any)}
          style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F0EEF9' }}
        >
          <Text style={{ color: '#6B638F', fontWeight: '600', fontSize: 14 }}>Şimdi Değil, Devam Et</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
