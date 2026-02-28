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
    await this.store.saveAs(flowId, flow);
    return flowId;
  }

  async get(flowId: string) {
    return this.store.get(flowId);
  }
}