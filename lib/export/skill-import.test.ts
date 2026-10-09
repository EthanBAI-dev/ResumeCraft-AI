import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { importResumeJson } from "./json-resume";
import { parseDraft } from "@/lib/schema/draft";

const script = resolve("skills/resumecraft-import/scripts/build-resume.mjs");
const example = resolve("skills/resumecraft-import/assets/example-facts.json");
describe("portable import skill", () => {
  it("produces native data accepted by the real importer, preserves facts/custom sections and refuses overwrite", () => {
    const dir = mkdtempSync(join(tmpdir(), "resumecraft-skill-"));
    try {
      const out = join(dir, "resume.json");
      execFileSync(process.execPath, [script, example, out]);
      const imported = importResumeJson(readFileSync(out, "utf8"));
      expect(imported.format).toBe("resumecraft");
      expect(parseDraft(imported.resume)).toEqual(imported.resume);
      expect(imported.resume.basics.name).toBe("林知远");
      expect(imported.resume.basics.photo.visible).toBe(false);
      expect(imported.resume.basics.phone).toBe("");
      expect(imported.resume.sections.experience).toMatchObject({
        items: [
          {
            endDate: "present",
            highlights: [
              "参与订单服务维护，协助排查接口超时问题。",
              "为内部工具补充集成测试与使用文档。",
            ],
          },
        ],
      });
      expect(imported.resume.sections.education).toMatchObject({ items: [{ startDate: "2019" }] });
      expect(imported.resume.sections["custom-1"]).toMatchObject({ name: "志愿活动" });
      expect(imported.resume.metadata.css.visible).toBe(false);
      expect(readFileSync(out + ".review.txt", "utf8")).toContain("手机号");
      const before = readFileSync(out, "utf8");
      expect(spawnSync(process.execPath, [script, example, out]).status).not.toBe(0);
      expect(readFileSync(out, "utf8")).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it.each([
    { basics: { unknown: "not silently dropped" } },
    { basics: { url: "javascript:alert(1)" } },
    { experience: [{ highlights: "not an array" }] },
    { skill: [{ level: 9 }] },
  ])("rejects unsupported or unsafe fields without creating output", (input) => {
    const dir = mkdtempSync(join(tmpdir(), "resumecraft-skill-"));
    try {
      const source = join(dir, "facts.json");
      const out = join(dir, "resume.json");
      writeFileSync(source, JSON.stringify(input));
      expect(spawnSync(process.execPath, [script, source, out]).status).not.toBe(0);
      expect(() => readFileSync(out)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
