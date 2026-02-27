import type { FastifyInstance } from "fastify";
import type { IChatService } from "../../application/services/IChatService.ts";
import type { ChatHttpRequest } from "../../domain/chat.models.ts";
import {
  chatHttpRequestSchema,
  contentMsgSchema,
  traceEventSchema,
} from "../../domain/chat.schemas.ts";

export function buildChatRoutes(chatService: IChatService) {
  return async function chatRoutes(app: FastifyInstance) {
    app.post<{ Body: ChatHttpRequest }>(
      "/",
      {
        schema: {
          body: chatHttpRequestSchema,
          response: {
            200: {
              type: "object",
              required: ["reply", "history", "trace"],
              properties: {
                reply: { type: "string" },
                history: { type: "array", items: contentMsgSchema },
                trace: { type: "array", items: traceEventSchema },
              },
              additionalProperties: false,
            },
            400: { type: "object" },
            404: { type: "object" },
          },
        },
      },
      async (req) =>
        chatService.chat({
          flowId: req.body.flow_id,
          conversationId: req.body.conversation_id,
          message: req.body.message,
        }),
    );
  };
}
