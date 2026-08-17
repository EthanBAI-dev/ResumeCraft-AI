import { boundedInteger, resolveLocale } from "./safety";
import { BASE_RESUME_SYSTEM, buildPromptBody } from "./shared";
import type { ResumePromptDefinition } from "./types";

const VERSION = "1.0.0";

export const condensePrompt: ResumePromptDefinition<"condense"> = {
  kind: "condense",
  version: VERSION,
  build: (input) => {
    const maxChars = boundedInteger(input.maxChars, 80, 30, 300);
    return {
      kind: "condense",
      version: VERSION,
      reference: `condense@${VERSION}`,
      system: BASE_RESUME_SYSTEM,
      prompt: buildPromptBody(
        "压缩简历要点，优先保留行动、范围、技术与量化结果。",
        input.highlights,
        input,
        {
          includeVerbs: true,
          constraints: [
            `输出语言：${resolveLocale(input.locale)}。`,
            `每条不超过 ${maxChars} 个字符。`,
            "保持输入条目数量，不合并互不相关的事实。",
            "删除套话和重复修饰，不删除来源已有的关键数字。",
          ],
        },
      ),
      temperature: 0.2,
      maxOutputTokens: 600,
    };
  },
};
