import type { ContentMsg } from "../../domain/chat.ts";

export interface IConversationStore {
  get(conversationId: string): ContentMsg[];
  append(conversationId: string, msg: ContentMsg): void;
  clear(conversationId: string): void;
}