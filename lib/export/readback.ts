import type { ResumeData, Section } from "@/lib/schema";
import { flattenLayout } from "@/lib/layout/operations";

export type PdfReadbackReport = {
  expectedAnchors: number;
  matchedAnchors: number;
  coverage: number;
  orderScore: number;
  missing: string[];
  passes: boolean;
};

/**
 * 建立独立于 PDF 引擎的阅读锚点。锚点使用用户可见的值，而不是 JSON 字段名，
 * 因此可以同时用于 Chromium PDF、pdf.js 或第三方导出服务的文本层校验。
 */
export function collectResumeTextAnchors(resume: ResumeData): string[] {
  const anchors: string[] = [];
  const add = (value: string | undefined) => {
    const trimmed = value?.trim();
    if (trimmed && normalizeText(trimmed).length >= 2) anchors.push(trimmed);
  };

  add(resume.basics.name);
  add(resume.basics.headline);
  add(resume.basics.phone);
  add(resume.basics.email);
  add(resume.basics.location);
  add(resume.basics.url);
  resume.basics.customFields.forEach((field) => add(field.value));

  const seen = new Set<string>();
  for (const id of flattenLayout(resume.layout)) {
    if (id === "basics" || seen.has(id)) continue;
    seen.add(id);
    const section = resume.sections[id];
    if (!section?.visible) continue;
    add(section.name);
    collectSectionAnchors(section).forEach(add);
  }

  return anchors;
}

export function evaluatePdfReadback(resume: ResumeData, extractedText: string): PdfReadbackReport {
  const anchors = uniqueAnchors(collectResumeTextAnchors(resume));
  const extracted = normalizeText(extractedText);
  const positions = anchors.map((anchor) => extracted.indexOf(normalizeText(anchor)));
  const matched = positions.filter((position) => position >= 0);
  const missing = anchors.filter((_, index) => positions[index] < 0).map(compactPreview);

  // 不能把每个 anchor 都从文本开头 indexOf：例如“Java”是“Java / Go”的子串，
  // 会被错误定位到更早的技术栈行。游标只向前移动，才是在检验真实阅读顺序。
  let orderedMatches = 0;
  let cursor = 0;
  for (const anchor of anchors) {
    const normalized = normalizeText(anchor);
    const position = extracted.indexOf(normalized, cursor);
    if (position < 0) continue;
    orderedMatches++;
    cursor = position + normalized.length;
  }

  const coverage = anchors.length === 0 ? 1 : matched.length / anchors.length;
  const orderScore = matched.length === 0 ? 0 : orderedMatches / matched.length;
  return {
    expectedAnchors: anchors.length,
    matchedAnchors: matched.length,
    coverage,
    orderScore,
    missing,
    passes: coverage >= 0.98 && orderScore >= 0.95,
  };
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function collectSectionAnchors(section: Section): string[] {
  if (section.type === "summary") return [section.content];
  return section.items
    .filter((item) => item.visible)
    .flatMap((item) =>
      Object.entries(item)
        .filter(([key, value]) => key !== "id" && key !== "visible" && key !== "url" && value)
        .flatMap(([, value]) => (Array.isArray(value) ? value : [String(value)])),
    );
}

function uniqueAnchors(anchors: string[]) {
  const seen = new Set<string>();
  return anchors.filter((anchor) => {
    const normalized = normalizeText(anchor);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function compactPreview(value: string) {
  return value.length > 48 ? `${value.slice(0, 48)}…` : value;
}
