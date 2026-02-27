import type { Flow } from "../../domain/flow.ts";
import type { ContentMsg } from "../../domain/chat.ts";
import type { RouterOut } from "../../domain/runner.ts";

export type FlowRunResult = {
  reply: string;
  trace: any[];
  agentId: string;
  routerOut: RouterOut;
};

export interface IFlowRunner {
  runOnce(args: {
    flow: Flow;
    history: ContentMsg[];
    userText: string;
  }): Promise<FlowRunResult>;
}