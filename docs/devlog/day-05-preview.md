---
day: 05
date: 2026-08-17
phase: P1
hours: 2.5
status: done
commits: []
---

# Day 05 · A4 实时预览：一个溢出检测改了三次才对

## 今日目标

- [x] A4 画布，缩放与自适应
- [x] 三套模板 + 主题变量
- [x] 内容溢出检测与提示
- [x] 性能埋点

## 做了什么

- [`components/preview/resume-document.tsx`](../../components/preview/resume-document.tsx)：**全项目唯一的渲染实现**（ADR-001），纯组件、不碰 store
- [`components/preview/blocks.tsx`](../../components/preview/blocks.tsx)：`BasicsBlock` / `SectionBlock`，全部 `memo`
- [`components/preview/preview-canvas.tsx`](../../components/preview/preview-canvas.tsx)：缩放、溢出检测
- [`components/templates/registry.ts`](../../components/templates/registry.ts) + globals.css 里三套模板样式
- [`lib/perf/render-latency.ts`](../../lib/perf/render-latency.ts)：延迟采样，开发模式下在工具栏显示 P50/P95

## 决策

**D1. 模板差异全部用 CSS 表达，注册表里只有数据。**

```ts
{ id: "modern", className: "tpl-modern", defaultColumnRatio: 0.66, defaultLayout: … }
```

新增一套模板 = globals.css 里一段 `.tpl-xxx` + 注册表一条记录，不改任何渲染/拖拽/导出逻辑。今天用 Modern / Classic / Minimal 三套验证了这个机制成立。
代价：模板之间只能有样式差异，不能有结构差异（比如"技能用星级而不是文字"）。真需要的时候再往 `TemplateDefinition` 上加可选的组件覆盖，现在不提前抽象。

**D2. `ResumeDocument` 是纯组件，不订阅 store。**
ADR-001 要求同一份组件树能在 PDF Worker 的无头浏览器里渲染，那里没有 store。
这和 ADR-005 的"精确订阅"看似冲突（整份 resume 当 props 传下去，改一个字全树重渲染），实际靠 immer 的结构共享化解：只改一个区块时，其他区块的 props 引用不变，`memo` 直接跳过。**纯度和性能在这里不矛盾。**

**D3. 换模板时单栏模板把侧栏内容并回主栏渲染。**
否则用户从 Modern（双栏）切到 Classic（单栏），侧栏里的技能和教育经历会**直接消失**——数据还在，但看不见，这是最吓人的一类 bug。验证过：切到 Classic 后 7 个区块一个不少。

## 踩坑

**这一天的主线是同一个功能改了三次。**

### 第一版：`scrollHeight - clientHeight`，用 rAF 触发

```ts
useEffect(() => {
  const raf = requestAnimationFrame(measureOverflow);
  return () => cancelAnimationFrame(raf);
}, [resume]);
```

现象：DOM 里实测溢出 147px，界面上却一直显示"内容适配良好"。

**排查 1**：怀疑 state 比较写错了 → 读代码，比较逻辑没问题。
**排查 2**：怀疑组件没重渲染 → 但预览确实跟着换了模板，说明重渲染了。
**排查 3**：怀疑测量早了一帧 → 再点一次换模板，还是不更新。不是时序问题。
**根因**：`requestAnimationFrame` 在页面不参与合成（标签页不可见）时**根本不会触发**。我是在一个未显示的浏览器面板里验证的，所以回调一次都没跑。

这不只是环境问题——**标签页切到后台时，溢出提示会一直停留在过期状态**。修法是干脆不要 rAF：effect 跑的时候 DOM 已经提交，直接读 `scrollHeight` 会强制一次布局计算，拿到的就是最新值。顺带加了 `document.fonts.ready` 之后的重测（字体异步加载完成后行高会变）。

### 第二版：直接测，但量出来恒等

改完之后 `scrollHeight - clientHeight` 稳定返回 0，即使内容明显放不下。

原因：`.resume-column` 是 flex 容器，子元素默认 `flex-shrink: 1`。内容超出固定高度时，**区块被悄悄压扁**而不是溢出——行距被挤掉、`scrollHeight` 永远等于 `clientHeight`。

这个默认值同时毁掉了两件事：排版被静默破坏，检测也失效。加一行：

```css
.resume-section {
  flex: 0 0 auto;
}
```

### 第三版：探针位置也不对

加了 `flex: 0 0 auto` 之后，量出来还是 0。打印各层几何才看明白：

```
pageContentBottom: 1183     ← 页面内容区底边（基准线）
colsBottom:        1183     ← .resume-columns（grid 容器）
colBottom:         1528     ← .resume-column 自己被撑到了 1347px 高
lastBottom:        1528
```

**栏自己会被内容撑大并溢出容器**，所以"最后一个子元素 vs 栏底边"永远是 0——它俩一起跑到纸外面去了。基准线必须取容器（页面内容区）的底边：

```ts
const limit = container.getBoundingClientRect().bottom;
worst = Math.max(worst, (column.getBoundingClientRect().bottom - limit) / scale);
```

除以 `scale` 是因为 `getBoundingClientRect` 拿到的是缩放后的像素，要除回去才是版面上的真实值。

**验证**：把正文字号从 10.5pt 调到 14pt，界面提示"第 1 页内容超出 345px"，与 DOM 实测的 345 完全一致；调回 10.5pt 后提示恢复"内容适配良好"。

**教训**：几何测量类的 bug，靠读代码基本查不出来，**必须把每一层的 rect 打印出来对**。我前两版都是"猜一个原因、改一下、再猜"，第三版是先把 pageBottom / colsBottom / colBottom / lastBottom 四个数一起打出来，一眼就看出 colBottom 比 colsBottom 大了 345。

## 数据

| 项               | 值                                                      |
| ---------------- | ------------------------------------------------------- |
| A4 页面实测尺寸  | **794 × 1123 px**（= 210×297mm @96dpi，与规格完全一致） |
| 溢出检测精度     | 提示值 345px = DOM 实测 345px                           |
| 模板切换         | 3 套，切换后区块数 7 → 7（无内容丢失）                  |
| 生产构建         | 5.9s，5 个静态页全部预渲染                              |
| 累计单测         | 57 个，全绿                                             |
| typecheck / lint | 无错误                                                  |

## 未解决 / 欠的债

1. **性能基线没测到。** `useRenderLatency` 的埋点写好了、开发工具栏也接上了，但它依赖 `requestAnimationFrame`（这次踩的第一个坑），在我验证用的隐藏面板里拿不到样本。**必须在真实显示器上跑一次，把 P50/P95 填进 [05-resume-pitch.md](../05-resume-pitch.md) 的空格。** 排到 Day 06 开工前做。
2. 还没有真实分页——内容超出只提示不断页，这是 P2 Day 9 的活，也是整个 P2 的最高风险项。
3. 中文字体仍靠系统回退，`Noto Sans SC` 没有真正加载。P3 做 PDF 导出时必须解决，否则 Docker 里会全是豆腐块。
4. 打印导出目前直接调 `window.print()`，是 P3 Day 11 的兜底方案提前用上了，还没测过实际效果。

## P1 阶段验收

| DoD                      | 状态                                          |
| ------------------------ | --------------------------------------------- |
| 刷新页面数据不丢         | ✅ IndexedDB 恢复已验证（模板选择跨刷新保留） |
| 输入立刻反映在右侧       | ✅                                            |
| `pnpm test` 全绿         | ✅ 57/57                                      |
| typecheck / lint / build | ✅ 全部通过                                   |
| 性能基线数字             | ⚠️ 埋点就位，数字待补                         |

## 明日

- [ ] 补测性能基线
- [ ] P2 Day 06：layout 操作层接入 UI，准备 dnd-kit
