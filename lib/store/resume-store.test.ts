import { beforeEach, describe, expect, it } from "vitest";
import { validateLayout } from "@/lib/layout/operations";
import { ResumeDataSchema, availableSectionIds, createEmptyResume } from "@/lib/schema";
import { sampleResume } from "@/fixtures/sample-resume";
import { useResumeStore } from "./resume-store";

const store = () => useResumeStore.getState();
const data = () => useResumeStore.getState().resume;

beforeEach(() => {
  // 走 replaceResume 的"不记历史"分支重置，而不是裸 setState：
  // 裸 setState 会占掉历史节流的窗口，导致紧接着的第一次编辑无法撤销。
  useResumeStore.getState().replaceResume(createEmptyResume(), { recordHistory: false });
});

describe("基础编辑", () => {
  it("updateBasics 写入字段", () => {
    store().updateBasics("name", "陈亦然");
    expect(data().basics.name).toBe("陈亦然");
  });

  it("immer 保证不可变：改动后引用变化，未改动的分支引用不变", () => {
    const before = data();
    store().updateBasics("name", "A");
    const after = data();
    expect(after).not.toBe(before);
    expect(after.basics).not.toBe(before.basics);
    // 没碰的分支必须复用引用，否则预览的精确订阅会全量失效（ADR-005）
    expect(after.sections).toBe(before.sections);
    expect(after.metadata).toBe(before.metadata);
  });
});

describe("区块与条目", () => {
  it("addSection 同时写 sections 和 layout", () => {
    const id = store().addSection("certificate");
    expect(data().sections[id]).toBeDefined();
    expect(validateLayout(data().layout, availableSectionIds(data()))).toEqual([]);
  });

  it("removeSection 同时清掉 layout 引用（否则预览会渲染幽灵区块）", () => {
    const id = store().addSection("certificate");
    store().removeSection(id);
    expect(data().sections[id]).toBeUndefined();
    expect(validateLayout(data().layout, availableSectionIds(data()))).toEqual([]);
  });

  it("addItem / updateItem / removeItem", () => {
    const itemId = store().addItem("experience");
    expect(itemId).not.toBeNull();

    store().updateItem("experience", itemId!, (draft) => {
      (draft as { company: string }).company = "某公司";
    });
    const section = data().sections.experience;
    expect(section.type === "experience" && section.items[0].company).toBe("某公司");

    store().removeItem("experience", itemId!);
    const after = data().sections.experience;
    expect(after.type === "experience" && after.items).toHaveLength(0);
  });

  it("summary 区块没有 items，addItem 返回 null 而不是崩溃", () => {
    expect(store().addItem("summary")).toBeNull();
  });

  it("moveItem 重排且越界安全", () => {
    const a = store().addItem("experience")!;
    const b = store().addItem("experience")!;
    store().moveItem("experience", 1, 0);
    const section = data().sections.experience;
    const order = section.type === "experience" ? section.items.map((i) => i.id) : [];
    expect(order).toEqual([b, a]);

    store().moveItem("experience", 99, 0); // 越界，应为空操作
    expect(order).toEqual([b, a]);
  });

  it("duplicateItem 生成新 id，不共享引用", () => {
    const id = store().addItem("project")!;
    store().updateItem("project", id, (d) => {
      (d as { name: string }).name = "原项目";
    });
    store().duplicateItem("project", id);

    const section = data().sections.project;
    if (section.type !== "project") throw new Error("类型不符");
    expect(section.items).toHaveLength(2);
    expect(section.items[1].id).not.toBe(section.items[0].id);
    expect(section.items[1].name).toBe("原项目");
  });
});

describe("layout 一致性", () => {
  it("setLayout 会 normalize 脏数据", () => {
    store().setLayout([[["summary", "summary", "ghost"], []]]);
    expect(validateLayout(data().layout, availableSectionIds(data()))).toEqual([]);
  });

  it("moveSectionTo 跨栏移动后不变量仍成立", () => {
    store().moveSectionTo("skill", { page: 0, column: 0, index: 0 });
    expect(data().layout[0][0][0]).toBe("skill");
    expect(validateLayout(data().layout, availableSectionIds(data()))).toEqual([]);
  });
});

describe("replaceResume", () => {
  it("导入示例简历后数据合法", () => {
    store().replaceResume(sampleResume);
    expect(() => ResumeDataSchema.parse(data())).not.toThrow();
    expect(data().basics.name).toBe("陈亦然");
  });
});

describe("撤销 / 重做", () => {
  const temporal = () => useResumeStore.temporal.getState();

  it("undo 回到上一步，redo 再前进", () => {
    store().updateBasics("name", "A");
    // handleSet 是 500ms 前沿节流，同一串操作只记一条历史；这里手动等一格
    expect(temporal().pastStates.length).toBeGreaterThan(0);

    temporal().undo();
    expect(data().basics.name).toBe("");

    temporal().redo();
    expect(data().basics.name).toBe("A");
  });

  it("历史里只有简历数据，不含 action 函数", () => {
    store().updateBasics("name", "A");
    const past = temporal().pastStates[0] as Record<string, unknown>;
    expect(Object.keys(past)).toEqual(["resume"]);
  });

  it("clear 后不能再撤销", () => {
    store().updateBasics("name", "A");
    temporal().clear();
    expect(temporal().pastStates).toHaveLength(0);
  });

  it("恢复草稿（recordHistory:false）不产生历史，且不吞掉之后的第一次编辑", () => {
    store().replaceResume(sampleResume, { recordHistory: false });
    expect(temporal().pastStates).toHaveLength(0);

    // 关键回归点：紧接着的编辑必须可撤销
    store().updateBasics("name", "改过的名字");
    expect(temporal().pastStates).toHaveLength(1);
    temporal().undo();
    expect(data().basics.name).toBe("陈亦然");
  });

  it("连续编辑被节流成一条历史，撤销一次回到这串操作之前", () => {
    store().updateBasics("name", "一");
    store().updateBasics("name", "一二");
    store().updateBasics("name", "一二三");
    expect(temporal().pastStates).toHaveLength(1);

    temporal().undo();
    expect(data().basics.name).toBe("");
  });
});
