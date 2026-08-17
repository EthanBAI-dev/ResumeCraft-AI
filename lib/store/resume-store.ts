"use client";

import { create } from "zustand";
import { useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { current } from "immer";
import { temporal } from "zundo";
import { HISTORY_LIMIT } from "@/lib/constants";
import {
  insertSection,
  normalizeLayout,
  removeSection as removeFromLayout,
  type Layout,
  type LayoutAddr,
} from "@/lib/layout/operations";
import {
  availableSectionIds,
  createEmptyResume,
  createItem,
  createSection,
  newId,
  type AnyItem,
  type Basics,
  type Metadata,
  type ResumeData,
  type Section,
  type SectionType,
} from "@/lib/schema";

type ResumeState = {
  resume: ResumeData;
};

type ResumeActions = {
  /**
   * 整份替换（加载草稿 / 导入 / 切模板预设）。会顺手 normalize layout。
   *
   * recordHistory=false 用于「启动时从 IndexedDB 恢复草稿」——
   * 那一步不该产生一条可撤销的历史，否则用户按一次 Ctrl+Z 简历就空了。
   */
  replaceResume: (resume: ResumeData, options?: { recordHistory?: boolean }) => void;
  reset: () => void;

  updateBasics: <K extends keyof Basics>(key: K, value: Basics[K]) => void;
  updateMetadata: (recipe: (draft: Metadata) => void) => void;

  addSection: (type: SectionType, name?: string) => string;
  updateSection: (id: string, recipe: (draft: Section) => void) => void;
  removeSection: (id: string) => void;
  toggleSectionVisible: (id: string) => void;

  addItem: (sectionId: string) => string | null;
  updateItem: (sectionId: string, itemId: string, recipe: (draft: AnyItem) => void) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, from: number, to: number) => void;
  duplicateItem: (sectionId: string, itemId: string) => void;

  /**
   * 结构布局与内容编辑共用同一份 undo 历史。自动分页属于派生结果，
   * 不应在用户每次输入后额外塞进一条撤销记录，因此可显式跳过历史。
   */
  setLayout: (layout: Layout, options?: { recordHistory?: boolean }) => void;
  moveSectionTo: (id: string, addr: LayoutAddr) => void;
};

export type ResumeStore = ResumeState & ResumeActions;

/**
 * 前沿节流：一串连续操作只记一次历史，且锚定在这串操作开始之前的状态。
 * 不做的话，撤销会变成"一个字一个字往回退"，用户体验极差。
 *
 * reset() 必须存在：程序化替换整份简历（恢复草稿）之后如果不重置窗口，
 * 用户紧接着的第一次编辑会落在节流窗口内被吞掉，导致这一步无法撤销。
 */
function createLeadingThrottle(ms: number) {
  let last = 0;
  return {
    wrap<A extends unknown[]>(fn: (...args: A) => void) {
      return (...args: A) => {
        const now = Date.now();
        if (now - last >= ms) {
          last = now;
          fn(...args);
        }
      };
    },
    reset() {
      last = 0;
    },
  };
}

const historyThrottle = createLeadingThrottle(500);

export const useResumeStore = create<ResumeStore>()(
  temporal(
    immer((set, get) => ({
      resume: createEmptyResume(),

      replaceResume: (resume, options) => {
        const record = options?.recordHistory ?? true;
        const temporalStore = useResumeStore.temporal.getState();
        if (!record) temporalStore.pause();

        set((state) => {
          state.resume = {
            ...resume,
            layout: normalizeLayout(resume.layout, availableSectionIds(resume)),
          };
        });

        if (!record) {
          temporalStore.resume();
          temporalStore.clear();
          historyThrottle.reset();
        }
      },

      reset: () => set((state) => void (state.resume = createEmptyResume())),

      updateBasics: (key, value) =>
        set((state) => {
          state.resume.basics[key] = value;
        }),

      updateMetadata: (recipe) =>
        set((state) => {
          recipe(state.resume.metadata);
        }),

      addSection: (type, name) => {
        const section = createSection(type, name);
        set((state) => {
          state.resume.sections[section.id] = section;
          // 新区块落在第 1 页主栏末尾，用户随后可以拖走
          state.resume.layout = insertSection(state.resume.layout, section.id, {
            page: 0,
            column: 0,
            index: Number.POSITIVE_INFINITY,
          });
        });
        return section.id;
      },

      updateSection: (id, recipe) =>
        set((state) => {
          const section = state.resume.sections[id];
          if (section) recipe(section);
        }),

      removeSection: (id) =>
        set((state) => {
          delete state.resume.sections[id];
          state.resume.layout = removeFromLayout(state.resume.layout, id);
        }),

      toggleSectionVisible: (id) =>
        set((state) => {
          const section = state.resume.sections[id];
          if (section) section.visible = !section.visible;
        }),

      addItem: (sectionId) => {
        const section = get().resume.sections[sectionId];
        if (!section || section.type === "summary") return null;
        const item = createItem(section.type);
        set((state) => {
          const target = state.resume.sections[sectionId];
          if (target && target.type !== "summary") target.items.push(item as never);
        });
        return item.id;
      },

      updateItem: (sectionId, itemId, recipe) =>
        set((state) => {
          const section = state.resume.sections[sectionId];
          if (!section || section.type === "summary") return;
          const item = section.items.find((i) => i.id === itemId);
          if (item) recipe(item as AnyItem);
        }),

      removeItem: (sectionId, itemId) =>
        set((state) => {
          const section = state.resume.sections[sectionId];
          if (!section || section.type === "summary") return;
          section.items = section.items.filter((i) => i.id !== itemId) as never;
        }),

      moveItem: (sectionId, from, to) =>
        set((state) => {
          const section = state.resume.sections[sectionId];
          if (!section || section.type === "summary") return;
          const items = section.items as unknown[];
          if (from < 0 || from >= items.length) return;
          const target = Math.min(Math.max(to, 0), items.length - 1);
          const [moved] = items.splice(from, 1);
          items.splice(target, 0, moved);
        }),

      duplicateItem: (sectionId, itemId) =>
        set((state) => {
          const section = state.resume.sections[sectionId];
          if (!section || section.type === "summary") return;
          const items = section.items as { id: string }[];
          const index = items.findIndex((i) => i.id === itemId);
          if (index === -1) return;
          // items[index] 是 immer 的 Proxy，直接 structuredClone 会抛 DataCloneError；
          // current() 先取出普通对象快照，再深拷贝断开与原条目的引用共享。
          const copy = structuredClone(current(items[index]));
          copy.id = newId();
          items.splice(index + 1, 0, copy);
        }),

      setLayout: (layout, options) => {
        const record = options?.recordHistory ?? true;
        const temporalStore = useResumeStore.temporal.getState();
        if (!record) temporalStore.pause();

        set((state) => {
          state.resume.layout = normalizeLayout(layout, availableSectionIds(state.resume));
        });

        if (!record) temporalStore.resume();
      },

      moveSectionTo: (id, addr) =>
        set((state) => {
          state.resume.layout = insertSection(state.resume.layout, id, addr);
        }),
    })),
    {
      limit: HISTORY_LIMIT,
      // 只把简历数据纳入历史；action 函数和将来的 UI 字段都不该进撤销栈
      partialize: (state) => ({ resume: state.resume }) as ResumeStore,
      equality: (a, b) => a.resume === b.resume,
      handleSet: (handleSet) => historyThrottle.wrap(handleSet),
    },
  ),
);

/** 精确订阅：预览里每个区块只订阅自己那一片，避免整棵树重渲染（ADR-005） */
export function useResume<T>(selector: (state: ResumeStore) => T): T {
  return useResumeStore(selector);
}

export const useSection = (id: string) => useResume((s) => s.resume.sections[id]);
export const useMetadata = () => useResume((s) => s.resume.metadata);
export const useBasics = () => useResume((s) => s.resume.basics);
export const useLayout = () => useResume((s) => s.resume.layout);

/** 撤销/重做。zundo 把历史挂在 store.temporal 上。 */
export function useResumeHistory() {
  const temporalStore = useResumeStore.temporal;
  const pastStates = useStore(temporalStore, (s) => s.pastStates);
  const futureStates = useStore(temporalStore, (s) => s.futureStates);
  return {
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    undo: () => temporalStore.getState().undo(),
    redo: () => temporalStore.getState().redo(),
    clear: () => temporalStore.getState().clear(),
  };
}
