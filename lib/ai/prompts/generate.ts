import { boundedInteger, resolveLocale } from "./safety";
import { BASE_RESUME_SYSTEM, buildPromptBody } from "./shared";
import type { ResumePromptDefinition } from "./types";

const VERSION = "1.0.0";

export const generatePrompt: ResumePromptDefinition<"generate"> = {
  kind: "generate",
  version: VERSION,
  build: (input) => {
    const count = boundedInteger(input.count, 3, 1, 6);
    return {
      kind: "generate",
      version: VERSION,
      reference: `generate@${VERSION}`,
      system: BASE_RESUME_SYSTEM,
      prompt: buildPromptBody(
        "从原始经历中提炼可直接放入简历的要点。",
        input.rawExperience,
        input,
        {
          includeVerbs: true,
          includeFewShots: true,
          constraints: [
            `输出语言：${resolveLocale(input.locale)}。`,
            `最多输出 ${count} 条 highlights，按岗位相关性和影响力排序。`,
            "每条只陈述来源可支持的事实；不要把岗位描述中的要求写成候选人已经具备的经历。",
            "优先提炼行动、规模、方法和结果，缺失的可量化事实写入 missingFacts。",
          ],
        },
      ),
      temperature: 0.55,
      maxOutputTokens: 900,
    };
  },
};
