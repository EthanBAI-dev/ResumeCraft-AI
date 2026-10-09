import { expect, it } from "vitest";
import { diffText } from "./text-diff";
it("diff reconstructs both source and suggestion without changing text", () => {
  for (const [before, after] of [
    ["负责后端开发", "参与后端接口开发"],
    ["Use Java", "Use Go"],
    ["", "新增"],
    ["删除", ""],
  ]) {
    const parts = diffText(before, after);
    expect(
      parts
        .filter((p) => p.type !== "added")
        .map((p) => p.text)
        .join(""),
    ).toBe(before);
    expect(
      parts
        .filter((p) => p.type !== "removed")
        .map((p) => p.text)
        .join(""),
    ).toBe(after);
  }
});
