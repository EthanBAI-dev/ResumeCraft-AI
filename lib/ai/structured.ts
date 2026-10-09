import { generateText, Output, type LanguageModelUsage } from "ai";
import { z } from "zod";
import { AiError, normalizeAiError } from "./errors";
import {
  envInteger,
  executeAiRequest,
  mergeLanguageModelUsage,
  type AiExecutionDependencies,
  type AiExecutionRequest,
  type AiExecutionResult,
  type AiExecutorInput,
} from "./execution";
import { buildResumePrompt } from "./prompts";
import type { ResumePromptInputMap, ResumePromptKind } from "./prompts";
import { ResumeAiOutputSchema } from "./output-schema";
export { ResumeAiOutputSchema, type ResumeAiOutput } from "./output-schema";

export type AiStructuredRequest<T> = AiExecutionRequest & {
  schema: z.ZodType<T>;
  schemaName: string;
  schemaDescription?: string;
};

export type AiStructuredResult<T> = Omit<AiExecutionResult<T>, "value"> & { object: T };

type StructuredExecutor<T> = (
  input: AiExecutorInput & {
    schema: z.ZodType<T>;
    schemaName: string;
    schemaDescription?: string;
  },
) => Promise<{
  object: unknown;
  finishReason: string;
  totalUsage: LanguageModelUsage;
}>;

export async function generateAiObject<T>(
  request: AiStructuredRequest<T>,
  dependencies: AiExecutionDependencies & { execute?: StructuredExecutor<T> } = {},
): Promise<AiStructuredResult<T>> {
  const { schema, schemaName, schemaDescription, ...executionRequest } = request;
  const { execute = executeStructuredOutput, ...executionDependencies } = dependencies;
  const result = await executeAiRequest(
    executionRequest,
    async (input) => {
      const usages: LanguageModelUsage[] = [];
      const validationRetries = envInteger("AI_SCHEMA_RETRIES", 1, 0, 2);

      for (let attempt = 0; attempt <= validationRetries; attempt += 1) {
        let generated: Awaited<ReturnType<StructuredExecutor<T>>>;
        try {
          generated = await execute({
            ...input,
            schema,
            schemaName,
            schemaDescription,
          });
        } catch (error) {
          const normalized = normalizeAiError(error);
          if (normalized.code === "invalid_response" && attempt < validationRetries) continue;
          throw error;
        }
        usages.push(generated.totalUsage);
        const parsed = schema.safeParse(generated.object);
        if (parsed.success) {
          return {
            value: parsed.data,
            finishReason: generated.finishReason,
            totalUsage: mergeLanguageModelUsage(usages),
          };
        }
        if (attempt === validationRetries) {
          throw new AiError({
            code: "invalid_response",
            message: "AI Provider 返回的数据不符合约定结构",
            retryable: true,
            status: 502,
            cause: parsed.error,
          });
        }
      }

      throw new AiError({ code: "invalid_response", message: "AI Provider 未返回可用对象" });
    },
    executionDependencies,
  );
  const { value, ...metadata } = result;
  return { object: value, ...metadata };
}

export async function runStructuredResumePrompt<K extends ResumePromptKind>(
  kind: K,
  input: ResumePromptInputMap[K],
  options: Pick<AiExecutionRequest, "model" | "userId" | "abortSignal" | "credentials"> = {},
) {
  const built = buildResumePrompt(kind, input);
  return generateAiObject({
    ...options,
    schema: ResumeAiOutputSchema,
    schemaName: "resume_highlight_result",
    schemaDescription: "经过事实约束的简历要点及仍需用户补充的事实",
    system: built.system,
    prompt: built.prompt,
    purpose: built.reference,
    temperature: built.temperature,
    maxOutputTokens: built.maxOutputTokens,
  });
}

async function executeStructuredOutput<T>(
  input: AiExecutorInput & {
    schema: z.ZodType<T>;
    schemaName: string;
    schemaDescription?: string;
  },
) {
  const { schema, schemaName, schemaDescription, ...generationInput } = input;
  const result = await generateText({
    ...generationInput,
    output: Output.object({
      schema,
      name: schemaName,
      description: schemaDescription,
    }),
  });
  return {
    object: result.output,
    finishReason: result.finishReason,
    totalUsage: result.totalUsage,
  };
}
