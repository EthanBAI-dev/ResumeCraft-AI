# 当前实现与架构

以 2026-10-10 仓库代码为准。早期 `00`–`03` 保留设计过程；本文说明实际行为。

## 数据流

```text
表单 / 模板 / 十二格编辑
          ↓
Zustand + Immer + Zundo ──→ IndexedDB 多简历库
          ↓                      ↑
ResumeDocument              原生 JSON 导入 / 导出
          ↓                      ↑
实时纸张 / PDF HTML       导入 Skill → facts → 原生 JSON
          ↓
可选独立 PDF Worker / 无 Worker 时系统打印
```

Skill 在 AI 助手端执行，网站没有文件识别服务。AI 润色是独立链路：会话 Key + 选中内容 → Next.js Route → DeepSeek 官方接口 → 结构校验 → 用户审阅采用。

| 模块            | 实现位置                                                                | 边界                                   |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| 严格模型 / 草稿 | `lib/schema/`                                                           | 草稿允许未完成字符串，仍检查结构       |
| 内容与撤销      | `lib/store/resume-store.ts`                                             | UI 状态不进入撤销历史                  |
| 多简历          | `lib/store/library.ts`                                                  | IndexedDB 修订检查、切换保存、冲突停写 |
| 模板与文档      | `components/templates/registry.ts`、`components/preview/`               | 6 个 CSS 预设，共用渲染                |
| 字段排版        | `lib/layout/item-layout.ts`、`components/editor/item-layout-editor.tsx` | 十二格，区块内所有条目共享             |
| 分页            | `components/preview/preview-canvas.tsx`                                 | 按区块移动，不拆超高单区块             |
| AI              | `app/api/ai/resume/route.ts`、`lib/ai/`                                 | 生产强制 BYOK；限流仅单实例            |
| 导出            | `lib/export/`、`services/pdf-worker/`                                   | PDF 可选远端渲染；DOCX 独立            |
| Skill           | `skills/resumecraft-import/`                                            | 独立 Node 脚本和提取指导，不内置 OCR   |

原生文件顶层为 `basics`、`sections`、`layout`、`metadata`。`layout[页][栏][位置]` 引用区块 ID，`basics` 为保留项。字段配置在 `metadata.itemLayouts[sectionId]`，Key 不属于数据模型。

原生 JSON 导入使用 `parseDraft` 保留未完成内容。JSON Resume 走兼容映射，`x-resumecraft` 可保留原生数据；第三方扩展不承诺无损往返。Skill 输出原生格式，避免缺失公司/职位被兼容映射替换成占位名。

## 已做与没做

已做：编辑、多简历、自动保存/撤销、模板、矩形照片、两级排版、屏幕辅助线、引导、JSON/Word、系统打印与 Worker 集成、BYOK AI 审阅、基础检查、导入 Skill。

没做：账号、云数据库、跨设备同步、云端版本树、公共 AI 额度、网站内 PDF/OCR 识别、逐字流式 AI、招聘总分或 ATS 成功率保证。数据库/认证/Tiptap/Upstash 的早期设计不是已接入依赖。

## 开发验证

`pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm check:secrets` 是基础门禁。`scripts/` 浏览器回归使用隔离上下文和虚构数据；模拟 AI 响应不代表模型质量。真实模型测试需用户自己的有效 Key，不能写入测试/日志。

Skill 兼容测试把独立脚本输出送入真实导入器。展示图由真实组件生成，但静态渲染不运行自动分页，需另行验证每张图没有超出 A4 可用范围。见 [展示素材维护](showcase.md)。
