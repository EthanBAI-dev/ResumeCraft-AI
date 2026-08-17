import { resolveLocale, resolveTone } from "./safety";
import { BASE_RESUME_SYSTEM, buildPromptBody } from "./shared";
import type { ResumePromptDefinition } from "./types";

const VERSION = "1.0.0";

export const rewritePrompt: ResumePromptDefinition<"rewrite"> = {
  kind: "rewrite",
  version: VERSION,
  build: (input) => ({
    kind: "rewrite",
    version: VERSION,
    reference: `rewrite@${VERSION}`,
    system: BASE_RESUME_SYSTEM,
    prompt: buildPromptBody("在不改变事实的前提下改写全部简历要点。", input.highlights, input, {
      includeVerbs: true,
      includeFewShots: true,
      constraints: [
        `语气：${resolveTone(input.tone)}。`,
        `输出语言：${resolveLocale(input.locale)}。`,
        "每条采用“行动 + 对象/方法 + 可验证结果”的结构，并保持输入条目数量。",
        "只能保留来源中存在的数字；缺少量化信息时不要猜测。",
      ],
    }),
    temperature: 0.3,
    maxOutputTokens: 800,
  }),
};
