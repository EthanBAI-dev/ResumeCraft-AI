import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { DEMO_PHOTO } from "@/fixtures/demo-photo";
import { LOCAL_DRAFT_KEY } from "@/lib/constants";
const db = vi.hoisted(() => new Map<string, unknown>());
vi.mock("idb-keyval", () => ({
  get: async (key: string) => structuredClone(db.get(key)),
  update: async (key: string, updater: (raw: unknown) => unknown) => {
    const value = updater(structuredClone(db.get(key)));
    db.set(key, structuredClone(value));
  },
}));
beforeEach(() => {
  vi.resetModules();
  db.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe("local resume library", () => {
  it("only initializes a sample for a fresh browser, then stores independent drafts", async () => {
    const l = await import("./library");
    const { useResumeStore: r } = await import("./resume-store");
    await l.initializeLibrary();
    expect(l.useLibraryStore.getState().sampleNotice).toBe(true);
    expect(r.getState().resume.basics.photo.url).toBe(DEMO_PHOTO);
    expect(r.getState().resume.basics.photo.visible).toBe(true);
    const first = l.useLibraryStore.getState().activeId;
    r.getState().updateBasics("name", "原简历");
    await l.createLocalResume("第二份");
    expect(r.getState().resume.basics.name).toBe("");
    r.getState().updateBasics("name", "另一份");
    await l.switchLocalResume(first);
    expect(r.getState().resume.basics.name).toBe("原简历");
    expect(r.temporal.getState().pastStates).toHaveLength(0);
    expect(l.useLibraryStore.getState().entries.map((e) => e.data.basics.name)).toEqual([
      "原简历",
      "另一份",
    ]);
    await l.renameLocalResume(first, "后端投递");
    expect(l.useLibraryStore.getState().entries[0].title).toBe("后端投递");
    await l.deleteLocalResume(first);
    expect(r.getState().resume.basics.name).toBe("另一份");
    await l.deleteLocalResume(l.useLibraryStore.getState().activeId);
    expect(l.useLibraryStore.getState().entries).toHaveLength(1);
    expect(r.getState().resume.basics.name).toBe("");
  });
  it("migrates unfinished legacy drafts without replacing them with a sample", async () => {
    const draft = structuredClone(sampleResume);
    draft.basics.email = "unfinished@";
    if (draft.sections.experience.type === "experience")
      draft.sections.experience.items[0].company = "";
    db.set(LOCAL_DRAFT_KEY, { version: 1, data: draft, savedAt: 1 });
    const l = await import("./library");
    await l.initializeLibrary();
    expect(l.useLibraryStore.getState().entries[0].data).toEqual(draft);
    expect(l.useLibraryStore.getState().sampleNotice).toBe(false);
    expect(db.has(LOCAL_DRAFT_KEY)).toBe(true);
  });
  it("does not overwrite corrupt storage", async () => {
    db.set("resumecraft:library:v1", { broken: true });
    const l = await import("./library");
    await l.initializeLibrary();
    expect(l.useLibraryStore.getState().status).toBe("error");
    expect(db.get(l.LIBRARY_KEY)).toEqual({ broken: true });
  });
  it("detects cross-tab conflicts instead of overwriting newer data", async () => {
    const l = await import("./library");
    await l.initializeLibrary();
    const stored = db.get(l.LIBRARY_KEY) as { revision: number };
    stored.revision++;
    l.useLibraryStore.setState({ status: "saving" });
    await expect(l.flushLibrary()).rejects.toThrow("其他窗口");
    expect(l.useLibraryStore.getState().status).toBe("error");
  });
});
