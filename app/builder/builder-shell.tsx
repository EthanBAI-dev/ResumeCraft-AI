"use client";

import { EditorPanel } from "@/components/editor/editor-panel";
import { Toolbar } from "@/components/editor/toolbar";
import { PreviewCanvas } from "@/components/preview/preview-canvas";
import { useDraftPersistence } from "@/lib/store/persistence";

export function BuilderShell() {
  const { status, savedAt } = useDraftPersistence();

  return (
    <div className="flex h-dvh flex-col">
      <Toolbar status={status} savedAt={savedAt} />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(380px,34%)_1fr]">
        <aside className="hidden min-h-0 border-r lg:block">
          <EditorPanel />
        </aside>
        <main className="min-h-0">
          <PreviewCanvas />
        </main>
      </div>
    </div>
  );
}
