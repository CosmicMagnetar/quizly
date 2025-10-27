
export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
}

export interface QuizResult {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  userAnswers: { questionId: string, answer: string }[];
}

export enum Page {
  HOME,
  UPLOAD,
  QUIZ,
  RESULTS,
}
