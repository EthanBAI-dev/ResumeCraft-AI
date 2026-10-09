import { sampleResume } from "./sample-resume";
import { DEMO_PHOTO } from "./demo-photo";
import { applyTemplateToResume } from "@/components/templates/registry";

/** Fictional, compact, one-page documentation fixture. Never reads local user drafts. */
export function showcaseResume() {
  const resume = structuredClone(sampleResume);
  resume.basics.photo = { url: DEMO_PHOTO, visible: true, size: 72, rounded: false };
  resume.basics.customFields = resume.basics.customFields.slice(0, 1);
  resume.metadata.page.margin = 14;
  resume.metadata.typography = {
    ...resume.metadata.typography,
    fontSize: 10,
    lineHeight: 1.4,
    sectionGap: 10,
    itemGap: 7,
  };
  if (resume.sections.summary.type === "summary")
    resume.sections.summary.content =
      "3 年后端开发经验，专注交易系统与服务稳定性。熟悉 Java、MySQL 与 Redis，具备从需求分析到上线维护的完整实践经验。";
  if (resume.sections.experience.type === "experience") {
    resume.sections.experience.items[0].highlights = [
      "参与订单与支付链路改造，完善异常补偿与对账流程。",
      "优化查询缓存与慢 SQL，补充压测、监控及故障排查文档。",
      "与产品、测试协作推进需求上线，持续维护接口质量。",
    ];
    resume.sections.experience.items[1].highlights = [
      "参与内部权限管理系统开发，补充接口测试与使用文档。",
    ];
  }
  if (resume.sections.project.type === "project") {
    resume.sections.project.items[0].summary = "统一管理团队定时任务，提供调度记录与异常告警。";
    resume.sections.project.items[0].highlights = [
      "实现任务分片、失败重试与执行记录查询。",
      "搭建运行指标看板，协助定位重复触发和执行超时。",
    ];
  }
  return resume;
}

export function showcaseForTemplate(id: string) {
  const resume = applyTemplateToResume(showcaseResume(), id);
  const twoColumns = resume.metadata.page.columnRatio < 1;
  resume.metadata.typography = {
    ...resume.metadata.typography,
    fontSize: twoColumns ? 11 : 9.75,
    lineHeight: twoColumns ? 1.5 : 1.35,
    sectionGap: twoColumns ? 16 : 9,
    itemGap: twoColumns ? 10 : 6,
  };
  return resume;
}
