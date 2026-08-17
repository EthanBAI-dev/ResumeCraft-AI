import { generateText, type LanguageModelUsage } from "ai";
import {
  executeAiRequest,
  type AiExecutionDependencies,
  type AiExecutionRequest,
  type AiExecutorInput,
} from "./execution";
import type { AiProviderId } from "./provider";
import type { AiUsageRecord } from "./usage";

export type AiGenerateRequest = AiExecutionRequest;

export type AiGenerateResult = {
  text: string;
  provider: AiProviderId;
  model: string;
  finishReason: string;
  usage: Pick<
    AiUsageRecord,
    "inputTokens" | "outputTokens" | "totalTokens" | "cachedInputTokens" | "reasoningTokens"
  >;
};

type GenerateExecutor = (input: {
  model: AiExecutorInput["model"];
  prompt: AiExecutorInput["prompt"];
  system?: AiExecutorInput["system"];
  maxOutputTokens?: AiExecutorInput["maxOutputTokens"];
  temperature?: AiExecutorInput["temperature"];
  maxRetries: AiExecutorInput["maxRetries"];
  timeout: AiExecutorInput["timeout"];
  abortSignal?: AiExecutorInput["abortSignal"];
}) => Promise<{
  text: string;
  finishReason: string;
  totalUsage: LanguageModelUsage;
}>;

export async function generateAiText(
  request: AiGenerateRequest,
  dependencies: AiExecutionDependencies & {
    execute?: GenerateExecutor;
  } = {},
): Promise<AiGenerateResult> {
  const { execute: customExecute, ...executionDependencies } = dependencies;
  const execute = customExecute ?? executeGenerateText;
  const result = await executeAiRequest(
    request,
    async (input) => {
      const generated = await execute(input);
      return {
        value: generated.text,
        finishReason: generated.finishReason,
        totalUsage: generated.totalUsage,
      };
    },
    executionDependencies,
  );
  const { value, ...metadata } = result;
  return { text: value, ...metadata };
}

async function executeGenerateText(input: Parameters<GenerateExecutor>[0]) {
  return generateText(input);
}
