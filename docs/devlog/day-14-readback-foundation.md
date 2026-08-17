# Day 14 — PDF 文本回读自检

日期：2026-08-17  
阶段：P3（完成）

## 今天交付

- 定义 `collectResumeTextAnchors`：从同一份 resume schema 按 layout 阅读顺序收集用户可见文本。
- 定义 `evaluatePdfReadback`：输出覆盖率、阅读顺序分、缺失锚点与是否通过（覆盖率 ≥ 98%、顺序 ≥ 95%）。
- NFKC 归一化处理全角英文、空白和零宽字符，降低 PDF 解析器的格式噪声。
- 浏览器端用 `pdfjs-dist` 回读刚刚下载的同一份 PDF 字节，并在工具栏显示 ATS 文本覆盖率或可解释的缺失/顺序警告。
- 回读解析失败只降级为“检测暂不可用”，不阻断已经生成成功的 PDF 下载。

## 踩坑

完整文本第一次却只得到 95.45% 的顺序分。根因不是 PDF，而是锚点“Java”可能是“Java / Go / SQL”的子串；每个锚点从全文起点 `indexOf` 会把较短锚点错误定位到更早位置。改用单调前进的游标扫描，分离“是否出现”和“是否按阅读顺序出现”。

接入真实 Chromium PDF 后又遇到三类只在端到端链路出现的问题：

- 直接导入 pdf.js legacy 入口时浏览器没有 Worker 配置；改用其 webpack 入口，让解析 Worker 作为独立资源打包。
- Chromium 会把带字距的中文标题回读成带空格的字符；归一化时只折叠相邻汉字间的人工空白，避免破坏英文词边界。
- Schema 中的原始日期（`2023-07`、`present`）和纸面显示值（`2023.07`、`至今`）不同，且个人信息在双栏布局中并不固定居首；锚点必须复用显示格式并严格遵循 layout 顺序，否则会产生假阴性。

## 验证记录

- 完整样例：coverage = 1，orderScore = 1，passes = true。
- 删除邮箱并颠倒锚点：coverage < 1，orderScore < 0.95，passes = false。
- 真实页面点击导出：Chromium 返回 PDF，pdf.js 回读完成，UI 显示“文本可读性 100%”，浏览器无错误或警告。
- 全仓 10 个测试文件、80 项测试通过；TypeScript、ESLint、生产构建与格式检查通过。

## 下一步

补齐三套模板 × 三种内容长度的 PDF 回归夹具，并进入 Day 15 的 PNG / JSON Resume 互转。
