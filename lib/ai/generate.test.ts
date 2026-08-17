import { describe, expect, it, vi } from "vitest";
import type { LanguageModel, LanguageModelUsage } from "ai";
import { generateAiText } from "./generate";
import { InMemoryAiUsageRepository } from "./usage";

const model = {} as LanguageModel;
const usage: LanguageModelUsage = {
  inputTokens: 100,
  inputTokenDetails: { noCacheTokens: 80, cacheReadTokens: 20, cacheWriteTokens: 0 },
  outputTokens: 40,
  outputTokenDetails: { textTokens: 30, reasoningTokens: 10 },
  totalTokens: 140,
  raw: undefined,
};

describe("统一 AI 生成入口", () => {
  it("执行生成、透传边界配置并记录 token 用量", async () => {
    const repository = new InMemoryAiUsageRepository();
    const execute = vi.fn(async () => ({
      text: "优化结果",
      finishReason: "stop",
      totalUsage: usage,
    }));
    const timestamps = [1_000, 1_125];

    const result = await generateAiText(
      { prompt: "改写", purpose: "rewrite", userId: "user-1" },
      {
        repository,
        resolveModel: () => ({
          reference: "openai:gpt-test",
          provider: "openai",
          modelId: "gpt-test",
          model,
        }),
        execute,
        now: () => timestamps.shift() ?? 1_125,
        createId: () => "usage-1",
      },
    );

    expect(result).toEqual({
      text: "优化结果",
      provider: "openai",
      model: "gpt-test",
      finishReason: "stop",
      usage: {
        inputTokens: 100,
        outputTokens: 40,
        totalTokens: 140,
        cachedInputTokens: 20,
        reasoningTokens: 10,
      },
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        maxRetries: 2,
        timeout: { totalMs: 15_000, stepMs: 10_000 },
      }),
    );
    expect(repository.list()[0]).toMatchObject({
      id: "usage-1",
      userId: "user-1",
      purpose: "rewrite",
      status: "success",
      totalTokens: 140,
      latencyMs: 125,
    });
  });

  it("错误也进入用量仓库并以稳定错误码抛出", async () => {
    const repository = new InMemoryAiUsageRepository();
    await expect(
      generateAiText(
        { prompt: "改写", purpose: "rewrite" },
        {
          repository,
          resolveModel: () => ({
            reference: "deepseek:deepseek-test",
            provider: "deepseek",
            modelId: "deepseek-test",
            model,
          }),
          execute: async () => {
            throw new DOMException("timeout", "TimeoutError");
          },
          now: () => 1_000,
          createId: () => "usage-error",
        },
      ),
    ).rejects.toMatchObject({ code: "timeout", retryable: true, status: 504 });
    expect(repository.list()[0]).toMatchObject({
      id: "usage-error",
      provider: "deepseek",
      status: "error",
      errorCode: "timeout",
      totalTokens: 0,
    });
  });

  it("用量仓库故障会告警但不吞掉已生成结果", async () => {
    const onUsageError = vi.fn();
    const result = await generateAiText(
      { prompt: "改写", purpose: "rewrite" },
      {
        repository: {
          record: async () => {
            throw new Error("database unavailable");
          },
        },
        resolveModel: () => ({
          reference: "openai:gpt-test",
          provider: "openai",
          modelId: "gpt-test",
          model,
        }),
        execute: async () => ({ text: "仍然返回", finishReason: "stop", totalUsage: usage }),
        now: () => 1_000,
        createId: () => "usage-failed",
        onUsageError,
      },
    );

    expect(result.text).toBe("仍然返回");
    expect(onUsageError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "database unavailable" }),
    );
  });
});
