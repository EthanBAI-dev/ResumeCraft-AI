import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateAiText } from "./generate";
import { runResumePrompt } from "./run-prompt";

vi.mock("./generate", () => ({
  generateAiText: vi.fn(async () => ({
    text: '{"highlights":[],"missingFacts":[]}',
    provider: "deepseek",
    model: "deepseek-v4-flash",
    finishReason: "stop",
    usage: {
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      cachedInputTokens: 0,
      reasoningTokens: 0,
    },
  })),
}));

describe("Prompt 统一执行入口", () => {
  beforeEach(() => vi.mocked(generateAiText).mockClear());

  it("把版本、模型、预算和取消信号交给生成层", async () => {
    const abortController = new AbortController();
    const result = await runResumePrompt(
      "rewrite",
      { highlights: ["负责缓存改造"] },
      {
        model: "deepseek:deepseek-v4-flash",
        userId: "user-1",
        abortSignal: abortController.signal,
      },
    );

    expect(result.model).toBe("deepseek-v4-flash");
    expect(generateAiText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek:deepseek-v4-flash",
        userId: "user-1",
        abortSignal: abortController.signal,
        purpose: "rewrite@1.0.0",
        temperature: 0.3,
        maxOutputTokens: 800,
      }),
    );
  });
});
