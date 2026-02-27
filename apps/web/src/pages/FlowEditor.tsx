import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RouterNode from "./../nodes/RouterNode";
import AgentNode from "./../nodes/AgentNode";

const nodeTypes = { router: RouterNode, agent: AgentNode };

type FlowNodeData =
  | { type: "router_llm"; model: string; threshold: number; system: string }
  | { type: "agent"; model: string; system: string };

const API = "http://localhost:3001";

export default function FlowEditor() {
    const [flowId, setFlowId] = useState<string>("");

  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([
    {
      id: "router",
      type: "router",
      position: { x: 80, y: 120 },
      data: {
        type: "router_llm",
        model: "gemini-2.0-flash",
        threshold: 0.6,
        system:
          'Eres un clasificador de intención. Devuelve SOLO JSON {"intent":"sales|support|other","confidence":0..1}.',
      },
    },
    {
      id: "agent_sales",
      type: "agent",
      position: { x: 420, y: 40 },
      data: {
        type: "agent",
        model: "gemini-2.0-flash",
        system: "Agente de ventas (ES).",
      },
    },
    {
      id: "agent_support",
      type: "agent",
      position: { x: 420, y: 220 },
      data: {
        type: "agent",
        model: "gemini-2.0-flash",
        system: "Agente de soporte (ES).",
      },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: "e1", source: "router", target: "agent_sales", label: "sales" },
    { id: "e2", source: "router", target: "agent_support", label: "support" },
    { id: "e3", source: "router", target: "agent_support", label: "default" },
  ]);

  const onNodesChange = (changes: NodeChange[]) =>
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<FlowNodeData>[]);
  const onEdgesChange = (changes: EdgeChange[]) =>
    setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]);
  const onConnect = (c: Connection) => setEdges((eds) => addEdge(c, eds));

  const flowPayload = useMemo(() => {
    return {
      start: "router",
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.type,
        data:
          n.data.type === "router_llm"
            ? {
                model: n.data.model,
                threshold: n.data.threshold,
                system: n.data.system,
              }
            : {
                model: n.data.model,
                system: n.data.system,
              },
      })),
      edges: edges.map((e) => {
        const label = (e.label ?? "").toString().toLowerCase();
        const when =
          label === "default"
            ? { default: true }
            : label === "sales" || label === "support" || label === "other"
              ? { intent: label, min_confidence: 0.6 }
              : undefined;

        return { id: e.id, source: e.source, target: e.target, when };
      }),
    };
  }, [nodes, edges]);

  async function saveFlow() {
    const res = await fetch(`${API}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flowPayload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setFlowId(data.flow_id);
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={saveFlow}>Guardar Flow</button>
        {flowId && (
          <span style={{ marginLeft: 12 }}>
            flow_id: <code>{flowId}</code>
          </span>
        )}
        <span style={{ opacity: 0.7 }}>
          Tip: poné label del edge como sales/support/other/default
        </span>
      </div>

      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultEdgeOptions={{ animated: true }}
      >
        <MiniMap />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
