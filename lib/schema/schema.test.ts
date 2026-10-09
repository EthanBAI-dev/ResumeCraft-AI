import { describe, expect, it } from "vitest";
import { flattenLayout, validateLayout } from "@/lib/layout/operations";
import { sampleResume } from "@/fixtures/sample-resume";
import {
  DateField,
  EmailField,
  EndDateField,
  ExperienceItemSchema,
  ResumeDataSchema,
  SectionSchema,
  UrlField,
  availableSectionIds,
  createEmptyResume,
  createItem,
  createSection,
  isEmptyItem,
  parseResume,
  parseResumeSafe,
} from "./index";

describe("primitives", () => {
  it("空字符串在可选字段里是合法的（用户清空输入框不该报错）", () => {
    expect(EmailField.parse("")).toBe("");
    expect(UrlField.parse("")).toBe("");
    expect(DateField.parse("")).toBe("");
  });

  it("邮箱格式校验", () => {
    expect(EmailField.parse("a@b.com")).toBe("a@b.com");
    expect(() => EmailField.parse("not-an-email")).toThrow(/邮箱格式/);
  });

  it("链接必须带协议", () => {
    expect(UrlField.parse("https://example.com")).toBe("https://example.com");
    expect(() => UrlField.parse("example.com")).toThrow(/http/);
  });

  it("日期只接受 YYYY 或 YYYY-MM", () => {
    expect(DateField.parse("2024")).toBe("2024");
    expect(DateField.parse("2024-06")).toBe("2024-06");
    expect(() => DateField.parse("2024-13")).toThrow();
    expect(() => DateField.parse("2024/06")).toThrow();
  });

  it("结束日期支持 present", () => {
    expect(EndDateField.parse("present")).toBe("present");
    expect(EndDateField.parse("2024-06")).toBe("2024-06");
  });

  it("首尾空格会被 trim（粘贴内容时最常见的脏数据）", () => {
    expect(EmailField.parse("  a@b.com  ")).toBe("a@b.com");
  });
});

describe("item schema", () => {
  it("旧草稿缺少十二格配置时补齐默认值，不改变简历内容", () => {
    const metadata = { ...sampleResume.metadata, itemLayouts: undefined };
    const migrated = parseResume({ ...sampleResume, metadata });
    expect(migrated.metadata.itemLayouts).toEqual({});
    expect(migrated.basics).toEqual(sampleResume.basics);
    expect(migrated.sections).toEqual(sampleResume.sections);
    expect(migrated.layout).toEqual(sampleResume.layout);
  });
  it("补齐默认值", () => {
    const item = ExperienceItemSchema.parse({ id: "x", company: "A", position: "B" });
    expect(item.visible).toBe(true);
    expect(item.highlights).toEqual([]);
    expect(item.tech).toEqual([]);
    expect(item.endDate).toBe("");
  });

  it("必填字段缺失时拒绝", () => {
    expect(() => ExperienceItemSchema.parse({ id: "x", company: "", position: "B" })).toThrow(
      /公司名称/,
    );
  });

  it("isEmptyItem 识别刚创建的空条目", () => {
    expect(isEmptyItem(createItem("experience"))).toBe(true);
    expect(isEmptyItem({ ...createItem("experience"), company: "A" } as never)).toBe(false);
  });
});

describe("section schema", () => {
  it("按 type 区分联合分支", () => {
    const skill = SectionSchema.parse({
      id: "skill",
      type: "skill",
      name: "技能",
      items: [{ id: "a", name: "语言", keywords: ["Go"] }],
    });
    expect(skill.type).toBe("skill");
    if (skill.type === "skill") expect(skill.items[0].level).toBe(0);
  });

  it("summary 区块没有 items，只有 content", () => {
    const summary = SectionSchema.parse({ id: "summary", type: "summary", name: "简介" });
    expect(summary.type === "summary" && summary.content).toBe("");
  });

  it("未知 type 被拒绝", () => {
    expect(() => SectionSchema.parse({ id: "x", type: "unknown", name: "X" })).toThrow();
  });

  it("createSection 生成的区块自身可通过校验", () => {
    for (const type of [
      "summary",
      "experience",
      "project",
      "education",
      "skill",
      "certificate",
      "custom",
    ] as const) {
      expect(() => SectionSchema.parse(createSection(type))).not.toThrow();
    }
  });

  it("自定义区块的 id 带前缀，不与内置区块冲突", () => {
    const a = createSection("custom");
    const b = createSection("custom");
    expect(a.id).toMatch(/^custom-/);
    expect(a.id).not.toBe(b.id);
  });
});

describe("createEmptyResume", () => {
  it("产出的空简历自身合法，且 layout 满足全部不变量", () => {
    const resume = createEmptyResume();
    expect(() => ResumeDataSchema.parse(resume)).not.toThrow();
    expect(validateLayout(resume.layout, availableSectionIds(resume))).toEqual([]);
  });

  it("basics 作为保留 id 出现在 layout 中", () => {
    expect(flattenLayout(createEmptyResume().layout)).toContain("basics");
  });
});

describe("parseResume", () => {
  it("顺手修复脏 layout：去重、剔除幽灵 id、补回孤儿", () => {
    const dirty = {
      ...createEmptyResume(),
      layout: [[["summary", "summary", "ghost"], []]],
    };
    const parsed = parseResume(dirty);
    expect(validateLayout(parsed.layout, availableSectionIds(parsed))).toEqual([]);
    expect(flattenLayout(parsed.layout)).not.toContain("ghost");
    expect(flattenLayout(parsed.layout).filter((id) => id === "summary")).toHaveLength(1);
  });

  it("非法数据直接抛错", () => {
    expect(() => parseResume({ basics: {}, sections: {}, layout: [], metadata: {} })).toThrow();
  });

  it("parseResumeSafe 回落到空白简历而不是崩溃", () => {
    const { data, error } = parseResumeSafe("完全不是简历");
    expect(error).not.toBeNull();
    expect(() => ResumeDataSchema.parse(data)).not.toThrow();
  });
});

describe("sample fixture", () => {
  it("示例简历合法且 layout 不变量成立", () => {
    expect(() => ResumeDataSchema.parse(sampleResume)).not.toThrow();
    expect(validateLayout(sampleResume.layout, availableSectionIds(sampleResume))).toEqual([]);
  });

  it("包含供 ATS 引擎识别的弱开头样本（P5 依赖这条）", () => {
    const exp = sampleResume.sections.experience;
    const weak =
      exp.type === "experience" && exp.items[0].highlights.some((h) => /^(负责|参与|协助)/.test(h));
    expect(weak).toBe(true);
  });
});
