import type { LanguageModel, LanguageModelUsage } from "ai";
import { normalizeAiError } from "./errors";
import { getModel, type AiProviderId } from "./provider";
import { aiUsageRepository, type AiUsageRepository, type AiUsageRecord } from "./usage";

export type AiExecutionRequest = {
  prompt: string;
  system?: string;
  model?: string;
  purpose: string;
  userId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  abortSignal?: AbortSignal;
};

export type AiExecutorInput = {
  model: LanguageModel;
  prompt: string;
  system?: string;
  maxOutputTokens?: number;
  temperature?: number;
  maxRetries: number;
  timeout: { totalMs: number; stepMs: number };
  abortSignal?: AbortSignal;
};

export type AiExecutorResult<T> = {
  value: T;
  finishReason: string;
  totalUsage: LanguageModelUsage;
};

export type AiExecutionResult<T> = {
  value: T;
  provider: AiProviderId;
  model: string;
  finishReason: string;
  usage: Pick<
    AiUsageRecord,
    "inputTokens" | "outputTokens" | "totalTokens" | "cachedInputTokens" | "reasoningTokens"
  >;
};

export type AiExecutionDependencies = {
  repository?: AiUsageRepository;
  resolveModel?: typeof getModel;
  now?: () => number;
  createId?: () => string;
  onUsageError?: (error: unknown) => void;
};

export async function executeAiRequest<T>(
  request: AiExecutionRequest,
  execute: (input: AiExecutorInput) => Promise<AiExecutorResult<T>>,
  dependencies: AiExecutionDependencies = {},
): Promise<AiExecutionResult<T>> {
  const repository = dependencies.repository ?? aiUsageRepository;
  const resolveModel = dependencies.resolveModel ?? getModel;
  const now = dependencies.now ?? Date.now;
  const createId = dependencies.createId ?? (() => crypto.randomUUID());
  const onUsageError =
    dependencies.onUsageError ??
    ((error: unknown) => console.error("[resumecraft] AI 用量记录失败", error));
  const startedAt = now();
  const resolved = resolveModel(request.model);

  try {
    const result = await execute({
      model: resolved.model,
      prompt: request.prompt,
      system: request.system,
      maxOutputTokens: request.maxOutputTokens,
      temperature: request.temperature,
      maxRetries: envInteger("AI_MAX_RETRIES", 2, 0, 5),
      timeout: {
        totalMs: envInteger("AI_TOTAL_TIMEOUT_MS", 15_000, 1_000, 120_000),
        stepMs: envInteger("AI_STEP_TIMEOUT_MS", 10_000, 1_000, 120_000),
      },
      abortSignal: request.abortSignal,
    });
    const usage = normalizeLanguageModelUsage(result.totalUsage);
    await recordUsageSafely(repository, onUsageError, {
      id: createId(),
      createdAt: new Date(startedAt).toISOString(),
      userId: request.userId,
      purpose: request.purpose,
      provider: resolved.provider,
      model: resolved.modelId,
      status: "success",
      finishReason: result.finishReason,
      ...usage,
      latencyMs: Math.max(0, now() - startedAt),
    });
    return {
      value: result.value,
      provider: resolved.provider,
      model: resolved.modelId,
      finishReason: result.finishReason,
      usage,
    };
  } catch (error) {
    const normalized = normalizeAiError(error, {
      provider: resolved.provider,
      model: resolved.modelId,
      userAborted: request.abortSignal?.aborted,
    });
    await recordUsageSafely(repository, onUsageError, {
      id: createId(),
      createdAt: new Date(startedAt).toISOString(),
      userId: request.userId,
      purpose: request.purpose,
      provider: resolved.provider,
      model: resolved.modelId,
      status: "error",
      errorCode: normalized.code,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cachedInputTokens: 0,
      reasoningTokens: 0,
      latencyMs: Math.max(0, now() - startedAt),
    });
    throw normalized;
  }
}

export function normalizeLanguageModelUsage(usage: LanguageModelUsage) {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
    cachedInputTokens: usage.inputTokenDetails.cacheReadTokens ?? 0,
    reasoningTokens: usage.outputTokenDetails.reasoningTokens ?? 0,
  };
}

export function mergeLanguageModelUsage(usages: LanguageModelUsage[]): LanguageModelUsage {
  const totals = usages.map(normalizeLanguageModelUsage).reduce(
    (sum, usage) => ({
      inputTokens: sum.inputTokens + usage.inputTokens,
      outputTokens: sum.outputTokens + usage.outputTokens,
      totalTokens: sum.totalTokens + usage.totalTokens,
      cachedInputTokens: sum.cachedInputTokens + usage.cachedInputTokens,
      reasoningTokens: sum.reasoningTokens + usage.reasoningTokens,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0, cachedInputTokens: 0, reasoningTokens: 0 },
  );
  return {
    inputTokens: totals.inputTokens,
    inputTokenDetails: {
      noCacheTokens: totals.inputTokens - totals.cachedInputTokens,
      cacheReadTokens: totals.cachedInputTokens,
      cacheWriteTokens: 0,
    },
    outputTokens: totals.outputTokens,
    outputTokenDetails: {
      textTokens: totals.outputTokens - totals.reasoningTokens,
      reasoningTokens: totals.reasoningTokens,
    },
    totalTokens: totals.totalTokens,
    raw: undefined,
  };
}

export function envInteger(name: string, fallback: number, min: number, max: number) {
  const parsed = Number(process.env[name]);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

async function recordUsageSafely(
  repository: AiUsageRepository,
  onError: (error: unknown) => void,
  usage: AiUsageRecord,
) {
  try {
    await repository.record(usage);
  } catch (error) {
    // 生成请求已经产生费用；计量后端故障需要告警，但不能把成功结果伪装成模型失败。
    onError(error);
  }
}
