import { describe, expect, it } from "vitest";
import { serializeResumeRoot } from "./pdf-client";

describe("serializeResumeRoot", () => {
  it("保留简历内容并剥离编辑态拖拽控件", () => {
    document.body.innerHTML = `<div class="resume-root"><button class="layout-drag-handle">拖动</button><section class="layout-section layout-section--over">项目经历</section></div>`;
    const root = document.querySelector<HTMLElement>(".resume-root");
    const html = serializeResumeRoot(root!, ".resume-root{color:#111}");

    expect(html).toContain("项目经历");
    expect(html).toContain(".resume-root{color:#111}");
    expect(html).not.toContain(">拖动<");
    expect(html).not.toContain("layout-section--over");
  });
});
