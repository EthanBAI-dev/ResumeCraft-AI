---
day: 00
date: 2026-08-17
phase: P0
hours: 3.0
status: done
commits: []
---

# Day 00 · 立项：把「简历生成器」重新定义成一个有工程含量的项目

## 今日目标

- [x] 调研现有开源简历项目，确定借鉴范围与法律边界
- [x] 校准 2026-08 的技术栈现状（不能凭记忆选版本）
- [x] 确定架构主线并写成 ADR
- [x] 设计数据模型
- [x] 排出可执行的路线图
- [x] 建立开发日记体系

## 做了什么

- 拆解了三个参考项目，写进 [00-competitor-research.md](../00-competitor-research.md)
- 确定产品边界，特别是**明确不做的清单**，写进 [01-product-scope.md](../01-product-scope.md)
- 6 条 ADR 落地在 [02-architecture.md](../02-architecture.md)
- Zod Schema / layout 三维数组 / Prisma 表 / ATS 评分模型，写进 [03-data-model.md](../03-data-model.md)
- P0–P7 共 35 天的路线图 + 2 周压缩路径 + 风险登记，写进 [04-roadmap.md](../04-roadmap.md)
- `git init`，建立 `docs/devlog/` 与本模板

## 决策

**D1. 不做 Figma 式自由画布，做「约束式结构化编辑器」。**
备选是绝对定位画布。放弃的原因不是做不出来，而是**做出来会毁掉产品的核心价值**：绝对定位的元素导出成 PDF 后是一堆孤立文本框，ATS 抽取出来的阅读顺序是乱的——而这个产品的整个卖点就是"机器读得懂"。代价：用户排版自由度受限，用分栏比例、间距、字号、模板等参数来补偿。

**D2. 渲染只维护一份真相：HTML/CSS，PDF 用无头 Chromium 打印同一份 DOM。**
备选是 `@react-pdf/renderer`（Reactive Resume v5 的选择）。react-pdf 省一个后端服务，但它只支持 CSS 的一个子集（无 grid、无伪元素），模板表达力被锁死；而且如果同时要屏幕预览，就得维护两套样式，长期必然走样。代价：需要一个能跑 Chromium 的运行时，Vercel Serverless 塞不下（250MB 解压上限），所以 PDF 导出要拆成独立 Docker 服务。这个代价换来的是**模板可以用任意现代 CSS**，值。

**D3. 拖拽用 `@dnd-kit/core@6.3.1`，不用 `@dnd-kit/react@0.5.0`。**
新架构（`@dnd-kit/react` + `@dnd-kit/dom`）确实更好，但还是 pre-1.0，API 在变。作品集项目输不起一次上游 breaking change。缓解措施：所有拖拽逻辑收进 `components/editor/dnd/` 一层适配器，将来迁移只改这一层。

**D4. 版本管理用 JSON Patch 增量 + 周期性 snapshot，不用全量存储。**
全量存储实现只要 10 分钟，但简历 JSON 20–50KB，改 100 次就 5MB，而且回答不了"这两版差在哪"。增量方案要写还原逻辑和一致性测试，多花大半天，但它是这个项目里少数几个能讲出算法深度的地方之一。

**D5. 参考 Reactive Resume（MIT）可以抄思路甚至抄代码，OpenResume（AGPL-3.0）只能读不能抄。**
AGPL 的传染性 + §13 网络分发条款意味着：只要把它的代码复制进来并把服务部署上线，整个项目就必须开源全部源码。**实现阶段直接关掉 OpenResume 的仓库页面。**

**D6. 项目名保留 ResumeCraft，不改 CareerCanvas。**
"Canvas" 承诺了 D1 明确否决的东西。名字不该承诺产品做不到（也不该做）的事。

## 踩坑

**记忆里的版本号全是过期的。** 原始需求里的技术栈（Next.js + dnd-kit + react-pdf + Prisma）方向没错，但具体到版本，凭印象选会踩三个雷：

1. 以为 Reactive Resume 还是 NestJS + Next.js 的 monorepo —— 实际 v5 已经整体迁到 **TanStack Start (React 19 + Vite) + Drizzle + ORPC + Better Auth**，PDF 也从服务端 Puppeteer 改成了客户端 `@react-pdf/renderer`。如果照着旧印象去"参考"，参考的是一个已经不存在的架构。
2. 以为 `@dnd-kit/core` 是活跃维护的最新版 —— 实际它停在 6.3.1、约两年没发版了，作者的精力在新的 `@dnd-kit/react`（0.5.0，pre-1.0）上。这直接影响选型决策（见 D3）。
3. 以为 Puppeteer 是 serverless PDF 的默认答案 —— 2026 年的对比数据是 Playwright 在冷启动和复用两个场景下都快一个数量级（147ms→42ms 冷启，48ms→3ms 复用），且 PDF 相关 API（页眉页脚模板）文档更全。

**根因**：技术选型是有保质期的知识，不能靠记忆，必须每次现查。
**防复发**：`docs/02-architecture.md` 的技术栈总表带「2026-08 校准」时间戳；每个阶段开始前重新核对一次将要引入的新依赖。

**第二个坑（提前记下来，因为它一定会发生）**：中文 PDF 字体。Playwright 的官方 Docker 镜像不含 CJK 字体，导出中文简历会全是 `□□□`。已经写进 [P3 Day 12](../04-roadmap.md) 的任务和风险登记，Dockerfile 必须显式装 `fonts-noto-cjk`，并配一个中文冒烟测试防复发。

## 数据

| 项         | 值                          |
| ---------- | --------------------------- |
| 调研项目数 | 3 主要 + 2 辅助             |
| 产出文档   | 6 篇，约 1.1 万字           |
| ADR 数     | 6                           |
| 规划总工期 | 35 工作日（压缩路径 14 天） |
| 代码行数   | **0**                       |

最后一行是故意写的。P0 阶段的产出是决策，不是代码；如果今天写了代码，说明是在没想清楚的情况下动的手。

## 未解决 / 欠的债

1. **真实分页算法还没有可行方案**，只有"iframe 内测高度累加"的粗略思路。这是 P2 唯一的高风险项，已经预设了降级路线（单页 + 溢出提示）。
2. **ATS 强动词表**要人工整理中英各 100+ 条，还没开始。
3. **中文分词库**（`nodejieba` 需要编译 / `segmentit` 纯 JS 但精度低）没最终定，留到 P5 Day 24 实测再决定。
4. AI 默认模型定 DeepSeek 是出于成本，但中文简历改写的质量还没实测对比过。P4 Day 17 要做一次三模型盲测并把结果写进日记。

## 明日

- [ ] P1 Day 1：`create-next-app` 初始化，Tailwind v4 + shadcn/ui + Vitest + ESLint，跑通空壳
- [ ] 定 commit 规范与分支策略
- [ ] 把 `fixtures/sample-resume.ts` 的示例简历内容先想好（后面每个阶段都靠它做测试基准）
