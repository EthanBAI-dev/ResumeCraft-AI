# Day 15 — PNG 与 JSON Resume 双向互转

日期：2026-08-17
阶段：P3（完成）

## 今天交付

- PNG 不再截图编辑器 DOM，而是复用最终 PDF 字节，通过 pdf.js 把第一页渲染为 2× PNG，确保它与 PDF 共享同一份分页和样式结果。
- 新增 JSON Resume 标准导出，覆盖 basics、work、education、projects、certificates、awards 与 skills 的可映射字段。
- 新增统一 JSON 导入：自动识别 ResumeCraft 原生备份或 JSON Resume，并经过现有 Zod Schema 与 layout 修复后再写入编辑器。
- 工具栏增加导入、JSON Resume 和 PNG 入口；DOCX 成功提示明确说明其目标是结构一致和可编辑，而不是像素一致。

## 决策

### PNG 从 PDF 渲染，而不是直接截 DOM

选 pdf.js 渲染 PDF 首页，因为 PDF 是导出的视觉真相，直接截 DOM 会额外引入设备缩放、滚动容器和编辑态样式三类变量。代价是 PNG 依赖 PDF Worker，Worker 未配置时不能像 PDF 一样回退到系统打印。

### JSON Resume 用标准字段 + 可选扩展实现无损往返

当前 JSON Resume canonical schema 明确允许额外属性。标准字段保证第三方主题和 CLI 可以读取，`x-resumecraft` 扩展则保留模板、layout、自定义区块和显示状态；重新导入本应用时优先读取扩展，扩展损坏或不存在时回退到标准字段映射。

## 踩坑

JSON Resume 接受完整 ISO 日期，例如 `1843-12-31`，ResumeCraft 编辑器只接受年或年月；直接写入会被本地 Schema 拒绝。导入层现在显式降精度到 `YYYY-MM`，而正在进行的 ResumeCraft 经历在标准导出中通过省略 `endDate` 表达，避免写出不符合官方日期规则的 `present`。

## 数据

- JSON Resume 原生无损往返、通用标准文件导入和自动格式识别共 3 项新增测试通过。
- PNG canvas 编码与倍率边界共 2 项新增测试通过。
- 全仓 12 个测试文件、86 项测试通过。
- 真实浏览器：PNG 首页成功下载、JSON Resume 成功下载，console error/warn = 0。

## 未解决 / 欠的债

- 浏览器自动化接口无法向系统文件选择器注入文件；文件解析与格式识别已由单元测试覆盖，导入按钮的系统选择器仍需保留一条手工回归用例。
- JSON Resume 中 ResumeCraft 暂无原生模型的 volunteer、publications、languages、interests 和 references 尚未映射为可编辑区块。

## 明日

- 进入 P4 Day 16：建立 AI Provider 抽象、统一超时/错误与用量计量边界。
