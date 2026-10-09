"use client";

import { useEffect, useRef, useState } from "react";
import {
  Braces,
  Check,
  CloudOff,
  FileDown,
  FileInput,
  FileJson2,
  FileText,
  ChevronDown,
  CircleHelp,
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
import { createLocalResume, demoResume, useLibraryStore } from "@/lib/store/library";
import { ResumeLibrary } from "./resume-library";
import { LocalDialog } from "./local-dialog";
import { ResumeCheck } from "./resume-check";
import { AiSettings } from "./ai-settings";
import { useAiSettings } from "@/lib/store/ai-settings";
import { useEditorStore } from "@/lib/store/editor-store";
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
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [confirmSample, setConfirmSample] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const aiOpen = useAiSettings((s) => s.open);
  const sampleNotice = useLibraryStore((s) => s.sampleNotice);
  const currentTitle = useLibraryStore((s) => s.entries.find((e) => e.id === s.activeId)?.title);

  // Ctrl/Cmd + Z / Shift+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const editor = useEditorStore.getState();
      if (editor.helpOpen || editor.guideStep !== null || document.querySelector("dialog[open]"))
        return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return (
    <header className="workspace-toolbar flex min-h-16 shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-3 sm:gap-2 sm:px-5">
      <span className="workspace-brand flex items-center gap-2 text-lg font-semibold">
        <span className="bg-primary grid size-8 place-items-center rounded-lg text-white">
          <FileText className="size-4" />
        </span>
        ResumeCraft
      </span>
      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button variant="ghost" size="icon" aria-label="撤销" disabled={!canUndo} onClick={undo}>
        <Undo2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="重做" disabled={!canRedo} onClick={redo}>
        <Redo2 className="size-4" />
      </Button>

      <Button
        variant={sampleNotice ? "outline" : "ghost"}
        size="sm"
        className={sampleNotice ? "bg-teal-50 ring-2 ring-teal-500 ring-offset-2" : undefined}
        aria-pressed={sampleNotice}
        disabled={status === "loading"}
        onClick={() => {
          if (sampleNotice) useLibraryStore.setState({ sampleNotice: false });
          else setConfirmSample(true);
        }}
        title="用示例数据填充，方便快速看效果"
      >
        <Sparkles className="size-4" />
        载入示例
      </Button>
      <Button
        variant="outline"
        size="sm"
        data-tour="library"
        disabled={status === "loading"}
        onClick={() => setLibraryOpen(true)}
      >
        我的简历
      </Button>
      <span
        className="text-muted-foreground hidden max-w-28 truncate text-xs xl:inline"
        title={currentTitle}
      >
        {currentTitle}
      </span>
      {sampleNotice && (
        <button
          className="text-primary text-xs"
          onClick={() => useLibraryStore.setState({ sampleNotice: false })}
        >
          示例已载入 · 点击收起提示
        </button>
      )}
      {libraryOpen && <ResumeLibrary onClose={() => setLibraryOpen(false)} />}
      {confirmSample && (
        <LocalDialog title="载入示例？" onClose={() => setConfirmSample(false)}>
          <p className="text-sm">
            替换当前简历会清空当前填写内容、照片和排版，改为示例数据；本次替换可撤销。其他简历不会受影响。
          </p>
          <p className="text-muted-foreground text-sm">也可以新建一份示例，保留当前简历。</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setConfirmSample(false)}>
              取消
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await createLocalResume("示例简历", demoResume());
                  setConfirmSample(false);
                } catch {
                  toast.error("保存失败，请先导出备份");
                }
              }}
            >
              新建一份示例
            </Button>
            <Button
              onClick={() => {
                replaceResume(demoResume());
                useLibraryStore.setState((s) => ({ sampleNotice: true, epoch: s.epoch + 1 }));
                setConfirmSample(false);
              }}
            >
              确认替换当前简历
            </Button>
          </div>
        </LocalDialog>
      )}

      <div className="flex-1" />

      {process.env.NODE_ENV !== "production" && latency.samples > 0 ? (
        <span
          className="bg-muted text-muted-foreground hidden rounded px-2 py-1 font-mono text-[11px] tabular-nums 2xl:block"
          title="按键 → 预览重绘完成的端到端延迟（ADR-005 预算：P95 < 100ms）"
        >
          P50 {latency.p50.toFixed(1)}ms · P95 {latency.p95.toFixed(1)}ms · n={latency.samples}
        </span>
      ) : null}

      <SaveStatus status={status} savedAt={savedAt} />
      <Button
        variant="ghost"
        size="sm"
        disabled={status === "loading"}
        onClick={() => setCheckOpen(true)}
      >
        投递前检查
      </Button>
      <Button variant="ghost" size="sm" onClick={() => useAiSettings.getState().setOpen(true)}>
        AI 设置
      </Button>
      {checkOpen && <ResumeCheck onClose={() => setCheckOpen(false)} />}
      {aiOpen && <AiSettings />}

      <Button
        data-tour="help"
        variant="ghost"
        size="sm"
        onClick={() => useEditorStore.getState().setHelpOpen(true)}
      >
        <CircleHelp className="size-4" />
        帮助
      </Button>

      <details
        data-tour="files"
        className="export-menu"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
        }}
      >
        <summary className="hover:bg-muted flex h-8 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
          文件
          <ChevronDown className="size-3.5" />
        </summary>
        <div className="export-menu__items">
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
                await createLocalResume(
                  file.name.replace(/\.json$/i, "") || "导入简历",
                  imported.resume,
                );
                toast.success(
                  imported.format === "resumecraft"
                    ? "ResumeCraft 备份已导入"
                    : "JSON Resume 已导入",
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
        </div>
      </details>
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
        导出 PDF
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
    <span
      className="text-muted-foreground mr-2 hidden items-center gap-1.5 text-xs md:flex"
      role="status"
    >
      <Icon
        className={`size-3.5 ${status === "saving" || status === "loading" ? "animate-spin" : ""}`}
      />
      {label}
    </span>
  );
}
