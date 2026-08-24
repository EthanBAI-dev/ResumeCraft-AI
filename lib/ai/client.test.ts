import { afterEach, describe, expect, it, vi } from "vitest";
import { ResumeAiClientError, rewriteResumeHighlights } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("AI 浏览器客户端", () => {
  it("解析结构化改写结果", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { highlights: ["主导支付链路重构"], missingFacts: [] },
          meta: { provider: "deepseek", model: "deepseek-chat", finishReason: "stop" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await rewriteResumeHighlights({ highlights: ["负责支付开发"] });
    expect(result.data.highlights).toEqual(["主导支付链路重构"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/resume",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("保留服务端可重试错误", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "rate_limit", message: "请求过于频繁", retryable: true },
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(rewriteResumeHighlights({ highlights: ["原文"] })).rejects.toMatchObject({
      code: "rate_limit",
      retryable: true,
      message: "请求过于频繁",
    } satisfies Partial<ResumeAiClientError>);
  });
});
