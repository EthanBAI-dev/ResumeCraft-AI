import { z } from "zod";
import { isAiError } from "@/lib/ai/errors";
import { runStructuredResumePrompt } from "@/lib/ai/structured";
import { getModel } from "@/lib/ai/provider";
import { acquireAiSlot, readSmallJson } from "@/lib/ai/public-guard";
import type { AiExecutionRequest } from "@/lib/ai/execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function allowsServerKey() {
  return process.env.NODE_ENV === "development" && process.env.AI_ALLOW_SERVER_KEY === "true";
}

/** Configuration status only; does not call the model or return any credentials. */
export function GET() {
  try {
    if (!allowsServerKey())
      return Response.json(
        { configured: false, mode: "byok" },
        { headers: { "Cache-Control": "no-store" } },
      );
    getModel();
    return Response.json({ configured: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ configured: false }, { headers: { "Cache-Control": "no-store" } });
  }
}

const CommonContextShape = {
  targetRole: z.string().trim().min(1).max(200).optional(),
  jobDescription: z.string().trim().min(1).max(12_000).optional(),
  locale: z.enum(["zh-CN", "en-US"]).optional(),
};

const Highlights = z.array(z.string().trim().min(1).max(300)).min(1).max(20);

export const ResumeAiRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("rewrite"),
    input: z.object({
      ...CommonContextShape,
      highlights: Highlights,
      tone: z.enum(["concise", "professional", "impactful"]).optional(),
    }),
  }),
  z.object({
    kind: z.literal("expand"),
    input: z.object({ ...CommonContextShape, highlight: z.string().trim().min(1).max(300) }),
  }),
  z.object({
    kind: z.literal("condense"),
    input: z.object({
      ...CommonContextShape,
      highlights: Highlights,
      maxChars: z.number().int().min(30).max(300).optional(),
    }),
  }),
  z.object({
    kind: z.literal("translate"),
    input: z.object({
      ...CommonContextShape,
      highlights: Highlights,
      targetLanguage: z.enum(["zh-CN", "en-US"]),
    }),
  }),
  z.object({
    kind: z.literal("generate"),
    input: z.object({
      ...CommonContextShape,
      rawExperience: z.string().trim().min(1).max(12_000),
      count: z.number().int().min(1).max(6).optional(),
    }),
  }),
]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: { code: "invalid_request", message: "不接受跨站请求" } },
      { status: 403 },
    );
  let body: unknown;
  try {
    body = await readSmallJson(request);
  } catch {
    return Response.json(
      { error: { code: "invalid_request", message: "请求体必须是 JSON" } },
      { status: 400 },
    );
  }

  const parsed = ResumeAiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "invalid_request", message: "AI 请求参数无效" } },
      { status: 400 },
    );
  }

  const key = request.headers.get("x-resumecraft-key")?.trim();
  const model = request.headers.get("x-resumecraft-model")?.trim() || "deepseek-flash";
  if ((key && !/^[\x21-\x7e]{8,256}$/.test(key)) || !/^[a-zA-Z0-9._-]{1,100}$/.test(model))
    return Response.json(
      { error: { code: "invalid_request", message: "密钥或模型格式不正确" } },
      { status: 400 },
    );
  if (!key && !allowsServerKey())
    return Response.json(
      {
        error: { code: "configuration", message: "请先在 AI 设置中输入你自己的 DeepSeek API Key" },
      },
      { status: 401 },
    );
  const release = acquireAiSlot(key || "local-server-key");
  if (!release)
    return Response.json(
      { error: { code: "rate_limit", message: "请求较多，请稍后再试" } },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  try {
    const result = await executeResumePrompt(
      parsed.data,
      request.signal,
      key ? { apiKey: key, model } : undefined,
    );
    return Response.json(
      {
        data: result.object,
        meta: {
          provider: result.provider,
          model: result.model,
          finishReason: result.finishReason,
          usage: result.usage,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isAiError(error)) {
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    // Never log raw SDK errors: they may contain Authorization/request payloads.
    console.error("[resumecraft] AI request failed (details redacted)");
    return Response.json(
      { error: { code: "unknown", message: "AI 请求失败", retryable: false } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    release();
  }
}

type ResumeAiRequest = z.infer<typeof ResumeAiRequestSchema>;

function executeResumePrompt(
  request: ResumeAiRequest,
  abortSignal: AbortSignal,
  credentials?: AiExecutionRequest["credentials"],
) {
  switch (request.kind) {
    case "rewrite":
      return runStructuredResumePrompt("rewrite", request.input, { abortSignal, credentials });
    case "expand":
      return runStructuredResumePrompt("expand", request.input, { abortSignal, credentials });
    case "condense":
      return runStructuredResumePrompt("condense", request.input, { abortSignal, credentials });
    case "translate":
      return runStructuredResumePrompt("translate", request.input, { abortSignal, credentials });
    case "generate":
      return runStructuredResumePrompt("generate", request.input, { abortSignal, credentials });
  }
}
