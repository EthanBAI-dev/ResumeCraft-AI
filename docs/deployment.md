# 免费、本地优先的上线检查

当前产品不做登录、不存云端简历、不提供公共模型额度。编辑、多简历管理、本地检查、Word/JSON 和系统打印均无需账号或 Key。关注作者是自愿行为，不作为导出门槛。

## Vercel 首版

当前生产分支为 `main`。英文界面、双语 README 与本地优先发布版通过合并保留了原 `main` 的 Sites 部署文件，不强推或丢弃历史。向 `main` 推送会触发 Vercel 生产部署。仓库已提供 `vercel.json` 和 Node.js 24 版本约束。[英文使用与部署指南](guide.en.md)

### 2026-10-10 首次上线记录

- 公共站点：[resumecraft-ethan.vercel.app](https://resumecraft-ethan.vercel.app)，[直接编辑](https://resumecraft-ethan.vercel.app/builder)。
- Vercel 项目：`aiai6/resumecraft-ai`；首个应用提交 `3654e61`，生产部署状态 Ready。
- 本地 162 项测试、lint、build、typecheck、密钥启发式扫描通过；GitHub CI 也通过。
- 无登录 HTTP 检查：首页、编辑器、隐私页均为 200；AI 状态返回 `configured: false, mode: byok`，合法但无 Key 的请求返回 401，未调用付费模型。
- 浏览器冒烟：首次示例与七步引导正常，切换女生头像与北欧模板后刷新仍保留，未观察到控制台错误。
- 未添加站长模型 Key，未部署 PDF Worker，未购买域名或升级付费方案；使用免费 `.vercel.app` 子域名。真实 AI 调用、跨实例防滥用、手机端与各类导出仍需按下方清单分别验收，不能把此次冒烟视为全部功能验收。

本文平台说明在 2026-10-10 对照官方 [Next.js 部署](https://vercel.com/docs/frameworks/full-stack/nextjs)、[Node.js 版本](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)、[Hobby 范围](https://vercel.com/docs/plans/hobby) 核对。限额和方案可能变化，发布时仍需复核，不把固定免费额度写进产品承诺。

1. 先提交并整理当前本地改动，核对 GitHub 分支；不能只部署旧的远端 main 而漏掉本次功能。
2. 在自己的 Vercel 账户导入仓库，Framework 选择 Next.js，根目录为仓库根目录，Node.js 24，安装 `pnpm install --frozen-lockfile`，构建 `pnpm build`。
3. **不要上传 `.env.local`，不要在生产环境设置站长的任何模型 Key。** `.vercelignore` 额外排除了本地环境文件。生产 AI Route 强制要求请求自带 DeepSeek Key，即使误设 `AI_ALLOW_SERVER_KEY=true` 也不会回退到站长密钥。
4. 不配置 PDF Worker 时使用「导出 PDF → 系统打印 → 另存为 PDF」。Word、JSON 本地生成；PNG 仍依赖 Worker，不应宣传免费站已提供高保真 PNG。
5. 为 `/api/ai/resume` 配置平台防火墙/速率限制，设置可接受的使用预算并观察流量。应用的哈希 Key 频率限制和并发限制**仅针对单个运行实例**，不是分布式限流，不能承诺跨实例抵御滥用。可以先不公开 AI 路由，再完成限流验收。
6. 先发 Preview，再验收首次示例、旧草稿、多简历、照片、手机引导、JSON 往返、无 Key 拒绝请求、AI 密钥刷新清除及 PDF 打印；最后再公开 Production。

## 发布前可勾选清单

- [ ] `pnpm check:secrets`、`pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build` 全部通过。
- [ ] Git diff 中没有真实个人简历、API Key、`.env.local`、构建缓存或 `private-imports/`；已泄露过的 Key 在服务商撤销。
- [ ] README 六模板图片、Skill 整个目录和文档都进入待发布提交，图片相对链接可打开。
- [ ] 生产未配置站长 AI Key；无 Key 请求被拒绝，输入用户 Key 不写入持久存储。
- [ ] 新浏览器首次示例正常，已有草稿不会覆盖，导入 Skill 示例新增简历且旧稿可切回。
- [ ] 男女照片可切换；矩形照片、十二格与虚线辅助线正确；普通预览与 PDF 不含辅助线。
- [ ] 无 Worker 部署可系统打印；未部署 Worker 不宣传 PNG 或服务端高保真 PDF 已上线。
- [ ] 小屏幕可切编辑/预览，加载示例的取消/确认正常，本地备份能往返。
- [ ] 实际公网域名、隐私说明与失败反馈可用；线上冒烟完成后才把真实演示 URL 写进 README。

本地测试通过不等于线上验收完成。此清单仅用于验收，GitHub 提交和 Vercel 实际部署状态应分别核实。

Vercel Hobby 有资源额度及个人非商业使用限制，不是无限免费托管。商业引流/业务用途需对照官方政策判断，不能因为网站不收费就默认符合 Hobby 条件。参考 [Hobby 说明](https://vercel.com/docs/plans/hobby)。本次使用账户已有的 Hobby 方案；账户所有者仍应确认实际用途符合平台要求。

## 运行边界

发布前运行 `pnpm check:secrets`。CI 同样检查 Git 可见文件中的常见 API Key 格式与误跟踪的环境文件，只输出文件名、不输出疑似密钥。该启发式检查不能保证识别所有密钥；曾在聊天、日志或其他地方公开过的密钥应在服务商控制台撤销，而不是只删除代码。不要分发包含 `.next` 构建缓存的工作目录压缩包。

- API Key 只在页面内存中。每次请求通过 HTTPS 发送到本站后端后转发到 DeepSeek 官方接口，不写进本地简历、日志或数据库；但后端处理时能接触 Key，不能声称后端不可见。
- 只允许 DeepSeek 官方地址，当前不开放任意 Base URL。每个请求独立建立 Provider，不设置全局环境变量。
- AI 返回结构校验不等于事实正确；文字差异审阅也不等于验证经历。流式输出暂缓，保留完整响应、取消与确认采用。
- 本地简历库使用 IndexedDB，旧单草稿自动迁移但原始旧记录保留。未完成的字符串字段可保存；结构损坏时停止覆盖。多窗口检测到修订冲突时停止写入，提示先备份再刷新。
- 照片支持 JPG/PNG/WebP，最大 5 MB、解码后上限 2500 万像素，缩至最大边 512px 后重新编码；不提供 OCR。
- PDF Worker 为独立容器，需要单独部署、鉴权、并发资源预算及网络隔离；不能直接把未加固的 HTML 渲染服务公开。
- 清理浏览器、无痕窗口退出、设备故障或浏览器回收存储均可能丢数据。本地保存不是备份；导出的 JSON 包含个人资料，需妥善保存。

## 作者入口

首页和帮助提供 GitHub 作者关注与仓库 Star 链接，不埋追踪、不强制关注。若以后改为公众号等渠道，需要提供真实链接或二维码，再替换入口。
