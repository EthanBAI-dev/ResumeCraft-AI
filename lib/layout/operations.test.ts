import { describe, expect, it } from "vitest";
import {
  MAIN_COLUMN,
  SIDE_COLUMN,
  addPage,
  createLayout,
  findSection,
  flattenLayout,
  insertSection,
  moveSection,
  normalizeLayout,
  removePage,
  removeSection,
  swapColumns,
  validateLayout,
  type Layout,
} from "./operations";

const ids = ["basics", "summary", "experience", "project", "education", "skill"];
const base = (): Layout =>
  createLayout(["summary", "experience", "project"], ["basics", "skill", "education"]);

describe("findSection", () => {
  it("定位到正确的页/栏/序号", () => {
    expect(findSection(base(), "experience")).toEqual({ page: 0, column: 0, index: 1 });
    expect(findSection(base(), "skill")).toEqual({ page: 0, column: 1, index: 1 });
  });

  it("找不到时返回 null", () => {
    expect(findSection(base(), "nope")).toBeNull();
  });
});

describe("normalizeLayout", () => {
  it("剔除不存在的 section", () => {
    const dirty: Layout = [[["summary", "ghost"], ["basics"]]];
    const out = normalizeLayout(dirty, ["summary", "basics"]);
    expect(flattenLayout(out)).toEqual(["summary", "basics"]);
  });

  it("重复 id 只保留第一次出现", () => {
    const dirty: Layout = [
      [["summary", "experience"], ["summary"]],
      [["experience"], []],
    ];
    const out = normalizeLayout(dirty, ["summary", "experience"]);
    expect(flattenLayout(out)).toEqual(["summary", "experience"]);
  });

  it("孤儿 section 追加到第一页主栏末尾", () => {
    const out = normalizeLayout([[["summary"], []]], ["summary", "skill", "project"]);
    expect(out[0][MAIN_COLUMN]).toEqual(["summary", "skill", "project"]);
  });

  it("空 layout 会补出一页两栏", () => {
    const out = normalizeLayout([], []);
    expect(out).toHaveLength(1);
    expect(out[0]).toHaveLength(2);
  });

  it("缺侧栏的页会被补齐", () => {
    const out = normalizeLayout([[["summary"]]], ["summary"]);
    expect(out[0]).toHaveLength(2);
    expect(out[0][SIDE_COLUMN]).toEqual([]);
  });

  it("幂等：normalize 两次结果相同", () => {
    const once = normalizeLayout([[["summary", "summary", "x"], []]], ids);
    expect(normalizeLayout(once, ids)).toEqual(once);
  });
});

describe("insertSection / moveSection", () => {
  it("跨栏移动", () => {
    const out = moveSection(base(), "skill", { page: 0, column: MAIN_COLUMN, index: 0 });
    expect(out[0][MAIN_COLUMN]).toEqual(["skill", "summary", "experience", "project"]);
    expect(out[0][SIDE_COLUMN]).toEqual(["basics", "education"]);
  });

  it("栏内重排不产生重复", () => {
    const out = moveSection(base(), "project", { page: 0, column: MAIN_COLUMN, index: 0 });
    expect(out[0][MAIN_COLUMN]).toEqual(["project", "summary", "experience"]);
    expect(flattenLayout(out)).toHaveLength(6);
  });

  it("index 越界时夹到末尾（拖到列表最后传 Infinity）", () => {
    const out = insertSection(base(), "skill", {
      page: 0,
      column: MAIN_COLUMN,
      index: Number.POSITIVE_INFINITY,
    });
    expect(out[0][MAIN_COLUMN].at(-1)).toBe("skill");
  });

  it("移动不存在的 id 时原样返回", () => {
    const input = base();
    expect(moveSection(input, "nope", { page: 0, column: 0, index: 0 })).toBe(input);
  });

  it("不修改入参（纯函数）", () => {
    const input = base();
    const snapshot = JSON.stringify(input);
    moveSection(input, "skill", { page: 0, column: MAIN_COLUMN, index: 0 });
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("分页", () => {
  it("addPage 追加空页并保持栏数", () => {
    const out = addPage(base());
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual([[], []]);
  });

  it("跨页移动", () => {
    const out = moveSection(addPage(base()), "project", { page: 1, column: MAIN_COLUMN, index: 0 });
    expect(out[1][MAIN_COLUMN]).toEqual(["project"]);
    expect(out[0][MAIN_COLUMN]).toEqual(["summary", "experience"]);
  });

  it("removePage 把内容按栏并回前一页", () => {
    let out = addPage(base());
    out = moveSection(out, "project", { page: 1, column: SIDE_COLUMN, index: 0 });
    out = removePage(out, 1);
    expect(out).toHaveLength(1);
    expect(out[0][SIDE_COLUMN]).toEqual(["basics", "skill", "education", "project"]);
  });

  it("只剩一页时 removePage 是空操作", () => {
    const input = base();
    expect(removePage(input, 0)).toBe(input);
  });
});

describe("swapColumns", () => {
  it("主栏与侧栏互换", () => {
    const out = swapColumns(base(), 0);
    expect(out[0][MAIN_COLUMN]).toEqual(["basics", "skill", "education"]);
    expect(out[0][SIDE_COLUMN]).toEqual(["summary", "experience", "project"]);
  });
});

describe("removeSection", () => {
  it("从所有页所有栏中摘除", () => {
    const out = removeSection(base(), "experience");
    expect(flattenLayout(out)).not.toContain("experience");
    expect(flattenLayout(out)).toHaveLength(5);
  });
});

/**
 * 属性测试：随机 2000 次操作后，不变量必须恒成立。
 *
 * 拖拽是这个项目里最容易写出"section 凭空消失/重复"这类静默 bug 的地方，
 * 而这种 bug 用例子测试很难覆盖到——所以用随机操作压。
 */
describe("属性测试：随机操作后不变量恒成立", () => {
  it("2000 次随机操作", () => {
    // 固定种子的 LCG，保证失败可复现
    let seed = 20260817;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

    let layout = normalizeLayout([], ids);
    const ops: string[] = [];

    for (let i = 0; i < 2000; i++) {
      const op = pick(["move", "addPage", "removePage", "swap", "insertGhost", "dropReal"]);
      ops.push(op);

      switch (op) {
        case "move":
          layout = moveSection(layout, pick(ids), {
            page: Math.floor(rand() * (layout.length + 1)),
            column: Math.floor(rand() * 3),
            index: Math.floor(rand() * 8),
          });
          break;
        case "addPage":
          if (layout.length < 6) layout = addPage(layout, Math.floor(rand() * layout.length));
          break;
        case "removePage":
          layout = removePage(layout, Math.floor(rand() * layout.length));
          break;
        case "swap":
          layout = swapColumns(layout, Math.floor(rand() * layout.length));
          break;
        // 模拟脏数据来源（导入的 JSON / 旧版本），normalize 必须能兜住
        case "insertGhost":
          layout = normalizeLayout(
            insertSection(layout, "ghost-" + i, { page: 0, column: 0, index: 0 }),
            ids,
          );
          break;
        case "dropReal":
          layout = normalizeLayout(removeSection(layout, pick(ids)), ids);
          break;
      }

      const problems = validateLayout(layout, ids);
      expect(problems, `第 ${i} 步（${op}）后不变量被破坏：${problems.join("; ")}`).toEqual([]);
    }

    // 无论怎么折腾，6 个 section 一个不多一个不少
    expect(flattenLayout(layout).sort()).toEqual([...ids].sort());
  });
});
