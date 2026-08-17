# Day 12 — PDF Worker：同一份 DOM 进入 Chromium

日期：2026-08-17  
阶段：P3（进行中）

## 今天交付

- 新增独立 `services/pdf-worker`：Fastify 接收内联 HTML，复用常驻 Chromium 并返回可下载 PDF。
- Next.js `/api/export/pdf` 只承担参数校验和代理；Worker 未配置、不可达或超时时，前端自动回退系统打印。
- 导出直接克隆屏幕上的 `.resume-root` 和 CSSOM，剥离拖拽手柄，不维护第二套模板 HTML。
- Dockerfile 显式安装 `fonts-noto-cjk`，并在镜像构建阶段用 `fc-match` 与真实 Chromium PDF 冒烟双重验证。
- Worker 禁用页面 JavaScript、Service Worker 和 HTTP(S) 子请求，避免自定义内容把渲染服务变成脚本或 SSRF 入口。

## 决策

### 传 DOM 快照，而不是在 Worker 内再跑一套 React SSR

选 DOM + CSSOM 快照而不是把整套 Next.js 构建塞进 Worker，因为浏览器当前显示的分页结果才是用户确认过的最终状态。代价是请求体更大，因此 API 与 Worker 都把 HTML 限制在 2MB 左右；后续需要图片时也不能无上限地内联资源。

### Playwright 包与基础镜像使用同一个精确版本

`playwright` 的 caret 版本曾解析到 1.62.1，而遗留基础镜像仍是 1.58.2；两边对应的 Chromium revision 不同，容器会在启动时找不到浏览器。MCR 又没有发布 1.62.1 对应镜像，因此现在二者都固定为仓库实际存在的 `1.61.1`，升级必须成对修改。

## 踩坑

全量测试第一次跑出了 **175 个测试文件 / 1932 项测试**，其中大量来自 `services/pdf-worker/node_modules/zod/src/**`。最初的 `exclude: ["services/**"]` 没能阻止 Vitest 4 沿 pnpm workspace 的依赖链接扫描。根因不是 Zod 或业务测试失败，而是测试发现范围过宽。修复为只白名单扫描 `app/components/fixtures/lib`，最终恢复为 **8 个文件 / 74 项测试**，并保留 `**/node_modules/**` 兜底。

## 数据

- 本机中文 Chromium 冒烟 PDF：49,043 bytes，文件头 `%PDF`。
- 真实 Worker `/render` 请求：40,917 bytes，HTTP 200，约 891ms；非法参数返回 HTTP 400。
- `pnpm test`：74/74；`pnpm typecheck`、`pnpm lint`、`pnpm build` 均通过。

## 未解决 / 欠的债

1. 当前机器没有 Docker CLI，Dockerfile 的构建期字体检查尚未在本机实际执行；需在有 Docker 的环境运行 `docker build -t resumecraft-pdf-worker services/pdf-worker`。
2. Day 13 增加并发信号量、排队上限与更细的超时/指标；当前常驻 Browser 已复用，但请求仍可无上限创建 Context。
3. 用户鉴权和分布式限流依赖后续账号/Redis 基础设施；部署前不能把 Worker 直接暴露到公网。

## 明日

- 增加 Chromium 并发控制、过载快速失败和运行时指标。
- 接入 PDF 文本回读，对覆盖率与阅读顺序做可量化校验。
