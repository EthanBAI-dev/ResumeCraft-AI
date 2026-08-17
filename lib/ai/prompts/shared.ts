import { renderActionVerbGuidance } from "./action-verbs";
import { renderQuantifiedFewShots } from "./few-shot";
import {
  JSON_OUTPUT_SYSTEM_RULES,
  renderPromptContext,
  renderUntrustedBlock,
  UNTRUSTED_DATA_SYSTEM_RULES,
} from "./safety";
import type { ResumePromptContext } from "./types";

export const BASE_RESUME_SYSTEM = [
  "你是 ResumeCraft 的资深简历编辑，只处理可验证的职业经历。",
  UNTRUSTED_DATA_SYSTEM_RULES,
  JSON_OUTPUT_SYSTEM_RULES,
].join("\n\n");

export function buildPromptBody(
  task: string,
  source: unknown,
  context: ResumePromptContext,
  options: { includeVerbs?: boolean; includeFewShots?: boolean; constraints?: string[] } = {},
) {
  const sections = [
    `任务：${task}`,
    ...(options.constraints ?? []).map((constraint) => `- ${constraint}`),
  ];
  if (options.includeVerbs) sections.push(renderActionVerbGuidance());
  if (options.includeFewShots)
    sections.push(`参考示例（只学习写法，不复制事实）：\n${renderQuantifiedFewShots()}`);
  sections.push(renderPromptContext(context), renderUntrustedBlock("source_content", source));
  return sections.join("\n\n");
}
