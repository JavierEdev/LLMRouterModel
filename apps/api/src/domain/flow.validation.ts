import type { Flow } from "./flow.ts";

type Errors = string[];

const pushIf = (errors: Errors, condition: boolean, message: string) => {
  if (condition) errors.push(message);
};

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const isNumber01 = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;

export function validateFlow(flow: Flow): string[] {
  const errors: Errors = [];

  if (!flow) return ["flow es requerido"];

  pushIf(errors, !isNonEmptyString(flow.start), "start es requerido");
  pushIf(
    errors,
    !Array.isArray(flow.nodes) || flow.nodes.length === 0,
    "nodes debe tener al menos 1 nodo",
  );

  if (errors.length) return errors;

  const nodeIds = new Set(flow.nodes.map((n) => n.id));
  pushIf(
    errors,
    isNonEmptyString(flow.start) && !nodeIds.has(flow.start),
    "start debe apuntar a un node.id existente",
  );

  for (const n of flow.nodes) {
    pushIf(errors, !isNonEmptyString(n.id), "node.id requerido");

    if (n.type === "router_llm") {
      pushIf(errors, !isNonEmptyString(n.data?.model), `router_llm(${n.id}): data.model requerido`);
      pushIf(errors, typeof n.data?.threshold !== "number", `router_llm(${n.id}): data.threshold debe ser number`);
      pushIf(errors, !isNonEmptyString(n.data?.system), `router_llm(${n.id}): data.system requerido`);
      continue;
    }

    if (n.type === "agent") {
      pushIf(errors, !isNonEmptyString(n.data?.model), `agent(${n.id}): data.model requerido`);
      pushIf(errors, !isNonEmptyString(n.data?.system), `agent(${n.id}): data.system requerido`);
      continue;
    }

    errors.push(`node.type inválido: ${String((n as any).type)}`);
  }

  const edges = Array.isArray(flow.edges) ? flow.edges : [];

  for (const e of edges) {
    pushIf(errors, !nodeIds.has(e.source), `edge.source no existe: ${e.source}`);
    pushIf(errors, !nodeIds.has(e.target), `edge.target no existe: ${e.target}`);

    const w = e.when ?? {};
    pushIf(
      errors,
      w.intent != null && !isNonEmptyString(w.intent),
      `edge.when.intent inválido: ${String(w.intent)}`,
    );
    pushIf(errors, w.min_confidence != null && !isNumber01(w.min_confidence), "edge.when.min_confidence debe estar entre 0 y 1");
    pushIf(errors, w.default != null && typeof w.default !== "boolean", "edge.when.default debe ser boolean");
  }

  const defaultCountBySource = new Map<string, number>();
  const unconditionalCountBySource = new Map<string, number>();
  for (const e of edges) {
    const w = e.when ?? {};
    if (w.default === true) {
      defaultCountBySource.set(e.source, (defaultCountBySource.get(e.source) ?? 0) + 1);
      continue;
    }

    if (!isNonEmptyString(w.intent)) {
      unconditionalCountBySource.set(e.source, (unconditionalCountBySource.get(e.source) ?? 0) + 1);
    }
  }

  for (const [src, count] of defaultCountBySource.entries()) {
    pushIf(errors, count > 1, `solo se permite 1 edge default por source (${src})`);
  }
  for (const [src, count] of unconditionalCountBySource.entries()) {
    pushIf(
      errors,
      count > 1,
      `solo se permite 1 edge sin condicion por source (${src}). Agrega when.intent o when.default`,
    );
  }

  return errors;
}
