import Anthropic from '@anthropic-ai/sdk';

const SONNET = 'claude-sonnet-4-6';
const HAIKU = 'claude-haiku-4-5-20251001';

export class ClaudeService {
  private getClient(apiKey: string) {
    return new Anthropic({ apiKey });
  }

  async chat(apiKey: string, messages: Anthropic.MessageParam[], system: string): Promise<Anthropic.Message> {
    const client = this.getClient(apiKey);
    return client.messages.create({
      model: SONNET,
      max_tokens: 1024,
      system,
      messages,
    });
  }

  chatStream(apiKey: string, messages: Anthropic.MessageParam[], system: string) {
    const client = this.getClient(apiKey);
    return client.messages.stream({
      model: SONNET,
      max_tokens: 1024,
      system,
      messages,
    });
  }

  async analyzeContent(apiKey: string, text: string, level: string): Promise<{
    vocabulary: { word: string; definition: string; definitionTr: string; level: string; context: string }[];
    phrases: { phrase: string; meaning: string; meaningTr: string; example: string }[];
    grammarNotes: string[];
  }> {
    const client = this.getClient(apiKey);
    const resp = await client.messages.create({
      model: SONNET,
      max_tokens: 4096,
      system: 'You are an English language analysis tool. Return ONLY valid JSON, no other text.',
      messages: [{
        role: 'user',
        content: `Analyze this English text for a ${level} CEFR learner (native language: Turkish).
Text: ${text.slice(0, 3000)}

Return JSON only:
{
  "vocabulary": [{"word": "...", "definition": "...", "definitionTr": "...", "level": "B1", "context": "..."}],
  "phrases": [{"phrase": "...", "meaning": "...", "meaningTr": "...", "example": "..."}],
  "grammarNotes": ["..."]
}
Pick only words at or slightly above ${level} level. Maximum 20 vocabulary items, 10 phrases.`,
      }],
    });
    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON from Claude');
    return JSON.parse(match[0]);
  }

  async evaluatePlacement(
    apiKey: string,
    answers: { questionId: number; answer: string }[],
    questions: { id: number; question: string; correctAnswer: string; level: string }[]
  ): Promise<{ level: string; explanation: string; score: number }> {
    const client = this.getClient(apiKey);
    const summary = questions.map(q => {
      const a = answers.find(x => x.questionId === q.id);
      return `Q${q.id} [${q.level}]: ${q.question} | Correct: ${q.correctAnswer} | User: ${a?.answer ?? '(no answer)'}`;
    }).join('\n');
    const resp = await client.messages.create({
      model: HAIKU,
      max_tokens: 512,
      system: 'You are an English level evaluator. Return ONLY valid JSON.',
      messages: [{
        role: 'user',
        content: `Evaluate this placement test for a Turkish English learner.
${summary}

Return JSON only:
{"level": "B1", "explanation": "Short explanation in Turkish", "score": 14}
level must be one of: A1, A2, B1, B2, C1, C2
score is number of correct answers out of ${questions.length}`,
      }],
    });
    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON from Claude');
    return JSON.parse(match[0]);
  }

  async explainWord(apiKey: string, word: string, context: string, level: string): Promise<{
    definition: string;
    definitionTr: string;
    phonetic: string;
    examples: string[];
    synonyms: string[];
  }> {
    const client = this.getClient(apiKey);
    const resp = await client.messages.create({
      model: HAIKU,
      max_tokens: 512,
      system: 'You are an English dictionary. Return ONLY valid JSON.',
      messages: [{
        role: 'user',
        content: `Explain the word "${word}" for a ${level} Turkish learner.
Context: "${context}"

Return JSON only:
{"definition": "...", "definitionTr": "Türkçe tanım", "phonetic": "/wɜːrd/", "examples": ["...", "...", "..."], "synonyms": ["...", "..."]}`,
      }],
    });
    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON');
    return JSON.parse(match[0]);
  }

  async generateQuiz(
    apiKey: string,
    words: { word: string; definition: string; level: string }[],
    level: string,
    count = 10
  ): Promise<{
    questions: {
      id: number;
      type: 'multiple_choice' | 'fill_blank' | 'translation' | 'context_match';
      question: string;
      options?: string[];
      correctAnswer: string;
    }[];
  }> {
    const client = this.getClient(apiKey);
    const wordList = words.slice(0, 20).map(w => `${w.word}: ${w.definition}`).join('\n');
    const resp = await client.messages.create({
      model: HAIKU,
      max_tokens: 2048,
      system: 'You are a quiz generator. Return ONLY valid JSON.',
      messages: [{
        role: 'user',
        content: `Generate ${count} quiz questions for a ${level} English learner (Turkish native) from these words:
${wordList}

Return JSON only:
{"questions": [
  {"id": 1, "type": "multiple_choice", "question": "What does X mean?", "options": ["a","b","c","d"], "correctAnswer": "a"},
  {"id": 2, "type": "fill_blank", "question": "She ___ to the store.", "correctAnswer": "went"},
  {"id": 3, "type": "translation", "question": "Translate: ...", "correctAnswer": "..."},
  {"id": 4, "type": "context_match", "question": "Which sentence uses 'elaborate' correctly?", "options": ["She gave an elaborate explanation.", "She elaborate the plan.", "She was elaborate.", "She elaborate beautifully."], "correctAnswer": "She gave an elaborate explanation."}
]}
Mix all four types evenly. For context_match, always provide 4 complete sentences as options — only one must be grammatically and semantically correct.`,
      }],
    });
    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON');
    return JSON.parse(match[0]);
  }

  async sessionFeedback(
    apiKey: string,
    transcript: { role: string; content: string }[],
    level: string
  ): Promise<{
    fluencyScore: number;
    grammarMistakes: string[];
    newVocabulary: string[];
    suggestions: string;
  }> {
    const client = this.getClient(apiKey);
    const text = transcript
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');
    const resp = await client.messages.create({
      model: HAIKU,
      max_tokens: 1024,
      system: 'You are an English teacher giving feedback. Return ONLY valid JSON.',
      messages: [{
        role: 'user',
        content: `Review this ${level} learner's English from a role-play session:
${text.slice(0, 2000)}

Return JSON only:
{"fluencyScore": 7, "grammarMistakes": ["...", "..."], "newVocabulary": ["word1", "word2"], "suggestions": "Short suggestion in Turkish"}`,
      }],
    });
    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON');
    return JSON.parse(match[0]);
  }
}

export const claudeService = new ClaudeService();
