import type { ChatInput, ChatOutput } from "../../domain/chat.models.ts";

export interface IChatService {
  chat(input: ChatInput): Promise<ChatOutput>;
}