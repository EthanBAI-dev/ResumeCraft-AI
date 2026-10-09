"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  CornerDownLeft,
  Eye,
  EyeOff,
  GripVertical,
  Minus,
  Plus,
} from "lucide-react";
import { DEFAULT_ITEM_LAYOUT, type ItemLayoutAlign, type ItemLayoutAtom } from "@/lib/schema";
import {
  createItemLayoutAtoms,
  fieldDefinition,
  resolveItemLayoutAtoms,
  type AtomicLayoutType,
} from "@/lib/layout/item-layout";
import { useResume, useResumeStore } from "@/lib/store/resume-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils";

const PRESETS = [
  { value: "inline", label: "紧凑一行" },
  { value: "split", label: "标准两行" },
  { value: "stacked", label: "纵向堆叠" },
] as const;

const atomDndId = (sectionId: string, field: string) => `item-atom:${sectionId}:${field}`;
const fieldFromDndId = (id: string) => id.split(":").at(-1) ?? "";

export function ItemLayoutEditor({
  sectionId,
  sectionType,
}: {
  sectionId: string;
  sectionType: AtomicLayoutType;
}) {
  const saved = useResume((state) => state.resume.metadata.itemLayouts?.[sectionId]);
  const updateMetadata = useResumeStore((state) => state.updateMetadata);
  const source = saved ?? DEFAULT_ITEM_LAYOUT;
  const atoms = resolveItemLayoutAtoms(sectionType, source);
  const [activeField, setActiveField] = useState<string | null>(null);
  const showGuides = () => {
    useEditorStore.getState().setActiveSection(sectionId);
    useEditorStore.getState().setLayoutMode(true);
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commitAtoms = (next: ItemLayoutAtom[]) => {
    showGuides();
    updateMetadata((draft) => {
      draft.itemLayouts ??= {};
      draft.itemLayouts[sectionId] = {
        ...source,
        preset: "custom",
        atoms: next,
        hidden: next.filter((atom) => !atom.visible).map((atom) => atom.field),
      };
    });
  };

  const applyPreset = (preset: (typeof PRESETS)[number]["value"]) => {
    showGuides();
    updateMetadata((draft) => {
      draft.itemLayouts ??= {};
      draft.itemLayouts[sectionId] = {
        ...source,
        preset,
        atoms: createItemLayoutAtoms(sectionType, preset, source),
      };
    });
  };

  const updateAtom = (field: string, recipe: (atom: ItemLayoutAtom) => ItemLayoutAtom) =>
    commitAtoms(atoms.map((atom) => (atom.field === field ? recipe(atom) : atom)));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveField(null);
    if (!over || active.id === over.id) return;
    const from = atoms.findIndex((atom) => atom.field === fieldFromDndId(String(active.id)));
    const to = atoms.findIndex((atom) => atom.field === fieldFromDndId(String(over.id)));
    if (from < 0 || to < 0) return;
    commitAtoms(arrayMove(atoms, from, to));
  };

  return (
    <details
      className="item-layout-editor bg-muted/35 my-3 space-y-3 rounded-lg border p-3"
      onToggle={(event) => {
        if (event.currentTarget.open && useEditorStore.getState().guideStep === null) showGuides();
      }}
      onFocusCapture={() => useEditorStore.getState().setActiveSection(sectionId)}
    >
      <summary className="cursor-pointer text-sm font-medium" data-tour="field-layout">
        字段排版 · 12 格{" "}
        <span className="text-muted-foreground text-xs font-normal">点击展开 / 收起</span>
      </summary>
      <div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          拖动字段换位，使用 − / + 调宽；纸张同步显示虚线和 12
          格辅助线。空内容和隐藏字段不占空间，点击「完成布局」可收起辅助线。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-label={`套用${preset.label}预设`}
            onClick={() => applyPreset(preset.value)}
            className="hover:bg-accent bg-background rounded-md border px-2 py-1.5 text-xs transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <DndContext
        id={`item-layout-${sectionId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveField(fieldFromDndId(String(active.id)))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveField(null)}
        accessibility={{
          announcements: {
            onDragStart: () => "开始移动字段",
            onDragOver: ({ over }) => (over ? "已找到字段位置" : "未找到字段位置"),
            onDragEnd: ({ over }) => (over ? "字段已移动" : "已取消移动"),
            onDragCancel: () => "已取消移动",
          },
        }}
      >
        <SortableContext
          items={atoms.map((atom) => atomDndId(sectionId, atom.field))}
          strategy={rectSortingStrategy}
        >
          <div className="item-layout-grid grid min-h-20 grid-cols-12 gap-1 rounded-md border p-1.5">
            {atoms.map((atom) => (
              <SortableAtom
                key={atom.field}
                sectionId={sectionId}
                sectionType={sectionType}
                atom={atom}
                onChange={(next) => updateAtom(atom.field, () => next)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeField ? (
            <div className="bg-popover rounded-md border px-3 py-2 text-xs shadow-lg">
              {fieldDefinition(sectionType, activeField as ItemLayoutAtom["field"])?.label ??
                "移动字段"}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        <span>↵ = 强制换行</span>
        <span>数字 = 占用格数</span>
        <span>眼睛 = 仅隐藏呈现</span>
      </div>
    </details>
  );
}

function SortableAtom({
  sectionId,
  sectionType,
  atom,
  onChange,
}: {
  sectionId: string;
  sectionType: AtomicLayoutType;
  atom: ItemLayoutAtom;
  onChange: (atom: ItemLayoutAtom) => void;
}) {
  const definition = fieldDefinition(sectionType, atom.field);
  const minSpan = definition?.minSpan ?? 2;
  const compactControls = atom.span <= 2 ? "size-3 p-0" : undefined;
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: atomDndId(sectionId, atom.field),
    data: { kind: "item-layout-atom", field: atom.field },
  });
  const nextAlign: Record<ItemLayoutAlign, ItemLayoutAlign> = {
    left: "center",
    center: "right",
    right: "left",
  };
  const AlignIcon =
    atom.align === "left" ? AlignLeft : atom.align === "center" ? AlignCenter : AlignRight;
  // rectSortingStrategy 会根据目标卡片尺寸附带 scaleX/scaleY。不同 span 的字段互换时
  // 这会把卡片拉成橡皮筋；这里只保留位移，让原子在拖动全过程维持原始尺寸。
  const translate = transform
    ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
    : undefined;

  return (
    <div
      ref={setNodeRef}
      data-atom-field={atom.field}
      data-atom-span={atom.span}
      className={cn(
        "bg-card min-w-0 rounded border p-1 shadow-xs",
        atom.span <= 2 && "p-0.5",
        !atom.visible && "opacity-45",
        isDragging && "opacity-25",
      )}
      style={{
        gridColumn: atom.breakBefore ? `1 / span ${atom.span}` : `span ${atom.span}`,
        transform: translate,
        transition: isDragging ? undefined : transition,
        willChange: transform ? "transform" : undefined,
      }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-1">
        <div className="flex min-w-0 flex-1 basis-12 items-center gap-0.5">
          <button
            type="button"
            aria-label={`拖动${definition?.label ?? atom.field}`}
            title="拖动换位；键盘可用空格键拾取"
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3" />
          </button>
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
            {definition?.label ?? atom.field}
          </span>
        </div>
        <div
          role="group"
          aria-label={`${definition?.label ?? atom.field}占用格数`}
          className="item-layout-width text-muted-foreground ml-auto flex shrink-0 items-center"
        >
          <AtomButton
            className={compactControls}
            label={`减少${definition?.label ?? atom.field}宽度`}
            disabled={atom.span <= minSpan}
            onClick={() => onChange({ ...atom, span: Math.max(minSpan, atom.span - 1) })}
          >
            <Minus className="size-3" />
          </AtomButton>
          <span className="w-3 text-center text-[10px] tabular-nums" title="占用格数">
            {atom.span}
          </span>
          <AtomButton
            className={compactControls}
            label={`增加${definition?.label ?? atom.field}宽度`}
            disabled={atom.span >= 12}
            onClick={() => onChange({ ...atom, span: Math.min(12, atom.span + 1) })}
          >
            <Plus className="size-3" />
          </AtomButton>
        </div>
      </div>

      <div className="item-layout-actions mt-1 flex items-center justify-between">
        <AtomButton
          className={compactControls}
          label={`${atom.breakBefore ? "取消" : "设置"}${definition?.label ?? atom.field}强制换行`}
          pressed={atom.breakBefore}
          onClick={() => onChange({ ...atom, breakBefore: !atom.breakBefore })}
        >
          <CornerDownLeft className="size-3" />
        </AtomButton>
        <AtomButton
          className={compactControls}
          label={`切换${definition?.label ?? atom.field}对齐方式，当前${atom.align}`}
          onClick={() => onChange({ ...atom, align: nextAlign[atom.align] })}
        >
          <AlignIcon className="size-3" />
        </AtomButton>
        <AtomButton
          className={compactControls}
          label={`${atom.visible ? "隐藏" : "显示"}${definition?.label ?? atom.field}`}
          pressed={!atom.visible}
          onClick={() => onChange({ ...atom, visible: !atom.visible })}
        >
          {atom.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        </AtomButton>
      </div>
    </div>
  );
}

function AtomButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "hover:bg-accent text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-25",
        pressed && "bg-primary/10 text-primary",
        className,
      )}
    >
      {children}
    </button>
  );
}
