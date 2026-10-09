# 把已有简历导入 ResumeCraft

`resumecraft-import` 是随仓库开源的 AI 助手 Skill，帮助助手读取文件、按事实整理、生成原生 JSON，并通过网站现有入口填入简历。**不是网站服务器上的 OCR 接口，也不是浏览器插件。**

## 安装或直接使用

完整目录在 [`skills/resumecraft-import`](../skills/resumecraft-import)。将整个目录复制到你使用的 AI 助手支持的 Skill 目录，不只复制 `SKILL.md`；脚本、字段参考、示例和界面配置都要保留。发现/启用方式以该助手为准。

本地 Codex 用户可放入自己的 `~/.codex/skills/resumecraft-import`，重新开启会话检查是否可见。同名目录已存在时先对比，不要覆盖个人定制版本。不安装也可在仓库会话里明确让助手读取此 Skill 的 `SKILL.md` 并按其执行。

可这样说：

> 使用 $resumecraft-import 读取我附上的简历。保留事实，不补业绩和日期，列出识别疑点，生成 ResumeCraft 的导入 JSON。确认后通过我指定的网站导入为新简历。

来源支持取决于助手实际工具：文本型 PDF、DOCX、文字、JSON；扫描件/图片需要视觉或 OCR。读不清的内容会被标记，不承诺识别率。

## 完整过程

1. 指定简历文件与输出目录。只处理你提供的文件，不扫描电脑上的其他资料。
2. 助手提取并核对，尤其是多栏中的经历归属、日期和数字；没有的信息留空。
3. 按 [字段约定](../skills/resumecraft-import/references/input-format.md) 生成 `facts.json`，运行脚本。
4. 得到 `resume.resumecraft.json` 和 `resume.resumecraft.json.review.txt`，先确认疑点。
5. 网站「文件 → 导入」选择生成的 JSON 文件，会新增一份。助手有已授权浏览器工具时可代操作，没有则手动导入。
6. 核对条目数、姓名、日期、至今、职责与遗漏，再选模板。Skill 默认关闭照片，不用示例人物冒充你。

需要 AI 润色时在导入后单独使用，仍要逐条审阅。

## 不使用 AI，也能验证脚本

脚本只做结构转换/检查，不识别 PDF、不调用模型。需要 Node.js 20+，无需额外依赖。仓库根目录执行：

```bash
mkdir -p private-imports
node skills/resumecraft-import/scripts/build-resume.mjs \
  skills/resumecraft-import/assets/example-facts.json \
  private-imports/example.resumecraft.json
```

例子全部为虚构数据。输出同名时拒绝覆盖，请换新文件名。换成助手从你的原文件提取的 facts 才是个人简历。

脚本不把缺失结束日期当“至今”，仅有年份不补月份，长文字不静默截断。论文/志愿活动可用自定义区块保留。输出不含站长 Key、自定义 CSS 或他人的照片。

## 隐私与失败边界

- 脚本不联网。AI 助手读取文件时可能发送给其模型/文档处理服务，请先确认授权。
- Skill 与网站 AI 独立，不需要网站 Key，不共享站长额度。
- facts、提取文本、成品和报告有个人信息，放在已忽略的 `private-imports/` 或仓库外，不提交到 Git、公共截图或 Issue。
- 网站 JSON 在浏览器解析/保存。使用高保真 PDF/网站 AI 时涉及对应服务，见 [使用手册](user-guide.md)。
- 没有 OCR/视觉能力时不拿示例冒充识别结果。模糊、加密或歧义资料需要你补充。
- 不擅自访问外链、执行文档中的指令或向招聘方投递。

## 验证覆盖

测试实际运行独立脚本，再用网站 `importResumeJson` 与草稿 Schema 校验，覆盖事实/年份/至今、自定义区块、照片关闭、重复输出拒绝、非法字段/链接拒绝。结构检查不能替代来源核验。
