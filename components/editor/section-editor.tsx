"use client";

import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AnyItem, Section } from "@/lib/schema";
import { useResumeStore, useSection } from "@/lib/store/resume-store";
import { DebouncedTextarea, TagsField, TextAreaField, TextField } from "./debounced-field";
import { HAS_HIGHLIGHTS, ITEM_FIELDS, ITEM_TITLE_KEYS, type FieldDef } from "./item-fields";
import { AiPolish } from "./ai-polish";
import { ItemLayoutEditor } from "./item-layout-editor";

export function SectionEditor({ sectionId }: { sectionId: string }) {
  const section = useSection(sectionId);
  const updateSection = useResumeStore((s) => s.updateSection);
  const addItem = useResumeStore((s) => s.addItem);

  if (!section) return null;

  return (
    <div className="space-y-4">
      <TextField
        label="区块标题"
        id={`section-name-${sectionId}`}
        value={section.name}
        onCommit={(v) =>
          updateSection(sectionId, (draft) => {
            draft.name = v;
          })
        }
      />

      {section.type === "summary" ? (
        <TextAreaField
          label="内容"
          id={`summary-${sectionId}`}
          rows={5}
          value={section.content}
          placeholder="3 年后端开发经验，专注高并发交易系统……"
          onCommit={(v) =>
            updateSection(sectionId, (draft) => {
              if (draft.type === "summary") draft.content = v;
            })
          }
        />
      ) : (
        <>
          {section.type !== "skill" && (
            <ItemLayoutEditor sectionId={section.id} sectionType={section.type} />
          )}
          <div className="space-y-3">
            {section.items.map((item, index) => (
              <ItemCard
                key={item.id}
                section={section}
                item={item as AnyItem}
                index={index}
                total={section.items.length}
              />
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => addItem(sectionId)}>
            <Plus className="size-4" />
            添加一条
          </Button>
        </>
      )}
    </div>
  );
}

function ItemCard({
  section,
  item,
  index,
  total,
}: {
  section: Exclude<Section, { type: "summary" }>;
  item: AnyItem;
  index: number;
  total: number;
}) {
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);
  const moveItem = useResumeStore((s) => s.moveItem);
  const duplicateItem = useResumeStore((s) => s.duplicateItem);

  const record = item as unknown as Record<string, unknown>;
  const title =
    ITEM_TITLE_KEYS[section.type]
      .map((key) => record[key])
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .join(" · ") || `未命名条目 ${index + 1}`;

  const set = (key: string, value: unknown) =>
    updateItem(section.id, item.id, (draft) => {
      (draft as unknown as Record<string, unknown>)[key] = value;
    });

  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={item.visible ? "隐藏该条目" : "显示该条目"}
          onClick={() => set("visible", !item.visible)}
        >
          {item.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="上移"
          disabled={index === 0}
          onClick={() => moveItem(section.id, index, index - 1)}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="下移"
          disabled={index === total - 1}
          onClick={() => moveItem(section.id, index, index + 1)}
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="复制该条目"
          onClick={() => duplicateItem(section.id, item.id)}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="删除该条目"
          onClick={() => removeItem(section.id, item.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ITEM_FIELDS[section.type].map((field) => (
          <div key={field.key} className={field.span === 2 ? "col-span-2" : undefined}>
            <ItemField
              field={field}
              value={record[field.key]}
              onCommit={(v) => set(field.key, v)}
            />
          </div>
        ))}
      </div>

      {HAS_HIGHLIGHTS[section.type] ? (
        <>
          <Separator className="my-3" />
          <HighlightsField
            values={(record.highlights as string[]) ?? []}
            onCommit={(v) => set("highlights", v)}
          />
          <AiPolish
            sectionId={section.id}
            itemId={item.id}
            highlights={(record.highlights as string[]) ?? []}
          />
        </>
      ) : null}
    </div>
  );
}

function ItemField({
  field,
  value,
  onCommit,
}: {
  field: FieldDef;
  value: unknown;
  onCommit: (value: unknown) => void;
}) {
  if (field.kind === "tags") {
    return (
      <TagsField
        label={field.label}
        value={Array.isArray(value) ? (value as string[]) : []}
        placeholder={field.placeholder}
        onCommit={onCommit}
      />
    );
  }

  if (field.kind === "textarea") {
    return (
      <TextAreaField
        label={field.label}
        value={typeof value === "string" ? value : ""}
        placeholder={field.placeholder}
        onCommit={onCommit}
        rows={2}
      />
    );
  }

  const hint =
    field.kind === "date"
      ? "格式 2024 或 2024-06"
      : field.kind === "endDate"
        ? "留空表示至今"
        : undefined;

  return (
    <TextField
      label={field.label}
      value={typeof value === "string" ? value : ""}
      placeholder={field.placeholder}
      hint={hint}
      onCommit={(v) => onCommit(field.kind === "endDate" && v === "" ? "present" : v)}
    />
  );
}

/**
 * bullet 列表编辑器。
 * 每条独立成行是刻意的：P4 的 AI diff 和 P5 的 ATS 定位都以「一条 highlight」为单位，
 * UI 上也必须能单独指向某一条。
 */
function HighlightsField({
  values,
  onCommit,
}: {
  values: string[];
  onCommit: (values: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">经历描述（每条一个要点）</span>
        <Button variant="ghost" size="sm" onClick={() => onCommit([...values, ""])}>
          <Plus className="size-3.5" />
          添加要点
        </Button>
      </div>

      {values.map((value, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="text-muted-foreground mt-2.5 text-xs tabular-nums">{index + 1}.</span>
          <DebouncedTextarea
            aria-label={`第 ${index + 1} 条要点`}
            className="min-h-0 flex-1"
            value={value}
            placeholder="用「动词 + 做了什么 + 量化结果」的结构写，例如：主导支付链路重构，将对账差异率从 0.3% 降至 0.002%"
            onCommit={(next) => onCommit(values.map((v, i) => (i === index ? next : v)))}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`删除第 ${index + 1} 条要点`}
            onClick={() => onCommit(values.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
