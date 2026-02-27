import type { Flow } from "../../domain/flow.ts";

export interface IFlowService {
  saveNew(flow: Flow): Promise<{ flow_id: string }>;
  get(flowId: string): Promise<Flow | null>;
}