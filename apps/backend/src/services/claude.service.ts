import Anthropic from '@anthropic-ai/sdk';

export interface WordExplanation {
  word: string;
  definition: string;
  definitionTr: string;
  examples: string[];
  phonetic?: string;
  level: string;
}

export interface ContentAnalysis {
  title: string;
  words: Array<{
    word: string;
    definition: string;
    definitionTr: string;
    examples: string[];
    level: string;
    occurrences: number;
    contexts: string[];
  }>;
  phrases: Array<{
    phrase: string;
    meaning: string;
    meaningTr: string;
    examples: string[];
  }>;
}

export interface QuizQuestion {
  id: string;
  word: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export class ClaudeService {
  private getClient(apiKey: string) {
    return new Anthropic({ apiKey });
  }

  async explainWord(
    apiKey: string,
    word: string,
    context: string,
    level: string
  ): Promise<WordExplanation> {
    const client = this.getClient(apiKey);
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system:
        'You are an English vocabulary teacher. Respond ONLY with valid JSON, no markdown fences.',
      messages: [
        {
          role: 'user',
          content: `Explain the word "${word}" for a ${level} English learner.${
            context ? ` Context: "${context}"` : ''
          }\n\nRespond with JSON: {"word":string,"definition":string,"definitionTr":string,"examples":string[],"phonetic":string,"level":string}`,
        },
      ],
    });
    const text = (resp.content[0] as { text: string }).text.trim();
    return JSON.parse(text) as WordExplanation;
  }

  async roleplayChatStream(
    apiKey: string,
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const client = this.getClient(apiKey);
    let full = '';
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        full += event.delta.text;
        onChunk(event.delta.text);
      }
    }
    return full;
  }

  async roleplayFeedback(
    apiKey: string,
    messages: Array<{ role: string; content: string }>,
    sceneName: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`)
      .join('\n');
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'You are an English teacher giving feedback on a roleplay conversation. Be encouraging, specific and constructive. Write in Turkish.',
      messages: [
        {
          role: 'user',
          content: `Scene: ${sceneName}\n\nConversation:\n${transcript}\n\nProvide detailed feedback on: grammar, vocabulary, naturalness, and suggestions for improvement.`,
        },
      ],
    });
    return (resp.content[0] as { text: string }).text.trim();
  }

  async analyzeContent(
    apiKey: string,
    text: string,
    level: string
  ): Promise<ContentAnalysis> {
    const client = this.getClient(apiKey);
    const excerpt = text.slice(0, 6000);
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system:
        'You are an English content analyzer for language learners. Respond ONLY with valid JSON, no markdown fences.',
      messages: [
        {
          role: 'user',
          content: `Analyze this English content for a ${level} learner. Extract a title (infer from content), important vocabulary words with definitions (in English and Turkish), and useful phrases.\n\nContent:\n${excerpt}\n\nRespond with JSON:\n{"title":string,"words":[{"word":string,"definition":string,"definitionTr":string,"examples":string[],"level":string,"occurrences":number,"contexts":string[]}],"phrases":[{"phrase":string,"meaning":string,"meaningTr":string,"examples":string[]}]}\n\nInclude 10-20 words and 5-10 phrases. Only include words that would genuinely help a ${level} learner.`,
        },
      ],
    });
    const txt = (resp.content[0] as { text: string }).text.trim();
    return JSON.parse(txt) as ContentAnalysis;
  }

  async generateQuiz(
    apiKey: string,
    words: Array<{ word: string; definition: string; level: string }>,
    count: number
  ): Promise<QuizQuestion[]> {
    const client = this.getClient(apiKey);
    const wordList = words
      .slice(0, count)
      .map((w) => `${w.word}: ${w.definition}`)
      .join('\n');
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system:
        'You are an English quiz generator. Respond ONLY with valid JSON, no markdown fences.',
      messages: [
        {
          role: 'user',
          content: `Generate ${count} multiple-choice quiz questions for these English words:\n${wordList}\n\nEach question tests understanding of the word meaning. Provide 4 options, with one correct answer.\n\nRespond with JSON array: [{"id":string,"word":string,"question":string,"options":string[4],"correctIndex":number}]`,
        },
      ],
    });
    const txt = (resp.content[0] as { text: string }).text.trim();
    return JSON.parse(txt) as QuizQuestion[];
  }
}

export const claudeService = new ClaudeService();
