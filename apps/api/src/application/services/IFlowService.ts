import type { Flow } from "../../domain/flow.ts";

export interface IFlowService {
  saveNew(flow: Flow): Promise<string>;
  get(flowId: string): Promise<Flow | null>;
}