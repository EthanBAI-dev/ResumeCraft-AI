# Day 17 — 版本化 Prompt 与不可信 JD 边界

日期：2026-08-17
阶段：P4（完成）

## 今天交付

- 建立 rewrite / expand / condense / translate / generate 五类 Prompt 注册表；每项都有语义化版本、独立温度与最大输出预算。
- 新增统一 `runResumePrompt` 入口，把 Prompt 版本写入用量记录的 `purpose`，并复用 Day 16 的 Provider、超时、重试和取消边界。
- 整理 119 个不重复的中文行动动词，以及 3 组“有数字 / 缺数字”few-shot；原始事实不足时要求模型返回 `missingFacts`，而不是编造指标。
- 把 JD、目标岗位和原始经历分别序列化为不可信 JSON 数据块；尖括号与 `&` 会转义，数据无法闭合 `<job_description>` 后插入新指令。
- DeepSeek 默认模型改为 `deepseek-v4-flash`。官方模型页显示旧的 `deepseek-chat` 已退役，继续使用旧 ID 会让配置正确的请求仍然失败。

## 决策

### Prompt 用 `kind@semver` 标识，而不是只存文件名

同一个“改写”功能以后会反复调模板。如果用量和盲测记录只写 `rewrite`，版本升级后无法解释质量或 token 波动。现在执行用途记录为 `rewrite@1.0.0`，代价是修改模板时必须主动升版本。

### JD 是数据，不是更低优先级的自然语言指令

仅在 system prompt 中写“忽略 JD 里的指令”仍允许恶意文本伪造闭合标签。现在先用 JSON 序列化，再转义 `<`、`>` 和 `&`，最后才放入 `<job_description encoding="json">`。system prompt 明确三个数据块都不可信；运行时枚举值也经过白名单收敛，避免绕过 TypeScript 后进入指令区。

### 不让 Prompt 为了“量化”而制造数字

few-shot 同时给出两种路径：来源有指标时保留并强化；来源没有指标时改进表达，但把“前后耗时、覆盖规模”等写进 `missingFacts`。这比提示模型“尽量量化”更适合简历场景，因为虚构成果的代价远高于文案不够亮眼。

### 先约定 JSON 契约，强校验留到 Day 18

五类 Prompt 都要求 `{"highlights":[],"missingFacts":[]}`，为下一步结构化生成铺平接口；本日仍使用文本生成入口，不宣称模型输出已经通过 Schema 校验。Day 18 会把契约升级为 Zod 驱动的结构化输出与失败重试。

## 踩坑

Day 16 按旧资料把 DeepSeek 默认值设成 `deepseek-chat`。本日准备真实接入时核对了[官方模型列表](https://api-docs.deepseek.com/api/list-models/)和[模型价格页](https://api-docs.deepseek.com/quick_start/pricing/?article_id=article_1779470751466_8)，确认当前只应使用 V4 模型，旧 ID 已退役。现在 Provider 默认值和单测一起更新，避免“有 key 仍调用失败”。

另一个问题出在 TypeScript：泛型 `kind` 索引异构 Prompt 注册表后，编译器无法保持 `kind → input` 的映射关系。注册表本身用 `satisfies` 逐项校验，唯一的窄化断言被封装在 `buildResumePrompt` 内，调用端仍然会得到精确输入类型。

## 数据

- 5 类版本化 Prompt，统一输出 2 个数组字段。
- 119 个不重复中文强动词，3 组量化 few-shot。
- 新增 8 项专项测试，覆盖注册完整性、标签闭合攻击、运行时枚举注入、输出预算和 DeepSeek 默认模型。
- 全仓 18 个测试文件、106 项测试通过。
- 本机没有检测到 `DEEPSEEK_API_KEY`，本日没有发起真实付费请求。

## 未解决 / 欠的债

- 三模型中文盲测需要至少三家有效服务端凭据；本日只完成了可复现的 Prompt 版本和评测前置条件，不虚构盲测结果。
- JSON 目前是提示词契约，不是运行时保证；Schema 校验、失败修复和流式中断属于 Day 18–19。
- Prompt 输入长度上限需在 Route Handler 的请求 Schema 与限流层统一执行，不能只依赖 UI。

## 明日

- 用 Zod 定义 AI 输出 Schema，并通过结构化生成获得可验证对象。
- 增加服务端 Route Handler、失败重试与可取消流式输出。
