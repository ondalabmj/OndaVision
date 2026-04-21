/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EnhancedPrompt {
  positive: string;
  negative: string;
}

export async function enhancePrompt(userPrompt: string): Promise<EnhancedPrompt> {
  const systemInstruction = `You are a professional AI image prompt engineer.
Your role is to receive a user's rough image description and transform it into a highly detailed, vivid, and optimized prompt for AI image generation.

## Enhancement Rules:
1. Convert vague expressions into specific, concrete descriptions.
2. Add visual elements: lighting, composition, camera angle, color palette, mood, and artistic style.
3. Append quality keywords: high quality, ultra detailed, sharp focus, professional photography, 8K resolution, award-winning.
4. If input is Korean, translate and enhance into English.
5. Remove or replace any copyrighted names or harmful content.

## Output Format (return BOTH fields, nothing else):
POSITIVE: <enhanced prompt here>
NEGATIVE: <negative prompt here>

## Negative Prompt Guidelines:
Always include: blurry, low quality, distorted, deformed, ugly, watermark, text overlay, out of focus, grainy, pixelated, oversaturated, bad anatomy.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const text = response.text || "";
    const positiveMatch = text.match(/POSITIVE:\s*(.*)/i);
    const negativeMatch = text.match(/NEGATIVE:\s*(.*)/i);

    return {
      positive: positiveMatch ? positiveMatch[1].trim() : userPrompt,
      negative: negativeMatch ? negativeMatch[1].trim() : "blurry, low quality, distorted, deformed, ugly, watermark, text overlay, out of focus, grainy, pixelated, oversaturated, bad anatomy",
    };
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return {
      positive: userPrompt,
      negative: "blurry, low quality, distorted, deformed, ugly, watermark, text overlay, out of focus, grainy, pixelated, oversaturated, bad anatomy",
    };
  }
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
  count: number;
}

export async function generateImages(params: GenerationParams): Promise<string[]> {
  const fullPrompt = `${params.prompt}${params.negativePrompt ? ` [NEGATIVE: ${params.negativePrompt}]` : ""}`;
  
  const generateOne = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: params.prompt }], // Note: Negative prompt support varies, usually appending to text or via config if supported
      },
      config: {
        imageConfig: {
          aspectRatio: params.aspectRatio,
        },
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  };

  try {
    const results = await Promise.all(
      Array.from({ length: params.count }).map(() => generateOne())
    );
    return results;
  } catch (error) {
    console.error("Error generating images:", error);
    throw error;
  }
}

export async function editImage({
  imageBuffer,
  maskBuffer,
  instruction,
}: {
  imageBuffer: string;
  maskBuffer: string;
  instruction: string;
}): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBuffer.split(",")[1],
            mimeType: "image/png",
          },
        },
        {
          inlineData: {
            data: maskBuffer.split(",")[1],
            mimeType: "image/png",
          },
        },
        { text: instruction },
      ],
    },
    config: {
      systemInstruction: "You are an image editor. Apply the described change only to the masked white area.",
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("이미지 데이터가 응답에 포함되어 있지 않습니다.");
}

export async function composeImages({
  images,
  instruction,
}: {
  images: string[];
  instruction: string;
}): Promise<string> {
  const imageParts = images.map(img => ({
    inlineData: {
      data: img.split(",")[1],
      mimeType: "image/png",
    },
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        ...imageParts,
        { text: instruction },
      ],
    },
    config: {
      systemInstruction: "당신은 이미지 합성 전문가입니다. 제공된 여러 이미지를 자연스럽게 결합하여 새로운 고품질 이미지를 생성하세요.",
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("이미지 데이터가 응답에 포함되어 있지 않습니다.");
}
