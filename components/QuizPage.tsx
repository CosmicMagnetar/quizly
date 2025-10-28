import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

/* ===============================================
   🔹 Math Helpers
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
   🔹 Quiz Component
   =============================================== */
const QuizPage = () => {
  const location = useLocation();
  const questions = location.state?.questions || [];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<{ [key: number]: any }>({});
  const [marked, setMarked] = useState<{ [key: number]: boolean }>({});
  const [showAnswers, setShowAnswers] = useState(false);
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

  const currentQuestion = questions[currentQ];
  if (!currentQuestion) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-700">
        <h1 className="text-2xl font-semibold mb-2">No Questions Found</h1>
        <p>Upload a quiz to start.</p>
      </div>
    );
  }

  /* ===============================================
     🔹 Selection Logic
     =============================================== */
  const handleSelect = (option: string) => {
    const q = currentQuestion;
    const correctAnswers = Array.isArray(q.correct_answer_text)
      ? q.correct_answer_text
      : String(q.correct_answer_text).split(",").map((a) => a.trim());

    if (correctAnswers.length > 1) {
      const prev = selected[currentQ] || [];
      const updated = prev.includes(option)
        ? prev.filter((o: string) => o !== option)
        : [...prev, option];
      setSelected({ ...selected, [currentQ]: updated });
    } else {
      setSelected({ ...selected, [currentQ]: option });
    }
  };

  const handleTextChange = (value: string) => {
    setSelected({ ...selected, [currentQ]: value });
  };

  const markForReview = () => {
    setMarked({ ...marked, [currentQ]: !marked[currentQ] });
  };

  const calculateScore = () =>
    questions.reduce((score, q, i) => {
      const correctAnswers = Array.isArray(q.correct_answer_text)
        ? q.correct_answer_text.map((a) => a.trim().toLowerCase())
        : String(q.correct_answer_text).split(",").map((a) => a.trim().toLowerCase());

      const userAnswer = selected[i];
      if (!userAnswer) return score;

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

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) setCurrentQ((prev) => prev + 1);
  };
  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
  };

  /* ===============================================
     🔹 Current Question Rendering
     =============================================== */
  const correctAnswers = Array.isArray(currentQuestion.correct_answer_text)
    ? currentQuestion.correct_answer_text
    : String(currentQuestion.correct_answer_text).split(",").map((a) => a.trim());
  const isMultipleCorrect = correctAnswers.length > 1;
  const hasOptions = currentQuestion.options && currentQuestion.options.length > 0;
  const userAnswer = selected[currentQ];

  const countMarked = Object.values(marked).filter(Boolean).length;

  /* ===============================================
     🔹 Helper: Question Status Color
     =============================================== */
  const getStatusColor = (index: number) => {
    const answered = selected[index];
    const isMarked = marked[index];

    if (isMarked && answered) return "bg-gradient-to-br from-purple-500 to-green-500 text-white"; // both
    if (isMarked) return "bg-purple-500 text-white"; // marked only
    if (answered) return "bg-green-500 text-white"; // answered
    return "bg-red-500 text-white"; // not answered
  };

  /* ===============================================
     🔹 UI
     =============================================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-6">
      {/* Header */}
      <div className="sticky top-4 z-10 bg-white rounded-2xl shadow-md p-5 mb-6 border flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maths Quiz</h1>
          <p className="text-sm text-slate-600 mt-1">
            Question {currentQ + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-indigo-600">{formatTime(timeElapsed)}</div>
            <div className="text-xs text-slate-500">Timer</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">
              {Object.keys(selected).length}
              <span className="text-slate-400">/{questions.length}</span>
            </div>
            <div className="text-xs text-slate-500">Answered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{countMarked}</div>
            <div className="text-xs text-slate-500">Marked for Review</div>
          </div>
        </div>
      </div>

      {/* Navigation Bar (Question Indicators) */}
<div className="sticky top-28 z-10 bg-slate-100/90 backdrop-blur-md rounded-xl shadow-md p-4 mb-6 border border-slate-300">
  <div className="flex flex-wrap justify-center gap-3">
    {questions.map((_, i) => {
      const answered = selected[i];
      const isMarked = marked[i];
      const isCurrent = currentQ === i;

      // Determine color state
      let circleClass = "bg-white border-2 border-slate-400 text-slate-600"; // not seen
      if (answered && isMarked)
        circleClass = "bg-green-500 ring-4 ring-purple-500 text-white"; // answered + marked
      else if (isMarked) circleClass = "bg-purple-500 text-white"; // only marked
      else if (answered) circleClass = "bg-green-500 text-white"; // only answered
      else circleClass = "bg-red-500 text-white"; // not answered

      return (
        <button
          key={i}
          onClick={() => setCurrentQ(i)}
          className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition-all duration-200 ${circleClass} ${
            isCurrent ? "ring-4 ring-indigo-300 scale-110" : ""
          }`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>

  {/* Legend */}
  <div className="flex justify-center flex-wrap gap-6 mt-3 text-sm text-slate-700 font-medium">
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 bg-green-500 rounded-full"></span> Answered
    </div>
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 bg-red-500 rounded-full"></span> Not Answered
    </div>
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 bg-purple-500 rounded-full"></span> Marked for Review
    </div>
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 bg-green-500 ring-4 ring-purple-500 rounded-full"></span> Marked + Answered
    </div>
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 bg-white border border-slate-400 rounded-full"></span> Not Seen
    </div>
  </div>
</div>


      {/* Current Question */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-9 h-9 ${
              marked[currentQ] ? "bg-purple-500" : "bg-indigo-600"
            } text-white rounded-xl flex items-center justify-center font-bold shadow-sm`}
          >
            {currentQ + 1}
          </div>
          <div className="text-lg text-slate-900 font-medium leading-relaxed">
            {renderMathText(normalizeMath(currentQuestion.question_text))}
          </div>
        </div>

        {/* Options / Input */}
        {hasOptions ? (
          <div className="space-y-3">
            {currentQuestion.options.map((opt: string, i: number) => {
              const isSelected = Array.isArray(userAnswer)
                ? userAnswer.includes(opt)
                : userAnswer === opt;
              const isCorrect = correctAnswers.includes(opt);
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  disabled={showAnswers}
                  className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all duration-200 ${
                    showAnswers
                      ? isCorrect
                        ? "border-green-500 bg-green-50"
                        : isSelected
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 opacity-60"
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
          <input
            type="text"
            value={userAnswer || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            disabled={showAnswers}
            placeholder="Type your answer here..."
            className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all mt-2"
          />
        )}

        {showAnswers && (
          <div className="mt-4 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
            <p className="font-semibold text-indigo-900 mb-1">Correct Answer:</p>
            {correctAnswers.map((a, idx) => (
              <div key={idx}>{renderMathText(normalizeMath(a))}</div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {!showAnswers ? (
        <div className="flex justify-between items-center max-w-4xl mx-auto mt-8">
          <button
            onClick={prevQuestion}
            disabled={currentQ === 0}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-semibold shadow-md disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex gap-4">
            <button
              onClick={markForReview}
              className={`px-6 py-3 rounded-xl font-semibold shadow-md ${
                marked[currentQ]
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              {marked[currentQ] ? "Unmark Review" : "Mark for Review"}
            </button>

            {currentQ < questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-10 text-center text-white shadow-xl mt-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
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
              setMarked({});
              setCurrentQ(0);
              setTimeElapsed(0);
              setIsTimerRunning(true);
            }}
            className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
