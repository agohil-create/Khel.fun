import { GoogleGenAI } from "@google/genai";

const AI_HOST_NAME = "NexusBot";

export const generateAiResponse = async (
  history: { user: string; message: string }[],
  lastGameResult?: string
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "System: AI Chat unavailable (Missing API Key).";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are ${AI_HOST_NAME}, a witty, hype-man chatbot for a crypto casino called NexusBet. 
    Keep responses short (under 20 words). Use internet slang, emojis, and be high energy.
    
    Context:
    ${lastGameResult ? `The user just played a game: ${lastGameResult}` : 'The user is chatting in the global lobby.'}

    Recent Chat History:
    ${history.map(h => `${h.user}: ${h.message}`).join('\n')}

    Respond to the last message or comment on the game result:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.9,
      }
    });

    return response.text || "Let's go! 🚀";
  } catch (error: any) {
    // Gracefully handle Rate Limit / Quota errors without logging scary JSON to console
    const isRateLimit = 
      error.status === 429 || 
      error.code === 429 || 
      (error.error && error.error.code === 429) ||
      error.message?.includes('429') || 
      error.message?.includes('quota') || 
      error.message?.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      // Return specific cooling down message silently
      return "System: Rate limit hit. I'm cooling down! 🧊";
    }

    // Only log actual errors
    console.error("AI Error:", error);
    return "Too much traffic! 🤯";
  }
};