import { useMemo, useState, type SetStateAction } from "react";
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

type EdgeWhen = {
  intent?: string;
  min_confidence?: number;
  default?: boolean;
};

type FlowEdgeData = {
  when?: EdgeWhen;
};

const API = "http://localhost:3001";

type ChatLine = {
  role: "user" | "model";
  text: string;
};

export default function FlowEditor() {
  const [flowId, setFlowId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatLine[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [conversationId] = useState(() =>
    `conv-${Math.random().toString(36).slice(2, 10)}`,
  );

  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([
    {
      id: "router_1",
      type: "router",
      position: { x: 80, y: 120 },
      data: {
        type: "router_llm",
        model: "gemini-2.5-flash-lite",
        threshold: 0.6,
        system:
          'Eres un clasificador de intención. Devuelve SOLO JSON {"intent":"<categoria>","confidence":0..1}. La categoria debe coincidir con los intent de los edges.',
      },
    },
  ]);
  const [startNodeId, setStartNodeId] = useState("router_1");

  const [edges, setEdges] = useState<Edge<FlowEdgeData>[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const onNodesChange = (changes: NodeChange[]) =>
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<FlowNodeData>[]);
  const onEdgesChange = (changes: EdgeChange[]) =>
    setEdges((eds) => applyEdgeChanges(changes, eds) as Edge<FlowEdgeData>[]);
  const onConnect = (c: Connection) =>
    setEdges((eds) =>
      addEdge(
        {
          ...c,
          label: "",
          data: { when: {} },
        },
        eds,
      ),
    );

  const routerNodes = useMemo(
    () => nodes.filter((n) => n.data.type === "router_llm"),
    [nodes],
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );

  function nextNodeId(prefix: string) {
    const used = new Set(nodes.map((n) => n.id));
    let i = 1;
    while (used.has(`${prefix}_${i}`)) i += 1;
    return `${prefix}_${i}`;
  }

  function addRouterNode() {
    const id = nextNodeId("router");
    const routerCount = routerNodes.length;
    const node: Node<FlowNodeData> = {
      id,
      type: "router",
      position: { x: 80 + routerCount * 30, y: 120 + routerCount * 30 },
      data: {
        type: "router_llm",
        model: "gemini-2.5-flash-lite",
        threshold: 0.6,
        system:
          'Eres un clasificador de intención. Devuelve SOLO JSON {"intent":"<categoria>","confidence":0..1}. La categoria debe coincidir con los intent de los edges.',
      },
    };
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    if (!startNodeId) setStartNodeId(id);
    setFlowId("");
  }

  function addAgentNode() {
    const id = nextNodeId("agent");
    const node: Node<FlowNodeData> = {
      id,
      type: "agent",
      position: { x: 420, y: 80 + nodes.length * 40 },
      data: {
        type: "agent",
        model: "gemini-2.5-flash-lite",
        system: "Agente nuevo (ES).",
      },
    };
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setFlowId("");
  }

  function deleteSelectedNode() {
    if (!selectedNode) return;
    const nodeId = selectedNode.id;
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (startNodeId === nodeId) {
      const fallback = nodes.find((n) => n.id !== nodeId && n.data.type === "router_llm");
      setStartNodeId(fallback?.id ?? "");
    }
    setSelectedNodeId(null);
    setFlowId("");
  }

  function deleteSelectedEdge() {
    if (!selectedEdge) return;
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdgeId(null);
    setFlowId("");
  }

  function updateNodeData(id: string, updater: (current: FlowNodeData) => FlowNodeData) {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, data: updater(n.data) } : n)),
    );
    setFlowId("");
  }

  function updateEdgeWhen(id: string, when: EdgeWhen | undefined) {
    setEdges((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const normalized = when ?? {};
        const label = normalized.default
          ? "default"
          : normalized.intent
            ? `${normalized.intent}${normalized.min_confidence != null ? ` >= ${normalized.min_confidence}` : ""}`
            : "";
        return {
          ...e,
          label,
          data: { ...(e.data ?? {}), when: normalized },
        };
      }),
    );
    setFlowId("");
  }

  const flowPayload = useMemo(() => {
    return {
      start: startNodeId,
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
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          when: e.data?.when ?? {},
        };
      }),
    };
  }, [nodes, edges, startNodeId]);

  async function saveFlow() {
    if (!startNodeId) {
      throw new Error("Definí un nodo router como Start.");
    }
    const res = await fetch(`${API}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flowPayload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setFlowId(data.flow_id);
    setStatus("Flow guardado correctamente.");
    return data.flow_id as string;
  }

  async function sendMessage() {
    const message = chatInput.trim();
    if (!message || isSending) return;

    setIsSending(true);
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: message }]);

    try {
      const ensuredFlowId = flowId || (await saveFlow());
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id: ensuredFlowId,
          conversation_id: conversationId,
          message,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "No se pudo enviar el mensaje");
      }

      const data = (await res.json()) as { reply: string };
      setChatHistory((prev) => [...prev, { role: "model", text: data.reply }]);
      setStatus("Mensaje enviado correctamente.");
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Error desconocido";
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: `No pude responder (${errMessage}). Revisá API/GEMINI_API_KEY.`,
        },
      ]);
      setStatus(`Error: ${errMessage}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={addRouterNode}>Agregar Router</button>
        <button onClick={addAgentNode}>Agregar Agent</button>
        <button
          onClick={() => {
            void saveFlow().catch((err: unknown) => {
              const message = err instanceof Error ? err.message : "Error desconocido";
              setStatus(`Error: ${message}`);
            });
          }}
        >
          Guardar Flow
        </button>
        {flowId && (
          <span style={{ marginLeft: 12 }}>
            flow_id: <code>{flowId}</code>
          </span>
        )}
        <span style={{ opacity: 0.7, marginLeft: 6 }}>
          Uní nodos arrastrando desde el handle derecho al izquierdo.
        </span>
        {status && <span style={{ marginLeft: "auto", opacity: 0.8 }}>{status}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", flex: 1 }}>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_: any, node: { id: SetStateAction<string | null>; }) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}
          onEdgeClick={(_: any, edge: { id: SetStateAction<string | null>; }) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          fitView
          defaultEdgeOptions={{ animated: true }}
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>

        <div
          style={{
            borderLeft: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#111827",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          <strong>Config Flow</strong>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Nodo Start (router)</span>
            <select
              value={startNodeId}
              onChange={(e) => {
                setStartNodeId(e.target.value);
                setFlowId("");
              }}
            >
              <option value="">Seleccionar...</option>
              {routerNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id}
                </option>
              ))}
            </select>
          </label>

          {selectedNode && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
                display: "grid",
                gap: 8,
              }}
            >
              <strong>Nodo: {selectedNode.id}</strong>
              <small style={{ opacity: 0.7 }}>
                tipo: {selectedNode.data.type}
              </small>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12 }}>Model</span>
                <input
                  value={selectedNode.data.model}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, (current) => ({
                      ...current,
                      model: e.target.value,
                    }))
                  }
                />
              </label>
              {selectedNode.data.type === "router_llm" && (
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12 }}>Threshold (0..1)</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedNode.data.threshold}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, (current) => {
                        if (current.type !== "router_llm") return current;
                        return {
                          ...current,
                          threshold: Number(e.target.value),
                        };
                      })
                    }
                  />
                </label>
              )}
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12 }}>System</span>
                <textarea
                  rows={4}
                  value={selectedNode.data.system}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, (current) => ({
                      ...current,
                      system: e.target.value,
                    }))
                  }
                />
              </label>
              <button onClick={deleteSelectedNode}>Eliminar Nodo</button>
            </div>
          )}

          {selectedEdge && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
                display: "grid",
                gap: 8,
              }}
            >
              <strong>Edge: {selectedEdge.source} -&gt; {selectedEdge.target}</strong>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12 }}>Condición</span>
                <select
                  value={
                    selectedEdge.data?.when?.default
                      ? "default"
                      : selectedEdge.data?.when?.intent
                        ? "intent"
                        : "none"
                  }
                  onChange={(e) => {
                    if (e.target.value === "default") {
                      updateEdgeWhen(selectedEdge.id, { default: true });
                      return;
                    }
                    if (e.target.value === "intent") {
                      updateEdgeWhen(selectedEdge.id, { intent: "other", min_confidence: 0.6 });
                      return;
                    }
                    updateEdgeWhen(selectedEdge.id, {});
                  }}
                >
                  <option value="none">Sin condición</option>
                  <option value="intent">Intent + min_confidence</option>
                  <option value="default">Default</option>
                </select>
              </label>
              {selectedEdge.data?.when?.intent && !selectedEdge.data?.when?.default && (
                <>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12 }}>Intent</span>
                    <input
                      value={selectedEdge.data.when.intent}
                      onChange={(e) =>
                        updateEdgeWhen(selectedEdge.id, {
                          intent: e.target.value,
                          min_confidence: selectedEdge.data?.when?.min_confidence ?? 0,
                        })
                      }
                    />
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 12 }}>Min confidence (0..1)</span>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={selectedEdge.data.when.min_confidence ?? 0}
                      onChange={(e) =>
                        updateEdgeWhen(selectedEdge.id, {
                          intent: selectedEdge.data?.when?.intent,
                          min_confidence: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </>
              )}
              <button onClick={deleteSelectedEdge}>Eliminar Edge</button>
            </div>
          )}

          <strong>Chatbot (usa el flow guardado)</strong>
          <small style={{ opacity: 0.7 }}>
            conversation_id: <code>{conversationId}</code>
          </small>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 8,
              background: "#fafafa",
              color: "#111827",
            }}
          >
            {chatHistory.length === 0 ? (
              <p style={{ margin: 0, opacity: 0.7 }}>
                Escribí un mensaje para probar tu flow guardado con el backend.
              </p>
            ) : (
              chatHistory.map((line, idx) => (
                <div key={`${line.role}-${idx}`} style={{ marginBottom: 8 }}>
                  <strong>{line.role === "user" ? "Tu" : "Bot"}:</strong>{" "}
                  {line.text}
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Escribí tu mensaje..."
              style={{ flex: 1, color: "#111827", background: "#ffffff" }}
            />
            <button onClick={() => void sendMessage()} disabled={isSending}>
              {isSending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
