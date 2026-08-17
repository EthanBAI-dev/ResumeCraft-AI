import { condensePrompt } from "./condense";
import { expandPrompt } from "./expand";
import { generatePrompt } from "./generate";
import { rewritePrompt } from "./rewrite";
import { translatePrompt } from "./translate";
import type {
  BuiltResumePrompt,
  ResumePromptDefinition,
  ResumePromptInputMap,
  ResumePromptKind,
} from "./types";

export * from "./action-verbs";
export * from "./few-shot";
export * from "./safety";
export * from "./types";

export const RESUME_PROMPTS = {
  rewrite: rewritePrompt,
  expand: expandPrompt,
  condense: condensePrompt,
  translate: translatePrompt,
  generate: generatePrompt,
} satisfies { [K in ResumePromptKind]: ResumePromptDefinition<K> };

export function buildResumePrompt<K extends ResumePromptKind>(
  kind: K,
  input: ResumePromptInputMap[K],
): BuiltResumePrompt<K> {
  // TypeScript 无法在泛型索引后保留映射类型关联；注册表由上方 satisfies 保证一一对应。
  const definition = RESUME_PROMPTS[kind] as unknown as ResumePromptDefinition<K>;
  return definition.build(input);
}
