export type SourceType = "JSON" | "XLSX";
export type QuizMode = "RANDOM" | "ALL";

export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
  correctAnswerId: string;
  explanation?: string;
}

export interface QuizCategory {
  id: string;
  name: string;
  sourceFileName: string;
  sourceType: SourceType;
  importedAt: string;
  questions: QuizQuestion[];
}

export interface QuizResultAnswer {
  questionId: string;
  selectedAnswerId?: string;
}

export interface QuizResult {
  categoryId: string;
  categoryName: string;
  mode: QuizMode;
  answers: QuizResultAnswer[];
  finishedAt: string;
}
