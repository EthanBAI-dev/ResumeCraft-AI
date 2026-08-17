import type { AiErrorCode } from "./errors";
import type { AiProviderId } from "./provider";

export type AiUsageRecord = {
  id: string;
  createdAt: string;
  userId?: string;
  purpose: string;
  provider: AiProviderId;
  model: string;
  status: "success" | "error";
  finishReason?: string;
  errorCode?: AiErrorCode;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
  latencyMs: number;
};

/** 数据库实现只需满足这个接口；调用层不感知 Prisma、Postgres 或测试内存仓库。 */
export interface AiUsageRepository {
  record(usage: AiUsageRecord): Promise<void>;
}

export class InMemoryAiUsageRepository implements AiUsageRepository {
  readonly #records: AiUsageRecord[] = [];
  readonly #limit: number;

  constructor(limit = 1_000) {
    this.#limit = Math.max(1, limit);
  }

  async record(usage: AiUsageRecord) {
    this.#records.push(structuredClone(usage));
    if (this.#records.length > this.#limit)
      this.#records.splice(0, this.#records.length - this.#limit);
  }

  list(): readonly AiUsageRecord[] {
    return this.#records.map((record) => structuredClone(record));
  }

  clear() {
    this.#records.length = 0;
  }
}

export const aiUsageRepository = new InMemoryAiUsageRepository();
