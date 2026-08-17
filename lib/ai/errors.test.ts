import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { AiError, normalizeAiError } from "./errors";

describe("AI 错误归一化", () => {
  it("保留配置错误", () => {
    const original = new AiError({ code: "configuration", message: "missing", status: 503 });
    expect(normalizeAiError(original)).toBe(original);

    const serialized = {
      name: "AiError",
      message: "rate limited",
      code: "rate_limit" as const,
      retryable: true,
      status: 429,
    };
    expect(normalizeAiError(serialized)).toBe(serialized);
  });

  it("把限流和鉴权错误映射为稳定错误码", () => {
    const rateLimit = new APICallError({
      message: "rate limited",
      url: "https://example.test",
      requestBodyValues: {},
      statusCode: 429,
      isRetryable: true,
    });
    const authentication = new APICallError({
      message: "unauthorized",
      url: "https://example.test",
      requestBodyValues: {},
      statusCode: 401,
    });
    expect(normalizeAiError(rateLimit)).toMatchObject({
      code: "rate_limit",
      retryable: true,
      status: 429,
    });
    expect(normalizeAiError(authentication)).toMatchObject({
      code: "authentication",
      retryable: false,
      status: 503,
    });
  });

  it("区分用户取消与总超时", () => {
    expect(normalizeAiError(new DOMException("cancel", "AbortError"))).toMatchObject({
      code: "aborted",
      status: 499,
    });
    expect(normalizeAiError(new DOMException("timeout", "TimeoutError"))).toMatchObject({
      code: "timeout",
      status: 504,
      retryable: true,
    });
  });
});
