import axios from 'axios';

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const generateContent = async (prompt, options = {}) => {
  const model = process.env.MODEL_NAME || "gemini-2.0-flash";
  const url = `${GEMINI_BASE}/${model}:generateContent`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.85,
      maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || "1024", 10),
      topP: 0.9,
      topK: 40,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  const response = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    timeout: 45000,
  });

  // Check for safety block or empty response
  const candidate = response?.data?.candidates?.[0];
  if (!candidate) throw new Error("No candidate returned from Gemini API");
  if (candidate.finishReason === "SAFETY") throw new Error("Response blocked by safety filters");

  const text = candidate?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Gemini API");

  // Strip markdown formatting that Gemini frequently adds (bold **, italic *,
  // heading #, bullet dashes, etc.) so responses render as plain prose.
  const clean = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold**
    .replace(/\*([^*]+)\*/g, '$1')        // *italic*
    .replace(/^#{1,6}\s+/gm, '')          // # headings
    .replace(/^[-•]\s+/gm, '')            // bullet points
    .replace(/\n{3,}/g, '\n\n')           // collapse excess blank lines
    .trim();

  return clean;
};

export default { generateContent };
