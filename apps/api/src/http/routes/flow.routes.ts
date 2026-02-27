import type { FastifyInstance } from "fastify";
import type { Flow } from "../../domain/flow.ts";
import type { IFlowService } from "../../application/services/IFlowService.ts";
import { NotFoundError } from "../../application/errors/NotFoundError.ts";

export function buildFlowsRoutes(service: IFlowService) {
  return async function flowsRoutes(app: FastifyInstance) {
    app.post<{ Body: Flow }>(
      "/",
      {
        schema: {
          body: {
            type: "object",
            required: ["start", "nodes", "edges"],
            properties: {
              start: { type: "string" },
              nodes: { type: "array", items: { type: "object" } },
              edges: { type: "array", items: { type: "object" } },
            },
          },
          response: {
            200: {
              type: "object",
              properties: { flow_id: { type: "string" } },
            },
            400: { type: "object" },
          },
        },
      },
      async (req) => {
        const flowId = await service.saveNew(req.body);
        return { flow_id: flowId };
      }
    );

    app.get<{ Params: { id: string } }>(
      "/:id",
      {
        schema: {
          params: {
            type: "object",
            required: ["id"],
            properties: { id: { type: "string" } },
          },
            response: {
              200: {
                type: "object",
                required: ["start", "nodes", "edges"],
                properties: {
                  start: { type: "string" },
                  nodes: { type: "array", items: { type: "object", additionalProperties: true } },
                  edges: { type: "array", items: { type: "object", additionalProperties: true } }
                }
              },
              404: { type: "object" }
            },
        },
      },
      async (req) => {
        const flow = await service.get(req.params.id);
        if (!flow) throw new NotFoundError("Flow no encontrado");
        return flow;
      },
    );
  };
}