import { z } from "zod";
import { DateField, EndDateField, Id, NonEmpty, UrlField } from "./primitives";

/**
 * 每类区块的条目定义。
 *
 * 设计要点：`highlights: string[]` 是整个数据模型最关键的字段。
 * AI 改写的粒度、ATS 扣分的粒度、diff 审阅的粒度都是「一条 highlight」。
 * 如果这里做成一整块富文本，后面三个功能全都做不了。
 */

export const ItemBase = z.object({
  id: Id,
  visible: z.boolean().default(true),
});

export const HighlightList = z
  .array(z.string().trim().max(300, "单条描述不要超过 300 字"))
  .default([]);

export const TagList = z.array(z.string().trim().min(1)).default([]);

export const ExperienceItemSchema = ItemBase.extend({
  company: NonEmpty("公司名称"),
  position: NonEmpty("职位"),
  location: z.string().trim().default(""),
  startDate: DateField,
  endDate: EndDateField,
  summary: z.string().trim().max(500).default(""),
  highlights: HighlightList,
  tech: TagList,
  url: UrlField,
});

export const ProjectItemSchema = ItemBase.extend({
  name: NonEmpty("项目名称"),
  role: z.string().trim().default(""),
  startDate: DateField,
  endDate: EndDateField,
  summary: z.string().trim().max(500).default(""),
  highlights: HighlightList,
  tech: TagList,
  url: UrlField,
  repo: UrlField,
});

export const EducationItemSchema = ItemBase.extend({
  school: NonEmpty("学校名称"),
  degree: z.string().trim().default(""),
  major: z.string().trim().default(""),
  location: z.string().trim().default(""),
  startDate: DateField,
  endDate: EndDateField,
  score: z.string().trim().default(""), // GPA / 排名，格式太多样，不做结构化
  highlights: HighlightList,
  url: UrlField,
});

export const SkillItemSchema = ItemBase.extend({
  name: NonEmpty("技能分类"), // "后端" / "工程化"
  keywords: TagList, // ["Java", "Spring Boot", "MySQL"]
  level: z.number().int().min(0).max(5).default(0), // 0 = 不显示等级
});

export const CertificateItemSchema = ItemBase.extend({
  name: NonEmpty("证书名称"),
  issuer: z.string().trim().default(""),
  date: DateField,
  summary: z.string().trim().max(300).default(""),
  url: UrlField,
});

/** 自定义区块：只有标题 + 描述 + bullet，用来兜住"获奖 / 社团 / 论文"这类长尾 */
export const CustomItemSchema = ItemBase.extend({
  name: NonEmpty("标题"),
  subtitle: z.string().trim().default(""),
  startDate: DateField,
  endDate: EndDateField,
  summary: z.string().trim().max(500).default(""),
  highlights: HighlightList,
  url: UrlField,
});

export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type SkillItem = z.infer<typeof SkillItemSchema>;
export type CertificateItem = z.infer<typeof CertificateItemSchema>;
export type CustomItem = z.infer<typeof CustomItemSchema>;

export type AnyItem =
  ExperienceItem | ProjectItem | EducationItem | SkillItem | CertificateItem | CustomItem;

/** 判断某类条目是否"实质为空"，用于 ATS 的占位符检测与预览时跳过空条目 */
export function isEmptyItem(item: AnyItem): boolean {
  const values = Object.entries(item)
    .filter(([key]) => key !== "id" && key !== "visible")
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]));
  return values.every((v) => v === "" || v === 0 || v === undefined || v === null);
}
