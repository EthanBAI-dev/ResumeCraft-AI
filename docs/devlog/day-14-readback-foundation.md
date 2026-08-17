# Day 14 — PDF 文本回读评分的纯算法层

日期：2026-08-17  
阶段：P3（进行中）

## 今天交付

- 定义 `collectResumeTextAnchors`：从同一份 resume schema 按 layout 阅读顺序收集用户可见文本。
- 定义 `evaluatePdfReadback`：输出覆盖率、阅读顺序分、缺失锚点与是否通过（覆盖率 ≥ 98%、顺序 ≥ 95%）。
- NFKC 归一化处理全角英文、空白和零宽字符，降低 PDF 解析器的格式噪声。

## 踩坑

完整文本第一次却只得到 95.45% 的顺序分。根因不是 PDF，而是锚点“Java”可能是“Java / Go / SQL”的子串；每个锚点从全文起点 `indexOf` 会把较短锚点错误定位到更早位置。改用单调前进的游标扫描，分离“是否出现”和“是否按阅读顺序出现”。

## 验证记录

- 完整样例：coverage = 1，orderScore = 1，passes = true。
- 删除邮箱并颠倒锚点：coverage < 1，orderScore < 0.95，passes = false。
- 3 个新增单测均通过。

## 下一步

将 Chromium 产出的 PDF 交给 pdf.js 提取文本，调用本算法返回可解释报告。
