# Day 06 — 结构化拖拽与真实分页

日期：2026-08-17  
阶段：P2（进行中）

## 今天交付

- 引入稳定版 `@dnd-kit/core@6.3.1` 与 `@dnd-kit/sortable@10.0.0`。
- `ResumeDocument` 仍是唯一内容渲染器；编辑态通过 `renderColumn` / `renderBlock` 注入拖拽壳，不复制简历 DOM。
- 实现鼠标与键盘拖拽：拖拽柄支持 Space 拾取、方向键移动、Space 放下，且包含中文 ARIA live announcement。
- 增加统一落点状态与插入指示线；键盘传感器和鼠标传感器共享同一视觉反馈。
- 实现 `splitPage(layout, pageIndex, splitAt)`：按栏将首个溢出区块及尾部整体迁移到下一页。
- 预览层以区块几何边界测量分页；无法放下的单一区块保留并做明确告警。
- 增加手动添加空白页、移除末页并合并内容；两者进入正常撤销历史。

## 决策

### 1. 自动分页只记录“结构结果”，不进入 undo 历史

自动分页是内容、字体和页边距共同推导出的展示结果，不是一次用户有意的编辑。若每次输入都把一次分页塞进 zundo，用户按一次撤销会经历“改字 → 合页 → 改字”的噪声链。`setLayout(layout, { recordHistory: false })` 在临时暂停 temporal store 后写入布局，用户的内容编辑仍保持在撤销栈中。

### 2. 分页按“区块”断，而非像 Word 那样任意断行

简历的工作经历、项目经历是语义原子；把它们从 bullet 中间切开会损坏可读性，也影响 ATS 的阅读顺序。CSS 的 `break-inside: avoid` 与 `splitPage` 共同保证“一个区块要么完整在本页，要么整体移到下一页”。单区块本身比纸面高时不伪造成功，直接指出问题。

## 踩坑

### dnd-kit 的默认无障碍 ID 会造成 hydration mismatch

首次浏览器检查发现 `aria-describedby` 在 SSR 为 `DndDescribedBy-1`、客户端为 `DndDescribedBy-0`。原因是 `DndContext` 未传 `id`，库根据渲染顺序生成标识，而开发态 hydration 顺序不稳定。修复为 `id="resume-layout-editor"`；重新打开全新页面后 console error = 0。

## 验证记录

- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：62/62 通过（新增 5 个分页与单栏映射不变量测试）。
- `pnpm build`：通过。
- 浏览器：字号从 10.5pt 调至 14pt，示例从 1 页自动拆为 2 页；页面尺寸为 794×1123px；无溢出提示。
- 浏览器：键盘拖动后真实 layout 顺序改变，live region 输出“区块已移动”。
- 浏览器：页面数 3 → 4 → 3，新增/移除页均生效；键盘移动时插入指示线出现；console error = 0。
- 浏览器：Classic 单栏模板在 14pt 下自动拆为 2 页，7 个区块各出现一次，无溢出且 console error = 0。

## 明日

- 给拖拽落点补更清晰的插入指示线和跨栏视觉反馈。
- 完成模板布局重置、手动添加/删除页面与分页回收策略。
