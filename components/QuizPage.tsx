import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

/* ===============================================
   🔹 Math Helpers: Detect, Normalize & Render
   =============================================== */

const normalizeMath = (text: string) => {
  if (!text) return text;
  if (text.includes("$")) return text;
  const mathPattern =
    /\\(sqrt|frac|cdot|times|pm|le|ge|neq|sum|int|log|sin|cos|tan|pi|alpha|beta|gamma)|[a-zA-Z0-9]*\^[{(]?[a-zA-Z0-9+\\\-]+[})]?/;
  if (mathPattern.test(text)) return `$${text}$`;
  return text;
};

const renderMathText = (text: string) => {
  if (!text) return null;
  const blocks = text.split(/(\$\$[^$]+\$\$)/);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("$$") && block.endsWith("$$")) {
          return <BlockMath key={i}>{block.slice(2, -2).trim()}</BlockMath>;
        }
        const inlines = block.split(/(\$[^$]+\$)/);
        return inlines.map((part, j) => {
          if (part.startsWith("$") && part.endsWith("$")) {
            return <InlineMath key={`${i}-${j}`}>{part.slice(1, -1).trim()}</InlineMath>;
          }
          return <span key={`${i}-${j}`}>{part}</span>;
        });
      })}
    </>
  );
};

/* ===============================================
   🔹 Main Quiz Component
   =============================================== */

const QuizPage = () => {
  const location = useLocation();
  const questions = location.state?.questions || [];

  const [showAnswers, setShowAnswers] = useState(false);
  const [selected, setSelected] = useState<{ [key: number]: any }>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  /* Timer */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !showAnswers) {
      interval = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, showAnswers]);

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  /* ===============================================
     🔹 Handle Selections
     =============================================== */

  const handleSelect = (qIndex: number, option: string) => {
    if (showAnswers) return;

    const correctAnswers =
      Array.isArray(questions[qIndex].correct_answer_text)
        ? questions[qIndex].correct_answer_text
        : String(questions[qIndex].correct_answer_text)
            .split(",")
            .map((a) => a.trim());

    // Multiple correct answers → checkbox
    if (correctAnswers.length > 1) {
      const prev = selected[qIndex] || [];
      const updated = prev.includes(option)
        ? prev.filter((o: string) => o !== option)
        : [...prev, option];
      setSelected({ ...selected, [qIndex]: updated });
    } else {
      setSelected({ ...selected, [qIndex]: option });
    }
  };

  const handleTextChange = (qIndex: number, value: string) => {
    if (!showAnswers) setSelected({ ...selected, [qIndex]: value });
  };

  /* ===============================================
     🔹 Calculate Score
     =============================================== */

  const calculateScore = () =>
    questions.reduce((score, q, i) => {
      const correctAnswers =
        Array.isArray(q.correct_answer_text)
          ? q.correct_answer_text
          : String(q.correct_answer_text)
              .split(",")
              .map((a) => a.trim().toLowerCase());

      const userAnswer = selected[i];

      if (Array.isArray(userAnswer)) {
        const isAllCorrect =
          userAnswer.length === correctAnswers.length &&
          userAnswer.every((ans) => correctAnswers.includes(ans.trim().toLowerCase()));
        return score + (isAllCorrect ? 1 : 0);
      }

      if (typeof userAnswer === "string") {
        return score + (correctAnswers.includes(userAnswer.trim().toLowerCase()) ? 1 : 0);
      }

      return score;
    }, 0);

  const handleSubmit = () => {
    setShowAnswers(true);
    setIsTimerRunning(false);
  };

  /* ===============================================
     🔹 UI
     =============================================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="sticky top-4 z-10 bg-white shadow-lg rounded-2xl p-5 mb-6 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quiz Time</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                {questions.length} questions • Mixed types
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-indigo-600">{formatTime(timeElapsed)}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {Object.keys(selected).length}
                  <span className="text-slate-400">/{questions.length}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Answered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <p className="text-2xl text-slate-700 font-semibold mb-2">No questions found</p>
            <p className="text-slate-500">Please upload a PDF to generate quiz questions.</p>
          </div>
        ) : (
          <>
            {/* Questions */}
            <div className="space-y-6 mb-8">
              {questions.map((q, index) => {
                const correctAnswers =
                  Array.isArray(q.correct_answer_text)
                    ? q.correct_answer_text
                    : String(q.correct_answer_text)
                        .split(",")
                        .map((a) => a.trim());

                const isMultipleCorrect = correctAnswers.length > 1;
                const hasOptions = q.options && q.options.length > 0;
                const userAnswer = selected[index];

                return (
                  <div key={index} className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <div className="text-lg text-slate-900 font-medium leading-relaxed">
                        {renderMathText(normalizeMath(q.question_text))}
                      </div>
                    </div>

                    {/* Options or Text Input */}
                    {hasOptions ? (
                      <div className="space-y-3">
                        {q.options.map((opt: string, i: number) => {
                          const isSelected = Array.isArray(userAnswer)
                            ? userAnswer.includes(opt)
                            : userAnswer === opt;
                          const isCorrect = correctAnswers.includes(opt);

                          return (
                            <button
                              key={i}
                              onClick={() => handleSelect(index, opt)}
                              disabled={showAnswers}
                              className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all duration-200 ${
                                showAnswers
                                  ? isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : isSelected
                                    ? "border-red-500 bg-red-50"
                                    : "border-slate-200 bg-slate-50/50 opacity-60"
                                  : isSelected
                                  ? "border-indigo-600 bg-indigo-50 shadow-md scale-[1.01]"
                                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type={isMultipleCorrect ? "checkbox" : "radio"}
                                  checked={isSelected}
                                  readOnly
                                  className="mt-1 accent-indigo-600"
                                />
                                <div className="flex-1">{renderMathText(normalizeMath(opt))}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={userAnswer || ""}
                          onChange={(e) => handleTextChange(index, e.target.value)}
                          disabled={showAnswers}
                          placeholder="Type your answer here..."
                          className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    )}

                    {/* Correct Answer Display */}
                    {showAnswers && (
                      <div className="mt-4 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
                        <p className="font-semibold text-indigo-900 mb-1">Correct Answer:</p>
                        <div className="text-slate-800 leading-relaxed">
                          {correctAnswers.map((a, idx) => (
                            <div key={idx}>{renderMathText(normalizeMath(a))}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Buttons */}
            {!showAnswers ? (
              <div className="flex justify-center gap-4 mb-10">
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(selected).length === 0}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  Submit Quiz
                </button>
                <button
                  onClick={() => setSelected({})}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-10 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
                >
                  Clear All
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-10 text-center text-white shadow-xl mb-10">
                <h2 className="text-3xl font-bold mb-4">Quiz Complete 🎉</h2>
                <div className="text-6xl font-bold mb-2">
                  {calculateScore()}/{questions.length}
                </div>
                <p className="text-2xl mb-2 font-semibold">
                  {Math.round((calculateScore() / questions.length) * 100)}% Correct
                </p>
                <p className="text-lg opacity-90 mb-6">Time: {formatTime(timeElapsed)}</p>
                <button
                  onClick={() => {
                    setShowAnswers(false);
                    setSelected({});
                    setTimeElapsed(0);
                    setIsTimerRunning(true);
                  }}
                  className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg active:scale-95"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
