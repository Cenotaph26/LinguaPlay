import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';

const router = Router();
router.use(requireAuth);

const PRESET_SCENES = [
  // ── Existing 8 ────────────────────────────────────────────────────────────
  {
    titleEn: 'Ordering Coffee',
    titleTr: 'Kahve Sipariş Etmek',
    descriptionEn: 'Order your favorite drink at a busy coffee shop.',
    descriptionTr: 'Kalabalık bir kafede favori içeceğini sipariş et.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are Alex, a friendly barista at a coffee shop. The customer is learning English. Be patient, use simple vocabulary, and help them order naturally. Keep sentences short and clear.',
  },
  {
    titleEn: 'Job Interview',
    titleTr: 'İş Görüşmesi',
    descriptionEn: 'Practice a formal job interview for a marketing position.',
    descriptionTr: 'Pazarlama pozisyonu için resmi bir iş görüşmesi pratiği yap.',
    category: 'work',
    difficulty: 'B2',
    systemPrompt: 'You are Sarah, an HR manager at a tech company conducting a job interview. Ask professional questions about experience, skills, and motivation. Be formal but encouraging.',
  },
  {
    titleEn: 'Airport Check-in',
    titleTr: 'Havalimanı Check-in',
    descriptionEn: 'Navigate airport check-in procedures and answer security questions.',
    descriptionTr: 'Havalimanı check-in sürecini yönet ve güvenlik sorularını yanıtla.',
    category: 'travel',
    difficulty: 'A2',
    systemPrompt: 'You are Tom, a check-in agent at an international airport. Guide the passenger through check-in, ask about luggage, seat preferences, and travel documents. Use standard aviation English.',
  },
  {
    titleEn: 'Doctor Visit',
    titleTr: 'Doktor Ziyareti',
    descriptionEn: 'Describe your symptoms and understand medical advice.',
    descriptionTr: 'Belirtilerini anlat ve tıbbi tavsiye al.',
    category: 'emergency',
    difficulty: 'B1',
    systemPrompt: 'You are Dr. James, a general practitioner. Listen to the patient\'s symptoms, ask follow-up questions, and give clear medical advice. Use simple English for non-native speakers.',
  },
  {
    titleEn: 'Shopping Return',
    titleTr: 'Mağazada İade',
    descriptionEn: 'Return a defective product and negotiate with the store staff.',
    descriptionTr: 'Arızalı bir ürünü iade et ve mağaza çalışanıyla müzakere et.',
    category: 'shopping',
    difficulty: 'B1',
    systemPrompt: 'You are Emma, a customer service representative at a clothing store. Handle return requests professionally. Sometimes the policy is strict — be firm but polite.',
  },
  {
    titleEn: 'Making New Friends',
    titleTr: 'Yeni Arkadaş Edinmek',
    descriptionEn: 'Start a conversation at a party and make a new friend.',
    descriptionTr: 'Bir partide sohbet başlat ve yeni bir arkadaş edin.',
    category: 'social',
    difficulty: 'A2',
    systemPrompt: 'You are Chris, a friendly person at a house party. Start casual conversation, ask about hobbies and interests, share stories. Be warm and conversational.',
  },
  {
    titleEn: 'Asking for Directions',
    titleTr: 'Yol Tarifi İsteme',
    descriptionEn: 'Find your way around a new city by asking locals for directions.',
    descriptionTr: 'Yerel halktan yol tarifi alarak yeni bir şehirde yolunu bul.',
    category: 'daily',
    difficulty: 'A1',
    systemPrompt: 'You are a local resident in a busy city. Give clear directions using landmarks and street names. If the tourist seems confused, offer to repeat or simplify.',
  },
  {
    titleEn: 'Business Meeting',
    titleTr: 'İş Toplantısı',
    descriptionEn: 'Present your project idea and handle questions from colleagues.',
    descriptionTr: 'Proje fikrini sun ve meslektaşlarından gelen soruları yanıtla.',
    category: 'work',
    difficulty: 'C1',
    systemPrompt: 'You are Marcus, a senior manager in a business meeting. Challenge the presenter with tough questions about budget, timeline, and ROI. Use professional business English.',
  },
  // ── Travel ────────────────────────────────────────────────────────────────
  {
    titleEn: 'Hotel Check-in',
    titleTr: 'Otel Check-in',
    descriptionEn: 'Check into your hotel, get your room key and ask about amenities.',
    descriptionTr: 'Otele giriş yap, oda anahtarını al ve olanaklarını öğren.',
    category: 'travel',
    difficulty: 'A2',
    systemPrompt: 'You are Lisa, a friendly hotel receptionist. Help the guest check in, confirm their reservation, explain breakfast times and Wi-Fi password. Use clear, simple hospitality English.',
  },
  {
    titleEn: 'Lost Luggage',
    titleTr: 'Kayıp Bagaj',
    descriptionEn: 'Report your missing suitcase to airline staff at the baggage claim.',
    descriptionTr: 'Kaybolan valizini havayolu görevlisine bildir.',
    category: 'travel',
    difficulty: 'B1',
    systemPrompt: 'You are a baggage services agent at an international airport. Take a lost luggage report from the passenger, ask for a description of the bag, reference number, and contact details. Be professional and sympathetic.',
  },
  {
    titleEn: 'Car Rental',
    titleTr: 'Araç Kiralama',
    descriptionEn: 'Rent a car at the airport, discuss insurance and return policy.',
    descriptionTr: 'Havalimanında araba kirala, sigorta ve iade politikasını öğren.',
    category: 'travel',
    difficulty: 'B1',
    systemPrompt: 'You are a car rental agent at an airport branch. Help the customer choose a vehicle, explain insurance options, fuel policy, and the return process. Use standard rental industry vocabulary.',
  },
  {
    titleEn: 'Train Ticket Booking',
    titleTr: 'Tren Bileti Alma',
    descriptionEn: 'Buy a train ticket and choose your seat at the station counter.',
    descriptionTr: 'İstasyon gişesinden tren bileti al ve koltuk seç.',
    category: 'travel',
    difficulty: 'A2',
    systemPrompt: 'You are a ticket clerk at a busy train station. Help the passenger buy a ticket, ask about destination, departure time, and seat preference. Use common travel phrases and keep language clear.',
  },
  {
    titleEn: 'Customs Declaration',
    titleTr: 'Gümrük Beyanı',
    descriptionEn: 'Go through customs and correctly declare your items.',
    descriptionTr: 'Gümrükten geç ve eşyalarını doğru şekilde beyan et.',
    category: 'travel',
    difficulty: 'B1',
    systemPrompt: 'You are a customs officer at an international border. Ask the traveller about declared goods, the purpose of their visit, and how long they plan to stay. Be formal and thorough.',
  },
  {
    titleEn: 'Tourist Information',
    titleTr: 'Turistik Bilgi',
    descriptionEn: 'Ask a tourist info desk about local attractions and transport.',
    descriptionTr: 'Turistik bilgi masasında yerel gezilecek yerler ve ulaşımı öğren.',
    category: 'travel',
    difficulty: 'A1',
    systemPrompt: 'You are a volunteer at a tourist information centre. Answer questions about local attractions, opening hours, and how to get around. Speak slowly and clearly, use simple English.',
  },
  {
    titleEn: 'Hotel Complaint',
    titleTr: 'Otel Şikayeti',
    descriptionEn: 'Complain about room issues and request a solution from reception.',
    descriptionTr: 'Oda sorunlarını şikayet et ve resepsiyondan çözüm iste.',
    category: 'travel',
    difficulty: 'B1',
    systemPrompt: 'You are a hotel receptionist dealing with a guest complaint about their room. Listen carefully, apologise sincerely, and offer practical solutions such as a room change or discount. Stay professional.',
  },
  // ── Work ──────────────────────────────────────────────────────────────────
  {
    titleEn: 'Email Enquiry',
    titleTr: 'E-posta Yazışması',
    descriptionEn: 'Draft and discuss a professional email response with a colleague.',
    descriptionTr: 'Bir meslektaşınla profesyonel bir e-posta yanıtı taslağını hazırla.',
    category: 'work',
    difficulty: 'B2',
    systemPrompt: 'You are James, a senior colleague helping a junior employee write a professional email response to a client. Suggest formal phrasing, correct tone, and appropriate sign-offs. Give constructive feedback.',
  },
  {
    titleEn: 'Phone Interview',
    titleTr: 'Telefon Mülakatı',
    descriptionEn: 'Handle a surprise phone or video screening interview.',
    descriptionTr: 'Beklenmedik bir telefon veya video ön mülakat görüşmesini yönet.',
    category: 'work',
    difficulty: 'B2',
    systemPrompt: 'You are a recruiter conducting a 10-minute phone screening interview. Ask about the candidate\'s current role, salary expectations, availability, and motivation. Keep the tone professional but conversational.',
  },
  {
    titleEn: 'Project Presentation',
    titleTr: 'Proje Sunumu',
    descriptionEn: 'Present your project status update to the team and answer questions.',
    descriptionTr: 'Ekibine proje durum güncellemesini sun ve soruları yanıtla.',
    category: 'work',
    difficulty: 'C1',
    systemPrompt: 'You are a team lead listening to a project status presentation. Ask detailed questions about milestones, blockers, and next steps. Use advanced project management vocabulary and challenge vague answers.',
  },
  {
    titleEn: 'Salary Negotiation',
    titleTr: 'Maaş Müzakeresi',
    descriptionEn: 'Negotiate your salary offer confidently with the HR department.',
    descriptionTr: 'İK departmanıyla maaş teklifini özgüvenle müzakere et.',
    category: 'work',
    difficulty: 'C1',
    systemPrompt: 'You are an HR director discussing a job offer with a candidate. Respond to salary counter-offers professionally, explain the compensation package, and negotiate benefits. Use formal negotiation language.',
  },
  {
    titleEn: 'Office Introduction',
    titleTr: 'Ofis Tanışması',
    descriptionEn: 'Introduce yourself on your first day at a new office.',
    descriptionTr: 'Yeni ofisindeki ilk günün tanışma konuşmalarını yönet.',
    category: 'work',
    difficulty: 'A2',
    systemPrompt: 'You are a friendly colleague welcoming a new team member on their first day. Show them around, ask about their background, and explain how the team works. Be warm and use everyday office vocabulary.',
  },
  {
    titleEn: 'Work Complaint',
    titleTr: 'İş Şikayeti',
    descriptionEn: 'Raise a workplace concern with your manager professionally.',
    descriptionTr: 'Bir iş yerindeki sorunu yöneticine profesyonelce ilet.',
    category: 'work',
    difficulty: 'B2',
    systemPrompt: 'You are a manager hearing an employee\'s workplace concern. Listen actively, ask clarifying questions, and propose a constructive resolution. Use empathetic but professional language.',
  },
  {
    titleEn: 'Team Meeting',
    titleTr: 'Ekip Toplantısı',
    descriptionEn: 'Participate in a weekly team standup and share your updates.',
    descriptionTr: 'Haftalık ekip standup toplantısına katıl ve güncellemelerini paylaş.',
    category: 'work',
    difficulty: 'B1',
    systemPrompt: 'You are a Scrum Master running a brief daily standup. Ask each team member what they did yesterday, what they plan today, and if they have any blockers. Keep pace brisk and use standard agile vocabulary.',
  },
  // ── Health ────────────────────────────────────────────────────────────────
  {
    titleEn: 'Pharmacy Visit',
    titleTr: 'Eczane Ziyareti',
    descriptionEn: 'Buy over-the-counter medicine and ask about correct dosage.',
    descriptionTr: 'Reçetesiz ilaç satın al ve doğru dozaj hakkında bilgi al.',
    category: 'emergency',
    difficulty: 'A2',
    systemPrompt: 'You are a pharmacist at a community pharmacy. Help the customer find the right medicine for their symptoms, explain the dosage, and warn about side effects. Use plain, accessible English.',
  },
  {
    titleEn: 'Emergency Room',
    titleTr: 'Acil Servis',
    descriptionEn: 'Describe an accident or sudden illness in the emergency room.',
    descriptionTr: 'Acil serviste bir kaza veya ani hastalığı tanımla.',
    category: 'emergency',
    difficulty: 'B1',
    systemPrompt: 'You are a triage nurse in a hospital emergency room. Assess the patient\'s condition by asking about their symptoms, pain level, and medical history. Use clear and calm medical language.',
  },
  {
    titleEn: 'Dentist Appointment',
    titleTr: 'Diş Hekimi Randevusu',
    descriptionEn: 'Describe tooth pain to the dentist and understand the treatment plan.',
    descriptionTr: 'Diş ağrını diş hekimine anlat ve tedavi planını öğren.',
    category: 'emergency',
    difficulty: 'B1',
    systemPrompt: 'You are Dr. Patel, a dentist. Ask the patient to describe their tooth pain, examine the issue, and explain the recommended treatment clearly. Use dental vocabulary at a level suitable for non-native speakers.',
  },
  {
    titleEn: 'Health Insurance',
    titleTr: 'Sağlık Sigortası',
    descriptionEn: 'Ask an insurance advisor about your health coverage and claims.',
    descriptionTr: 'Sigorta danışmanına sağlık sigortası kapsamı ve tazminat hakkında sor.',
    category: 'emergency',
    difficulty: 'B2',
    systemPrompt: 'You are a health insurance advisor. Explain policy coverage, deductibles, co-pays, and how to file a claim. Use standard insurance terminology but clarify jargon when asked.',
  },
  {
    titleEn: 'Eye Doctor',
    titleTr: 'Göz Doktoru',
    descriptionEn: 'Get an eye examination and discuss prescription glasses.',
    descriptionTr: 'Göz muayenesi yaptır ve reçeteli gözlük seçeneklerini öğren.',
    category: 'emergency',
    difficulty: 'B1',
    systemPrompt: 'You are Dr. Chen, an optometrist. Conduct a routine eye exam, ask about vision problems, and explain the prescription. Recommend lens options in a friendly and professional manner.',
  },
  // ── Shopping ──────────────────────────────────────────────────────────────
  {
    titleEn: 'Clothes Fitting',
    titleTr: 'Kıyafet Denemesi',
    descriptionEn: 'Try on clothes in a shop and ask for different sizes or styles.',
    descriptionTr: 'Mağazada kıyafet dene ve farklı beden veya stil iste.',
    category: 'shopping',
    difficulty: 'A2',
    systemPrompt: 'You are a sales assistant in a clothing boutique. Help the customer find the right size, suggest alternatives, and give honest fitting feedback. Use simple shopping vocabulary and be enthusiastic.',
  },
  {
    titleEn: 'Bargaining at Market',
    titleTr: 'Pazarda Pazarlık',
    descriptionEn: 'Negotiate the price of items at a street market.',
    descriptionTr: 'Kapalı çarşıda veya sokak pazarında fiyat pazarlığı yap.',
    category: 'shopping',
    difficulty: 'B1',
    systemPrompt: 'You are a market vendor selling handmade goods. Engage in friendly price negotiation, offer discounts for multiple items, and use persuasive but casual language. Push back a little before agreeing to a lower price.',
  },
  {
    titleEn: 'Electronics Purchase',
    titleTr: 'Elektronik Alışverişi',
    descriptionEn: 'Buy a laptop and ask about warranty and technical specs.',
    descriptionTr: 'Bir laptop satın al ve garanti ile teknik özelliklerini öğren.',
    category: 'shopping',
    difficulty: 'B1',
    systemPrompt: 'You are a sales assistant at an electronics store. Help the customer compare laptops, explain technical specifications in simple terms, and discuss warranty and return policies.',
  },
  {
    titleEn: 'Supermarket Help',
    titleTr: 'Süpermarket Yardımı',
    descriptionEn: 'Ask a store employee where to find specific items.',
    descriptionTr: 'Mağaza çalışanından belirli ürünlerin nerede olduğunu sor.',
    category: 'shopping',
    difficulty: 'A1',
    systemPrompt: 'You are a supermarket employee. Help customers find products in the store by giving clear aisle directions. Use simple English and feel free to walk them to the item if they seem confused.',
  },
  // ── Food & Dining ─────────────────────────────────────────────────────────
  {
    titleEn: 'Restaurant Order',
    titleTr: 'Restoran Siparişi',
    descriptionEn: 'Order a full meal at a sit-down restaurant.',
    descriptionTr: 'Bir restoranda tam bir yemek siparişi ver.',
    category: 'social',
    difficulty: 'A2',
    systemPrompt: 'You are Miguel, a waiter at a mid-range restaurant. Take the customer\'s food and drink order, describe the daily specials, and handle special requests politely. Use standard dining vocabulary.',
  },
  {
    titleEn: 'Food Allergy',
    titleTr: 'Gıda Alerjisi',
    descriptionEn: 'Ask about ingredients and inform the waiter of your food allergy.',
    descriptionTr: 'Malzemeleri sor ve garsona gıda alerjini bildir.',
    category: 'social',
    difficulty: 'B1',
    systemPrompt: 'You are a waiter at a restaurant. A customer has a serious food allergy. Listen carefully to their dietary restrictions, check the menu and kitchen for allergens, and suggest safe alternatives. Be thorough and empathetic.',
  },
  {
    titleEn: 'Asking for the Bill',
    titleTr: 'Hesap İsteme',
    descriptionEn: 'Ask for the bill and split it among friends at a restaurant.',
    descriptionTr: 'Hesabı iste ve restoranda arkadaşlarınla böl.',
    category: 'social',
    difficulty: 'A1',
    systemPrompt: 'You are a waiter bringing the bill to a table of friends. Help them split the check, explain the itemised receipt, and handle the payment. Use simple, friendly language.',
  },
  {
    titleEn: 'Cooking Class',
    titleTr: 'Yemek Pişirme Kursu',
    descriptionEn: 'Take a cooking class and ask questions about techniques.',
    descriptionTr: 'Yemek pişirme kursuna katıl ve teknikler hakkında sorular sor.',
    category: 'social',
    difficulty: 'B1',
    systemPrompt: 'You are Chef Anna, a cooking instructor running a hands-on class. Explain cooking techniques, answer questions about ingredients and methods, and give encouraging feedback. Use culinary vocabulary accessible to beginners.',
  },
  // ── Daily Life ────────────────────────────────────────────────────────────
  {
    titleEn: 'Bank Account Opening',
    titleTr: 'Banka Hesabı Açma',
    descriptionEn: 'Open a new bank account and ask about fees and services.',
    descriptionTr: 'Yeni bir banka hesabı aç ve ücretler ile hizmetler hakkında bilgi al.',
    category: 'daily',
    difficulty: 'B1',
    systemPrompt: 'You are a bank advisor at a retail bank branch. Walk the customer through the account opening process, explain account types, fees, and required documents. Use clear financial vocabulary.',
  },
  {
    titleEn: 'Post Office',
    titleTr: 'Postane',
    descriptionEn: 'Send a package internationally at the post office.',
    descriptionTr: 'Postanede yurt dışına paket gönder.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are a postal clerk at a post office. Help the customer weigh and send a parcel internationally. Ask about the contents, declare value, offer delivery options, and calculate the cost.',
  },
  {
    titleEn: 'SIM Card Purchase',
    titleTr: 'SIM Kart Alımı',
    descriptionEn: 'Buy a prepaid SIM card at a phone store.',
    descriptionTr: 'Telefon mağazasından ön ödemeli SIM kart al.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are a mobile phone store assistant. Help the customer choose a prepaid SIM plan, explain data and call allowances, and set up the SIM in their phone. Use simple telecom vocabulary.',
  },
  {
    titleEn: 'Apartment Viewing',
    titleTr: 'Daire Gezisi',
    descriptionEn: 'View an apartment for rent and ask about price and utilities.',
    descriptionTr: 'Kiralık bir daire gez ve fiyat ile faturalar hakkında sor.',
    category: 'daily',
    difficulty: 'B1',
    systemPrompt: 'You are an estate agent showing a rental apartment. Describe the features of the flat, answer questions about rent, utilities, deposit, and lease terms. Use standard real estate vocabulary.',
  },
  {
    titleEn: 'Gym Membership',
    titleTr: 'Spor Salonu Üyeliği',
    descriptionEn: 'Sign up for a gym membership and ask about classes and facilities.',
    descriptionTr: 'Spor salonu üyeliğine kaydol ve dersler ile tesisler hakkında sor.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are a gym membership advisor. Show the new member around the facilities, explain membership plans, class timetables, and cancellation policy. Be energetic and friendly.',
  },
  {
    titleEn: 'Hair Salon',
    titleTr: 'Kuaför',
    descriptionEn: 'Get a haircut and describe exactly what style you want.',
    descriptionTr: 'Saç kesimi yaptır ve istediğin stili tam olarak tarif et.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are a hairdresser at a busy salon. Ask the customer how they want their hair cut or styled, suggest options, and confirm the style before starting. Use everyday hairdressing vocabulary.',
  },
  {
    titleEn: 'Plumber Visit',
    titleTr: 'Tesisatçı Ziyareti',
    descriptionEn: 'Explain a plumbing problem to a repairman who has come to fix it.',
    descriptionTr: 'Sorunu gidermek için gelen tesisatçıya boru sorununu anlat.',
    category: 'daily',
    difficulty: 'B1',
    systemPrompt: 'You are a plumber visiting a customer\'s home to fix a plumbing issue. Ask questions to diagnose the problem, explain what needs to be done, estimate the cost, and discuss the repair timeline.',
  },
  // ── Education ─────────────────────────────────────────────────────────────
  {
    titleEn: 'University Advisor',
    titleTr: 'Üniversite Danışmanı',
    descriptionEn: 'Discuss course selection and degree requirements with your advisor.',
    descriptionTr: 'Danışmanınla ders seçimi ve mezuniyet gerekliliklerini tartış.',
    category: 'education',
    difficulty: 'B2',
    systemPrompt: 'You are an academic advisor at a university. Help the student plan their course load, understand degree requirements, and discuss elective options. Use academic English and encourage thoughtful choices.',
  },
  {
    titleEn: 'Library Help',
    titleTr: 'Kütüphane Yardımı',
    descriptionEn: 'Ask the librarian for help finding books and research materials.',
    descriptionTr: 'Kütüphaneciden kitap ve araştırma materyali bulmak için yardım iste.',
    category: 'education',
    difficulty: 'A2',
    systemPrompt: 'You are a librarian at a public library. Help the visitor find books, use the catalogue system, and access digital resources. Use simple English and be patient and helpful.',
  },
  {
    titleEn: 'Exam Results',
    titleTr: 'Sınav Sonuçları',
    descriptionEn: 'Discuss disappointing exam results with your teacher.',
    descriptionTr: 'Hayal kırıklığı yaratan sınav sonuçlarını öğretmeninle tartış.',
    category: 'education',
    difficulty: 'B1',
    systemPrompt: 'You are a teacher discussing a student\'s poor exam performance. Ask about what went wrong, provide constructive feedback, and suggest study strategies. Be supportive but honest.',
  },
  {
    titleEn: 'Course Registration',
    titleTr: 'Kurs Kaydı',
    descriptionEn: 'Register for an online course and ask about content and certificates.',
    descriptionTr: 'Çevrimiçi kursa kaydol ve içerik ile sertifikalar hakkında sor.',
    category: 'education',
    difficulty: 'B1',
    systemPrompt: 'You are a customer support agent for an online learning platform. Help the user register for a course, explain the curriculum, certificate requirements, and refund policy. Be clear and professional.',
  },
  // ── Transport ─────────────────────────────────────────────────────────────
  {
    titleEn: 'Taxi Ride',
    titleTr: 'Taksi Yolculuğu',
    descriptionEn: 'Take a taxi, give your destination and discuss the route.',
    descriptionTr: 'Taksi bin, varış noktasını söyle ve güzergahı tartış.',
    category: 'travel',
    difficulty: 'A2',
    systemPrompt: 'You are a taxi driver. Ask the passenger for their destination, confirm the route, mention traffic conditions, and make small talk. Use simple, everyday conversational English.',
  },
  {
    titleEn: 'Car Breakdown',
    titleTr: 'Araç Arızası',
    descriptionEn: 'Call roadside assistance after your car breaks down on the road.',
    descriptionTr: 'Yolda arabanız arızalanınca yol yardım servisini ara.',
    category: 'travel',
    difficulty: 'B1',
    systemPrompt: 'You are a roadside assistance operator. Ask the caller for their location, the nature of the breakdown, and their membership details. Provide an estimated arrival time and give safety advice.',
  },
  {
    titleEn: 'Bus Information',
    titleTr: 'Otobüs Bilgisi',
    descriptionEn: 'Ask about bus times, routes, and stops at a bus stop or station.',
    descriptionTr: 'Otobüs durağında veya istasyonunda otobüs saatleri ve güzergahları hakkında sor.',
    category: 'daily',
    difficulty: 'A1',
    systemPrompt: 'You are a bus information officer. Answer questions about bus timetables, routes, and fares. Speak clearly and slowly, and repeat information if needed for the traveller.',
  },
  {
    titleEn: 'Ride-share Pickup',
    titleTr: 'Araç Paylaşımı Alımı',
    descriptionEn: 'Meet your ride-share driver and confirm your destination.',
    descriptionTr: 'Araç paylaşımı sürücünle buluş ve varış noktasını doğrula.',
    category: 'daily',
    difficulty: 'A2',
    systemPrompt: 'You are a ride-share driver picking up a passenger. Confirm the passenger\'s name and destination, ask for any preferences (music, AC, route), and make polite small talk during the ride.',
  },
];

async function ensureScenesSeeded() {
  for (const scene of PRESET_SCENES) {
    await prisma.rolePlayScene.upsert({
      where: { titleEn: scene.titleEn },
      update: {},
      create: { ...scene, difficulty: scene.difficulty as any },
    });
  }
}

router.get('/scenes', async (req: AuthRequest, res: Response) => {
  try {
    await ensureScenesSeeded();
    const { category } = req.query as { category?: string };
    const where: Record<string, unknown> = { isPreset: true };
    if (category) where.category = category;
    const scenes = await prisma.rolePlayScene.findMany({ where, orderBy: { difficulty: 'asc' } });
    res.json(scenes);
  } catch (err) {
    console.error('[roleplay/scenes]', err);
    res.status(500).json({ error: 'Sahneler alınamadı' });
  }
});

router.post('/sessions', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { sceneId, customScene } = req.body as { sceneId?: string; customScene?: string };
    if (!sceneId && !customScene) {
      res.status(400).json({ error: 'sceneId veya customScene gerekli' });
      return;
    }
    let systemPrompt = '';
    let title = '';

    if (sceneId) {
      const scene = await prisma.rolePlayScene.findUnique({ where: { id: sceneId } });
      if (!scene) { res.status(404).json({ error: 'Sahne bulunamadı' }); return; }
      systemPrompt = scene.systemPrompt;
      title = scene.titleTr;
    } else {
      title = 'Özel Sahne';
      systemPrompt = `You are playing a character in this scenario described by the user: "${customScene}". Create an appropriate character, introduce yourself naturally in English, and engage in conversation. The user is an English learner.`;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const level = user?.level ?? 'B1';
    const fullSystem = `${systemPrompt}\n\nThe user is a ${level} English learner (native language: Turkish). After each of their messages, append exactly this JSON on a new line: {"correction":null,"newWords":[]}\nIf you notice a grammar mistake, set correction to {"original":"...","suggestion":"...","explanation":"..."}.\nIf you use interesting vocabulary they might not know, add words to newWords array.`;

    const greeting = await claudeService.chat(req.apiKey!, [{ role: 'user', content: 'Hello, let\'s start!' }], fullSystem);
    const greetingText = greeting.content[0].type === 'text' ? greeting.content[0].text : 'Hello!';
    const { displayText } = parseRoleplayMessage(greetingText);

    const session = await prisma.rolePlaySession.create({
      data: {
        userId: req.userId,
        sceneId: sceneId ?? null,
        customScene: customScene ?? null,
        messages: [{ role: 'assistant', content: displayText, timestamp: new Date().toISOString() }],
      },
    });
    res.json({ session, greeting: displayText });
  } catch (err) {
    console.error('[roleplay/sessions POST]', err);
    res.status(500).json({ error: 'Oturum başlatılamadı' });
  }
});

function parseRoleplayMessage(text: string): { displayText: string; correction: unknown; newWords: string[] } {
  const jsonMatch = text.match(/\{"correction"[\s\S]*\}(?:\s*)$/);
  let correction = null;
  let newWords: string[] = [];
  let displayText = text;
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      correction = parsed.correction ?? null;
      newWords = parsed.newWords ?? [];
      displayText = text.slice(0, text.lastIndexOf(jsonMatch[0])).trimEnd();
    } catch { /* keep original */ }
  }
  return { displayText, correction, newWords };
}

router.post('/sessions/:id/message', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ error: 'Mesaj içeriği gerekli' });
      return;
    }
    const session = await prisma.rolePlaySession.findFirst({ where: { id, userId: req.userId }, include: { scene: true } });
    if (!session) { res.status(404).json({ error: 'Oturum bulunamadı' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const level = user?.level ?? 'B1';

    let systemPrompt = session.scene?.systemPrompt ?? `You are playing a character in this scenario: "${session.customScene}".`;
    systemPrompt += `\n\nThe user is a ${level} English learner (native language: Turkish). After each of their messages, append exactly this JSON on a new line: {"correction":null,"newWords":[]}\nIf you notice a grammar mistake, set correction to {"original":"...","suggestion":"...","explanation":"..."}.\nIf you use interesting vocabulary they might not know, add words to newWords array.`;

    const history = session.messages as { role: string; content: string }[];
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    apiMessages.push({ role: 'user', content: content.trim() });

    const response = await claudeService.chat(req.apiKey!, apiMessages, systemPrompt);
    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    const { displayText, correction, newWords } = parseRoleplayMessage(rawText);

    const updatedMessages = [
      ...history,
      { role: 'user', content: content.trim(), timestamp: new Date().toISOString() },
      { role: 'assistant', content: displayText, timestamp: new Date().toISOString() },
    ];

    const currentWords = session.wordsUsed ?? [];
    const allWords = [...new Set([...currentWords, ...(newWords as string[])])];

    await prisma.rolePlaySession.update({
      where: { id },
      data: { messages: updatedMessages, wordsUsed: allWords },
    });

    res.json({ reply: displayText, correction, newWords });
  } catch (err) {
    console.error('[roleplay/message]', err);
    res.status(500).json({ error: 'Mesaj gönderilemedi' });
  }
});

router.post('/sessions/:id/end', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await prisma.rolePlaySession.findFirst({ where: { id, userId: req.userId } });
    if (!session) { res.status(404).json({ error: 'Oturum bulunamadı' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const messages = session.messages as { role: string; content: string }[];
    const feedback = await claudeService.sessionFeedback(req.apiKey!, messages, user?.level ?? 'B1');

    await prisma.rolePlaySession.update({ where: { id }, data: { feedback: JSON.stringify(feedback) } });

    // Auto-add encountered words to user's vocabulary
    const wordsUsed = (session.wordsUsed ?? []) as string[];
    if (wordsUsed.length > 0) {
      const dbWords = await prisma.word.findMany({
        where: { word: { in: wordsUsed.map((w) => w.toLowerCase()) } },
      });
      await Promise.all(
        dbWords.map((dbWord) =>
          prisma.userWord.upsert({
            where: { userId_wordId: { userId: req.userId, wordId: dbWord.id } },
            create: { userId: req.userId, wordId: dbWord.id },
            update: {},
          })
        )
      );
    }

    res.json(feedback);
  } catch (err) {
    console.error('[roleplay/end]', err);
    res.status(500).json({ error: 'Geri bildirim alınamadı' });
  }
});

router.get('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.rolePlaySession.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { scene: true },
    });
    if (!session) { res.status(404).json({ error: 'Oturum bulunamadı' }); return; }
    res.json(session);
  } catch (err) {
    console.error('[roleplay/session GET]', err);
    res.status(500).json({ error: 'Oturum alınamadı' });
  }
});

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.rolePlaySession.findMany({
      where: { userId: req.userId },
      include: { scene: { select: { titleTr: true, titleEn: true, category: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(sessions);
  } catch (err) {
    console.error('[roleplay/sessions GET]', err);
    res.status(500).json({ error: 'Oturumlar alınamadı' });
  }
});

export default router;
