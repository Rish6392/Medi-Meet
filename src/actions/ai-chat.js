"use server";

// We use the Gemini REST API directly instead of the SDK.
// This avoids compatibility issues with the new "AQ." API key format
// that Google recently started issuing.

// These are the EXACT specialties available on MediMeet.
// The AI will ONLY recommend from this list so links always work.
const AVAILABLE_SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
];

// The system prompt tells the AI exactly how to behave.
// It restricts the AI to only recommend from our specialty list
// and forces it to return a JSON response we can parse.
const SYSTEM_PROMPT = `You are MediMeet AI, a friendly and professional medical assistant chatbot for the MediMeet healthcare platform.

Your role:
- Help users understand their symptoms
- Recommend the most appropriate medical specialty from the platform
- Be empathetic, clear, and concise
- NEVER diagnose conditions — only suggest which type of specialist to consult

Available specialties on MediMeet:
${AVAILABLE_SPECIALTIES.map((s) => `- ${s}`).join("\n")}

Rules:
1. Keep responses short (2-4 sentences max)
2. Always recommend a specialty when symptoms are described
3. If the user's message is a greeting or unrelated to health, respond warmly and ask how you can help with their health concerns
4. If symptoms are vague, ask ONE clarifying question
5. Never provide medical diagnoses or prescribe treatments
6. Be warm and reassuring, not clinical

IMPORTANT: You must respond in this exact JSON format:
{
  "message": "Your conversational response here",
  "specialty": "Exact Specialty Name" or null,
  "confidence": "high" or "medium" or "low" or null
}

The "specialty" field must be EXACTLY one of the available specialties listed above, or null if no recommendation is being made.
The "confidence" field indicates how confident you are in the recommendation.`;

/**
 * Main server action: sends user message to Gemini via REST API and returns AI response.
 * 
 * We use fetch() to call the Gemini API directly instead of the SDK because:
 * - Google recently started issuing API keys in a new "AQ." format
 * - The @google/generative-ai SDK may not support this format yet
 * - The REST API accepts any valid API key regardless of format
 *
 * @param {string} userMessage - The message typed by the user
 * @param {Array} chatHistory - Previous messages for context (keeps conversation flowing)
 * @returns {Object} - { message, specialty, confidence } or { error }
 */
export async function getAIResponse(userMessage, chatHistory = []) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    // Safety check: make sure the API key is set
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.error("GEMINI_API_KEY is not set in .env file");
      return {
        error: "AI service is not configured. Please set your Gemini API key.",
      };
    }

    // Build conversation history so the AI remembers previous messages.
    // Groq uses OpenAI-compatible format with "messages" array.
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    // Groq API endpoint — using llama-3.3-70b-versatile (fast and free tier available)
    const url = "https://api.groq.com/openai/v1/chat/completions";

    // Send the request to Groq API
    // Helper: make the API request with retry on rate limit (429)
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 512,
          response_format: { type: "json_object" },
        }),
      });

      // If rate limited (429), wait and retry
      if (response.status === 429 && attempt < 2) {
        console.log(`Rate limited (429), retrying in ${(attempt + 1) * 2}s...`);
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      break;
    }

    // Check if the API request itself failed (wrong key, rate limit, etc.)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error:", response.status, errorData);

      // Give user a specific message for rate limiting
      if (response.status === 429) {
        return {
          error: "I'm getting a lot of requests right now. Please wait a few seconds and try again.",
        };
      }
      return {
        error: "I'm having trouble connecting right now. Please try again in a moment.",
      };
    }

    // Parse the API response
    const data = await response.json();

    // Extract the AI's text response from the nested JSON structure
    // Groq returns: { choices: [{ message: { content: "..." } }] }
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      console.error("No response text from Groq:", JSON.stringify(data));
      return {
        error: "I didn't get a response. Please try again.",
      };
    }

    // Try to parse the AI's response as JSON.
    // The AI is instructed to respond in JSON, but sometimes wraps it
    // in markdown code blocks or mixes plain text with JSON. We handle all cases.
    try {
      // Step 1: Remove markdown code block wrappers if present
      let cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Step 2: Try direct JSON parse first
      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        // Step 3: If direct parse fails, extract JSON object from mixed text
        const jsonMatch = cleanedText.match(/\{[\s\S]*"message"\s*:[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      }

      // Validate that the recommended specialty actually exists on our platform.
      // This prevents broken links if the AI hallucinates a specialty name.
      if (parsed.specialty && !AVAILABLE_SPECIALTIES.includes(parsed.specialty)) {
        parsed.specialty = null; // Reset to null if AI suggested an invalid specialty
      }

      return {
        message: parsed.message,
        specialty: parsed.specialty || null,
        confidence: parsed.confidence || null,
      };
    } catch {
      // If all JSON parsing fails, clean up the raw text as best we can.
      // Remove any JSON-looking fragments so the user sees only the readable part.
      const cleanMessage = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/\{[\s\S]*"message"\s*:[\s\S]*\}/g, "")
        .trim();

      return {
        message: cleanMessage || responseText,
        specialty: null,
        confidence: null,
      };
    }
  } catch (error) {
    // Network error or unexpected failure — log details for debugging
    console.error("AI Chat Error:", error.message || error);
    return {
      error: "I'm having trouble connecting right now. Please try again in a moment.",
    };
  }
}
