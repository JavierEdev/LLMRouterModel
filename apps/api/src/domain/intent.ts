export const INTENTS = ["sales", "support", "other"] as const;
export type Intent = (typeof INTENTS)[number];

const INTENT_SET = new Set<string>(INTENTS);

export function isIntent(x: unknown): x is Intent {
  return typeof x === "string" && INTENT_SET.has(x);
}