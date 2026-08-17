/**
 * layout 的纯函数操作层。
 *
 * layout 是三维数组：layout[页][栏][位置] = sectionId
 * 约定 layout[p][0] 是主栏，layout[p][1] 是侧栏（单栏模板侧栏留空）。
 *
 * 这一层不依赖 React / zustand / zod —— 拖拽、分页、分栏最终都塌缩成对这个数组的操作，
 * 所以把不变量集中在这里维护，然后用随机测试压。
 */

export type Layout = string[][][];

/** 一个区块在 layout 中的坐标 */
export type LayoutAddr = { page: number; column: number; index: number };

export const MAIN_COLUMN = 0;
export const SIDE_COLUMN = 1;

const clone = (layout: Layout): Layout => layout.map((page) => page.map((col) => [...col]));

/** 创建一个空页（默认主栏 + 侧栏） */
export function emptyPage(columns = 2): string[][] {
  return Array.from({ length: columns }, () => [] as string[]);
}

export function createLayout(main: string[] = [], side: string[] = []): Layout {
  return [[[...main], [...side]]];
}

/** 展平出 layout 里出现过的全部 sectionId（按阅读顺序） */
export function flattenLayout(layout: Layout): string[] {
  return layout.flatMap((page) => page.flatMap((col) => col));
}

export function findSection(layout: Layout, id: string): LayoutAddr | null {
  for (let page = 0; page < layout.length; page++) {
    for (let column = 0; column < layout[page].length; column++) {
      const index = layout[page][column].indexOf(id);
      if (index !== -1) return { page, column, index };
    }
  }
  return null;
}

/**
 * 把 DOM 测到的首个溢出区块还原成 splitPage 所需的各栏拆分下标。
 * 单栏模板会按 column0 → column1 的顺序合并显示；如果主栏中途溢出，
 * 后续逻辑栏也必须整栏移到下一页，否则视觉阅读顺序会被打乱。
 */
export function createSplitPlan(
  layout: Layout,
  pageIndex: number,
  firstOverflowId: string,
  mergedColumns: boolean,
): (number | undefined)[] {
  const location = findSection(layout, firstOverflowId);
  if (!location || location.page !== pageIndex) return [];

  const plan: (number | undefined)[] = [];
  plan[location.column] = location.index;

  if (mergedColumns) {
    const columnCount = layout[pageIndex]?.length ?? 0;
    for (let column = location.column + 1; column < columnCount; column++) {
      plan[column] = 0;
    }
  }

  return plan;
}

/**
 * 修复 layout，使其满足三条不变量：
 *  1. layout 中的每个 id 都存在于 availableIds
 *  2. 每个 id 在整个 layout 中只出现一次（重复的保留第一个）
 *  3. availableIds 中的孤儿 id 追加到第 1 页主栏末尾
 *
 * 任何来源不可信的 layout（用户导入的 JSON、旧版本数据、AI 生成）写入前都要过这个函数。
 */
export function normalizeLayout(layout: Layout, availableIds: readonly string[]): Layout {
  const allowed = new Set(availableIds);
  const seen = new Set<string>();

  let next: Layout = layout.map((page) =>
    (page.length > 0 ? page : emptyPage()).map((col) =>
      col.filter((id) => {
        if (!allowed.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      }),
    ),
  );

  if (next.length === 0) next = [emptyPage()];

  // 每页至少要有主栏和侧栏两个槽位，否则拖到侧栏时会越界
  next = next.map((page) => {
    const filled = [...page];
    while (filled.length < 2) filled.push([]);
    return filled;
  });

  const orphans = availableIds.filter((id) => !seen.has(id));
  if (orphans.length > 0) next[0][MAIN_COLUMN].push(...orphans);

  return next;
}

/** 校验不变量，返回问题列表（空数组 = 合法）。测试与开发期断言用。 */
export function validateLayout(layout: Layout, availableIds: readonly string[]): string[] {
  const problems: string[] = [];
  const allowed = new Set(availableIds);
  const counts = new Map<string, number>();

  for (const id of flattenLayout(layout)) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (!allowed.has(id)) problems.push(`layout 引用了不存在的 section: ${id}`);
  }
  for (const [id, count] of counts) {
    if (count > 1) problems.push(`section 在 layout 中出现了 ${count} 次: ${id}`);
  }
  for (const id of allowed) {
    if (!counts.has(id)) problems.push(`section 未出现在 layout 中（孤儿）: ${id}`);
  }
  if (layout.length === 0) problems.push("layout 至少要有一页");
  layout.forEach((page, i) => {
    if (page.length < 2) problems.push(`第 ${i + 1} 页缺少栏位（需要主栏 + 侧栏）`);
  });

  return problems;
}

/** 把 id 从 layout 中摘掉（不校验存在性） */
export function removeSection(layout: Layout, id: string): Layout {
  return layout.map((page) => page.map((col) => col.filter((x) => x !== id)));
}

/**
 * 把 id 插入到目标位置。若 id 已存在于 layout，先摘除再插入（即"移动"）。
 * index 越界会被夹到合法区间，方便拖到列表末尾时直接传 Infinity。
 */
export function insertSection(layout: Layout, id: string, addr: LayoutAddr): Layout {
  const next = removeSection(layout, id);
  const page = clamp(addr.page, 0, next.length - 1);
  const column = clamp(addr.column, 0, next[page].length - 1);
  const index = clamp(addr.index, 0, next[page][column].length);
  next[page][column].splice(index, 0, id);
  return next;
}

/** 移动一个区块到新坐标。id 不存在时原样返回。 */
export function moveSection(layout: Layout, id: string, to: LayoutAddr): Layout {
  if (!findSection(layout, id)) return layout;
  return insertSection(layout, id, to);
}

/** 在指定位置后面插入一个空页 */
export function addPage(layout: Layout, afterPage = layout.length - 1): Layout {
  const next = clone(layout);
  const columns = next[0]?.length ?? 2;
  next.splice(clamp(afterPage, -1, next.length - 1) + 1, 0, emptyPage(columns));
  return next;
}

/**
 * 把指定页各栏从 splitAt 起的区块整体移到紧随其后的新页。
 *
 * `splitAt[column]` 是首个放不进当前页的区块下标。分栏必须一起拆：
 * 这样主栏和侧栏会继续在同一张新纸上从上往下阅读，而不是产生两张错位页面。
 * 没有给出下标的栏留在原页；下标等于栏长度时也是空操作。
 */
export function splitPage(
  layout: Layout,
  pageIndex: number,
  splitAt: readonly (number | undefined)[],
): Layout {
  if (pageIndex < 0 || pageIndex >= layout.length) return layout;

  const next = clone(layout);
  const page = next[pageIndex];
  const spill = page.map((column, columnIndex) => {
    const index = splitAt[columnIndex];
    if (index === undefined) return [];
    return column.splice(clamp(index, 0, column.length), column.length);
  });

  if (spill.every((column) => column.length === 0)) return layout;
  next.splice(pageIndex + 1, 0, spill);
  return next;
}

/** 删除末尾连续空页；至少保留一页。用于内容删减后的重新分页。 */
export function trimEmptyTrailingPages(layout: Layout): Layout {
  if (layout.length <= 1) return layout;
  const next = clone(layout);
  while (next.length > 1 && next.at(-1)?.every((column) => column.length === 0)) {
    next.pop();
  }
  return next;
}

/** 删除一页，其内容按栏合并进前一页（第一页不可删，只会被清空并保留） */
export function removePage(layout: Layout, pageIndex: number): Layout {
  if (layout.length <= 1) return layout;
  if (pageIndex < 0 || pageIndex >= layout.length) return layout;

  const next = clone(layout);
  const [removed] = next.splice(pageIndex, 1);
  const targetPage = next[Math.max(0, pageIndex - 1)];
  removed.forEach((col, colIndex) => {
    const target = targetPage[colIndex] ?? targetPage[MAIN_COLUMN];
    target.push(...col);
  });
  return next;
}

/** 交换主栏与侧栏（"把侧栏放右边/左边"其实是模板样式，这里是真的换内容） */
export function swapColumns(layout: Layout, pageIndex: number): Layout {
  const next = clone(layout);
  const page = next[pageIndex];
  if (!page || page.length < 2) return layout;
  [page[MAIN_COLUMN], page[SIDE_COLUMN]] = [page[SIDE_COLUMN], page[MAIN_COLUMN]];
  return next;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
