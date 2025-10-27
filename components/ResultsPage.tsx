import React, { useState, useCallback } from "react";
import axios from "axios";

// --- Gemini AI Service ---
const TEXT_GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

const apiKey =
  typeof import.meta.env !== "undefined" && import.meta.env.VITE_GEMINI_API_KEY
    ? import.meta.env.VITE_GEMINI_API_KEY
    : "";

/**
 * Generate AI explanation for a question
 */
export const generateExplanation = async (question: {
  question_text: string;
  correct_answer_text: string;
}) => {
  const prompt = `Explain clearly and concisely why "${question.correct_answer_text}" is the correct answer 
  for the following question: "${question.question_text}". 
  Use simple terms and short paragraphs.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const response = await axios.post(
    `${TEXT_GEMINI_API_URL}?key=${apiKey}`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  const explanation =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No explanation available.";
  return explanation.trim();
};

// --- Stubbed UI Icons (replace with shadcn/lucide if needed) ---
const CheckIcon = ({ className = "" }) => (
  <svg
    className={`h-5 w-5 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const XIcon = ({ className = "" }) => (
  <svg
    className={`h-5 w-5 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

// --- Results Page ---
interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer_text: string;
}

interface QuizResult {
  score: number;
  correctAnswers: number;
  userAnswers: { questionId: number; answer: string }[];
}

interface ResultsPageProps {
  result: QuizResult;
  questions: Question[];
  onRetry: () => void;
  onNewQuiz: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  questions,
  onRetry,
  onNewQuiz,
}) => {
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleGetExplanation = useCallback(async (question: Question) => {
    if (explanations[question.id]) return;
    setLoadingId(question.id);
    try {
      const explanation = await generateExplanation(question);
      setExplanations((prev) => ({ ...prev, [question.id]: explanation }));
    } catch (err) {
      console.error(err);
      setExplanations((prev) => ({
        ...prev,
        [question.id]: "Error generating explanation.",
      }));
    } finally {
      setLoadingId(null);
    }
  }, [explanations]);

  if (!result || !questions.length)
    return (
      <div className="text-center p-10 text-white">
        Loading results...
      </div>
    );

  const scoreColor =
    result.score >= 80
      ? "text-green-400"
      : result.score >= 50
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
        <p className={`text-5xl font-extrabold ${scoreColor}`}>
          {result.score.toFixed(0)}%
        </p>
        <p className="text-gray-400 mt-2">
          You answered {result.correctAnswers} / {questions.length} correctly.
        </p>
      </div>

      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
        {questions.map((q) => {
          const userAnswer = result.userAnswers.find(
            (ua) => ua.questionId === q.id
          )?.answer;
          const isCorrect = userAnswer === q.correct_answer_text;

          return (
            <div
              key={q.id}
              className="p-4 bg-slate-800 rounded-lg border border-slate-700"
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold text-slate-200">
                  {q.id}. {q.question_text}
                </p>
                {isCorrect ? (
                  <CheckIcon className="text-green-400" />
                ) : (
                  <XIcon className="text-red-400" />
                )}
              </div>

              <p
                className={`text-sm mt-2 ${
                  isCorrect ? "text-green-400" : "text-red-400"
                }`}
              >
                Your answer: {userAnswer || "Not answered"}
              </p>
              {!isCorrect && (
                <p className="text-sm text-green-400">
                  Correct: {q.correct_answer_text}
                </p>
              )}

              {explanations[q.id] ? (
                <p className="mt-2 text-sm text-slate-400 bg-slate-700/50 p-2 rounded">
                  {explanations[q.id]}
                </p>
              ) : (
                <button
                  onClick={() => handleGetExplanation(q)}
                  disabled={loadingId === q.id}
                  className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  {loadingId === q.id
                    ? "Getting explanation..."
                    : "Get AI Explanation"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-full font-bold transition"
        >
          Retry Quiz
        </button>
        <button
          onClick={onNewQuiz}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-bold transition"
        >
          Upload New Quiz
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
