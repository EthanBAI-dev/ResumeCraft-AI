import { beforeEach, describe, expect, it, vi } from "vitest";
import { runStructuredResumePrompt } from "@/lib/ai/structured";
import { POST } from "./route";

vi.mock("@/lib/ai/structured", () => ({ runStructuredResumePrompt: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/ai/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/resume", () => {
  beforeEach(() => vi.mocked(runStructuredResumePrompt).mockReset());

  it("拒绝非法 JSON、未知任务和无界输入", async () => {
    const invalidJson = new Request("http://localhost/api/ai/resume", {
      method: "POST",
      body: "not-json",
    });

    expect((await POST(invalidJson)).status).toBe(400);
    expect((await POST(request({ kind: "delete", input: {} }))).status).toBe(400);
    expect(
      (await POST(request({ kind: "generate", input: { rawExperience: "x".repeat(12_001) } })))
        .status,
    ).toBe(400);
    expect(runStructuredResumePrompt).not.toHaveBeenCalled();
  });

  it("返回通过 Schema 的对象、模型元数据并禁用缓存", async () => {
    vi.mocked(runStructuredResumePrompt).mockResolvedValue({
      object: { highlights: ["主导检索服务重构"], missingFacts: ["峰值请求量"] },
      provider: "deepseek",
      model: "deepseek-v4-flash",
      finishReason: "stop",
      usage: {
        inputTokens: 100,
        outputTokens: 30,
        totalTokens: 130,
        cachedInputTokens: 0,
        reasoningTokens: 0,
      },
    });

    const response = await POST(
      request({
        kind: "generate",
        input: { rawExperience: "维护检索服务", count: 3, jobDescription: "后端工程师" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      data: { highlights: ["主导检索服务重构"] },
      meta: { provider: "deepseek", model: "deepseek-v4-flash" },
    });
    expect(runStructuredResumePrompt).toHaveBeenCalledWith(
      "generate",
      expect.objectContaining({ rawExperience: "维护检索服务", count: 3 }),
      expect.objectContaining({ abortSignal: expect.any(AbortSignal) }),
    );
  });

  it("把稳定 AI 错误映射为不泄露 Provider 细节的 HTTP 响应", async () => {
    vi.mocked(runStructuredResumePrompt).mockImplementationOnce(async () => {
      throw {
        name: "AiError",
        code: "rate_limit",
        message: "AI Provider 请求过于频繁",
        retryable: true,
        status: 429,
        cause: new Error("secret upstream payload"),
      };
    });

    const response = await POST(request({ kind: "rewrite", input: { highlights: ["负责缓存"] } }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: {
        code: "rate_limit",
        message: "AI Provider 请求过于频繁",
        retryable: true,
      },
    });
    expect(JSON.stringify(body)).not.toContain("secret upstream payload");
  });
});
