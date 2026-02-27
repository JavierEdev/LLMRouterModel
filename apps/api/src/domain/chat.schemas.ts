export const contentMsgSchema = {
  type: "object",
  required: ["role", "parts"],
  properties: {
    role: { type: "string", enum: ["user", "model"] },
    parts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string" } },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
} as const;

export const traceEventSchema = {
  type: "object",
  required: ["node", "type"],
  properties: {
    node: { type: "string" },
    type: { type: "string" },
    out: {},
  },
  additionalProperties: true,
} as const;

export const chatHttpRequestSchema = {
  type: "object",
  required: ["flow_id", "conversation_id", "message"],
  properties: {
    flow_id: { type: "string" },
    conversation_id: { type: "string" },
    message: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
} as const;