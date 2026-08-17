import { describe, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { fromJsonResume, importResumeJson, toJsonResume } from "./json-resume";

describe("JSON Resume 双向转换", () => {
  it("导出标准字段并通过扩展实现 ResumeCraft 无损往返", () => {
    const jsonResume = toJsonResume(sampleResume);
    expect(jsonResume.basics?.name).toBe(sampleResume.basics.name);
    expect(jsonResume.work?.[0]?.name).toBe("某电商科技有限公司");
    expect(jsonResume.projects?.[0]?.keywords).toContain("Java");
    expect(jsonResume.work?.[0]?.endDate).toBeUndefined();
    expect(fromJsonResume(jsonResume)).toEqual(sampleResume);
  });

  it("导入无 ResumeCraft 扩展的通用 JSON Resume", () => {
    const resume = fromJsonResume({
      basics: {
        name: "Ada Lovelace",
        label: "Programmer",
        email: "ada@example.com",
        location: { city: "London" },
        profiles: [{ network: "GitHub", username: "ada", url: "https://github.com/ada" }],
      },
      work: [
        {
          name: "Analytical Engines",
          position: "Researcher",
          startDate: "1842-01-01",
          endDate: "1843-12-31",
          highlights: ["Published the first algorithm"],
          keywords: ["Mathematics"],
        },
      ],
      awards: [{ title: "Pioneer", date: "1843", awarder: "Royal Society" }],
      skills: [{ name: "Computing", level: "Expert", keywords: ["Algorithms"] }],
    });

    expect(resume.basics.name).toBe("Ada Lovelace");
    expect(resume.basics.customFields[0]?.url).toBe("https://github.com/ada");
    const work = resume.sections.experience;
    expect(work.type).toBe("experience");
    if (work.type !== "experience") throw new Error("工作区块类型错误");
    expect(work.items[0]).toMatchObject({
      company: "Analytical Engines",
      startDate: "1842-01",
      endDate: "1843-12",
      tech: ["Mathematics"],
    });
    expect(resume.sections.certificate).toBeDefined();
  });

  it("自动识别原生备份和 JSON Resume", () => {
    expect(importResumeJson(JSON.stringify(sampleResume)).format).toBe("resumecraft");
    expect(importResumeJson(JSON.stringify({ basics: { name: "Grace Hopper" } })).format).toBe(
      "json-resume",
    );
    expect(() => importResumeJson("not-json")).toThrow();
  });

  it("接受官方 Schema 允许的部分条目并适配本地必填字段", () => {
    const resume = fromJsonResume({
      basics: { name: "Partial", email: "not-an-email" },
      work: [{ highlights: ["x".repeat(400)] }],
      projects: [{}],
    });
    const work = resume.sections.experience;
    const project = resume.sections.project;
    expect(resume.basics.email).toBe("");
    expect(work.type).toBe("experience");
    expect(project.type).toBe("project");
    if (work.type !== "experience" || project.type !== "project") {
      throw new Error("导入区块类型错误");
    }
    expect(work.items[0]).toMatchObject({ company: "未命名公司", position: "未填写职位" });
    expect(work.items[0].highlights[0]).toHaveLength(300);
    expect(project.items[0].name).toBe("未命名项目");
  });
});
