import { resolveLocale } from "./safety";
import { BASE_RESUME_SYSTEM, buildPromptBody } from "./shared";
import type { ResumePromptDefinition } from "./types";

const VERSION = "1.0.0";

export const expandPrompt: ResumePromptDefinition<"expand"> = {
  kind: "expand",
  version: VERSION,
  build: (input) => ({
    kind: "expand",
    version: VERSION,
    reference: `expand@${VERSION}`,
    system: BASE_RESUME_SYSTEM,
    prompt: buildPromptBody(
      "把一条过短经历扩写成一条具体、紧凑的简历要点。",
      input.highlight,
      input,
      {
        includeVerbs: true,
        includeFewShots: true,
        constraints: [
          `输出语言：${resolveLocale(input.locale)}。`,
          "最多输出 2 条 highlights；不要把同一事实拆成空泛的小句。",
          "补充表达结构而不是补充不存在的事实，必要信息放入 missingFacts。",
        ],
      },
    ),
    temperature: 0.45,
    maxOutputTokens: 600,
  }),
};
