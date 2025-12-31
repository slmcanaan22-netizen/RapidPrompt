
import { GoogleGenAI, Modality } from "@google/genai";
import { FileData } from "../types";

// Initialize with the environment API Key
// Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizePrompt = async (draft: string, files: FileData[] = []): Promise<string> => {
  const ai = getAI();
  try {
    const fileParts = files.map(f => ({
      inlineData: {
        mimeType: f.mimeType,
        data: f.data
      }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...fileParts,
          { text: `You are a World-Class Prompt Engineer. Optimize the following draft prompt for maximum effectiveness, clarity, and precision while maintaining the user's original intent. If media files are provided, analyze them to incorporate their stylistic elements into the prompt. Return ONLY the optimized prompt text.
          
          DRAFT: "${draft}"` }
        ]
      },
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text?.trim() || draft;
  } catch (error) {
    console.error("Gemini optimization failed:", error);
    return draft;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const generateAudio = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Generate high quality audio for: ${prompt}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // The API returns raw PCM data. Prefixed for data URI handling in simple UI preview.
      // Note: PCM needs a header or AudioContext decoding for standard browser playback.
      return `data:audio/pcm;base64,${base64Audio}`;
    }
    return null;
  } catch (error) {
    console.error("Audio generation failed:", error);
    return null;
  }
};

export const generateVideo = async (prompt: string): Promise<string | null> => {
  const ai = getAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      // Must append an API key when fetching from the download link.
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error("Video generation failed:", error);
    return null;
  }
};

export const assistantChatStream = async (message: string, files: FileData[], history: any[], systemInstruction: string) => {
  const ai = getAI();
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    config: {
      systemInstruction,
    }
  });
  
  const fileParts = files.map(f => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.data
    }
  }));

  const messagePart = { text: message || "Analyze the uploaded file(s)." };

  // Fix: sendMessageStream expects the message property to be Part[] directly (not wrapped in a parts object)
  return chat.sendMessageStream({ 
    message: [...fileParts, messagePart]
  });
};
