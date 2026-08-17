/** 生成跨平台安全、且可读的导出文件名。 */
export function resumeFileStem(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "resume";
}

export function resumeFileName(name: string, extension: string): string {
  return `${resumeFileStem(name)}-ResumeCraft.${extension.replace(/^\./, "")}`;
}
