import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runStructuredResumePrompt } from "@/lib/ai/structured";
import { POST } from "./route";

vi.mock("@/lib/ai/structured", () => ({ runStructuredResumePrompt: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/ai/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-ResumeCraft-Key": "test-user-key-only" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/resume", () => {
  beforeEach(() => vi.mocked(runStructuredResumePrompt).mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it("公开模式没有用户密钥时绝不回退到站长密钥", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_ALLOW_SERVER_KEY", "true");
    vi.stubEnv("DEEPSEEK_API_KEY", "owner-secret");
    const req = request({ kind: "rewrite", input: { highlights: ["负责缓存"] } });
    req.headers.delete("x-resumecraft-key");
    expect((await POST(req)).status).toBe(401);
    expect(runStructuredResumePrompt).not.toHaveBeenCalled();
  });

  it("拒绝跨站请求与超大请求体", async () => {
    const req = request({ kind: "rewrite", input: { highlights: ["负责缓存"] } });
    req.headers.set("origin", "https://untrusted.example");
    expect((await POST(req)).status).toBe(403);
    expect((await POST(request({ padding: "x".repeat(128001) }))).status).toBe(400);
  });

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
      expect.objectContaining({
        abortSignal: expect.any(AbortSignal),
        credentials: { apiKey: "test-user-key-only", model: "deepseek-flash" },
      }),
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
