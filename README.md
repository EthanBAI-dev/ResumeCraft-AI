# ResumeCraft

**AI-Powered Visual Resume Designer** — 结构化拖拽编辑 + 实时 A4 预览 + AI 内容引擎 + ATS 可解释评分 + 高保真多格式导出。

> 状态：**P2 完成，P3 进行中**（拖拽布局 / 真实分页 / 三套模板 / 本地导出已完成，Chromium PDF Worker 已接入）。
> 进度与踩坑见 [开发日记](DEVLOG.md)。

```bash
pnpm install && pnpm dev
```

打开 http://localhost:3000/builder ，点工具栏「载入示例」即可看到效果。

高保真 PDF 需要另开一个终端启动 Worker，并把 `.env.example` 复制为 `.env.local`：

```bash
pnpm --filter @resumecraft/pdf-worker start
```

Worker 默认同时渲染 2 份简历、最多排队 4 份；可通过 `MAX_CONCURRENT_RENDERS`、
`MAX_QUEUED_RENDERS` 与 `RENDER_TIMEOUT_MS` 调整。`/health` 和 `/metrics` 会返回当前队列状态。

未配置或 Worker 暂时不可用时，工具栏会自动回退到浏览器系统打印。

---

## 这个项目在解决什么

市面上的简历工具分两类，各有明确缺陷：

| 类型       | 代表             | 缺陷                                |
| ---------- | ---------------- | ----------------------------------- |
| 模板填空型 | 超级简历 / Canva | 排版不可控，改一个字段整页崩        |
| 自由画布型 | Figma 简历模板   | 分页失控，导出的 PDF 机器读不出文字 |

ResumeCraft 走第三条路：**约束式可视化编辑**。数据是结构化的（Schema 驱动），布局是可拖拽的（但被 A4 网格约束），渲染只有一份真相（HTML/CSS），导出必须通过**文本回读自检**（导出后把 PDF 文字抽回来跟源数据比对，覆盖率不达标就报警）。

## 核心能力

✅ = 已实现　🚧 = 进行中　⬜ = 规划中

- ✅ **结构化拖拽编辑** — 区块级鼠标/键盘排序、跨栏/跨页放置、落点插入线与中文语音播报
- ✅ **实时 A4 预览** — 794×1123px 精确纸张、缩放自适应、区块级真实分页与不可拆分内容告警
- ✅ **模板系统** — 3 套模板，样式与内容解耦，新增模板不改核心逻辑
- ✅ **本地优先持久化** — IndexedDB 自动保存，不登录也能用
- ✅ **撤销 / 重做** — 连续编辑智能合并为一步
- ⬜ **AI 内容引擎**（P4）· **ATS 评分**（P5）· 🚧 **导出**（P3：✅ Chromium/浏览器 PDF、DOCX、JSON）· **版本管理**（P6）

未开始部分的设计细节见 [路线图](docs/04-roadmap.md)：AI 结构化输出与 diff 审阅（P4）、ATS 规则引擎与 PDF 文本回读校验（P3/P5）、JSON Patch 版本树（P6）。

## 技术栈

**已接入**：Next.js 16.3 · React 19.2 · TypeScript 5.9 · Tailwind CSS v4 · shadcn/ui（Base UI）· Zustand 5 + immer + zundo · Zod 4 · idb-keyval · Vitest 4 · @dnd-kit · Playwright/Chromium · docx

**规划中**：pdf.js 回读自检（P3）· Vercel AI SDK 6（P4）· Prisma + PostgreSQL（P6）

## 文档

| 文档                                                    | 内容                                              |
| ------------------------------------------------------- | ------------------------------------------------- |
| [00 竞品调研与借鉴边界](docs/00-competitor-research.md) | Reactive Resume / OpenResume 拆解，**许可证红线** |
| [01 产品定位与功能范围](docs/01-product-scope.md)       | 做什么、明确不做什么、MVP 切割                    |
| [02 架构决策记录](docs/02-architecture.md)              | 6 条 ADR，含每条的备选方案与代价                  |
| [03 数据模型与 Schema](docs/03-data-model.md)           | Zod Schema、layout 三维数组、DB 表设计            |
| [04 路线图与里程碑](docs/04-roadmap.md)                 | P0–P7 阶段、验收标准、2 周压缩路径                |
| [05 简历话术与面试问答](docs/05-resume-pitch.md)        | 项目怎么写进简历、面试官会问什么                  |
| [开发日记](DEVLOG.md)                                   | 逐日决策记录（真实进度，不预写）                  |

## License

MIT
