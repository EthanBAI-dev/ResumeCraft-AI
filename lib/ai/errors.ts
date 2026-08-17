import { APICallError, NoContentGeneratedError, RetryError } from "ai";

export type AiErrorCode =
  | "configuration"
  | "authentication"
  | "rate_limit"
  | "timeout"
  | "aborted"
  | "invalid_response"
  | "provider_unavailable"
  | "unknown";

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;
  readonly status: number;
  readonly provider?: string;
  readonly model?: string;

  constructor({
    code,
    message,
    retryable = false,
    status = 500,
    provider,
    model,
    cause,
  }: {
    code: AiErrorCode;
    message: string;
    retryable?: boolean;
    status?: number;
    provider?: string;
    model?: string;
    cause?: unknown;
  }) {
    super(message, { cause });
    this.name = "AiError";
    this.code = code;
    this.retryable = retryable;
    this.status = status;
    this.provider = provider;
    this.model = model;
  }
}

export function normalizeAiError(
  error: unknown,
  context: { provider?: string; model?: string; userAborted?: boolean } = {},
): AiError {
  if (error instanceof AiError) return error;
  const leaf = RetryError.isInstance(error) ? error.lastError : error;
  const base = { provider: context.provider, model: context.model, cause: error };

  if (context.userAborted || isAbortError(leaf)) {
    return new AiError({
      ...base,
      code: "aborted",
      message: "AI 请求已取消",
      status: 499,
    });
  }
  if (isTimeoutError(leaf)) {
    return new AiError({
      ...base,
      code: "timeout",
      message: "AI 服务响应超时",
      retryable: true,
      status: 504,
    });
  }
  if (APICallError.isInstance(leaf)) {
    if (leaf.statusCode === 401 || leaf.statusCode === 403) {
      return new AiError({
        ...base,
        code: "authentication",
        message: "AI Provider 凭据无效",
        status: 503,
      });
    }
    if (leaf.statusCode === 429) {
      return new AiError({
        ...base,
        code: "rate_limit",
        message: "AI Provider 请求过于频繁",
        retryable: true,
        status: 429,
      });
    }
    return new AiError({
      ...base,
      code: "provider_unavailable",
      message: "AI Provider 暂时不可用",
      retryable: leaf.isRetryable,
      status: leaf.isRetryable ? 503 : 502,
    });
  }
  if (NoContentGeneratedError.isInstance(leaf)) {
    return new AiError({
      ...base,
      code: "invalid_response",
      message: "AI Provider 未返回可用内容",
      retryable: true,
      status: 502,
    });
  }

  return new AiError({ ...base, code: "unknown", message: "AI 请求失败" });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function isTimeoutError(error: unknown) {
  if (error instanceof DOMException && error.name === "TimeoutError") return true;
  return error instanceof Error && /timed?\s*out|timeout/i.test(error.message);
}
