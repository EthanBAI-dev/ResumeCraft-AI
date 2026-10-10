"use client";
import { t, useLanguage } from "@/lib/i18n";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ResumeData } from "@/lib/schema";
import { findSection } from "@/lib/layout/operations";
import { useResumeStore } from "@/lib/store/resume-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils";
import { ResumeDocument } from "./resume-document";

const sectionDndId = (id: string) => `section:${id}`;
const columnDndId = (page: number, column: number) => `column:${page}:${column}`;

type Location = { page: number; column: number; index: number };

function parseColumnId(id: string): Pick<Location, "page" | "column"> | null {
  const match = /^column:(\d+):(\d+)$/.exec(id);
  return match ? { page: Number(match[1]), column: Number(match[2]) } : null;
}

function parseSectionId(id: string): string | null {
  return id.startsWith("section:") ? id.slice("section:".length) : null;
}

/**
 * 编辑态的外壳。ResumeDocument 仍是唯一内容渲染器；这个组件只往它注入
 * 可放置栏和可排序区块，不复制任意一行简历 DOM。
 */
export function LayoutEditor({ resume }: { resume: ResumeData }) {
  useLanguage();
  const moveSectionTo = useResumeStore((state) => state.moveSectionTo);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [overSectionId, setOverSectionId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveSectionId(null);
    setOverSectionId(null);
    if (!over) return;
    const id = parseSectionId(String(active.id));
    if (!id) return;

    const overColumn = parseColumnId(String(over.id));
    let target: Location | null = overColumn ? { ...overColumn, index: 0 } : null;

    if (!target) {
      const overSection = parseSectionId(String(over.id));
      if (!overSection) return;
      target = findSection(resume.layout, overSection);
    }
    if (!target) return;

    const source = findSection(resume.layout, id);
    if (
      source &&
      source.page === target.page &&
      source.column === target.column &&
      source.index === target.index
    ) {
      return;
    }

    moveSectionTo(id, target);
  };

  return (
    <DndContext
      id="resume-layout-editor"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveSectionId(parseSectionId(String(active.id)))}
      onDragOver={({ over }) => setOverSectionId(over ? parseSectionId(String(over.id)) : null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveSectionId(null);
        setOverSectionId(null);
      }}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            t("开始移动 {0}", parseSectionId(String(active.id)) ?? "区块"),
          onDragOver: ({ over }) => (over ? t("已找到可放置位置") : t("未找到可放置位置")),
          onDragEnd: ({ over }) => (over ? t("区块已移动") : t("已取消移动")),
          onDragCancel: () => t("已取消移动"),
        },
      }}
    >
      <ResumeDocument
        resume={resume}
        renderColumn={({ pageIndex, columnIndex, sectionIds, children }) => (
          <SortableColumn
            key={`${pageIndex}-${columnIndex}`}
            page={pageIndex}
            column={columnIndex}
            ids={sectionIds}
          >
            {children}
          </SortableColumn>
        )}
        renderBlock={({ id, children }) => (
          <SortableSection id={id} isDropTarget={overSectionId === id && activeSectionId !== id}>
            {children}
          </SortableSection>
        )}
      />
      <DragOverlay dropAnimation={null}>
        {activeSectionId ? <div className="layout-drag-overlay">{t("移动区块")}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableColumn({
  page,
  column,
  ids,
  children,
}: {
  page: number;
  column: number;
  ids: readonly string[];
  children: ReactNode;
}) {
  useLanguage();
  const { isOver, setNodeRef } = useDroppable({
    id: columnDndId(page, column),
    data: { kind: "column", page, column },
  });

  return (
    <SortableContext items={ids.map(sectionDndId)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn("layout-drop-zone", isOver && "layout-drop-zone--over")}>
        {children}
      </div>
    </SortableContext>
  );
}

function SortableSection({
  id,
  isDropTarget,
  children,
}: {
  id: string;
  isDropTarget: boolean;
  children: ReactNode;
}) {
  useLanguage();
  const isActive = useEditorStore((state) => state.activeSectionId === id);
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: sectionDndId(id),
    data: { kind: "section", sectionId: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "layout-section",
        isActive && "layout-section--active",
        isDragging && "layout-section--dragging",
        isDropTarget && "layout-section--over",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-layout-section={id}
    >
      <button
        type="button"
        className="layout-drag-handle"
        aria-label={t("拖动区块 {0}", id)}
        title={t("拖动排序；键盘可用空格键拾取")}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      {children}
    </div>
  );
}
