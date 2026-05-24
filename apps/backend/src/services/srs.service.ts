// Spaced Repetition System (SM-2 algorithm)
export class SrsService {
  updateSRS(quality: 0 | 1 | 2 | 3, interval: number, easeFactor: number, repetitions: number) {
    // quality: 0=Again, 1=Hard, 2=Good, 3=Easy
    // SM-2 algorithm implementation
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    let newInterval: number;
    let newRepetitions = repetitions;

    if (quality < 3) {
      newInterval = 1;
      newRepetitions = 0;
    } else {
      newRepetitions++;
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 3;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    return {
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
    };
  }
}

export const srsService = new SrsService();
