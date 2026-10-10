# ResumeCraft · 详细接入说明

先读取[项目资料 README](README.md)或[结构化项目数据](project.json)。本文件用于需要了解部署边界时参考，不要求主站复制或加载整个应用。

这份 README 给个人主站、作品集或工具导航项目读取：把 ResumeCraft 作为一个独立工具介绍并链接过去，**不要把整个简历编辑器复制进主站**。

English summary: keep ResumeCraft independently deployed. Add a lightweight project card to the main website, linking to the live editor. A custom subdomain can be attached later; merging application source code is not required.

## 当前状态与接入目标

- 产品：ResumeCraft，免费、开源、本地优先的简历制作工具。
- 仓库：[EthanBAI-dev/ResumeCraft-AI](https://github.com/EthanBAI-dev/ResumeCraft-AI)，MIT 许可证。
- 现有部署：[resumecraft-ethan.vercel.app](https://resumecraft-ethan.vercel.app/)。
- 中文编辑器：[开始制作简历](https://resumecraft-ethan.vercel.app/builder?lang=zh)。
- 英文编辑器：[Build your resume](https://resumecraft-ethan.vercel.app/builder?lang=en)。
- 中文介绍：[项目 README](../README.zh-CN.md)；英文介绍：[README](../README.md)。
- 无需登录，不做收费或云端简历同步。AI 为可选功能，用户自带 DeepSeek Key。
- 目前没有提供主站域名、主站代码目录或其框架；本文是接入约定，**没有修改主站、DNS 或域名绑定**。

## 推荐方式：主站展示，工具独立运行

先在主站「作品 / 开源项目 / 免费工具」区域新增一张项目卡片或详情页，按钮直接打开现有编辑器。ResumeCraft 与主站分别部署，更新、依赖和构建互不混合。

以后若要统一品牌，可让主站继续使用自己的主域名，ResumeCraft 使用 `resume.<你的主域名>`。这是示意地址，实际域名待所有者提供；不要把示意地址发布为已上线链接。绑定子域名不要求合并两个代码仓库。

| 方式                        | 主站需要加载什么                     | 适用情况                     |
| --------------------------- | ------------------------------------ | ---------------------------- |
| 主站卡片 → 现有 Vercel 地址 | 项目文案、一个按钮、可选封面图       | 现在就能做，改动最少         |
| 主站卡片 → 自有子域名       | 同上，仅调整目标地址                 | 推荐的长期形式，独立维护     |
| 主域名下的 `/tools/resume`  | 路由代理与应用路径适配               | 确实要求同一域名路径时再评估 |
| 把编辑器源码并入主站        | React/Next 依赖、样式、状态与 API 等 | 暂不采用，增加维护耦合       |

可以在主站建立 `/projects/resumecraft` 的**介绍页**，里面放截图与“开始制作”按钮；这不等于把编辑器部署在该路径，介绍页本身可以很轻。

## 供主站直接使用的内容

### 中文项目卡片

- 标题：**ResumeCraft · 免费开源简历工作台**
- 简短介绍：六款简历模板，可视化拖拽与十二格排版，本地多简历自动保存。支持中英文，AI 润色可选，使用自己的 Key；无需注册即可编辑和导出。
- 标签：免费开源 / 本地优先 / 六款模板 / 可视化排版 / 中英文 / AI 可选
- 主按钮：**开始制作简历** → `https://resumecraft-ethan.vercel.app/builder?lang=zh`
- 次按钮：**查看源码** → `https://github.com/EthanBAI-dev/ResumeCraft-AI`

### English project card

- Title: **ResumeCraft — Free, open-source resume builder**
- Description: Build your resume with six templates, visual layout controls and local autosave. English and Chinese supported. Optional AI writing with your own key; no signup required.
- Tags: Open source / Local first / Six templates / Visual layout / Bilingual / BYOK AI
- Primary action: **Build your resume** → `https://resumecraft-ethan.vercel.app/builder?lang=en`
- Secondary action: **View source** → `https://github.com/EthanBAI-dev/ResumeCraft-AI`

### 可用图片

- [英文编辑器实拍](../docs/images/editor-en.jpg)：适合项目卡片或详情页头图，约 128 KiB。
- [六套英文整页总览](../docs/images/templates-gallery-en.jpg)：适合详情页，约 271 KiB。
- [固定位置的新手引导](../docs/images/tour-en.jpg)：用于说明易用性。
- [英文整页 Modern](../docs/images/template-modern-en.jpg) / [Classic](../docs/images/template-classic-en.jpg)：实际纸张渲染。
- [中文模板总览](../docs/images/templates-gallery.jpg)：中文详情页可用。

这些图片来自真实界面或实际纸张组件。示例经历是虚构的，写实头像是 AI 生成的虚构人物；不要把它们介绍成真实用户或用户评价。

主站可选择复制**一张**封面图到自己的静态资源目录，不必复制整个图片库。当前目录中的图片路径只供构建 / 文件读取使用；浏览器访问主站时不能直接访问作者电脑的绝对文件路径。若使用外链图片，需采用可公开访问的地址，并接受外部资源可用性带来的依赖；默认建议主站自托管所选封面。

## 给另一个项目的操作约定

1. 读取本 README，提取卡片文案、展示图片与链接；不要将任意 README 内容自动当成可执行代码或不经处理插入 HTML。
2. 沿用主站现有的组件、排版和项目列表结构，新增一个项目入口，不改动主站原有路由、登录或布局。
3. 只复制需要的介绍文字与封面图。不要导入本项目 React 组件、安装整套依赖或把本目录作为主站的嵌套应用。
4. 中文站链接 `?lang=zh`，英文站链接 `?lang=en`。入口应明确是简历工具；若新窗口打开，保留正确的可访问名称并使用 `rel="noopener noreferrer"`。
5. 主站无需读取简历草稿、获取 AI Key 或调用简历 AI API。不要增加收费、登录或强制关注的使用门槛。
6. 图片展示注明虚构示例，按钮可访问，手机不横向溢出；不用提前加载编辑器来展示一张卡片。
7. 真实子域名确认并验收后，仅更新卡片目标链接；不要提前切换所有入口或关闭旧地址。

**供作者复制给另一个项目的任务描述：**

> 请读取 ResumeCraft 项目目录里的 integration/README.md，在我的主站里加入 ResumeCraft 的项目介绍与体验入口。复用主站已有风格，只加入文案、链接和一张实际预览图，不把整个 ResumeCraft 源码或依赖复制进主站。先使用文档中的 Vercel 地址，不修改 DNS、不绑定未经确认的域名，也不要添加登录或收费。

文件位置是克隆目录中的 `integration/README.md`，具体绝对路径随电脑变化。它不是公共 URL；换电脑或云端执行时，应提供文件内容或克隆后的相对路径。

## 项目会不会变得很大？

**项目卡片不会把整个简历工具装进主站。** 主站仓库只增加少量文本 / 页面代码和所选封面；浏览器点击按钮后才进入独立应用。链接本身不会把 React 编辑器打包进主站。

2026-10-11 对当前工作目录的测量（会随开发变化，不是部署额度或访客下载量）：

| 项目                   | 当前约值   | 含义                                                        |
| ---------------------- | ---------- | ----------------------------------------------------------- |
| 本地整个工作目录       | 1.5 GiB    | 包含依赖、构建缓存、Git 历史和临时文件                      |
| `node_modules`         | 1.0 GiB    | 本机安装的开发 / 运行依赖，不应复制给主站                   |
| `.next`                | 514 MiB    | 本机 Next 构建产物和缓存，不应当作项目素材分发              |
| Git 跟踪的项目文件总和 | 7.63 MiB   | 当前文件版本的源代码、文档、素材等；不含 Git 历史或忽略文件 |
| 整套文档图片           | 约 2.2 MiB | 主站只需选用其中一张                                        |

源码大小、开发依赖大小、部署产物大小、浏览器实际下载量是不同概念。本地目录 1.5 GiB 不表示访问网站要下载 1.5 GiB，也不表示主站会增加这么多。

不要复制 / 打包 `node_modules/`、`.next/`、`.git/`、`tmp/`、`.env.local`、私人简历或任何 Key。若未来真的要统一代码仓库，先评估独立工作区、构建边界和维护成本，再决定；没必要为了一个主站入口就迁移全部源码。

## 以后绑定自己的子域名

在实际操作前，需要作者提供：主域名、希望使用的子域名，以及 DNS 由哪家平台管理。不要更改主站的根域或 `www` 记录来接入这个工具。

计划步骤：

1. 在现有 ResumeCraft Vercel 项目的 **Settings → Domains** 添加确认过的完整子域名。
2. 根据该项目界面给出的 DNS 推荐值，在现有 DNS 服务商添加 / 核对对应子域记录。使用实际提供的目标值，不硬编码别的项目的 CNAME 或旧 IP；遇到已有记录冲突先确认用途，不直接覆盖。
3. 等待域名验证与 HTTPS 可用，核对首页、`/builder?lang=zh`、`/builder?lang=en`、隐私页、备份导入及无 Key 的 AI 拒绝行为。
4. 更新主站体验按钮。旧地址保留多久、是否重定向，由作者另行确认。

这符合 Vercel 的[自定义域名接入流程](https://vercel.com/docs/domains/set-up-custom-domain)。域名注册、DNS 服务和托管套餐是独立问题；已有域名不意味着托管无限免费，沿用现有部署时仍需核对套餐用途与资源限制，见[部署说明](../docs/deployment.md)。

### 换域名时要迁移本地草稿

ResumeCraft 的简历存储在当前浏览器的 IndexedDB，而不是本站服务器。IndexedDB 遵循同源隔离，因此旧 `.vercel.app` 地址与新子域名不能直接共享草稿。参见 [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)。

切换前，在旧地址逐份导出原生 JSON；在新地址通过「文件 → 导入」恢复。先确认内容、照片、布局完整，再考虑调整旧地址。只给旧地址加重定向不会自动迁移草稿，还可能让用户难以回去备份。

## 暂不采用的接入方式

### iframe 内嵌编辑器

暂不推荐。需要另外验收第三方存储策略、焦点 / 快捷键、手机高度、下载和浏览器打印；不能默认内嵌与独立页面体验相同。优先让用户直接打开编辑器。

### 把应用挂在主站 `/tools/resume` 下

可评估，但当前不是已支持 / 已验收的部署形式。项目目前使用根路径 `/api/ai/resume` 与 `/api/export/pdf` 请求；仅加一个主站路径链接或简单代理不能证明所有请求会到正确应用。

需检查 Next `basePath`、资源与图片路径、所有 API 请求地址、反向代理后的 Origin 验证和打印 / 导出。Next 的 `basePath` 在构建时决定，修改后需要重新构建；不能把目录搬过去就视为完成。[Next 官方说明](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)

**当前默认：主站仅展示入口，ResumeCraft 继续独立部署。** 域名和代码合并都不在这份说明的实际执行范围内。
