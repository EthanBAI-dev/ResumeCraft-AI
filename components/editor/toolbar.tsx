"use client";

import { useEffect, useRef } from "react";
import {
  Braces,
  Check,
  CloudOff,
  FileDown,
  FileInput,
  FileJson2,
  FileText,
  ImageDown,
  Loader2,
  Redo2,
  Sparkles,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useResumeHistory, useResumeStore } from "@/lib/store/resume-store";
import type { PersistenceStatus } from "@/lib/store/persistence";
import { useRenderLatency } from "@/lib/perf/render-latency";
import { sampleResume } from "@/fixtures/sample-resume";
import { exportJsonResume, exportResumeJson } from "@/lib/export/client";
import { exportResumeDocx } from "@/lib/export/docx";
import { importResumeJson } from "@/lib/export/json-resume";
import { exportResumePng } from "@/lib/export/png";
import {
  exportResumePdf,
  PdfWorkerBusyError,
  PdfWorkerUnavailableError,
} from "@/lib/export/pdf-client";

export function Toolbar({
  status,
  savedAt,
}: {
  status: PersistenceStatus;
  savedAt: number | null;
}) {
  const { canUndo, canRedo, undo, redo } = useResumeHistory();
  const replaceResume = useResumeStore((s) => s.replaceResume);
  const resume = useResumeStore((s) => s.resume);
  const importInputRef = useRef<HTMLInputElement>(null);
  const latency = useRenderLatency(process.env.NODE_ENV !== "production");

  // Ctrl/Cmd + Z / Shift+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <span className="font-semibold tracking-tight">ResumeCraft</span>
      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button variant="ghost" size="icon" aria-label="撤销" disabled={!canUndo} onClick={undo}>
        <Undo2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="重做" disabled={!canRedo} onClick={redo}>
        <Redo2 className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => replaceResume(sampleResume)}
        title="用示例数据填充，方便快速看效果"
      >
        <Sparkles className="size-4" />
        载入示例
      </Button>

      <div className="flex-1" />

      {process.env.NODE_ENV !== "production" && latency.samples > 0 ? (
        <span
          className="bg-muted text-muted-foreground rounded px-2 py-1 font-mono text-[11px] tabular-nums"
          title="按键 → 预览重绘完成的端到端延迟（ADR-005 预算：P95 < 100ms）"
        >
          P50 {latency.p50.toFixed(1)}ms · P95 {latency.p95.toFixed(1)}ms · n={latency.samples}
        </span>
      ) : null}

      <SaveStatus status={status} savedAt={savedAt} />

      <input
        ref={importInputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          try {
            const imported = importResumeJson(await file.text());
            replaceResume(imported.resume);
            toast.success(
              imported.format === "resumecraft" ? "ResumeCraft 备份已导入" : "JSON Resume 已导入",
            );
          } catch {
            toast.error("JSON 导入失败，请检查文件格式");
          }
        }}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => importInputRef.current?.click()}
        title="导入 ResumeCraft 备份或标准 JSON Resume"
      >
        <FileInput className="size-4" />
        导入
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          exportResumeJson(resume);
          toast.success("JSON 备份已开始下载");
        }}
      >
        <Braces className="size-4" />
        JSON
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          exportJsonResume(resume);
          toast.success("JSON Resume 已开始下载");
        }}
        title="导出 JSON Resume 标准格式"
      >
        <FileJson2 className="size-4" />
        JSON Resume
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          const id = toast.loading("正在生成可编辑 DOCX…");
          try {
            await exportResumeDocx(resume);
            toast.success("DOCX 已开始下载", {
              id,
              description: "DOCX 保持内容结构与可编辑性，不保证与 PDF 像素一致",
            });
          } catch {
            toast.error("DOCX 生成失败，请重试", { id });
          }
        }}
      >
        <FileText className="size-4" />
        DOCX
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          const id = toast.loading("正在从 PDF 渲染首页 PNG…");
          try {
            await exportResumePng(resume);
            toast.success("PNG 首页已开始下载", { id });
          } catch (error) {
            if (error instanceof PdfWorkerBusyError) {
              toast.info("PDF Worker 正在处理较多请求，请稍后重试", { id });
            } else if (error instanceof PdfWorkerUnavailableError) {
              toast.error("PNG 导出需要配置 PDF Worker", { id });
            } else {
              toast.error("PNG 生成失败，请重试", { id });
            }
          }
        }}
        title="从最终 PDF 的第一页生成 PNG"
      >
        <ImageDown className="size-4" />
        PNG
      </Button>
      <Button
        size="sm"
        onClick={async () => {
          const id = toast.loading("正在生成高保真 PDF…");
          try {
            const { readback } = await exportResumePdf(resume);
            if (!readback) {
              toast.success("PDF 已开始下载；文本检测暂不可用", { id });
            } else if (readback.passes) {
              toast.success(`PDF 已开始下载；文本可读性 ${Math.round(readback.coverage * 100)}%`, {
                id,
              });
            } else {
              const hasMissingText = readback.missing.length > 0;
              toast.warning(
                hasMissingText
                  ? `PDF 已开始下载；检测到 ${readback.missing.length} 项文本可能无法被 ATS 读取`
                  : "PDF 已开始下载；文本完整，但阅读顺序可能异常",
                {
                  id,
                  description: hasMissingText
                    ? `缺失示例：${readback.missing.slice(0, 3).join("；")}`
                    : `阅读顺序得分：${Math.round(readback.orderScore * 100)}%`,
                },
              );
            }
          } catch (error) {
            if (error instanceof PdfWorkerUnavailableError) {
              toast.info("PDF Worker 尚未配置，已打开系统打印", { id });
            } else if (error instanceof PdfWorkerBusyError) {
              toast.info("PDF Worker 正在处理较多请求，请稍后重试", { id });
            } else {
              toast.error("PDF 生成失败，已打开系统打印", { id });
            }
            if (!(error instanceof PdfWorkerBusyError)) window.print();
          }
        }}
        title="优先使用高保真 PDF Worker；未配置时回退到系统打印"
      >
        <FileDown className="size-4" />
        打印 / PDF
      </Button>
    </header>
  );
}

function SaveStatus({ status, savedAt }: { status: PersistenceStatus; savedAt: number | null }) {
  const label = {
    loading: "读取草稿…",
    saving: "保存中…",
    saved: savedAt ? `已保存 ${new Date(savedAt).toLocaleTimeString("zh-CN")}` : "已保存",
    error: "保存失败",
  }[status];

  const Icon = { loading: Loader2, saving: Loader2, saved: Check, error: CloudOff }[status];

  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Icon
        className={`size-3.5 ${status === "saving" || status === "loading" ? "animate-spin" : ""}`}
      />
      {label}
    </span>
  );
}
