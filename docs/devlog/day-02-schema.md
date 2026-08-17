---
day: 02
date: 2026-08-17
phase: P1
hours: 2.0
status: done
commits: []
---

# Day 02 · Schema 层：一份定义要喂五个消费者

## 今日目标

- [x] Zod schema 全量落地
- [x] layout 三维数组的纯函数操作层
- [x] 示例简历 fixture
- [x] 单测

## 做了什么

- [`lib/schema/`](../../lib/schema)：primitives → items → section → resume → defaults，五个文件
- [`lib/layout/operations.ts`](../../lib/layout/operations.ts)：`normalizeLayout` / `moveSection` / `addPage` / `removePage` / `swapColumns` / `validateLayout`
- [`fixtures/sample-resume.ts`](../../fixtures/sample-resume.ts)：一份"故意有缺陷"的示例简历
- 41 个单测（schema 22 + layout 19），全绿

## 决策

**D1. 不用 zod 内置的 `.email()` / `.url()`，自己写正则。**
两个理由。一是 zod 4 把字符串格式校验提到了顶层（`z.email()`），3 和 4 的写法不一样，自己写正则就不用赌用户装的是哪个大版本。二是**简历字段必须允许空字符串**——用户清空输入框时值是 `""`，内置校验会直接报"邮箱格式不正确"，体验很差。所以统一封了一个：

```ts
const optionalWith = (re: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || re.test(v), { message })
    .default("");
```

顺带白拿了 `.trim()`——粘贴内容带首尾空格是最常见的脏数据。

**D2. `highlights: string[]` 而不是一整块富文本。**
这是今天最重要的一个决定，写在 `items.ts` 的注释里：AI 改写的粒度、ATS 扣分的粒度、diff 审阅的粒度，全都是「一条 highlight」。如果这里做成富文本字符串，P4 的逐条 diff 和 P5 的问题定位就直接做不了了。
代价：用户不能在一条要点里做加粗/斜体。P2 再评估要不要给单条 highlight 接 Tiptap。

**D3. `basics` 不进 `sections` 联合类型，但允许出现在 `layout` 里。**
`basics` 的字段结构（照片、自定义联系方式）和其他区块完全不同，硬塞进 discriminated union 会污染整个类型。但很多双栏模板确实把联系方式放侧栏，所以把它做成**保留 id**：`RESERVED_SECTION_IDS = ['basics']`，`layout` 可以引用，渲染时走单独分支。

**D4. `parseResume` 除了 schema 校验，还强制 normalize layout。**
脏 layout（重复 id、幽灵 id、孤儿区块）会让预览直接白屏，而这类数据的最大来源是"上个版本的自己"。所以任何入口——本地草稿、导入文件、接口返回——都必须过这一道。

## 踩坑

**坑：`layout` 的不变量比想象中难维护。**
三条约束看着简单：id 必须存在、不能重复、不能有孤儿。但操作组合起来就容易破——比如"删除区块"要同时改 `sections` 和 `layout`，漏一个就产生幽灵引用；"跨栏移动"如果先插入后删除，中途会短暂重复。

例子测试根本覆盖不住这些组合。所以写了一个**属性测试**：固定种子的 LCG，随机跑 2000 次操作（move / addPage / removePage / swap / 注入幽灵 id / 删除真实区块），每一步之后都断言 `validateLayout()` 返回空数组：

```ts
const problems = validateLayout(layout, ids);
expect(problems, `第 ${i} 步（${op}）后不变量被破坏：${problems.join("; ")}`).toEqual([]);
```

最后再断言 6 个 section 一个不多一个不少。

用固定种子而不是 `Math.random()` 是关键——**随机测试挂了必须能复现**，否则只是个偶尔红一次的噪音源。

## 数据

| 项           | 值                     |
| ------------ | ---------------------- |
| schema 文件  | 5 个，约 380 行        |
| 单测         | 41 个，全绿            |
| 属性测试规模 | 2000 次随机操作 / 用例 |
| 测试耗时     | 3.1s（含 vitest 启动） |

## 未解决 / 欠的债

1. `createItem()` 里那个 switch 返回的是宽松的 `AnyItem`，类型上没有和 `SectionType` 精确绑定。能用但不优雅，等 P4 接 AI 结构化输出时会重新审视这里。
2. JSON Resume 互转（`toJsonResume` / `fromJsonResume`）还没写，排在 P3 Day 15。
3. 示例简历里那条"负责订单系统的日常维护和需求开发"是**故意留的弱开头**，P5 的 ATS 引擎必须能扣它的分——已经写成断言锁住了。

## 明日

- [ ] Zustand + immer + zundo，撤销重做
- [ ] IndexedDB 自动保存
