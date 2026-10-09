import type { ResumeData } from "@/lib/schema";
import { flattenLayout } from "@/lib/layout/operations";
import { isDemoPhoto } from "@/fixtures/demo-photo";
export type ResumeIssue = {
  id: string;
  sectionId: string;
  title: string;
  reason: string;
  level: "check" | "suggestion";
};
export function checkResume(resume: ResumeData): ResumeIssue[] {
  const issues: ResumeIssue[] = [];
  const add = (
    id: string,
    sectionId: string,
    title: string,
    reason: string,
    level: ResumeIssue["level"] = "check",
  ) => issues.push({ id, sectionId, title, reason, level });
  if (!resume.basics.name.trim())
    add("name", "basics", "填写姓名", "目前姓名为空，阅读者无法确认这份简历属于谁。");
  if (!resume.basics.email.trim() && !resume.basics.phone.trim())
    add("contact", "basics", "至少留一种联系方式", "邮箱和手机都为空，招聘方可能无法联系你。");
  if (resume.basics.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.basics.email))
    add("email", "basics", "检查邮箱格式", "邮箱格式看起来尚未填写完整，请核对。");
  if (!resume.basics.headline.trim())
    add(
      "headline",
      "basics",
      "可以补充求职方向",
      "明确的目标岗位能帮助阅读者理解你的经历，但不是必填项。",
      "suggestion",
    );
  if (resume.basics.photo.visible && isDemoPhoto(resume.basics.photo.url))
    add(
      "demo-photo",
      "basics",
      "替换或隐藏示例头像",
      "当前照片为虚构示例人物，不是你的证件照，正式投递前请替换或隐藏。",
    );
  if (resume.basics.email.endsWith("@example.com") || resume.basics.phone === "138-0000-0000")
    add(
      "demo-contact",
      "basics",
      "检查是否仍在使用示例资料",
      "联系方式含示例值，正式投递前请替换为你的资料。",
    );
  for (const id of new Set(flattenLayout(resume.layout))) {
    const section = resume.sections[id];
    if (!section?.visible || section.type === "summary") continue;
    for (const item of section.items.filter((i) => i.visible)) {
      const title = "company" in item ? item.company : "school" in item ? item.school : item.name;
      if (!title?.trim())
        add(
          `title-${item.id}`,
          id,
          `${section.name}有空标题`,
          "这条经历还没有公司、学校或项目等名称，请补全或移除空条目。",
        );
      if (
        "startDate" in item &&
        item.startDate &&
        item.endDate &&
        item.endDate !== "present" &&
        /^\d{4}-\d{2}$/.test(item.startDate) &&
        /^\d{4}-\d{2}$/.test(item.endDate) &&
        item.startDate > item.endDate
      )
        add(
          `date-${item.id}`,
          id,
          "开始日期晚于结束日期",
          `请核对「${title || section.name}」的经历时间。`,
        );
      if ("highlights" in item && item.highlights.some((t) => t.length > 180))
        add(
          `length-${item.id}`,
          id,
          "有较长的经历要点",
          "超过 180 字仅触发阅读长度提醒，不代表质量差；可按一个行动一个要点拆分。",
          "suggestion",
        );
      if (
        (section.type === "experience" || section.type === "project") &&
        "highlights" in item &&
        !item.highlights.some((t) => t.trim()) &&
        !("summary" in item && item.summary.trim())
      )
        add(
          `details-${item.id}`,
          id,
          "这条经历还没有具体描述",
          "可以补充你实际做了什么、使用的方法和已知结果。没有准确数字不需要编造。",
          "suggestion",
        );
    }
  }
  return issues;
}
export function matchKeywords(resume: ResumeData, input: string) {
  const terms = [
    ...new Set(
      input
        .split(/[\n,，、;；]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
  const contentText = (value: unknown): string =>
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.map(contentText).join(" ")
        : value && typeof value === "object"
          ? Object.entries(value)
              .filter(([key]) => !["id", "type", "photo"].includes(key))
              .map(([, item]) => contentText(item))
              .join(" ")
          : "";
  const text = contentText({
    basics: resume.basics,
    sections: flattenLayout(resume.layout)
      .filter((id) => resume.sections[id]?.visible)
      .map((id) => {
        const s = resume.sections[id];
        return s.type === "summary" ? s.content : s.items.filter((i) => i.visible);
      }),
  }).toLowerCase();
  return terms.map((term) => ({
    term,
    found: new RegExp(
      `(?<![a-z0-9])${term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`,
      "u",
    ).test(text),
  }));
}
