# ResumeCraft

### 让经历，被看见。

免费、开源、本地优先的简历工作台。**不注册也能写简历、调排版和导出；AI 可选，用自己的 Key。**

[在线体验](https://resumecraft-ethan.vercel.app) · [开始编辑](https://resumecraft-ethan.vercel.app/builder) · [快速开始](#快速开始) · [模板预览](#六套模板完整页预览) · [使用手册](docs/user-guide.md) · [简历导入 Skill](docs/import-skill.md) · [部署指南](docs/deployment.md)

> 公共体验站已部署至 Vercel，当前生产分支为 `codex/vercel-release`。无账号、无云端简历、无公共 AI 额度，不以关注或付费作为导出条件。体验站暂未部署 PDF Worker：PDF 使用系统打印保存，PNG 与 Worker 导出校验暂不可用。

## 六套模板，完整页预览

不是效果稿：以下图片用项目实际的 `ResumeDocument` 和样式渲染。六套模板使用同一份虚构经历；为便于展示整张 A4，调整了字号与间距。真实内容过长时会分页，字体随本机安装情况回退。

![六套简历模板的完整 A4 页面总览](docs/images/templates-gallery.jpg)

点击下图查看各模板完整大图：

| 现代 · Modern                                                                                 | 经典 · Classic                                                                                | 留白 · Minimal                                                                          |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [![现代双栏简历](docs/images/template-modern.jpg)](docs/images/template-modern.jpg)           | [![经典单栏简历](docs/images/template-classic.jpg)](docs/images/template-classic.jpg)         | [![留白单栏简历](docs/images/template-minimal.jpg)](docs/images/template-minimal.jpg)   |
| 清晰双栏 · 技术与产品                                                                         | 居中抬头 · 正式与通用                                                                         | 纯粹单栏 · 简洁与克制                                                                   |
| **商务 · Executive**                                                                          | **刊物 · Editorial**                                                                          | **北欧 · Nordic**                                                                       |
| [![商务深蓝题头简历](docs/images/template-executive.jpg)](docs/images/template-executive.jpg) | [![刊物宋体风格简历](docs/images/template-editorial.jpg)](docs/images/template-editorial.jpg) | [![北欧轻盈双栏简历](docs/images/template-nordic.jpg)](docs/images/template-nordic.jpg) |
| 深蓝题头 · 管理与咨询                                                                         | 宋体标题 · 设计与内容                                                                         | 鼠尾草绿 · 轻盈双栏                                                                     |

## 有什么不一样

- **内容与排版分开**：换模板保留经历；区块可跨栏、跨页拖动，支持键盘操作和撤销。
- **十二格字段排版**：公司、职位、日期各占几格由你决定；支持拖动换位、强制换行、对齐、显隐。虚线把实际排版规则画出来，不靠猜。
- **本地多简历**：新建、复制、重命名、切换、自动保存。面向不同岗位保留不同版本，不用注册。
- **已有简历也能带进来**：随仓库提供 `resumecraft-import` Skill，让 AI 助手读取用户文件、列出疑点，生成网站可导入的 JSON。
- **AI 建议先审后用**：自带 DeepSeek Key，润色或生成经历要点；查看文字增删、勾选采用、取消或撤销。未确认前不改原文。
- **照片与上手体验**：本地上传，4:5 矩形证件照；男女两种虚构示例、一键显隐；七步高亮引导与模块帮助。
- **检查有理由，不编总分**：提醒遗漏、示例资料、日期和长要点，可核对手工输入的关键词；不预测录用率或 ATS 通过率。

### 排版规则，看得见

外层虚线是区块，内层虚线是字段，浅色竖线是十二格。展开或修改「字段排版」时自动显示，正在调整的区块会高亮；悬停字段可查看占格与换行规则。点击「完成布局」收起，导出不带辅助线。

[![实际纸张上的字段与栅格辅助线](docs/images/layout-guides.jpg)](docs/images/layout-guides.jpg)

## 从旧简历到新排版

![读取、核对导入、排版导出的三步流程](docs/images/import-workflow.jpg)

1. 把自己的 PDF、Word、图片或文字交给安装了 Skill 的 AI 助手。
2. 助手核对来源，生成 `resume.resumecraft.json` 和待核对报告。
3. 网站「文件 → 导入」，选择生成的 JSON，新建一份简历，再选模板和修改内容。

**边界说明：网站目前直接接收 JSON，不直接识别 PDF/Word/图片简历。** 文件识别由 AI 助手及其可用工具完成；扫描件需要 OCR/视觉能力，不保证所有文件都能准确识别。Skill 不会编造日期、业绩或责任范围，也不会替你投递。见 [安装、使用与示例](docs/import-skill.md)。

## 快速开始

建议 Node.js 24，使用仓库指定的 pnpm 11.9.0。

```bash
git clone https://github.com/EthanBAI-dev/ResumeCraft-AI.git
cd ResumeCraft-AI
npm install --global pnpm@11.9.0
pnpm install --frozen-lockfile
pnpm dev
```

打开 [本地编辑器](http://localhost:3000/builder)。不配置环境变量也能体验编辑、本地保存与系统打印。首次进入会载入示例；已有草稿优先恢复，不自动覆盖。

第一次使用建议：**改内容 → 选模板 → 调字段 → 检查 → 导出**。小屏幕可在「编辑内容 / 纸张预览」间切换。

## 导出能力与依赖

| 能力                    | 无需额外服务 | 说明                                                      |
| ----------------------- | ------------ | --------------------------------------------------------- |
| 原生 JSON / JSON Resume | 是           | 原生 JSON 适合备份与迁移；包含个人资料，请妥善保存        |
| Word（DOCX）            | 是           | 独立文档渲染，排版不承诺与六套 HTML 模板逐像素一致        |
| PDF（系统打印）         | 是           | Worker 未配置/失败时回退；建议选择 A4、关闭浏览器页眉页脚 |
| 高保真 PDF + 文本回读   | 否           | 需要独立 PDF Worker；回读是技术检查，不是招聘系统认证     |
| PNG 首页                | 否           | 从 Worker 生成的 PDF 首页渲染，仅导出第一页               |

长内容按区块自动分页；单一区块高于整页时会提示精简，当前不会把该区块自动拆成两页。详见 [使用手册](docs/user-guide.md)。

## AI 与隐私

顶部「AI 设置」填入**用户自己的 DeepSeek Key**。仅当前页面内存保存，刷新清除；不进入本地简历或 JSON。调用时，Key 和选中的内容经本站后端转发给 DeepSeek 官方接口，后端处理时可接触 Key，不能称为端到端不可见。模型费用由用户的模型账户承担，网站不提供公共额度。

生产 AI 路由拒绝无 Key 请求，不回退使用站长 Key；不支持任意代理地址。AI 输出需要本人核实，当前非逐字流式。网站 AI 与导入 Skill 是两条独立流程：Skill 使用你所选 AI 助手的能力与服务条款，不借用网站 Key。

普通编辑与照片处理在浏览器内完成。高保真 PDF 会将简历 HTML 发送到部署者配置的 Worker。本地保存并非永久备份，清除浏览器数据、无痕会话结束或设备故障可能丢失内容。更多见 [隐私页面源码](app/privacy/page.tsx) 和 [部署边界](docs/deployment.md)。

## 部署与开源贡献

Web 可部署到 Vercel；不部署 Worker 也可以提供系统打印版 PDF。**不要把自己的模型 Key 放进仓库或生产环境。** Vercel 套餐的适用范围、限额与引流用途需要部署者自行确认，免费软件不等于永久免费托管。[上线步骤与验收清单](docs/deployment.md)

```bash
pnpm check:secrets
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

[贡献指南](CONTRIBUTING.md) · [MIT License](LICENSE) · [关注作者](https://github.com/EthanBAI-dev) · [反馈问题](https://github.com/EthanBAI-dev/ResumeCraft-AI/issues)

技术栈：Next.js / React / TypeScript / Tailwind CSS / Base UI / Zustand + Immer + Zundo / Zod / dnd-kit / IndexedDB / Vercel AI SDK / Playwright / pdf.js / docx。无需账号或数据库服务器。

## 文档导航

| 文档                                           | 用途                                     |
| ---------------------------------------------- | ---------------------------------------- |
| [使用手册](docs/user-guide.md)                 | 模块入口、排版、照片、AI、导出与常见问题 |
| [导入 Skill](docs/import-skill.md)             | 安装、文件识别、核对、导入和隐私边界     |
| [部署指南](docs/deployment.md)                 | Vercel / Worker、密钥、上线验收          |
| [当前实现与架构](docs/current-architecture.md) | 真实数据流、关键文件和未实现项           |
| [路线图](docs/04-roadmap.md)                   | 当前免费版本的范围                       |
| [展示素材维护](docs/showcase.md)               | 真实模板图来源与更新方法                 |
| [开发日记](DEVLOG.md)                          | 历史决策与验证记录                       |

`docs/00`–`docs/03` 和早期日记保留设计过程，可能包含已取消的云端/账号方案；当前行为以代码、上述使用手册和当前架构文档为准。
