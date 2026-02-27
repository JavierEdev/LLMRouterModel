import type { IChatService } from "./IChatService.ts";
import type { ChatInput, ChatOutput } from "../../domain/chat.models.ts";
import type { IFlowService } from "./IFlowService.ts";
import type { IConversationStore } from "../../infrastructure/stores/IConversationStoreMemory.ts";
import type { ContentMsg } from "../../domain/chat.ts";
import { NotFoundError } from "../errors/NotFoundError.ts";
import type { IFlowRunner } from "../runner/IFlowRunner.ts";

const MAX_HISTORY = 16;
const tail = <T>(arr: T[], n: number) => (arr.length <= n ? arr : arr.slice(arr.length - n));

export class ChatService implements IChatService {
  constructor(
    private flowService: IFlowService,
    private conversations: IConversationStore,
    private runner: IFlowRunner,
  ) {}

  async chat(input: ChatInput): Promise<ChatOutput> {
    const flow = await this.flowService.get(input.flowId);
    if (!flow) throw new NotFoundError("Flow no encontrado");

    const prevHistory = tail(this.conversations.get(input.conversationId), MAX_HISTORY);

    const result = await this.runner.runOnce({
      flow,
      history: prevHistory,
      userText: input.message,
    });

    this.conversations.append(input.conversationId, { role: "user", parts: [{ text: input.message }] });
    this.conversations.append(input.conversationId, { role: "model", parts: [{ text: result.reply }] });

    return {
      reply: result.reply,
      history: tail(this.conversations.get(input.conversationId), MAX_HISTORY),
      trace: result.trace,
    };
  }
}