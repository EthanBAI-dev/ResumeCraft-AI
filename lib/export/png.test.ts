import { describe, expect, it, vi } from "vitest";
import { canvasToPngBlob, renderPdfFirstPageToPng } from "./png";

describe("PNG 导出辅助函数", () => {
  it("把 canvas 编码为 PNG Blob", async () => {
    const expected = new Blob(["png"], { type: "image/png" });
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback, type?: string) => {
        expect(type).toBe("image/png");
        callback(expected);
      }),
    } as unknown as HTMLCanvasElement;

    await expect(canvasToPngBlob(canvas)).resolves.toBe(expected);
  });

  it("拒绝失控的渲染倍率", async () => {
    await expect(renderPdfFirstPageToPng(new Blob(), 0)).rejects.toThrow(RangeError);
    await expect(renderPdfFirstPageToPng(new Blob(), 5)).rejects.toThrow(RangeError);
  });
});
