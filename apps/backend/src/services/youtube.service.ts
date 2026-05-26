import { YoutubeTranscript } from 'youtube-transcript';

export class YoutubeService {
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async getTranscript(url: string): Promise<string> {
    const videoId = this.extractVideoId(url);
    if (!videoId) throw new Error('Geçersiz YouTube URL');

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    return transcript.map(t => t.text).join(' ');
  }
}

export const youtubeService = new YoutubeService();
