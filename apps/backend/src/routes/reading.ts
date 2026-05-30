import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const READING_TEXTS = [
  // ── A1 (8) ────────────────────────────────────────────────────────────────
  {
    title: 'My Family',
    level: 'A1',
    category: 'story',
    text: `My name is Emma. I have a small family. There are four people in my family: my mum, my dad, my brother Tom, and me.

My mum's name is Susan. She is a teacher. She works at a school near our house. She wakes up early every morning.

My dad's name is David. He is a doctor. He works at the hospital in the city. He sometimes comes home late.

Tom is my little brother. He is eight years old. He likes football and video games. We sometimes play together on weekends.

I am twelve years old. I like reading books and drawing pictures. We all eat dinner together every evening. I love my family very much.`,
    wordCount: 100,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'wakes up early', tr: 'erken kalkar' },
      { phrase: 'comes home late', tr: 'geç eve gelir' },
      { phrase: 'on weekends', tr: 'hafta sonları' },
    ],
    comprehensionQs: [
      { question: 'How many people are in Emma\'s family?', options: ['Three', 'Four', 'Five', 'Two'], answerIndex: 1 },
      { question: 'What does Emma\'s mother do?', options: ['She is a doctor', 'She is a teacher', 'She is a nurse', 'She works at a hospital'], answerIndex: 1 },
      { question: 'What does Tom like?', options: ['Books and drawing', 'Football and video games', 'Reading and cooking', 'Music and sport'], answerIndex: 1 },
    ],
  },
  {
    title: 'My Favourite Food',
    level: 'A1',
    category: 'story',
    text: `I love food. My favourite food is pizza. Pizza is from Italy. It has a round shape and it is very delicious.

A pizza has many parts. The base is made of bread. On top there is tomato sauce. Then there is cheese. You can add many things to pizza: peppers, mushrooms, or meat.

I eat pizza every Friday with my family. We order it from a restaurant near our house. Sometimes we make pizza at home. It is fun to put your own toppings on it.

My second favourite food is ice cream. I like chocolate flavour the best. Ice cream is cold and sweet. I eat it in summer especially.

What is your favourite food?`,
    wordCount: 105,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'made of bread', tr: 'ekmekten yapılmış' },
      { phrase: 'on top', tr: 'üzerinde' },
      { phrase: 'especially', tr: 'özellikle' },
    ],
    comprehensionQs: [
      { question: 'Where is pizza from?', options: ['France', 'Spain', 'Italy', 'Greece'], answerIndex: 2 },
      { question: 'When does the writer eat pizza with family?', options: ['Every Saturday', 'Every Friday', 'Every Sunday', 'Every Wednesday'], answerIndex: 1 },
      { question: 'What is the writer\'s favourite ice cream flavour?', options: ['Vanilla', 'Strawberry', 'Mango', 'Chocolate'], answerIndex: 3 },
    ],
  },
  {
    title: 'A Day in My Life',
    level: 'A1',
    category: 'story',
    text: `My name is Lucas. This is my typical day.

I wake up at seven o'clock in the morning. I wash my face and brush my teeth. Then I eat breakfast. I usually eat bread and drink orange juice.

I go to school at eight o'clock. I walk to school because it is not far from my house. At school I study English, maths, and science. I have lunch at twelve thirty. I eat with my friends in the school canteen.

School finishes at three thirty. I go home and do my homework. After that, I watch TV or play outside with my friends.

I have dinner with my family at seven o'clock. We talk about our day. I go to bed at nine thirty.

I like my daily routine. It is comfortable and easy.`,
    wordCount: 125,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'typical day', tr: 'tipik gün' },
      { phrase: 'go to school', tr: 'okula gitmek' },
      { phrase: 'daily routine', tr: 'günlük rutin' },
    ],
    comprehensionQs: [
      { question: 'What time does Lucas wake up?', options: ['Six o\'clock', 'Seven o\'clock', 'Eight o\'clock', 'Nine o\'clock'], answerIndex: 1 },
      { question: 'Why does Lucas walk to school?', options: ['He likes walking', 'It is not far', 'There is no bus', 'His parents work far away'], answerIndex: 1 },
      { question: 'What does Lucas do after homework?', options: ['He reads books', 'He sleeps', 'He watches TV or plays outside', 'He helps his mother'], answerIndex: 2 },
    ],
  },
  {
    title: 'The Seasons',
    level: 'A1',
    category: 'article',
    text: `There are four seasons in a year: spring, summer, autumn, and winter.

Spring is in March, April, and May. The weather is warm and the flowers bloom. Birds sing in the trees. People like to go to the park in spring.

Summer is in June, July, and August. The weather is hot and sunny. Children go swimming and play outside. Many families go on holiday in summer.

Autumn is in September, October, and November. The leaves on trees turn yellow, orange, and red. They fall to the ground. The weather gets cooler.

Winter is in December, January, and February. The weather is cold. Sometimes it snows. Children make snowmen and drink hot chocolate. Christmas is in winter.

My favourite season is summer because I can play outside all day.`,
    wordCount: 125,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'flowers bloom', tr: 'çiçekler açar' },
      { phrase: 'go on holiday', tr: 'tatile gitmek' },
      { phrase: 'turn yellow', tr: 'sarıya dönmek' },
    ],
    comprehensionQs: [
      { question: 'In which months is autumn?', options: ['June, July, August', 'March, April, May', 'September, October, November', 'December, January, February'], answerIndex: 2 },
      { question: 'What do children do in winter?', options: ['Go swimming', 'Make snowmen', 'Go to the park', 'Pick flowers'], answerIndex: 1 },
      { question: 'Why does the writer like summer?', options: ['Because of snow', 'Because of flowers', 'Because they can play outside all day', 'Because of Christmas'], answerIndex: 2 },
    ],
  },
  {
    title: 'My Pet Dog',
    level: 'A1',
    category: 'story',
    text: `I have a dog. His name is Max. Max is a golden retriever. He is two years old. He has soft, golden fur and big brown eyes.

Max is very friendly and playful. He loves to run in the garden. Every morning I take him for a walk in the park. He likes to meet other dogs and play with them.

Max eats special dog food two times a day. He also loves to eat biscuits as a treat. He drinks a lot of water.

Every evening, Max sits next to me on the sofa. We watch TV together. He sometimes falls asleep on my legs.

Max is my best friend. He makes me happy when I am sad. I love Max very much and I think he loves me too.`,
    wordCount: 115,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'golden retriever', tr: 'altın rengi köpek ırkı' },
      { phrase: 'as a treat', tr: 'ödül olarak' },
      { phrase: 'falls asleep', tr: 'uykuya dalar' },
    ],
    comprehensionQs: [
      { question: 'How old is Max?', options: ['One year old', 'Three years old', 'Two years old', 'Four years old'], answerIndex: 2 },
      { question: 'When does the writer take Max for a walk?', options: ['In the evening', 'In the afternoon', 'At night', 'Every morning'], answerIndex: 3 },
      { question: 'Where does Max sit in the evening?', options: ['On the floor', 'In his bed', 'Next to the writer on the sofa', 'In the garden'], answerIndex: 2 },
    ],
  },
  {
    title: 'At the Market',
    level: 'A1',
    category: 'dialogue',
    text: `Every Saturday morning, my mother and I go to the local market. The market is in the town square. It is always busy and colourful.

There are many stalls at the market. You can buy fruits and vegetables, meat and fish, bread, flowers, and clothes.

Today we need to buy apples, tomatoes, onions, and some bread. First we go to the fruit stall.

"Good morning! How much are these apples?" my mother asks.
"They are two pounds for a kilo," says the seller.
"I'll take two kilos, please," says my mother.

Then we buy the tomatoes and onions. We go to the baker for fresh bread. The bread smells wonderful.

We carry our shopping bags home. I am happy because the market is fun and the food is fresh.`,
    wordCount: 120,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'local market', tr: 'yerel pazar' },
      { phrase: 'How much are', tr: '...ne kadar?' },
      { phrase: 'fresh bread', tr: 'taze ekmek' },
    ],
    comprehensionQs: [
      { question: 'Where is the market?', options: ['Near a school', 'In the town square', 'Next to the hospital', 'On a main street'], answerIndex: 1 },
      { question: 'How much do the apples cost?', options: ['One pound a kilo', 'Three pounds a kilo', 'Two pounds a kilo', 'Four pounds a kilo'], answerIndex: 2 },
      { question: 'How many kilos of apples do they buy?', options: ['One kilo', 'Three kilos', 'Four kilos', 'Two kilos'], answerIndex: 3 },
    ],
  },
  {
    title: 'My Bedroom',
    level: 'A1',
    category: 'story',
    text: `My bedroom is my favourite place in the house. It is not very big, but it is comfortable and cosy.

There is a bed near the window. My bed has a blue and white cover. Next to the bed, there is a small table with a lamp. I read before I sleep every night.

On the other side of the room, there is a desk. I do my homework at the desk. Above the desk, I have some shelves with books and games.

My wardrobe is next to the door. It is big and holds all my clothes. On the wall, I have posters of my favourite football team.

The floor is wooden and I have a soft rug. My cat, Mimi, often sleeps on the rug.

I keep my room tidy because I like to find things easily.`,
    wordCount: 125,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'cosy', tr: 'sıcacık / ferah' },
      { phrase: 'on the other side', tr: 'diğer tarafta' },
      { phrase: 'keep it tidy', tr: 'toplanmış tutmak' },
    ],
    comprehensionQs: [
      { question: 'Where is the bed?', options: ['Next to the door', 'Near the window', 'In the middle', 'Next to the wardrobe'], answerIndex: 1 },
      { question: 'What does the writer do at the desk?', options: ['Reads books', 'Watches TV', 'Does homework', 'Eats dinner'], answerIndex: 2 },
      { question: 'Where does the cat sleep?', options: ['On the bed', 'Under the desk', 'On the soft rug', 'On the wardrobe'], answerIndex: 2 },
    ],
  },
  {
    title: 'Hello! Nice to Meet You',
    level: 'A1',
    category: 'dialogue',
    text: `Sofia: Hello! My name is Sofia. What is your name?
Ben: Hi! I'm Ben. Nice to meet you, Sofia.
Sofia: Nice to meet you too, Ben. Where are you from?
Ben: I'm from Canada. And you?
Sofia: I'm from Brazil. How old are you?
Ben: I'm twenty-three. And you?
Sofia: I'm twenty-one. What do you do?
Ben: I'm a student. I study engineering. What about you?
Sofia: I'm a student too. I study languages. I love English!
Ben: Me too! Do you speak any other languages?
Sofia: Yes! I speak Portuguese and Spanish. Do you?
Ben: I speak English and a little French. This English class is great!
Sofia: Yes! I hope we can practise together.
Ben: That's a great idea! Let's swap phone numbers.`,
    wordCount: 115,
    readingTimeMin: 1,
    keyPhrases: [
      { phrase: 'Nice to meet you', tr: 'Tanıştığımıza memnun oldum' },
      { phrase: 'What do you do?', tr: 'Ne iş yapıyorsunuz?' },
      { phrase: 'swap phone numbers', tr: 'telefon numarası alışverişi yapmak' },
    ],
    comprehensionQs: [
      { question: 'Where is Ben from?', options: ['Australia', 'England', 'Canada', 'America'], answerIndex: 2 },
      { question: 'What does Sofia study?', options: ['Engineering', 'Languages', 'Medicine', 'Art'], answerIndex: 1 },
      { question: 'How many languages does Sofia speak?', options: ['One', 'Two', 'Three', 'Four'], answerIndex: 2 },
    ],
  },
  // ── A2 (12) ───────────────────────────────────────────────────────────────
  {
    title: 'A Weekend in the City',
    level: 'A2',
    category: 'story',
    text: `Last weekend I visited London with my friend Anna. It was my first time in the city, and I was very excited.

We arrived on Saturday morning by train. The city was busy and full of tourists. First, we went to see the Tower of London. It was really impressive — we learnt about its history as a royal palace and a prison.

After lunch at a small café near the Thames, we took a boat trip along the river. We saw Tower Bridge open for a large ship — it was spectacular!

In the afternoon, we visited the British Museum. I especially liked the ancient Egyptian section with the mummies and artefacts.

In the evening, we had dinner in Chinatown and then walked to Piccadilly Circus to see the famous lights.

Sunday was quieter. We explored Hyde Park and rented bicycles. The park was beautiful in autumn, with golden and red leaves everywhere.

We took the train home at six. I was tired but very happy. I definitely want to go back soon.`,
    wordCount: 155,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'it was my first time', tr: 'ilk kez gidiyordum' },
      { phrase: 'took a boat trip', tr: 'tekne gezisi yaptık' },
      { phrase: 'especially', tr: 'özellikle' },
    ],
    comprehensionQs: [
      { question: 'How did they travel to London?', options: ['By bus', 'By plane', 'By car', 'By train'], answerIndex: 3 },
      { question: 'What opened for a large ship?', options: ['The Tower of London', 'Tower Bridge', 'Hyde Park gate', 'The British Museum'], answerIndex: 1 },
      { question: 'What did they do in Hyde Park?', options: ['Had a picnic', 'Went swimming', 'Rented bicycles', 'Watched a concert'], answerIndex: 2 },
    ],
  },
  {
    title: 'Weather in England',
    level: 'A2',
    category: 'article',
    text: `People often say that the weather in England is terrible — always rainy and cold. But this is not completely true. English weather is simply very changeable.

In England, you can experience four seasons in one day. In the morning it might be sunny and warm. By afternoon, dark clouds can appear and bring heavy rain. Then in the evening, the sky clears and becomes beautiful again.

The wettest months are November and December. January and February are usually the coldest. Snow is possible in winter but not guaranteed every year. July and August are the warmest months, but even in summer, temperatures rarely go above 25 degrees Celsius.

One thing is certain: the English talk about the weather all the time. It is the most popular topic of conversation. "Lovely day, isn't it?" or "Can you believe this rain?" are common phrases you'll hear everywhere.

The unpredictability of English weather means people always carry an umbrella, just in case.`,
    wordCount: 155,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'changeable', tr: 'değişken' },
      { phrase: 'not guaranteed', tr: 'garanti değil' },
      { phrase: 'just in case', tr: 'her ihtimale karşı' },
    ],
    comprehensionQs: [
      { question: 'Which months are the wettest in England?', options: ['July and August', 'March and April', 'November and December', 'May and June'], answerIndex: 2 },
      { question: 'What do English people talk about most?', options: ['Football', 'Politics', 'Food', 'The weather'], answerIndex: 3 },
      { question: 'Why do people always carry an umbrella?', options: ['It is fashionable', 'Because of the unpredictable weather', 'Because it always rains', 'It is required by law'], answerIndex: 1 },
    ],
  },
  {
    title: 'Learning to Cook',
    level: 'A2',
    category: 'story',
    text: `Before I went to university, I didn't know how to cook at all. My mother cooked every meal, and I never paid attention. Then I moved into a student flat with three flatmates, and everything changed.

In the first week, I survived on sandwiches and instant noodles. My flatmates were much better cooks. One evening, my flatmate Priya offered to teach me how to make a simple curry. I agreed happily.

Priya showed me how to chop onions without crying, how to fry spices to release their flavour, and how to balance salt and chilli. It took about an hour, but the result was delicious.

After that lesson, I started watching cooking videos online. I practised every weekend. I learnt how to make pasta, omelettes, soups, and stir-fries.

By the end of the year, I could cook eight or nine different meals. My flatmates said my cooking had improved a lot. Cooking is now something I really enjoy. It helps me relax and it saves money too.`,
    wordCount: 175,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'paid attention', tr: 'dikkat etmek' },
      { phrase: 'release their flavour', tr: 'aromalarını salmak' },
      { phrase: 'improved a lot', tr: 'çok gelişti' },
    ],
    comprehensionQs: [
      { question: 'Why did the writer start learning to cook?', options: ['For a school project', 'Because they moved to a student flat', 'Because their mother told them to', 'They won a cooking competition'], answerIndex: 1 },
      { question: 'Who taught the writer to cook a curry?', options: ['Their mother', 'A chef', 'Priya', 'An online teacher'], answerIndex: 2 },
      { question: 'How did the writer continue learning after the lesson?', options: ['Took a cooking class', 'Watched cooking videos online', 'Read cookbooks', 'Ate at restaurants'], answerIndex: 1 },
    ],
  },
  {
    title: 'My New Job',
    level: 'A2',
    category: 'story',
    text: `Three months ago, I started a new job at a café in the city centre. It was my first job and I was very nervous on the first day.

My manager, Rachel, is kind and patient. She showed me how to use the coffee machine and how to take orders. The café is quite busy in the mornings, especially between eight and ten o'clock, when office workers stop for coffee on their way to work.

At first, I made some mistakes. Once I gave a customer the wrong order. Another time I dropped a cup and it broke. Rachel told me not to worry — everyone makes mistakes when they start.

After the first month, I felt more confident. Now I know all the regular customers by name. There is Mr Peters, who always orders a large flat white, and Mrs Chang, who prefers green tea.

The work is tiring, especially at weekends. But I enjoy talking to people and I love the smell of fresh coffee. I also get a free lunch every shift, which is great for saving money as a student.`,
    wordCount: 185,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'nervous on the first day', tr: 'ilk gün çok heyecanlıydım' },
      { phrase: 'on their way to work', tr: 'işe giderken' },
      { phrase: 'regular customers', tr: 'düzenli / daimi müşteriler' },
    ],
    comprehensionQs: [
      { question: 'When is the café the busiest?', options: ['Between twelve and two', 'In the evenings', 'Between eight and ten in the morning', 'At the weekend'], answerIndex: 2 },
      { question: 'What mistake did the writer make once?', options: ['Broke the coffee machine', 'Forgot to charge a customer', 'Gave the wrong order', 'Was late for work'], answerIndex: 2 },
      { question: 'What does the writer receive for free on every shift?', options: ['Coffee', 'Lunch', 'A transport pass', 'Uniform'], answerIndex: 1 },
    ],
  },
  {
    title: 'Shopping for Clothes',
    level: 'A2',
    category: 'dialogue',
    text: `Assistant: Hello! Can I help you with anything today?
Customer: Yes, please. I'm looking for a jacket for work. Something smart but not too formal.
Assistant: Of course. What size are you?
Customer: I'm usually a medium, but it depends on the brand.
Assistant: We have some new arrivals over here. This navy blue blazer is very popular at the moment. Would you like to try it on?
Customer: Yes, I'll try the medium. Actually, do you have it in a darker colour? Maybe black or dark grey?
Assistant: We have it in black. Let me check if we have a medium in stock. Yes, here you are.
Customer: Great, thank you. Where are the fitting rooms?
Assistant: They're at the back, on the right. Take your time.
[Five minutes later]
Customer: It fits perfectly! How much is it?
Assistant: It's sixty-five pounds. We also have a ten percent discount today on all jackets.
Customer: Oh, that's good. So it would be fifty-eight fifty?
Assistant: Exactly. Would you like to pay by card or cash?
Customer: Card, please.`,
    wordCount: 165,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'new arrivals', tr: 'yeni gelenler' },
      { phrase: 'try it on', tr: 'denemek (kıyafet)' },
      { phrase: 'fitting rooms', tr: 'soyunma odaları' },
    ],
    comprehensionQs: [
      { question: 'What is the customer looking for?', options: ['A casual T-shirt', 'Smart trousers', 'A jacket for work', 'Formal shoes'], answerIndex: 2 },
      { question: 'What colour jacket does the customer ask for?', options: ['Navy blue', 'White', 'Brown', 'Black or dark grey'], answerIndex: 3 },
      { question: 'What discount is available today?', options: ['Five percent', 'Fifteen percent', 'Ten percent', 'Twenty percent'], answerIndex: 2 },
    ],
  },
  {
    title: 'A Train Journey',
    level: 'A2',
    category: 'story',
    text: `Last summer, I travelled by train from London to Edinburgh. It was a long journey — about four and a half hours — but I enjoyed every minute of it.

I bought my ticket online the week before and managed to get a good seat by the window. The train left King's Cross station at nine o'clock in the morning.

As we left London, the urban landscape gradually gave way to green countryside. We passed through small towns and villages, then wide open fields with sheep and cows.

In the middle of the journey, a trolley came through the carriage selling sandwiches, hot drinks and snacks. I bought a cup of tea and a cheese sandwich. I ate while looking at the beautiful scenery outside.

Around Newcastle, we crossed a famous bridge over the River Tyne. The view from the train was impressive — tall buildings on the hillside reflected in the river below.

We arrived at Edinburgh Waverley station just before two o'clock. The journey gave me a real sense of how beautiful the British countryside is. I would definitely do it again.`,
    wordCount: 180,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'gave way to', tr: 'yerini bıraktı / dönüştü' },
      { phrase: 'open fields', tr: 'açık araziler' },
      { phrase: 'a real sense of', tr: 'gerçek bir his / farkındalık' },
    ],
    comprehensionQs: [
      { question: 'How long was the train journey?', options: ['Three hours', 'Five hours', 'About four and a half hours', 'Two hours'], answerIndex: 2 },
      { question: 'What did the writer buy from the trolley?', options: ['Coffee and a cake', 'Tea and a cheese sandwich', 'Orange juice and crisps', 'Hot chocolate and a muffin'], answerIndex: 1 },
      { question: 'What station did the writer arrive at in Edinburgh?', options: ['Edinburgh Central', 'Waverley', 'Edinburgh Haymarket', 'King\'s Cross'], answerIndex: 1 },
    ],
  },
  {
    title: 'Sports I Love',
    level: 'A2',
    category: 'article',
    text: `I have always loved sport. When I was young, I played football every day after school with the boys in my street. We played until it was dark and our parents called us home for dinner.

Now I am an adult, I still do sport regularly. My favourite sport is running. I run three times a week, usually early in the morning before work. Running helps me feel energetic and positive. I have done two 5K races and I hope to run a half marathon next year.

I also enjoy swimming. I go to the pool on Wednesday evenings. Swimming is great because it works the whole body and is gentle on the joints. My local pool has a ladies-only session which I prefer.

At weekends, I sometimes go cycling with my husband. We explore country lanes and forests near our town. It is a good way to spend time together and enjoy nature.

I believe exercise is very important for both physical and mental health. Even a short walk can improve your mood. I encourage everyone to find a sport they enjoy — it does not have to be competitive or expensive.`,
    wordCount: 190,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'gentle on the joints', tr: 'eklemlere nazik' },
      { phrase: 'explore country lanes', tr: 'kırsal yolları keşfetmek' },
      { phrase: 'improve your mood', tr: 'ruh halini düzeltmek' },
    ],
    comprehensionQs: [
      { question: 'How many times a week does the writer run?', options: ['Once', 'Five times', 'Three times', 'Every day'], answerIndex: 2 },
      { question: 'Why does the writer like swimming?', options: ['It is cheap', 'It works the whole body and is gentle on joints', 'It is competitive', 'It is fast'], answerIndex: 1 },
      { question: 'What does the writer do at weekends?', options: ['Goes running', 'Plays football', 'Goes cycling with their husband', 'Goes to the gym'], answerIndex: 2 },
    ],
  },
  {
    title: 'A Busy Restaurant',
    level: 'A2',
    category: 'story',
    text: `My cousin Maria works as a waitress in a busy Italian restaurant in the city centre. She has been working there for two years and says the job is both exciting and exhausting.

The restaurant opens for lunch at twelve and stays open until eleven at night. Maria usually works the evening shift, from five until close. On busy nights, especially Fridays and Saturdays, the restaurant is completely full with a queue of people waiting outside.

During service, Maria takes orders, brings food and drinks to the tables, and makes sure every customer is happy. She also helps clear and reset the tables between customers. The work is physically demanding — she walks about twelve kilometres each shift!

One of the best parts of the job is the customers. Maria says she meets interesting people from all over the world. Some are tourists, some are local regulars who visit every week.

The tips can also be generous. On a good Saturday night, Maria can earn thirty or forty extra pounds in tips. This helps her save money for university next year.

Despite the long hours and sore feet, Maria loves the lively atmosphere and the team she works with.`,
    wordCount: 195,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'evening shift', tr: 'akşam vardiyası' },
      { phrase: 'physically demanding', tr: 'fiziksel olarak yorucu' },
      { phrase: 'lively atmosphere', tr: 'canlı atmosfer' },
    ],
    comprehensionQs: [
      { question: 'How long has Maria worked at the restaurant?', options: ['Six months', 'One year', 'Two years', 'Three years'], answerIndex: 2 },
      { question: 'How far does Maria walk in one shift?', options: ['Five kilometres', 'Eight kilometres', 'Ten kilometres', 'About twelve kilometres'], answerIndex: 3 },
      { question: 'What does Maria plan to do with her tip money?', options: ['Buy a car', 'Save for a holiday', 'Save for university', 'Buy clothes'], answerIndex: 2 },
    ],
  },
  {
    title: 'Public Transport',
    level: 'A2',
    category: 'article',
    text: `Public transport is an important part of life in cities around the world. Buses, trains, underground systems, and trams allow millions of people to travel quickly and cheaply every day.

In London, the Underground — known as the Tube — is one of the oldest metro systems in the world. It opened in 1863 and now has eleven lines and 272 stations. Every day, about four million journeys are made on the Tube.

Using public transport has many advantages. It is cheaper than using a car, especially in cities where parking is expensive. It is also better for the environment because one bus can carry as many passengers as fifty cars.

However, public transport also has disadvantages. During rush hour, trains and buses can be very crowded and uncomfortable. Delays and cancellations can cause problems, especially if you are travelling to an important meeting.

Many cities are now trying to improve their public transport to encourage people to leave their cars at home. They are making buses and trains more frequent, more comfortable, and more affordable. Some cities have even made public transport free for certain groups, such as elderly people and students.

The future of urban mobility will depend on how well cities invest in clean, efficient public transport.`,
    wordCount: 210,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'rush hour', tr: 'yoğun saat / trafik saati' },
      { phrase: 'delay', tr: 'gecikme' },
      { phrase: 'urban mobility', tr: 'kentsel ulaşım' },
    ],
    comprehensionQs: [
      { question: 'When did the London Underground open?', options: ['1900', '1880', '1863', '1920'], answerIndex: 2 },
      { question: 'How many journeys are made on the Tube every day?', options: ['One million', 'Two million', 'Three million', 'About four million'], answerIndex: 3 },
      { question: 'What is one advantage of public transport mentioned?', options: ['It is always on time', 'It is cheaper than using a car', 'It is more comfortable than cars', 'It goes to more places'], answerIndex: 1 },
    ],
  },
  {
    title: 'Going to the Gym',
    level: 'A2',
    category: 'story',
    text: `Six months ago, I decided to join a gym. I had never been to a gym before and I was a little nervous at first.

When I arrived on my first day, a fitness instructor called Jake showed me around and explained how to use the equipment safely. He told me to start with light weights and increase them gradually. He also said that warming up before exercise and cooling down afterwards are very important to prevent injuries.

In the first month, I went to the gym twice a week. It was hard — my muscles hurt after every session. But I kept going, and slowly I started to feel stronger.

Now I go four times a week. I have a regular routine: on Mondays and Thursdays I do weights, and on Tuesdays and Saturdays I attend a group exercise class called "Body Pump." The classes are energetic and fun, and I have made some new friends.

My diet has also changed. I eat more protein — eggs, chicken, and nuts — and fewer sugary snacks. I drink more water too.

I have lost four kilograms and I feel much more confident about my body. Going to the gym is one of the best decisions I have ever made.`,
    wordCount: 200,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'warming up', tr: 'ısınma' },
      { phrase: 'prevent injuries', tr: 'sakatlıkları önlemek' },
      { phrase: 'group exercise class', tr: 'grup egzersiz dersi' },
    ],
    comprehensionQs: [
      { question: 'Who showed the writer around the gym?', options: ['A friend', 'A fitness instructor called Jake', 'The manager', 'Another member'], answerIndex: 1 },
      { question: 'How often did the writer go to the gym in the first month?', options: ['Every day', 'Once a week', 'Four times a week', 'Twice a week'], answerIndex: 3 },
      { question: 'What is "Body Pump"?', options: ['A weight machine', 'A type of protein drink', 'A group exercise class', 'A warm-up routine'], answerIndex: 2 },
    ],
  },
  {
    title: 'My Favourite Film',
    level: 'A2',
    category: 'article',
    text: `My favourite film is "The Lion King". It is an animated film made by Disney and was first released in 1994. I watched it for the first time when I was five years old and I have seen it many times since then.

The story is about a young lion called Simba. His father, King Mufasa, rules over the Pride Lands in Africa. Everything is peaceful until Simba's uncle, Scar, kills Mufasa and takes the throne. Simba runs away in fear and guilt. He grows up in exile with two funny characters, Timon the meerkat and Pumbaa the warthog.

Eventually, Simba returns to challenge Scar and take back his kingdom. The story is about responsibility, family, and courage.

The film has wonderful music by Elton John and Hans Zimmer. Songs like "Circle of Life" and "Can You Feel the Love Tonight" are unforgettable. The animation of the African landscape is absolutely beautiful.

There is also a live-action remake from 2019 with amazing visual effects, but in my opinion the original is better.

"The Lion King" makes me feel emotional every time I watch it. I believe it is a film for all ages — children love the funny characters, and adults appreciate the deeper themes.`,
    wordCount: 215,
    readingTimeMin: 2,
    keyPhrases: [
      { phrase: 'exile', tr: 'sürgün' },
      { phrase: 'responsibility', tr: 'sorumluluk' },
      { phrase: 'live-action remake', tr: 'gerçekçi yeniden yapım' },
    ],
    comprehensionQs: [
      { question: 'When was The Lion King first released?', options: ['1990', '1998', '1994', '2000'], answerIndex: 2 },
      { question: 'Who kills King Mufasa?', options: ['Simba', 'A hunter', 'Scar', 'Timon'], answerIndex: 2 },
      { question: 'Who wrote the music for the film?', options: ['Hans Zimmer and Alan Menken', 'Elton John and Hans Zimmer', 'Phil Collins and John Williams', 'Adele and Ennio Morricone'], answerIndex: 1 },
    ],
  },
  // ── B1 (12) ───────────────────────────────────────────────────────────────
  {
    title: 'Culture Shock',
    level: 'B1',
    category: 'article',
    text: `When people move to a new country, they often experience what psychologists call "culture shock." This is the feeling of confusion, anxiety, or even sadness that comes from being surrounded by an unfamiliar culture, language, and set of social rules.

Culture shock typically happens in stages. In the first stage, often called the "honeymoon phase," everything feels exciting and new. The food, the architecture, the people — all of it seems fascinating.

The second stage is when real difficulties begin. Simple tasks become stressful: understanding the local accent, knowing how to behave in shops or public spaces, making friends. People often feel isolated and long for home.

The third stage is adjustment. Gradually, the person begins to understand how things work and starts to feel more comfortable. They develop routines, make friends, and learn to appreciate the differences.

The fourth stage is adaptation — or full integration. The person can now function effectively in both cultures and may even prefer certain aspects of their new home.

Culture shock is not a sign of weakness. It is a natural human response to change. Many people who have lived abroad say the experience, though sometimes painful, made them more empathetic, flexible, and open-minded. It teaches you not just about the new culture, but about your own.`,
    wordCount: 220,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'honeymoon phase', tr: 'balayı dönemi / her şeyin güzel göründüğü süreç' },
      { phrase: 'long for home', tr: 'evi / yurdu özlemek' },
      { phrase: 'open-minded', tr: 'açık fikirli' },
    ],
    comprehensionQs: [
      { question: 'What is the "honeymoon phase" of culture shock?', options: ['When someone wants to go home', 'When everything feels exciting and new', 'When someone learns the local language', 'When someone makes new friends'], answerIndex: 1 },
      { question: 'According to the text, what causes stress in the second stage?', options: ['Bad food and weather', 'Simple tasks like understanding the accent and social rules', 'Political disagreements', 'Missing family in the home country'], answerIndex: 1 },
      { question: 'What does culture shock teach people, according to the text?', options: ['New cooking techniques', 'How to speak multiple languages', 'About other cultures and their own culture', 'How to travel cheaply'], answerIndex: 2 },
    ],
  },
  {
    title: 'Working from Home',
    level: 'B1',
    category: 'article',
    text: `The COVID-19 pandemic forced millions of workers around the world to work from home for the first time. For many people, it was a difficult transition, but for others it was a revelation. Now, several years later, remote work has become a permanent feature of many industries.

The advantages of working from home are significant. Employees save time and money on commuting. They can work in comfortable surroundings, take breaks when they need to, and often have more flexibility to manage their personal lives. Research has also shown that many workers are more productive at home, with fewer interruptions from colleagues.

However, remote work also has real downsides. The boundary between professional and personal life can blur. Some people feel isolated without regular face-to-face interaction with colleagues. Junior employees, in particular, may miss valuable learning opportunities that happen naturally in an office environment.

Companies have responded in different ways. Some have returned to full-time office work. Others have adopted "hybrid" models, where employees divide their time between home and office. This seems to offer the best of both worlds — flexibility with social connection.

Ultimately, the ideal arrangement depends on the individual and the nature of the work. What matters most is that employees have a clear structure, good communication, and the right tools to do their jobs effectively, wherever they are.`,
    wordCount: 230,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'commuting', tr: 'işe gidip gelme' },
      { phrase: 'boundary blurs', tr: 'sınır belirsizleşir' },
      { phrase: 'hybrid model', tr: 'hibrit / karma çalışma modeli' },
    ],
    comprehensionQs: [
      { question: 'What caused millions of people to work from home?', options: ['Personal choice', 'Government policy', 'The COVID-19 pandemic', 'Company downsizing'], answerIndex: 2 },
      { question: 'Which employees may miss learning opportunities when working remotely?', options: ['Senior managers', 'Part-time workers', 'Junior employees', 'IT specialists'], answerIndex: 2 },
      { question: 'What does a "hybrid" work model involve?', options: ['Working only at home', 'Working only in the office', 'Dividing time between home and office', 'Working in different countries'], answerIndex: 2 },
    ],
  },
  {
    title: 'The Mediterranean Diet',
    level: 'B1',
    category: 'article',
    text: `The Mediterranean diet is widely regarded as one of the healthiest ways of eating in the world. Named after the countries bordering the Mediterranean Sea — including Greece, Italy, Spain, and Turkey — it is based on traditional food patterns that have been practised for centuries.

At the heart of this diet are fresh vegetables and fruits, whole grains, legumes such as lentils and chickpeas, and nuts. Olive oil is used generously instead of butter or vegetable oils. Fish and seafood are eaten regularly, while red meat is consumed only occasionally.

Scientists have conducted extensive research on the Mediterranean diet and the findings are impressive. Studies show that it can reduce the risk of heart disease, type 2 diabetes, and certain types of cancer. It is also associated with better mental health and a lower risk of cognitive decline as people age.

What makes the Mediterranean diet particularly special is not just the food itself, but the whole lifestyle associated with it. People in Mediterranean cultures tend to eat together, take time over meals, and enjoy regular physical activity outdoors.

In contrast to many modern diets that focus on cutting out specific food groups, the Mediterranean diet is about balance and variety. No food is strictly forbidden — the emphasis is on proportion, quality, and enjoyment.

Nutritionists recommend it as a sustainable, long-term approach to health, rather than a short-term fix.`,
    wordCount: 235,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'legumes', tr: 'baklagiller' },
      { phrase: 'cognitive decline', tr: 'bilişsel gerileme' },
      { phrase: 'sustainable', tr: 'sürdürülebilir' },
    ],
    comprehensionQs: [
      { question: 'What is used instead of butter in the Mediterranean diet?', options: ['Sunflower oil', 'Coconut oil', 'Olive oil', 'Margarine'], answerIndex: 2 },
      { question: 'How often is red meat eaten in the Mediterranean diet?', options: ['Never', 'Daily', 'Only occasionally', 'Three times a week'], answerIndex: 2 },
      { question: 'What makes the Mediterranean diet special beyond the food?', options: ['Its low cost', 'Its quick preparation', 'The lifestyle and culture around eating', 'Its exotic ingredients'], answerIndex: 2 },
    ],
  },
  {
    title: 'Studying Abroad',
    level: 'B1',
    category: 'story',
    text: `Last year, I spent a semester studying at a university in Barcelona. It was one of the most challenging and rewarding experiences of my life.

Before I left, I was anxious about many things: living away from home, managing my finances, making friends in a foreign country. My Spanish was basic at best. However, my university had a support network for international students, which helped a lot in the first few weeks.

I lived in a shared apartment with two other international students — Pedro from Mexico and Aiyana from Canada. We quickly became good friends, cooking together, exploring the city, and helping each other with language problems.

The academic experience was also different from what I was used to. Professors expected more independent thinking and less memorisation. There was more emphasis on debate and critical analysis. At first I found this difficult, but gradually I adapted and found it stimulating.

My Spanish improved dramatically. By the end of the semester, I could hold conversations, understand most TV programmes, and even dream in Spanish sometimes.

What I valued most, though, was the perspective shift. Seeing my own country from the outside — through the eyes of people who asked curious, sometimes challenging, questions about it — made me understand it differently. I came back more confident, more adaptable, and with a broader view of the world.`,
    wordCount: 230,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'rewarding experience', tr: 'tatmin edici deneyim' },
      { phrase: 'critical analysis', tr: 'eleştirel analiz' },
      { phrase: 'perspective shift', tr: 'bakış açısı değişimi' },
    ],
    comprehensionQs: [
      { question: 'Where did the writer study abroad?', options: ['Madrid', 'Lisbon', 'Barcelona', 'Rome'], answerIndex: 2 },
      { question: 'What did professors emphasise more at the Spanish university?', options: ['Memorisation and exams', 'Attendance and punctuality', 'Debate and critical analysis', 'Group projects only'], answerIndex: 2 },
      { question: 'What did the writer value most about the experience?', options: ['Learning Spanish quickly', 'Making international friends', 'The change in perspective', 'The food and culture'], answerIndex: 2 },
    ],
  },
  {
    title: 'Social Media and Young People',
    level: 'B1',
    category: 'article',
    text: `Social media has become an almost unavoidable part of modern life, particularly for teenagers and young adults. Platforms such as Instagram, TikTok, Snapchat, and YouTube attract billions of users worldwide, many of whom spend several hours each day scrolling, watching, and posting content.

The benefits are real. Social media allows people to stay connected with friends and family across distances. It provides a platform for self-expression and creativity. Many young people have used it to build communities around shared interests, start businesses, or raise awareness about important issues.

However, research increasingly points to potential harms, especially for adolescents. Studies have linked heavy social media use to increased rates of anxiety, depression, and loneliness — particularly among teenage girls. Constant exposure to carefully curated images of other people's lives can lead to unhealthy comparisons and a distorted self-image.

Cyberbullying is another serious concern. Unlike bullying in physical spaces, online harassment can follow a person everywhere and at all hours.

Some countries are now considering or implementing age restrictions on social media. Australia, for example, passed a law in 2024 requiring users to be at least sixteen to access social media platforms.

There is no easy answer. Social media itself is neutral — it is a tool. Whether it helps or harms depends largely on how it is used, how much time is spent on it, and what content people choose to engage with. Digital literacy and healthy habits are perhaps the most important defences.`,
    wordCount: 250,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'curated images', tr: 'seçilerek hazırlanmış görseller' },
      { phrase: 'cyberbullying', tr: 'siber zorbalık' },
      { phrase: 'digital literacy', tr: 'dijital okuryazarlık' },
    ],
    comprehensionQs: [
      { question: 'What does research link heavy social media use to?', options: ['Better academic results', 'Increased anxiety and depression', 'More physical activity', 'Greater creativity'], answerIndex: 1 },
      { question: 'What did Australia do in 2024?', options: ['Banned social media entirely', 'Required users to be at least 16 to access social media', 'Made social media free for students', 'Introduced digital literacy classes'], answerIndex: 1 },
      { question: 'What does the writer suggest is the best defence against social media harms?', options: ['Total abstinence from social media', 'Strict government control', 'Digital literacy and healthy habits', 'Only using social media for business'], answerIndex: 2 },
    ],
  },
  {
    title: 'Learning a New Language',
    level: 'B1',
    category: 'article',
    text: `Learning a new language as an adult is challenging, but the rewards are enormous. Beyond the practical benefits — travelling more easily, opening up career opportunities, connecting with more people — there are cognitive advantages too.

Research shows that bilingual and multilingual individuals tend to have better memory, stronger problem-solving skills, and are more resistant to cognitive decline in old age. This is partly because switching between languages exercises the brain in a unique way.

There are many methods for learning a language. Traditional classroom instruction works well for building grammar foundations and formal vocabulary. Apps like Duolingo offer gamified practice that keeps learners motivated. Immersion — surrounding yourself with the language through films, music, podcasts, and conversations — is widely considered the most effective approach for developing real fluency.

One common obstacle is the fear of making mistakes. Many adult learners feel embarrassed to speak imperfectly. But language experts are almost unanimous: making mistakes is not only acceptable, it is necessary. The brain learns most effectively through trial and error.

Consistency matters more than intensity. Thirty minutes every day is more effective than a four-hour session once a week. Setting small, achievable goals — such as learning ten new words a day or having a short conversation — helps maintain motivation over the long term.

The key is to enjoy the process. Language learning is a journey, not a destination. Even at an intermediate level, you can have rich, meaningful interactions that would have been impossible before.`,
    wordCount: 250,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'cognitive decline', tr: 'bilişsel gerileme' },
      { phrase: 'immersion', tr: 'dil ortamına tamamen dalmak' },
      { phrase: 'trial and error', tr: 'deneme yanılma' },
    ],
    comprehensionQs: [
      { question: 'What cognitive benefit do bilingual people have according to research?', options: ['They learn faster in general', 'Better memory and stronger problem-solving skills', 'They sleep better', 'They are more creative artists'], answerIndex: 1 },
      { question: 'What approach do language experts consider most effective?', options: ['Traditional classroom instruction', 'Grammar books', 'Immersion in the language', 'Translation exercises'], answerIndex: 2 },
      { question: 'What does the writer say about making mistakes?', options: ['It should be avoided', 'It is embarrassing but unavoidable', 'It is necessary for the brain to learn', 'It slows down learning'], answerIndex: 2 },
    ],
  },
  {
    title: 'The Green City',
    level: 'B1',
    category: 'article',
    text: `As the world's population becomes increasingly urban, cities are facing a major challenge: how to grow while remaining liveable and sustainable. One of the most promising responses is the concept of the "green city."

A green city is one that prioritises environmental sustainability, clean air, and quality of life for its residents. This can take many forms. Trees and parks are planted throughout the city, not just for beauty, but to reduce air pollution, lower temperatures during heatwaves, and provide habitats for wildlife.

Some cities are going further. Singapore is famous for its "City in a Garden" vision, with plants growing on the sides and roofs of buildings. Copenhagen has committed to becoming the world's first carbon-neutral capital, investing heavily in cycling infrastructure, wind energy, and green architecture.

In green cities, public transport is clean and efficient, discouraging car use. Waste management systems prioritise recycling and composting. Buildings are designed with energy efficiency in mind — well-insulated, with solar panels and green roofs.

Critics argue that "green urbanism" is often expensive and only benefits wealthy areas of a city, leaving poorer neighbourhoods without access to parks or good public transport. This is known as "green gentrification" and it is a real and serious concern.

The ideal green city combines environmental ambition with social equity — creating spaces that are clean, healthy, and accessible to all residents, regardless of income. A few pioneering cities are showing this is possible. The challenge is to make it the rule, not the exception.`,
    wordCount: 250,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'carbon-neutral', tr: 'karbon nötr' },
      { phrase: 'green gentrification', tr: 'yeşil soylulaştırma' },
      { phrase: 'social equity', tr: 'sosyal eşitlik' },
    ],
    comprehensionQs: [
      { question: 'Which city is famous for its "City in a Garden" vision?', options: ['Copenhagen', 'Amsterdam', 'Singapore', 'Tokyo'], answerIndex: 2 },
      { question: 'What is "green gentrification"?', options: ['Planting trees in wealthy areas only', 'Green initiatives that only benefit richer parts of a city', 'Moving factories out of cities', 'Building parks on contaminated land'], answerIndex: 1 },
      { question: 'What does an ideal green city combine?', options: ['Technology and profit', 'Environmental ambition with social equity', 'Skyscrapers and nature', 'Old buildings and new parks'], answerIndex: 1 },
    ],
  },
  {
    title: 'Job Interview Tips',
    level: 'B1',
    category: 'article',
    text: `A job interview is one of the most important conversations you can have. No matter how strong your CV, a poor interview performance can cost you the role — and a great interview can secure a job you seemed underqualified for on paper.

Preparation is everything. Research the company thoroughly: its history, products or services, recent news, and company culture. Understand the role you're applying for and think carefully about how your experience relates to it.

Practise answering common interview questions. Classics include: "Tell me about yourself," "What are your strengths and weaknesses?" and "Where do you see yourself in five years?" Prepare specific examples using the STAR method: Situation, Task, Action, Result. Vague answers are less convincing than concrete stories.

On the day of the interview, dress appropriately and arrive early. First impressions matter — interviewers form opinions within the first few minutes. Make eye contact, sit up straight, and speak clearly. Avoid filler words like "um" and "basically."

Listen carefully to each question before answering. It is perfectly acceptable to take a moment to think. A thoughtful, structured answer is more impressive than a rushed one.

Prepare two or three questions to ask the interviewer. This shows genuine interest and helps you assess whether the company is the right fit for you. Avoid asking about salary or holidays in the first interview.

Finally, follow up with a brief thank-you email within 24 hours. It is a small gesture, but one that many candidates forget and that can leave a positive impression.`,
    wordCount: 260,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'STAR method', tr: 'Durum-Görev-Eylem-Sonuç yöntemi' },
      { phrase: 'first impressions', tr: 'ilk izlenimler' },
      { phrase: 'follow up', tr: 'takip etmek' },
    ],
    comprehensionQs: [
      { question: 'What does STAR stand for in the context of interviews?', options: ['Speech, Tone, Articulation, Response', 'Situation, Task, Action, Result', 'Skills, Training, Ambition, Reliability', 'Summary, Target, Achievement, Reflection'], answerIndex: 1 },
      { question: 'What should you avoid asking about in a first interview?', options: ['The company history', 'The team you will work with', 'Salary or holidays', 'Daily responsibilities'], answerIndex: 2 },
      { question: 'What should you do within 24 hours after the interview?', options: ['Call the interviewer', 'Post about it on LinkedIn', 'Send a thank-you email', 'Call a recruiter'], answerIndex: 2 },
    ],
  },
  {
    title: 'Street Food Around the World',
    level: 'B1',
    category: 'article',
    text: `Street food is one of the most authentic ways to experience a culture. Unlike restaurants, which often adapt their food to international tastes, street vendors typically serve traditional recipes passed down through generations, using locally-sourced ingredients.

In Thailand, the streets of Bangkok are famous for pad thai, som tam (papaya salad), and mango sticky rice. Food stalls operate from early morning until late at night, and eating on the street is perfectly normal — even celebrated.

In Mexico, tacos al pastor — marinated pork carved from a vertical spit and served in small corn tortillas with onion, coriander, and salsa — are eaten at any hour. The combination of flavours is extraordinary.

Istanbul's street food culture includes simit — a sesame-encrusted bread ring — sold by vendors pushing carts through the city, as well as roasted corn, chestnuts in winter, and the famous balık ekmek (fish sandwich) sold by boats on the Bosphorus.

India arguably has the most diverse street food culture in the world. From chaat in Delhi — a chaotic mix of crispy snacks, yoghurt, and tangy chutneys — to vada pav in Mumbai, often called India's burger, street food varies dramatically from region to region.

What all these examples share is immediacy and honesty. Street food is prepared fresh, eaten quickly, and rarely pretentious. It connects you directly to the everyday life of a place. Some of the world's greatest food experiences don't happen in restaurants — they happen on a plastic stool next to a busy road.`,
    wordCount: 260,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'passed down through generations', tr: 'nesiller boyu aktarılmış' },
      { phrase: 'locally-sourced', tr: 'yerel kaynaklı' },
      { phrase: 'pretentious', tr: 'gösterişli / yapmacık' },
    ],
    comprehensionQs: [
      { question: 'What is balık ekmek?', options: ['A Turkish dessert', 'A fish sandwich sold on the Bosphorus', 'A type of sesame bread', 'A grilled meat dish'], answerIndex: 1 },
      { question: 'What is vada pav sometimes called?', options: ['India\'s pizza', 'India\'s salad', 'India\'s burger', 'India\'s noodle dish'], answerIndex: 2 },
      { question: 'According to the writer, what do all street foods share?', options: ['Spicy flavours', 'Cheap prices', 'Immediacy and honesty', 'International influences'], answerIndex: 2 },
    ],
  },
  {
    title: 'Healthy Habits for a Better Life',
    level: 'B1',
    category: 'article',
    text: `We are what we repeatedly do. The small decisions we make every day — what we eat, how much we sleep, whether we exercise — accumulate over time and shape our health, mood, and productivity.

Sleep is perhaps the most underestimated health habit. Adults need between seven and nine hours per night. Consistent sleep deprivation has been linked to weight gain, impaired immune function, mood disorders, and even early death. Going to bed and waking up at the same time every day — even at weekends — helps regulate the body's internal clock.

Regular physical activity is equally important. You don't need to run marathons. Thirty minutes of moderate exercise — a brisk walk, a cycle, a swim — five times a week delivers substantial health benefits, including reduced risk of heart disease, diabetes, and depression.

Diet matters too. Eating a wide variety of vegetables, fruits, and whole grains, limiting processed foods and added sugar, and staying well-hydrated are evidence-based principles that most nutritionists agree on.

Mental health is often overlooked. Stress management techniques such as meditation, deep breathing, and journalling have measurable benefits on anxiety and emotional wellbeing. Strong social connections — maintaining friendships and family relationships — are also associated with longer, healthier lives.

The key is not perfection but consistency. You don't need to overhaul your entire life overnight. Pick one habit to work on. Once it is established, add another. Small, sustainable changes compound over time into significant improvements to your overall wellbeing.`,
    wordCount: 255,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'sleep deprivation', tr: 'uyku yoksunluğu' },
      { phrase: 'impaired immune function', tr: 'bağışıklık sisteminin zayıflaması' },
      { phrase: 'compound over time', tr: 'zamanla birikmek / katlanmak' },
    ],
    comprehensionQs: [
      { question: 'How many hours of sleep do adults need according to the text?', options: ['Five to six hours', 'Seven to nine hours', 'Ten to twelve hours', 'Exactly eight hours'], answerIndex: 1 },
      { question: 'How much exercise per week delivers substantial health benefits?', options: ['One hour once a week', 'Two hours twice a week', 'Thirty minutes five times a week', 'An hour every day'], answerIndex: 2 },
      { question: 'What advice does the writer give about changing habits?', options: ['Overhaul your entire life at once', 'Pick one habit at a time and be consistent', 'Focus only on diet', 'Follow an expert programme'], answerIndex: 1 },
    ],
  },
  // ── B2 (10) ───────────────────────────────────────────────────────────────
  {
    title: 'The Future of Work',
    level: 'B2',
    category: 'article',
    text: `The nature of work is undergoing its most dramatic transformation since the Industrial Revolution. Automation, artificial intelligence, and the globalisation of labour markets are reshaping which jobs exist, who does them, and where.

Robots have already displaced many routine manufacturing and processing jobs. But increasingly, AI systems are moving into knowledge work — writing, analysis, medical diagnosis, legal research — that was previously assumed to require uniquely human cognitive abilities. A 2023 study by Goldman Sachs estimated that AI could automate the equivalent of 300 million full-time jobs globally within ten years.

This does not necessarily mean mass unemployment. Historically, technological revolutions have created as many jobs as they destroyed, though often in different sectors and requiring different skills. The key variable is whether the transition happens fast enough for workers and education systems to adapt.

Several trends are reshaping the employer-employee relationship. The "gig economy" — characterised by short-term contracts and freelance work — has grown substantially, offering flexibility but eroding the security and benefits traditionally associated with full-time employment.

Meanwhile, remote work, accelerated by the pandemic, has decoupled job location from physical presence, opening opportunities to workers in low-cost areas and fundamentally disrupting commercial real estate in major cities.

The consensus among economists is that the jobs of the future will require distinctively human skills: emotional intelligence, creativity, complex interpersonal communication, and ethical judgement — capabilities that remain stubbornly difficult for machines to replicate.

The question is not whether work will change, but whether societies will invest sufficiently in education, retraining, and social safety nets to ensure the transition is equitable.`,
    wordCount: 265,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'displace jobs', tr: 'işlerin yerini almak' },
      { phrase: 'gig economy', tr: 'esnek / serbest iş ekonomisi' },
      { phrase: 'social safety nets', tr: 'sosyal güvenlik ağları' },
    ],
    comprehensionQs: [
      { question: 'According to a 2023 Goldman Sachs study, how many jobs could AI automate?', options: ['100 million', '200 million', '300 million', '500 million'], answerIndex: 2 },
      { question: 'What characterises the "gig economy"?', options: ['Permanent employment with benefits', 'Short-term contracts and freelance work', 'Government-funded employment', 'Work in manufacturing'], answerIndex: 1 },
      { question: 'What skills does the writer say will be most important in future jobs?', options: ['Technical programming and data science', 'Emotional intelligence, creativity, and ethical judgement', 'Physical strength and manual skills', 'Financial expertise and accounting'], answerIndex: 1 },
    ],
  },
  {
    title: 'Climate Change: The Challenge of Our Time',
    level: 'B2',
    category: 'article',
    text: `The scientific consensus on climate change is unambiguous: the Earth's average temperature has risen by approximately 1.2 degrees Celsius since the pre-industrial era, driven primarily by human emissions of greenhouse gases — carbon dioxide, methane, and nitrous oxide — from fossil fuels, agriculture, and deforestation.

The consequences are already being felt. Extreme weather events — floods, droughts, heatwaves, wildfires — are increasing in frequency and intensity. Sea levels are rising, threatening low-lying coastal communities. Arctic ice is melting at an unprecedented rate, disrupting ecosystems and indigenous ways of life.

The 2015 Paris Agreement committed signatory nations to limiting warming to 1.5 degrees Celsius above pre-industrial levels. But current national pledges fall well short of what is required to achieve this goal. According to the Intergovernmental Panel on Climate Change (IPCC), global emissions must decline by 43% by 2030 to keep this target within reach.

The solutions exist. Transitioning to renewable energy — solar, wind, geothermal — is now economically competitive with fossil fuels in most markets. Electric vehicles are rapidly displacing internal combustion engines. Reforestation, sustainable agriculture, and changes to diet can all contribute to reducing emissions.

Yet the pace of change is critically insufficient. The barriers are not primarily technological but political and economic: the entrenched power of fossil fuel industries, short-term electoral cycles that discourage long-term planning, and the disproportionate burden of climate impacts falling on those least responsible for causing them.

Climate change is not a future problem. It is happening now, and the decisions made in the next decade will determine the trajectory of human civilisation for centuries.`,
    wordCount: 280,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'greenhouse gases', tr: 'sera gazları' },
      { phrase: 'unprecedented rate', tr: 'eşi görülmemiş hızda' },
      { phrase: 'entrenched power', tr: 'köklü / yerleşik güç' },
    ],
    comprehensionQs: [
      { question: 'By how much has the Earth\'s temperature risen since pre-industrial times?', options: ['0.5 degrees', 'About 1.2 degrees Celsius', '2 degrees Celsius', '3 degrees Celsius'], answerIndex: 1 },
      { question: 'By what percentage must global emissions decline by 2030 to limit warming to 1.5°C?', options: ['20%', '30%', '43%', '60%'], answerIndex: 2 },
      { question: 'According to the writer, what are the main barriers to action on climate change?', options: ['Lack of renewable energy technology', 'Political and economic factors', 'Public ignorance', 'Scientific disagreement'], answerIndex: 1 },
    ],
  },
  {
    title: 'The Psychology of Social Media',
    level: 'B2',
    category: 'article',
    text: `Social media platforms are engineered to be addictive. This is not accidental. Former employees of major tech companies have revealed that features like infinite scroll, variable reward notifications, and "likes" are deliberately designed to exploit psychological vulnerabilities in the human brain — particularly the dopamine reward system.

The mechanisms are well-understood by behavioural psychologists. Variable reward — receiving unpredictable positive feedback, like occasionally finding an interesting post while scrolling — is far more compulsive than predictable reward. It is the same principle exploited by slot machines in casinos.

Social comparison theory, developed by Leon Festinger in 1954, suggests that humans have a natural drive to evaluate themselves by comparing with others. Social media provides an inexhaustible supply of upward comparisons — images of people who appear wealthier, more beautiful, more successful, and more socially connected. For many users, particularly adolescents, this creates a persistent background of inadequacy and anxiety.

At the same time, the social validation feedback loop — the gratification of receiving likes and comments — can create a cycle where self-worth becomes contingent on digital approval. This may undermine the development of internal sources of self-esteem.

Researchers at the University of Pennsylvania found that limiting social media use to 30 minutes per day led to significant reductions in loneliness and depression, even among participants who initially believed social media had no negative effect on them.

The challenge is structural. Individual willpower is an insufficient defence against systems designed by teams of psychologists and engineers specifically to maximise engagement. Regulatory responses — advertising restrictions, algorithmic transparency, age verification — are increasingly being discussed as necessary complements to individual digital literacy.`,
    wordCount: 275,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'dopamine reward system', tr: 'dopamin ödül sistemi' },
      { phrase: 'upward comparisons', tr: 'yukarıya doğru karşılaştırma' },
      { phrase: 'algorithmic transparency', tr: 'algoritmik şeffaflık' },
    ],
    comprehensionQs: [
      { question: 'What is "variable reward" in the context of social media?', options: ['Being paid to use social media', 'Receiving unpredictable positive feedback', 'Earning points for every post', 'Getting rewards for sharing content'], answerIndex: 1 },
      { question: 'What did researchers at the University of Pennsylvania find?', options: ['Social media has no negative effects', 'Limiting social media to 30 minutes reduced loneliness and depression', 'Young people use social media more productively', 'Social media improves memory'], answerIndex: 1 },
      { question: 'What does the writer suggest as a complement to individual digital literacy?', options: ['Better phones', 'More social media platforms', 'Regulatory responses like advertising restrictions', 'Digital education in schools'], answerIndex: 2 },
    ],
  },
  {
    title: 'Mental Health at Work',
    level: 'B2',
    category: 'article',
    text: `Mental health conditions — depression, anxiety, burnout — cost the global economy an estimated $1 trillion per year in lost productivity, according to the World Health Organization. Yet workplace mental health remains a largely neglected area of public health policy and corporate responsibility.

The causes of poor workplace mental health are well-documented. Excessive workloads, lack of autonomy, poor management, job insecurity, and workplace conflict are among the most significant risk factors. The always-on culture enabled by digital communication — the expectation that employees are reachable at any hour — has extended the working day and eroded the psychological recovery time that people need.

Stigma remains a significant barrier. Many workers, particularly in competitive industries and managerial roles, fear that disclosing mental health struggles will be perceived as weakness and will harm their careers. This means that problems often go unaddressed until they reach crisis point.

Organisations that have invested in mental health — offering employee assistance programmes, mental health days, training managers to recognise and respond to signs of distress, and creating genuinely psychologically safe environments — consistently report better retention, lower absenteeism, and higher performance.

The business case is compelling, but the moral case is stronger. Employees are not simply productive units. They are people with complex inner lives who spend the majority of their waking hours in the workplace. Organisations have a genuine responsibility to ensure that this time does not come at the cost of their people's mental wellbeing.

For this to change at scale, it requires not just individual organisational action but legislative frameworks that establish minimum standards for workplace mental health — as tangible and enforceable as physical safety regulations.`,
    wordCount: 275,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'burnout', tr: 'tükenmişlik sendromu' },
      { phrase: 'psychologically safe', tr: 'psikolojik olarak güvenli' },
      { phrase: 'absenteeism', tr: 'devamsızlık' },
    ],
    comprehensionQs: [
      { question: 'How much do mental health conditions cost the global economy per year?', options: ['$100 billion', '$500 billion', '$1 trillion', '$2 trillion'], answerIndex: 2 },
      { question: 'Why do many workers not disclose mental health struggles?', options: ['They don\'t know they are struggling', 'They fear it will be seen as weakness and harm their careers', 'There is no support available', 'It is against company policy'], answerIndex: 1 },
      { question: 'What does the writer argue is needed beyond individual organisational action?', options: ['More research', 'Media campaigns', 'Legislative frameworks for workplace mental health', 'International agreements'], answerIndex: 2 },
    ],
  },
  {
    title: 'Artificial Intelligence: A New Era',
    level: 'B2',
    category: 'article',
    text: `The rapid development of large language models — AI systems capable of generating coherent text, writing code, translating languages, and performing complex reasoning tasks — has prompted both extraordinary excitement and serious concern among technologists, policymakers, and the broader public.

What distinguishes the current wave of AI from previous automation is its apparent generality. Earlier AI systems were narrow: they could outperform humans at chess or recognise faces in photographs, but could not transfer those skills to other domains. Modern large language models demonstrate a more flexible, general-purpose capability that resembles, in some ways, human intelligence.

This has led to optimistic projections. AI could accelerate scientific discovery — models have already been used to identify potential drug candidates and to predict protein structures in ways that would have taken human researchers decades. AI tutoring systems could democratise access to high-quality education. In medicine, AI diagnostic tools are already detecting certain cancers more accurately than trained clinicians.

But the risks are substantial. The same capabilities that make AI useful also make it powerful in potentially harmful ways: generating disinformation at scale, enabling new forms of cyberattack, automating jobs that provide livelihoods for millions, and — in more speculative but increasingly mainstream scenarios — developing goals or capabilities misaligned with human values.

The governance question is pressing. AI development is currently concentrated in a handful of large technology companies, primarily in the United States and China, with limited democratic oversight or international coordination.

How to maximise the benefits while managing the risks — and who decides — are among the most consequential policy questions of the twenty-first century.`,
    wordCount: 270,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'large language models', tr: 'büyük dil modelleri' },
      { phrase: 'disinformation', tr: 'dezenformasyon / yanlış bilgi' },
      { phrase: 'governance', tr: 'yönetişim / denetim' },
    ],
    comprehensionQs: [
      { question: 'What distinguishes modern AI from earlier AI systems?', options: ['It is faster', 'It is cheaper to run', 'It has more general-purpose capability', 'It uses less energy'], answerIndex: 2 },
      { question: 'How has AI already been used in medicine according to the text?', options: ['Replacing all doctors', 'Detecting certain cancers more accurately than clinicians', 'Performing surgery', 'Managing hospital administration'], answerIndex: 1 },
      { question: 'Where is AI development currently concentrated?', options: ['Europe and Australia', 'A handful of large tech companies in the US and China', 'Government research labs', 'Universities worldwide'], answerIndex: 1 },
    ],
  },
  {
    title: 'Immigration and Identity',
    level: 'B2',
    category: 'article',
    text: `Immigration is one of the most politically charged topics in contemporary democracies. Yet behind the statistics and the headlines are millions of individual stories — of people who left everything familiar to seek safety, opportunity, or a better future for their children.

The experience of immigration is rarely straightforward. First-generation immigrants often live between two worlds: maintaining strong ties to the culture, language, and customs of their origin country while negotiating the expectations and values of their new home. This navigation is rarely painless. Identity itself can feel fragmented — belonging fully to neither world.

Second-generation immigrants — those born in the new country to immigrant parents — often face a different but equally complex identity challenge. They may feel pressure to assimilate fully into the dominant culture while simultaneously receiving the message, explicitly or implicitly, that they do not fully belong.

Research on immigrant integration points to several factors that facilitate successful outcomes: language acquisition, access to education and employment, having local social networks, and a receiving society that is genuinely welcoming rather than merely tolerant.

The contribution of immigrants to receiving societies is well-documented across economic, cultural, and scientific dimensions. Immigrants and the children of immigrants are overrepresented among Nobel laureates, founders of major companies, and contributors to the arts.

The political challenge is to have honest conversations about the real pressures that rapid demographic change can create in housing, public services, and social cohesion — without scapegoating or dehumanising the individuals and communities at the heart of those changes.`,
    wordCount: 270,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'first-generation immigrant', tr: 'birinci nesil göçmen' },
      { phrase: 'assimilate', tr: 'asimile olmak / uyum sağlamak' },
      { phrase: 'scapegoating', tr: 'günah keçisi ilan etmek' },
    ],
    comprehensionQs: [
      { question: 'What identity challenge do second-generation immigrants often face?', options: ['They have no culture of their own', 'Pressure to assimilate while being told they don\'t fully belong', 'They reject their parents\' culture', 'They speak neither language well'], answerIndex: 1 },
      { question: 'What factor does research identify as facilitating immigrant integration?', options: ['High income', 'Language acquisition and access to education', 'Living in immigrant-only communities', 'Returning home regularly'], answerIndex: 1 },
      { question: 'What does the writer say is the political challenge regarding immigration?', options: ['Stopping all immigration', 'Having honest conversations without scapegoating', 'Increasing immigration dramatically', 'Removing border controls'], answerIndex: 1 },
    ],
  },
  {
    title: 'The Gig Economy',
    level: 'B2',
    category: 'article',
    text: `The "gig economy" refers to a labour market characterised by short-term, flexible, and freelance work arrangements, rather than permanent employment contracts. Enabled by digital platforms, it encompasses everything from ride-hailing drivers and food delivery couriers to freelance designers, programmers, and consultants.

Proponents argue that gig work offers genuine freedom — the ability to choose your hours, your location, and your clients. For people with childcare responsibilities, health constraints, or multiple income streams, this flexibility can be genuinely valuable. Research also shows that some gig workers — particularly skilled freelancers — earn more than equivalent employees.

Critics point to a more troubling picture. Many gig workers — particularly at the lower end of the income distribution — enjoy neither the protections of employment law nor the flexibility that proponents celebrate. They cannot access sick pay, holiday pay, or employer pension contributions. Their income is volatile and unpredictable. They bear all the risk that an employer would otherwise carry.

The legal classification of gig workers is fiercely contested. In 2021, the UK Supreme Court ruled that Uber drivers were "workers" rather than independent contractors, entitling them to minimum wage and holiday pay — a landmark decision with implications across the sector.

The deeper structural issue is the growing asymmetry between capital and labour. Platforms extract significant value from gig workers while externalising risk onto them. Many argue this represents the most aggressive form yet of a long-running trend toward labour market deregulation.

As automation further disrupts employment, the question of who bears economic risk — employers, workers, or the state — will become increasingly central to democratic politics.`,
    wordCount: 280,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'labour market', tr: 'iş gücü piyasası' },
      { phrase: 'volatile income', tr: 'dalgalı gelir' },
      { phrase: 'externalising risk', tr: 'riski dışarıya aktarmak' },
    ],
    comprehensionQs: [
      { question: 'What did the UK Supreme Court rule about Uber drivers in 2021?', options: ['They are self-employed contractors', 'They are "workers" entitled to minimum wage and holiday pay', 'They must form a union', 'They are employees with full benefits'], answerIndex: 1 },
      { question: 'What risks do many gig workers bear alone?', options: ['Risk of a bad review', 'Income volatility and lack of sick pay or holiday pay', 'Risk of losing their platform access', 'Risk of working too many hours'], answerIndex: 1 },
      { question: 'What structural issue does the writer identify in the gig economy?', options: ['Too many workers chasing too few jobs', 'Growing asymmetry between capital and labour', 'Technology making platforms unreliable', 'Competition between platforms'], answerIndex: 1 },
    ],
  },
  {
    title: 'Education Systems Around the World',
    level: 'B2',
    category: 'article',
    text: `Every few years, the PISA rankings — measuring fifteen-year-olds' performance in reading, mathematics, and science across participating countries — generate heated debate about which education systems work best and why. Countries like Singapore, Finland, Japan, and South Korea consistently appear at or near the top, while wealthy Western nations often fall short of expectations given their levels of spending.

What accounts for the differences? Analysts point to several factors. Cultural attitudes toward education play a significant role: in East Asian countries with Confucian educational traditions, academic achievement is deeply valued by families and communities, which drives student effort and parental engagement.

But culture alone does not explain everything. Finland — a Nordic country without a Confucian tradition — has built a world-class system through very different means: well-paid, highly selective teaching, minimal standardised testing, extensive play-based learning in early childhood, and a deliberate effort to reduce inequality between schools.

Singapore combines high expectations with careful pedagogical design: teachers are respected and well-compensated, lessons are carefully sequenced, and strong support is given to students who fall behind.

Critics of international league tables argue that they measure a narrow slice of education outcomes, privileging memorisation and test performance over creativity, civic education, wellbeing, and social cohesion — outcomes harder to measure but arguably more important.

The uncomfortable truth is that there is no single model that works in all contexts. Education systems are deeply embedded in cultural and political contexts. The most effective ones tend to share a few principles: they treat teaching as a high-status profession, they invest consistently in early childhood, and they are designed to reduce educational inequality rather than entrench it.`,
    wordCount: 280,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'PISA rankings', tr: 'PISA sıralamaları (uluslararası eğitim değerlendirmesi)' },
      { phrase: 'standardised testing', tr: 'standart test / sınav' },
      { phrase: 'entrench inequality', tr: 'eşitsizliği pekiştirmek' },
    ],
    comprehensionQs: [
      { question: 'What is PISA?', options: ['A university ranking system', 'A measurement of 15-year-olds\' performance in reading, maths, and science', 'A teacher qualification programme', 'An education funding scheme'], answerIndex: 1 },
      { question: 'How has Finland built its world-class education system?', options: ['Heavy standardised testing and long school hours', 'Well-paid teachers, minimal testing, and reducing inequality', 'Private schooling and competitive entry', 'Following East Asian educational models'], answerIndex: 1 },
      { question: 'What do the most effective education systems tend to share?', options: ['Large class sizes and strict discipline', 'High teacher status, early childhood investment, and reduced inequality', 'Focus exclusively on STEM subjects', 'Long school days and homework'], answerIndex: 1 },
    ],
  },
  {
    title: 'Urban Food Deserts',
    level: 'B2',
    category: 'article',
    text: `A "food desert" is a geographic area where residents have limited access to affordable, nutritious food — particularly fresh vegetables, fruits, and whole grains. The concept was developed in the 1990s to describe a pattern that emerged most visibly in American cities, though it has since been documented in urban areas worldwide.

Food deserts typically coincide with low-income, predominantly minority neighbourhoods. Large supermarkets and grocery chains tend to locate in wealthier areas where per-unit profitability is higher, leaving poorer neighbourhoods served only by convenience stores and fast food outlets that stock few fresh or healthy products.

The health consequences are significant. Residents of food deserts have higher rates of obesity, type 2 diabetes, cardiovascular disease, and other diet-related conditions. When the cheapest and most accessible food is calorie-dense but nutritionally poor, healthy eating becomes genuinely difficult — not merely a matter of individual choice.

Some critics of the food desert concept argue that price, not proximity, is the primary barrier to healthy eating among low-income households. Others point out that corner stores can stock fresh produce if it is economically viable, and that community-supported agriculture and food co-operatives have had success in improving access.

Policy responses have included subsidies for supermarkets to open in underserved areas, community gardens, mobile food markets, and expansion of food voucher programmes that can be spent on fresh produce.

Addressing food deserts requires acknowledging that diet and health outcomes are not purely individual responsibilities but are shaped by structural conditions — decisions about urban planning, retail investment, and income inequality — that lie beyond any individual's control.`,
    wordCount: 275,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'food desert', tr: 'gıda çölü (yeterli yiyeceğe erişilemeyen bölge)' },
      { phrase: 'nutritionally poor', tr: 'besleyici değeri düşük' },
      { phrase: 'urban planning', tr: 'kentsel planlama' },
    ],
    comprehensionQs: [
      { question: 'What is a "food desert"?', options: ['An area with no restaurants', 'An area with limited access to affordable, nutritious food', 'A desert region with food growing problems', 'A country with food shortages'], answerIndex: 1 },
      { question: 'Why do large supermarkets tend to avoid poorer neighbourhoods?', options: ['Safety concerns', 'Government regulations', 'Higher per-unit profitability in wealthier areas', 'Lack of transport links'], answerIndex: 2 },
      { question: 'What is one policy response to food deserts mentioned in the text?', options: ['Taxing unhealthy food', 'Closing fast food outlets', 'Subsidies for supermarkets in underserved areas', 'Requiring all stores to sell fresh produce'], answerIndex: 2 },
    ],
  },
  {
    title: 'The Rise of E-commerce',
    level: 'B2',
    category: 'article',
    text: `The shift toward online shopping has been one of the most significant economic transformations of the past two decades. Driven by the proliferation of smartphones, faster broadband, increasingly convenient logistics networks, and — most dramatically — accelerated by the COVID-19 pandemic, e-commerce now accounts for roughly a quarter of all retail sales globally.

Amazon is the most visible symbol of this transformation, but the shift runs much deeper. In China, platforms like Alibaba's Taobao and Pinduoduo serve hundreds of millions of daily shoppers with an infrastructure that has essentially replaced traditional retail in many product categories. In Europe and North America, even sectors traditionally resistant to online disruption — groceries, pharmaceuticals, luxury goods — are now seeing significant online migration.

The winners are clear: efficient logistics providers, technology companies, and consumers who enjoy greater choice and convenience at lower prices. The losers are high-street retailers, who have faced relentless pressure, with tens of thousands of physical stores closing globally each year.

The social consequences are complex. High streets and town centres, emptied by the shift to online shopping, create genuine social costs: reduced community gathering spaces, hollowed-out local economies, and increased car dependency as retail centralises in large out-of-town warehouses.

Environmental implications are contested. E-commerce can reduce certain types of journeys, but the explosion in individual home deliveries and returns generates its own carbon footprint. Fast fashion, enabled by online platforms, is one of the most environmentally damaging industries in the world.

The long-term trajectory seems clear: retail will continue to bifurcate, with the experience economy — hospitality, entertainment, premium services — remaining physical, while commodity goods increasingly shift online.`,
    wordCount: 280,
    readingTimeMin: 3,
    keyPhrases: [
      { phrase: 'proliferation', tr: 'yayılma / hızlı çoğalma' },
      { phrase: 'high-street retailers', tr: 'ana cadde perakendecileri' },
      { phrase: 'bifurcate', tr: 'ikiye ayrılmak / bölünmek' },
    ],
    comprehensionQs: [
      { question: 'What proportion of global retail sales does e-commerce account for?', options: ['About 5%', 'About 10%', 'About 25%', 'About 50%'], answerIndex: 2 },
      { question: 'What social cost of e-commerce growth does the writer mention?', options: ['Higher prices for consumers', 'Empty high streets and hollowed-out local economies', 'Less product variety', 'Longer delivery times'], answerIndex: 1 },
      { question: 'What does the writer say about the future of retail?', options: ['Everything will move online', 'Physical retail will disappear', 'Retail will bifurcate — experience stays physical, commodity goods go online', 'E-commerce will decline after the pandemic'], answerIndex: 2 },
    ],
  },
  // ── C1 (5) ────────────────────────────────────────────────────────────────
  {
    title: 'The Neuroscience of Language Learning',
    level: 'C1',
    category: 'science',
    text: `Language acquisition is one of the most complex cognitive tasks the human brain performs. Unlike most skills, which can be learned at any age, language learning appears to be subject to a "critical period" — a developmental window, largely confined to early childhood, during which neural plasticity facilitates rapid, effortless acquisition of any human language.

The neuroscientific basis of this phenomenon is well-established. During the critical period, synaptic density in language-associated cortical areas — particularly Broca's area in the inferior frontal gyrus and Wernicke's area in the posterior temporal lobe — reaches its peak, enabling the fine-grained phonological discrimination that native speakers acquire automatically but adult learners find extraordinarily difficult.

This does not mean that adult language learning is impossible. Neuroimaging studies reveal that adult second language learners activate overlapping but not identical cortical networks compared to native speakers. Crucially, the degree of overlap increases with proficiency and with earlier age of acquisition. Advanced second-language learners who achieve near-native proficiency — a relatively rare outcome — show neural activation patterns that closely resemble those of monolingual native speakers.

Several factors predict adult language learning success beyond raw aptitude. Motivation is paramount: integrative motivation — a genuine desire to become part of the target language community — correlates more strongly with ultimate attainment than instrumental motivation, such as learning for professional reasons.

Instructional context matters significantly. Explicit grammar instruction and implicit exposure through immersion are not mutually exclusive but target different learning systems: explicit instruction engages declarative memory, while immersion shapes procedural memory and automaticity. The most effective pedagogies exploit both.

Recent research suggests that interleaved, spaced practice — distributing learning sessions over time with varied content — produces more durable long-term retention than massed practice, challenging the intuition that intensive courses are more effective than sustained, distributed learning.`,
    wordCount: 280,
    readingTimeMin: 4,
    keyPhrases: [
      { phrase: 'critical period', tr: 'kritik dönem' },
      { phrase: 'neural plasticity', tr: 'nöral esneklik / sinir sistemi uyum kapasitesi' },
      { phrase: 'integrative motivation', tr: 'bütünleştirici motivasyon' },
    ],
    comprehensionQs: [
      { question: 'What is the "critical period" in language acquisition?', options: ['The best time to take a language exam', 'A developmental window in early childhood facilitating effortless acquisition', 'A university course for advanced learners', 'The period when adults learn fastest'], answerIndex: 1 },
      { question: 'What type of motivation correlates most strongly with adult language learning success?', options: ['Instrumental motivation', 'Competitive motivation', 'Integrative motivation', 'Financial motivation'], answerIndex: 2 },
      { question: 'What does recent research say about intensive vs. distributed learning?', options: ['Intensive courses are far more effective', 'There is no significant difference', 'Interleaved, spaced practice produces more durable retention', 'Distributed learning only works for children'], answerIndex: 2 },
    ],
  },
  {
    title: 'Economic Inequality and Its Discontents',
    level: 'C1',
    category: 'article',
    text: `The relationship between economic inequality and societal wellbeing has become one of the most contested questions in contemporary social science. The empirical evidence compiled by researchers like Richard Wilkinson and Kate Pickett in "The Spirit Level" suggests that more unequal societies — measured by the Gini coefficient — perform worse on a wide range of social indicators: health outcomes, educational attainment, social mobility, crime rates, and levels of interpersonal trust.

The causal mechanisms are debated but plausible. High inequality generates social comparisons that produce status anxiety throughout the social hierarchy — not just at the bottom. It erodes the social solidarity and reciprocity that underpin effective public institutions. When the wealthy can exit public services into private alternatives — private healthcare, private schools, private security — their stake in the quality of shared institutions diminishes, weakening the political coalition necessary to maintain them.

Inequality has risen substantially in most developed economies since the 1980s, driven by the interaction of technological change, globalisation, declining union membership, and deliberate policy shifts — particularly reductions in top marginal tax rates and the weakening of employment protections.

The counter-arguments are significant. Some economists argue that inequality is an inevitable and even functional feature of market economies — that differential rewards are necessary to incentivise innovation and effort. Others contend that the relationship between inequality and poor social outcomes is confounded by other variables, and that growth, not redistribution, is the more reliable path to broad-based prosperity.

The policy debate centres on whether to address inequality through redistribution — progressive taxation, social transfers, expanded public services — or through predistribution: shaping market outcomes through labour market regulation, investment in education, and competition policy before they result in unequal income distribution.

What seems increasingly clear is that extreme inequality is corrosive — not just to social cohesion, but to the quality and legitimacy of democratic institutions themselves.`,
    wordCount: 290,
    readingTimeMin: 4,
    keyPhrases: [
      { phrase: 'Gini coefficient', tr: 'Gini katsayısı (gelir eşitsizliği ölçüsü)' },
      { phrase: 'status anxiety', tr: 'statü kaygısı' },
      { phrase: 'predistribution', tr: 'ön yeniden dağılım' },
    ],
    comprehensionQs: [
      { question: 'What does The Spirit Level argue about inequality?', options: ['Inequality drives economic growth', 'More unequal societies perform worse on social indicators', 'Inequality is inevitable in market economies', 'Inequality only affects the poorest groups'], answerIndex: 1 },
      { question: 'What is "predistribution" as discussed in the text?', options: ['Cutting welfare benefits', 'Shaping market outcomes before they result in unequal distribution', 'Taxing wealth after it is accumulated', 'Distributing income equally'], answerIndex: 1 },
      { question: 'What does the writer say is increasingly clear?', options: ['Inequality is necessary for innovation', 'Redistribution always causes economic stagnation', 'Extreme inequality is corrosive to social cohesion and democratic institutions', 'Inequality has declined in developed economies'], answerIndex: 2 },
    ],
  },
  {
    title: 'The Ethics of Artificial Intelligence',
    level: 'C1',
    category: 'article',
    text: `The deployment of artificial intelligence in consequential decision-making contexts — loan approvals, criminal sentencing, medical diagnosis, hiring — raises profound ethical questions that existing legal and regulatory frameworks are ill-equipped to address.

A central concern is algorithmic bias. Machine learning systems learn from historical data; if that data reflects historical patterns of discrimination, the system will tend to replicate and potentially amplify those patterns. The COMPAS recidivism algorithm, used in American courts to predict the likelihood of reoffending, was found by the investigative journalism organisation ProPublica to be twice as likely to incorrectly flag Black defendants as future criminals compared to white defendants. The company denied this characterisation, highlighting a genuine methodological dispute about how to define "fairness" in a predictive system — a dispute that turns out to have no purely technical resolution.

A second concern is explainability. Many of the most powerful AI systems — particularly deep neural networks — are effectively black boxes: they produce outputs whose reasoning cannot be traced in ways meaningful to human understanding. This creates fundamental tensions with principles of accountability and due process, particularly in legal and medical contexts where individuals have a right to understand the basis for decisions affecting them.

A third concern is the concentration of AI capabilities. The computational resources required to train frontier AI systems are available only to a small number of large technology companies and state actors. This concentration raises questions about whose values and priorities are encoded in systems that will increasingly shape the information environments, employment opportunities, and public services of billions of people.

The philosophical underpinning of AI ethics draws on multiple traditions. Utilitarian frameworks ask whether AI deployments maximise overall welfare. Deontological frameworks ask whether they respect individual rights and dignity. Virtue ethics asks what kind of society and what kind of human capacities we are fostering through our technological choices.

None of these frameworks, alone or in combination, yields algorithmic answers. AI ethics is, fundamentally, a domain of moral philosophy applied to unprecedented conditions.`,
    wordCount: 305,
    readingTimeMin: 4,
    keyPhrases: [
      { phrase: 'algorithmic bias', tr: 'algoritmik önyargı' },
      { phrase: 'black box', tr: 'kara kutu (açıklanamaz sistem)' },
      { phrase: 'deontological', tr: 'deontolojik (ödevci etik)' },
    ],
    comprehensionQs: [
      { question: 'What was the finding about the COMPAS algorithm?', options: ['It was perfectly accurate', 'It was twice as likely to incorrectly flag Black defendants as future criminals', 'It was banned in all US states', 'It favoured low-income defendants'], answerIndex: 1 },
      { question: 'What is the "explainability" problem with AI?', options: ['AI cannot explain human language', 'Many powerful AI systems are "black boxes" whose reasoning cannot be meaningfully traced', 'AI explanations are too technical for judges', 'AI is too slow to explain its decisions'], answerIndex: 1 },
      { question: 'What does the writer conclude about AI ethics?', options: ['It can be resolved through better algorithms', 'It is purely a technical problem', 'It is a domain of moral philosophy applied to unprecedented conditions', 'It requires only utilitarian analysis'], answerIndex: 2 },
    ],
  },
  {
    title: 'Rethinking Urban Planning',
    level: 'C1',
    category: 'article',
    text: `The twentieth-century city was largely shaped by the automobile. The decision, made in North American and European cities in the post-war decades, to redesign urban environments around car ownership — widening roads, mandating parking minimums, separating residential from commercial land uses through zoning laws — produced cities that are convenient for drivers but hostile to pedestrians, cyclists, and those who cannot afford cars.

The consequences are now well-documented. Car-centric urban design increases particulate matter pollution and greenhouse gas emissions. It fragments communities, reducing the incidental social interactions that occur in pedestrian-scale environments. It increases obesity rates — because walking and cycling are designed out of daily life — and generates the spatial patterns that produce food deserts and limit access to services.

A growing movement of urbanists, planners, and researchers is advocating for a fundamental rethink. The concept of the "fifteen-minute city" — popularised by Paris mayor Anne Hidalgo and urban planning theorist Carlos Moreno — proposes that all essential urban services should be accessible within a fifteen-minute walk or cycle from any resident's home. This requires mixed-use zoning, high-density development, and substantial public investment in cycle infrastructure and public space.

Implementation is contested. Critics argue that the fifteen-minute city model favours wealthy central districts and risks exacerbating gentrification. Car-dependent peripheral areas require different interventions, including improved public transport corridors and more incremental densification.

The politics of urban change are also significant. Existing residents often resist densification and road reallocation, perceiving them as threats to property values or neighbourhood character. Overcoming this resistance typically requires deliberate participatory processes that give communities genuine agency in how change happens, rather than having it imposed upon them.

The cities that navigate this transition most successfully will likely combine ecological ambition with social equity — ensuring that the benefits of good urban design are distributed across the income spectrum, not merely accessible to those who can afford to live in already-desirable neighbourhoods.`,
    wordCount: 310,
    readingTimeMin: 4,
    keyPhrases: [
      { phrase: 'parking minimums', tr: 'minimum park yeri zorunluluğu' },
      { phrase: 'fifteen-minute city', tr: 'on beş dakikalık şehir' },
      { phrase: 'gentrification', tr: 'soylulaştırma' },
    ],
    comprehensionQs: [
      { question: 'What does the "fifteen-minute city" concept propose?', options: ['Cities should be limited in size', 'All essential services should be accessible within 15 minutes on foot or by bike', 'Cars should be banned from city centres', 'All cities should be redesigned around public transport'], answerIndex: 1 },
      { question: 'Why do existing residents often resist urban densification?', options: ['They are opposed to environmental policies', 'They perceive it as a threat to property values or neighbourhood character', 'They prefer longer commutes', 'They do not trust urban planners'], answerIndex: 1 },
      { question: 'What does the writer say about the cities most likely to succeed in the transition?', options: ['Those with the largest budgets', 'Those led by the most progressive politicians', 'Those that combine ecological ambition with social equity', 'Those that adopt the fifteen-minute city model exactly'], answerIndex: 2 },
    ],
  },
  {
    title: 'Rethinking Education for the Twenty-First Century',
    level: 'C1',
    category: 'article',
    text: `The architecture of modern formal education — age-graded classrooms, subject divisions, standardised examinations, and a core curriculum emphasising literacy, numeracy, and increasingly STEM skills — was largely designed in the nineteenth and early twentieth centuries for the purposes of a particular kind of industrial economy: one that required a literate, compliant, and differentiated workforce capable of operating reliably within hierarchical organisations.

The adequacy of this model for the twenty-first century is increasingly questioned. Automation is eliminating precisely those routine cognitive and manual tasks that mass education was designed to prepare people for. The half-life of specific vocational knowledge is shortening, as technological change makes today's in-demand skills obsolete within years or decades. Demographic and epidemiological shifts mean that many young people entering the workforce today will have careers spanning forty or fifty years, during which multiple major occupational transitions will be necessary.

If this analysis is correct, the critical competencies are those that cannot be easily automated: complex problem-solving, creative synthesis, ethical reasoning, emotional intelligence, and the metacognitive skill of learning how to learn. These are competencies less reliably developed through passive instruction and high-stakes standardised assessment than through project-based learning, mentorship, reflection, and genuine intellectual challenge.

There is also a compelling case for integrating wellbeing more explicitly into educational goals. Research consistently shows that academic performance and mental health are not in tension when teaching environments are designed well. Students who feel seen, supported, and genuinely engaged are more academically effective — not less.

The systemic obstacles to transforming education are substantial. Assessment and accountability systems drive backward into teaching. Political cycles discourage long-term investment. Teacher recruitment and retention crises in many countries reflect persistently undervalued professional status.

Yet there are examples — from Singapore to Finland, from certain charter networks in the United States to innovative schools in Australia — of what a more humane and future-oriented education might look like. The evidence exists. The challenge is political will and institutional courage.`,
    wordCount: 310,
    readingTimeMin: 4,
    keyPhrases: [
      { phrase: 'half-life of knowledge', tr: 'bilginin yarı ömrü (ne kadar sürede geçerliliğini yitireceği)' },
      { phrase: 'metacognitive skill', tr: 'üstbilişsel beceri (öğrenmeyi öğrenme)' },
      { phrase: 'project-based learning', tr: 'proje tabanlı öğrenme' },
    ],
    comprehensionQs: [
      { question: 'Why was modern formal education designed, according to the text?', options: ['To produce philosophers and artists', 'For an industrial economy needing a literate, compliant workforce', 'To promote democratic participation', 'For an agricultural society'], answerIndex: 1 },
      { question: 'What does the writer argue are the critical competencies for the 21st century?', options: ['Numeracy and STEM skills', 'Complex problem-solving, creativity, emotional intelligence, and learning how to learn', 'Memory and discipline', 'Technical vocational skills'], answerIndex: 1 },
      { question: 'What does the writer say about academic performance and mental health?', options: ['They are fundamentally in conflict', 'Better mental health always leads to worse academic results', 'They are not in tension when teaching environments are designed well', 'Mental health is irrelevant to academic performance'], answerIndex: 2 },
    ],
  },
  // ── C2 (3) ────────────────────────────────────────────────────────────────
  {
    title: 'The Language of Power',
    level: 'C2',
    category: 'article',
    text: `Language is never neutral. Every utterance — every choice of word, register, framing, and metaphor — encodes assumptions, values, and power relations. Critical discourse analysis, developed through the work of scholars like Norman Fairclough and Teun van Dijk, proceeds from the insight that language does not merely reflect social reality; it actively constitutes and reproduces it.

Consider the language of economic policy. When governments speak of "fiscal consolidation" rather than "spending cuts," or "human capital investment" rather than "education," they are not simply choosing more elegant synonyms. They are deploying a rhetorical architecture that naturalises certain assumptions — in this case, that citizens are economic units, that the state is an enterprise, and that the market is the appropriate lens through which to evaluate public life.

The language of crisis is instructive in similar ways. Terms like "illegal immigrant" rather than "undocumented person" or "asylum seeker" perform different ideological work: they position individuals in relation to the state through a juridical rather than humanistic framework, foreclosing certain moral responses before the argument has begun.

Euphemism, dysphemism, nominalisation, and the passive voice are all instruments through which agency is obscured, responsibility is distributed or erased, and propositions that would be contested if stated plainly are presented as self-evident. The journalistic passive — "mistakes were made," "protesters were shot" — suppresses actorship in ways that are anything but innocent.

The critical reader's task is not merely to decode meaning but to ask: who benefits from this framing? Whose interests are served by the particular metaphors deployed? What alternatives were foreclosed, and what would change if they were restored?

This is not primarily a technical skill. It is an ethical one. Language literacy in the deepest sense is the capacity to resist the naturalization of contingent arrangements — to apprehend, with Orwell's precision, the ways in which language can be made "an instrument for concealing or preventing thought."`,
    wordCount: 305,
    readingTimeMin: 4,
    keyPhrases: [
      { phrase: 'critical discourse analysis', tr: 'eleştirel söylem analizi' },
      { phrase: 'nominalisation', tr: 'adlaştırma (fiil/sıfatı isim haline getirme)' },
      { phrase: 'naturalisation of contingent arrangements', tr: 'rastlantısal düzenlemelerin doğallaştırılması' },
    ],
    comprehensionQs: [
      { question: 'What is the key insight of critical discourse analysis?', options: ['Language should be simplified for all audiences', 'Language reflects social reality as a neutral mirror', 'Language actively constitutes and reproduces social reality', 'Language should be regulated by governments'], answerIndex: 2 },
      { question: 'How does the term "illegal immigrant" differ from "undocumented person" according to the text?', options: ['They have exactly the same meaning', '"Illegal immigrant" positions the individual through a juridical rather than humanistic framework', '"Undocumented person" is more accurate legally', 'Only "illegal immigrant" is used in official documents'], answerIndex: 1 },
      { question: 'What does the writer say is the critical reader\'s task?', options: ['To identify grammatical errors', 'To decode meaning and ask who benefits from a given framing', 'To translate texts accurately', 'To appreciate rhetorical beauty'], answerIndex: 1 },
    ],
  },
  {
    title: 'Consciousness and the Self',
    level: 'C2',
    category: 'science',
    text: `The "hard problem" of consciousness — David Chalmers' term for the explanatory gap between physical brain processes and the subjective experience of being — remains, after decades of neuroscientific progress, as philosophically intractable as ever. We can map the neural correlates of conscious experience with extraordinary precision: the visual cortex responding to colour, the amygdala encoding emotional salience, the default mode network activating during self-referential thought. What we cannot do is explain why any of this physical activity should be accompanied by experience — why there is "something it is like" to be a conscious entity.

The implications for our understanding of the self are profound. The Buddhist philosophical tradition, and certain strands of analytic philosophy, converge on the view that the self is not a substantial entity — a Cartesian "ghost in the machine" — but a process: a constantly re-constructed narrative that the brain generates to provide coherence to the stream of experience.

Neuroscientist Antonio Damasio's somatic marker hypothesis suggests that the self arises, in part, from the brain's continuous modelling of the body's internal states. In this view, embodiment is not peripheral to selfhood but constitutive of it: the feeling of being a self is, at its foundation, the feeling of being a body.

The implications for personal identity over time are equally unsettling. The neurons that encode your memories today are not the same neurons that will encode them in ten years. The psychological continuity theory of personal identity — the view that you are the same person as your childhood self because of memory and psychological connectedness — runs into the "Ship of Theseus" problem: at what point of replacement does continuity dissolve?

These are not merely academic questions. They bear directly on the ethics of medical decisions for patients with severe dementia, on the moral status of artificial intelligence systems that exhibit behavioural signs of preference and learning, and on how we should understand radical personality change following brain injury.

Consciousness, the self, and their relationship remain the deepest territory of inquiry available to us — at the intersection of neuroscience, philosophy, and what it means to be a person.`,
    wordCount: 330,
    readingTimeMin: 5,
    keyPhrases: [
      { phrase: 'the hard problem of consciousness', tr: 'bilincin zor problemi' },
      { phrase: 'neural correlates', tr: 'sinirsel karşılıklar / ilişkili beyin süreçleri' },
      { phrase: 'Ship of Theseus', tr: 'Theseus\'un Gemisi (kimlik paradoksu)' },
    ],
    comprehensionQs: [
      { question: 'What is the "hard problem" of consciousness?', options: ['Why the brain is so complex', 'The explanatory gap between physical brain processes and subjective experience', 'How to measure intelligence scientifically', 'Why some people are more conscious than others'], answerIndex: 1 },
      { question: 'What does Damasio\'s somatic marker hypothesis suggest about the self?', options: ['The self is an illusion created by culture', 'The self arises partly from the brain\'s modelling of the body\'s internal states', 'The self exists independently of the body', 'The self is stored in the hippocampus'], answerIndex: 1 },
      { question: 'What practical area does the writer say these philosophical questions bear upon?', options: ['Programming AI systems', 'Economics and market behaviour', 'Medical ethics for patients with dementia', 'Architectural design of hospitals'], answerIndex: 2 },
    ],
  },
  {
    title: 'The Anthropocene: Living in the Age of Human Impact',
    level: 'C2',
    category: 'science',
    text: `The Anthropocene — from the Greek "anthropos" (human) and "kainos" (new) — is the proposed geological epoch in which human activity has become the dominant force shaping the Earth's systems. Though not yet formally ratified by the International Commission on Stratigraphy, the concept has achieved considerable scientific, philosophical, and cultural currency as a framework for understanding the present condition of the planet.

The stratigraphic evidence for the Anthropocene is compelling. The mid-twentieth century "Great Acceleration" — the period from roughly 1950 onward in which human population, economic output, energy use, and environmental impact began to rise exponentially — has left indelible signatures in the geological record: elevated concentrations of radionuclides from nuclear weapons testing, plasticizers in marine sediments, distinctive signatures in atmospheric carbon isotopes, and the mass extinction of species at rates that now approach those of the five great extinction events in Earth's history.

The Anthropocene concept is philosophically destabilising in several respects. It disrupts the long-standing distinction between "natural" and "human" history — between the slow deep time of geology and the fast, shallow time of recorded human civilisation. When human activity registers in the rock record, that distinction collapses. We are geological agents, whether we accept the responsibility this implies or not.

This raises profound questions about agency, causality, and moral responsibility. The "Anthropocene" as a concept tends to attribute the transformations of the Earth system to "humanity" as a collective actor. Critics — particularly within the framework of "Capitalocene" theory — argue that this framing obscures the differential responsibilities of particular economic systems, historical periods, and social classes. The per-capita emissions of a subsistence farmer in sub-Saharan Africa and a business executive in a wealthy country are not remotely comparable; bundling them as co-authors of the Anthropocene may naturalise an inequity that demands political analysis.

The ethical dimensions extend into the future. Climate change, biodiversity loss, and other Anthropocene processes will affect generations who did not cause them — and who live disproportionately in regions least responsible for the emissions that drive them. This creates obligations of intergenerational and international justice that existing political and legal frameworks are profoundly ill-equipped to address.

The Anthropocene confronts us with what the philosopher Timothy Morton calls the "hyperobject" — an entity of such vast temporal and spatial scale that no human perspective can fully apprehend it. How to think, feel, and act in relation to it may be the defining moral challenge of the century.`,
    wordCount: 365,
    readingTimeMin: 5,
    keyPhrases: [
      { phrase: 'Great Acceleration', tr: 'Büyük İvmelenme (1950 sonrası exponansiyel artış dönemi)' },
      { phrase: 'Capitalocene', tr: 'Kapitalosen (kapitalizmin ekolojik tahribatını vurgulayan kavram)' },
      { phrase: 'hyperobject', tr: 'hipernesne (kavranması güç devasa ölçekli varlık)' },
    ],
    comprehensionQs: [
      { question: 'What does the "Great Acceleration" refer to?', options: ['The period of the Industrial Revolution', 'The exponential rise in human impact on Earth from around 1950', 'The spread of the internet', 'The colonisation of other continents'], answerIndex: 1 },
      { question: 'What is the "Capitalocene" critique of the Anthropocene concept?', options: ['That human activity hasn\'t changed the Earth', 'That the Anthropocene concept incorrectly blames all of humanity equally, obscuring differential responsibilities', 'That capitalism has nothing to do with environmental change', 'That only corporations are responsible for climate change'], answerIndex: 1 },
      { question: 'What does philosopher Timothy Morton call the Anthropocene?', options: ['A geological age', 'A political problem', 'A hyperobject — too vast in scale for any human perspective to fully apprehend', 'A scientific theory without evidence'], answerIndex: 2 },
    ],
  },
];

let seeded = false;

async function ensureTextsSeeded() {
  if (seeded) return;
  const count = await prisma.readingText.count();
  if (count < READING_TEXTS.length) {
    for (const t of READING_TEXTS) {
      await prisma.readingText.upsert({
        where: { title: t.title },
        update: {},
        create: {
          title: t.title,
          level: t.level as any,
          category: t.category,
          text: t.text,
          wordCount: t.wordCount,
          readingTimeMin: t.readingTimeMin,
          keyPhrases: t.keyPhrases,
          comprehensionQs: t.comprehensionQs,
        },
      });
    }
  }
  seeded = true;
}

// GET /reading/texts?level=B1&category=article
router.get('/texts', async (req: AuthRequest, res) => {
  try {
    await ensureTextsSeeded();
    const { level, category } = req.query as { level?: string; category?: string };
    const userId = req.userId;

    const where: any = { isActive: true };
    if (level) where.level = level;
    if (category) where.category = category;

    const texts = await prisma.readingText.findMany({
      where,
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        level: true,
        category: true,
        wordCount: true,
        readingTimeMin: true,
        userProgress: { where: { userId }, select: { completed: true, score: true } },
      },
    });

    const result = texts.map((t) => ({
      ...t,
      completed: t.userProgress[0]?.completed ?? false,
      score: t.userProgress[0]?.score ?? null,
      userProgress: undefined,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch texts' });
  }
});

// GET /reading/texts/:id
router.get('/texts/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const text = await prisma.readingText.findUnique({
      where: { id: req.params.id },
      include: { userProgress: { where: { userId } } },
    });
    if (!text) return res.status(404).json({ error: 'Not found' });

    const { userProgress, ...rest } = text;
    res.json({
      ...rest,
      completed: userProgress[0]?.completed ?? false,
      score: userProgress[0]?.score ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch text' });
  }
});

// POST /reading/texts/:id/complete  { score?: number }
router.post('/texts/:id/complete', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { score } = req.body as { score?: number };
    const XP_REWARD = 15;

    await prisma.$transaction([
      prisma.userTextProgress.upsert({
        where: { userId_textId: { userId, textId: req.params.id } },
        update: { completed: true, score: score ?? null, readAt: new Date() },
        create: { userId, textId: req.params.id, completed: true, score: score ?? null },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: XP_REWARD } },
      }),
    ]);

    res.json({ success: true, xpEarned: XP_REWARD });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark complete' });
  }
});

export default router;
