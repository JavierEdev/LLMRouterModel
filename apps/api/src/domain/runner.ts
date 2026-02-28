import type { FlowEdge, FlowNode } from "./flow.ts";
import type { ContentMsg } from "./chat.ts";
import type { IllmClient } from "../infrastructure/llm/IllClient.ts";


export type RouterOut = { intent: string; confidence: number; raw: string };

export type PickNextArgs = {
  edges: FlowEdge[] | undefined;
  routerOut: { intent: string; confidence: number };
  threshold: number;
};

export type RunRouterArgs = {
  llm: IllmClient;
  node: Extract<FlowNode, { type: "router_llm" }>;
  userText: string;
};

export type RunAgentArgs = {
  llm: IllmClient;
  node: Extract<FlowNode, { type: "agent" }>;
  history: ContentMsg[];
  userText: string;
};
