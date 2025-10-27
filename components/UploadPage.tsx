import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ Added for navigation

// --- Service Logic (from pdf-analyzer.ts) ---
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

const apiKey =
  typeof import.meta.env !== "undefined" && import.meta.env.VITE_GEMINI_API_KEY
    ? import.meta.env.VITE_GEMINI_API_KEY
    : "";

type ExtractedQuestion = {
  question_number: number;
  question_text: string;
  question_type: "MCQ" | "Numeric";
  options: string[] | null;
  correct_answer_text: string;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const sendPDFToGemini = async (
  file: File
): Promise<ExtractedQuestion[] | string> => {
  const base64Data = await fileToBase64(file);

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Analyze the attached PDF document.
            Extract ALL questions from the document, including multiple-choice and numeric-answer questions.
            Return the result as a JSON array, where each object follows this format:
            {
              "question_number": 1,
              "question_text": "The full text of the question...",
              "question_type": "MCQ" or "Numeric",
              "options": ["(a) Option A", "(b) Option B", ...],
              "correct_answer_text": "The correct answer as written"
            }
            If no questions are found, respond with an empty array.`,
          },
          {
            inline_data: {
              mime_type: "application/pdf",
              data: base64Data.split(",")[1],
            },
          },
        ],
      },
    ],
  };

  const response = await axios.post(`${GEMINI_API_URL}?key=${apiKey}`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  const textOutput =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const cleanedText = textOutput.replace(/^```json\n|```$/g, "").trim();
    const questions = JSON.parse(cleanedText);
    console.log("Successfully parsed questions from PDF:", questions);
    if (Array.isArray(questions)) return questions;
  } catch (error) {
    console.warn("Gemini output not valid JSON, returning raw text.", error);
    console.log("Raw output from Gemini:", textOutput);
  }

  return textOutput;
};

export const generateExplanation = async (question: {
  question_text: string;
  correct_answer_text: string;
}) => {
  const TEXT_GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

  const prompt = `Explain clearly and concisely why "${question.correct_answer_text}" is the correct answer 
  for the following question: "${question.question_text}". Use simple terms and short paragraphs.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const response = await axios.post(`${TEXT_GEMINI_API_URL}?key=${apiKey}`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  const explanation =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No explanation available.";
  return explanation.trim();
};

// --- Error Modal ---
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
      <h3 className="text-lg font-bold text-red-600 mb-4">Error</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Close
      </button>
    </div>
  </div>
);

// --- Main Upload Page ---
const UploadPage = () => {
  const navigate = useNavigate(); // ✅ Hook for redirection

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a valid PDF file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");

    try {
      const response = await sendPDFToGemini(file);

      if (typeof response === "string") {
        setResult(response);
      } else {
        setResult(JSON.stringify(response, null, 2));
        // ✅ Automatically redirect to QuizPage with data
        navigate("/quiz", { state: { questions: response } });
      }
    } catch (err) {
      console.error(err);
      setError("Error analyzing the PDF. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen bg-gray-50 font-sans">
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          PDF Question Extractor
        </h1>

        <div className="mb-4">
          <label className="block w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <span className="text-gray-500">
              {file ? file.name : "Click to select a PDF file"}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing...
            </div>
          ) : (
            "Upload & Analyze"
          )}
        </button>

        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              Results:
            </h2>
            <pre className="w-full max-w-2xl p-4 border rounded-lg bg-gray-100 text-left whitespace-pre-wrap text-sm overflow-x-auto">
              <code>{result}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
