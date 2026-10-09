# 参与 ResumeCraft

感谢帮助这个项目变得更好。提交 Issue 时请说明重现步骤、浏览器、预期与实际行为；使用脱敏或示例简历，不要上传个人简历、API Key 或环境文件。

## 本地开发

使用 Node.js 24 和 `pnpm@11.9.0`，运行 `pnpm install --frozen-lockfile`、`pnpm dev`。可选服务配置见 README。Next.js API 有版本差异，修改之前请查阅 `node_modules/next/dist/docs/` 中对应文档。

## 提交改动

从独立功能分支开发。PR 描述应说明解决的问题、行为变化、验证结果；界面修改附截图。提交前运行 `pnpm test`、`pnpm typecheck`、`pnpm lint` 和 `pnpm build`。模板和交互可以通过 `node scripts/visual-check.mjs` 回归。

简历内容、布局与样式分别存储。屏幕与 PDF 复用 `ResumeDocument` 和纸张 CSS；新增模板需要注册预设，保留结构化文字，并检查中文长文本、分页和打印。编辑器装饰不能进入导出文档。

AI 建议必须先审阅再应用。保留撤销与原文冲突保护；不得将 Key 放在前端，也不得把模拟响应描述成真实模型输出。真实 Provider 联调需要自行配置凭据，自动化测试默认不发起付费模型请求。

## 提交范围

请勿提交 `node_modules`、`.next`、环境文件、真实简历和测试导出物。源码使用 MIT 许可证，新增依赖、字体、图片和模板素材需保留各自许可证与来源。
