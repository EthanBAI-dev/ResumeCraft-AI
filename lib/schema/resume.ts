import { z } from "zod";
import { EmailField, HexColor, Id, UrlField } from "./primitives";
import { RESERVED_SECTION_IDS, SectionSchema } from "./section";

/** 自定义联系字段：GitHub / 博客 / 微信 …… 不写死枚举，避免每加一个渠道就改 schema */
export const CustomFieldSchema = z.object({
  id: Id,
  icon: z.string().trim().default("link"),
  label: z.string().trim().default(""),
  value: z.string().trim().default(""),
  url: UrlField,
});

export const BasicsSchema = z.object({
  name: z.string().trim().default(""),
  headline: z.string().trim().default(""), // "后端工程师 · 3 年经验"
  email: EmailField,
  phone: z.string().trim().default(""),
  location: z.string().trim().default(""),
  url: UrlField,
  photo: z.object({
    url: z.string().trim().default(""), // data: URI 或对象存储地址
    visible: z.boolean().default(false), // 国内简历常放照片，海外投递默认关掉
    size: z.number().min(32).max(160).default(88), // px
    rounded: z.boolean().default(false), // 兼容旧备份字段；呈现统一为 4:5 直角证件照
  }),
  customFields: z.array(CustomFieldSchema).default([]),
});

/** layout[页][栏][位置] = sectionId，栏位约定 0=主栏 1=侧栏 */
export const LayoutSchema = z.array(z.array(z.array(z.string())));

export const ItemLayoutPresetSchema = z.enum(["inline", "split", "stacked", "custom"]);
export const ItemLayoutFieldSchema = z.enum([
  "primary",
  "secondary",
  "date",
  "summary",
  "tertiary",
  "highlights",
  "tags",
  "headline",
  "phone",
  "email",
  "location",
  "url",
  "photo",
  "customFields",
]);
export const ItemLayoutAlignSchema = z.enum(["left", "center", "right"]);

export const ItemLayoutAtomSchema = z.object({
  field: ItemLayoutFieldSchema,
  /** 12 栅格中占用的列数；行高始终由内容自然撑开。 */
  span: z.number().int().min(2).max(12),
  /** 显式从新行开始。false 时由栅格自动填充当前行的剩余空间。 */
  breakBefore: z.boolean().default(false),
  align: ItemLayoutAlignSchema.default("left"),
  visible: z.boolean().default(true),
});

/**
 * 条目内部布局按 sectionId 保存，而不是写进内容条目本身。
 * 这样切换布局、隐藏某一行都不会破坏原始简历数据，也能让同一区块的条目保持一致。
 */
export const ItemLayoutConfigSchema = z.object({
  preset: ItemLayoutPresetSchema.default("split"),
  /** 字段原子按此数组顺序进入 DOM 和 PDF 阅读顺序。 */
  atoms: z.array(ItemLayoutAtomSchema).default([]),
  /** 旧版预设参数，保留用于无损迁移尚未原子化的本地草稿。 */
  primaryWidth: z.number().min(30).max(70).default(55),
  dateWidth: z.number().min(16).max(32).default(24),
  hidden: z.array(ItemLayoutFieldSchema).default([]),
});

export const DEFAULT_ITEM_LAYOUT = {
  preset: "split",
  atoms: [],
  primaryWidth: 55,
  dateWidth: 24,
  hidden: [],
} satisfies z.infer<typeof ItemLayoutConfigSchema>;

export const MetadataSchema = z.object({
  template: z.string().default("modern"),
  itemLayouts: z.record(z.string(), ItemLayoutConfigSchema).default({}),
  page: z.object({
    format: z.enum(["a4", "letter"]).default("a4"),
    margin: z.number().min(8).max(40).default(16), // mm
    showPageNumbers: z.boolean().default(false),
    /** 主栏占比，1 = 单栏布局 */
    columnRatio: z.number().min(0.4).max(1).default(0.66),
  }),
  theme: z.object({
    primary: HexColor.default("#2563eb"),
    text: HexColor.default("#18181b"),
    muted: HexColor.default("#71717a"),
    background: HexColor.default("#ffffff"),
  }),
  typography: z.object({
    fontFamily: z.string().default("Noto Sans SC"),
    fontSize: z.number().min(8).max(16).default(10.5), // pt
    lineHeight: z.number().min(1).max(2.4).default(1.5),
    sectionGap: z.number().min(0).max(32).default(12), // px
    itemGap: z.number().min(0).max(24).default(8), // px
  }),
  locale: z.enum(["zh-CN", "en-US"]).default("zh-CN"),
  /** 逃生舱：模板做不到的长尾需求让用户自己写 CSS */
  css: z.object({
    visible: z.boolean().default(false),
    value: z.string().default(""),
  }),
});

export const ResumeDataSchema = z.object({
  basics: BasicsSchema,
  sections: z.record(z.string(), SectionSchema),
  layout: LayoutSchema,
  metadata: MetadataSchema,
});

export type Basics = z.infer<typeof BasicsSchema>;
export type CustomField = z.infer<typeof CustomFieldSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type ItemLayoutConfig = z.infer<typeof ItemLayoutConfigSchema>;
export type ItemLayoutAtom = z.infer<typeof ItemLayoutAtomSchema>;
export type ItemLayoutAlign = z.infer<typeof ItemLayoutAlignSchema>;
export type ItemLayoutField = z.infer<typeof ItemLayoutFieldSchema>;
export type ItemLayoutPreset = z.infer<typeof ItemLayoutPresetSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;

/** 当前简历里 layout 允许引用的全部 id（内容区块 + 保留 id） */
export function availableSectionIds(data: Pick<ResumeData, "sections">): string[] {
  return [...RESERVED_SECTION_IDS, ...Object.keys(data.sections)];
}
