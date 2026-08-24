import { describe, expect, it } from "vitest";
import { diffWords } from "./diff";

describe("AI 词级 diff", () => {
  it("能把 diff 无损还原为修改前后文本", () => {
    const before = "负责支付接口开发，降低错误率";
    const after = "主导支付接口重构，将错误率降低 30%";
    const parts = diffWords(before, after);

    expect(
      parts
        .filter((part) => part.type !== "insert")
        .map((part) => part.value)
        .join(""),
    ).toBe(before);
    expect(
      parts
        .filter((part) => part.type !== "delete")
        .map((part) => part.value)
        .join(""),
    ).toBe(after);
    expect(parts.some((part) => part.type === "insert")).toBe(true);
    expect(parts.some((part) => part.type === "delete")).toBe(true);
  });

  it("相同文本只产生一个 equal 片段", () => {
    expect(diffWords("同一条内容", "同一条内容")).toEqual([{ type: "equal", value: "同一条内容" }]);
  });
});
