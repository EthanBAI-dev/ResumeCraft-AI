import { z } from "zod";
import {
  CertificateItemSchema,
  CustomItemSchema,
  EducationItemSchema,
  ExperienceItemSchema,
  ProjectItemSchema,
  SkillItemSchema,
} from "./items";
import { Id } from "./primitives";

/**
 * 所有区块共享同一外壳，只有 items 的元素类型不同。
 * 新增一种区块 = 加一个 item schema + 一个渲染分支，不动任何核心逻辑（拖拽/分页/导出/版本全都不用改）。
 */
export const SectionBase = z.object({
  id: Id,
  name: z.string().trim().min(1, "区块名称不能为空"), // 用户可改的显示名
  visible: z.boolean().default(true),
  /** 区块内部分栏：技能/证书常用 2–3 栏排布 */
  columns: z.number().int().min(1).max(4).default(1),
});

export const SummarySectionSchema = SectionBase.extend({
  type: z.literal("summary"),
  content: z.string().trim().max(1200).default(""),
});

export const ExperienceSectionSchema = SectionBase.extend({
  type: z.literal("experience"),
  items: z.array(ExperienceItemSchema).default([]),
});

export const ProjectSectionSchema = SectionBase.extend({
  type: z.literal("project"),
  items: z.array(ProjectItemSchema).default([]),
});

export const EducationSectionSchema = SectionBase.extend({
  type: z.literal("education"),
  items: z.array(EducationItemSchema).default([]),
});

export const SkillSectionSchema = SectionBase.extend({
  type: z.literal("skill"),
  items: z.array(SkillItemSchema).default([]),
});

export const CertificateSectionSchema = SectionBase.extend({
  type: z.literal("certificate"),
  items: z.array(CertificateItemSchema).default([]),
});

export const CustomSectionSchema = SectionBase.extend({
  type: z.literal("custom"),
  items: z.array(CustomItemSchema).default([]),
});

export const SectionSchema = z.discriminatedUnion("type", [
  SummarySectionSchema,
  ExperienceSectionSchema,
  ProjectSectionSchema,
  EducationSectionSchema,
  SkillSectionSchema,
  CertificateSectionSchema,
  CustomSectionSchema,
]);

export type Section = z.infer<typeof SectionSchema>;
export type SectionType = Section["type"];
export type ItemSection = Exclude<Section, { type: "summary" }>;

export const SECTION_TYPES = [
  "summary",
  "experience",
  "project",
  "education",
  "skill",
  "certificate",
  "custom",
] as const;

/** 新建区块时的默认中文名 */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  summary: "个人简介",
  experience: "工作经历",
  project: "项目经历",
  education: "教育经历",
  skill: "专业技能",
  certificate: "证书与奖项",
  custom: "自定义",
};

/**
 * layout 中可以出现、但不属于 sections 的保留 id。
 * basics（姓名/联系方式）字段结构与其他区块不同，不塞进联合类型，
 * 但允许它被拖到侧栏——很多双栏模板确实把联系方式放侧边。
 */
export const RESERVED_SECTION_IDS = ["basics"] as const;
export type ReservedSectionId = (typeof RESERVED_SECTION_IDS)[number];

export function isItemSection(section: Section): section is ItemSection {
  return section.type !== "summary";
}
