import type { SectionType } from "@/lib/schema";

/**
 * 表单字段的声明式定义。
 *
 * 和 Zod schema 一样是"一份定义驱动多处"的思路：这里改一行就能给某类条目加一个字段，
 * 不用去动任何 JSX。P4 的 AI 面板也会读这张表来决定"哪些字段可以让模型改写"。
 */
export type FieldKind = "text" | "textarea" | "tags" | "date" | "endDate";

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  /** 占半行还是整行 */
  span?: 1 | 2;
  /** 可以交给 AI 改写的字段（P4 用） */
  aiWritable?: boolean;
};

export const ITEM_FIELDS: Record<Exclude<SectionType, "summary">, FieldDef[]> = {
  experience: [
    { key: "company", label: "公司", kind: "text", placeholder: "某科技有限公司" },
    { key: "position", label: "职位", kind: "text", placeholder: "后端开发工程师" },
    { key: "startDate", label: "开始时间", kind: "date", placeholder: "2023-07" },
    { key: "endDate", label: "结束时间", kind: "endDate", placeholder: "2025-06 或留空" },
    { key: "location", label: "城市", kind: "text", placeholder: "杭州" },
    { key: "url", label: "链接", kind: "text", placeholder: "https://..." },
    { key: "summary", label: "一句话概述", kind: "textarea", span: 2, aiWritable: true },
    { key: "tech", label: "技术栈", kind: "tags", span: 2 },
  ],
  project: [
    { key: "name", label: "项目名称", kind: "text", placeholder: "分布式任务调度平台" },
    { key: "role", label: "担任角色", kind: "text", placeholder: "核心开发" },
    { key: "startDate", label: "开始时间", kind: "date" },
    { key: "endDate", label: "结束时间", kind: "endDate" },
    { key: "repo", label: "仓库", kind: "text", placeholder: "https://github.com/..." },
    { key: "url", label: "线上地址", kind: "text", placeholder: "https://..." },
    { key: "summary", label: "一句话概述", kind: "textarea", span: 2, aiWritable: true },
    { key: "tech", label: "技术栈", kind: "tags", span: 2 },
  ],
  education: [
    { key: "school", label: "学校", kind: "text", placeholder: "某大学" },
    { key: "major", label: "专业", kind: "text", placeholder: "计算机科学与技术" },
    { key: "degree", label: "学历", kind: "text", placeholder: "本科 / 硕士" },
    { key: "location", label: "城市", kind: "text" },
    { key: "startDate", label: "入学时间", kind: "date" },
    { key: "endDate", label: "毕业时间", kind: "endDate" },
    {
      key: "score",
      label: "成绩 / 排名",
      kind: "text",
      span: 2,
      placeholder: "GPA 3.7/4.0，专业前 10%",
    },
  ],
  skill: [
    { key: "name", label: "分类", kind: "text", placeholder: "语言 / 框架 / 中间件" },
    {
      key: "keywords",
      label: "关键词",
      kind: "tags",
      span: 2,
      placeholder: "Java、Spring Boot、MySQL",
    },
  ],
  certificate: [
    { key: "name", label: "名称", kind: "text", placeholder: "ICPC 区域赛银奖" },
    { key: "issuer", label: "颁发机构", kind: "text" },
    { key: "date", label: "时间", kind: "date" },
    { key: "url", label: "链接", kind: "text" },
    { key: "summary", label: "备注", kind: "textarea", span: 2, aiWritable: true },
  ],
  custom: [
    { key: "name", label: "标题", kind: "text" },
    { key: "subtitle", label: "副标题", kind: "text" },
    { key: "startDate", label: "开始时间", kind: "date" },
    { key: "endDate", label: "结束时间", kind: "endDate" },
    { key: "summary", label: "描述", kind: "textarea", span: 2, aiWritable: true },
  ],
};

/** 哪些区块类型有 highlights（bullet 列表）—— AI 与 ATS 的主战场 */
export const HAS_HIGHLIGHTS: Record<Exclude<SectionType, "summary">, boolean> = {
  experience: true,
  project: true,
  education: true,
  skill: false,
  certificate: false,
  custom: true,
};

/** 条目在列表折叠时显示的标题字段优先级 */
export const ITEM_TITLE_KEYS: Record<Exclude<SectionType, "summary">, string[]> = {
  experience: ["company", "position"],
  project: ["name", "role"],
  education: ["school", "major"],
  skill: ["name"],
  certificate: ["name", "issuer"],
  custom: ["name", "subtitle"],
};
