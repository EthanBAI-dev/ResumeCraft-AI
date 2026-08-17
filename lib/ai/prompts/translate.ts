import { resolveLocale } from "./safety";
import { BASE_RESUME_SYSTEM, buildPromptBody } from "./shared";
import type { ResumePromptDefinition } from "./types";

const VERSION = "1.0.0";

export const translatePrompt: ResumePromptDefinition<"translate"> = {
  kind: "translate",
  version: VERSION,
  build: (input) => ({
    kind: "translate",
    version: VERSION,
    reference: `translate@${VERSION}`,
    system: BASE_RESUME_SYSTEM,
    prompt: buildPromptBody(
      "翻译简历要点，并使用目标语言的专业简历表达。",
      input.highlights,
      input,
      {
        constraints: [
          `目标语言：${resolveLocale(input.targetLanguage)}。`,
          "保持输入条目数量、事实、专有名词、技术名和全部数字不变。",
          "不要音译已有公认译法的职业术语，也不要额外润色出新成果。",
        ],
      },
    ),
    temperature: 0.1,
    maxOutputTokens: 700,
  }),
};
