---
day: 03
date: 2026-08-17
phase: P1
hours: 2.0
status: done
commits: []
---

# Day 03 · 撤销重做：两个 bug 都是测试逼出来的

## 今日目标

- [x] Zustand + immer + zundo 三层中间件
- [x] 数据 store 与 UI store 分离
- [x] IndexedDB 自动保存 / 恢复
- [x] 单测

## 做了什么

- [`lib/store/resume-store.ts`](../../lib/store/resume-store.ts)：简历数据 + 全部编辑动作，zundo 包历史
- [`lib/store/editor-store.ts`](../../lib/store/editor-store.ts)：选中项、展开状态、缩放（**不进历史**）
- [`lib/store/persistence.ts`](../../lib/store/persistence.ts)：`useDraftPersistence()`，挂载恢复 + 防抖落盘
- 16 个 store 单测

## 决策

**D1. UI 状态必须单独 store。**
如果和简历数据混在一起，"展开一个折叠面板"也会占掉一格 undo，用户按 Ctrl+Z 会以为撤销失灵了。zundo 的 `partialize` 只保留 `{ resume }`，并写了断言锁住：

```ts
const past = temporal().pastStates[0];
expect(Object.keys(past)).toEqual(["resume"]);
```

**D2. 历史用「前沿节流」而不是防抖。**
连打 10 个字应该只产生一条历史，且这条历史要锚定在**打字开始之前**的状态。防抖会锚定在打字结束时（等于什么都没撤销），所以必须是前沿（leading）节流：窗口内第一次变更被记录，后续丢弃。窗口 500ms。

**D3. 本地草稿损坏时不静默丢弃。**
`parseResumeSafe` 失败时，把原始数据另存一份 `resumecraft:draft:corrupt:<时间戳>` 再回落到空白简历。用户来问"我的简历没了"时还能捞回来。

## 踩坑

**坑 1：对 immer 的 draft 调 `structuredClone` 直接抛异常。**
`duplicateItem`（复制一条经历）我是这么写的：

```ts
const copy = structuredClone(items[index]); // ← 炸
```

`items[index]` 是 immer 的 **Proxy**，`structuredClone` 不认识 Proxy，抛 `DataCloneError`。

修法是先用 `current()` 取出普通对象快照再拷：

```ts
import { current } from "immer";
const copy = structuredClone(current(items[index]));
copy.id = newId();
```

这里 `structuredClone` 不能省——`current()` 对未修改的分支是**共享引用**的，直接塞回数组会让复制出来的条目和原条目共享 `highlights` 数组，改一个另一个跟着变。测试里专门断言了 `items[1].id !== items[0].id` 且内容独立。

**坑 2（更隐蔽）：节流窗口把"恢复草稿之后的第一次编辑"吞掉了。**
测试写完跑，第一个 undo 用例就红了：`expected 0 to be greater than 0`——`pastStates` 是空的。

排查过程：

1. 先怀疑 `partialize` 写错了 → 打印 `pastStates`，确实是空数组，不是内容不对
2. 再怀疑 zundo 没接上 → 单独跑一个用例是绿的，**放在一组里跑就红**
3. 定位到 `beforeEach`：它先 `setState({ resume: createEmptyResume() })` 重置，这一步**本身就是一次 store 变更**，占掉了节流窗口。紧接着的 `updateBasics` 落在 500ms 内，被丢弃 → 没有历史

根因不是测试写得不对，**是产品逻辑真的有洞**：应用启动时从 IndexedDB 恢复草稿，同样是一次程序化的 store 写入，也会占掉节流窗口——**用户打开页面后的第一次编辑将无法撤销**。而且"恢复草稿"本身还会变成一条可撤销的历史，用户按一次 Ctrl+Z 简历就空了。

修法是给 `replaceResume` 加一个显式选项：

```ts
replaceResume(resume, { recordHistory: false });
// 内部：temporal.pause() → set() → temporal.resume() → clear() → historyThrottle.reset()
```

节流器因此要能被 `reset()`，所以从裸函数改成了带 `reset()` 的小对象。

防复发：两个回归测试锁死这个行为——

```ts
it("恢复草稿（recordHistory:false）不产生历史，且不吞掉之后的第一次编辑", …)
it("连续编辑被节流成一条历史，撤销一次回到这串操作之前", …)
```

**这个坑值得单独讲**：它是被测试的 `beforeEach` 意外暴露的，但暴露的是一个真实的、用户一定会遇到的缺陷。如果只手动点点看，几乎不可能发现"打开页面后第一次编辑不能撤销"。

## 数据

| 项           | 值          |
| ------------ | ----------- |
| store 单测   | 16 个       |
| 累计单测     | 57 个，全绿 |
| 历史深度上限 | 100         |
| 历史节流窗口 | 500ms       |
| 自动保存防抖 | 800ms       |

另外验证了一条对性能很关键的性质（ADR-005 的前提）：immer 的结构共享确实生效——只改 `basics.name` 时，`sections` 和 `metadata` 的引用保持不变，所以预览里的精确订阅和 `React.memo` 才有意义。这条也写成了断言。

## 未解决 / 欠的债

1. 节流窗口 500ms 是拍的，没做过用户测试。太长会把两次独立操作合并，太短撤销会太碎。
2. IndexedDB 的容量上限没处理，简历里塞 base64 照片可能会超。
3. `moveItem` 的越界处理是"静默不动"，也许应该在开发模式下 warn。

## 明日

- [ ] 编辑器表单，防抖输入
- [ ] A4 实时预览
