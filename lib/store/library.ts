"use client";
import { create } from "zustand";
import { get, update } from "idb-keyval";
import { createEmptyResume, newId, type ResumeData } from "@/lib/schema";
import { parseDraft } from "@/lib/schema/draft";
import { sampleResume } from "@/fixtures/sample-resume";
import { DEMO_PHOTO } from "@/fixtures/demo-photo";
import { LOCAL_DRAFT_KEY } from "@/lib/constants";
import { useResumeStore } from "./resume-store";

export const LIBRARY_KEY = "resumecraft:library:v1";
export type LocalResume = { id: string; title: string; updatedAt: number; data: ResumeData };
type Library = { version: 1; revision: number; activeId: string; entries: LocalResume[] };
type State = {
  entries: LocalResume[];
  activeId: string;
  epoch: number;
  status: "loading" | "saved" | "saving" | "error";
  savedAt: number | null;
  error: string;
  sampleNotice: boolean;
};
export const useLibraryStore = create<State>(() => ({
  entries: [],
  activeId: "",
  epoch: 0,
  status: "loading",
  savedAt: null,
  error: "",
  sampleNotice: false,
}));
let revision = 0;
let boot: Promise<void> | null = null;
let writes = Promise.resolve();
let timer: ReturnType<typeof setTimeout> | undefined;
let changing = false;
let frozen = false;

export function demoResume(): ResumeData {
  const data = structuredClone(sampleResume);
  data.basics.photo = { ...data.basics.photo, url: DEMO_PHOTO, visible: true };
  return data;
}
export function validateLibrary(raw: unknown): Library {
  const value = raw as Library;
  if (
    !value ||
    value.version !== 1 ||
    !Number.isInteger(value.revision) ||
    !Array.isArray(value.entries) ||
    !value.entries.length
  )
    throw new Error("本地简历库格式异常，原始数据已保留，请勿清除浏览器数据。");
  const ids = new Set<string>();
  for (const entry of value.entries) {
    if (
      !entry.id ||
      ids.has(entry.id) ||
      typeof entry.title !== "string" ||
      !Number.isFinite(entry.updatedAt)
    )
      throw new Error("本地简历库条目异常，原始数据已保留。");
    ids.add(entry.id);
    entry.data = parseDraft(entry.data);
  }
  if (!ids.has(value.activeId)) throw new Error("本地简历库当前条目不存在，原始数据已保留。");
  return value;
}
export function initializeLibrary() {
  if (boot) return boot;
  boot = (async () => {
    try {
      const stored = await get(LIBRARY_KEY);
      let library: Library;
      let first = false;
      if (stored) library = validateLibrary(stored);
      else {
        const legacy = await get<{ version: number; data: unknown; savedAt: number }>(
          LOCAL_DRAFT_KEY,
        );
        const data = legacy ? parseDraft(legacy.data) : demoResume();
        first = !legacy;
        const id = newId();
        library = {
          version: 1,
          revision: 0,
          activeId: id,
          entries: [
            {
              id,
              title: legacy ? "我的简历" : "示例简历",
              data,
              updatedAt: legacy?.savedAt || Date.now(),
            },
          ],
        };
        await update(LIBRARY_KEY, (current) => {
          if (current) throw new Error("另一个窗口已初始化简历库，请刷新。");
          return library;
        });
      }
      revision = library.revision;
      useLibraryStore.setState({
        entries: library.entries,
        activeId: library.activeId,
        status: "saved",
        savedAt: library.entries.find((e) => e.id === library.activeId)!.updatedAt,
        sampleNotice: first,
      });
      useResumeStore
        .getState()
        .replaceResume(library.entries.find((e) => e.id === library.activeId)!.data, {
          recordHistory: false,
        });
      useResumeStore.subscribe((state, previous) => {
        if (changing || frozen || state.resume === previous.resume) return;
        useLibraryStore.setState((current) => ({
          entries: current.entries.map((e) =>
            e.id === current.activeId ? { ...e, data: state.resume, updatedAt: Date.now() } : e,
          ),
          status: "saving",
          sampleNotice:
            state.resume.basics !== previous.resume.basics ||
            state.resume.sections !== previous.resume.sections
              ? false
              : current.sampleNotice,
        }));
        clearTimeout(timer);
        timer = setTimeout(() => {
          void flushLibrary().catch(() => {});
        }, 300);
      });
      window.addEventListener("pagehide", () => {
        void flushLibrary().catch(() => {});
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") void flushLibrary().catch(() => {});
      });
      window.addEventListener("beforeunload", (event) => {
        if (["saving", "error"].includes(useLibraryStore.getState().status)) {
          event.preventDefault();
          event.returnValue = "";
        }
      });
    } catch (error) {
      frozen = true;
      useLibraryStore.setState({
        status: "error",
        error:
          error instanceof Error ? error.message : "无法读取浏览器存储，请检查隐私模式或存储权限。",
      });
    }
  })();
  return boot;
}
export async function flushLibrary() {
  clearTimeout(timer);
  if (frozen) throw new Error(useLibraryStore.getState().error);
  const snapshot = useLibraryStore.getState();
  if (!snapshot.activeId || snapshot.status === "saved") return;
  const operation = writes.then(async () => {
    if (frozen) throw new Error(useLibraryStore.getState().error);
    await update<Library>(LIBRARY_KEY, (current) => {
      if (!current || current.revision !== revision)
        throw new Error(
          "其他窗口更新了简历库。请先导出当前 JSON 备份，再刷新；已停止写入以避免覆盖。",
        );
      return {
        version: 1,
        revision: revision + 1,
        activeId: snapshot.activeId,
        entries: snapshot.entries,
      };
    });
    revision++;
    if (useLibraryStore.getState().entries === snapshot.entries)
      useLibraryStore.setState({ status: "saved", savedAt: Date.now(), error: "" });
  });
  writes = operation.catch((error) => {
    frozen = true;
    useLibraryStore.setState({
      status: "error",
      error: error instanceof Error ? error.message : "本地保存失败，请先导出 JSON 备份。",
    });
  });
  await operation;
}
async function mutate(recipe: (state: State) => Pick<State, "entries" | "activeId">) {
  await flushLibrary();
  const next = recipe(useLibraryStore.getState());
  useLibraryStore.setState({ ...next, status: "saving" });
  await flushLibrary();
  changing = true;
  useResumeStore
    .getState()
    .replaceResume(next.entries.find((e) => e.id === next.activeId)!.data, {
      recordHistory: false,
    });
  useLibraryStore.setState((s) => ({ epoch: s.epoch + 1, sampleNotice: false }));
  changing = false;
}
export async function createLocalResume(title = "未命名简历", data = createEmptyResume()) {
  const id = newId();
  await mutate((s) => ({
    entries: [...s.entries, { id, title, data: structuredClone(data), updatedAt: Date.now() }],
    activeId: id,
  }));
}
export async function switchLocalResume(id: string) {
  if (!useLibraryStore.getState().entries.some((e) => e.id === id)) return;
  await mutate((s) => ({ entries: s.entries, activeId: id }));
}
export async function renameLocalResume(id: string, title: string) {
  await flushLibrary();
  useLibraryStore.setState((s) => ({
    entries: s.entries.map((e) =>
      e.id === id ? { ...e, title: title.trim().slice(0, 80) || "未命名简历" } : e,
    ),
    status: "saving",
  }));
  await flushLibrary();
}
export async function deleteLocalResume(id: string) {
  await mutate((s) => {
    const entries = s.entries.filter((e) => e.id !== id);
    if (!entries.length)
      entries.push({
        id: newId(),
        title: "未命名简历",
        updatedAt: Date.now(),
        data: createEmptyResume(),
      });
    return { entries, activeId: s.activeId === id ? entries[0].id : s.activeId };
  });
}
