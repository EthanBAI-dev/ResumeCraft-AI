"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLocalResume,
  deleteLocalResume,
  renameLocalResume,
  switchLocalResume,
  useLibraryStore,
} from "@/lib/store/library";
import { LocalDialog } from "./local-dialog";
export function ResumeLibrary({ onClose }: { onClose: () => void }) {
  const entries = useLibraryStore((s) => s.entries);
  const activeId = useLibraryStore((s) => s.activeId);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败，数据未清除");
    } finally {
      setBusy(false);
    }
  }
  return (
    <LocalDialog title="我的简历" onClose={onClose}>
      <p className="text-muted-foreground text-sm">
        免费使用，无需登录。简历仅保存在当前浏览器，不会跨设备同步；清理浏览器前请逐份导出 JSON
        备份。
      </p>
      <Button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            await createLocalResume();
            onClose();
          })
        }
      >
        新建空白简历
      </Button>
      <div className="space-y-3">
        {entries.map((entry) => (
          <section
            key={entry.id}
            className={`rounded-xl border p-3 ${entry.id === activeId ? "border-primary bg-teal-50/50" : ""}`}
          >
            <label className="text-muted-foreground text-xs">
              简历名称{entry.id === activeId ? " · 当前编辑" : ""}
              <Input
                aria-label={`简历名称 ${entry.title}`}
                defaultValue={entry.title}
                maxLength={80}
                disabled={busy}
                onBlur={(e) => {
                  if (e.target.value !== entry.title)
                    void run(() => renameLocalResume(entry.id, e.target.value));
                }}
              />
            </label>
            <p className="text-muted-foreground my-2 text-xs">
              {entry.data.basics.name || "尚未填写姓名"} ·{" "}
              {new Date(entry.updatedAt).toLocaleString("zh-CN")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy || entry.id === activeId}
                onClick={() =>
                  void run(async () => {
                    await switchLocalResume(entry.id);
                    onClose();
                  })
                }
              >
                打开 {entry.title}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await createLocalResume(`${entry.title} · 副本`, entry.data);
                    onClose();
                  })
                }
              >
                复制 {entry.title}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setDeleting(entry.id)}
              >
                删除 {entry.title}
              </Button>
            </div>
            {deleting === entry.id && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm" role="alert">
                <p>删除「{entry.title}」后不能撤销。请先导出 JSON 备份。</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await deleteLocalResume(entry.id);
                        setDeleting(null);
                      })
                    }
                  >
                    确认删除
                  </Button>
                  <Button variant="outline" onClick={() => setDeleting(null)}>
                    取消
                  </Button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </LocalDialog>
  );
}
