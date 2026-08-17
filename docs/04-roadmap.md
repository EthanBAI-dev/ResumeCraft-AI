# 04 · 开发路线图与里程碑

> 节奏假设：每天有效编码 3–4 小时。**每个阶段结束必须有一个能录屏演示的成果**，不允许出现"这周在重构"的阶段。
> 每个阶段对应 `docs/devlog/` 下的若干篇日记。

---

## 全景

| 阶段   | 目标                             | 天数 | 演示物                                |
| ------ | -------------------------------- | ---- | ------------------------------------- |
| **P0** | 立项、调研、选型                 | 1    | 本套文档 ✅                           |
| **P1** | Schema + 编辑器 + 实时预览       | 5    | 能填内容并看到 A4 实时渲染            |
| **P2** | 拖拽布局 + 分页 + 模板系统       | 5    | 拖动区块换布局，切 3 套模板           |
| **P3** | PDF / DOCX / PNG 导出 + 回读自检 | 5    | 导出的 PDF 文字可选中，覆盖率报告     |
| **P4** | AI 引擎                          | 6    | 大白话 → 结构化量化 bullet，逐条 diff |
| **P5** | ATS 评分引擎                     | 4    | 粘 JD → 分数 + 可点击的问题清单       |
| **P6** | 账号 / 云端 / 版本管理 / 分享    | 5    | 多简历管理、版本回滚与对比            |
| **P7** | 打磨、部署、文档、演示视频       | 4    | 线上可访问 + 90 秒视频                |

合计约 **35 个工作日 / 6–7 周**。

---

## P1 · 骨架与实时预览（5 天）

**Day 1** 项目初始化

- `create-next-app` (TS + Tailwind v4 + App Router) → shadcn/ui init → ESLint/Prettier → Vitest → 目录骨架
- Git 分支策略：`main` 保护，功能走 `feat/*`；commit 用 Conventional Commits（日记里能引用 commit）

**Day 2** Schema 层

- `lib/schema/` 全量 Zod 定义（§见 03 文档）
- 一份 `fixtures/sample-resume.ts` 示例数据（后面每个阶段都靠它测）
- 单测：schema 默认值、非法输入拒绝

**Day 3** Store 层

- Zustand + immer + zundo；resume / editor / ai 三个 store
- IndexedDB 持久化（`idb-keyval`），自动保存 debounce 1s
- 单测：undo/redo 边界、partialize 是否漏进 UI 状态

**Day 4** 编辑器表单

- 左侧面板：区块列表（可折叠）+ 各类型表单
- react-hook-form + zodResolver，字段级校验
- 数组字段（highlights / tech）的增删改

**Day 5** 实时预览 v0

- 右侧 A4 画布：固定 `210mm × 297mm`，`transform: scale()` 适配窗口，缩放控件
- 一套 `modern` 模板（先不分页，超出就滚动）
- **性能基线**：接一个 `performance.mark`，把「按键 → 预览 paint」耗时打到控制台，记录初始数字进日记

✅ **P1 DoD**：刷新页面数据不丢；输入立刻反映在右侧；`pnpm test` 全绿。

---

## P2 · 布局与模板（5 天）

**Day 6** layout 三维数组 + 不变量校验

- `lib/layout/` 的纯函数：`moveSection`、`addPage`、`normalize`（修复孤儿 / 重复 id）
- 单测：随机操作 1000 次后不变量恒成立

**Day 7–8** dnd-kit 接入

- 区块跨栏跨页拖拽、item 内部排序
- 落位指示线、拖拽预览（DragOverlay）、自动滚动
- **键盘可达**：Tab 选中 + Space 抓起 + 方向键移动 + 中文语音播报文案

**Day 9** 真实分页 ★ 本阶段最难

- 方案：预览渲染在 iframe 内，用 `getBoundingClientRect` 测量每个 section 高度，累加超过页高则推入下一页
- 处理 `break-inside: avoid`（一条经历不能被腰斩）
- 溢出时在 UI 上画分页线 + "内容超出 2 行"提示

**Day 10** 模板系统

- `templates/registry.ts`：`{ id, name, thumbnail, defaultLayout, Component }`
- 实现 `modern` / `classic` / `minimal` 三套；模板只吃 props，零业务逻辑
- 主题面板：配色、字体、字号、行高、页边距、栏宽比

✅ **P2 DoD**：新增第 4 套模板的成本 = 一个文件 + 注册表一行，不改任何核心代码（在日记里实测计时验证）。

---

## P3 · 导出（5 天）

**Day 11** 打印导出兜底

- `@page` CSS + `window.print()`，先把"能拿到 PDF"这条路打通

**Day 12–13** PDF Worker 服务

- `services/pdf-worker/`：Fastify + Playwright + Docker
- **Dockerfile 必须装中文字体**（`fonts-noto-cjk`）
- Chromium 实例复用 + 并发信号量 + 超时保护
- Next.js 侧 `/api/export/pdf` 代理，鉴权 + 限流

**Day 14** ★ 文本回读自检（ADR-002）

- `pdfjs-dist` 抽文本 → NFKC 归一化 → 与源数据纯文本比对
- 输出 `{ coverage, orderScore, missing[] }`，UI 上做成"ATS 可读性检查"卡片
- 三套模板 × 三种内容长度的回归测试进 CI

**Day 15** DOCX + PNG + JSON

- `docx` 包按 Schema 生成结构化 Word（**明确定位：结构一致，不追求像素一致**，并在 UI 上说明）
- PNG = PDF 首页转图（`pdfjs` 渲染到 canvas），保证与 PDF 完全一致
- JSON / JSON Resume 双向导入导出

✅ **P3 DoD**：导出 PDF 与屏幕预览肉眼无差；PDF 文本覆盖率 ≥ 98%；中文不出豆腐块。

---

## P4 · AI 引擎（6 天）

**Day 16** Provider 抽象层

- Vercel AI SDK 6 + `@ai-sdk/anthropic|openai|deepseek|google`
- 环境变量切模型；统一错误处理、超时、重试
- 用量计量：token 数入库

**Day 17** Prompt 体系

- `lib/ai/prompts/`：rewrite / expand / condense / translate / generate
- 每个 prompt 带 `version`；中文强动词表 + 量化句式 few-shot
- **JD 注入用 `<job_description>` 包裹 + system prompt 声明其中指令不可执行**（prompt injection 防护）

**Day 18–19** 结构化输出 + 流式

- AI SDK 6 `generateText + Output.object` 直出 Zod 对象，校验失败自动重试
- AI SDK 6 `streamText + Output.object` + `AbortController` 中断
- 服务端 Route Handler，Upstash 限流

**Day 20–21** Diff 审阅 UI

- AI 结果进 `ai.store` 的 pending 队列，不直接写入
- 逐条 diff（`diff-match-patch` 做词级高亮）+ 接受/拒绝/重新生成
- 接受时写入 resume store，自动进版本历史
- "从大白话生成"入口：一段自由文本 → 一次性产出多条结构化 highlight

✅ **P4 DoD**：输入"SpringBoot 商城项目"，10 秒内得到 3–5 条带量化的 highlight，逐条可接受；切换到另一家模型结果照常。

---

## P5 · ATS 引擎（4 天）

**Day 22** 规则框架

- `lib/ats/`：`AtsRule` 接口、注册表、加权归一化、`anchor` 定位
- 完整性 + 可解析性维度的 8 条规则

**Day 23** 内容质量规则

- 强动词表（中英各 100+）、量化指标正则（数字/百分比/量级词）、长度区间、弱开头检测
- 每条规则一个单测 + 一组正反例 fixture

**Day 24** JD 匹配

- JD 分词（中文用 `nodejieba` 或 `segmentit`）→ 停用词 → TF-IDF 提关键词
- 与简历全文求覆盖率；硬技能用词典精确匹配
- 缓存：`jdHash` 命中直接复用

**Day 25** ATS 面板 UI

- 环形分数 + 四维雷达 + 问题清单（按严重度排序）
- 点击 issue → 编辑器滚动并高亮对应字段
- `autoFixable` 的 issue 提供"AI 一键修" → 复用 P4 的 diff 流程

✅ **P5 DoD**：拿一份真实的糟糕简历，分数 < 65 且每条扣分说得清；按建议改完后 > 85。

---

## P6 · 账号与云端（5 天）

- **Day 26** Prisma + Neon/Supabase、Auth.js（GitHub + Google OAuth）
- **Day 27** 简历 CRUD、Dashboard 列表、复制/重命名/删除、本地草稿迁移到云端
- **Day 28–29** 版本管理（ADR-006）：patch 引擎 + snapshot 策略 + 还原 + **随机操作一致性测试**
- **Day 30** 版本对比 UI + 公开分享链接（只读页、过期时间、`noindex`）

✅ **P6 DoD**：改 200 次后能精确回滚到任意版本，且与全量存储结果逐字节一致（测试证明）。

---

## P7 · 打磨与交付（4 天）

- **Day 31** 落地页（讲清楚三个差异点）+ 空状态 + 骨架屏 + 错误边界 + Toast
- **Day 32** 部署：Vercel（Web）+ Fly.io（PDF Worker）+ Neon（DB）+ Upstash；接 Sentry；配 CI（lint / test / build / 回读回归）
- **Day 33** README（带 GIF）、架构图、`docs/` 整理、开源 License、一键 Docker Compose 本地起
- **Day 34** 录 90 秒演示视频；跑 Lighthouse（目标 Performance/A11y ≥ 90）；写完最后一篇日记

✅ **P7 DoD**：陌生人打开链接，不看说明能在 3 分钟内导出一份简历。

---

## 如果只有 2 周（压缩路径）

砍掉 P6 全部（不做账号，纯本地 IndexedDB）+ DOCX + 分享链接，保留：

| 天    | 内容                                                                |
| ----- | ------------------------------------------------------------------- |
| 1–3   | Schema + Store + 表单 + 实时预览                                    |
| 4–5   | layout 数组 + dnd 排序 + 2 套模板（分页先只做"溢出提示"不做真分页） |
| 6–7   | 打印 CSS 导出 PDF + 回读自检                                        |
| 8–10  | AI：provider 抽象 + 结构化输出 + diff 审阅                          |
| 11–12 | ATS：12 条规则 + JD 匹配 + 面板                                     |
| 13–14 | 部署 + README + 演示视频                                            |

**注意：被砍的顺序是有讲究的。** 账号系统是最没有技术辨识度的部分（人人都会写 CRUD），而 AI 结构化输出、回读自检、ATS 引擎是三个差异点，一个都不能砍。

---

## 风险登记

| 风险                          | 概率   | 影响 | 对策                                                                   |
| ----------------------------- | ------ | ---- | ---------------------------------------------------------------------- |
| 真实分页算法做不出来          | 中     | 高   | 降级为"单页 + 溢出高亮 + 建议精简"，P2 Day 9 结束前不通就降级，不硬扛  |
| PDF Worker 部署超出免费额度   | 中     | 中   | 保留 `window.print()` 通道作为线上 fallback                            |
| AI API Key 成本失控           | 中     | 中   | 默认用 DeepSeek（便宜）；未登录用户走演示配额；Upstash 限流；结果缓存  |
| 中文 PDF 字体豆腐块           | 高     | 高   | P3 Day 12 就在 Dockerfile 里装字体并写进冒烟测试                       |
| 范围蔓延（想加协作/模板市场） | **高** | 高   | [01 文档 §3.4「明确不做」](01-product-scope.md) 是硬约束，每周回看一次 |
