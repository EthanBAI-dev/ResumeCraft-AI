"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { newId } from "@/lib/schema";
import { useResume, useResumeStore } from "@/lib/store/resume-store";
import { TextField } from "./debounced-field";

export function BasicsForm() {
  const basics = useResume((s) => s.resume.basics);
  const updateBasics = useResumeStore((s) => s.updateBasics);

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

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">显示照片</p>
          <p className="text-muted-foreground text-xs">国内简历常放，投海外岗位建议关闭</p>
        </div>
        <Switch
          checked={basics.photo.visible}
          onCheckedChange={(checked) =>
            updateBasics("photo", { ...basics.photo, visible: checked })
          }
        />
      </div>

      {basics.photo.visible ? (
        <TextField
          label="照片链接"
          value={basics.photo.url}
          onCommit={(v) => updateBasics("photo", { ...basics.photo, url: v })}
          placeholder="https://... 或 data:image/..."
        />
      ) : null}

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
