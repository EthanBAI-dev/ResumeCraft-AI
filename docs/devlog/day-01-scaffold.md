---
day: 01
date: 2026-08-17
phase: P1
hours: 1.5
status: done
commits: []
---

# Day 01 · 初始化：三个都不在计划里的坑

## 今日目标

- [x] Next.js 16 + TypeScript + Tailwind v4 骨架
- [x] shadcn/ui、ESLint、Prettier、Vitest
- [x] 目录结构按 [02-architecture.md](../02-architecture.md) 落地

## 做了什么

- `create-next-app` 生成 Next.js **16.3.1** / React **19.2.8** / Tailwind **v4** 骨架
- 装齐运行时依赖：zod 4.4.3、zustand 5.0.15、zundo 2.3.0、immer 11.1.16、nanoid 6.0.1、react-hook-form 7.85、idb-keyval 6.3
- 测试链路：vitest 4.1.10 + jsdom 30 + @testing-library/react 16
- shadcn 初始化并添加 16 个组件到 `components/ui/`

## 决策

**D1. 用 pnpm 而不是 npm。** 主要是磁盘：这个项目后面还要加 Playwright（带 Chromium）和 Prisma，node_modules 会很大，pnpm 的硬链接 store 能省一大截。代价是遇到了 D3 的锁文件问题。

**D2. 不用 `src/` 目录。** 根级 `app/ components/ lib/` 更扁平，且 `lib/` 下四个纯逻辑目录（schema/layout/ats/export）是这个项目要对外展示的部分，放在根目录一眼能看到，不埋在 `src/` 里。

## 踩坑

**坑 1：目录名带空格，`create-next-app` 直接拒绝。**
项目目录叫 `ResumeCraft - AI Powered Visual Resume Designer`，而 npm 包名不允许空格。`create-next-app .` 会用目录名当包名，校验直接失败。
解决：先在临时目录里以 `resumecraft` 为名生成，再把文件拷回项目根（`README.md` 和 `.gitignore` 排除，用 P0 已经写好的那份）。`package.json` 的 `name` 保持 `resumecraft`。
教训：**项目目录名最好从一开始就用连字符**，中途改目录名会牵连 IDE 配置和已有的绝对路径。

**坑 2：`next` 的 tarball 拉了 3 分钟然后超时。**

```
[WARN] GET https://registry.npmjs.org/next/-/next-16.3.1.tgz error (23). Will retry in 10 seconds.
TimeoutError: The operation was aborted due to timeout
```

pnpm 默认 fetch 超时 60s，而 Next.js 的包在国内网络下经常拉不完。**dev 依赖全部装好了，只有直接依赖 `next` 失败**，导致 `package.json` 里 dependencies 那一段根本没被写入——很容易误以为"装完了"。
解决：加 `.npmrc`

```
fetch-timeout=900000
fetch-retries=5
```

防复发：`.npmrc` 进版本库，新机器 clone 下来就带着这个配置。

**坑 3：`pnpm` 并发跑会抢锁，报 EPERM。**
我一边跑 `shadcn add`（内部会调 `pnpm add`），一边跑 `vitest`，结果：

```
[EPERM] EPERM: operation not permitted, rename 'pnpm-lock.yaml.433908486' -> 'pnpm-lock.yaml'
```

Windows 上文件被占用时重命名会直接失败（Linux 上通常不会）。
教训：**任何会写 `pnpm-lock.yaml` 的命令都必须串行**。后面写 CI 的时候要注意别把 install 和 test 并行。

**坑 4（最重要）：shadcn 现在底层是 Base UI，不是 Radix。**
装完组件后 typecheck 报：

```
Property 'asChild' does not exist on type ... ButtonProps
Type 'number | readonly number[]' must have a '[Symbol.iterator]()' method
```

打开 `components/ui/button.tsx` 一看：`import { Button as ButtonPrimitive } from "@base-ui/react/button"`。

API 差异清单（后面写组件要一直记着）：

| 场景                 | Radix（老资料里的写法）               | Base UI（现在）                                    |
| -------------------- | ------------------------------------- | -------------------------------------------------- |
| 渲染成别的元素       | `<Button asChild><Link/></Button>`    | `<Button render={<Link/>} />`                      |
| 渲染成非 button 元素 | 自动                                  | 还要显式 `nativeButton={false}`，否则运行时告警    |
| Slider 回调          | `onValueChange={([v]) => …}` 恒为数组 | `number \| readonly number[]`，单值时直接给 number |

漏了 `nativeButton={false}` 的后果是控制台一条 error：

> A component that acts as a button expected a native `<button>` … Rendering a non-`<button>` removes native button semantics

这条不是样式问题，是**真的丢了按钮语义**（表单提交、键盘行为、屏幕阅读器角色）。

**教训**：网上 90% 的 shadcn 教程还在写 `asChild`。**遇到类型报错第一件事是打开 `components/ui/` 里的源码看它到底包了谁**，而不是去搜教程。这也正好印证了 [Day 00](day-00-kickoff.md) 那条"技术选型是有保质期的知识"。

## 数据

| 项                         | 值                                |
| -------------------------- | --------------------------------- |
| Next.js / React / Tailwind | 16.3.1 / 19.2.8 / v4              |
| 首次 `pnpm install` 耗时   | 3m 2s（冷 store，含一次超时重试） |
| 二次安装（热 store）       | 12.2s                             |
| 依赖总数                   | 574 packages                      |
| shadcn 组件                | 16 个                             |

## 未解决 / 欠的债

1. 还没配 CI（lint / typecheck / test 三件套），P7 补。
2. `prettier-plugin-tailwindcss` 装了但没跑过全量 format。
3. 中文字体还没接（`Noto Sans SC` 目前靠系统回退），P3 做 PDF 导出时必须解决。

## 明日

- [ ] Zod schema 层：primitives / items / section / resume
- [ ] 示例简历 fixture，后面每个阶段的测试基准
