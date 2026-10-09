"use client";

import { FilePenLine, ScanEye } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorPanel } from "@/components/editor/editor-panel";
import { Toolbar } from "@/components/editor/toolbar";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { useDraftPersistence } from "@/lib/store/persistence";
import { useEditorStore } from "@/lib/store/editor-store";
import { EditorGuide } from "@/components/editor/editor-guide";
import { useLibraryStore } from "@/lib/store/library";

export function BuilderShell() {
  const { status, savedAt } = useDraftPersistence();
  const epoch = useLibraryStore((s) => s.epoch);
  const storageError = useLibraryStore((s) => s.error);
  const view = useEditorStore((state) => state.mobileView);
  const setView = useEditorStore((state) => state.setMobileView);

  return (
    <div className="workspace flex h-dvh flex-col">
      <Toolbar status={status} savedAt={savedAt} />
      {storageError && (
        <div role="alert" className="border-b bg-red-50 p-3 text-sm text-red-800">
          {storageError} 当前内容仍可通过「文件 → JSON」备份。
        </div>
      )}
      <div
        className="mobile-switch flex gap-2 border-b bg-white p-2 lg:hidden"
        aria-label="编辑器视图"
      >
        <button
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm",
            view === "edit" && "bg-primary text-white",
          )}
          aria-pressed={view === "edit"}
          onClick={() => setView("edit")}
        >
          <FilePenLine className="size-4" />
          编辑内容
        </button>
        <button
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm",
            view === "preview" && "bg-primary text-white",
          )}
          aria-pressed={view === "preview"}
          onClick={() => setView("preview")}
        >
          <ScanEye className="size-4" />
          纸张预览
        </button>
      </div>
      <div className="workspace-body grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[410px_minmax(0,1fr)]">
        <aside
          className={cn("editor-sidebar min-h-0 border-r lg:block", view !== "edit" && "hidden")}
        >
          {status === "loading" ? (
            <p className="p-5">正在读取本地简历…</p>
          ) : (
            <EditorPanel key={epoch} />
          )}
        </aside>
        <main
          className={cn(
            "workspace-preview min-h-0 min-w-0 lg:block",
            view !== "preview" && "hidden",
          )}
        >
          <PreviewCanvas />
        </main>
      </div>
      <EditorGuide ready={status !== "loading" && !storageError} />
    </div>
  );
}
