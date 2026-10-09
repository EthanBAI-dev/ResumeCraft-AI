import { afterEach, describe, expect, it, vi } from "vitest";
import type { LanguageModel, LanguageModelUsage } from "ai";
import { z } from "zod";
import { generateAiObject, ResumeAiOutputSchema } from "./structured";
import { InMemoryAiUsageRepository } from "./usage";

const model = {} as LanguageModel;

function usage(inputTokens: number, outputTokens: number): LanguageModelUsage {
  return {
    inputTokens,
    inputTokenDetails: {
      noCacheTokens: inputTokens,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    outputTokens,
    outputTokenDetails: { textTokens: outputTokens, reasoningTokens: 0 },
    totalTokens: inputTokens + outputTokens,
    raw: undefined,
  };
}

describe("AI 结构化输出", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("只返回通过 Zod Schema 的对象并记录模型用量", async () => {
    const repository = new InMemoryAiUsageRepository();
    const execute = vi.fn(async () => ({
      object: { highlights: ["主导缓存改造"], missingFacts: [] },
      finishReason: "stop",
      totalUsage: usage(20, 10),
    }));

    const result = await generateAiObject(
      {
        prompt: "改写",
        purpose: "rewrite@1.0.0",
        schema: ResumeAiOutputSchema,
        schemaName: "resume_highlight_result",
      },
      {
        repository,
        resolveModel: () => ({
          reference: "deepseek:deepseek-v4-flash",
          provider: "deepseek",
          modelId: "deepseek-v4-flash",
          model,
        }),
        execute,
        now: () => 1_000,
        createId: () => "structured-1",
      },
    );

    expect(result.object).toEqual({ highlights: ["主导缓存改造"], missingFacts: [] });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      }),
    );
    expect(result.usage.totalTokens).toBe(30);
    expect(repository.list()[0]).toMatchObject({
      purpose: "rewrite@1.0.0",
      provider: "deepseek",
      status: "success",
      totalTokens: 30,
    });
  });

  it("Schema 校验失败后重新生成，并累计成功链路的 token", async () => {
    vi.stubEnv("AI_SCHEMA_RETRIES", "1");
    const execute = vi
      .fn()
      .mockResolvedValueOnce({
        object: { highlights: [], missingFacts: [] },
        finishReason: "stop",
        totalUsage: usage(10, 5),
      })
      .mockResolvedValueOnce({
        object: { highlights: ["交付检索服务"], missingFacts: [] },
        finishReason: "stop",
        totalUsage: usage(12, 6),
      });

    const result = await generateAiObject(
      {
        prompt: "生成",
        purpose: "generate@1.0.0",
        schema: ResumeAiOutputSchema,
        schemaName: "resume_highlight_result",
      },
      {
        resolveModel: () => ({
          reference: "openai:test",
          provider: "openai",
          modelId: "test",
          model,
        }),
        execute,
      },
    );

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.usage).toMatchObject({ inputTokens: 22, outputTokens: 11, totalTokens: 33 });
  });

  it("超过结构修复预算后返回稳定 invalid_response 错误", async () => {
    vi.stubEnv("AI_SCHEMA_RETRIES", "0");
    const repository = new InMemoryAiUsageRepository();

    await expect(
      generateAiObject(
        {
          prompt: "生成",
          purpose: "generate@1.0.0",
          schema: z.object({ value: z.string().min(1) }),
          schemaName: "test_output",
        },
        {
          repository,
          resolveModel: () => ({
            reference: "google:test",
            provider: "google",
            modelId: "test",
            model,
          }),
          execute: async () => ({
            object: { value: "" },
            finishReason: "stop",
            totalUsage: usage(5, 2),
          }),
          createId: () => "structured-error",
        },
      ),
    ).rejects.toMatchObject({ code: "invalid_response", retryable: true, status: 502 });
    expect(repository.list()[0]).toMatchObject({
      id: "structured-error",
      status: "error",
      errorCode: "invalid_response",
    });
  });
});
