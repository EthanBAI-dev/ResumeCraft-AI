import { describe, expect, it, vi } from "vitest";
import type { LanguageModel } from "ai";
import {
  getDefaultModelReference,
  getModel,
  listConfiguredProviders,
  parseModelReference,
} from "./provider";

describe("AI Provider 解析", () => {
  it("解析 provider:model，并允许模型名继续包含冒号", () => {
    expect(parseModelReference("openai:gpt-5.6-luna")).toEqual({
      reference: "openai:gpt-5.6-luna",
      provider: "openai",
      modelId: "gpt-5.6-luna",
    });
    expect(parseModelReference("deepseek:team:model").modelId).toBe("team:model");
    expect(() => parseModelReference("unknown:model")).toThrow("无效的 AI 模型引用");
  });

  it("缺少对应凭据时在调用 Provider 前失败", () => {
    expect(() => getModel("anthropic:claude-test", { env: {} })).toThrow("ANTHROPIC_API_KEY");
  });

  it("环境变量切模型并把 key/baseURL 交给唯一 Provider 工厂", () => {
    const model = {} as LanguageModel;
    const factory = vi.fn(() => model);
    const resolved = getModel(undefined, {
      env: {
        AI_DEFAULT_MODEL: "google:gemini-test",
        GOOGLE_GENERATIVE_AI_API_KEY: "secret",
        GOOGLE_GENERATIVE_AI_BASE_URL: "https://example.test",
      },
      factories: { google: factory },
    });

    expect(resolved).toMatchObject({
      reference: "google:gemini-test",
      provider: "google",
      modelId: "gemini-test",
      model,
    });
    expect(factory).toHaveBeenCalledWith(
      { apiKey: "secret", baseURL: "https://example.test" },
      "gemini-test",
    );
  });

  it("列出已配置 Provider，并提供各家默认模型引用", () => {
    expect(listConfiguredProviders({ OPENAI_API_KEY: "a", DEEPSEEK_API_KEY: "d" })).toEqual([
      "openai",
      "deepseek",
    ]);
    expect(getDefaultModelReference("openai")).toBe("openai:gpt-5.6-luna");
    expect(getDefaultModelReference("deepseek")).toBe("deepseek:deepseek-v4-flash");
  });

  it("OpenAI 工厂明确创建 Responses API 模型", () => {
    const resolved = getModel("openai:gpt-test", { env: { OPENAI_API_KEY: "test-key" } });
    expect(resolved.model).toMatchObject({ provider: "openai.responses", modelId: "gpt-test" });
  });
});
