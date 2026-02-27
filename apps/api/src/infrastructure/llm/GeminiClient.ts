import { GoogleGenAI } from "@google/genai";
import type { ContentMsg } from "../../domain/chat.ts";
import type { IllmClient } from "./IllClient.ts";

export class GeminiClient implements IllmClient {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("Falta GEMINI_API_KEY");
    this.ai = new GoogleGenAI({ apiKey });
  }

async generate(model: string, system: string, contents: ContentMsg[]): Promise<string> {
  try {
    const resp = await this.ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction: system },
    });

    return resp.text || "(sin texto)";
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    const status = err?.status ?? err?.response?.status;
    const details = err?.errorDetails ?? err?.response?.data ?? err;

    console.error("[GeminiClient.generate] FAILED", {
      model,
      status,
      message: msg,
      // ayuda a ver si mandaste algo raro
      contentsPreview: contents?.slice?.(-3),
      systemPreview: system?.slice?.(0, 200),
      details,
    });

    throw err;
  }
}
}