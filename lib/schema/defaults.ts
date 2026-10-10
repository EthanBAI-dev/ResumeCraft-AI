import { nanoid } from "nanoid";
import { normalizeLayout, type Layout } from "@/lib/layout/operations";
import type { AnyItem } from "./items";
import { SECTION_TYPE_LABELS, SectionSchema, type Section, type SectionType } from "./section";
import { ResumeDataSchema, availableSectionIds, type ResumeData } from "./resume";

export const newId = () => nanoid(10);

/** 新建一个空条目。返回值故意宽松成 AnyItem —— 调用方通过 section.type 已经知道具体类型。 */
export function createItem(type: SectionType): AnyItem {
  const base = { id: newId(), visible: true };
  switch (type) {
    case "experience":
      return {
        ...base,
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        summary: "",
        highlights: [""],
        tech: [],
        url: "",
      };
    case "project":
      return {
        ...base,
        name: "",
        role: "",
        startDate: "",
        endDate: "",
        summary: "",
        highlights: [""],
        tech: [],
        url: "",
        repo: "",
      };
    case "education":
      return {
        ...base,
        school: "",
        degree: "",
        major: "",
        location: "",
        startDate: "",
        endDate: "",
        score: "",
        highlights: [],
        url: "",
      };
    case "skill":
      return { ...base, name: "", keywords: [], level: 0 };
    case "certificate":
      return { ...base, name: "", issuer: "", date: "", summary: "", url: "" };
    case "custom":
    case "summary":
    default:
      return {
        ...base,
        name: "",
        subtitle: "",
        startDate: "",
        endDate: "",
        summary: "",
        highlights: [""],
        url: "",
      };
  }
}

/** 新建一个空区块。内置类型用 type 当 id，自定义类型生成随机 id。 */
export function createSection(type: SectionType, name?: string): Section {
  const id = type === "custom" ? `custom-${newId()}` : type;
  const shell = { id, name: name ?? SECTION_TYPE_LABELS[type], visible: true, columns: 1 };

  if (type === "summary") return SectionSchema.parse({ ...shell, type, content: "" });
  return SectionSchema.parse({ ...shell, type, items: [] });
}

/** 空白简历：有骨架但没内容，用于"从零开始"入口 */
export function createEmptyResume(locale: "zh-CN" | "en-US" = "zh-CN"): ResumeData {
  const names =
    locale === "en-US" ? ["Summary", "Experience", "Projects", "Education", "Skills"] : [];
  const sections = [
    createSection("summary", names[0]),
    createSection("experience", names[1]),
    createSection("project", names[2]),
    createSection("education", names[3]),
    createSection("skill", names[4]),
  ];

  const layout: Layout = [
    [
      ["summary", "experience", "project"],
      ["basics", "skill", "education"],
    ],
  ];

  return ResumeDataSchema.parse({
    basics: {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      url: "",
      photo: { url: "", visible: false, size: 88, rounded: false },
      customFields: [],
    },
    sections: Object.fromEntries(sections.map((s) => [s.id, s])),
    layout,
    metadata: {
      template: "modern",
      itemLayouts: {},
      page: { format: "a4", margin: 16, showPageNumbers: false, columnRatio: 0.66 },
      theme: { primary: "#2563eb", text: "#18181b", muted: "#71717a", background: "#ffffff" },
      typography: {
        fontFamily: locale === "en-US" ? "Inter" : "Noto Sans SC",
        fontSize: 10.5,
        lineHeight: 1.5,
        sectionGap: 12,
        itemGap: 8,
      },
      locale,
      css: { visible: false, value: "" },
    },
  });
}

/**
 * 解析任意来源的简历 JSON（本地草稿 / 导入文件 / 接口返回）。
 * 除了 schema 校验，还会顺手修复 layout 的三条不变量 —— 脏 layout 会让预览直接白屏，
 * 而这类数据往往来自"上个版本的自己"，不能指望它合法。
 */
export function parseResume(input: unknown): ResumeData {
  const data = ResumeDataSchema.parse(input);
  return { ...data, layout: normalizeLayout(data.layout, availableSectionIds(data)) };
}

/** 安全版本：失败时回落到空白简历，并把错误交给调用方决定是否上报 */
export function parseResumeSafe(input: unknown): { data: ResumeData; error: unknown | null } {
  try {
    return { data: parseResume(input), error: null };
  } catch (error) {
    return { data: createEmptyResume(), error };
  }
}
