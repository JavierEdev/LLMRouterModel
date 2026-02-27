import type { Flow } from "../../domain/flow.ts";

export interface IFlowStoreFs {
  saveAs(flowId: string, flow: Flow): Promise<void>;
  get(flowId: string): Promise<Flow | null>;
}