import { GoogleGenAI } from "@google/genai";
import type { ContentMsg } from "../../domain/chat.ts";

export interface IllmClient {
  generate(model: string, system: string, contents: ContentMsg[]): Promise<string>;
}