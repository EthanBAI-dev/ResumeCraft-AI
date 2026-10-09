import { describe, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { availableSectionIds, ResumeDataSchema } from "@/lib/schema";
import { validateLayout } from "@/lib/layout/operations";
import { TEMPLATES, applyTemplateToResume } from "./registry";

describe("template presets", () => {
  it.each(TEMPLATES)("$id keeps content and valid layout after switching", (template) => {
    const result = applyTemplateToResume(sampleResume, template.id);
    expect(result.sections).toBe(sampleResume.sections);
    expect(result.basics).toBe(sampleResume.basics);
    expect(ResumeDataSchema.safeParse(result).success).toBe(true);
    expect(validateLayout(result.layout, availableSectionIds(result))).toEqual([]);
    expect(result.metadata.template).toBe(template.id);
  });

  it("places imported sections by type rather than assuming their IDs are type names", () => {
    const resume = structuredClone(sampleResume);
    resume.sections["education-imported"] = {
      ...resume.sections.education,
      id: "education-imported",
    };
    delete resume.sections.education;
    const next = applyTemplateToResume(resume, "nordic");
    expect(next.layout[0][1]).toContain("education-imported");
    expect(validateLayout(next.layout, availableSectionIds(next))).toEqual([]);
  });
});
