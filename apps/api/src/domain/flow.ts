export type Flow = {
  start: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type FlowNode =
  | {
      id: string;
      type: "router_llm";
      data: { model: string; system: string; threshold: number };
    }
  | {
      id: string;
      type: "agent";
      data: { model: string; system: string };
    };

export type FlowEdge = {
  source: string;
  target: string;
  when: {
    intent?: string;
    min_confidence?: number;
    default?: boolean;
  };
};
