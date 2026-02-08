
export interface Word {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  mnemonic?: string;
  category: string;
  level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'Other';
  masteryLevel: number; // 0 to 5
  nextReviewDate: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed'; // 新增状态属性
}

export type AppMode = 'list' | 'review' | 'stats';

export interface AIWordSuggestion {
  reading: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  mnemonic: string;
}
