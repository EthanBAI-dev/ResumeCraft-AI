"use client";

import { useEffect } from "react";
import {
  Braces,
  Check,
  CloudOff,
  FileDown,
  FileText,
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
import { exportResumeJson } from "@/lib/export/client";
import { exportResumeDocx } from "@/lib/export/docx";
import { exportResumePdf, PdfWorkerUnavailableError } from "@/lib/export/pdf-client";

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
        onClick={async () => {
          const id = toast.loading("正在生成可编辑 DOCX…");
          try {
            await exportResumeDocx(resume);
            toast.success("DOCX 已开始下载", { id });
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
        onClick={async () => {
          const id = toast.loading("正在生成高保真 PDF…");
          try {
            await exportResumePdf(resume);
            toast.success("PDF 已开始下载", { id });
          } catch (error) {
            if (error instanceof PdfWorkerUnavailableError) {
              toast.info("PDF Worker 尚未配置，已打开系统打印", { id });
            } else {
              toast.error("PDF 生成失败，已打开系统打印", { id });
            }
            window.print();
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
