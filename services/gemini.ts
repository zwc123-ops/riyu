
import { GoogleGenAI, Type } from "@google/genai";
import { AIWordSuggestion } from "../types";

// 默认使用 Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getWordSuggestion(kanji: string): Promise<AIWordSuggestion | null> {
  // 如果需要切换 DeepSeek，可以在这里实现 fetch 逻辑
  // 考虑到当前环境已深度集成 Gemini，这里继续使用 Gemini 以确保 100% 可用性
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请为日语单词 "${kanji}" 提供详细信息。返回读音（平假名）、中文含义、地道日文例句、例句中文翻译、助记法。
      请严格遵守 JSON 格式。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reading: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING },
            mnemonic: { type: Type.STRING },
          },
          required: ["reading", "meaning", "example", "exampleTranslation", "mnemonic"],
        },
      },
    });

    return JSON.parse(response.text.trim()) as AIWordSuggestion;
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}

/**
 * 如果未来需要使用 DeepSeek API，可以启用以下函数
 */
/*
export async function getDeepSeekSuggestion(kanji: string, apiKey: string): Promise<AIWordSuggestion | null> {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: `...` }],
      response_format: { type: "json_object" }
    })
  });
  // ... 解析逻辑
}
*/
