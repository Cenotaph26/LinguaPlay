import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { roleplayApi, RolePlayScene } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

interface DialogueLine {
  role: 'user' | 'ai';
  text: string;
  tr: string;
}

interface StaticDialogue {
  aiName: string;
  dialogue: DialogueLine[];
  keyPhrases: Array<{ phrase: string; tr: string }>;
  tips: string[];
}

const STATIC_DIALOGUES: Record<string, StaticDialogue> = {
  'Ordering Coffee': {
    aiName: 'Alex (Barista)',
    dialogue: [
      { role: 'ai', text: 'Hi! Welcome to Brew & Co. What can I get for you today?', tr: 'Merhaba! Brew & Co\'ya hoş geldiniz. Bugün size ne getirebilirim?' },
      { role: 'user', text: 'Hi! I\'d like a medium latte, please.', tr: 'Merhaba! Orta boy bir latte almak istiyorum, lütfen.' },
      { role: 'ai', text: 'Sure! Would you like that with regular milk, oat milk, or almond milk?', tr: 'Tabii! Normal süt, yulaf sütü veya badem sütü ister misiniz?' },
      { role: 'user', text: 'Oat milk, please. Can I also get a slice of chocolate cake?', tr: 'Yulaf sütü, lütfen. Bir dilim de çikolatalı kek alabilir miyim?' },
      { role: 'ai', text: 'Of course! For here or to go?', tr: 'Tabii ki! Burada mı içeceksiniz, yoksa götürecek misiniz?' },
      { role: 'user', text: 'To go, please. How much is that?', tr: 'Götürüyorum, lütfen. Ne kadar tutar?' },
      { role: 'ai', text: 'That\'ll be £6.50. Would you like to pay by card or cash?', tr: '6.50 £ tutar. Kartla mı yoksa nakitle mi ödemek istersiniz?' },
      { role: 'user', text: 'By card, please.', tr: 'Kartla, lütfen.' },
      { role: 'ai', text: 'Perfect! Your name for the order?', tr: 'Harika! Siparişiniz için isminiz?' },
      { role: 'user', text: 'It\'s Alex. Thank you!', tr: 'Alex. Teşekkürler!' },
    ],
    keyPhrases: [
      { phrase: "I'd like a ..., please", tr: 'Bir ... almak istiyorum, lütfen' },
      { phrase: 'For here or to go?', tr: 'Burada mı yoksa götürecek misiniz?' },
      { phrase: "That'll be £...", tr: '... tutacak / ... eder' },
      { phrase: 'Would you like to pay by card or cash?', tr: 'Kartla mı nakitle mi ödersiniz?' },
    ],
    tips: [
      'Use "I\'d like" instead of "I want" — it\'s more polite.',
      '"Can I also get...?" is a natural way to add items to your order.',
    ],
  },
  'Job Interview': {
    aiName: 'Sarah (HR Manager)',
    dialogue: [
      { role: 'ai', text: 'Good morning! Please have a seat. I\'m Sarah, the HR manager. Thank you for coming in today.', tr: 'Günaydın! Lütfen oturun. Ben Sarah, İK müdürüyüm. Bugün geldiğiniz için teşekkürler.' },
      { role: 'user', text: 'Good morning, Sarah. It\'s great to be here. Thank you for the opportunity.', tr: 'Günaydın Sarah. Burada olmak harika. Fırsat için teşekkürler.' },
      { role: 'ai', text: 'Of course! So, could you start by telling me a little about yourself?', tr: 'Tabii ki! Peki, biraz kendinizden bahsederek başlayabilir misiniz?' },
      { role: 'user', text: 'Sure. I have five years of experience in digital marketing, specialising in social media campaigns and content strategy.', tr: 'Tabii. Dijital pazarlamada beş yıllık deneyimim var; özellikle sosyal medya kampanyaları ve içerik stratejisi konusunda uzmanlaştım.' },
      { role: 'ai', text: 'Impressive. Why are you interested in joining our company specifically?', tr: 'Etkileyici. Neden özellikle bizim şirketimize katılmak istiyorsunuz?' },
      { role: 'user', text: 'I admire your company\'s commitment to innovation. I believe my skills align well with your growth goals.', tr: 'Şirketinizin inovasyona olan bağlılığına hayranım. Becerilerimin büyüme hedeflerinizle iyi örtüştüğüne inanıyorum.' },
      { role: 'ai', text: 'What would you say is your greatest strength?', tr: 'En büyük güçlü yönünüzün ne olduğunu söyler misiniz?' },
      { role: 'user', text: 'I\'d say my ability to analyse data and translate it into clear action plans. I\'m also a strong team player.', tr: 'Verileri analiz etme ve bunları net eylem planlarına dönüştürme yeteneğimi söyleyebilirim. Aynı zamanda iyi bir ekip oyuncusuyum.' },
    ],
    keyPhrases: [
      { phrase: 'Thank you for the opportunity', tr: 'Fırsat için teşekkürler' },
      { phrase: 'I have X years of experience in...', tr: '... alanında X yıl deneyimim var' },
      { phrase: 'I specialize in...', tr: '... konusunda uzmanlaştım' },
      { phrase: 'My skills align with...', tr: 'Becerilerim ... ile örtüşüyor' },
    ],
    tips: [
      'Start your answers with "I\'d say..." or "I believe..." to sound confident.',
      'Use the present perfect: "I have worked..." to talk about ongoing experience.',
    ],
  },
  'Airport Check-in': {
    aiName: 'Tom (Check-in Agent)',
    dialogue: [
      { role: 'ai', text: 'Good morning! Can I see your passport and booking confirmation, please?', tr: 'Günaydın! Pasaportunuzu ve rezervasyon onayınızı görebilir miyim, lütfen?' },
      { role: 'user', text: 'Sure, here you go. I\'m flying to London.', tr: 'Tabii, buyurun. Londra\'ya uçuyorum.' },
      { role: 'ai', text: 'Thank you. How many bags are you checking in today?', tr: 'Teşekkürler. Bugün kaç bagaj teslim edeceksiniz?' },
      { role: 'user', text: 'Just one suitcase. It weighs about 22 kilos.', tr: 'Sadece bir valiz. Yaklaşık 22 kilo ağırlığında.' },
      { role: 'ai', text: 'That\'s within the allowance. Did you pack the bag yourself?', tr: 'Bu izin verilen ağırlık sınırı içinde. Bavulu kendiniz mi hazırladınız?' },
      { role: 'user', text: 'Yes, I packed it myself and it\'s been with me the whole time.', tr: 'Evet, kendim hazırladım ve her zaman yanımdaydı.' },
      { role: 'ai', text: 'Do you have any preference for your seat — window or aisle?', tr: 'Koltuğunuz için bir tercihiniz var mı — pencere kenarı mı koridor mu?' },
      { role: 'user', text: 'Window seat, please, if possible.', tr: 'Mümkünse pencere kenarı, lütfen.' },
      { role: 'ai', text: 'I\'ve assigned you seat 14A. Your gate is B12, boarding starts at 9:30. Have a great flight!', tr: '14A koltuğunu atadım. Kapınız B12, biniş saat 9:30\'da başlıyor. İyi uçuşlar!' },
    ],
    keyPhrases: [
      { phrase: 'I\'m flying to...', tr: '...\'ya uçuyorum' },
      { phrase: 'How many bags are you checking in?', tr: 'Kaç bagaj teslim edeceksiniz?' },
      { phrase: 'Window or aisle?', tr: 'Pencere kenarı mı koridor mu?' },
      { phrase: 'Boarding starts at...', tr: 'Biniş ... de başlıyor' },
    ],
    tips: [
      'Always say "I packed it myself" — this is a standard security question.',
      '"If possible" softens requests and sounds more natural.',
    ],
  },
  'Doctor Visit': {
    aiName: 'Dr. James',
    dialogue: [
      { role: 'ai', text: 'Good afternoon. What brings you in today?', tr: 'İyi günler. Bugün sizi buraya ne getirdi?' },
      { role: 'user', text: 'I\'ve had a headache for three days and I feel very tired.', tr: 'Üç gündür baş ağrım var ve çok yorgun hissediyorum.' },
      { role: 'ai', text: 'I see. Is the headache constant or does it come and go?', tr: 'Anlıyorum. Baş ağrısı sürekli mi yoksa gelip gidiyor mu?' },
      { role: 'user', text: 'It comes and goes. It\'s worse in the morning.', tr: 'Gelip gidiyor. Sabahları daha kötü.' },
      { role: 'ai', text: 'Do you have any other symptoms — fever, sore throat, or nausea?', tr: 'Başka belirtileriniz var mı — ateş, boğaz ağrısı ya da bulantı?' },
      { role: 'user', text: 'I had a slight fever yesterday, but it went away. No sore throat.', tr: 'Dün hafif ateşim vardı ama geçti. Boğaz ağrısı yok.' },
      { role: 'ai', text: 'How is your sleep? Are you getting enough rest?', tr: 'Uykunuz nasıl? Yeterince dinleniyor musunuz?' },
      { role: 'user', text: 'Not really. I\'ve been sleeping about 5 hours a night because of work.', tr: 'Pek sayılmaz. İş yüzünden geceleri yaklaşık 5 saat uyuyorum.' },
      { role: 'ai', text: 'That could be the cause. I recommend more rest and plenty of fluids. I\'ll also prescribe a mild painkiller for the headaches.', tr: 'Bu neden olabilir. Daha fazla dinlenmenizi ve bol sıvı tüketmenizi öneririm. Baş ağrıları için hafif bir ağrı kesici de yazacağım.' },
    ],
    keyPhrases: [
      { phrase: 'I\'ve had a ... for X days', tr: 'X gündür ... var' },
      { phrase: 'It comes and goes', tr: 'Gelip gidiyor' },
      { phrase: 'I have a slight/high fever', tr: 'Hafif/yüksek ateşim var' },
      { phrase: 'I recommend...', tr: '... öneririm' },
    ],
    tips: [
      'Use "I\'ve had" (present perfect) for symptoms that started in the past and continue now.',
      '"Slight" means a little/mild — useful for describing intensity of symptoms.',
    ],
  },
  'Shopping Return': {
    aiName: 'Emma (Customer Service)',
    dialogue: [
      { role: 'ai', text: 'Hi there! How can I help you today?', tr: 'Merhaba! Bugün size nasıl yardımcı olabilirim?' },
      { role: 'user', text: 'Hi. I bought this jacket last week and the zip is broken. I\'d like to return it.', tr: 'Merhaba. Geçen hafta bu ceketi satın aldım ve fermuarı kırık. Geri iade etmek istiyorum.' },
      { role: 'ai', text: 'I\'m sorry to hear that. Do you have your receipt?', tr: 'Bunu duyduğuma üzüldüm. Fişiniz var mı?' },
      { role: 'user', text: 'Yes, here it is. I also have the original tags on it.', tr: 'Evet, buyurun. Üzerinde orijinal etiketler de var.' },
      { role: 'ai', text: 'Thank you. Our policy allows returns within 30 days for faulty items. Would you prefer a refund or an exchange?', tr: 'Teşekkürler. Politikamız, hatalı ürünler için 30 gün içinde iade yapılmasına izin veriyor. Geri ödeme mi yoksa değişim mi tercih edersiniz?' },
      { role: 'user', text: 'I\'d prefer a refund if that\'s possible.', tr: 'Mümkünse geri ödeme tercih ederim.' },
      { role: 'ai', text: 'Absolutely. How did you pay — card or cash?', tr: 'Kesinlikle. Nasıl ödeme yaptınız — kartla mı yoksa nakitle mi?' },
      { role: 'user', text: 'By card. Here it is.', tr: 'Kartla. Buyurun.' },
      { role: 'ai', text: 'The refund should appear in your account within 3–5 business days. Is there anything else I can help you with?', tr: 'Geri ödeme hesabınıza 3-5 iş günü içinde yansımalı. Başka yardımcı olabileceğim bir şey var mı?' },
    ],
    keyPhrases: [
      { phrase: 'I\'d like to return this', tr: 'Bunu iade etmek istiyorum' },
      { phrase: 'The ... is broken/faulty', tr: '... kırık/arızalı' },
      { phrase: 'Would you prefer a refund or exchange?', tr: 'Geri ödeme mi değişim mi tercih edersiniz?' },
      { phrase: 'It should appear within X days', tr: 'X gün içinde görünmeli' },
    ],
    tips: [
      'Always bring your receipt and keep original tags on items you might return.',
      '"Faulty" means defective/broken — an important word for complaints.',
    ],
  },
  'Making New Friends': {
    aiName: 'Chris',
    dialogue: [
      { role: 'ai', text: 'Hey! I don\'t think we\'ve met. I\'m Chris. Are you a friend of Mark\'s?', tr: 'Hey! Sanırım tanışmadık. Ben Chris. Mark\'ın arkadaşı mısınız?' },
      { role: 'user', text: 'Hi Chris! I\'m Alex. Yes, we work together. Great party, isn\'t it?', tr: 'Merhaba Chris! Ben Alex. Evet, birlikte çalışıyoruz. Harika bir parti, değil mi?' },
      { role: 'ai', text: 'It really is! So what do you do for work?', tr: 'Gerçekten öyle! Peki ne iş yapıyorsunuz?' },
      { role: 'user', text: 'I\'m a graphic designer. I mostly work on branding projects. What about you?', tr: 'Grafik tasarımcıyım. Çoğunlukla marka projeleri üzerinde çalışıyorum. Siz ne yapıyorsunuz?' },
      { role: 'ai', text: 'That\'s cool! I\'m in software development. Have you been doing design for long?', tr: 'Harika! Ben yazılım geliştirme alanındayım. Tasarım işiyle uzun süredir mi ilgileniyorsunuz?' },
      { role: 'user', text: 'About six years. I love it! Do you enjoy coding?', tr: 'Yaklaşık altı yıldır. Çok seviyorum! Kodlamayı seviyor musunuz?' },
      { role: 'ai', text: 'Most of the time! When I\'m not coding, I enjoy hiking. Do you have any hobbies?', tr: 'Çoğu zaman! Kod yazmadığımda yürüyüş yapmaktan hoşlanıyorum. Hobileriniz var mı?' },
      { role: 'user', text: 'I love photography. I try to go out with my camera every weekend.', tr: 'Fotoğrafçılığı seviyorum. Her hafta sonu kameramla dışarı çıkmaya çalışıyorum.' },
    ],
    keyPhrases: [
      { phrase: 'I don\'t think we\'ve met', tr: 'Sanırım tanışmadık' },
      { phrase: 'What do you do for work?', tr: 'Ne iş yapıyorsunuz?' },
      { phrase: 'I\'m in / I work in...', tr: '... alanındayım / ... de çalışıyorum' },
      { phrase: 'What about you?', tr: 'Peki ya siz?' },
    ],
    tips: [
      '"What about you?" is a great way to keep the conversation flowing.',
      'Saying something positive first ("That\'s cool!") makes people feel comfortable.',
    ],
  },
  'Asking for Directions': {
    aiName: 'Local Resident',
    dialogue: [
      { role: 'user', text: 'Excuse me, could you help me? I\'m looking for the train station.', tr: 'Özür dilerim, yardımcı olabilir misiniz? Tren istasyonunu arıyorum.' },
      { role: 'ai', text: 'Of course! The train station is about ten minutes from here on foot.', tr: 'Tabii ki! Tren istasyonu buradan yürüyerek yaklaşık on dakika.' },
      { role: 'user', text: 'Great! Which direction should I go?', tr: 'Harika! Hangi yöne gitmem gerekiyor?' },
      { role: 'ai', text: 'Go straight ahead down this street until you see the big supermarket. Then turn left.', tr: 'Bu sokaktan büyük süpermarketi görene kadar düz gidin. Sonra sola dönün.' },
      { role: 'user', text: 'Turn left at the supermarket. Got it. And then?', tr: 'Süpermarkette sola dön. Anladım. Peki sonra?' },
      { role: 'ai', text: 'After that, go straight for about 200 metres. The station will be on your right. You can\'t miss it.', tr: 'Ondan sonra yaklaşık 200 metre düz gidin. İstasyon sağınızda olacak. Gözünüzden kaçmaz.' },
      { role: 'user', text: 'Perfect, thank you so much! Is there a bus I can take instead?', tr: 'Mükemmel, çok teşekkürler! Onun yerine binebileceğim bir otobüs var mı?' },
      { role: 'ai', text: 'Yes, the number 14 bus stops right here and goes directly to the station.', tr: 'Evet, 14 numaralı otobüs tam burada duruyor ve doğrudan istasyona gidiyor.' },
    ],
    keyPhrases: [
      { phrase: 'Excuse me, could you help me?', tr: 'Özür dilerim, yardımcı olabilir misiniz?' },
      { phrase: 'Go straight ahead', tr: 'Düz gidin' },
      { phrase: 'Turn left / right', tr: 'Sola / sağa dönün' },
      { phrase: 'You can\'t miss it', tr: 'Gözünüzden kaçmaz' },
    ],
    tips: [
      'Repeat back key directions ("Turn left at the supermarket") to confirm you understood.',
      '"Excuse me" is always the polite way to start talking to a stranger.',
    ],
  },
  'Business Meeting': {
    aiName: 'Marcus (Senior Manager)',
    dialogue: [
      { role: 'user', text: 'Good morning everyone. Today I\'d like to present our Q3 marketing proposal.', tr: 'Günaydın herkese. Bugün Q3 pazarlama teklifimizi sunmak istiyorum.' },
      { role: 'ai', text: 'Good morning. Please go ahead. We\'re all very interested to hear the strategy.', tr: 'Günaydın. Lütfen devam edin. Stratejiyi duymakla hepimiz çok ilgileniyoruz.' },
      { role: 'user', text: 'Our proposal focuses on social media expansion and influencer partnerships. We project a 25% increase in brand awareness.', tr: 'Teklifimiz sosyal medya genişlemesi ve influencer ortaklıkları üzerine odaklanıyor. Marka bilinirliğinde %25 artış öngörüyoruz.' },
      { role: 'ai', text: 'That\'s an ambitious target. What\'s the budget breakdown for this initiative?', tr: 'Bu oldukça iddialı bir hedef. Bu girişim için bütçe dağılımı nasıl?' },
      { role: 'user', text: 'We\'re requesting £50,000. 60% goes to influencer fees, 30% to content production, and 10% to analytics tools.', tr: '50.000 £ talep ediyoruz. %60\'ı influencer ücretlerine, %30\'u içerik üretimine ve %10\'u analiz araçlarına gidecek.' },
      { role: 'ai', text: 'And what\'s the timeline? When can we expect to see measurable results?', tr: 'Peki zaman çizelgesi nasıl? Ölçülebilir sonuçları ne zaman beklemeliyiz?' },
      { role: 'user', text: 'We plan to launch in July and expect to see initial data by September, with full results by end of Q3.', tr: 'Temmuz\'da başlatmayı planlıyoruz ve Eylül\'e kadar ilk verileri, Q3 sonunda ise tam sonuçları görmeyi bekliyoruz.' },
      { role: 'ai', text: 'That seems reasonable. However, I\'d like to see a contingency plan in case ROI doesn\'t meet expectations.', tr: 'Bu makul görünüyor. Ancak YG beklentileri karşılamazsa bir olası durum planı görmek istiyorum.' },
    ],
    keyPhrases: [
      { phrase: 'I\'d like to present...', tr: '... sunmak istiyorum' },
      { phrase: 'We project a X% increase in...', tr: '...\'de %X artış öngörüyoruz' },
      { phrase: 'What\'s the budget breakdown?', tr: 'Bütçe dağılımı nasıl?' },
      { phrase: 'Contingency plan', tr: 'Olası durum / acil eylem planı' },
    ],
    tips: [
      'Structure your presentation: "Our proposal focuses on..." → data → timeline → budget.',
      '"I\'d like to see..." is a polite but assertive way to make requests in business.',
    ],
  },
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SCENE_ICONS: Record<string, IconName> = {
  'Ordering Coffee':       'cafe-outline',
  'Job Interview':         'briefcase-outline',
  'Airport Check-in':      'airplane-outline',
  'Doctor Visit':          'medkit-outline',
  'Shopping Return':       'bag-outline',
  'Making New Friends':    'people-outline',
  'Asking for Directions': 'navigate-outline',
  'Business Meeting':      'business-outline',
};

const LEVEL_COLORS: Record<string, string> = {
  A1: '#0E9E80', A2: '#0E9E80', B1: '#7355F7', B2: '#7355F7', C1: '#F59E0B', C2: '#F59E0B',
};

const CAT_COLORS: Record<string, [string, string]> = {
  daily:     ['#FCD34D', '#F59E0B'],
  work:      ['#A48FFF', '#7355F7'],
  travel:    ['#3DD1AE', '#0E9E80'],
  emergency: ['#FF8A6E', '#E84E32'],
  social:    ['#A48FFF', '#7355F7'],
  shopping:  ['#3DD1AE', '#0E9E80'],
};

export default function StaticDialogue() {
  const { sceneId } = useLocalSearchParams<{ sceneId: string }>();
  const { user } = useAuthStore();
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});
  const [showAllTr, setShowAllTr] = useState(false);

  const { data: scenes = [] } = useQuery({
    queryKey: ['roleplay-scenes'],
    queryFn: () => roleplayApi.getScenes().then((r) => r.data),
    staleTime: 300000,
  });

  const scene = (scenes as RolePlayScene[]).find((s) => s.id === sceneId);
  const dialogue = scene ? STATIC_DIALOGUES[scene.titleEn] : null;

  const startMutation = useMutation({
    mutationFn: (data: { sceneId?: string }) =>
      roleplayApi.startSession(data).then((r) => r.data),
    onSuccess: (data) => {
      router.replace(`/roleplay/${data.session.id}`);
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.response?.data?.error ?? 'Oturum başlatılamadı');
    },
  });

  function toggleLine(idx: number) {
    setShowTranslation((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  if (!scene || !dialogue) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6B638F', fontSize: 15 }}>Sahne bulunamadı.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: '#7355F7', fontWeight: '600' }}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const lc = LEVEL_COLORS[scene.difficulty] ?? '#9B94CC';
  const catColor = CAT_COLORS[scene.category]?.[1] ?? '#7355F7';
  const sceneIcon = SCENE_ICONS[scene.titleEn] ?? 'chatbubble-outline';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Gradient Header */}
      <View style={{ backgroundColor: catColor, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16, alignSelf: 'flex-start', padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={sceneIcon} size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 24 }}>{scene.titleTr}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>{dialogue.aiName} · {scene.difficulty}</Text>
          </View>
        </View>
        {/* Watermark */}
        <Text style={{ position: 'absolute', right: -8, bottom: -14, fontSize: 70, fontWeight: '800', color: 'rgba(255,255,255,0.06)', lineHeight: 70 }}>{scene.difficulty}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Translation toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => setShowAllTr(!showAllTr)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0EEF9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
            >
              <Ionicons name={showAllTr ? 'eye-off-outline' : 'language-outline'} size={14} color="#7355F7" />
              <Text style={{ color: '#7355F7', fontSize: 12, fontWeight: '600' }}>{showAllTr ? 'Çeviriyi Gizle' : 'Çeviriyi Göster'}</Text>
            </TouchableOpacity>
          </View>

          {/* Dialogue bubbles */}
          {dialogue.dialogue.map((line, idx) => {
            const isUser = line.role === 'user';
            const showTr = showAllTr || showTranslation[idx];
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => toggleLine(idx)}
                activeOpacity={0.85}
                style={{ marginBottom: 10, alignItems: isUser ? 'flex-end' : 'flex-start' }}
              >
                {!isUser && (
                  <Text style={{ fontSize: 10, color: '#9B94CC', marginBottom: 3, marginLeft: 4 }}>{dialogue.aiName}</Text>
                )}
                <View style={{
                  maxWidth: '82%',
                  backgroundColor: isUser ? '#7355F7' : '#ffffff',
                  borderRadius: 16,
                  borderBottomRightRadius: isUser ? 4 : 16,
                  borderBottomLeftRadius: isUser ? 16 : 4,
                  padding: 12,
                  borderWidth: isUser ? 0 : 1,
                  borderColor: '#E4E1F5',
                  shadowColor: '#7355F7',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isUser ? 0.15 : 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}>
                  <Text style={{ color: isUser ? '#ffffff' : '#110D24', fontSize: 14, lineHeight: 20 }}>{line.text}</Text>
                  {showTr && (
                    <Text style={{ color: isUser ? 'rgba(255,255,255,0.72)' : '#9B94CC', fontSize: 12, marginTop: 6, lineHeight: 17, fontStyle: 'italic' }}>{line.tr}</Text>
                  )}
                </View>
                {!showTr && (
                  <Text style={{ fontSize: 10, color: '#B8B0D8', marginTop: 2, marginHorizontal: 4 }}>Çeviri için dokun</Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Key Phrases */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#E4E1F5' }}>
            <Text style={{ color: '#110D24', fontWeight: '700', fontSize: 14, marginBottom: 12 }}>🔑 Anahtar İfadeler</Text>
            {dialogue.keyPhrases.map((kp, i) => (
              <View key={i} style={{ marginBottom: i < dialogue.keyPhrases.length - 1 ? 10 : 0 }}>
                <Text style={{ color: '#7355F7', fontWeight: '600', fontSize: 13 }}>"{kp.phrase}"</Text>
                <Text style={{ color: '#6B638F', fontSize: 12, marginTop: 2 }}>{kp.tr}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
            <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 14, marginBottom: 10 }}>💡 İpuçları</Text>
            {dialogue.tips.map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: i < dialogue.tips.length - 1 ? 8 : 0 }}>
                <Text style={{ color: '#F59E0B', fontSize: 13 }}>•</Text>
                <Text style={{ color: '#6B638F', fontSize: 13, flex: 1, lineHeight: 18 }}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* AI Practice CTA */}
          {user?.hasApiKey ? (
            <TouchableOpacity
              onPress={() => startMutation.mutate({ sceneId: scene.id })}
              disabled={startMutation.isPending}
              style={{ backgroundColor: '#7355F7', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {startMutation.isPending ? 'Başlatılıyor…' : 'AI ile Pratik Yap ✨'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={{ backgroundColor: 'rgba(115,85,247,0.08)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(115,85,247,0.2)' }}
            >
              <Ionicons name="sparkles-outline" size={18} color="#7355F7" />
              <Text style={{ color: '#7355F7', fontWeight: '600', fontSize: 14 }}>AI Pratik için API Key Ekle</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
