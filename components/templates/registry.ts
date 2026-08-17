import type { Layout } from "@/lib/layout/operations";

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
    name: "Modern",
    description: "主色标题条 + 双栏，信息密度高，适合技术岗",
    className: "tpl-modern",
    defaultColumnRatio: 0.66,
    defaultLayout: twoColumnLayout,
  },
  {
    id: "classic",
    name: "Classic",
    description: "居中抬头 + 分隔线单栏，最接近传统中文简历",
    className: "tpl-classic",
    defaultColumnRatio: 1,
    defaultLayout: singleColumnLayout,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "无装饰单栏，纯字重与留白，ATS 解析最稳",
    className: "tpl-minimal",
    defaultColumnRatio: 1,
    defaultLayout: singleColumnLayout,
  },
];

export const DEFAULT_TEMPLATE_ID = "modern";

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
