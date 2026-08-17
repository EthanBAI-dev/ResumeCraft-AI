"use client";

import type { ResumeData } from "@/lib/schema";
import { downloadBlob } from "./client";
import { resumeFileName } from "./filename";
import { extractPdfText } from "./pdf-text";
import { evaluatePdfReadback, type PdfReadbackReport } from "./readback";

export class PdfWorkerUnavailableError extends Error {
  constructor() {
    super("PDF worker 未配置");
  }
}

export class PdfWorkerBusyError extends Error {
  constructor() {
    super("PDF worker 正在处理较多请求");
  }
}

/**
 * 预览的 .resume-root 是唯一真相。导出时克隆它和同源 CSS，而不是重建第二套 HTML；
 * 仅剥离编辑态的拖拽手柄，保留用户自定义 CSS 与分页结构。
 */
export async function exportResumePdf(
  resume: ResumeData,
): Promise<{ readback: PdfReadbackReport | null }> {
  await document.fonts?.ready;
  const root = document.querySelector<HTMLElement>(".resume-root");
  if (!root) throw new Error("未找到可导出的简历预览");

  const response = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html: serializeResumeRoot(root, collectSameOriginCss()),
      filename: resumeFileName(resume.basics.name, "").replace(/\.$/, ""),
    }),
  });

  if (response.status === 503) throw new PdfWorkerUnavailableError();
  if (response.status === 429 || response.status === 504) throw new PdfWorkerBusyError();
  if (!response.ok) throw new Error("PDF worker 生成失败");

  const blob = await response.blob();
  if (blob.type !== "application/pdf") throw new Error("PDF worker 返回了无效文件");
  downloadBlob(blob, resumeFileName(resume.basics.name, "pdf"));

  try {
    return { readback: evaluatePdfReadback(resume, await extractPdfText(blob)) };
  } catch (error) {
    // PDF 已成功下载；回读属于质量门禁，解析器本身异常时不能阻断用户拿到文件。
    console.warn("[resumecraft] PDF 文本回读失败", error);
    return { readback: null };
  }
}

export function serializeResumeRoot(root: HTMLElement, cssText: string) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(".layout-drag-handle, [data-dnd-kit-live-region]")
    .forEach((node) => node.remove());
  clone.querySelectorAll(".layout-section--dragging, .layout-section--over").forEach((node) => {
    node.classList.remove("layout-section--dragging", "layout-section--over");
  });

  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${cssText}\nbody{margin:0;background:#fff}.layout-drag-handle{display:none!important}</style></head><body>${clone.outerHTML}</body></html>`;
}

function collectSameOriginCss() {
  return [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        // 跨域字体或浏览器扩展样式不可读，也无需作为简历自身的样式带走。
        return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}
