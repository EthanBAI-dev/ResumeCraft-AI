import { z } from "zod";
import { isAiError } from "@/lib/ai/errors";
import { runStructuredResumePrompt } from "@/lib/ai/structured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  let body: unknown;
  try {
    body = await request.json();
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

  try {
    const result = await executeResumePrompt(parsed.data, request.signal);
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
    console.error("[resumecraft] 未处理的 AI Route 错误", error);
    return Response.json(
      { error: { code: "unknown", message: "AI 请求失败", retryable: false } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

type ResumeAiRequest = z.infer<typeof ResumeAiRequestSchema>;

function executeResumePrompt(request: ResumeAiRequest, abortSignal: AbortSignal) {
  switch (request.kind) {
    case "rewrite":
      return runStructuredResumePrompt("rewrite", request.input, { abortSignal });
    case "expand":
      return runStructuredResumePrompt("expand", request.input, { abortSignal });
    case "condense":
      return runStructuredResumePrompt("condense", request.input, { abortSignal });
    case "translate":
      return runStructuredResumePrompt("translate", request.input, { abortSignal });
    case "generate":
      return runStructuredResumePrompt("generate", request.input, { abortSignal });
  }
}
