import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { AiError } from "./errors";

export const AI_PROVIDERS = ["openai", "anthropic", "google", "deepseek"] as const;
export type AiProviderId = (typeof AI_PROVIDERS)[number];
export type AiModelReference = `${AiProviderId}:${string}`;

type Environment = Record<string, string | undefined>;
type ProviderSettings = { apiKey: string; baseURL?: string };
export type ProviderFactory = (settings: ProviderSettings, modelId: string) => LanguageModel;

const PROVIDER_CONFIG: Record<
  AiProviderId,
  { keyVariable: string; baseUrlVariable: string; defaultModel: string }
> = {
  openai: {
    keyVariable: "OPENAI_API_KEY",
    baseUrlVariable: "OPENAI_BASE_URL",
    defaultModel: "gpt-5.6-luna",
  },
  anthropic: {
    keyVariable: "ANTHROPIC_API_KEY",
    baseUrlVariable: "ANTHROPIC_BASE_URL",
    defaultModel: "claude-sonnet-4-6",
  },
  google: {
    keyVariable: "GOOGLE_GENERATIVE_AI_API_KEY",
    baseUrlVariable: "GOOGLE_GENERATIVE_AI_BASE_URL",
    defaultModel: "gemini-2.5-flash",
  },
  deepseek: {
    keyVariable: "DEEPSEEK_API_KEY",
    baseUrlVariable: "DEEPSEEK_BASE_URL",
    defaultModel: "deepseek-v4-flash",
  },
};

const DEFAULT_FACTORIES: Record<AiProviderId, ProviderFactory> = {
  openai: ({ apiKey, baseURL }, modelId) => createOpenAI({ apiKey, baseURL }).responses(modelId),
  anthropic: ({ apiKey, baseURL }, modelId) => createAnthropic({ apiKey, baseURL })(modelId),
  google: ({ apiKey, baseURL }, modelId) => createGoogleGenerativeAI({ apiKey, baseURL })(modelId),
  deepseek: ({ apiKey, baseURL }, modelId) => createDeepSeek({ apiKey, baseURL })(modelId),
};

export type ResolvedAiModel = {
  reference: AiModelReference;
  provider: AiProviderId;
  modelId: string;
  model: LanguageModel;
};

export function getModel(
  reference?: string,
  options: {
    env?: Environment;
    factories?: Partial<Record<AiProviderId, ProviderFactory>>;
  } = {},
): ResolvedAiModel {
  const env = options.env ?? process.env;
  const parsed = parseModelReference(reference ?? env.AI_DEFAULT_MODEL ?? "openai:gpt-5.6-luna");
  const config = PROVIDER_CONFIG[parsed.provider];
  const apiKey = env[config.keyVariable]?.trim();
  if (!apiKey) {
    throw new AiError({
      code: "configuration",
      message: `缺少 ${config.keyVariable}`,
      status: 503,
      provider: parsed.provider,
      model: parsed.modelId,
    });
  }

  const factory = options.factories?.[parsed.provider] ?? DEFAULT_FACTORIES[parsed.provider];
  return {
    ...parsed,
    model: factory(
      { apiKey, baseURL: env[config.baseUrlVariable]?.trim() || undefined },
      parsed.modelId,
    ),
  };
}

export function parseModelReference(value: string): {
  reference: AiModelReference;
  provider: AiProviderId;
  modelId: string;
} {
  const separator = value.indexOf(":");
  const provider = value.slice(0, separator).trim();
  const modelId = value.slice(separator + 1).trim();
  if (separator <= 0 || !isProviderId(provider) || !modelId) {
    throw new AiError({
      code: "configuration",
      message: `无效的 AI 模型引用：${value}`,
      status: 503,
    });
  }
  return {
    reference: `${provider}:${modelId}`,
    provider,
    modelId,
  };
}

export function getDefaultModelReference(provider: AiProviderId): AiModelReference {
  return `${provider}:${PROVIDER_CONFIG[provider].defaultModel}`;
}

export function listConfiguredProviders(env: Environment = process.env): AiProviderId[] {
  return AI_PROVIDERS.filter((provider) =>
    Boolean(env[PROVIDER_CONFIG[provider].keyVariable]?.trim()),
  );
}

function isProviderId(value: string): value is AiProviderId {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}
