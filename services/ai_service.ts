
import { GoogleGenAI, Type } from "@google/genai";
import { AIWordSuggestion } from "../types";

// 安全获取 API KEY，防止在某些浏览器环境下 process 未定义导致崩溃
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || 'NO_KEY' });

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
              content: "你是一个专业的日语词典助手。请直接返回 JSON 格式数据，不要包含任何 Markdown 代码块包裹。"
            },
            {
              role: "user", 
              content: `请为日语单词 "${kanji}" 提供：reading(读音,平假名), meaning(中文含义), example(日文例句), exampleTranslation(例句翻译), mnemonic(助记法)。`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      console.error("DeepSeek Error, falling back to Gemini", e);
    }
  }

  // 如果没有 DeepSeek Key 或调用失败，使用默认的 Gemini
  if (!apiKey) {
    console.warn("未检测到 API_KEY，请确保环境变量已配置");
    return null;
  }

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
