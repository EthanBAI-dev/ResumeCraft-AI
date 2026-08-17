import { describe, expect, it } from "vitest";
import { resumeFileName, resumeFileStem } from "./filename";

describe("resumeFileStem", () => {
  it("保留可读名称并移除 Windows 非法字符", () => {
    expect(resumeFileStem(" 陈 / 亦:然? ")).toBe("陈-亦-然");
  });

  it("空名称回退到 resume", () => {
    expect(resumeFileName("   ", ".json")).toBe("resume-ResumeCraft.json");
  });
});
