const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.6-flash";
const MAX_ATTEMPTS = 3;

function createAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    console.error("Gemini configuration error: GEMINI_API_KEY is missing.");
    return null;
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

const ai = createAIClient();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusCode(error) {
  const value = Number(error?.status ?? error?.code);
  return Number.isFinite(value) ? value : null;
}

function isDailyQuotaExceeded(error) {
  const message = String(error?.message || "");
  return (
    message.includes("GenerateRequestsPerDayPerModel-FreeTier") ||
    message.includes("generate_content_free_tier_requests") ||
    message.includes("Please retry in")
  );
}

function isRetryable(error) {
  return [408, 429, 500, 502, 503, 504].includes(getStatusCode(error));
}

async function generateWithModel(model, prompt) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      console.log(
        `Gemini request: model=${model}, attempt=${attempt}/${MAX_ATTEMPTS}`,
      );

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const text = result.text?.trim();

      if (!text) {
        throw new Error("The AI returned an empty response.");
      }

      console.log(`Gemini request succeeded using ${model}.`);
      return text;
    } catch (error) {
      const status = getStatusCode(error);
      const message = error?.message || String(error);

      console.error(
        `Gemini failed: model=${model}, status=${status ?? "unknown"}, attempt=${attempt}/${MAX_ATTEMPTS}: ${message}`,
      );

      if (isDailyQuotaExceeded(error)) {
        const quotaError = new Error(
          "Gemini daily quota is exhausted. Please wait for the quota reset or check API billing and limits.",
        );
        quotaError.status = status ?? 429;
        quotaError.code = "DAILY_QUOTA_EXCEEDED";
        throw quotaError;
      }

      if (!isRetryable(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      const delay = 1000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500);
      console.log(`Retrying ${model} in ${delay} ms...`);
      await sleep(delay);
    }
  }

  throw new Error("Gemini generation failed unexpectedly.");
}

async function generateText(prompt) {
  if (!ai) {
    throw new Error("AI service is not configured.");
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A valid prompt is required.");
  }

  try {
    return await generateWithModel(MODEL, prompt.trim());
  } catch (primaryError) {
    const status = getStatusCode(primaryError);

    if (primaryError.code === "DAILY_QUOTA_EXCEEDED" || status === 429) {
      throw primaryError;
    }

    if (status !== 503) {
      throw primaryError;
    }

    console.warn(
      `Trying fallback model ${FALLBACK_MODEL} after ${MODEL} returned 503.`,
    );

    try {
      return await generateWithModel(FALLBACK_MODEL, prompt.trim());
    } catch (fallbackError) {
      console.error(
        `Both Gemini models failed. Primary status=${status}; fallback status=${getStatusCode(fallbackError) ?? "unknown"}.`,
      );
      throw fallbackError;
    }
  }
}

module.exports = { generateText };
