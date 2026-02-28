import { Handle, Position } from "@xyflow/react";

type RouterNodeData = {
  model?: string;
  threshold?: number;
};

export default function RouterNode({ data }: { data: RouterNodeData }) {
  return (
    <div
      style={{
        width: 220,
        padding: 10,
        borderRadius: 12,
        border: "1px solid #333",
        background: "#111",
        color: "#fff",
        boxShadow: "0 6px 18px rgba(0,0,0,.35)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Router LLM</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>model: {data.model}</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        threshold: {data.threshold}
      </div>

      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
