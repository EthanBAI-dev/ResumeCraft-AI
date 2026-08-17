import { generateAiText, type AiGenerateRequest, type AiGenerateResult } from "./generate";
import { buildResumePrompt } from "./prompts";
import type { ResumePromptInputMap, ResumePromptKind } from "./prompts";

export type RunResumePromptOptions = Pick<AiGenerateRequest, "model" | "userId" | "abortSignal">;

export async function runResumePrompt<K extends ResumePromptKind>(
  kind: K,
  input: ResumePromptInputMap[K],
  options: RunResumePromptOptions = {},
): Promise<AiGenerateResult> {
  const built = buildResumePrompt(kind, input);
  return generateAiText({
    ...options,
    system: built.system,
    prompt: built.prompt,
    purpose: built.reference,
    temperature: built.temperature,
    maxOutputTokens: built.maxOutputTokens,
  });
}
