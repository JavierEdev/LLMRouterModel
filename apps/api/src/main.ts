import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import path from "path";
import "dotenv/config";
import { toProblemDetails } from "./http/errors/toProblemDetails.ts";
import { buildFlowsRoutes  } from "./http/routes/flow.routes.ts";
import { FlowService } from "./application/services/FlowService.ts";
import { FlowStoreFs } from "./infrastructure/stores/FlowStoreFs.ts";
import { buildChatRoutes } from "./http/routes/chat.routes.ts";
import { ChatService } from "./application/services/ChatService.ts";
import { ConversationStoreMemory } from "./infrastructure/stores/ConversationStoreMemory.ts";
import { GeminiClient } from "./infrastructure/llm/GeminiClient.ts";
import { FlowRunner } from "./application/runner/FlowRunner.ts";

const app = Fastify({ logger: true });
const flowStore = new FlowStoreFs(path.join(process.cwd(), "data", "flows"));
const flowService = new FlowService(flowStore);

const conversationStore = new ConversationStoreMemory();
const llm = new GeminiClient(process.env.GEMINI_API_KEY!);
const runner = new FlowRunner(llm);
const chatService = new ChatService(flowService, conversationStore, runner);
await app.register(cors, { origin: true });

app.setErrorHandler((err, req, reply) => {
  const pd = toProblemDetails(err, req.url);
  reply.code(pd.status).send(pd);
});

await app.register(swagger, {
  openapi: {
    info: {
      title: "Agent Builder API",
      version: "0.1.0",
    },
  },
});

await app.register(swaggerUI, {
  routePrefix: "/docs",
});

app.get("/health", async () => ({ ok: true }));

await app.register(buildFlowsRoutes(flowService), { prefix: "/flows" });
await app.register(buildChatRoutes(chatService), { prefix: "/chat" });

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: "0.0.0.0" });