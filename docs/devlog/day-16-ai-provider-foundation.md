# Day 16 — AI Provider 抽象与用量边界

日期：2026-08-17
阶段：P4（完成）

## 今天交付

- 接入 Vercel AI SDK 6，以及 OpenAI、Anthropic、Google Generative AI、DeepSeek 四家 Provider。
- `provider:model` 成为上层唯一模型引用格式；`AI_DEFAULT_MODEL` 可切换厂商，业务代码不再直接 import 具体 Provider。
- OpenAI 工厂显式使用 Responses API；其他 Provider 通过同一 `LanguageModel` 接口进入生成层。
- 统一设置最多重试、总超时、单步超时与用户取消信号，并把厂商异常归一化为稳定错误码。
- 每次成功或失败都生成用量记录，包含输入、输出、缓存、推理、总 token、延迟、用途、用户和结束原因。

## 决策

### 锁定与 AI SDK 6 同代的 Provider 主版本

初次安装时包管理器选择了 Provider v4，但 AI SDK 6 依赖 `@ai-sdk/provider` v3；两代包可以同时安装，却会把模型接口分裂成不兼容的协议版本。最终锁定 OpenAI / Anthropic / Google v3、DeepSeek v2，避免在类型断言下掩盖运行时协议差异。

### OpenAI 明确走 Responses API

OpenAI Provider 使用 `.responses(modelId)`，与[官方 OpenAI 模型指南](https://developers.openai.com/api/docs/guides/latest-model)推荐的 Responses API 路径一致。模型默认值仍可由环境变量替换，不把具体模型散落在业务代码里。

### 用量持久化先定义仓库接口

当前项目还没有 P6 的数据库层，因此调用端依赖 `AiUsageRepository`，默认实现是有界内存仓库。未来接 Prisma/Postgres 只替换仓库实现。仓库写入失败会告警但不吞掉已经付费生成成功的结果，避免把计量故障误报成模型失败。

## 踩坑

SDK 包版本号并不共用同一个主版本：`ai@6` 对应的第一方 Provider 并非当前最新主版本。仅看 `pnpm add` 成功无法发现这个问题，必须核对 Provider 对 `@ai-sdk/provider` 的实际依赖代际；现在通过锁定兼容主版本和 TypeScript 模型接口测试防止复发。

## 数据

- Provider 解析与配置：5 项测试。
- 错误归一化：3 项测试。
- 用量仓库：1 项测试。
- 统一生成与计量：3 项测试。
- 全仓 16 个测试文件、98 项测试通过。
- 未使用真实 API key 发起付费请求；生成测试全部通过可注入执行器验证边界。

## 未解决 / 欠的债

- `AiUsageRepository` 的 Prisma/Postgres 实现等待 P6 数据库阶段；当前进程重启会清空内存记录。
- Day 17 才加入版本化 Prompt；Day 18 再通过 Route Handler 暴露结构化生成与流式取消。
- 部署前需为每个用户生成稳定、隐私保护的 OpenAI `safety_identifier`，并通过 Provider options 透传。

## 明日

- 建立 rewrite / expand / condense / translate / generate 五类版本化 Prompt。
- 对 JD 做不可信数据封装与 prompt injection 防护。
