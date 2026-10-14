const path = require("path");
const dotenv = require("dotenv");

// Load server/.env explicitly, regardless of the terminal's working directory.
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const { GoogleGenAI } = require("@google/genai");

const MODEL = "gemini-3.5-flash";

function createAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    console.error(
      "Gemini configuration error: GEMINI_API_KEY is missing from server/.env.",
    );
    return null;
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

const ai = createAIClient();

async function generateText(prompt) {
  if (!ai) {
    throw new Error("AI service is not configured.");
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A valid prompt is required.");
  }

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 500,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const text = result.text?.trim();

    if (!text) {
      throw new Error("The AI returned an empty response.");
    }

    return text;
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    throw new Error("AI generation is temporarily unavailable.");
  }
}

module.exports = { generateText };
