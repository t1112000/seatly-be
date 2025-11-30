import { customAlphabet } from 'nanoid';
import { DifficultyType } from '../enums/difficulty.enum';

export const genRandomNumeric = (length?: number) => {
  const otp = Math.random()
    .toFixed(length || 6)
    .substring(2);

  return otp;
};
export function generateIdForSystem(prefix: string): string {
  try {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const nanoid = customAlphabet(alphabet, 9);
    return `${prefix}-${nanoid()}`;
  } catch (error) {
    throw error;
  }
}

export const getRewardGold = (difficulty: DifficultyType) => {
  switch (difficulty) {
    case DifficultyType.EASY:
      return 0;
    case DifficultyType.MEDIUM:
      return 1;
    case DifficultyType.HARD:
      return 2;
  }
};

export const getRewardExp = (difficulty: DifficultyType) => {
  switch (difficulty) {
    case DifficultyType.EASY:
      return 3;
    case DifficultyType.MEDIUM:
      return 5;
    case DifficultyType.HARD:
      return 10;
  }
};

export const getTimeLimitSeconds = (difficulty: DifficultyType) => {
  switch (difficulty) {
    case DifficultyType.EASY:
      return 30;
    case DifficultyType.MEDIUM:
      return 48;
    case DifficultyType.HARD:
      return 60;
  }
};
