"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DEMO_PHOTOS, isDemoPhoto } from "@/fixtures/demo-photo";
import { importPhoto } from "@/lib/photo";
import { useLibraryStore } from "@/lib/store/library";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { newId } from "@/lib/schema";
import { useResume, useResumeStore } from "@/lib/store/resume-store";
import { TextField } from "./debounced-field";

export function BasicsForm() {
  const basics = useResume((s) => s.resume.basics);
  const updateBasics = useResumeStore((s) => s.updateBasics);
  const photoInput = useRef<HTMLInputElement>(null);
  const photoGeneration = useRef(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  useEffect(
    () => () => {
      photoGeneration.current++;
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="姓名"
          value={basics.name}
          onCommit={(v) => updateBasics("name", v)}
          placeholder="张三"
        />
        <TextField
          label="求职意向 / 一句话标签"
          value={basics.headline}
          onCommit={(v) => updateBasics("headline", v)}
          placeholder="后端工程师 · 3 年经验"
        />
        <TextField
          label="手机"
          value={basics.phone}
          onCommit={(v) => updateBasics("phone", v)}
          placeholder="138-0000-0000"
        />
        <TextField
          label="邮箱"
          value={basics.email}
          onCommit={(v) => updateBasics("email", v)}
          placeholder="you@example.com"
        />
        <TextField
          label="城市"
          value={basics.location}
          onCommit={(v) => updateBasics("location", v)}
          placeholder="杭州"
        />
        <TextField
          label="个人主页"
          value={basics.url}
          onCommit={(v) => updateBasics("url", v)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-3 rounded-lg border p-3" data-tour="photo">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">简历照片</p>
          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            显示照片
            <Switch
              aria-label="显示照片"
              checked={basics.photo.visible}
              onCheckedChange={(checked) =>
                updateBasics("photo", { ...basics.photo, visible: checked })
              }
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="选择示例头像">
          {DEMO_PHOTOS.map((photo) => {
            const selected = basics.photo.url === photo.url;
            return (
              <button
                key={photo.id}
                type="button"
                aria-label={photo.label}
                aria-pressed={selected}
                disabled={photoBusy}
                onClick={() =>
                  updateBasics("photo", { ...basics.photo, url: photo.url, visible: true })
                }
                className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 ${selected ? "border-teal-600 bg-teal-50 dark:bg-teal-950" : "hover:bg-muted"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-12 w-[38.4px] shrink-0 object-cover" />
                <span className="min-w-0">
                  <span className="block text-xs font-medium">
                    {photo.id === "male" ? "男生" : "女生"}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {selected ? "已选择 · AI 示例" : "AI 示例 · 点击使用"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <input
          ref={photoInput}
          type="file"
          className="hidden"
          aria-label="上传照片文件"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const generation = ++photoGeneration.current;
            const activeId = useLibraryStore.getState().activeId;
            setPhotoBusy(true);
            try {
              const url = await importPhoto(file);
              if (
                generation === photoGeneration.current &&
                useLibraryStore.getState().activeId === activeId
              ) {
                const current = useResumeStore.getState().resume.basics.photo;
                updateBasics("photo", { ...current, visible: true, url });
                toast.success("照片已导入，仅保存在本地");
              }
            } catch (error) {
              if (generation === photoGeneration.current)
                toast.error(error instanceof Error ? error.message : "图片无法读取，请换一张图片");
            } finally {
              if (generation === photoGeneration.current) setPhotoBusy(false);
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={photoBusy}
            onClick={() => photoInput.current?.click()}
          >
            {photoBusy ? "处理照片…" : "上传照片"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={photoBusy || !basics.photo.url}
            onClick={() => updateBasics("photo", { ...basics.photo, url: "", visible: false })}
          >
            移除照片
          </Button>
        </div>
        <p className="text-muted-foreground text-xs" role="status">
          {basics.photo.url
            ? isDemoPhoto(basics.photo.url)
              ? "AI 虚构示例，投递前请替换。实际效果见简历纸张。"
              : "已使用上传的照片，仅保存在本机。实际效果见简历纸张。"
            : "尚未添加照片，可选示例或上传自己的照片。"}
        </p>
        <p className="text-muted-foreground text-[11px]">
          JPG / PNG / WebP · 最大 5 MB · 竖版矩形 4:5
        </p>
        {basics.photo.visible && (
          <label className="text-muted-foreground block text-xs">
            照片宽度 · {basics.photo.size}px
            <input
              aria-label="照片大小"
              className="mt-2 w-full"
              type="range"
              min={32}
              max={160}
              value={basics.photo.size}
              onChange={(e) =>
                updateBasics("photo", { ...basics.photo, size: Number(e.target.value) })
              }
            />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            其他联系方式（GitHub / 博客 …）
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              updateBasics("customFields", [
                ...basics.customFields,
                { id: newId(), icon: "link", label: "", value: "", url: "" },
              ])
            }
          >
            <Plus className="size-3.5" />
            添加
          </Button>
        </div>

        {basics.customFields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="w-28 shrink-0">
              <TextField
                label="名称"
                id={`cf-label-${field.id}`}
                value={field.label}
                onCommit={(v) => {
                  const next = [...basics.customFields];
                  next[index] = { ...field, label: v };
                  updateBasics("customFields", next);
                }}
                placeholder="GitHub"
              />
            </div>
            <div className="flex-1">
              <TextField
                label="内容"
                id={`cf-value-${field.id}`}
                value={field.value}
                onCommit={(v) => {
                  const next = [...basics.customFields];
                  next[index] = { ...field, value: v };
                  updateBasics("customFields", next);
                }}
                placeholder="github.com/you"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="删除该联系方式"
              onClick={() =>
                updateBasics(
                  "customFields",
                  basics.customFields.filter((f) => f.id !== field.id),
                )
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
