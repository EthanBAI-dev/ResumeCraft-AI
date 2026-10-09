import { resolveLocale, resolveTone } from "./safety";
import { BASE_RESUME_SYSTEM, buildPromptBody } from "./shared";
import type { ResumePromptDefinition } from "./types";

const VERSION = "1.0.1";

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
        "保持输入条目数量。只改进原文表达；没有结果时只写行动与对象，不补齐结果结构。",
        "只能保留来源中存在的数字；缺少量化信息时不要猜测。",
        "保持原始责任级别，不得把参与、协助或负责升级为主导、独立完成；未给出的稳定性、效率或业务成果不得补写。",
      ],
    }),
    temperature: 0.3,
    maxOutputTokens: 800,
  }),
};
