import { describe, expect, it } from "vitest";
import { InMemoryAiUsageRepository, type AiUsageRecord } from "./usage";

const usage = (id: string): AiUsageRecord => ({
  id,
  createdAt: "2026-08-17T00:00:00.000Z",
  purpose: "test",
  provider: "openai",
  model: "gpt-test",
  status: "success",
  inputTokens: 10,
  outputTokens: 5,
  totalTokens: 15,
  cachedInputTokens: 2,
  reasoningTokens: 1,
  latencyMs: 100,
});

describe("AI 用量仓库", () => {
  it("有界保存并返回不可变快照", async () => {
    const repository = new InMemoryAiUsageRepository(2);
    await repository.record(usage("1"));
    await repository.record(usage("2"));
    await repository.record(usage("3"));
    expect(repository.list().map((record) => record.id)).toEqual(["2", "3"]);

    const snapshot = repository.list()[0] as AiUsageRecord;
    snapshot.totalTokens = 999;
    expect(repository.list()[0]?.totalTokens).toBe(15);
  });
});
