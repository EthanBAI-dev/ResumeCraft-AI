"use client";

import type { ResumeData } from "@/lib/schema";
import { downloadBlob } from "./client";
import { resumeFileName } from "./filename";
import { createResumePdfBlob } from "./pdf-client";

export const DEFAULT_PNG_SCALE = 2;

/** PNG 从最终 PDF 的第一页渲染，避免再维护一条 DOM 截图样式链路。 */
export async function exportResumePng(resume: ResumeData) {
  const pdfBlob = await createResumePdfBlob(resume);
  const pngBlob = await renderPdfFirstPageToPng(pdfBlob);
  downloadBlob(pngBlob, resumeFileName(`${resume.basics.name}-page-1`, "png"));
}

export async function renderPdfFirstPageToPng(
  pdfBlob: Blob,
  scale = DEFAULT_PNG_SCALE,
): Promise<Blob> {
  if (!Number.isFinite(scale) || scale <= 0 || scale > 4) {
    throw new RangeError("PNG 渲染倍率必须在 0 到 4 之间");
  }

  const { getDocument } = await import("pdfjs-dist/legacy/webpack.mjs");
  const loadingTask = getDocument({ data: new Uint8Array(await pdfBlob.arrayBuffer()) });
  const document = await loadingTask.promise;

  try {
    const page = await document.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: "#ffffff" }).promise;
    return canvasToPngBlob(canvas);
  } finally {
    await loadingTask.destroy();
  }
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("浏览器无法生成 PNG"));
    }, "image/png");
  });
}
