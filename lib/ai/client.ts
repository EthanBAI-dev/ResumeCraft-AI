import { z } from "zod";
import type { RewritePromptInput } from "./prompts";

const ResumeAiResponseSchema = z.object({
  data: z.object({
    highlights: z.array(z.string()),
    missingFacts: z.array(z.string()),
  }),
  meta: z.object({
    provider: z.string(),
    model: z.string(),
    finishReason: z.string(),
  }),
});

const ResumeAiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean().optional(),
  }),
});

export type ResumeAiClientResult = z.infer<typeof ResumeAiResponseSchema>;

export class ResumeAiClientError extends Error {
  constructor(
    message: string,
    readonly code = "unknown",
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ResumeAiClientError";
  }
}

export async function rewriteResumeHighlights(
  input: RewritePromptInput,
  signal?: AbortSignal,
): Promise<ResumeAiClientResult> {
  const response = await fetch("/api/ai/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "rewrite", input }),
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = ResumeAiErrorSchema.safeParse(payload);
    throw new ResumeAiClientError(
      parsedError.success ? parsedError.data.error.message : "AI 服务暂时不可用",
      parsedError.success ? parsedError.data.error.code : "unknown",
      parsedError.success ? (parsedError.data.error.retryable ?? false) : response.status >= 500,
    );
  }

  const parsed = ResumeAiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ResumeAiClientError("AI 返回了无法识别的数据", "invalid_response", true);
  }
  return parsed.data;
}
