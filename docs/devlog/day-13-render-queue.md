# Day 13 — Chromium 实例池化与有界并发

日期：2026-08-17  
阶段：P3（已完成）

## 今天交付

- 在 Worker 中保留一个常驻 Chromium Browser，但每次导出仍创建并销毁隔离 Context。
- 新增 FIFO `RenderGate`：默认最多 **2** 个并发渲染、**4** 个等待请求，队列已满立即返回 `429` 和 `Retry-After`。
- 为单次 PDF 生成设置 25 秒硬超时；`/health` 与 `/metrics` 暴露浏览器连接、活动数、队列深度和容量上限。
- 新增 3 个纯队列单测，并将 Worker 源码纳入根 Vitest 白名单。

## 决策

选择「一个 Browser + 有界 Context 队列」，而不是提前启动多个 Browser 实例。前者复用 Chromium 的启动成本，同时把最容易失控的 Context 数量限制在 2；代价是突发流量会被显式拒绝，需要前端按 `429` 提示用户稍后重试。

## 踩坑

最初将 `services/**` 加进 Vitest 排除列表，pnpm workspace 的软链接仍可能让 Vitest 扫到 Zod 的内部测试。最终改为只白名单业务目录和 `services/pdf-worker/src`，既能执行 Worker 的纯逻辑测试，也不会把依赖包当作项目测试。

## 数据

- 3 个并发真实渲染：指标瞬时为 `active=2`、`queued=1`，3 个请求均返回 `200` PDF。
- 7 个并发真实渲染：6 个被容量接纳，额外 1 个立即返回 `429`。
- 全量校验：9 个测试文件、77 项测试通过；TypeScript、ESLint 通过。

## 下一步

- 把 Chromium PDF 接入 pdf.js 文本提取，调用 Day 14 的覆盖率与阅读顺序评分算法。
