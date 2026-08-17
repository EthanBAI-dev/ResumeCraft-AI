"use client";

import type { ResumeData } from "@/lib/schema";
import { resumeFileName } from "./filename";

/** 浏览器端通用下载。URL 在下一帧释放，避免内存累积且不打断下载。 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

export function exportResumeJson(resume: ResumeData) {
  const blob = new Blob([JSON.stringify(resume, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, resumeFileName(resume.basics.name, "json"));
}
