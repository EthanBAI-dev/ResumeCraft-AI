import { describe, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { collectResumeTextAnchors, evaluatePdfReadback, normalizeText } from "./readback";

describe("PDF 文本回读", () => {
  it("NFKC 与空白归一化后仍能比对", () => {
    expect(normalizeText("Ｊａｖａ　\n Spring  Boot")).toBe("java spring boot");
  });

  it("完整文本能通过覆盖率与阅读顺序校验", () => {
    const text = collectResumeTextAnchors(sampleResume).join("\n");
    const report = evaluatePdfReadback(sampleResume, text);
    expect(report.coverage).toBe(1);
    expect(report.orderScore).toBe(1);
    expect(report.passes).toBe(true);
  });

  it("漏字和倒序都会被准确指出", () => {
    const anchors = collectResumeTextAnchors(sampleResume);
    const text = anchors
      .filter((anchor) => anchor !== sampleResume.basics.email)
      .reverse()
      .join("\n");
    const report = evaluatePdfReadback(sampleResume, text);
    expect(report.coverage).toBeLessThan(1);
    expect(report.orderScore).toBeLessThan(0.95);
    expect(report.missing).toContain(sampleResume.basics.email);
    expect(report.passes).toBe(false);
  });
});
