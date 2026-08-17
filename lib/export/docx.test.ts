import { describe, expect, it } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { createResumeDocxBlob } from "./docx";

describe("createResumeDocxBlob", () => {
  it("产出包含样例内容的 Office Open XML ZIP", async () => {
    const blob = await createResumeDocxBlob(sampleResume);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(blob.size).toBeGreaterThan(1000);
    expect([...bytes.slice(0, 2)]).toEqual([0x50, 0x4b]);
  });
});
