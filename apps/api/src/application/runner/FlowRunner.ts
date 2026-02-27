import type { Flow, FlowNode, FlowEdge, Intent } from "../../domain/flow.ts";
import type { ContentMsg } from "../../domain/chat.ts";
import type { IllmClient } from "../../infrastructure/llm/IllClient.ts";
import type {
  RunRouterArgs,
  RunAgentArgs,
  PickNextArgs,
  RouterOut,
} from "../../domain/runner.ts";
import type { IFlowRunner, FlowRunResult } from "./IFlowRunner.ts";

export class FlowRunner implements IFlowRunner {
  constructor(private llm: IllmClient) {}

  async runOnce(args: {
    flow: any;     // si querés, tipalo Flow
    history: any;  // ContentMsg[]
    userText: string;
  }): Promise<FlowRunResult> {
    return runFlowOnce({
      llm: this.llm,
      flow: args.flow,
      history: args.history,
      userText: args.userText,
    });
  }
}

function extractJsonObject(s: string): any | null {
  const match = s.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function indexFlow(flow: Flow) {
  const nodes = new Map(flow.nodes.map((n) => [n.id, n] as const));
  const edgesBySource = new Map<string, FlowEdge[]>();
  for (const e of flow.edges) {
    const arr = edgesBySource.get(e.source) ?? [];
    arr.push(e);
    edgesBySource.set(e.source, arr);
  }
  return { nodes, edgesBySource };
}

async function runRouter({ llm, node, userText }: RunRouterArgs): Promise<RouterOut> {
  const raw = await llm.generate(node.data.model, node.data.system, [
    { role: "user", parts: [{ text: userText }] },
  ]);

  const parsed = extractJsonObject(raw);
  const intent = parsed?.intent as Intent;
  const confidence = Number(parsed?.confidence);

  const okIntent =
    intent === "sales" || intent === "support" || intent === "other";
  const okConf = Number.isFinite(confidence);

  return {
    intent: okIntent ? intent : "other",
    confidence: okConf ? Math.max(0, Math.min(1, confidence)) : 0,
    raw,
  };
}

function pickNext({ edges, routerOut, threshold }: PickNextArgs) {
  if (!edges || edges.length === 0) return null;

  for (const e of edges) {
    const w = e.when ?? {};
    const min = w.min_confidence ?? 0;

    if (
      w.intent &&
      w.intent === routerOut.intent &&
      routerOut.confidence >= min &&
      routerOut.confidence >= threshold
    ) {
      return e.target;
    }
  }

  const def = edges.find((e) => e.when?.default === true);
  return def?.target ?? null;
}

async function runAgent({ llm, node, history, userText }: RunAgentArgs) {
  const fullHistory: ContentMsg[] = [
    ...history,
    { role: "user", parts: [{ text: userText }] },
  ];

  return llm.generate(node.data.model, node.data.system, fullHistory);
}

export async function runFlowOnce(args: {
  llm: IllmClient;
  flow: Flow;
  history: ContentMsg[];
  userText: string;
}) {
  const { llm, flow, history, userText } = args;
  const { nodes, edgesBySource } = indexFlow(flow);

  const trace: any[] = [];

  const startNode = nodes.get(flow.start);
  if (!startNode) throw new Error(`Start node '${flow.start}' no existe`);
  if (startNode.type !== "router_llm")
    throw new Error("start debe ser router_llm (MVP3)");

  const routerOut = await runRouter({ llm, node: startNode, userText });
  trace.push({
    node: startNode.id,
    type: startNode.type,
    out: { intent: routerOut.intent, confidence: routerOut.confidence },
  });

  const nextId = pickNext({
    edges: edgesBySource.get(startNode.id),
    routerOut: { intent: routerOut.intent, confidence: routerOut.confidence },
    threshold: startNode.data.threshold,
  });
  if (!nextId) throw new Error("No se pudo resolver el next node desde router");

  const nextNode = nodes.get(nextId);
  if (!nextNode) throw new Error(`Next node '${nextId}' no existe`);
  if (nextNode.type !== "agent")
    throw new Error("next node debe ser agent (MVP3)");

  const reply = await runAgent({ llm, node: nextNode, history, userText });
  trace.push({ node: nextNode.id, type: nextNode.type });

  return { reply, trace, agentId: nextNode.id, routerOut };
}
