
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
const ai = new GoogleGenAI({ apiKey: apiKey || 'NO_KEY' });

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
              content: "你是一个专业的日语词典助手。请返回 JSON 格式，包含：reading(平假名), meaning(中文含义), example(日文例句), exampleTranslation(例句翻译), mnemonic(助记法)。"
            },
            {
              role: "user", 
              content: `解析单词: "${kanji}"`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content) as AIWordSuggestion;
    } catch (e) {
      console.error("DeepSeek Error", e);
    }
  }

  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请为日语单词 "${kanji}" 提供：读音（平假名）、中文含义、日文例句、例句翻译、助记法。严格 JSON 格式。`,
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
    return null;
  }
}

/**
 * 改进的发音服务
 * @param text 要读的文本（汉字或句子）
 * @param reading 明确的读音引导（假名），防止多音字读错
 */
export async function speakJapanese(text: string, reading?: string) {
  // 如果提供了假名引导，构建更精准的指令
  const prompt = reading 
    ? `Read this Japanese word "${text}" as pronounced: "${reading}".` 
    : `Read this Japanese text naturally: "${text}"`;

  if (!apiKey) {
    const uttr = new SpeechSynthesisUtterance(reading || text);
    uttr.lang = 'ja-JP';
    window.speechSynthesis.speak(uttr);
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
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
    const uttr = new SpeechSynthesisUtterance(reading || text);
    uttr.lang = 'ja-JP';
    window.speechSynthesis.speak(uttr);
  }
}
