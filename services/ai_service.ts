
import { GoogleGenAI, Type } from "@google/genai";
import { AIWordSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getWordSuggestion(kanji: string): Promise<AIWordSuggestion | null> {
  const deepSeekKey = localStorage.getItem('deepseek_api_key');

  // 如果有 DeepSeek Key，优先使用 DeepSeek (OpenAI 兼容接口)
  if (deepSeekKey) {
    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepSeekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个日语词典助手。请返回 JSON 格式数据。"
            },
            {
              role: "user", 
              content: `请为日语单词 "${kanji}" 提供：reading(平假名), meaning(中文含义), example(日文例句), exampleTranslation(例句翻译), mnemonic(助记法)。`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content) as AIWordSuggestion;
    } catch (e) {
      console.error("DeepSeek Error, falling back to Gemini", e);
    }
  }

  // 默认使用 Gemini
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请为日语单词 "${kanji}" 提供详细信息。返回读音（平假名）、中文含义、地道日文例句、例句中文翻译、助记法。请严格遵守 JSON 格式。`,
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
    console.error("Gemini Error:", error);
    return null;
  }
}
