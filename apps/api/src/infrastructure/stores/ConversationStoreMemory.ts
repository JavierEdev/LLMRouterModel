import type { IConversationStore } from "./IConversationStoreMemory.ts";
import type { ContentMsg } from "../../domain/chat.ts";


export class ConversationStoreMemory implements IConversationStore {
  private map = new Map<string, ContentMsg[]>();

  get(conversationId: string): ContentMsg[] {
    return this.map.get(conversationId) ?? [];
  }

  append(conversationId: string, msg: ContentMsg): void {
    const arr = this.map.get(conversationId) ?? [];
    arr.push(msg);
    this.map.set(conversationId, arr);
  }

  clear(conversationId: string): void {
    this.map.delete(conversationId);
  }
}