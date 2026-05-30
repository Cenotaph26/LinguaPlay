import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireApiKey } from '../middleware/apiKey';
import { claudeService } from '../services/claude.service';
import { srsService } from '../services/srs.service';

const router = Router();
router.use(requireAuth);

// ── Seed data ──────────────────────────────────────────────────────────────

const PRESET_WORDS = [
  // A1 ─────────────────────────────────────────────────────────────
  { word: 'family', level: 'A1', definition: 'a group of people related to each other', definitionTr: 'aile', phonetic: '/ˈfæmɪli/', examples: ['My family has four people.', 'We eat dinner together as a family.'] },
  { word: 'friend', level: 'A1', definition: 'a person you know and like', definitionTr: 'arkadaş', phonetic: '/frend/', examples: ['She is my best friend.', 'I have many friends at school.'] },
  { word: 'house', level: 'A1', definition: 'a building where people live', definitionTr: 'ev', phonetic: '/haʊs/', examples: ['We live in a big house.', 'The house has three bedrooms.'] },
  { word: 'school', level: 'A1', definition: 'a place where children learn', definitionTr: 'okul', phonetic: '/skuːl/', examples: ['I go to school every day.', 'School starts at eight o\'clock.'] },
  { word: 'food', level: 'A1', definition: 'things you eat to live', definitionTr: 'yiyecek', phonetic: '/fuːd/', examples: ['I like Italian food.', 'This food is very delicious.'] },
  { word: 'water', level: 'A1', definition: 'a clear liquid you drink', definitionTr: 'su', phonetic: '/ˈwɔːtər/', examples: ['Can I have a glass of water?', 'Water is important for life.'] },
  { word: 'book', level: 'A1', definition: 'a set of printed pages with a story or information', definitionTr: 'kitap', phonetic: '/bʊk/', examples: ['I am reading a good book.', 'She has many books in her room.'] },
  { word: 'car', level: 'A1', definition: 'a vehicle with four wheels', definitionTr: 'araba', phonetic: '/kɑːr/', examples: ['My father has a new car.', 'We drove the car to the city.'] },
  { word: 'dog', level: 'A1', definition: 'a common pet animal', definitionTr: 'köpek', phonetic: '/dɒɡ/', examples: ['My dog loves to play in the garden.', 'She walks her dog every morning.'] },
  { word: 'cat', level: 'A1', definition: 'a small furry pet animal', definitionTr: 'kedi', phonetic: '/kæt/', examples: ['The cat is sleeping on the sofa.', 'We have two cats at home.'] },
  { word: 'happy', level: 'A1', definition: 'feeling pleasure and joy', definitionTr: 'mutlu', phonetic: '/ˈhæpi/', examples: ['I am very happy today.', 'The children are happy at the party.'] },
  { word: 'big', level: 'A1', definition: 'large in size', definitionTr: 'büyük', phonetic: '/bɪɡ/', examples: ['That is a very big dog.', 'She lives in a big city.'] },
  { word: 'small', level: 'A1', definition: 'little in size', definitionTr: 'küçük', phonetic: '/smɔːl/', examples: ['The baby has small hands.', 'I have a small room.'] },
  { word: 'good', level: 'A1', definition: 'of a high quality or standard', definitionTr: 'iyi', phonetic: '/ɡʊd/', examples: ['This is a good film.', 'She is a good student.'] },
  { word: 'new', level: 'A1', definition: 'recently made or not used before', definitionTr: 'yeni', phonetic: '/njuː/', examples: ['I have a new phone.', 'She is wearing new shoes.'] },
  { word: 'old', level: 'A1', definition: 'having existed for a long time', definitionTr: 'eski / yaşlı', phonetic: '/əʊld/', examples: ['This is an old building.', 'My grandfather is very old.'] },
  { word: 'hot', level: 'A1', definition: 'having a high temperature', definitionTr: 'sıcak', phonetic: '/hɒt/', examples: ['The coffee is too hot.', 'It is very hot today.'] },
  { word: 'cold', level: 'A1', definition: 'having a low temperature', definitionTr: 'soğuk', phonetic: '/kəʊld/', examples: ['The water is cold.', 'I feel cold in winter.'] },
  { word: 'eat', level: 'A1', definition: 'to put food in your mouth and swallow it', definitionTr: 'yemek', phonetic: '/iːt/', examples: ['I eat breakfast every morning.', 'We eat dinner at seven.'] },
  { word: 'drink', level: 'A1', definition: 'to take liquid into your mouth and swallow', definitionTr: 'içmek', phonetic: '/drɪŋk/', examples: ['I drink coffee in the morning.', 'She drinks a lot of water.'] },
  { word: 'walk', level: 'A1', definition: 'to move on foot at a normal speed', definitionTr: 'yürümek', phonetic: '/wɔːk/', examples: ['I walk to school every day.', 'Let\'s walk in the park.'] },
  { word: 'run', level: 'A1', definition: 'to move quickly on foot', definitionTr: 'koşmak', phonetic: '/rʌn/', examples: ['I run in the morning.', 'The children run in the playground.'] },
  { word: 'sleep', level: 'A1', definition: 'to rest with your eyes closed', definitionTr: 'uyumak', phonetic: '/sliːp/', examples: ['I sleep eight hours a night.', 'The baby is sleeping.'] },
  { word: 'work', level: 'A1', definition: 'to do a job to earn money', definitionTr: 'çalışmak', phonetic: '/wɜːrk/', examples: ['My mother works in a hospital.', 'I work five days a week.'] },
  { word: 'play', level: 'A1', definition: 'to do something for fun', definitionTr: 'oynamak', phonetic: '/pleɪ/', examples: ['Children play in the garden.', 'I play football on weekends.'] },
  { word: 'help', level: 'A1', definition: 'to make something easier for someone', definitionTr: 'yardım etmek', phonetic: '/help/', examples: ['Can you help me?', 'She helps her mother in the kitchen.'] },
  { word: 'like', level: 'A1', definition: 'to find something pleasant', definitionTr: 'sevmek / beğenmek', phonetic: '/laɪk/', examples: ['I like chocolate ice cream.', 'Do you like music?'] },
  { word: 'love', level: 'A1', definition: 'to have a strong feeling of caring', definitionTr: 'sevmek / aşk', phonetic: '/lʌv/', examples: ['I love my family.', 'She loves reading books.'] },
  { word: 'want', level: 'A1', definition: 'to wish to have or do something', definitionTr: 'istemek', phonetic: '/wɒnt/', examples: ['I want a cup of tea.', 'Do you want to go to the cinema?'] },
  { word: 'need', level: 'A1', definition: 'to require something important', definitionTr: 'ihtiyaç duymak', phonetic: '/niːd/', examples: ['I need help with my homework.', 'Plants need water to grow.'] },
  { word: 'name', level: 'A1', definition: 'the word used to identify a person or thing', definitionTr: 'ad / isim', phonetic: '/neɪm/', examples: ['My name is Emma.', 'What is your name?'] },
  { word: 'day', level: 'A1', definition: 'a period of 24 hours', definitionTr: 'gün', phonetic: '/deɪ/', examples: ['Today is a beautiful day.', 'I go to school five days a week.'] },
  { word: 'week', level: 'A1', definition: 'a period of seven days', definitionTr: 'hafta', phonetic: '/wiːk/', examples: ['I work five days a week.', 'We go to the beach every week.'] },
  { word: 'year', level: 'A1', definition: 'a period of twelve months', definitionTr: 'yıl', phonetic: '/jɪər/', examples: ['I am twelve years old.', 'We moved to this city last year.'] },
  { word: 'time', level: 'A1', definition: 'the progress of events from past to future', definitionTr: 'zaman', phonetic: '/taɪm/', examples: ['What time is it?', 'I don\'t have much time.'] },
  { word: 'money', level: 'A1', definition: 'coins and notes used to buy things', definitionTr: 'para', phonetic: '/ˈmʌni/', examples: ['I have some money in my wallet.', 'She saves money every month.'] },
  { word: 'mother', level: 'A1', definition: 'a female parent', definitionTr: 'anne', phonetic: '/ˈmʌðər/', examples: ['My mother is a teacher.', 'She loves her mother very much.'] },
  { word: 'father', level: 'A1', definition: 'a male parent', definitionTr: 'baba', phonetic: '/ˈfɑːðər/', examples: ['My father works in a bank.', 'Her father taught her to drive.'] },
  { word: 'home', level: 'A1', definition: 'the place where you live', definitionTr: 'ev / yuva', phonetic: '/həʊm/', examples: ['I go home after school.', 'She feels comfortable at home.'] },
  { word: 'city', level: 'A1', definition: 'a large and important town', definitionTr: 'şehir', phonetic: '/ˈsɪti/', examples: ['London is a big city.', 'I live in the city centre.'] },
  // A2 ─────────────────────────────────────────────────────────────
  { word: 'travel', level: 'A2', definition: 'to go from one place to another', definitionTr: 'seyahat etmek', phonetic: '/ˈtrævəl/', examples: ['I love to travel to new countries.', 'She travels for work every month.'] },
  { word: 'busy', level: 'A2', definition: 'having a lot to do', definitionTr: 'meşgul', phonetic: '/ˈbɪzi/', examples: ['I am very busy today.', 'The city centre is always busy.'] },
  { word: 'tired', level: 'A2', definition: 'feeling that you need to rest or sleep', definitionTr: 'yorgun', phonetic: '/ˈtaɪərd/', examples: ['I am tired after the long journey.', 'She looks very tired.'] },
  { word: 'exciting', level: 'A2', definition: 'causing great enthusiasm and eagerness', definitionTr: 'heyecanlı', phonetic: '/ɪkˈsaɪtɪŋ/', examples: ['The football match was so exciting!', 'I have some exciting news.'] },
  { word: 'beautiful', level: 'A2', definition: 'very pleasant to look at', definitionTr: 'güzel', phonetic: '/ˈbjuːtɪfəl/', examples: ['What a beautiful sunset!', 'She has a beautiful voice.'] },
  { word: 'difficult', level: 'A2', definition: 'not easy to do or understand', definitionTr: 'zor', phonetic: '/ˈdɪfɪkəlt/', examples: ['This exercise is very difficult.', 'Learning a new language can be difficult.'] },
  { word: 'understand', level: 'A2', definition: 'to know the meaning of something', definitionTr: 'anlamak', phonetic: '/ˌʌndərˈstænd/', examples: ['Do you understand the question?', 'I don\'t understand this word.'] },
  { word: 'remember', level: 'A2', definition: 'to keep something in your memory', definitionTr: 'hatırlamak', phonetic: '/rɪˈmembər/', examples: ['I can\'t remember her name.', 'Do you remember our first meeting?'] },
  { word: 'forget', level: 'A2', definition: 'to fail to remember something', definitionTr: 'unutmak', phonetic: '/fərˈɡet/', examples: ['I often forget my keys.', 'Don\'t forget to call me!'] },
  { word: 'holiday', level: 'A2', definition: 'a period of time away from work for rest', definitionTr: 'tatil', phonetic: '/ˈhɒlɪdeɪ/', examples: ['We go on holiday every summer.', 'She is planning a holiday to Italy.'] },
  { word: 'restaurant', level: 'A2', definition: 'a place where you pay to eat meals', definitionTr: 'restoran', phonetic: '/ˈrestrɒnt/', examples: ['Let\'s go to a restaurant tonight.', 'The restaurant was very busy.'] },
  { word: 'shopping', level: 'A2', definition: 'the activity of buying things from shops', definitionTr: 'alışveriş', phonetic: '/ˈʃɒpɪŋ/', examples: ['I love shopping for clothes.', 'She does her shopping on Saturday.'] },
  { word: 'weather', level: 'A2', definition: 'the condition of the atmosphere at a particular time', definitionTr: 'hava durumu', phonetic: '/ˈweðər/', examples: ['What is the weather like today?', 'The weather in London is unpredictable.'] },
  { word: 'favourite', level: 'A2', definition: 'the one you like most', definitionTr: 'en sevilen / favori', phonetic: '/ˈfeɪvərɪt/', examples: ['Pizza is my favourite food.', 'What is your favourite colour?'] },
  { word: 'always', level: 'A2', definition: 'at all times or every time', definitionTr: 'her zaman', phonetic: '/ˈɔːlweɪz/', examples: ['She always wakes up early.', 'I always drink coffee in the morning.'] },
  { word: 'usually', level: 'A2', definition: 'most of the time or in most cases', definitionTr: 'genellikle', phonetic: '/ˈjuːʒuəli/', examples: ['I usually take the bus to work.', 'She usually goes to bed at ten.'] },
  { word: 'sometimes', level: 'A2', definition: 'on some occasions but not always', definitionTr: 'bazen', phonetic: '/ˈsʌmtaɪmz/', examples: ['I sometimes cook dinner at home.', 'He sometimes arrives late.'] },
  { word: 'often', level: 'A2', definition: 'many times or frequently', definitionTr: 'sık sık', phonetic: '/ˈɒfən/', examples: ['She often reads before bed.', 'We often visit our grandparents.'] },
  { word: 'never', level: 'A2', definition: 'at no time; not ever', definitionTr: 'hiçbir zaman', phonetic: '/ˈnevər/', examples: ['I never drink alcohol.', 'She never misses a class.'] },
  { word: 'together', level: 'A2', definition: 'with each other; in combination', definitionTr: 'birlikte', phonetic: '/təˈɡeðər/', examples: ['We cooked dinner together.', 'They work well together.'] },
  { word: 'problem', level: 'A2', definition: 'a difficult situation that needs to be solved', definitionTr: 'sorun / problem', phonetic: '/ˈprɒbləm/', examples: ['There is a problem with my phone.', 'Can you help me solve this problem?'] },
  { word: 'question', level: 'A2', definition: 'something you ask to get information', definitionTr: 'soru', phonetic: '/ˈkwestʃən/', examples: ['Can I ask you a question?', 'She answered all the questions correctly.'] },
  { word: 'answer', level: 'A2', definition: 'something you say in response to a question', definitionTr: 'cevap', phonetic: '/ˈɑːnsər/', examples: ['What is the answer to this question?', 'She gave a very good answer.'] },
  { word: 'arrive', level: 'A2', definition: 'to reach a place at the end of a journey', definitionTr: 'varmak / ulaşmak', phonetic: '/əˈraɪv/', examples: ['We arrived at the hotel at six.', 'The train arrives at ten past three.'] },
  { word: 'leave', level: 'A2', definition: 'to go away from a place', definitionTr: 'ayrılmak / çıkmak', phonetic: '/liːv/', examples: ['I leave home at eight every morning.', 'The bus leaves in five minutes.'] },
  { word: 'meet', level: 'A2', definition: 'to see and talk to someone for the first time or by arrangement', definitionTr: 'tanışmak / buluşmak', phonetic: '/miːt/', examples: ['Nice to meet you!', 'Let\'s meet at the café at noon.'] },
  { word: 'borrow', level: 'A2', definition: 'to take something that belongs to someone else and return it later', definitionTr: 'ödünç almak', phonetic: '/ˈbɒrəʊ/', examples: ['Can I borrow your pen?', 'She borrowed a book from the library.'] },
  { word: 'choose', level: 'A2', definition: 'to pick one from two or more options', definitionTr: 'seçmek', phonetic: '/tʃuːz/', examples: ['It is hard to choose between the two.', 'Choose the answer you think is correct.'] },
  { word: 'hospital', level: 'A2', definition: 'a place where sick people are treated', definitionTr: 'hastane', phonetic: '/ˈhɒspɪtəl/', examples: ['She works as a nurse in a hospital.', 'We took him to the hospital immediately.'] },
  { word: 'ticket', level: 'A2', definition: 'a small piece of paper that allows you to travel or enter a place', definitionTr: 'bilet', phonetic: '/ˈtɪkɪt/', examples: ['I bought a ticket for the concert.', 'Two tickets to Paris, please.'] },
  { word: 'price', level: 'A2', definition: 'how much something costs', definitionTr: 'fiyat', phonetic: '/praɪs/', examples: ['What is the price of this dress?', 'The price of petrol has gone up.'] },
  { word: 'address', level: 'A2', definition: 'the number and street name of a building', definitionTr: 'adres', phonetic: '/ˈædrəs/', examples: ['Can you write your address here?', 'I don\'t know his home address.'] },
  { word: 'message', level: 'A2', definition: 'a written or spoken communication', definitionTr: 'mesaj', phonetic: '/ˈmesɪdʒ/', examples: ['She sent me a message this morning.', 'Leave a message after the beep.'] },
  { word: 'important', level: 'A2', definition: 'having great value or significance', definitionTr: 'önemli', phonetic: '/ɪmˈpɔːrtənt/', examples: ['It is important to exercise regularly.', 'This is a very important meeting.'] },
  { word: 'easy', level: 'A2', definition: 'not difficult to do', definitionTr: 'kolay', phonetic: '/ˈiːzi/', examples: ['This test is very easy.', 'It is easy to learn basic words.'] },
  { word: 'careful', level: 'A2', definition: 'paying close attention to avoid mistakes or danger', definitionTr: 'dikkatli', phonetic: '/ˈkeərfəl/', examples: ['Be careful when you cross the road.', 'She is very careful with her work.'] },
  { word: 'enough', level: 'A2', definition: 'as much as is necessary', definitionTr: 'yeterli', phonetic: '/ɪˈnʌf/', examples: ['Have you had enough to eat?', 'I don\'t have enough money.'] },
  { word: 'healthy', level: 'A2', definition: 'in good health; good for your body', definitionTr: 'sağlıklı', phonetic: '/ˈhelθi/', examples: ['Eating vegetables is healthy.', 'She has a very healthy lifestyle.'] },
  { word: 'hungry', level: 'A2', definition: 'wanting or needing food', definitionTr: 'aç (yemek istemek)', phonetic: '/ˈhʌŋɡri/', examples: ['I am very hungry after exercise.', 'Are you hungry? Let\'s eat.'] },
  { word: 'thirsty', level: 'A2', definition: 'wanting or needing a drink', definitionTr: 'susuz / susamış', phonetic: '/ˈθɜːrsti/', examples: ['I am very thirsty. Can I have some water?', 'Running makes you thirsty.'] },
  { word: 'explain', level: 'A2', definition: 'to make something clear and easy to understand', definitionTr: 'açıklamak', phonetic: '/ɪkˈspleɪn/', examples: ['Can you explain this word to me?', 'The teacher explained the exercise clearly.'] },
  // B1 ─────────────────────────────────────────────────────────────
  { word: 'experience', level: 'B1', definition: 'knowledge or skill gained through doing something', definitionTr: 'deneyim', phonetic: '/ɪkˈspɪəriəns/', examples: ['She has a lot of experience in marketing.', 'It was an incredible experience.'] },
  { word: 'opportunity', level: 'B1', definition: 'a time or situation that makes it possible to do something', definitionTr: 'fırsat', phonetic: '/ˌɒpəˈtjuːnɪti/', examples: ['This is a great opportunity for your career.', 'Don\'t miss this opportunity.'] },
  { word: 'environment', level: 'B1', definition: 'the natural world around us', definitionTr: 'çevre', phonetic: '/ɪnˈvaɪrənmənt/', examples: ['We must protect the environment.', 'Pollution is damaging the environment.'] },
  { word: 'culture', level: 'B1', definition: 'the customs and beliefs of a particular group or country', definitionTr: 'kültür', phonetic: '/ˈkʌltʃər/', examples: ['Japan has a very rich culture.', 'She is interested in different cultures.'] },
  { word: 'suggest', level: 'B1', definition: 'to propose an idea for someone to consider', definitionTr: 'önermek', phonetic: '/səˈdʒest/', examples: ['I suggest we take a taxi.', 'What do you suggest we do?'] },
  { word: 'agree', level: 'B1', definition: 'to have the same opinion as someone', definitionTr: 'katılmak', phonetic: '/əˈɡriː/', examples: ['I agree with you completely.', 'They didn\'t agree on the solution.'] },
  { word: 'disagree', level: 'B1', definition: 'to have a different opinion from someone', definitionTr: 'katılmamak', phonetic: '/ˌdɪsəˈɡriː/', examples: ['I disagree with that decision.', 'It is fine to disagree respectfully.'] },
  { word: 'opinion', level: 'B1', definition: 'what you personally think about something', definitionTr: 'görüş / fikir', phonetic: '/əˈpɪnjən/', examples: ['In my opinion, this plan is not good.', 'What is your opinion on this topic?'] },
  { word: 'decision', level: 'B1', definition: 'a choice you make after thinking about it', definitionTr: 'karar', phonetic: '/dɪˈsɪʒən/', examples: ['It was a difficult decision to make.', 'She made the right decision.'] },
  { word: 'solution', level: 'B1', definition: 'an answer to a problem', definitionTr: 'çözüm', phonetic: '/səˈluːʃən/', examples: ['We need to find a solution quickly.', 'There is no easy solution.'] },
  { word: 'successful', level: 'B1', definition: 'having achieved what you wanted', definitionTr: 'başarılı', phonetic: '/səkˈsesfəl/', examples: ['She is a very successful businesswoman.', 'The project was successful.'] },
  { word: 'improve', level: 'B1', definition: 'to become or make something better', definitionTr: 'geliştirmek / iyileştirmek', phonetic: '/ɪmˈpruːv/', examples: ['I want to improve my English.', 'Regular practice will improve your skills.'] },
  { word: 'develop', level: 'B1', definition: 'to grow or cause something to grow over time', definitionTr: 'geliştirmek / büyümek', phonetic: '/dɪˈveləp/', examples: ['She developed her skills through hard work.', 'The company developed a new product.'] },
  { word: 'achieve', level: 'B1', definition: 'to successfully reach a goal', definitionTr: 'başarmak / elde etmek', phonetic: '/əˈtʃiːv/', examples: ['She achieved her dream of becoming a doctor.', 'You can achieve anything with hard work.'] },
  { word: 'increase', level: 'B1', definition: 'to become or make something larger in amount', definitionTr: 'artmak / artırmak', phonetic: '/ɪnˈkriːs/', examples: ['Prices increased by ten percent.', 'Exercise can increase energy levels.'] },
  { word: 'reduce', level: 'B1', definition: 'to make something smaller in amount', definitionTr: 'azaltmak', phonetic: '/rɪˈdjuːs/', examples: ['We need to reduce plastic waste.', 'Regular exercise reduces stress.'] },
  { word: 'situation', level: 'B1', definition: 'the set of conditions that exist at a particular time', definitionTr: 'durum / koşul', phonetic: '/ˌsɪtʃuˈeɪʃən/', examples: ['The situation is getting better.', 'I was in a difficult situation.'] },
  { word: 'communication', level: 'B1', definition: 'the exchange of information or ideas', definitionTr: 'iletişim', phonetic: '/kəˌmjuːnɪˈkeɪʃən/', examples: ['Good communication is key in relationships.', 'Technology has changed communication.'] },
  { word: 'information', level: 'B1', definition: 'facts or details about something', definitionTr: 'bilgi', phonetic: '/ˌɪnfəˈmeɪʃən/', examples: ['Can you give me some information about the course?', 'I found all the information online.'] },
  { word: 'technology', level: 'B1', definition: 'the use of science to make machines and solve problems', definitionTr: 'teknoloji', phonetic: '/tekˈnɒlədʒi/', examples: ['Technology changes very fast.', 'She works in the technology sector.'] },
  { word: 'society', level: 'B1', definition: 'people living together in organised communities', definitionTr: 'toplum', phonetic: '/səˈsaɪəti/', examples: ['Education is important for society.', 'Technology has changed modern society.'] },
  { word: 'government', level: 'B1', definition: 'the group of people who control a country', definitionTr: 'hükümet', phonetic: '/ˈɡʌvənmənt/', examples: ['The government announced new laws.', 'She works for the local government.'] },
  { word: 'education', level: 'B1', definition: 'the process of learning and teaching', definitionTr: 'eğitim', phonetic: '/ˌedʒuˈkeɪʃən/', examples: ['Education is the key to success.', 'She values education very highly.'] },
  { word: 'health', level: 'B1', definition: 'the condition of your body and mind', definitionTr: 'sağlık', phonetic: '/helθ/', examples: ['Exercise is important for your health.', 'She has very good health.'] },
  { word: 'describe', level: 'B1', definition: 'to say or write what someone or something is like', definitionTr: 'tanımlamak / betimlemek', phonetic: '/dɪˈskraɪb/', examples: ['Can you describe what you saw?', 'It is difficult to describe the feeling.'] },
  { word: 'prepare', level: 'B1', definition: 'to make something ready before it is needed', definitionTr: 'hazırlamak', phonetic: '/prɪˈpeər/', examples: ['I need to prepare for my presentation.', 'She prepared dinner for the family.'] },
  { word: 'compare', level: 'B1', definition: 'to look at the similarities and differences between things', definitionTr: 'karşılaştırmak', phonetic: '/kəmˈpeər/', examples: ['Compare these two products and choose.', 'Teachers often compare students\' results.'] },
  { word: 'consider', level: 'B1', definition: 'to think carefully about something', definitionTr: 'düşünmek / göz önünde bulundurmak', phonetic: '/kənˈsɪdər/', examples: ['Please consider all the options.', 'She considered changing her career.'] },
  { word: 'recommend', level: 'B1', definition: 'to suggest that someone should do or use something', definitionTr: 'tavsiye etmek', phonetic: '/ˌrekəˈmend/', examples: ['I recommend this book to everyone.', 'Can you recommend a good restaurant?'] },
  { word: 'comfortable', level: 'B1', definition: 'making you feel relaxed and at ease', definitionTr: 'rahat', phonetic: '/ˈkʌmftəbəl/', examples: ['This sofa is very comfortable.', 'She feels comfortable speaking English now.'] },
  { word: 'traditional', level: 'B1', definition: 'following customs that have existed for a long time', definitionTr: 'geleneksel', phonetic: '/trəˈdɪʃənəl/', examples: ['We had a traditional dinner for the holiday.', 'She wears traditional clothes at festivals.'] },
  { word: 'modern', level: 'B1', definition: 'relating to the present time; up to date', definitionTr: 'modern / çağdaş', phonetic: '/ˈmɒdərn/', examples: ['The building has a modern design.', 'Modern technology makes life easier.'] },
  { word: 'popular', level: 'B1', definition: 'liked or enjoyed by many people', definitionTr: 'popüler / yaygın', phonetic: '/ˈpɒpjələr/', examples: ['This song is very popular right now.', 'English is a popular language to learn.'] },
  { word: 'interested', level: 'B1', definition: 'wanting to know more about something', definitionTr: 'ilgili / meraklı', phonetic: '/ˈɪntrəstɪd/', examples: ['I am very interested in history.', 'Are you interested in the job?'] },
  { word: 'confident', level: 'B1', definition: 'feeling sure about yourself and your abilities', definitionTr: 'kendinden emin / güvenli', phonetic: '/ˈkɒnfɪdənt/', examples: ['She is confident in her work.', 'Practice makes you more confident.'] },
  { word: 'responsibility', level: 'B1', definition: 'something you must do as part of your job or duty', definitionTr: 'sorumluluk', phonetic: '/rɪˌspɒnsɪˈbɪlɪti/', examples: ['Parents have a responsibility to their children.', 'It is your responsibility to be on time.'] },
  { word: 'attitude', level: 'B1', definition: 'the way you think or feel about something', definitionTr: 'tutum / tavır', phonetic: '/ˈætɪtjuːd/', examples: ['She has a very positive attitude.', 'Your attitude determines your success.'] },
  { word: 'support', level: 'B1', definition: 'to help someone or give them encouragement', definitionTr: 'desteklemek', phonetic: '/səˈpɔːrt/', examples: ['My family always supports me.', 'She supports her local football team.'] },
  { word: 'avoid', level: 'B1', definition: 'to keep away from something', definitionTr: 'kaçınmak', phonetic: '/əˈvɔɪd/', examples: ['Try to avoid eating too much sugar.', 'I try to avoid driving in rush hour.'] },
  { word: 'manage', level: 'B1', definition: 'to succeed in doing something difficult', definitionTr: 'başarmak / yönetmek', phonetic: '/ˈmænɪdʒ/', examples: ['Did you manage to finish the work?', 'She manages a team of ten people.'] },
  // B2 ─────────────────────────────────────────────────────────────
  { word: 'significant', level: 'B2', definition: 'important or having a major effect', definitionTr: 'önemli / anlamlı', phonetic: '/sɪɡˈnɪfɪkənt/', examples: ['There has been a significant improvement.', 'The findings are statistically significant.'] },
  { word: 'inevitable', level: 'B2', definition: 'impossible to prevent or avoid', definitionTr: 'kaçınılmaz', phonetic: '/ɪnˈevɪtəbəl/', examples: ['Change is inevitable in life.', 'The conflict seemed inevitable.'] },
  { word: 'demonstrate', level: 'B2', definition: 'to show clearly how something works or is true', definitionTr: 'kanıtlamak / göstermek', phonetic: '/ˈdemənstreɪt/', examples: ['She demonstrated how to use the machine.', 'The data demonstrates the effectiveness.'] },
  { word: 'implement', level: 'B2', definition: 'to put a plan or decision into action', definitionTr: 'uygulamak', phonetic: '/ˈɪmplɪment/', examples: ['We need to implement these changes quickly.', 'The new policy was implemented last year.'] },
  { word: 'analyse', level: 'B2', definition: 'to examine something in detail to understand it', definitionTr: 'analiz etmek / incelemek', phonetic: '/ˈænəlaɪz/', examples: ['Scientists analysed the data carefully.', 'Let\'s analyse the results.'] },
  { word: 'evaluate', level: 'B2', definition: 'to judge the quality or value of something', definitionTr: 'değerlendirmek', phonetic: '/ɪˈvæljueɪt/', examples: ['We need to evaluate the risks.', 'The teacher evaluates students each month.'] },
  { word: 'approximately', level: 'B2', definition: 'used to show an amount is not exact', definitionTr: 'yaklaşık olarak', phonetic: '/əˈprɒksɪmətli/', examples: ['The project took approximately six months.', 'There were approximately 500 people there.'] },
  { word: 'despite', level: 'B2', definition: 'without being affected by something', definitionTr: 'rağmen', phonetic: '/dɪˈspaɪt/', examples: ['She ran despite the rain.', 'Despite the difficulties, he succeeded.'] },
  { word: 'whereas', level: 'B2', definition: 'used to contrast two things', definitionTr: 'oysa / halbuki', phonetic: '/weərˈæz/', examples: ['She likes tea, whereas I prefer coffee.', 'He is confident, whereas she is shy.'] },
  { word: 'consequence', level: 'B2', definition: 'a result or effect of an action', definitionTr: 'sonuç / yansıma', phonetic: '/ˈkɒnsɪkwəns/', examples: ['Think about the consequences of your actions.', 'The consequences of climate change are serious.'] },
  { word: 'perspective', level: 'B2', definition: 'a particular way of thinking about something', definitionTr: 'bakış açısı', phonetic: '/pərˈspektɪv/', examples: ['Try to see it from my perspective.', 'The article gives a different perspective.'] },
  { word: 'controversial', level: 'B2', definition: 'causing strong disagreement among people', definitionTr: 'tartışmalı', phonetic: '/ˌkɒntrəˈvɜːrʃəl/', examples: ['This is a very controversial topic.', 'The film was controversial when it was released.'] },
  { word: 'sustainable', level: 'B2', definition: 'able to continue without damaging the environment', definitionTr: 'sürdürülebilir', phonetic: '/səˈsteɪnəbəl/', examples: ['We need a sustainable energy source.', 'The company uses sustainable materials.'] },
  { word: 'efficient', level: 'B2', definition: 'achieving good results without wasting time or energy', definitionTr: 'verimli / etkin', phonetic: '/ɪˈfɪʃənt/', examples: ['This machine is very energy efficient.', 'She is an efficient and organised worker.'] },
  { word: 'innovative', level: 'B2', definition: 'using new ideas or methods', definitionTr: 'yenilikçi / inovatif', phonetic: '/ˈɪnəveɪtɪv/', examples: ['The company has an innovative approach.', 'We need innovative solutions to this problem.'] },
  { word: 'fundamental', level: 'B2', definition: 'forming the most important or essential basis of something', definitionTr: 'temel / köklü', phonetic: '/ˌfʌndəˈmentəl/', examples: ['This is a fundamental human right.', 'Trust is fundamental in any relationship.'] },
  { word: 'challenge', level: 'B2', definition: 'something that requires effort and determination', definitionTr: 'zorluk / meydan okuma', phonetic: '/ˈtʃælɪndʒ/', examples: ['Learning a language is a challenge.', 'She enjoys a challenge at work.'] },
  { word: 'influence', level: 'B2', definition: 'to have an effect on how someone or something develops', definitionTr: 'etkilemek / etki', phonetic: '/ˈɪnfluəns/', examples: ['Her teacher influenced her career choice.', 'Social media has a big influence on young people.'] },
  { word: 'establish', level: 'B2', definition: 'to set up or create something officially', definitionTr: 'kurmak / oluşturmak', phonetic: '/ɪˈstæblɪʃ/', examples: ['She established her own business at 25.', 'The school was established in 1890.'] },
  { word: 'phenomenon', level: 'B2', definition: 'a fact or event that is observed', definitionTr: 'olgu / fenomen', phonetic: '/fɪˈnɒmɪnən/', examples: ['Social media is a modern phenomenon.', 'Scientists studied the natural phenomenon.'] },
  { word: 'assumption', level: 'B2', definition: 'something you accept as true without proof', definitionTr: 'varsayım', phonetic: '/əˈsʌmpʃən/', examples: ['Don\'t make assumptions about people.', 'That assumption turned out to be wrong.'] },
  { word: 'acknowledge', level: 'B2', definition: 'to accept or admit that something is true', definitionTr: 'kabul etmek / onaylamak', phonetic: '/əkˈnɒlɪdʒ/', examples: ['She acknowledged the mistake.', 'He acknowledged their support publicly.'] },
  { word: 'allocate', level: 'B2', definition: 'to give something to someone for a specific purpose', definitionTr: 'tahsis etmek / ayırmak', phonetic: '/ˈæləkeɪt/', examples: ['The government allocated money for schools.', 'We need to allocate more time to this task.'] },
  { word: 'contribute', level: 'B2', definition: 'to give something, especially money or help, to a shared goal', definitionTr: 'katkıda bulunmak', phonetic: '/kənˈtrɪbjuːt/', examples: ['Everyone can contribute to solving this problem.', 'She contributed greatly to the project.'] },
  { word: 'diverse', level: 'B2', definition: 'including many different types of people or things', definitionTr: 'çeşitli / farklı', phonetic: '/daɪˈvɜːrs/', examples: ['London is an incredibly diverse city.', 'The team has a diverse set of skills.'] },
  // C1 ─────────────────────────────────────────────────────────────
  { word: 'ambiguous', level: 'C1', definition: 'having more than one possible meaning; unclear', definitionTr: 'belirsiz / muğlak', phonetic: '/æmˈbɪɡjuəs/', examples: ['The instructions were ambiguous.', 'The sentence is grammatically ambiguous.'] },
  { word: 'eloquent', level: 'C1', definition: 'able to express ideas clearly and persuasively', definitionTr: 'belagatli / etkileyici konuşan', phonetic: '/ˈeləkwənt/', examples: ['She gave an eloquent speech.', 'He is an eloquent defender of human rights.'] },
  { word: 'inherent', level: 'C1', definition: 'existing naturally as a part of something', definitionTr: 'doğal / içkin', phonetic: '/ɪnˈhɪərənt/', examples: ['There are inherent risks in every investment.', 'The problem is inherent in the design.'] },
  { word: 'proliferate', level: 'C1', definition: 'to increase rapidly in number or amount', definitionTr: 'hızla çoğalmak / yaygınlaşmak', phonetic: '/prəˈlɪfəreɪt/', examples: ['Social media platforms have proliferated.', 'New species cannot proliferate in this climate.'] },
  { word: 'nuance', level: 'C1', definition: 'a small but important difference in meaning or feeling', definitionTr: 'nüans / ince ayrım', phonetic: '/ˈnjuːɑːns/', examples: ['She understood every nuance of the language.', 'The artist captured the nuances of light.'] },
  { word: 'undermine', level: 'C1', definition: 'to gradually weaken something or someone', definitionTr: 'zayıflatmak / baltalamak', phonetic: '/ˌʌndərˈmaɪn/', examples: ['His actions undermined trust in the team.', 'Stress can undermine your health.'] },
  { word: 'mitigate', level: 'C1', definition: 'to make something less severe or harmful', definitionTr: 'azaltmak / hafifletmek', phonetic: '/ˈmɪtɪɡeɪt/', examples: ['They took steps to mitigate the risks.', 'Technology can mitigate climate change effects.'] },
  { word: 'scrutinise', level: 'C1', definition: 'to examine something very carefully', definitionTr: 'titizlikle incelemek', phonetic: '/ˈskruːtɪnaɪz/', examples: ['The committee scrutinised every document.', 'Her work was closely scrutinised.'] },
  { word: 'reconcile', level: 'C1', definition: 'to restore a friendly relationship after a disagreement', definitionTr: 'uzlaştırmak / bağdaştırmak', phonetic: '/ˈrekənsaɪl/', examples: ['They were finally able to reconcile.', 'It is hard to reconcile these two ideas.'] },
  { word: 'paramount', level: 'C1', definition: 'more important than anything else', definitionTr: 'en önemli / başat', phonetic: '/ˈpærəmaʊnt/', examples: ['Safety is of paramount importance.', 'Customer satisfaction is paramount.'] },
];

let wordsSeedDone = false;

async function ensureWordsSeeded() {
  if (wordsSeedDone) return;
  const count = await prisma.word.count();
  if (count < PRESET_WORDS.length) {
    for (const w of PRESET_WORDS) {
      await prisma.word.upsert({
        where: { word: w.word },
        update: {},
        create: {
          word: w.word,
          level: w.level as any,
          definition: w.definition,
          definitionTr: w.definitionTr,
          phonetic: w.phonetic,
          examples: w.examples,
        },
      });
    }
  }
  wordsSeedDone = true;
}

// GET /vocabulary/browse?level=A1&q=apple&page=1&limit=30
// Returns all words in DB (not user-specific), with a flag if user already has them
router.get('/browse', async (req: AuthRequest, res: Response) => {
  try {
    await ensureWordsSeeded();
    const { level, q, page = '1', limit = '30' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (level) where.level = level;
    if (q) where.word = { contains: q.toLowerCase() };

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        orderBy: [{ level: 'asc' }, { word: 'asc' }],
        skip,
        take: parseInt(limit),
        include: { userWords: { where: { userId: req.userId }, select: { id: true, status: true } } },
      }),
      prisma.word.count({ where }),
    ]);

    res.json({
      words: words.map((w) => ({
        ...w,
        added: w.userWords.length > 0,
        userWordId: w.userWords[0]?.id ?? null,
        status: w.userWords[0]?.status ?? null,
        userWords: undefined,
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('[vocabulary/browse]', err);
    res.status(500).json({ error: 'Kelimeler alınamadı' });
  }
});

router.get('/words', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = { userId: req.userId };
    if (status) where.status = status;

    const [userWords, total] = await Promise.all([
      prisma.userWord.findMany({
        where,
        include: { word: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.userWord.count({ where }),
    ]);

    res.json({
      words: userWords.map(uw => ({ ...uw.word, userWord: { id: uw.id, status: uw.status, nextReview: uw.nextReview, interval: uw.interval, easeFactor: uw.easeFactor, repetitions: uw.repetitions } })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('[vocabulary/words]', err);
    res.status(500).json({ error: 'Kelimeler alınamadı' });
  }
});

router.get('/due', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const due = await prisma.userWord.findMany({
      where: { userId: req.userId, nextReview: { lte: now }, status: { not: 'MASTERED' } },
      include: { word: true },
      orderBy: { nextReview: 'asc' },
      take: 50,
    });
    res.json(due.map(uw => ({ ...uw.word, userWord: { id: uw.id, status: uw.status, nextReview: uw.nextReview, interval: uw.interval, easeFactor: uw.easeFactor, repetitions: uw.repetitions } })));
  } catch (err) {
    console.error('[vocabulary/due]', err);
    res.status(500).json({ error: 'Tekrar edilecek kelimeler alınamadı' });
  }
});

router.post('/review', async (req: AuthRequest, res: Response) => {
  try {
    const { userWordId, quality } = req.body as { userWordId?: string; quality?: number };
    if (!userWordId || quality === undefined || quality < 0 || quality > 3) {
      res.status(400).json({ error: 'userWordId ve quality (0-3) gerekli' });
      return;
    }
    const uw = await prisma.userWord.findFirst({
      where: { id: userWordId, userId: req.userId },
    });
    if (!uw) {
      res.status(404).json({ error: 'Kelime bulunamadı' });
      return;
    }
    const { interval, easeFactor, repetitions, nextReview, status } = srsService.calculate(
      quality as 0 | 1 | 2 | 3,
      uw.interval,
      uw.easeFactor,
      uw.repetitions,
    );

    const XP_BY_QUALITY = [1, 3, 5, 10];
    const xpGain = XP_BY_QUALITY[quality as number] ?? 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { xp: true, streak: true, lastActiveDate: true } });
    const lastDate = user?.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = user?.streak ?? 0;
    let newLastActive = user?.lastActiveDate ?? null;
    if (!lastDate || lastDate.getTime() < today.getTime()) {
      newStreak = lastDate?.getTime() === yesterday.getTime() ? newStreak + 1 : 1;
      newLastActive = today;
    }

    const [updated] = await Promise.all([
      prisma.userWord.update({ where: { id: userWordId }, data: { interval, easeFactor, repetitions, nextReview, status } }),
      prisma.user.update({ where: { id: req.userId }, data: { xp: { increment: xpGain }, streak: newStreak, lastActiveDate: newLastActive } }),
    ]);
    res.json(updated);
  } catch (err) {
    console.error('[vocabulary/review]', err);
    res.status(500).json({ error: 'İnceleme kaydedilemedi' });
  }
});

router.post('/add', async (req: AuthRequest, res: Response) => {
  try {
    const { word, definition, definitionTr, examples, phonetic, level } = req.body as {
      word?: string; definition?: string; definitionTr?: string;
      examples?: string[]; phonetic?: string; level?: string;
    };
    if (!word || !definition || !definitionTr || !level) {
      res.status(400).json({ error: 'word, definition, definitionTr ve level gerekli' });
      return;
    }
    const dbWord = await prisma.word.upsert({
      where: { word: word.toLowerCase() },
      create: { word: word.toLowerCase(), definition, definitionTr, examples: examples ?? [], phonetic, level: level as any },
      update: {},
    });
    const userWord = await prisma.userWord.upsert({
      where: { userId_wordId: { userId: req.userId, wordId: dbWord.id } },
      create: { userId: req.userId, wordId: dbWord.id },
      update: {},
    });
    res.json({ ...dbWord, userWord });
  } catch (err) {
    console.error('[vocabulary/add]', err);
    res.status(500).json({ error: 'Kelime eklenemedi' });
  }
});

// Save a word by name only (for roleplay discovered words already in DB)
router.post('/save', async (req: AuthRequest, res: Response) => {
  try {
    const { word } = req.body as { word?: string };
    if (!word) { res.status(400).json({ error: 'word gerekli' }); return; }
    const dbWord = await prisma.word.findFirst({ where: { word: word.toLowerCase() } });
    if (!dbWord) { res.status(404).json({ error: 'Kelime veritabanında bulunamadı' }); return; }
    const userWord = await prisma.userWord.upsert({
      where: { userId_wordId: { userId: req.userId, wordId: dbWord.id } },
      create: { userId: req.userId, wordId: dbWord.id },
      update: {},
    });
    res.json({ ...dbWord, userWord });
  } catch (err) {
    console.error('[vocabulary/save]', err);
    res.status(500).json({ error: 'Kelime kaydedilemedi' });
  }
});

router.post('/explain', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { word, context = '' } = req.body as { word?: string; context?: string };
    if (!word) { res.status(400).json({ error: 'word gerekli' }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const explanation = await claudeService.explainWord(req.apiKey!, word.trim(), context, user?.level ?? 'B1');
    res.json({ ...explanation, word: word.trim() });
  } catch (err) {
    console.error('[vocabulary/explain POST]', err);
    res.status(500).json({ error: 'Açıklama alınamadı' });
  }
});

router.get('/:wordId/explain', requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const { wordId } = req.params;
    const { context = '' } = req.query as { context?: string };
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { level: true } });
    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      res.status(404).json({ error: 'Kelime bulunamadı' });
      return;
    }
    const explanation = await claudeService.explainWord(req.apiKey!, word.word, context, user?.level ?? 'B1');
    res.json(explanation);
  } catch (err) {
    console.error('[vocabulary/explain]', err);
    res.status(500).json({ error: 'Açıklama alınamadı' });
  }
});

export default router;
