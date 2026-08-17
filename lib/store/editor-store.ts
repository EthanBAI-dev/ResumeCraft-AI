"use client";

import { create } from "zustand";

/**
 * UI 状态单独一个 store。
 *
 * 关键在于它**不进撤销历史** —— 如果和简历数据混在一起，
 * "展开一个折叠面板"这种操作也会占用一格 undo，用户按 Ctrl+Z 会以为自己没撤销成功。
 */
type EditorState = {
  /** 当前在左侧编辑器里聚焦的区块，同时用于预览高亮 */
  activeSectionId: string | null;
  /** 展开的区块面板（可多开） */
  expandedSections: string[];
  /** 预览缩放；null = 自适应容器宽度 */
  zoom: number | null;
  showPageBreaks: boolean;
  /** 从 ATS / AI 面板跳转过来时，需要滚动并高亮的目标 */
  focusTarget: { sectionId: string; itemId?: string; field?: string } | null;

  setActiveSection: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  expand: (id: string) => void;
  setZoom: (zoom: number | null) => void;
  zoomBy: (delta: number) => void;
  togglePageBreaks: () => void;
  focusOn: (target: EditorState["focusTarget"]) => void;
  clearFocus: () => void;
};

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 2;

export const useEditorStore = create<EditorState>()((set, get) => ({
  activeSectionId: null,
  expandedSections: ["basics"],
  zoom: null,
  showPageBreaks: true,
  focusTarget: null,

  setActiveSection: (id) => set({ activeSectionId: id }),

  toggleExpanded: (id) =>
    set((state) => ({
      expandedSections: state.expandedSections.includes(id)
        ? state.expandedSections.filter((x) => x !== id)
        : [...state.expandedSections, id],
    })),

  expand: (id) =>
    set((state) =>
      state.expandedSections.includes(id)
        ? state
        : { expandedSections: [...state.expandedSections, id] },
    ),

  setZoom: (zoom) =>
    set({ zoom: zoom === null ? null : Math.min(Math.max(zoom, ZOOM_MIN), ZOOM_MAX) }),

  zoomBy: (delta) => {
    const current = get().zoom ?? 1;
    get().setZoom(current + delta);
  },

  togglePageBreaks: () => set((state) => ({ showPageBreaks: !state.showPageBreaks })),

  focusOn: (target) =>
    set((state) => ({
      focusTarget: target,
      activeSectionId: target?.sectionId ?? state.activeSectionId,
      expandedSections:
        target && !state.expandedSections.includes(target.sectionId)
          ? [...state.expandedSections, target.sectionId]
          : state.expandedSections,
    })),

  clearFocus: () => set({ focusTarget: null }),
}));
