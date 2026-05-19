export interface SolutionStep {
  index: number;
  title: string;
  explanation: string;
  formula?: string;
  isAnswer: boolean;
}

export interface HistoryItem {
  id: string; // UUID
  deviceId: string; // UUID
  latex: string;
  solutionSteps: SolutionStep[];
  language: 'vi' | 'en';
  createdAt: string; // ISO 8601
  isBookmarked: boolean;
}
