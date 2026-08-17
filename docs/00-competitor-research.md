# 00 · 竞品调研与借鉴边界

调研时间：2026-08-17

---

## 1. Reactive Resume（首要参考）

| 项           | 内容                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 仓库         | https://github.com/AmruthPillai/Reactive-Resume                                                                                                |
| 在线         | https://rxresume.org                                                                                                                           |
| **License**  | **MIT** ✅ 可以借鉴代码与思路，保留版权声明即可                                                                                                |
| 当前栈（v5） | TanStack Start (React 19 + Vite)、TypeScript、PostgreSQL + **Drizzle**、ORPC、**Better Auth**、Tailwind、Base UI、**Zustand + TanStack Query** |
| PDF          | v5.1.0 起改为**客户端** `@react-pdf/renderer`                                                                                                  |
| 模板         | 15 套（Azurill / Bronzor / Gengar / Onyx ...），支持 A4 与 Letter                                                                              |
| AI           | 已接 OpenAI / Gemini / Anthropic                                                                                                               |
| 其他         | JSON Resume 导入、分享链接、多语言、Passkey + 2FA、monorepo（pnpm workspaces + Turbo）                                                         |

### 值得直接拿来的设计

1. **`layout: string[][][]` 三维布局数组** — `[页][栏][sectionId]`。整个拖拽排序、分栏、翻页只操作这一个数组，模板只负责按数组渲染。这是这个项目最优雅的一处设计，我们直接采用（见 [03 数据模型](03-data-model.md)）。
2. **Section 通用结构** — 所有区块共享 `{ id, name, visible, columns, items[] }`，只有 `items` 的类型不同。新增区块 = 加一个 Zod schema，不动渲染逻辑。
3. **metadata 与 data 分离** — 主题/字号/页边距进 `metadata`，内容进 `sections`。换模板不动内容。
4. **自定义 CSS 逃生舱** — `metadata.css` 允许用户注入 CSS，覆盖模板做不到的长尾需求。低成本高感知。

### 我们要做得不一样的

- 它是**表单编辑器**，拖拽只用于区块排序；我们要把拖拽做到**跨栏 + 页内块级**，并加对齐/间距的可视化控制。
- 它的 AI 是"弹窗改一段文本"；我们要做**结构化输出 + 逐条 diff 接受/拒绝**。
- 它没有 ATS 评分；这是我们的主要差异点。

---

## 2. OpenResume（谨慎参考）

| 项          | 内容                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| 仓库        | https://github.com/xitanggg/open-resume                                     |
| **License** | **AGPL-3.0** ⚠️                                                             |
| 栈          | Next.js 13、React、**Redux Toolkit**、Tailwind、`pdf.js` 读、`react-pdf` 写 |
| 亮点        | 简历 PDF 解析（Resume Parser）、ATS 友好检查、纯本地无需注册                |

### ⚠️ 许可证红线（重要）

**AGPL-3.0 具有传染性**。把 OpenResume 的代码复制进本项目，会要求本项目整体以 AGPL-3.0 开源，且**网络提供服务也算分发**（AGPL 的 §13 条款）——意味着你部署的在线版也必须开放全部源码。

**边界规则：**

| 行为                                              | 允许？         |
| ------------------------------------------------- | -------------- |
| 阅读它的代码，理解 PDF.js 按坐标聚类成行的思路    | ✅             |
| 参考它的 ATS 检查项清单（事实与想法不受版权保护） | ✅             |
| 复制它的 `parseResumeFromPdf` 目录代码            | ❌ 会传染 AGPL |
| 复制它的模板 CSS / 组件                           | ❌             |

> 实践做法：调研阶段读它，**实现阶段关掉它的仓库，自己写**。我们的 PDF 解析走独立设计（见下）。

---

## 3. BuildMyResume

| 项     | 内容                                                                                     |
| ------ | ---------------------------------------------------------------------------------------- |
| 仓库   | https://github.com/rashidrashiii/BuildMyResume                                           |
| 定位   | Gemini AI 润色 + PDF 导出 + 隐私优先（数据不落库）                                       |
| 可借鉴 | "无账号也能用" 的本地优先体验：localStorage/IndexedDB 存草稿，登录只是同步，不是准入门槛 |

---

## 4. 其他值得看一眼的

- **JSON Resume**（https://jsonresume.org）— 事实标准的简历数据 schema。我们的 Schema 与它保持**可双向转换**，能白拿一个"支持导入/导出标准格式"的功能点，也方便别人的模板生态。
- **Resume Matcher**（开源，JD 匹配打分）— ATS 匹配算法的思路来源。

---

## 5. 结论：融合配比

| 来源                    | 占比 | 拿什么                                                        |
| ----------------------- | ---- | ------------------------------------------------------------- |
| Reactive Resume         | 40%  | 数据模型、layout 数组、模板解耦机制                           |
| Figma / Framer          | 20%  | 交互手感：拖拽、吸附、对齐线、右侧属性面板                    |
| Cursor / GitHub Copilot | 20%  | AI 交互范式：inline diff、逐条接受、流式 + 可中断             |
| **原创**                | 20%  | **ATS 回读自检**、AI 结构化输出落回 Schema、JSON Patch 版本树 |

那 20% 原创是面试时唯一真正能讲出深度的部分。见 [05 简历话术](05-resume-pitch.md)。

---

## 参考链接

- [Reactive Resume - GitHub](https://github.com/AmruthPillai/Reactive-Resume)
- [OpenResume - GitHub](https://github.com/xitanggg/open-resume)
- [BuildMyResume - GitHub](https://github.com/rashidrashiii/BuildMyResume)
- [JSON Resume Schema](https://jsonresume.org/schema/)
