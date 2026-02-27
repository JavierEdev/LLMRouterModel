import fs from "node:fs";
import path from "node:path";
import type { Flow } from "../../domain/flow.ts";
import type { IFlowStoreFs } from "./IFlowStoreFs.ts";

export class FlowStoreFs implements IFlowStoreFs {
  constructor(private baseDir: string) {
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  private filePath(flowId: string) {
    return path.join(this.baseDir, `${flowId}.json`);
  }

  async saveAs(flowId: string, flow: Flow): Promise<void> {
    await fs.promises.writeFile(this.filePath(flowId), JSON.stringify(flow, null, 2), "utf-8");
  }

  async get(flowId: string): Promise<Flow | null> {
    try {
      const raw = await fs.promises.readFile(this.filePath(flowId), "utf-8");
      return JSON.parse(raw) as Flow;
    } catch (e: any) {
      if (e?.code === "ENOENT") return null;
      throw e;
    }
  }
}