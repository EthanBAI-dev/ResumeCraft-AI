import { describe, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { DEMO_PHOTOS, LEGACY_DEMO_PHOTO } from "@/fixtures/demo-photo";
import { createEmptyResume } from "@/lib/schema";
import { checkResume, matchKeywords } from "./resume-check";
describe("explainable local checks", () => {
  it.each(
    [...DEMO_PHOTOS.map((photo) => photo.url), LEGACY_DEMO_PHOTO].map((url, index) => ({
      url,
      index,
    })),
  )("flags visible demo portrait $index, including legacy drafts", ({ url }) => {
    const data = createEmptyResume();
    data.basics.photo = { ...data.basics.photo, url, visible: true };
    expect(checkResume(data).some((issue) => issue.id === "demo-photo")).toBe(true);
    data.basics.photo.visible = false;
    expect(checkResume(data).some((issue) => issue.id === "demo-photo")).toBe(false);
  });
  it("reports missing essentials, not an invented score", () => {
    const issues = checkResume(createEmptyResume());
    expect(issues.map((i) => i.id)).toEqual(expect.arrayContaining(["name", "contact"]));
    expect(issues.every((i) => i.reason && i.sectionId)).toBe(true);
    expect(issues.some((i) => "score" in i)).toBe(false);
  });
  it("flags placeholders and ignores hidden experience descriptions", () => {
    const data = structuredClone(sampleResume);
    expect(checkResume(data).some((i) => i.id === "demo-contact")).toBe(true);
    data.sections.experience.visible = false;
    expect(checkResume(data).some((i) => i.sectionId === "experience")).toBe(false);
  });
  it("does literal keyword matching, without Java matching JavaScript", () => {
    const data = createEmptyResume();
    data.basics.headline = "JavaScript React C++";
    expect(matchKeywords(data, "Java,JavaScript,C++,Python")).toEqual([
      { term: "Java", found: false },
      { term: "JavaScript", found: true },
      { term: "C++", found: true },
      { term: "Python", found: false },
    ]);
  });
});
