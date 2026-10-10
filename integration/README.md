# ResumeCraft · Main-site project kit

Ready-to-use project descriptions, preview assets and live links for a portfolio or tool directory. English is primary; Chinese copy and entry points are included below.

**[English website →](https://resumecraft-ethan.vercel.app/?lang=en)** · **[中文网站 →](https://resumecraft-ethan.vercel.app/?lang=zh)**

This is a lightweight project listing kit, not an application to install inside the main site. Read [project.json](project.json) for structured data, or use the copy below. ResumeCraft remains independently deployed.

## English listing

**Title:** ResumeCraft — Free, open-source resume builder

**Description:** Create your resume with six templates, visual drag-and-drop layout controls and a 12-column field grid. Save multiple drafts locally, switch between English and Chinese, and optionally polish your writing with your own DeepSeek key. No signup required.

**Tags:** Open source · Local first · Six templates · Visual layout · Bilingual · Optional AI

**Main button:** [Build your resume](https://resumecraft-ethan.vercel.app/builder?lang=en)

**Source button:** [View source](https://github.com/EthanBAI-dev/ResumeCraft-AI)

**Documentation:** [English README](../README.md)

## 中文项目介绍

**标题：** ResumeCraft · 免费开源简历工作台

**介绍：** 六款简历模板，支持区块拖拽与十二格字段排版，多份简历在浏览器本地自动保存。支持中英文，可选 AI 润色并使用自己的 DeepSeek Key，无需注册即可使用。

**标签：** 免费开源 · 本地优先 · 六款模板 · 可视化排版 · 中英文 · AI 可选

**主按钮：** [开始制作简历](https://resumecraft-ethan.vercel.app/builder?lang=zh)

**源码按钮：** [查看源码](https://github.com/EthanBAI-dev/ResumeCraft-AI)

**文档：** [中文 README](../README.zh-CN.md)

## Preview assets / 配图

Use one cover image for a project card; the full gallery is optional for a detail page. These are actual UI screenshots or real template renders. The sample people and resume facts are fictional, with AI-generated realistic portraits.

| Asset                            | Repository file                                                                 | Public image                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Editor cover / 编辑器封面        | [docs/images/editor-en.jpg](../docs/images/editor-en.jpg)                       | [Image URL](https://raw.githubusercontent.com/EthanBAI-dev/ResumeCraft-AI/main/docs/images/editor-en.jpg)            |
| English templates / 英文模板总览 | [docs/images/templates-gallery-en.jpg](../docs/images/templates-gallery-en.jpg) | [Image URL](https://raw.githubusercontent.com/EthanBAI-dev/ResumeCraft-AI/main/docs/images/templates-gallery-en.jpg) |
| Chinese templates / 中文模板总览 | [docs/images/templates-gallery.jpg](../docs/images/templates-gallery.jpg)       | [Image URL](https://raw.githubusercontent.com/EthanBAI-dev/ResumeCraft-AI/main/docs/images/templates-gallery.jpg)    |

The `repositoryPath` values in [project.json](project.json) are relative to the ResumeCraft repository root, not this folder. Copy the chosen image into the main site's own assets, or use the public URL if the main site permits external images. Local disk paths are not website image URLs.

## Facts to preserve / 介绍时请保留的边界

- MIT-licensed, free and open source. No subscription, login or mandatory follow gate.
- Drafts and photos save in the user's browser. No cloud resume synchronization.
- AI is optional; usage is billed to the user's own model account. No shared owner key or free model quota.
- The public deployment supports Word/JSON and browser-print PDF. PNG and server-rendered PDF require an additional PDF Worker, which is not currently part of the public demo.
- Existing resumes are not automatically translated by switching the interface language.
- Do not present fictional sample resumes as real users or testimonials.

## How another project uses this folder

1. Read this README or `integration/project.json` for the project information; default to the English listing and use the Chinese listing for Chinese pages.
2. Add a card or introduction page in the main site's existing style, using a preview, description and link buttons. Do not bundle the resume editor or its dependencies into the main site.
3. Use the exact live URLs above. Language entry links explicitly include `?lang=en` or `?lang=zh`.
4. No API integration, API Key, login integration or DNS change is needed to add the links. A future custom subdomain requires a separate confirmed task.

**给另一个项目的任务：**

> 请读取 ResumeCraft 文件夹中的 integration/README.md 和 integration/project.json，在我的主站里制作这个项目的介绍卡片或详情页。英文为主要内容，提供中文介绍和中英文体验按钮；使用里面的真实网站地址及配图。只做展示和跳转，不复制整个简历应用、不接入 AI Key、不修改域名。

For domain setup and size explanations, see [the detailed integration notes (Chinese)](SETUP.zh-CN.md).
