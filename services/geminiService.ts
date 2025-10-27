import axios from "axios";

// Type declarations for TypeScript environment
declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Use gemini-2.5-flash-preview-09-2025 for document/image analysis
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

// Per instructions, leave apiKey as "" to allow the environment to inject it.
const apiKey = "";
// API key validation is removed as it's handled by the environment.

/**
 * Defines the structure for an extracted question.
 */
export interface ExtractedQuestion {
  question_number: number;
  question_text: string;
  question_type: "MCQ" | "Numeric";
  options: string[] | null;
  correct_answer_text: string;
}

/**
 * Sends a PDF file to Gemini to extract all questions (MCQ and Numeric).
 * Logs the extracted data to the console.
 * @param file The PDF file to analyze.
 * @returns A promise that resolves to an array of ExtractedQuestion objects or raw text.
 */
export const sendPDFToGemini = async (file: File): Promise<ExtractedQuestion[] | string> => {
  const base64Data = await fileToBase64(file);

  const payload = {
    contents: [
      {
        parts: [
          {
            // Updated prompt to get ALL questions (MCQ and Numeric)
            text: `Analyze the attached PDF document.
            Extract ALL questions from the document, including multiple-choice and numeric-answer questions.
            Return the result as a JSON array, where each object follows this format:
            {
              "question_number": 1, // The question number (e.g., 1, 2, 3)
              "question_text": "The full text of the question...",
              "question_type": "MCQ" or "Numeric",
              "options": ["(a) Option A text", "(b) Option B text", ...], // Array of strings for MCQ, null or empty array for Numeric
              "correct_answer_text": "The correct answer as written in the document (e.g., '(b) and (c)', '3', '13')"
            }
            If no questions are found, respond with an empty array.`,
          },
          {
            inline_data: {
              mime_type: "application/pdf",
              data: base64Data.split(",")[1], // remove "data:application/pdf;base64,"
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
    // Clean up markdown ```json ... ``` wrapper if present
    const cleanedText = textOutput.replace(/^```json\n|```$/g, "").trim();
    
    // Attempt to parse JSON from Gemini
    const questions = JSON.parse(cleanedText);
    
    // Log the data as requested by the user
    console.log("Successfully parsed questions from PDF:", questions); 
    
    if (Array.isArray(questions)) return questions;
  } catch (error) {
    console.warn("Gemini output not valid JSON, returning raw text.", error);
    // Log the raw data as requested
    console.log("Raw output from Gemini:", textOutput); 
  }

  return textOutput;
};

/**
 * Generates an AI explanation for a given question.
 * @param question An object containing the question text and correct answer.
 * @returns A promise that resolves to the AI-generated explanation.
 */
export const generateExplanation = async (question: {
  question_text: string;
  correct_answer_text: string; // Updated to match the new structure
}) => {
  // Use gemini-2.5-flash-preview-09-2025 for text generation
  const TEXT_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

  const prompt = `Explain clearly and concisely why "${question.correct_answer_text}" is the correct answer 
  for the following question: "${question.question_text}". 
  Use simple terms and short paragraphs.`;

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

/**
 * Helper function to convert a File object to a base64 string.
 * @param file The file to convert.
 * @returns A promise that resolves to the base64-encoded string.
 */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
