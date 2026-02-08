
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AIWordSuggestion } from "../types";

const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();

// 用于生成内容的 AI 实例
const ai = new GoogleGenAI({ apiKey: apiKey || 'NO_KEY' });

// 用于解码 Base64 raw PCM 数据
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * 单词详情解析服务
 */
export async function getWordSuggestion(kanji: string): Promise<AIWordSuggestion | null> {
  const deepSeekKey = localStorage.getItem('deepseek_api_key');

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
              content: "你是一个专业的日语词典助手。请直接返回 JSON 格式数据，包含：reading(平假名), meaning(中文含义), example(日文例句), exampleTranslation(例句翻译), mnemonic(助记法)。不要包含 Markdown 代码块包裹。"
            },
            {
              role: "user", 
              content: `请解析日语单词 "${kanji}"。`
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

  if (!apiKey) return null;

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

/**
 * 语音合成服务
 */
export async function speakJapanese(text: string) {
  if (!apiKey) {
    // Fallback 到浏览器自带 TTS
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = 'ja-JP';
    window.speechSynthesis.speak(uttr);
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this Japanese word or sentence clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore 是一个适合日语的自然声音
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (e) {
    console.error("TTS Error:", e);
    // 降级使用浏览器 TTS
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = 'ja-JP';
    window.speechSynthesis.speak(uttr);
  }
}
