import type { Layout } from "@/lib/layout/operations";
import { flattenLayout } from "@/lib/layout/operations";
import type { ResumeData } from "@/lib/schema";

/**
 * 模板注册表。
 *
 * 目标（P2 Day 10 的验收标准）：新增一套模板 = 一段 CSS + 这里一条记录，
 * 不修改任何渲染/拖拽/导出逻辑。所以模板定义里只有"数据"，没有组件——
 * 视觉差异全部通过根节点 className 由 CSS 表达（见 app/globals.css）。
 */
export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  accent: string;
  fontFamily: string;
  /** 挂在简历根节点上的 class，模板样式的入口 */
  className: string;
  /** 该模板推荐的主栏占比；1 = 单栏 */
  defaultColumnRatio: number;
  /** 该模板推荐的默认区块分布：把可用区块分成主栏 / 侧栏两组 */
  defaultLayout: (sectionIds: string[]) => Layout;
};

/** 双栏默认：正文类进主栏，信息类进侧栏 */
const SIDEBAR_PREFERRED = new Set(["basics", "skill", "education", "certificate"]);

const twoColumnLayout = (ids: string[]): Layout => [
  [ids.filter((id) => !SIDEBAR_PREFERRED.has(id)), ids.filter((id) => SIDEBAR_PREFERRED.has(id))],
];

const singleColumnLayout = (ids: string[]): Layout => [
  [["basics", ...ids.filter((id) => id !== "basics")], []],
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "modern",
    name: "现代 · Modern",
    description: "清晰双栏 · 技术与产品",
    accent: "#25635b",
    fontFamily: "Noto Sans SC",
    className: "tpl-modern",
    defaultColumnRatio: 0.66,
    defaultLayout: twoColumnLayout,
  },
  {
    id: "classic",
    name: "经典 · Classic",
    description: "居中抬头 · 正式与通用",
    accent: "#334155",
    fontFamily: "Noto Serif SC",
    className: "tpl-classic",
    defaultColumnRatio: 1,
    defaultLayout: singleColumnLayout,
  },
  {
    id: "minimal",
    name: "留白 · Minimal",
    description: "纯粹单栏 · 简洁与克制",
    accent: "#27272a",
    fontFamily: "Inter",
    className: "tpl-minimal",
    defaultColumnRatio: 1,
    defaultLayout: singleColumnLayout,
  },
  {
    id: "executive",
    name: "商务 · Executive",
    description: "深蓝题头 · 管理与咨询",
    accent: "#243d5b",
    fontFamily: "Noto Sans SC",
    className: "tpl-executive",
    defaultColumnRatio: 1,
    defaultLayout: singleColumnLayout,
  },
  {
    id: "editorial",
    name: "刊物 · Editorial",
    description: "宋体标题 · 设计与内容",
    accent: "#924d3d",
    fontFamily: "Noto Serif SC",
    className: "tpl-editorial",
    defaultColumnRatio: 1,
    defaultLayout: singleColumnLayout,
  },
  {
    id: "nordic",
    name: "北欧 · Nordic",
    description: "鼠尾草绿 · 轻盈双栏",
    accent: "#4f6b60",
    fontFamily: "Noto Sans SC",
    className: "tpl-nordic",
    defaultColumnRatio: 0.64,
    defaultLayout: twoColumnLayout,
  },
];

export const DEFAULT_TEMPLATE_ID = "modern";

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** A preset is one atomic change: content is retained and undo restores the entire design. */
export function applyTemplateToResume(resume: ResumeData, id: string): ResumeData {
  const template = getTemplate(id);
  const ids = [
    ...new Set([...flattenLayout(resume.layout), "basics", ...Object.keys(resume.sections)]),
  ].filter((key) => key === "basics" || resume.sections[key]);
  const sidebar = (key: string) =>
    key === "basics" || SIDEBAR_PREFERRED.has(resume.sections[key]?.type);
  const layout =
    template.defaultColumnRatio < 1
      ? [[ids.filter((key) => !sidebar(key)), ids.filter(sidebar)]]
      : singleColumnLayout(ids);
  return {
    ...resume,
    layout,
    metadata: {
      ...resume.metadata,
      template: template.id,
      page: { ...resume.metadata.page, columnRatio: template.defaultColumnRatio },
      theme: { ...resume.metadata.theme, primary: template.accent },
      typography: {
        ...resume.metadata.typography,
        fontFamily:
          resume.metadata.locale === "en-US"
            ? template.id === "editorial" || template.id === "classic"
              ? "Georgia"
              : "Inter"
            : template.fontFamily,
      },
    },
  };
}
