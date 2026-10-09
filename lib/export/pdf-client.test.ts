import { afterEach, describe, expect, it, vi } from "vitest";
import { createResumePdfBlob, serializeResumeRoot } from "./pdf-client";
import { sampleResume } from "@/fixtures/sample-resume";

afterEach(() => vi.unstubAllGlobals());

it("exports the active preview even when template thumbnails precede it", async () => {
  document.body.innerHTML =
    '<div class="template-thumbnail"><div class="resume-root">THUMBNAIL</div></div><div class="preview-document-scale"><div class="resume-root">ACTUAL RESUME</div></div>';
  const fetcher = vi.fn(async () => new Response("busy", { status: 429 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(createResumePdfBlob(sampleResume)).rejects.toThrow();
  const options = vi.mocked(fetch).mock.calls[0][1];
  expect(String(options?.body)).toContain("ACTUAL RESUME");
  expect(String(options?.body)).not.toContain("THUMBNAIL");
});

describe("serializeResumeRoot", () => {
  it("保留简历内容并剥离编辑态拖拽控件", () => {
    document.body.innerHTML = `<div class="resume-root"><button class="layout-drag-handle">拖动</button><section class="layout-section layout-section--over layout-section--active"><div data-layout-guide="grid">辅助线</div><div data-guide-label="公司 · 6/12 格" data-break-before="true">项目经历</div></section></div>`;
    const root = document.querySelector<HTMLElement>(".resume-root");
    const html = serializeResumeRoot(root!, ".resume-root{color:#111}");

    expect(html).toContain("项目经历");
    expect(html).toContain(".resume-root{color:#111}");
    expect(html).not.toContain(">拖动<");
    expect(html).not.toContain("layout-section--over");
    expect(html).not.toContain("layout-section--active");
    expect(html).not.toContain("data-layout-guide");
    expect(html).not.toContain("data-guide-label");
    expect(html).not.toContain("data-break-before");
    expect(html).not.toContain("辅助线");
    expect(root!.querySelector("[data-layout-guide]")).not.toBeNull();
  });
});
