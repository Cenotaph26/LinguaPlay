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
  'Hotel Check-in': {
    aiName: 'Maya (Receptionist)',
    dialogue: [
      { role: 'ai', text: 'Good evening! Welcome to The Grand Hotel. Do you have a reservation?', tr: 'İyi akşamlar! The Grand Hotel\'e hoş geldiniz. Rezervasyonunuz var mı?' },
      { role: 'user', text: 'Yes, I booked a room for three nights under the name Johnson.', tr: 'Evet, Johnson adına üç gecelik oda rezervasyonu yaptırdım.' },
      { role: 'ai', text: 'Let me check… Yes, I have you in a standard double room on the 5th floor. Could I see your passport or ID, please?', tr: 'Kontrol edeyim… Evet, sizi 5. katta standart çift kişilik odada görüyorum. Pasaportunuzu veya kimliğinizi görebilir miyim lütfen?' },
      { role: 'user', text: 'Sure, here it is. Is breakfast included?', tr: 'Tabii, buyurun. Kahvaltı dahil mi?' },
      { role: 'ai', text: 'Yes, breakfast is served from 7 to 10 AM in the restaurant on the ground floor. Would you like an upgrade to a room with a city view?', tr: 'Evet, kahvaltı zemin kattaki restoranda sabah 7\'den 10\'a kadar sunulmaktadır. Şehir manzaralı bir odaya yükseltme ister misiniz?' },
      { role: 'user', text: 'How much extra would that be?', tr: 'Bunun için ne kadar ek ücret ödemem gerekir?' },
      { role: 'ai', text: 'It\'s an extra £20 per night. You\'d have a lovely view of the park.', tr: 'Geceligi 20 £ ek ücret. Parkın güzel manzarasına sahip olursunuz.' },
      { role: 'user', text: 'That sounds nice. I\'ll take the upgrade, please. What time is check-out?', tr: 'Güzel olur. Yükseltmeyi alıyorum, lütfen. Check-out saati ne zaman?' },
      { role: 'ai', text: 'Check-out is at 11 AM. Here\'s your key card. The lift is just to your left. Enjoy your stay!', tr: 'Check-out saat 11.00\'de. Anahtar kartınız burada. Asansör hemen solunuzda. İyi tatiller!' },
    ],
    keyPhrases: [
      { phrase: 'I have a reservation under...', tr: '... adına rezervasyonum var' },
      { phrase: 'Is breakfast included?', tr: 'Kahvaltı dahil mi?' },
      { phrase: 'How much extra would that be?', tr: 'Ne kadar ek ücret olur?' },
      { phrase: 'What time is check-out?', tr: 'Check-out saati nedir?' },
    ],
    tips: [
      '"I\'d like a room for X nights" is more polite than "I want a room."',
      'Use "Could I see...?" for polite requests — it sounds more formal than "Can I see?"',
    ],
  },
  'Lost Luggage': {
    aiName: 'David (Baggage Services)',
    dialogue: [
      { role: 'user', text: 'Excuse me. I\'ve been waiting an hour and my suitcase hasn\'t arrived on the belt.', tr: 'Özür dilerim. Bir saattir bekliyorum ve valizim banttan çıkmadı.' },
      { role: 'ai', text: 'I\'m very sorry to hear that. Could you give me your flight number and boarding pass, please?', tr: 'Bunu duyduğuma çok üzüldüm. Uçuş numaranızı ve biniş kartınızı verebilir misiniz lütfen?' },
      { role: 'user', text: 'Sure. It was flight BA207 from Madrid. Here\'s my boarding pass.', tr: 'Tabii. Madrid\'den BA207 seferiydi. İşte biniş kartım.' },
      { role: 'ai', text: 'Thank you. Can you describe your suitcase? The colour, size, and any distinguishing features?', tr: 'Teşekkürler. Valizinizi tarif edebilir misiniz? Rengi, boyutu ve ayırt edici özellikleri?' },
      { role: 'user', text: 'It\'s a large navy-blue suitcase with a yellow ribbon tied to the handle.', tr: 'Lacivert rengi büyük bir valiz, tutamacına sarı kurdela bağlı.' },
      { role: 'ai', text: 'I see it may still be at the origin airport. We\'ll locate it and deliver it to your address within 24 to 48 hours.', tr: 'Hâlâ çıkış havalimanında olabilir. Bulup 24 ila 48 saat içinde adresinize teslim edeceğiz.' },
      { role: 'user', text: 'Can I get a reference number for the claim?', tr: 'Talep için bir referans numarası alabilir miyim?' },
      { role: 'ai', text: 'Absolutely. Your reference number is LHR-4892. Please keep this for follow-up. Here\'s also a form for emergency expenses.', tr: 'Elbette. Referans numaranız LHR-4892. Takip için saklayın. İşte acil masraflar için bir form da.' },
    ],
    keyPhrases: [
      { phrase: 'My suitcase hasn\'t arrived', tr: 'Valizim gelmedi' },
      { phrase: 'Can you describe your luggage?', tr: 'Bagajınızı tarif edebilir misiniz?' },
      { phrase: 'Within 24 to 48 hours', tr: '24 ila 48 saat içinde' },
      { phrase: 'Can I get a reference number?', tr: 'Referans numarası alabilir miyim?' },
    ],
    tips: [
      '"I\'ve been waiting" (present perfect continuous) shows an action that started in the past and is still happening.',
      'Give specific details (colour, size, features) when describing lost items.',
    ],
  },
  'Car Rental': {
    aiName: 'Lisa (Car Rental Agent)',
    dialogue: [
      { role: 'user', text: 'Hi. I have a reservation for a car. The name is Williams.', tr: 'Merhaba. Araba rezervasyonum var. İsim Williams.' },
      { role: 'ai', text: 'Welcome, Mr Williams! I have you booked for a compact car for five days. May I see your driving licence and a credit card, please?', tr: 'Hoş geldiniz Bay Williams! Beş günlük kompakt araba rezervasyonunuz var. Ehliyetinizi ve bir kredi kartınızı görebilir miyim lütfen?' },
      { role: 'user', text: 'Here you go. Do I need to take out extra insurance?', tr: 'Buyurun. Ek sigorta yaptırmam gerekiyor mu?' },
      { role: 'ai', text: 'Basic third-party insurance is included. I\'d recommend adding our Collision Damage Waiver — it covers any damage to the vehicle.', tr: 'Temel üçüncü şahıs sigortası dahil. Araç hasarını kapsayan Çarpışma Hasar Muafiyetimizi eklemesini öneririm.' },
      { role: 'user', text: 'How much is that per day?', tr: 'Günlüğü ne kadar?' },
      { role: 'ai', text: 'It\'s £15 a day. Shall I add it?', tr: 'Günde 15 £. Ekleyeyim mi?' },
      { role: 'user', text: 'Yes, please. Can I return the car to a different location?', tr: 'Evet, lütfen. Arabayı farklı bir lokasyona iade edebilir miyim?' },
      { role: 'ai', text: 'Yes, there\'s a one-way fee of £50 for drop-offs at other branches. The car is ready — let me walk you through it.', tr: 'Evet, diğer şubelere bırakmak için tek yön ücreti 50 £\'dır. Araba hazır — size kısa bir tur yaptırayım.' },
    ],
    keyPhrases: [
      { phrase: 'I have a reservation for...', tr: '... için rezervasyonum var' },
      { phrase: 'Do I need to take out extra insurance?', tr: 'Ek sigorta yaptırmam gerekiyor mu?' },
      { phrase: 'How much is that per day?', tr: 'Günlüğü ne kadar?' },
      { phrase: 'Can I return it to a different location?', tr: 'Farklı bir yere iade edebilir miyim?' },
    ],
    tips: [
      '"Shall I add it?" is a common offer phrase — respond with "Yes, please" or "No, thank you."',
      'Ask about one-way fees, fuel policy, and mileage limits before signing.',
    ],
  },
  'Train Ticket Booking': {
    aiName: 'James (Ticket Agent)',
    dialogue: [
      { role: 'user', text: 'Hi. I\'d like to buy a ticket to Edinburgh, please.', tr: 'Merhaba. Edinburgh\'a bir bilet almak istiyorum, lütfen.' },
      { role: 'ai', text: 'Of course! When would you like to travel?', tr: 'Tabii ki! Ne zaman seyahat etmek istersiniz?' },
      { role: 'user', text: 'This Saturday morning, arriving before noon if possible.', tr: 'Bu Cumartesi sabahı, mümkünse öğleden önce varmalıyım.' },
      { role: 'ai', text: 'There\'s an 08:15 departure arriving at 12:30, and a 09:45 arriving at 13:55. Which do you prefer?', tr: '08:15\'te kalkıp 12:30\'da varan sefer ve 09:45\'te kalkıp 13:55\'te varan sefer var. Hangisini tercih edersiniz?' },
      { role: 'user', text: 'The 08:15, please. How much is a standard return ticket?', tr: '08:15\'tekini, lütfen. Standart gidiş-dönüş bilet ne kadar?' },
      { role: 'ai', text: 'A standard open return is £89. However, if you book an Advance ticket for a specific train back, it could be as low as £54.', tr: 'Standart açık dönüş 89 £. Ancak belirli bir tren için Advance bileti alırsanız 54 £\'a kadar düşebilir.' },
      { role: 'user', text: 'I\'ll take the Advance return then. I\'ll be coming back Sunday evening.', tr: 'O zaman Advance gidiş-dönüş alacağım. Pazar akşamı döneceğim.' },
      { role: 'ai', text: 'There\'s an 18:30 on Sunday for £54 return. Would you like a window seat?', tr: 'Pazar günü 54 £ gidiş-dönüş için 18:30 treni var. Pencere kenarı ister misiniz?' },
    ],
    keyPhrases: [
      { phrase: 'I\'d like a ticket to...', tr: '...\'a bir bilet istiyorum' },
      { phrase: 'Arriving before noon', tr: 'Öğleden önce vararak' },
      { phrase: 'A standard return ticket', tr: 'Standart gidiş-dönüş bilet' },
      { phrase: 'As low as £...', tr: '... £\'a kadar düşük' },
    ],
    tips: [
      '"As low as" is used to highlight the best/cheapest price available.',
      'In the UK, "return" = round trip; "single" = one-way.',
    ],
  },
  'Customs Declaration': {
    aiName: 'Officer Green (Customs)',
    dialogue: [
      { role: 'ai', text: 'Passport, please. What is the purpose of your visit?', tr: 'Pasaportunuzu lütfen. Ziyaretinizin amacı nedir?' },
      { role: 'user', text: 'I\'m here for tourism. I plan to stay for two weeks.', tr: 'Turizm için buradayım. İki hafta kalmayı planlıyorum.' },
      { role: 'ai', text: 'Do you have anything to declare — food, alcohol, tobacco, or items over the duty-free limit?', tr: 'Beyan edecek bir şeyiniz var mı — yiyecek, alkol, tütün veya gümrüksüz limiti aşan eşyalar?' },
      { role: 'user', text: 'I have two bottles of wine and some chocolates as gifts.', tr: 'İki şişe şarap ve hediye olarak biraz çikolata getirdim.' },
      { role: 'ai', text: 'Two bottles is within the allowance. Any other goods to declare?', tr: 'İki şişe izin verilen miktar dahilinde. Beyan edilecek başka eşya var mı?' },
      { role: 'user', text: 'No, that\'s everything. I also have around £1,000 in cash.', tr: 'Hayır, hepsi bu kadar. Yanımda ayrıca yaklaşık 1.000 £ nakit var.' },
      { role: 'ai', text: 'That\'s below the £10,000 threshold, so no declaration needed. Please open your bag for a quick check.', tr: 'Bu, 10.000 £ eşiğinin altında, bu nedenle beyanname gerekmez. Lütfen hızlı bir kontrol için çantanızı açın.' },
      { role: 'user', text: 'Of course. Here you go.', tr: 'Tabii ki. Buyurun.' },
    ],
    keyPhrases: [
      { phrase: 'Do you have anything to declare?', tr: 'Beyan edecek bir şeyiniz var mı?' },
      { phrase: 'Within the allowance', tr: 'İzin verilen miktar dahilinde' },
      { phrase: 'Below the threshold', tr: 'Eşiğin altında' },
      { phrase: 'For a quick check', tr: 'Hızlı bir kontrol için' },
    ],
    tips: [
      'Always be honest at customs — lying can result in heavy fines.',
      '"Allowance" refers to the amount you\'re legally allowed to bring in duty-free.',
    ],
  },
  'Tourist Information': {
    aiName: 'Sophie (Tourist Info)',
    dialogue: [
      { role: 'user', text: 'Hello! We just arrived in the city and don\'t know where to start.', tr: 'Merhaba! Şehre yeni geldik ve nereden başlayacağımızı bilmiyoruz.' },
      { role: 'ai', text: 'Welcome! I\'d recommend starting with the Old Town — it\'s a UNESCO World Heritage Site with beautiful architecture.', tr: 'Hoş geldiniz! Güzel mimarisiyle UNESCO Dünya Mirası alanı olan Eski Şehir ile başlamanızı öneririm.' },
      { role: 'user', text: 'How far is it from here? Can we walk?', tr: 'Buradan ne kadar uzakta? Yürüyerek gidebilir miyiz?' },
      { role: 'ai', text: 'It\'s about a 15-minute walk. Here\'s a free map. The main highlights are marked in red.', tr: 'Yaklaşık 15 dakikalık yürüyüş mesafesinde. İşte ücretsiz bir harita. Ana yerler kırmızıyla işaretlenmiş.' },
      { role: 'user', text: 'Are there any good places to eat nearby?', tr: 'Yakınlarda yemek için iyi yerler var mı?' },
      { role: 'ai', text: 'Yes! Market Square has excellent local restaurants. Try the fish market for fresh seafood — it\'s a local favourite.', tr: 'Evet! Market Meydanı\'nda harika yerel restoranlar var. Taze deniz ürünleri için balık pazarını deneyin — yerel bir favori.' },
      { role: 'user', text: 'What about evening activities? Any concerts or events this weekend?', tr: 'Akşam aktiviteleri nasıl? Bu hafta sonu herhangi bir konser veya etkinlik var mı?' },
      { role: 'ai', text: 'There\'s a free outdoor jazz concert on Saturday at 7 PM in City Park. Here\'s a brochure with this week\'s events.', tr: 'Cumartesi saat 19:00\'da Şehir Parkı\'nda ücretsiz açık hava caz konseri var. İşte bu haftanın etkinliklerini içeren bir broşür.' },
    ],
    keyPhrases: [
      { phrase: 'I\'d recommend starting with...', tr: '... ile başlamanızı öneririm' },
      { phrase: 'Can we walk?', tr: 'Yürüyerek gidebilir miyiz?' },
      { phrase: 'The main highlights', tr: 'Ana ilgi noktaları' },
      { phrase: 'A local favourite', tr: 'Yerel favori' },
    ],
    tips: [
      '"I\'d recommend" is softer and more polite than "You should."',
      'Use "What about...?" to introduce a new topic in conversation.',
    ],
  },
  'Hotel Complaint': {
    aiName: 'Carlos (Manager)',
    dialogue: [
      { role: 'user', text: 'Excuse me. I need to speak to the manager about my room.', tr: 'Özür dilerim. Odamla ilgili müdürle görüşmem gerekiyor.' },
      { role: 'ai', text: 'I\'m the duty manager, Carlos. How can I help you?', tr: 'Ben nöbet müdürüyüm, Carlos. Size nasıl yardımcı olabilirim?' },
      { role: 'user', text: 'The air conditioning in room 412 isn\'t working. I asked housekeeping three hours ago but no one has come.', tr: '412 numaralı odadaki klima çalışmıyor. Üç saat önce temizlik servisi istedim ama kimse gelmeddi.' },
      { role: 'ai', text: 'I sincerely apologise for the inconvenience. That\'s not acceptable. Let me call maintenance right now.', tr: 'Bu rahatsızlık için içtenlikle özür dilerim. Bu kabul edilemez. Hemen bakımı arayayım.' },
      { role: 'user', text: 'Also, the noise from the street is very loud. I haven\'t been able to sleep.', tr: 'Ayrıca sokaktan gelen gürültü çok yüksek. Uyuyamıyorum.' },
      { role: 'ai', text: 'I completely understand. Would you like me to move you to a quieter room on the opposite side of the building?', tr: 'Tamamen anlıyorum. Binanın diğer tarafında daha sessiz bir odaya geçmek ister misiniz?' },
      { role: 'user', text: 'Yes, that would be great. Will there be any additional charge?', tr: 'Evet, bu harika olur. Ek bir ücret olacak mı?' },
      { role: 'ai', text: 'Absolutely not. I\'ll also offer you a complimentary dinner tonight as compensation for the trouble.', tr: 'Kesinlikle hayır. Yaşadığınız sorun için tazminat olarak bu gece ücretsiz bir akşam yemeği de sunacağım.' },
    ],
    keyPhrases: [
      { phrase: 'I need to speak to the manager', tr: 'Müdürle görüşmem gerekiyor' },
      { phrase: 'That\'s not acceptable', tr: 'Bu kabul edilemez' },
      { phrase: 'Will there be any additional charge?', tr: 'Ek bir ücret olacak mı?' },
      { phrase: 'As compensation for the trouble', tr: 'Yaşanan sorun için tazminat olarak' },
    ],
    tips: [
      '"I sincerely apologise" is the formal/business way to say sorry.',
      'Be specific about the problem: say what it is, how long it\'s been an issue, and what you\'ve already tried.',
    ],
  },
  'Email Enquiry': {
    aiName: 'Helen (Office Receptionist)',
    dialogue: [
      { role: 'user', text: 'Good morning. I\'m calling to enquire about the training courses you offer.', tr: 'Günaydın. Sunduğunuz eğitim kurslarını sormak için arıyorum.' },
      { role: 'ai', text: 'Good morning! Of course. We offer beginner, intermediate, and advanced courses. Are you looking for individual or group training?', tr: 'Günaydın! Tabii ki. Başlangıç, orta ve ileri seviye kurslar sunuyoruz. Bireysel mi yoksa grup eğitimi mi arıyorsunuz?' },
      { role: 'user', text: 'I\'m interested in group training for my team of eight people.', tr: 'Sekiz kişilik ekibim için grup eğitimiyle ilgileniyorum.' },
      { role: 'ai', text: 'We do offer corporate group packages. Could I take your name and company, and have one of our trainers call you back?', tr: 'Kurumsal grup paketleri sunuyoruz. İsminizi ve şirketinizi alabilir miyim, bir eğitmenimiz sizi geri arasın?' },
      { role: 'user', text: 'Sure. My name is Alex Park, from Nexus Solutions.', tr: 'Tabii. Adım Alex Park, Nexus Solutions\'dan.' },
      { role: 'ai', text: 'Thank you, Mr Park. Could you also tell me your preferred contact number and a convenient time to call?', tr: 'Teşekkürler Bay Park. Tercih ettiğiniz iletişim numarasını ve uygun bir arama saatini de söyler misiniz?' },
      { role: 'user', text: 'My number is 07700 900123. Mornings before 11 work best for me.', tr: 'Numaram 07700 900123. Sabahları 11\'den önce benim için en uygun.' },
      { role: 'ai', text: 'Perfect. Someone will be in touch within 24 hours. Is there anything else I can help with?', tr: 'Mükemmel. 24 saat içinde biri sizinle iletişime geçecek. Başka yardımcı olabileceğim bir şey var mı?' },
    ],
    keyPhrases: [
      { phrase: 'I\'m calling to enquire about...', tr: '... hakkında bilgi almak için arıyorum' },
      { phrase: 'Could I take your name?', tr: 'İsminizi alabilir miyim?' },
      { phrase: 'Have someone call you back', tr: 'Birini sizi geri aratmak' },
      { phrase: 'Within 24 hours', tr: '24 saat içinde' },
    ],
    tips: [
      '"I\'m calling to enquire about..." is the standard opening for a formal phone enquiry.',
      'Mornings before 11" is a natural time expression — avoid "before the hour of 11 AM."',
    ],
  },
  'Phone Interview': {
    aiName: 'Mark (HR Recruiter)',
    dialogue: [
      { role: 'ai', text: 'Good afternoon, could I speak to Alex Thompson, please?', tr: 'İyi günler, lütfen Alex Thompson ile konuşabilir miyim?' },
      { role: 'user', text: 'Speaking. Good afternoon, Mark.', tr: 'Benim. İyi günler, Mark.' },
      { role: 'ai', text: 'Thanks for taking the time. I\'d like to start by asking why you applied for the marketing coordinator role.', tr: 'Zaman ayırdığınız için teşekkürler. Pazarlama koordinatörü pozisyonuna neden başvurduğunuzu sormakla başlamak istiyorum.' },
      { role: 'user', text: 'I\'ve always admired your company\'s creative campaigns. My background in digital marketing and content creation is a great fit.', tr: 'Şirketinizin yaratıcı kampanyalarına hep hayran olmuşumdur. Dijital pazarlama ve içerik oluşturma geçmişim harika bir uyum sağlıyor.' },
      { role: 'ai', text: 'Can you tell me about a successful campaign you\'ve managed?', tr: 'Yönettiğiniz başarılı bir kampanyadan bahsedebilir misiniz?' },
      { role: 'user', text: 'Last year I led a social media campaign that increased our follower count by 40% in three months.', tr: 'Geçen yıl, takipçi sayımızı üç ayda %40 artıran bir sosyal medya kampanyasına liderlik ettim.' },
      { role: 'ai', text: 'Impressive. What salary range are you expecting?', tr: 'Etkileyici. Beklediğiniz maaş aralığı nedir?' },
      { role: 'user', text: 'Based on my experience, I\'m looking for something in the range of £35,000 to £40,000.', tr: 'Deneyimime dayanarak, 35.000 £ ile 40.000 £ arasında bir şey arıyorum.' },
    ],
    keyPhrases: [
      { phrase: 'Speaking.', tr: 'Benim. (Telefonda kendinizi tanıtma)' },
      { phrase: 'My background in... is a great fit', tr: '... geçmişim harika bir uyum' },
      { phrase: 'I led a... that increased...', tr: '...\'yi artıran bir ... liderlik ettim' },
      { phrase: 'In the range of...', tr: '... aralığında' },
    ],
    tips: [
      'On the phone, say "Speaking" instead of "This is Alex" — it\'s more natural.',
      'Use numbers and percentages when talking about achievements: "increased by 40%."',
    ],
  },
  'Project Presentation': {
    aiName: 'Laura (Project Lead)',
    dialogue: [
      { role: 'user', text: 'Thanks everyone for joining. Today I\'ll be presenting our new customer portal project.', tr: 'Katılan herkese teşekkürler. Bugün yeni müşteri portalı projemizi sunacağım.' },
      { role: 'ai', text: 'Thanks, Jamie. Could you start with the project timeline and key milestones?', tr: 'Teşekkürler, Jamie. Proje zaman çizelgesi ve önemli kilometre taşlarıyla başlayabilir misiniz?' },
      { role: 'user', text: 'Of course. We plan to launch the beta version by March and the full version by June.', tr: 'Tabii ki. Beta sürümünü Mart\'ta, tam sürümü Haziran\'da başlatmayı planlıyoruz.' },
      { role: 'ai', text: 'What are the main technical challenges you\'re anticipating?', tr: 'Öngördüğünüz ana teknik zorluklar nelerdir?' },
      { role: 'user', text: 'The main challenge is data migration. We need to transfer over 50,000 customer records without any downtime.', tr: 'Ana zorluk veri taşıma. 50.000\'den fazla müşteri kaydını herhangi bir kesinti olmaksızın aktarmamız gerekiyor.' },
      { role: 'ai', text: 'Have you budgeted for contingencies?', tr: 'Olası durumlar için bütçe ayırdınız mı?' },
      { role: 'user', text: 'Yes, we\'ve set aside 15% of the total budget as a contingency fund. I\'m happy to take questions now.', tr: 'Evet, toplam bütçenin %15\'ini beklenmedik durumlar fonu olarak ayırdık. Şimdi soruları almaktan memnuniyet duyarım.' },
      { role: 'ai', text: 'Well presented. Could you share the slide deck after the meeting?', tr: 'Güzel sunuldu. Toplantıdan sonra slayt setini paylaşabilir misiniz?' },
    ],
    keyPhrases: [
      { phrase: 'I\'ll be presenting...', tr: '... sunacağım' },
      { phrase: 'Key milestones', tr: 'Önemli kilometre taşları' },
      { phrase: 'Without any downtime', tr: 'Herhangi bir kesinti olmaksızın' },
      { phrase: 'I\'m happy to take questions', tr: 'Soruları almaktan memnuniyet duyarım' },
    ],
    tips: [
      'Start a presentation with "Today I\'ll be presenting..." to signal what\'s coming.',
      '"I\'m happy to take questions now" is a polished way to open the floor.',
    ],
  },
  'Salary Negotiation': {
    aiName: 'Tom (HR Manager)',
    dialogue: [
      { role: 'user', text: 'I\'d like to discuss the possibility of a salary increase.', tr: 'Maaş artışı olasılığını görüşmek istiyorum.' },
      { role: 'ai', text: 'Of course. Can you tell me what you have in mind and why you feel it\'s warranted?', tr: 'Tabii ki. Ne düşündüğünüzü ve neden hak ettiğinizi düşündüğünüzü anlatır mısınız?' },
      { role: 'user', text: 'In the past year, I\'ve taken on three new client accounts and exceeded my targets by 20%.', tr: 'Geçen yıl üç yeni müşteri hesabı devraldım ve hedeflerimi %20 aştım.' },
      { role: 'ai', text: 'That\'s a strong performance. What salary are you looking for?', tr: 'Bu güçlü bir performans. Ne kadar maaş arıyorsunuz?' },
      { role: 'user', text: 'I\'m currently earning £32,000 and I\'d like to move to £37,000, which reflects the additional responsibilities.', tr: 'Şu anda 32.000 £ kazanıyorum ve ek sorumlulukları yansıtan 37.000 £\'a geçmek istiyorum.' },
      { role: 'ai', text: 'I appreciate your contributions. I can offer £35,000, with a review in six months.', tr: 'Katkılarınızı takdir ediyorum. 35.000 £ teklif edebilirim, altı ay sonra bir incelemeyle birlikte.' },
      { role: 'user', text: 'I was hoping for a little more. Would £36,000 be possible?', tr: 'Biraz daha umuyordum. 36.000 £ mümkün olur mu?' },
      { role: 'ai', text: 'Let me check with the director and get back to you by end of week.', tr: 'Direktörle kontrol edeyim ve hafta sonuna kadar size döneyim.' },
    ],
    keyPhrases: [
      { phrase: 'I\'d like to discuss...', tr: '... görüşmek istiyorum' },
      { phrase: 'Exceeded my targets by 20%', tr: 'Hedeflerimi %20 aştım' },
      { phrase: 'Reflects the additional responsibilities', tr: 'Ek sorumlulukları yansıtıyor' },
      { phrase: 'With a review in six months', tr: 'Altı ay sonra bir incelemeyle' },
    ],
    tips: [
      'Always back up a salary request with specific achievements — numbers are most convincing.',
      '"I was hoping for a little more" is a polite counter-offer phrase.',
    ],
  },
  'Office Introduction': {
    aiName: 'Anna (Team Lead)',
    dialogue: [
      { role: 'ai', text: 'Good morning! Welcome to the team. I\'m Anna, your team lead. How are you feeling on your first day?', tr: 'Günaydın! Ekibe hoş geldiniz. Ben Anna, takım liderinizim. İlk gününüzde kendinizi nasıl hissediyorsunuz?' },
      { role: 'user', text: 'A little nervous, but really excited. There\'s so much to take in!', tr: 'Biraz gergin ama gerçekten heyecanlıyım. Öğrenecek çok şey var!' },
      { role: 'ai', text: 'That\'s completely normal. Let me introduce you to the rest of the team. This is Marco from the design department.', tr: 'Bu tamamen normal. Sizi ekibin geri kalanıyla tanıştırayım. Bu, tasarım departmanından Marco.' },
      { role: 'user', text: 'Nice to meet you, Marco! What does your team mainly work on?', tr: 'Tanıştığımıza memnun oldum, Marco! Ekibiniz ağırlıklı olarak ne üzerinde çalışıyor?' },
      { role: 'ai', text: 'Great question — we\'ll pair you with Marco for your first project. Now let me show you your workstation and the main tools we use.', tr: 'Güzel soru — ilk projeniz için sizi Marco ile eşleştireceğiz. Şimdi çalışma istasyonunuzu ve kullandığımız ana araçları göstereyim.' },
      { role: 'user', text: 'That sounds great. Where do most people have lunch — is there a canteen?', tr: 'Kulağa harika geliyor. Çoğu insan öğle yemeğini nerede yiyor — bir yemekhane var mı?' },
      { role: 'ai', text: 'There\'s a canteen on the 3rd floor, and lots of cafés nearby. We usually go together on Fridays — you\'re welcome to join!', tr: '3. katta bir yemekhane ve yakınlarda birçok kafe var. Genellikle Cuma günleri birlikte gidiyoruz — katılmaktan çekinmeyin!' },
      { role: 'user', text: 'I\'d love that. Thanks so much for making me feel so welcome.', tr: 'Bunu çok isterim. Beni bu kadar sıcak karşıladığınız için çok teşekkürler.' },
    ],
    keyPhrases: [
      { phrase: 'There\'s so much to take in', tr: 'Öğrenecek/kavrayacak çok şey var' },
      { phrase: 'Let me introduce you to...', tr: 'Sizi ... ile tanıştırayım' },
      { phrase: 'We\'ll pair you with...', tr: 'Sizi ... ile eşleştireceğiz' },
      { phrase: 'You\'re welcome to join', tr: 'Katılmaktan çekinmeyin' },
    ],
    tips: [
      '"There\'s so much to take in" is a natural phrase for overwhelming situations.',
      'Ask questions on your first day — "What does your team work on?" shows enthusiasm.',
    ],
  },
  'Work Complaint': {
    aiName: 'Ms. Turner (HR)',
    dialogue: [
      { role: 'user', text: 'Thank you for seeing me. I\'d like to raise a concern about my working conditions.', tr: 'Beni kabul ettiğiniz için teşekkürler. Çalışma koşullarımla ilgili bir endişeyi dile getirmek istiyorum.' },
      { role: 'ai', text: 'Of course. Everything discussed here is confidential. Please go ahead.', tr: 'Tabii ki. Burada görüşülen her şey gizlidir. Lütfen devam edin.' },
      { role: 'user', text: 'I\'ve been consistently asked to work late without extra compensation, which wasn\'t in my contract.', tr: 'Sözleşmemde olmayan ekstra tazminat olmaksızın sürekli olarak geç saatlere kadar çalışmam isteniyor.' },
      { role: 'ai', text: 'I see. How often does this happen, and have you spoken to your line manager about it?', tr: 'Anlıyorum. Bu ne sıklıkla oluyor ve birinci amiriniziyle bu konuştu mu?' },
      { role: 'user', text: 'It happens about three times a week. I mentioned it to my manager last month, but nothing has changed.', tr: 'Haftada yaklaşık üç kez oluyor. Geçen ay yöneticime değindim ama hiçbir şey değişmedi.' },
      { role: 'ai', text: 'Thank you for raising this formally. I\'d like you to fill in this incident log with dates and times.', tr: 'Bunu resmi olarak gündeme getirdiğiniz için teşekkürler. Tarih ve saatlerle bu olay günlüğünü doldurmanızı istiyorum.' },
      { role: 'user', text: 'I\'ve already kept a record. I can email it to you.', tr: 'Zaten kayıt tuttum. Size e-posta ile gönderebilirim.' },
      { role: 'ai', text: 'That would be very helpful. We\'ll investigate this and come back to you within five working days.', tr: 'Bu çok yardımcı olacak. Bunu araştıracağız ve beş iş günü içinde size döneceğiz.' },
    ],
    keyPhrases: [
      { phrase: 'I\'d like to raise a concern about...', tr: '... hakkında endişe dile getirmek istiyorum' },
      { phrase: 'This is confidential', tr: 'Bu gizlidir' },
      { phrase: 'My line manager', tr: 'Birinci amirim' },
      { phrase: 'Within five working days', tr: 'Beş iş günü içinde' },
    ],
    tips: [
      '"Raise a concern" is more professional than "complain about" in formal settings.',
      'Keeping a record of incidents (with dates) strengthens any formal complaint.',
    ],
  },
  'Team Meeting': {
    aiName: 'Ben (Team Manager)',
    dialogue: [
      { role: 'ai', text: 'Right, let\'s get started. Thanks everyone for being on time. First, let\'s review last week\'s action points.', tr: 'Hadi başlayalım. Herkesin zamanında gelmesi için teşekkürler. Önce geçen haftanın eylem noktalarını gözden geçirelim.' },
      { role: 'user', text: 'I completed the client report and sent it over on Thursday.', tr: 'Müşteri raporunu tamamladım ve Perşembe günü gönderdim.' },
      { role: 'ai', text: 'Good. Any blockers on the website update, Sam?', tr: 'İyi. Web sitesi güncellemesinde herhangi bir engel var mı, Sam?' },
      { role: 'user', text: 'We\'re still waiting on the legal team to approve the terms and conditions. I expect it by Friday.', tr: 'Hukuk ekibinin şartlar ve koşulları onaylamasını bekliyoruz. Cuma\'ya kadar bekliyorum.' },
      { role: 'ai', text: 'OK, I\'ll chase them. Now, the main agenda item today — our Q4 strategy.', tr: 'Tamam, onları takip edeceğim. Şimdi, bugünkü ana gündem maddesi — Q4 stratejimiz.' },
      { role: 'user', text: 'Should we focus on acquiring new clients or retaining existing ones?', tr: 'Yeni müşteriler kazanmaya mı yoksa mevcut olanları elde tutmaya mı odaklanmalıyız?' },
      { role: 'ai', text: 'Good question. I\'d say retention first. Can you look into our churn rate and present the data next week?', tr: 'İyi soru. Önce elde tutma diyebilirim. Müşteri kaybetme oranımızı inceleyip verileri gelecek hafta sunar mısınız?' },
      { role: 'user', text: 'Sure, I\'ll prepare a short analysis by Tuesday.', tr: 'Tabii, Salı gününe kadar kısa bir analiz hazırlayacağım.' },
    ],
    keyPhrases: [
      { phrase: 'Review the action points', tr: 'Eylem noktalarını gözden geçirmek' },
      { phrase: 'We\'re still waiting on...', tr: 'Hâlâ ... bekliyoruz' },
      { phrase: 'I\'ll chase them', tr: 'Onları takip edeceğim' },
      { phrase: 'Churn rate', tr: 'Müşteri kaybetme oranı' },
    ],
    tips: [
      '"Any blockers?" is a common Agile/Scrum phrase meaning "Is anything stopping your progress?"',
      '"I\'ll chase them" means you\'ll follow up with someone to get a response.',
    ],
  },
  'Pharmacy Visit': {
    aiName: 'Dr. Kim (Pharmacist)',
    dialogue: [
      { role: 'user', text: 'Hi. I have a prescription from my doctor.', tr: 'Merhaba. Doktorumdan reçetem var.' },
      { role: 'ai', text: 'Of course. Let me check it… Right, this is for amoxicillin, 500mg, twice a day for seven days. Have you taken this before?', tr: 'Tabii ki. Bir bakayım… Tamam, bu amoksisilin, 500mg, yedi gün boyunca günde iki kez. Daha önce aldınız mı?' },
      { role: 'user', text: 'Yes, I have. Are there any side effects I should know about?', tr: 'Evet, aldım. Bilmem gereken yan etkiler var mı?' },
      { role: 'ai', text: 'Some people experience nausea or diarrhoea. Take it with food to reduce stomach discomfort.', tr: 'Bazı kişilerde bulantı veya ishal görülebilir. Mide rahatsızlığını azaltmak için yemekle birlikte alın.' },
      { role: 'user', text: 'Can I drink alcohol while taking it?', tr: 'İçerken alkol alabilir miyim?' },
      { role: 'ai', text: 'It\'s best to avoid alcohol, as it can reduce the effectiveness of the antibiotic and worsen side effects.', tr: 'Alkolden kaçınmak en iyisi, çünkü antibiyotiğin etkinliğini azaltabilir ve yan etkileri kötüleştirebilir.' },
      { role: 'user', text: 'What if I miss a dose?', tr: 'Bir dozu kaçırırsam ne yapmalıyım?' },
      { role: 'ai', text: 'Take it as soon as you remember, unless it\'s almost time for your next dose. Never double up.', tr: 'Hatırlar hatırlamaz alın, bir sonraki dozunuz yakın değilse. Hiçbir zaman çift doz almayın.' },
    ],
    keyPhrases: [
      { phrase: 'I have a prescription', tr: 'Reçetem var' },
      { phrase: 'Are there any side effects?', tr: 'Yan etkiler var mı?' },
      { phrase: 'Take it with food', tr: 'Yemekle birlikte alın' },
      { phrase: 'Never double up', tr: 'Hiçbir zaman çift doz almayın' },
    ],
    tips: [
      '"Take it as soon as you remember" — this pattern (imperative + time clause) is common in medical instructions.',
      'Always ask about interactions with food or alcohol when getting new medication.',
    ],
  },
  'Emergency Room': {
    aiName: 'Nurse Sarah',
    dialogue: [
      { role: 'ai', text: 'Can you tell me what\'s happened?', tr: 'Ne olduğunu anlatır mısınız?' },
      { role: 'user', text: 'My friend fell off his bike and hit his head. He lost consciousness briefly but is awake now.', tr: 'Arkadaşım bisikletinden düştü ve kafasını çarptı. Kısa süre bilincini kaybetti ama şu an uyanık.' },
      { role: 'ai', text: 'OK, that\'s a priority case. Does he have any pain now?', tr: 'Tamam, bu öncelikli bir vaka. Şu an herhangi bir acısı var mı?' },
      { role: 'user', text: 'Yes, he has a bad headache and his vision is blurry.', tr: 'Evet, şiddetli baş ağrısı var ve görüşü bulanık.' },
      { role: 'ai', text: 'Any allergies we should know about? Is he on any regular medication?', tr: 'Bilmemiz gereken herhangi bir alerjisi var mı? Düzenli ilaç kullanıyor mu?' },
      { role: 'user', text: 'He\'s allergic to penicillin. No regular medication.', tr: 'Penisiline alerjisi var. Düzenli ilaç kullanmıyor.' },
      { role: 'ai', text: 'Thank you. The doctor will see him immediately. Please fill in this form with his personal details.', tr: 'Teşekkürler. Doktor onu hemen görecek. Lütfen bu formu kişisel bilgileriyle doldurun.' },
      { role: 'user', text: 'Of course. Will he need to stay overnight?', tr: 'Tabii ki. Gece kalmak zorunda mı?' },
    ],
    keyPhrases: [
      { phrase: 'He lost consciousness briefly', tr: 'Kısa süreliğine bilincini kaybetti' },
      { phrase: 'Any allergies?', tr: 'Herhangi bir alerjisi var mı?' },
      { phrase: 'Priority case', tr: 'Öncelikli vaka' },
      { phrase: 'He\'ll be seen immediately', tr: 'Hemen görülecek' },
    ],
    tips: [
      'In an emergency, give the most critical information first: what happened, current symptoms.',
      'Always mention allergies and current medications — this is vital medical information.',
    ],
  },
  'Dentist Appointment': {
    aiName: 'Dr. Patel (Dentist)',
    dialogue: [
      { role: 'ai', text: 'Hello! What brings you in today?', tr: 'Merhaba! Bugün sizi buraya ne getirdi?' },
      { role: 'user', text: 'I\'ve had a sharp pain in my lower left tooth for about four days.', tr: 'Yaklaşık dört gündür sol alt dişimde keskin bir ağrı var.' },
      { role: 'ai', text: 'Is the pain constant, or does it come on when you eat or drink something hot or cold?', tr: 'Ağrı sürekli mi, yoksa sıcak veya soğuk bir şey yiyip içtiğinizde mi oluşuyor?' },
      { role: 'user', text: 'It\'s worse with cold drinks. And there\'s a bit of swelling in my gum.', tr: 'Soğuk içeceklerle daha kötü oluyor. Ayrıca dişetimde biraz şişlik var.' },
      { role: 'ai', text: 'I see. Let me take an X-ray. Open wide, please.', tr: 'Anlıyorum. Bir X-ray çekelim. Lütfen ağzınızı açın.' },
      { role: 'user', text: 'Is it serious? I\'m worried it might need to be removed.', tr: 'Ciddi mi? Çekilmesi gerekebileceğinden endişeleniyorum.' },
      { role: 'ai', text: 'The X-ray shows a deep cavity. We can do a root canal to save the tooth — it\'s a straightforward procedure.', tr: 'X-ray derin bir çürük gösteriyor. Dişi kurtarmak için kanal tedavisi yapabiliriz — basit bir işlem.' },
      { role: 'user', text: 'OK. Is it painful? And how many appointments will I need?', tr: 'Tamam. Ağrılı mı? Kaç randevuya ihtiyacım olacak?' },
    ],
    keyPhrases: [
      { phrase: 'I\'ve had a pain in my... for X days', tr: 'X gündür ... ağrım var' },
      { phrase: 'It\'s worse with cold/hot...', tr: 'Soğuk/sıcak ... ile daha kötü' },
      { phrase: 'Root canal', tr: 'Kanal tedavisi' },
      { phrase: 'How many appointments will I need?', tr: 'Kaç randevuya ihtiyacım olacak?' },
    ],
    tips: [
      'Describe when pain is worse: "It\'s worse with cold drinks" gives the doctor key diagnostic info.',
      '"How many appointments?" and "Is it painful?" are natural questions to ask a dentist.',
    ],
  },
  'Health Insurance': {
    aiName: 'Kevin (Insurance Agent)',
    dialogue: [
      { role: 'user', text: 'Hi, I\'m thinking about taking out health insurance. Can you explain what\'s covered?', tr: 'Merhaba, sağlık sigortası yaptırmayı düşünüyorum. Nelerin kapsandığını açıklar mısınız?' },
      { role: 'ai', text: 'Of course. Our standard plan covers GP visits, specialist referrals, hospital stays, and emergency treatment.', tr: 'Tabii ki. Standart planımız GP ziyaretlerini, uzman yönlendirmelerini, hastane yatışlarını ve acil tedaviyi kapsar.' },
      { role: 'user', text: 'What about dental and optical?', tr: 'Diş ve göz sağlığı nasıl?' },
      { role: 'ai', text: 'Those are available as optional add-ons for £15 extra per month. Dental covers two check-ups a year and basic treatment.', tr: 'Bunlar aylık 15 £ ek ücretle isteğe bağlı ekler olarak mevcuttur. Diş hekimi yılda iki kontrol ve temel tedaviyi kapsar.' },
      { role: 'user', text: 'What\'s the monthly premium for the standard plan?', tr: 'Standart plan için aylık prim ne kadar?' },
      { role: 'ai', text: 'It\'s £45 a month for a single adult. There\'s also a £100 annual excess — that\'s what you pay before the insurance covers the rest.', tr: 'Tek yetişkin için aylık 45 £. Ayrıca 100 £ yıllık muafiyet var — sigorta geri kalanını karşılamadan önce ödediğiniz miktar.' },
      { role: 'user', text: 'Can I get a quote and think it over before committing?', tr: 'Karar vermeden önce bir teklif alıp düşünebilir miyim?' },
      { role: 'ai', text: 'Absolutely. I\'ll email you a personalised quote today. There\'s no obligation to proceed.', tr: 'Kesinlikle. Bugün size kişiselleştirilmiş bir teklif e-posta ile göndereceğim. Devam etme zorunluluğu yok.' },
    ],
    keyPhrases: [
      { phrase: 'Take out insurance', tr: 'Sigorta yaptırmak' },
      { phrase: 'What\'s covered?', tr: 'Neler kapsanıyor?' },
      { phrase: 'Optional add-ons', tr: 'İsteğe bağlı ekler' },
      { phrase: 'Annual excess', tr: 'Yıllık muafiyet (franchise)' },
    ],
    tips: [
      '"Take out" (insurance/a loan) = start paying for something official — not "take" alone.',
      '"No obligation to proceed" = you don\'t have to buy anything.',
    ],
  },
  'Eye Doctor': {
    aiName: 'Dr. Lee (Optometrist)',
    dialogue: [
      { role: 'ai', text: 'Hello! Have you had an eye test before?', tr: 'Merhaba! Daha önce göz testi yaptırdınız mı?' },
      { role: 'user', text: 'Yes, about two years ago. Lately I\'ve been struggling to read small text.', tr: 'Evet, yaklaşık iki yıl önce. Son zamanlarda küçük yazıları okumakta zorlanıyorum.' },
      { role: 'ai', text: 'I see. Any headaches, especially when reading or using a screen?', tr: 'Anlıyorum. Özellikle okurken veya ekran kullanırken baş ağrısı oluyor mu?' },
      { role: 'user', text: 'Yes, quite often in the evenings after work.', tr: 'Evet, iş sonrası akşamları oldukça sık.' },
      { role: 'ai', text: 'That\'s a common sign of eye strain. Let\'s do a full test. Please read the letters on the chart for me.', tr: 'Bu yaygın bir göz yorgunluğu belirtisi. Tam bir test yapalım. Lütfen şemadaki harfleri okuyun.' },
      { role: 'user', text: 'E, F, P, T, O… The bottom rows are blurry.', tr: 'E, F, P, T, O… Alt satırlar bulanık.' },
      { role: 'ai', text: 'You have mild short-sightedness. I\'d recommend glasses for reading and screen use.', tr: 'Hafif miyopiniz var. Okuma ve ekran kullanımı için gözlük tavsiye ederim.' },
      { role: 'user', text: 'Can I have contact lenses instead?', tr: 'Onun yerine kontakt lens takabilir miyim?' },
    ],
    keyPhrases: [
      { phrase: 'I\'ve been struggling to...', tr: '... ile zorlanıyorum' },
      { phrase: 'Eye strain', tr: 'Göz yorgunluğu' },
      { phrase: 'Mild short-sightedness', tr: 'Hafif miyopi' },
      { phrase: 'Can I have ... instead?', tr: 'Onun yerine ... alabilir miyim?' },
    ],
    tips: [
      '"I\'ve been struggling to read" uses the present perfect continuous to describe an ongoing problem.',
      '"Instead" at the end of a question is a natural way to suggest an alternative.',
    ],
  },
  'Clothes Fitting': {
    aiName: 'Nina (Shop Assistant)',
    dialogue: [
      { role: 'user', text: 'Excuse me. I\'m looking for these jeans in a size 32.', tr: 'Özür dilerim. Bu kotları 32 beden arıyorum.' },
      { role: 'ai', text: 'Let me check the stock… We have size 32 in the dark wash and the light wash. Which would you prefer?', tr: 'Stoğa bakayım… 32 beden olarak koyu ve açık yıkamada mevcut. Hangisini tercih edersiniz?' },
      { role: 'user', text: 'I\'ll try the dark wash. Where are the changing rooms?', tr: 'Koyu yıkamayı deneyeceğim. Soyunma odaları nerede?' },
      { role: 'ai', text: 'Just at the back on the right. Can I take those for you?', tr: 'Arkada sağda. Onları alayım mı?' },
      { role: 'user', text: 'Thank you. The waist fits but the legs are a little long. Can they be shortened?', tr: 'Teşekkürler. Bel oturuyor ama bacaklar biraz uzun. Kısaltılabilir mi?' },
      { role: 'ai', text: 'Yes, we offer free alterations. The tailor is in on Tuesdays and Thursdays. It takes about a week.', tr: 'Evet, ücretsiz düzeltme hizmeti sunuyoruz. Terzi Salı ve Perşembe günleri geliyor. Yaklaşık bir hafta sürer.' },
      { role: 'user', text: 'That\'s fine. How much are they?', tr: 'Sorun değil. Fiyatı ne kadar?' },
      { role: 'ai', text: 'They\'re £65. We also have 20% off all denim this week if you\'d like to grab a second pair.', tr: '65 £. Eğer ikinci bir çift almak isterseniz bu hafta tüm denimlerde %20 indirim de var.' },
    ],
    keyPhrases: [
      { phrase: 'Do you have this in a size...?', tr: 'Bunun ... bedeni var mı?' },
      { phrase: 'Where are the changing rooms?', tr: 'Soyunma odaları nerede?' },
      { phrase: 'The waist fits but the legs are too long', tr: 'Bel oturuyor ama bacaklar çok uzun' },
      { phrase: 'Free alterations', tr: 'Ücretsiz düzeltme' },
    ],
    tips: [
      '"It fits" vs "It suits me" — "fits" is about size/shape; "suits" is about style/colour matching you.',
      '"Can they be shortened?" — use "can + passive" for asking if something is possible.',
    ],
  },
  'Bargaining at Market': {
    aiName: 'Pedro (Market Vendor)',
    dialogue: [
      { role: 'user', text: 'How much is this leather bag?', tr: 'Bu deri çanta ne kadar?' },
      { role: 'ai', text: 'This one is 80 euros. It\'s genuine leather, handmade — very high quality.', tr: 'Bu 80 euro. Gerçek deri, el yapımı — çok yüksek kalite.' },
      { role: 'user', text: 'It\'s nice, but that\'s a bit over my budget. Would you take 55?', tr: 'Güzel, ama bu bütçemin biraz üstünde. 55 kabul eder misiniz?' },
      { role: 'ai', text: 'Fifty-five is too low, my friend. I can do 70, and I\'ll throw in a matching wallet.', tr: 'Elli beş çok düşük, dostum. 70 yapabilirim, üzerine eşleşen bir cüzdan da ekleyeyim.' },
      { role: 'user', text: 'That\'s a good offer. Could you go to 65 with the wallet?', tr: 'Bu iyi bir teklif. Cüzdanla birlikte 65\'e gelebilir misiniz?' },
      { role: 'ai', text: 'You drive a hard bargain! OK, 65 with the wallet — final offer.', tr: 'Çok pazarlıklısın! Tamam, cüzdanla birlikte 65 — son teklifim.' },
      { role: 'user', text: 'Deal! Do you accept card or cash only?', tr: 'Anlaştık! Kart kabul ediyor musunuz yoksa sadece nakit mi?' },
      { role: 'ai', text: 'Cash only, I\'m afraid. There\'s an ATM just around the corner.', tr: 'Maalesef sadece nakit. Köşenin hemen ötesinde bir ATM var.' },
    ],
    keyPhrases: [
      { phrase: 'That\'s a bit over my budget', tr: 'Bu bütçemin biraz üstünde' },
      { phrase: 'Would you take...?', tr: '... kabul eder misiniz?' },
      { phrase: 'I\'ll throw in...', tr: '... üzerine ekleyeyim' },
      { phrase: 'You drive a hard bargain', tr: 'Çok pazarlıklısın' },
    ],
    tips: [
      '"Would you take £55?" is the key bargaining phrase — more polite than "Give it to me for £55."',
      '"I\'ll throw in..." means adding something for free as a deal sweetener.',
    ],
  },
  'Electronics Purchase': {
    aiName: 'Ryan (Sales Associate)',
    dialogue: [
      { role: 'user', text: 'Hi. I\'m looking for a laptop for university. My budget is around £600.', tr: 'Merhaba. Üniversite için dizüstü bilgisayar arıyorum. Bütçem yaklaşık 600 £.' },
      { role: 'ai', text: 'Great! What will you mainly use it for — writing, design, or programming?', tr: 'Harika! Ağırlıklı olarak ne için kullanacaksınız — yazı yazmak, tasarım veya programlama?' },
      { role: 'user', text: 'Mainly writing and research. Battery life is important as I\'ll be in lectures all day.', tr: 'Ağırlıklı olarak yazı yazma ve araştırma. Gün boyu derste olacağım için pil ömrü önemli.' },
      { role: 'ai', text: 'In that case, I\'d recommend this model — it has a 15-hour battery and a lightweight design at £549.', tr: 'Bu durumda bu modeli öneririm — 15 saatlik pil ve hafif tasarımıyla 549 £.' },
      { role: 'user', text: 'Does it come with a warranty?', tr: 'Garantisi var mı?' },
      { role: 'ai', text: 'Yes, one year manufacturer\'s warranty. You can extend it to three years for £79.', tr: 'Evet, bir yıl üretici garantisi. 79 £\'a üç yıla kadar uzatabilirsiniz.' },
      { role: 'user', text: 'I\'ll take the extended warranty. Can I trade in my old laptop?', tr: 'Uzatılmış garantiyi alacağım. Eski dizüstü bilgisayarımı takas edebilir miyim?' },
      { role: 'ai', text: 'Yes! Bring it in and we\'ll assess it. You could get up to £80 off.', tr: 'Evet! Getirin, değerlendireceğiz. 80 £\'a kadar indirim alabilirsiniz.' },
    ],
    keyPhrases: [
      { phrase: 'My budget is around...', tr: 'Bütçem yaklaşık ...' },
      { phrase: 'Battery life', tr: 'Pil ömrü' },
      { phrase: 'Does it come with a warranty?', tr: 'Garantisi var mı?' },
      { phrase: 'Can I trade in my old...?', tr: 'Eski ... takas edebilir miyim?' },
    ],
    tips: [
      'Start with your budget and main use case — this helps the assistant recommend the right product.',
      '"Trade in" means exchanging your old item as part-payment for a new one.',
    ],
  },
  'Supermarket Help': {
    aiName: 'Store Staff',
    dialogue: [
      { role: 'user', text: 'Excuse me, I\'m looking for tahini. Which aisle would that be in?', tr: 'Özür dilerim, tahin arıyorum. Hangi rafta bulunur?' },
      { role: 'ai', text: 'Tahini is in aisle 7, with the world foods and speciality ingredients.', tr: 'Tahin, 7. rafta dünya yemekleri ve özel malzemeler bölümünde.' },
      { role: 'user', text: 'Thanks. Also, do you stock any lactose-free milk?', tr: 'Teşekkürler. Ayrıca laktoz içermeyen süt satıyor musunuz?' },
      { role: 'ai', text: 'Yes, we have several brands in the dairy aisle — aisle 4, next to the regular milk.', tr: 'Evet, 4. rafta, normal sütün yanında birkaç marka var.' },
      { role: 'user', text: 'Perfect. I also can\'t find the self-checkout machines. Are they still here?', tr: 'Mükemmel. Self-servis kasaları da bulamıyorum. Hâlâ burada mı?' },
      { role: 'ai', text: 'We moved them to the exit on the left. There\'s also a staffed checkout open if the queue is long.', tr: 'Onları soldaki çıkışa taşıdık. Kuyruk uzunsa, personelli kasa da açık.' },
      { role: 'user', text: 'Great, thank you. One more thing — where can I find the customer toilets?', tr: 'Harika, teşekkürler. Bir şey daha — müşteri tuvaletleri nerede?' },
      { role: 'ai', text: 'Down the main corridor, past the bakery, on your right.', tr: 'Ana koridordan ilerleyip fırının geçerek sağınızda.' },
    ],
    keyPhrases: [
      { phrase: 'Which aisle would that be in?', tr: 'Hangi rafta bulunur?' },
      { phrase: 'Do you stock...?', tr: '... satıyor musunuz / stokta var mı?' },
      { phrase: 'Next to...', tr: '...\'nin yanında' },
      { phrase: 'Past the bakery', tr: 'Fırının ötesinde / geçerek' },
    ],
    tips: [
      '"Do you stock...?" is the natural way to ask if a shop sells something specific.',
      'Use "past" for directions: "past the bakery" = go beyond the bakery.',
    ],
  },
  'Restaurant Order': {
    aiName: 'Maria (Waiter)',
    dialogue: [
      { role: 'ai', text: 'Good evening! Welcome. Do you have a reservation?', tr: 'İyi akşamlar! Hoş geldiniz. Rezervasyonunuz var mı?' },
      { role: 'user', text: 'Yes, for two, under the name Chen.', tr: 'Evet, iki kişilik, Chen adına.' },
      { role: 'ai', text: 'Perfect, follow me please. Here\'s your table. Can I start you off with some drinks?', tr: 'Mükemmel, lütfen beni takip edin. İşte masanız. Başlangıç için içecek alabilir miyim?' },
      { role: 'user', text: 'A sparkling water for me, and my friend will have an orange juice, please.', tr: 'Benim için soda ve arkadaşım portakal suyu alacak, lütfen.' },
      { role: 'ai', text: 'Of course. Are you ready to order, or would you like a few more minutes?', tr: 'Tabii ki. Sipariş vermek istiyor musunuz, yoksa birkaç dakika daha ister misiniz?' },
      { role: 'user', text: 'We\'re ready. I\'ll have the grilled salmon with the seasonal vegetables, please.', tr: 'Hazırız. Mevsim sebzeleriyle ızgara somon alacağım, lütfen.' },
      { role: 'ai', text: 'Excellent choice. And for your friend?', tr: 'Mükemmel seçim. Arkadaşınız için?' },
      { role: 'user', text: 'She\'ll have the mushroom risotto. Could we also get some bread to start?', tr: 'O mantar risotto alacak. Başlangıç olarak biraz ekmek de alabilir miyiz?' },
    ],
    keyPhrases: [
      { phrase: 'Can I start you off with drinks?', tr: 'Başlangıç için içecek alabilir miyim?' },
      { phrase: 'We\'re ready to order', tr: 'Sipariş vermek için hazırız' },
      { phrase: 'I\'ll have the...', tr: '... alacağım' },
      { phrase: 'Could we also get...?', tr: '... de alabilir miyiz?' },
    ],
    tips: [
      '"I\'ll have the salmon" is the standard way to order — say "the" + dish name.',
      '"Could we also get some bread?" — use "also" to add items to an order politely.',
    ],
  },
  'Food Allergy': {
    aiName: 'Chef Mike (Restaurant)',
    dialogue: [
      { role: 'user', text: 'Excuse me, I have a severe nut allergy. Can you tell me which dishes are safe?', tr: 'Özür dilerim, ağır bir kuruyemiş alerjim var. Hangi yemeklerin güvenli olduğunu söyleyebilir misiniz?' },
      { role: 'ai', text: 'Of course — your safety is our priority. Which nuts are you allergic to?', tr: 'Tabii ki — güvenliğiniz bizim önceliğimiz. Hangi kuruyemişlere alerjiniz var?' },
      { role: 'user', text: 'All tree nuts — walnuts, cashews, almonds. Even a small trace can cause anaphylaxis.', tr: 'Tüm ağaç fıstıkları — ceviz, kaju, badem. Küçük bir iz bile anafilaksiye yol açabilir.' },
      { role: 'ai', text: 'Thank you for letting me know. Our pasta primavera and grilled chicken are nut-free. The kitchen will prepare yours on a clean surface.', tr: 'Bize bildirdiğiniz için teşekkürler. Makarna primavera ve ızgara tavuğumuz fıstık içermez. Mutfak sizinkini temiz bir yüzeyde hazırlayacak.' },
      { role: 'user', text: 'Does the salad dressing contain any nuts?', tr: 'Salata sosu kuruyemiş içeriyor mu?' },
      { role: 'ai', text: 'The house dressing has sesame — is that a problem? I can substitute olive oil and lemon.', tr: 'Ev sosu susam içeriyor — bu bir sorun mu? Zeytinyağı ve limonla değiştirebilirim.' },
      { role: 'user', text: 'Sesame is fine, thank you. I just want to make sure there\'s no cross-contamination.', tr: 'Susam sorun değil, teşekkürler. Sadece çapraz bulaşma olmadığından emin olmak istiyorum.' },
      { role: 'ai', text: 'Absolutely understood. I\'ll personally ensure your dish is prepared safely.', tr: 'Kesinlikle anlaşıldı. Yemeğinizin güvenli şekilde hazırlandığından şahsen emin olacağım.' },
    ],
    keyPhrases: [
      { phrase: 'I have a severe ... allergy', tr: 'Ağır bir ... alerjim var' },
      { phrase: 'Even a small trace', tr: 'Küçük bir iz bile' },
      { phrase: 'Cross-contamination', tr: 'Çapraz bulaşma' },
      { phrase: 'I can substitute...', tr: '... ile değiştirebilirim' },
    ],
    tips: [
      'Mention severity: "severe allergy" or "can cause anaphylaxis" ensures staff take it seriously.',
      '"Cross-contamination" is the technical term for when safe food touches surfaces that had allergens.',
    ],
  },
  'Asking for the Bill': {
    aiName: 'Tom (Waiter)',
    dialogue: [
      { role: 'user', text: 'Excuse me, could we have the bill, please?', tr: 'Özür dilerim, hesabı alabilir miyiz lütfen?' },
      { role: 'ai', text: 'Of course! I\'ll bring it right over. Did you enjoy your meal?', tr: 'Tabii ki! Hemen getireyim. Yemeğinizden zevk aldınız mı?' },
      { role: 'user', text: 'Yes, it was delicious — especially the starter. We\'ll definitely come back.', tr: 'Evet, harikaydı — özellikle başlangıç. Kesinlikle tekrar geleceğiz.' },
      { role: 'ai', text: 'Wonderful to hear! Here\'s your bill. The total is £74.50.', tr: 'Bunu duymak harika! İşte hesabınız. Toplam 74,50 £.' },
      { role: 'user', text: 'Can we split the bill? Half each.', tr: 'Hesabı bölebilir miyiz? Her biri yarısını.' },
      { role: 'ai', text: 'No problem at all. Two payments of £37.25. Shall I take card?', tr: 'Sorun değil. İki kez 37,25 £. Kartla mı alayım?' },
      { role: 'user', text: 'Yes please. Is the service charge included?', tr: 'Evet lütfen. Servis ücreti dahil mi?' },
      { role: 'ai', text: 'A 12.5% service charge is included. But any extra tip is of course welcome!', tr: '%12,5 servis ücreti dahildir. Ancak ek bahşiş tabii ki memnuniyetle karşılanır!' },
    ],
    keyPhrases: [
      { phrase: 'Could we have the bill, please?', tr: 'Hesabı alabilir miyiz lütfen?' },
      { phrase: 'Can we split the bill?', tr: 'Hesabı bölebilir miyiz?' },
      { phrase: 'Half each', tr: 'Her biri yarısını' },
      { phrase: 'Is the service charge included?', tr: 'Servis ücreti dahil mi?' },
    ],
    tips: [
      '"Could we have the bill?" (UK English) = "Could we have the check?" (US English).',
      '"Split the bill" or "go Dutch" — both mean everyone pays their share.',
    ],
  },
  'Cooking Class': {
    aiName: 'Chef Julia',
    dialogue: [
      { role: 'ai', text: 'Welcome everyone! Today we\'re making fresh pasta from scratch. Have any of you made pasta before?', tr: 'Herkese hoş geldiniz! Bugün sıfırdan taze makarna yapıyoruz. Hiç makarna yaptınız mı?' },
      { role: 'user', text: 'Never! I\'m really excited but a little nervous about getting it right.', tr: 'Hiç yapmadım! Gerçekten heyecanlıyım ama doğru yapmak konusunda biraz gerginim.' },
      { role: 'ai', text: 'Don\'t worry — it\'s simpler than it looks. First, make a well in the centre of your flour and crack two eggs into it.', tr: 'Endişelenme — göründüğünden daha basit. Önce ununun ortasında bir çukur aç ve içine iki yumurta kır.' },
      { role: 'user', text: 'Like this? How long should I knead the dough?', tr: 'Böyle mi? Hamuru ne kadar yoğurmalıyım?' },
      { role: 'ai', text: 'Exactly right! Knead for about ten minutes until it\'s smooth and elastic. If it sticks, add a little flour.', tr: 'Tam doğru! Pürüzsüz ve elastik olana kadar yaklaşık on dakika yoğurun. Yapışırsa biraz un ekleyin.' },
      { role: 'user', text: 'What happens if I over-knead it?', tr: 'Fazla yoğurursam ne olur?' },
      { role: 'ai', text: 'The gluten becomes too tight and the pasta will be tough. Ten minutes is the sweet spot. Let it rest for thirty minutes, then we\'ll roll it out.', tr: 'Glüten çok sıkı olur ve makarna sert olur. On dakika idealdir. Otuz dakika dinlendirin, sonra açacağız.' },
      { role: 'user', text: 'This is brilliant — I never knew pasta was so straightforward!', tr: 'Bu harika — makarnanın bu kadar basit olduğunu hiç bilmiyordum!' },
    ],
    keyPhrases: [
      { phrase: 'From scratch', tr: 'Sıfırdan, baştan' },
      { phrase: 'Make a well in the flour', tr: 'Unda çukur açmak' },
      { phrase: 'Knead the dough', tr: 'Hamuru yoğurmak' },
      { phrase: 'The sweet spot', tr: 'İdeal nokta' },
    ],
    tips: [
      '"From scratch" means making something yourself from basic ingredients — not from a packet.',
      '"The sweet spot" means the ideal amount or point, not too much, not too little.',
    ],
  },
  'Bank Account Opening': {
    aiName: 'Kate (Bank Advisor)',
    dialogue: [
      { role: 'user', text: 'Hello. I\'d like to open a current account, please.', tr: 'Merhaba. Bir vadesiz hesap açmak istiyorum, lütfen.' },
      { role: 'ai', text: 'Of course! Do you have any form of ID with you today, such as a passport or driving licence?', tr: 'Tabii ki! Bugün yanınızda pasaport veya ehliyet gibi bir kimlik belgesi var mı?' },
      { role: 'user', text: 'I have my passport and a recent utility bill.', tr: 'Pasaportunum ve son bir fatura var.' },
      { role: 'ai', text: 'Perfect — that\'s exactly what we need for proof of identity and address. Are you employed or self-employed?', tr: 'Mükemmel — kimlik ve adres kanıtı için tam olarak ihtiyacımız olan bu. Çalışıyor musunuz yoksa serbest meslek sahibi misiniz?' },
      { role: 'user', text: 'I\'m employed. I\'ve just started a new job.', tr: 'Çalışıyorum. Yeni bir işe yeni başladım.' },
      { role: 'ai', text: 'We have two options: a standard account with no monthly fee, and a premium account at £8 a month with cashback and travel insurance.', tr: 'İki seçeneğimiz var: aylık ücretsiz standart hesap ve aylık 8 £ karşılığında nakit iadesi ve seyahat sigortasıyla premium hesap.' },
      { role: 'user', text: 'I\'ll go with the standard account for now. How long does it take to set up?', tr: 'Şimdilik standart hesabı tercih ediyorum. Kurulumu ne kadar sürer?' },
      { role: 'ai', text: 'We can open it today. Your card will arrive within three to five working days.', tr: 'Bugün açabiliriz. Kartınız üç ila beş iş günü içinde gelecek.' },
    ],
    keyPhrases: [
      { phrase: 'Open a current account', tr: 'Vadesiz hesap açmak' },
      { phrase: 'Proof of address', tr: 'Adres kanıtı' },
      { phrase: 'Self-employed', tr: 'Serbest meslek sahibi' },
      { phrase: 'Your card will arrive within...', tr: 'Kartınız ... içinde gelecek' },
    ],
    tips: [
      'In the UK, a "current account" = everyday bank account; a "savings account" = for saving money.',
      '"Proof of address" — a utility bill or bank statement from the last 3 months is usually accepted.',
    ],
  },
  'Post Office': {
    aiName: 'Staff Member',
    dialogue: [
      { role: 'user', text: 'Hi. I need to send this parcel to Australia.', tr: 'Merhaba. Bu paketi Avustralya\'ya göndermem gerekiyor.' },
      { role: 'ai', text: 'Let me weigh it for you… It\'s 1.4 kilos. Would you like standard or express delivery?', tr: 'Sizin için tartayım… 1,4 kilo. Standart mı hızlı teslimat mı istersiniz?' },
      { role: 'user', text: 'How long does standard take?', tr: 'Standart ne kadar sürer?' },
      { role: 'ai', text: 'Standard international takes 7 to 10 working days and costs £18.50. Express is 3 to 5 days and costs £34.', tr: 'Standart uluslararası 7 ila 10 iş günü sürer ve 18,50 £ tutar. Hızlı teslimat 3 ila 5 gün ve 34 £ tutar.' },
      { role: 'user', text: 'Standard is fine. Can I get tracking on that?', tr: 'Standart yeterli. Takip hizmeti alabilir miyim?' },
      { role: 'ai', text: 'Yes, tracking is included with both options. Is there anything fragile inside?', tr: 'Evet, takip her iki seçeneğe de dahil. İçinde kırılabilecek bir şey var mı?' },
      { role: 'user', text: 'Yes, there\'s some glassware. Should I add extra packaging?', tr: 'Evet, bazı cam eşyalar var. Ekstra ambalaj eklemem gerekir mi?' },
      { role: 'ai', text: 'I\'d recommend it. We sell bubble wrap and padding at the counter. It\'ll give you more peace of mind.', tr: 'Öneririm. Kasada baloncuklu naylon ve dolgu satıyoruz. Bu size daha fazla güvence sağlar.' },
    ],
    keyPhrases: [
      { phrase: 'I need to send this parcel to...', tr: 'Bu paketi ...\' ya göndermem gerekiyor' },
      { phrase: 'Standard or express delivery?', tr: 'Standart mı hızlı teslimat mı?' },
      { phrase: 'Can I get tracking?', tr: 'Takip hizmeti alabilir miyim?' },
      { phrase: 'Peace of mind', tr: 'Güvence, gönül rahatlığı' },
    ],
    tips: [
      '"Can I get tracking on that?" is natural — "on that" refers to the item/service just mentioned.',
      '"Peace of mind" is a common idiom meaning freedom from worry.',
    ],
  },
  'SIM Card Purchase': {
    aiName: 'Alex (Telecom Staff)',
    dialogue: [
      { role: 'user', text: 'Hi. I\'ve just arrived in the UK and need a local SIM card.', tr: 'Merhaba. İngiltere\'ye yeni geldim ve yerel bir SIM karta ihtiyacım var.' },
      { role: 'ai', text: 'Welcome! Are you looking for pay-as-you-go, or a monthly plan?', tr: 'Hoş geldiniz! Kullandıkça öde mi yoksa aylık plan mı arıyorsunuz?' },
      { role: 'user', text: 'I\'ll be here for six months, so probably a monthly plan. What do you recommend?', tr: 'Altı ay burada olacağım, bu yüzden muhtemelen aylık plan. Ne önerirsiniz?' },
      { role: 'ai', text: 'For six months, our best value plan is £15 a month — 20GB data, unlimited calls and texts.', tr: 'Altı ay için en uygun fiyatlı planımız aylık 15 £ — 20 GB veri, sınırsız arama ve mesaj.' },
      { role: 'user', text: 'That sounds good. Does it cover tethering?', tr: 'Kulağa iyi geliyor. Paylaşım ağı kapsıyor mu?' },
      { role: 'ai', text: 'Yes, you can use it as a hotspot with up to 5GB. You\'ll need to register the SIM with your passport — EU regulations.', tr: 'Evet, 5 GB\'a kadar hotspot olarak kullanabilirsiniz. AB yönetmelikleri gereği SIM\'i pasaportunuzla kaydetmeniz gerekecek.' },
      { role: 'user', text: 'No problem. How do I top it up each month?', tr: 'Sorun değil. Her ay nasıl yükleme yaparım?' },
      { role: 'ai', text: 'It auto-renews from your debit or credit card. You can also manage everything through our app.', tr: 'Banka veya kredi kartınızdan otomatik olarak yenilenir. Her şeyi uygulamamızdan da yönetebilirsiniz.' },
    ],
    keyPhrases: [
      { phrase: 'Pay-as-you-go', tr: 'Kullandıkça öde' },
      { phrase: 'Unlimited calls and texts', tr: 'Sınırsız arama ve mesaj' },
      { phrase: 'Tethering / hotspot', tr: 'Paylaşım ağı / hotspot' },
      { phrase: 'It auto-renews', tr: 'Otomatik olarak yenilenir' },
    ],
    tips: [
      '"Pay-as-you-go" vs "monthly plan" — know the difference before buying a SIM abroad.',
      '"Tethering" means sharing your mobile data with another device via Wi-Fi.',
    ],
  },
  'Apartment Viewing': {
    aiName: 'Mrs. White (Estate Agent)',
    dialogue: [
      { role: 'ai', text: 'Hello! Welcome. This is the flat I mentioned — it\'s on the second floor, two bedrooms, recently renovated.', tr: 'Merhaba! Hoş geldiniz. Bahsettiğim daire bu — ikinci katta, iki yatak odalı, yakın zamanda yenilendi.' },
      { role: 'user', text: 'It looks lovely. Is the heating included in the rent?', tr: 'Çok güzel görünüyor. Isıtma kira dahil mi?' },
      { role: 'ai', text: 'The rent is £1,200 a month, excluding bills. Water is included, but gas and electricity are separate.', tr: 'Kira faturalar hariç aylık 1.200 £. Su dahil, ancak gaz ve elektrik ayrı.' },
      { role: 'user', text: 'What\'s the minimum tenancy period?', tr: 'Minimum kiralık süresi nedir?' },
      { role: 'ai', text: 'It\'s a 12-month contract with a two-month break clause.', tr: '12 aylık sözleşme, iki aylık fesih maddesiyle.' },
      { role: 'user', text: 'How much is the deposit?', tr: 'Depozito ne kadar?' },
      { role: 'ai', text: 'It\'s five weeks\' rent — £1,385, held in a government-approved scheme.', tr: 'Beş haftalık kira — hükümet onaylı bir sistemde tutulan 1.385 £.' },
      { role: 'user', text: 'Is there parking available?', tr: 'Park yeri var mı?' },
      { role: 'ai', text: 'There\'s permit parking on the street — a resident permit is about £80 a year from the council.', tr: 'Sokakta izinli park var — belediyeden yıllık yaklaşık 80 £\'a sakin izni alabilirsiniz.' },
    ],
    keyPhrases: [
      { phrase: 'Is ... included in the rent?', tr: '... kira dahil mi?' },
      { phrase: 'Minimum tenancy period', tr: 'Minimum kiralık süresi' },
      { phrase: 'Break clause', tr: 'Fesih maddesi' },
      { phrase: 'Government-approved scheme', tr: 'Hükümet onaylı sistem' },
    ],
    tips: [
      'Always ask about bills (utilities) — "excluding bills" means rent doesn\'t cover them.',
      'A "break clause" lets you leave before the full contract period under certain conditions.',
    ],
  },
  'Gym Membership': {
    aiName: 'Jake (Gym Staff)',
    dialogue: [
      { role: 'user', text: 'Hi. I\'m interested in joining the gym. Can you tell me about the membership options?', tr: 'Merhaba. Spor salonuna üye olmayı düşünüyorum. Üyelik seçeneklerini anlatır mısınız?' },
      { role: 'ai', text: 'Of course! We have a monthly rolling contract at £35, or an annual membership at £299 — that\'s a big saving.', tr: 'Tabii! Aylık 35 £\'a devam eden sözleşmemiz veya 299 £\'a yıllık üyeliğimiz var — büyük bir tasarruf.' },
      { role: 'user', text: 'What\'s included? Do you have a pool and classes?', tr: 'Neler dahil? Havuz ve dersler var mı?' },
      { role: 'ai', text: 'Yes — the gym floor, pool, sauna, and all group fitness classes like yoga, spin and HIIT are included.', tr: 'Evet — spor salonu katı, havuz, sauna ve yoga, spinning ve HIIT gibi tüm grup fitness dersleri dahil.' },
      { role: 'user', text: 'Can I try it before committing to a membership?', tr: 'Üyeliğe karar vermeden önce deneyebilir miyim?' },
      { role: 'ai', text: 'Absolutely — we offer a free one-day pass. You can try everything and see if it\'s the right fit.', tr: 'Kesinlikle — ücretsiz tek günlük geçiş sunuyoruz. Her şeyi deneyip sizin için doğru olup olmadığını görebilirsiniz.' },
      { role: 'user', text: 'That\'s great. What are the opening hours?', tr: 'Bu harika. Çalışma saatleri nedir?' },
      { role: 'ai', text: 'We\'re open 6 AM to 11 PM weekdays, and 7 AM to 9 PM at weekends.', tr: 'Hafta içi sabah 6\'dan gece 11\'e, hafta sonları sabah 7\'den akşam 9\'a kadar açığız.' },
    ],
    keyPhrases: [
      { phrase: 'Monthly rolling contract', tr: 'Aylık devam eden sözleşme' },
      { phrase: 'Annual membership', tr: 'Yıllık üyelik' },
      { phrase: 'Before committing to...', tr: '... karar vermeden önce' },
      { phrase: 'The right fit', tr: 'Doğru seçim / uygun' },
    ],
    tips: [
      '"Rolling contract" = month-to-month, no long commitment; "annual" = locked in for a year.',
      '"Is it the right fit?" = Does it suit me/my needs? "Fit" here is figurative, not literal.',
    ],
  },
  'Hair Salon': {
    aiName: 'Nina (Hairdresser)',
    dialogue: [
      { role: 'ai', text: 'Hi there! Come on in. What can I do for you today?', tr: 'Merhaba! Buyurun. Bugün size ne yapabilirim?' },
      { role: 'user', text: 'Hi. I\'d like a haircut, please. Just a trim — about two inches off the ends.', tr: 'Merhaba. Saç kestirmek istiyorum, lütfen. Sadece uçlardan yaklaşık 5 santim.' },
      { role: 'ai', text: 'Sure. Would you like any layers or just a straight cut?', tr: 'Tabii. Katman ister misiniz yoksa düz kesim mi?' },
      { role: 'user', text: 'Just a straight cut, please. Can you also blow-dry it afterwards?', tr: 'Sadece düz kesim, lütfen. Sonrasında fön çekebilir misiniz?' },
      { role: 'ai', text: 'Of course. Do you want it straight or with a bit of volume?', tr: 'Tabii ki. Düz mü yoksa biraz hacimli mi istersiniz?' },
      { role: 'user', text: 'With a bit of volume, please. I have an important event tonight.', tr: 'Biraz hacimli olsun, lütfen. Bu gece önemli bir etkinliğim var.' },
      { role: 'ai', text: 'Perfect! Have a seat and I\'ll get started. Would you like any coffee or tea while you wait?', tr: 'Mükemmel! Oturun, hemen başlayacağım. Beklerken kahve veya çay ister misiniz?' },
      { role: 'user', text: 'A coffee would be lovely, thank you.', tr: 'Kahve harika olur, teşekkürler.' },
    ],
    keyPhrases: [
      { phrase: 'Just a trim', tr: 'Sadece uç kısaltma' },
      { phrase: 'Two inches off the ends', tr: 'Uçlardan iki inç' },
      { phrase: 'Blow-dry it afterwards', tr: 'Sonrasında fön çekmek' },
      { phrase: 'A bit of volume', tr: 'Biraz hacim' },
    ],
    tips: [
      '"Just a trim" means a small cut to neaten the hair, not a major style change.',
      'Always say how much you want cut — use inches, centimetres, or finger-widths.',
    ],
  },
  'Plumber Visit': {
    aiName: 'Dave (Plumber)',
    dialogue: [
      { role: 'ai', text: 'Good morning. I\'m Dave, the plumber. You called about a leak?', tr: 'Günaydın. Ben Dave, tesisatçı. Kaçak için mi aradınız?' },
      { role: 'user', text: 'Yes, thanks for coming so quickly. The pipe under the kitchen sink is leaking badly.', tr: 'Evet, bu kadar çabuk geldiğiniz için teşekkürler. Mutfak lavabosunun altındaki boru ciddi şekilde kaçıyor.' },
      { role: 'ai', text: 'Let me take a look. How long has it been leaking?', tr: 'Bir bakayım. Ne zamandan beri kaçıyor?' },
      { role: 'user', text: 'Since yesterday evening. I\'ve put a bucket under it for now.', tr: 'Dün akşamdan beri. Şimdilik altına bir kova koydum.' },
      { role: 'ai', text: 'Good thinking. It looks like a cracked joint — I\'ll need to replace a section of pipe. Do you have a stopcock I can turn off?', tr: 'Akıllıca. Çatlak bir bağlantı gibi görünüyor — bir boru bölümünü değiştirmem gerekecek. Kapatabileceğim bir su vanası var mı?' },
      { role: 'user', text: 'Yes, it\'s under the stairs. I\'ll show you.', tr: 'Evet, merdivenin altında. Size göstereyim.' },
      { role: 'ai', text: 'Great. This should take about an hour. Parts and labour, I\'d estimate around £120.', tr: 'Harika. Bu yaklaşık bir saat sürmeli. Parça ve işçilik dahil yaklaşık 120 £ tahmin ediyorum.' },
      { role: 'user', text: 'That\'s fine. Please go ahead.', tr: 'Tamam. Lütfen devam edin.' },
    ],
    keyPhrases: [
      { phrase: 'The pipe is leaking badly', tr: 'Boru ciddi şekilde kaçıyor' },
      { phrase: 'How long has it been leaking?', tr: 'Ne zamandan beri kaçıyor?' },
      { phrase: 'A cracked joint', tr: 'Çatlak bağlantı' },
      { phrase: 'Parts and labour', tr: 'Parça ve işçilik' },
    ],
    tips: [
      '"Parts and labour" is the standard phrase for the total cost of a repair job.',
      '"Since yesterday evening" uses "since" for a specific point in time when the situation began.',
    ],
  },
  'University Advisor': {
    aiName: 'Dr. Patel (Advisor)',
    dialogue: [
      { role: 'user', text: 'Hi Dr Patel. I have an appointment. I\'m a second-year student and I need help planning my courses.', tr: 'Merhaba Dr Patel. Randevum var. İkinci yıl öğrencisiyim ve derslerimi planlamak için yardıma ihtiyacım var.' },
      { role: 'ai', text: 'Of course. Have a seat. Which degree programme are you in?', tr: 'Tabii ki. Oturun. Hangi lisans programındasınız?' },
      { role: 'user', text: 'I\'m doing Business Administration. I need to choose my electives for next semester.', tr: 'İşletme Yönetimi okuyorum. Gelecek dönem için seçmeli derslerimi seçmem gerekiyor.' },
      { role: 'ai', text: 'You need at least 30 elective credits to graduate. Have you looked at the course catalogue?', tr: 'Mezun olmak için en az 30 seçmeli kredi almanız gerekiyor. Ders kataloğuna baktınız mı?' },
      { role: 'user', text: 'Yes. I\'m interested in International Finance and Digital Marketing. Are those open to second-years?', tr: 'Evet. Uluslararası Finans ve Dijital Pazarlama ile ilgileniyorum. Bunlar ikinci yıl öğrencilerine açık mı?' },
      { role: 'ai', text: 'Digital Marketing is. However, International Finance requires completion of Economics 101 first — have you taken that?', tr: 'Dijital Pazarlama açık. Ancak Uluslararası Finans önce Ekonomi 101\'in tamamlanmasını gerektiriyor — onu aldınız mı?' },
      { role: 'user', text: 'I took it last semester and got a B+. Can I register for it then?', tr: 'Geçen dönem aldım ve B+ aldım. Kayıt yaptırabilir miyim o zaman?' },
      { role: 'ai', text: 'Absolutely. Registration opens next Monday. I\'d advise registering early — these courses fill up quickly.', tr: 'Kesinlikle. Kayıt gelecek Pazartesi açılıyor. Erken kayıt yaptırmanızı tavsiye ederim — bu dersler hızla doluyor.' },
    ],
    keyPhrases: [
      { phrase: 'I need to choose my electives', tr: 'Seçmeli derslerimi seçmem gerekiyor' },
      { phrase: 'Requires completion of...', tr: '... tamamlanmasını gerektiriyor' },
      { phrase: 'Registration opens on...', tr: 'Kayıt ... tarihinde açılıyor' },
      { phrase: 'Fill up quickly', tr: 'Hızla dolmak' },
    ],
    tips: [
      '"Electives" are optional courses you choose freely; "required courses" are compulsory.',
      '"I\'d advise registering early" — use "I\'d advise + -ing" for recommendations.',
    ],
  },
  'Library Help': {
    aiName: 'Maria (Librarian)',
    dialogue: [
      { role: 'user', text: 'Excuse me. I\'m looking for books about climate change for a university assignment.', tr: 'Özür dilerim. Bir üniversite ödevi için iklim değişikliği hakkında kitap arıyorum.' },
      { role: 'ai', text: 'Certainly! You can search our catalogue on those computers over there. Do you need academic journals as well?', tr: 'Tabii ki! Şu bilgisayarlarda kataloğumuzu arayabilirsiniz. Akademik dergiler de gerekiyor mu?' },
      { role: 'user', text: 'Yes, please. How do I access them?', tr: 'Evet, lütfen. Bunlara nasıl erişebilirim?' },
      { role: 'ai', text: 'You can access digital journals through our website using your student login. I can show you if you like.', tr: 'Öğrenci girişinizi kullanarak web sitemiz üzerinden dijital dergilere erişebilirsiniz. İsterseniz gösterebilirim.' },
      { role: 'user', text: 'That would be great. Also, how many books can I borrow at once?', tr: 'Bu harika olur. Ayrıca aynı anda kaç kitap ödünç alabiliyorum?' },
      { role: 'ai', text: 'Students can borrow up to 10 items for 3 weeks. You can renew online if you need more time.', tr: 'Öğrenciler 3 haftalığına 10 adede kadar materyal ödünç alabilir. Daha fazla zamana ihtiyacınız olursa çevrimiçi yenileyebilirsiniz.' },
      { role: 'user', text: 'What if I return a book late? Is there a fine?', tr: 'Bir kitabı geç iade edersem ne olur? Ceza var mı?' },
      { role: 'ai', text: 'There\'s a 10p per day fine for late returns. But if you renew on time, you\'ll avoid that.', tr: 'Geç iade için günde 10 peni ceza var. Ama zamanında yenilerseniz bundan kaçınırsınız.' },
    ],
    keyPhrases: [
      { phrase: 'I\'m looking for books about...', tr: '... hakkında kitap arıyorum' },
      { phrase: 'Borrow up to 10 items', tr: '10 adede kadar ödünç almak' },
      { phrase: 'Renew online', tr: 'Çevrimiçi yenilemek' },
      { phrase: 'A fine for late returns', tr: 'Geç iade cezası' },
    ],
    tips: [
      '"Borrow" = take something temporarily; "lend" = give something temporarily (you borrow FROM the library).',
      'Academic libraries often have online portals — always ask about digital resources.',
    ],
  },
  'Exam Results': {
    aiName: 'Ms. Brown (Teacher)',
    dialogue: [
      { role: 'user', text: 'Ms Brown, do you have a minute? I wanted to talk about my exam result.', tr: 'Bayan Brown, bir dakikanız var mı? Sınav sonucum hakkında konuşmak istedim.' },
      { role: 'ai', text: 'Of course, come in. I was actually hoping to speak to you. You scored 48 out of 100 — how are you feeling about it?', tr: 'Tabii ki, gelin. Zaten sizinle konuşmayı umuyordum. 100 üzerinden 48 aldınız — bu konuda nasıl hissediyorsunuz?' },
      { role: 'user', text: 'Honestly, I\'m quite disappointed. I thought I had prepared well.', tr: 'Açıkçası oldukça hayal kırıklığına uğradım. İyi hazırlandığımı düşünmüştüm.' },
      { role: 'ai', text: 'I understand. Looking at your answers, you struggled most with the grammar section. Did you revise that area?', tr: 'Anlıyorum. Cevaplarınıza bakıldığında, en çok dilbilgisi bölümünde zorluk çektiniz. O alanı tekrar ettiniz mi?' },
      { role: 'user', text: 'Not as much as I should have. I spent most of my time on vocabulary.', tr: 'Yapması gerektiğim kadar değil. Zamanımın çoğunu kelime bilgisine harcadım.' },
      { role: 'ai', text: 'That explains it. For next time, I\'d suggest spending equal time on all sections and doing past papers under exam conditions.', tr: 'Bu açıklıyor. Bir dahaki seferde tüm bölümlere eşit zaman ayırmanızı ve sınav koşullarında geçmiş sorularla çalışmanızı öneririm.' },
      { role: 'user', text: 'Is there any chance of a resit?', tr: 'Sınavı tekrar alma şansım var mı?' },
      { role: 'ai', text: 'Yes, there\'s a resit in March. I\'m confident you can do much better with the right preparation.', tr: 'Evet, Mart\'ta yeniden sınav var. Doğru hazırlıkla çok daha iyi yapabileceğinizden eminim.' },
    ],
    keyPhrases: [
      { phrase: 'I\'m quite disappointed', tr: 'Oldukça hayal kırıklığına uğradım' },
      { phrase: 'Struggled most with...', tr: '... konusunda en çok zorlandım' },
      { phrase: 'Doing past papers', tr: 'Geçmiş sorularla çalışmak' },
      { phrase: 'Is there any chance of a resit?', tr: 'Yeniden sınava girme şansım var mı?' },
    ],
    tips: [
      '"Resit" (UK English) = retaking an exam you previously failed or did poorly in.',
      '"I\'d suggest + -ing" is a polite way for a teacher to give study advice.',
    ],
  },
  'Course Registration': {
    aiName: 'Amy (Support Agent)',
    dialogue: [
      { role: 'user', text: 'Hi. I\'d like to register for the Advanced English Writing course. Is it still open?', tr: 'Merhaba. İleri Düzey İngilizce Yazma kursuna kaydolmak istiyorum. Hâlâ açık mı?' },
      { role: 'ai', text: 'Great choice! Yes, we have a few spots left. The course starts on the 10th of March. May I take your name?', tr: 'Harika seçim! Evet, birkaç yerimiz kaldı. Kurs 10 Mart\'ta başlıyor. İsminizi alabilir miyim?' },
      { role: 'user', text: 'Sure. My name is Jordan Lee. What are the entry requirements?', tr: 'Tabii. Adım Jordan Lee. Giriş gereksinimleri nelerdir?' },
      { role: 'ai', text: 'You\'ll need a B2 level or above. Do you have a certificate, or would you like to take our online placement test?', tr: 'B2 seviyesi veya üzeri gerekiyor. Sertifikanız var mı, yoksa çevrimiçi seviye testimizi yapmak ister misiniz?' },
      { role: 'user', text: 'I have a Cambridge B2 certificate. Does the course come with a certificate?', tr: 'Cambridge B2 sertifikam var. Kursun sonunda sertifika veriliyor mu?' },
      { role: 'ai', text: 'Yes — upon completion, you receive our accredited certificate. The course is 8 weeks, two evenings a week.', tr: 'Evet — tamamlanınca akredite sertifikamızı alırsınız. Kurs 8 hafta, haftada iki akşam.' },
      { role: 'user', text: 'What\'s the fee, and what\'s your refund policy?', tr: 'Ücret ne kadar ve iade politikanız nedir?' },
      { role: 'ai', text: 'It\'s £350. Full refund is available up to 7 days before the start date. After that, a 50% refund applies.', tr: '350 £. Başlangıç tarihinden 7 gün öncesine kadar tam iade yapılıyor. Sonrasında %50 iade uygulanıyor.' },
    ],
    keyPhrases: [
      { phrase: 'Is it still open?', tr: 'Hâlâ açık mı?' },
      { phrase: 'Entry requirements', tr: 'Giriş gereksinimleri' },
      { phrase: 'Upon completion', tr: 'Tamamlanınca / bitince' },
      { phrase: 'Refund policy', tr: 'İade politikası' },
    ],
    tips: [
      '"Upon completion" is formal for "when you finish" — common in course/certificate contexts.',
      'Always ask about the refund policy before paying for any course.',
    ],
  },
  'Taxi Ride': {
    aiName: 'Mike (Taxi Driver)',
    dialogue: [
      { role: 'user', text: 'Hi, I\'d like to go to the city centre, please. Victoria station.', tr: 'Merhaba, şehir merkezine gitmek istiyorum, lütfen. Victoria garı.' },
      { role: 'ai', text: 'Sure. Hop in. It\'s about 20 minutes at this time of day. Do you have a preferred route?', tr: 'Tabii. Binin. Günün bu saatinde yaklaşık 20 dakika. Tercih ettiğiniz bir güzergah var mı?' },
      { role: 'user', text: 'Whatever\'s quickest, please. I have a train to catch at 3.', tr: 'Ne kadar hızlıysa, lütfen. Saat 3\'te bir tren yakalamam gerekiyor.' },
      { role: 'ai', text: 'No problem. I\'ll take the ring road — less traffic at this time. Should be there by 2:40.', tr: 'Sorun değil. Çevre yolunu kullanacağım — bu saatte daha az trafik var. Saat 2:40\'a kadar orada oluruz.' },
      { role: 'user', text: 'Great. Roughly how much will it be?', tr: 'Harika. Kabaca ne kadar tutar?' },
      { role: 'ai', text: 'Around £18 to £22, depending on traffic. The meter will show the exact fare.', tr: 'Trafiğe bağlı olarak yaklaşık 18 ila 22 £. Sayaç kesin ücreti gösterecek.' },
      { role: 'user', text: 'Can I pay by card?', tr: 'Kartla ödeyebilir miyim?' },
      { role: 'ai', text: 'Yes, card is fine. So, are you from the city or just visiting?', tr: 'Evet, kart kabul ediyoruz. Peki, şehirli misiniz yoksa ziyaretçi misiniz?' },
    ],
    keyPhrases: [
      { phrase: 'I\'d like to go to...', tr: '...\'a gitmek istiyorum' },
      { phrase: 'Whatever\'s quickest', tr: 'Ne kadar hızlıysa' },
      { phrase: 'I have a train to catch', tr: 'Yakalamam gereken bir tren var' },
      { phrase: 'Depending on traffic', tr: 'Trafiğe bağlı olarak' },
    ],
    tips: [
      '"I have a train/meeting to catch" — "catch" is used for transport you must board at a specific time.',
      '"Roughly how much?" = approximately how much? — a natural, casual way to ask for an estimate.',
    ],
  },
  'Car Breakdown': {
    aiName: 'Road Assist Operator',
    dialogue: [
      { role: 'user', text: 'Hello. I need urgent help. My car has broken down on the motorway.', tr: 'Merhaba. Acil yardıma ihtiyacım var. Arabam otoyolda arızalandı.' },
      { role: 'ai', text: 'I\'m sorry to hear that. Are you safe? Are you in the car or on the hard shoulder?', tr: 'Bunu duyduğuma üzüldüm. Güvende misiniz? Arabada mısınız yoksa banka mı çektiniz?' },
      { role: 'user', text: 'I\'m on the hard shoulder. I\'ve put my hazard lights on.', tr: 'Bankaya çektim. Dörtlüleri yaktım.' },
      { role: 'ai', text: 'Good. Can you tell me your exact location? Look for the nearest emergency marker or road sign.', tr: 'İyi. Tam konumunuzu söyler misiniz? En yakın acil marker veya yol tabelasına bakın.' },
      { role: 'user', text: 'I\'m on the M25, between junctions 8 and 9, near a blue marker 24B.', tr: 'M25\'teyim, 8 ve 9. kavşaklar arasında, 24B numaralı mavi işaret yakınında.' },
      { role: 'ai', text: 'Perfect. What\'s wrong with the vehicle? Any warning lights or unusual sounds?', tr: 'Mükemmel. Araçta ne var? Uyarı ışıkları veya olağandışı sesler var mı?' },
      { role: 'user', text: 'The engine just cut out. There\'s an oil warning light on.', tr: 'Motor kapandı. Yağ uyarı lambası yanıyor.' },
      { role: 'ai', text: 'Understood. A patrol will reach you in approximately 45 minutes. Please stay in your car with your seatbelt on.', tr: 'Anlaşıldı. Bir ekip yaklaşık 45 dakika içinde size ulaşacak. Lütfen kemerlerinizi takarak araçta kalın.' },
    ],
    keyPhrases: [
      { phrase: 'My car has broken down', tr: 'Arabam arızalandı' },
      { phrase: 'On the hard shoulder', tr: 'Banka / acil şeride' },
      { phrase: 'Hazard lights on', tr: 'Dörtlüler açık' },
      { phrase: 'The engine cut out', tr: 'Motor kapandı' },
    ],
    tips: [
      '"Broken down" = stopped working (for vehicles/machines). "Cut out" = suddenly stopped.',
      '"Hard shoulder" = emergency stopping lane on a motorway. Essential vocabulary for UK road emergencies.',
    ],
  },
  'Bus Information': {
    aiName: 'Bus Information Officer',
    dialogue: [
      { role: 'user', text: 'Excuse me. Which bus goes to the city centre?', tr: 'Özür dilerim. Şehir merkezine hangi otobüs gidiyor?' },
      { role: 'ai', text: 'The number 42 and the number 17 both go to the city centre. The 42 is more direct — about 15 minutes.', tr: '42 ve 17 numaralı otobüsler şehir merkezine gidiyor. 42 daha direkt — yaklaşık 15 dakika.' },
      { role: 'user', text: 'How much is the fare?', tr: 'Bilet ücreti ne kadar?' },
      { role: 'ai', text: 'A single ticket is £2.20. A day pass is £5 — worth it if you\'re travelling more than twice today.', tr: 'Tek yön bilet 2,20 £. Günlük geçiş 5 £ — bugün ikiden fazla seyahat edecekseniz değer.' },
      { role: 'user', text: 'I\'ll take a day pass then. Where do I buy it?', tr: 'O zaman günlük geçiş alacağım. Nerede satın alabilirim?' },
      { role: 'ai', text: 'You can buy it on the bus from the driver, or at the ticket machine over there. Card or cash both work.', tr: 'Şoförden otobüste veya şu bilet otomatından satın alabilirsiniz. Hem kart hem nakit geçerli.' },
      { role: 'user', text: 'How often does the 42 run?', tr: '42 numaralı otobüs ne sıklıkla geliyor?' },
      { role: 'ai', text: 'Every 10 minutes during peak hours, every 20 minutes off-peak. The next one is in about 5 minutes.', tr: 'Yoğun saatlerde her 10 dakikada bir, sakin saatlerde her 20 dakikada bir. Bir sonraki yaklaşık 5 dakika sonra.' },
    ],
    keyPhrases: [
      { phrase: 'Which bus goes to...?', tr: 'Hangi otobüs ...\'a gidiyor?' },
      { phrase: 'A single ticket', tr: 'Tek yön bilet' },
      { phrase: 'A day pass', tr: 'Günlük geçiş' },
      { phrase: 'During peak hours', tr: 'Yoğun saatlerde' },
    ],
    tips: [
      '"Peak hours" = rush hours (usually 7–9 AM and 5–7 PM); "off-peak" = quieter times.',
      '"Worth it if..." is a useful phrase for justifying a choice based on value.',
    ],
  },
  'Ride-share Pickup': {
    aiName: 'Jake (Driver)',
    dialogue: [
      { role: 'ai', text: 'Hi! Are you Alex? I\'m Jake, your driver.', tr: 'Merhaba! Alex misiniz? Ben Jake, sürücünüz.' },
      { role: 'user', text: 'Hi Jake! Yes, that\'s me. Thanks for coming.', tr: 'Merhaba Jake! Evet, benim. Geldiğiniz için teşekkürler.' },
      { role: 'ai', text: 'Great. I have your destination as Central Park Hotel — is that correct?', tr: 'Harika. Varış noktanız Central Park Hotel olarak görünüyor — doğru mu?' },
      { role: 'user', text: 'Yes, that\'s right. Do you know how long it\'ll take from here?', tr: 'Evet, doğru. Buradan ne kadar süreceğini biliyor musunuz?' },
      { role: 'ai', text: 'Around 25 minutes — there\'s a bit of traffic on the main road. Any music preference, or do you prefer quiet?', tr: 'Yaklaşık 25 dakika — ana yolda biraz trafik var. Müzik tercihiniz var mı yoksa sessiz mi tercih edersiniz?' },
      { role: 'user', text: 'Something relaxing would be nice if you don\'t mind.', tr: 'Sakıncası yoksa dinlendirici bir şey güzel olur.' },
      { role: 'ai', text: 'No problem at all. I\'ll put on some background music. Can I take the highway to avoid traffic?', tr: 'Hiç sorun değil. Bir arka plan müziği koyacağım. Trafikten kaçınmak için otobandan gidebilir miyim?' },
      { role: 'user', text: 'Sure, whatever\'s fastest. I appreciate it.', tr: 'Tabii, en hızlı olan ne olursa. Minnettarım.' },
    ],
    keyPhrases: [
      { phrase: 'Is that correct?', tr: 'Doğru mu?' },
      { phrase: 'Any music preference?', tr: 'Müzik tercihiniz var mı?' },
      { phrase: 'If you don\'t mind', tr: 'Sakıncası yoksa' },
      { phrase: 'Whatever\'s fastest', tr: 'Ne kadar hızlıysa' },
    ],
    tips: [
      '"If you don\'t mind" is a very polite way to soften a request — always sounds considerate.',
      'Confirming your destination at the start is good practice in any ride-share.',
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
  'Hotel Check-in':        'bed-outline',
  'Lost Luggage':          'briefcase-outline',
  'Car Rental':            'car-outline',
  'Train Ticket Booking':  'train-outline',
  'Customs Declaration':   'shield-checkmark-outline',
  'Tourist Information':   'information-circle-outline',
  'Hotel Complaint':       'alert-circle-outline',
  'Email Enquiry':         'mail-outline',
  'Phone Interview':       'call-outline',
  'Project Presentation':  'easel-outline',
  'Salary Negotiation':    'cash-outline',
  'Office Introduction':   'people-circle-outline',
  'Work Complaint':        'warning-outline',
  'Team Meeting':          'people-outline',
  'Pharmacy Visit':        'medkit-outline',
  'Emergency Room':        'pulse-outline',
  'Dentist Appointment':   'fitness-outline',
  'Health Insurance':      'shield-outline',
  'Eye Doctor':            'eye-outline',
  'Clothes Fitting':       'shirt-outline',
  'Bargaining at Market':  'pricetag-outline',
  'Electronics Purchase':  'laptop-outline',
  'Supermarket Help':      'cart-outline',
  'Restaurant Order':      'restaurant-outline',
  'Food Allergy':          'warning-outline',
  'Asking for the Bill':   'receipt-outline',
  'Cooking Class':         'flame-outline',
  'Bank Account Opening':  'card-outline',
  'Post Office':           'mail-unread-outline',
  'SIM Card Purchase':     'phone-portrait-outline',
  'Apartment Viewing':     'home-outline',
  'Gym Membership':        'barbell-outline',
  'Hair Salon':            'cut-outline',
  'Plumber Visit':         'construct-outline',
  'University Advisor':    'school-outline',
  'Library Help':          'library-outline',
  'Exam Results':          'document-text-outline',
  'Course Registration':   'clipboard-outline',
  'Taxi Ride':             'car-sport-outline',
  'Car Breakdown':         'alert-circle-outline',
  'Bus Information':       'bus-outline',
  'Ride-share Pickup':     'locate-outline',
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
