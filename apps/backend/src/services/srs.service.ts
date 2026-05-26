export interface SRSResult {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: Date;
  status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
}

export class SrsService {
  calculate(
    quality: 0 | 1 | 2 | 3,
    interval: number,
    easeFactor: number,
    repetitions: number
  ): SRSResult {
    let newEaseFactor =
      easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    let newInterval: number;
    let newRepetitions = repetitions;

    if (quality === 0) {
      newInterval = 1;
      newRepetitions = 0;
    } else if (quality === 1) {
      newInterval = Math.max(1, Math.round(interval * 0.5));
      newRepetitions = Math.max(0, repetitions - 1);
    } else {
      newRepetitions = repetitions + 1;
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 3;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    let status: SRSResult['status'];
    if (newRepetitions === 0) {
      status = 'NEW';
    } else if (newRepetitions < 3) {
      status = 'LEARNING';
    } else if (newInterval < 21) {
      status = 'REVIEW';
    } else {
      status = 'MASTERED';
    }

    return {
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
      nextReview,
      status,
    };
  }
}

export const srsService = new SrsService();
