import type { ContentMsg } from "./chat.ts";

export type ChatInput = {
  flowId: string;
  conversationId: string;
  message: string;
};

export type TraceEvent = {
  node: string;
  type: string;
  out?: unknown;
};

export type ChatOutput = {
  reply: string;
  history: ContentMsg[];
  trace: TraceEvent[];
};

export type ChatHttpRequest = {
  flow_id: string;
  conversation_id: string;
  message: string;
};