import { v4 as uuidv4 } from "uuid";
import type { Flow } from "../../domain/flow.ts";
import type { IFlowStoreFs } from "../../infrastructure/stores/IFlowStoreFs.ts";
import { validateFlow } from "../../domain/flow.validation.ts";
import { ValidationError } from "../errors/ValidationError.ts";
import type { IFlowService } from "./IFlowService.ts";

export class FlowService implements IFlowService {
  constructor(private store: IFlowStoreFs) {}

  async saveNew(flow: Flow): Promise<string> {
    const errors = validateFlow(flow);
    if (errors.length) {
      throw new ValidationError(errors, "Flow inválido");
    }

    const flowId = uuidv4();
    await this.store.saveAs(flowId, sanitizeFlowForSave(flow));
    return flowId;
  }

  async get(flowId: string) {
    return this.store.get(flowId);
  }
}

function sanitizeFlowForSave(flow: Flow): Flow {
  return {
    ...flow,
    edges: flow.edges.map((edge) => {
      const when = sanitizeWhen(edge.when);
      return when ? { ...edge, when } : { source: edge.source, target: edge.target };
    }),
  };
}

function sanitizeWhen(when: Flow["edges"][number]["when"]) {
  if (!when) return undefined;

  const intent = typeof when.intent === "string" ? when.intent.trim() : undefined;
  const minConfidence =
    typeof when.min_confidence === "number" ? when.min_confidence : undefined;
  const defaultFlag = typeof when.default === "boolean" ? when.default : undefined;

  const normalized = {
    ...(intent ? { intent } : {}),
    ...(minConfidence != null ? { min_confidence: minConfidence } : {}),
    ...(defaultFlag != null ? { default: defaultFlag } : {}),
  };

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}
