import { describe, expect, it } from "vitest";
import { joinPdfTextItems } from "./pdf-text";

describe("PDF 文本提取辅助函数", () => {
  it("保留文本项并跳过 PDF.js 的非文本标记", () => {
    expect(
      joinPdfTextItems([
        { str: "张" },
        { str: "三", hasEOL: true },
        {},
        { str: "项目经历" },
        { str: 42 },
      ]),
    ).toBe("张三\n项目经历");
  });
});
