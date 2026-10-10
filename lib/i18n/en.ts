// Source phrases are stable keys. User-owned resume content is never translated.
export const en: Record<string, string> = Object.fromEntries(
  String.raw`
已停止生成，简历内容未变更。|Generation stopped. Your resume is unchanged.
不接受跨站请求|Cross-site requests are not accepted
请求体必须是 JSON|The request body must be JSON
AI 请求参数无效|Invalid AI request parameters
密钥或模型格式不正确|Invalid key or model format
请求较多，请稍后再试|Too many requests. Try again later.
AI 请求失败|AI request failed
AI 请求已取消|AI request canceled
AI 服务响应超时|The AI service timed out
AI Provider 凭据无效|Invalid AI provider credentials
AI Provider 请求过于频繁|AI provider rate limit reached
AI Provider 暂时不可用|The AI provider is temporarily unavailable
AI Provider 未返回可用内容|The AI provider returned no usable content
AI Provider 返回的数据不符合约定结构|The AI provider returned an invalid response structure
AI Provider 未返回可用对象|The AI provider returned no usable structured response
男生示例头像|Male sample portrait
女生示例头像|Female sample portrait
证书与奖项|Certificates & awards
自定义|Custom
隐藏|Hide
显示|Show
设置|Set
填写姓名|Add your name
目前姓名为空，阅读者无法确认这份简历属于谁。|Your name is empty, so readers cannot identify whose resume this is.
至少留一种联系方式|Add at least one contact method
邮箱和手机都为空，招聘方可能无法联系你。|Both email and phone are empty. Recruiters may not be able to reach you.
检查邮箱格式|Check your email address
邮箱格式看起来尚未填写完整，请核对。|The email address looks incomplete. Please review it.
可以补充求职方向|Consider adding a target role
明确的目标岗位能帮助阅读者理解你的经历，但不是必填项。|A clear target role helps readers understand your experience, but is optional.
替换或隐藏示例头像|Replace or hide the sample portrait
当前照片为虚构示例人物，不是你的证件照，正式投递前请替换或隐藏。|This is a fictional sample portrait, not your photo. Replace or hide it before applying.
检查是否仍在使用示例资料|Check for remaining sample details
联系方式含示例值，正式投递前请替换为你的资料。|Your contact information contains sample values. Replace them before applying.
{0}有空标题|{0} has an empty item title
这条经历还没有公司、学校或项目等名称，请补全或移除空条目。|This item has no company, school or project name. Complete it or remove it.
开始日期晚于结束日期|Start date is after end date
请核对「{0}」的经历时间。|Check the dates for “{0}”.
有较长的经历要点|A bullet is quite long
超过 180 字仅触发阅读长度提醒，不代表质量差；可按一个行动一个要点拆分。|Over 180 characters triggers a readability reminder, not a quality judgment. Consider one action per bullet.
这条经历还没有具体描述|This item has no description
可以补充你实际做了什么、使用的方法和已知结果。没有准确数字不需要编造。|Add what you actually did, how you did it and any known results. Do not invent numbers.
请先选择一条有内容的要点。|Select a non-empty bullet first.
请打开顶部「AI 设置」，输入自己的 DeepSeek API Key 后重试。|Open AI settings and enter your own DeepSeek API key, then try again.
生成失败，请稍后重试。|Generation failed. Please try again later.
AI 返回的内容格式不完整，请重新生成。|The AI response is incomplete. Generate again.
生成等待超时，请重试。|The request timed out. Please try again.
无法连接 AI 服务，请检查网络后重试。|Cannot connect to AI. Check your connection and try again.
原文已被修改或条目已删除。为保留最新内容，请重新生成建议。|The original was changed or removed. Generate new suggestions to preserve your latest edits.
已采用所选建议，可通过撤销恢复原文。|Selected suggestions applied. Undo to restore the original.
AI 建议已应用|AI suggestions applied
收起 AI 助手|Close AI assistant
AI 润色 / 生成要点|AI polish / generate bullets
AI 经历助手|AI writing assistant
把经历写得更有说服力|Make your experience clearer
仅发送选中的要点或你输入的经历、目标岗位和可选 JD 给所配置的 AI 服务。建议经你确认后才会写入。|Only selected bullets or your experience, target role and optional job description are sent to the AI provider. Nothing is applied without your confirmation.
AI 尚未配置。请在「AI 设置」中输入自己的 DeepSeek Key；编辑和导出无需密钥。|AI is not configured. Enter your own DeepSeek key in AI settings. Editing and exporting do not need a key.
打开 AI 设置|Open AI settings
润色已有要点|Polish existing bullets
从经历生成|Generate from experience
选择要润色的要点|Select bullets to polish
请先添加要点，或切换到从经历生成|Add a bullet first, or generate from experience
（空白要点）|(Empty bullet)
表达风格|Writing style
专业清晰|Clear and professional
简短精炼|Concise
突出贡献|Impact-focused
用自己的话描述经历|Describe your experience
做了什么、用到什么方法、产生了什么结果？没有准确数字可以先不填。|What did you do, how did you do it, and what changed? Leave out numbers you cannot verify.
针对岗位优化（可选）|Target role (optional)
岗位描述 JD|Job description
粘贴目标岗位描述，建议将优先突出相关经历|Paste the job description to prioritize relevant experience
正在生成建议…|Generating suggestions…
重新生成|Generate again
生成建议|Generate suggestions
停止生成|Stop generation
AI 建议审阅|Review AI suggestions
原文|Original
建议版本 · 勾选要采用的内容|Suggestions · select what to keep
采用建议 {0}|Accept suggestion {0}
补充这些事实，会更有说服力|Facts you could add
请核实内容，不要填入未经确认的数字。|Verify every claim. Do not use unconfirmed numbers.
查看文字修改 · 删除 / 新增|View changes · removed / added
采用所选建议|Apply selected suggestions
建议已放弃，原文未变更。|Suggestions discarded. The original is unchanged.
放弃|Discard
AI 设置 · 自带密钥|AI settings · bring your own key
编辑、检查和导出全部免费，不需要 API Key。AI 为可选功能，费用由你的 DeepSeek 账户承担，网站不提供公共模型额度。|Editing, checks and exports are free and do not need an API key. AI is optional and billed to your DeepSeek account. This website does not provide shared AI credits.
密钥仅保存在当前页面内存，刷新或关闭后清除，不进入简历备份。生成时，密钥和选定内容会经过本站后端转发到 DeepSeek 官方接口；后端不持久保存密钥。请只在信任的网站使用，勿在公共电脑输入。|Your key stays in page memory and is cleared on refresh or close. It is not included in backups. During generation, this site's backend forwards the key and selected content to the official DeepSeek API without persisting the key. Use only trusted deployments, not public computers.
输入自己的 API Key|Enter your own API key
模型 ID|Model ID
仅支持官方 DeepSeek 地址，不接受任意代理 URL。模型以你的账户支持情况为准。保存设置不会调用模型；点击生成才产生用量。|Only the official DeepSeek endpoint is supported, not custom proxies. Model availability depends on your account. Saving settings makes no model call; usage starts when you generate.
本次会话使用|Use for this session
清除密钥|Clear key
姓名|Name
张三|Alex Chen
求职意向 / 一句话标签|Headline / target role
后端工程师 · 3 年经验|Backend engineer · 3 years of experience
手机|Phone
邮箱|Email
城市|Location
杭州|Hangzhou
个人主页|Website
简历照片|Resume photo
显示照片|Show photo
选择示例头像|Choose a sample portrait
男生|Male
女生|Female
已选择 · AI 示例|Selected · AI sample
AI 示例 · 点击使用|AI sample · click to use
上传照片文件|Upload a photo file
照片已导入，仅保存在本地|Photo imported and stored locally
图片无法读取，请换一张图片|Cannot read this image. Try another file.
处理照片…|Processing photo…
上传照片|Upload photo
移除照片|Remove photo
AI 虚构示例，投递前请替换。实际效果见简历纸张。|Fictional AI portrait. Replace it before applying. See it on your resume.
已使用上传的照片，仅保存在本机。实际效果见简历纸张。|Your uploaded photo is stored locally. See it on your resume.
尚未添加照片，可选示例或上传自己的照片。|No photo yet. Choose a sample or upload your own.
JPG / PNG / WebP · 最大 5 MB · 竖版矩形 4:5|JPG / PNG / WebP · up to 5 MB · rectangular 4:5 portrait
照片宽度 ·|Photo width ·
照片大小|Photo size
其他联系方式（GitHub / 博客 …）|Other links (GitHub / blog …)
添加|Add
名称|Label
内容|Content
删除该联系方式|Remove this link
用顿号或逗号分隔|Separate with commas
思源黑体（推荐）|Noto Sans SC (Chinese)
思源宋体|Noto Serif SC
微软雅黑|Microsoft YaHei
Inter（英文简历）|Inter (recommended for English)
为你的经历，选一张好纸|Choose a look for your story
六套排版预设，内容完整保留。配色与字体仍可自由调整。|Six layout presets. Keep your content and customize colors and typography.
使用 {0} 模板：{1}|Use {0}: {1}
已选|Selected
主色|Accent color
主色 {0}|Accent color {0}
自定义主色|Custom accent color
字体|Font
正文字号|Body font size
行高|Line height
区块间距|Section spacing
页边距|Page margin
主栏宽度|Main column width
100% = 单栏布局|100% = single column
显示页码|Show page numbers
先把经历写进来|Start with your experience
左侧「内容」负责填写姓名、工作经历、项目和技能。展开对应区块即可编辑；右侧纸张会实时更新。草稿自动保存在当前浏览器。|Use Content on the left to enter your name, experience, projects and skills. Expand a section to edit it. The paper updates live, and drafts save automatically in this browser.
首次使用会自动打开含男生示例头像的简历，可在基本信息中切换女生头像，均为 AI 生成的虚构人物。旧草稿不会被覆盖。高亮的「载入示例」表示已载入，点一下收起提示；开始改写内容后高亮也会消失。|First visits open a sample resume with a fictional AI portrait. Choose another portrait under Personal details. Existing drafts are preserved. The highlighted Load sample button means the sample is loaded; click to dismiss, or start editing.
为简历挑一套版式|Choose your template
在「模板与样式」中比较六套模板，继续向下可调整配色、字体、字号、行高、区块间距、页边距和主栏宽度。|Compare six templates in Templates & style. Below them, adjust colors, fonts, font size, line height, spacing, margins and column width.
模板切换会重新安排区块与样式，保留内容；不满意可以撤销。|Switching templates rearranges sections and styling but preserves your content. Undo if you prefer the previous layout.
一行十二格，字段自己排|Arrange fields on a 12-column grid
展开「字段排版 · 12 格」，拖动公司、职位、日期等小卡片换位。− / + 调整每个字段占几格；一行总共十二格，放不下就自动换行。|Open Field layout · 12 columns. Drag company, role and date cards to reorder them. Use − / + to adjust each field's span. A row has 12 columns; fields that do not fit wrap automatically.
↵ 强制从新行开始，另有对齐和隐藏按钮。展开或修改排版会显示纸张辅助线：外框是区块、内框是字段、浅色竖线是十二格；悬停字段看占格和换行规则。点击「完成布局」收起，导出不带辅助线。此处控制同一区块所有条目。|↵ starts a new row. Other controls change alignment or visibility. Dashed outlines and faint grid lines appear on the paper while arranging fields. Hover for span and wrap rules. Done arranging hides guides; exports never include them. Settings apply to every item in this section.
移动整块内容，在纸张上操作|Move whole sections on the paper
开启「调整布局」后，纸上会显示虚线边框和六点手柄。按住手柄可调整工作经历、项目等整个区块的顺序，也可以跨栏或跨页移动。|Turn on Arrange layout to reveal dashed outlines and drag handles. Drag a handle to reorder an entire section or move it between columns and pages.
键盘操作：Tab 聚焦手柄，空格拾取，方向键移动，空格放下，Esc 取消。旁边的工具可缩放、适应宽度、增减页面。|Keyboard: Tab to a handle, Space to pick up, arrow keys to move, Space to drop, Esc to cancel. Nearby tools zoom, fit the paper and add or remove pages.
用 AI 打磨表达，再由你确认|Polish with AI, then review
先在顶部「AI 设置」填入自己的 DeepSeek Key，再打开经历下的 AI 助手润色或生成要点。对照原文、查看文字修改后再采用，也可取消和撤销。|Enter your own DeepSeek key in AI settings, then open the assistant below an experience item. Polish or generate bullets, compare with the original and accept only what you want. You can cancel or undo.
AI 是可选功能，费用由你的模型账户承担。Key 仅存于当前页面内存，生成时经本站后端转发到官方接口，不持久保存。编辑和导出无需 Key。|AI is optional and billed to your model account. The key lives only in page memory and is forwarded by the backend to the official API during generation. It is not persisted. Editing and exports need no key.
保存、导入与导出|Save, import and export
「文件」菜单提供 JSON 备份与导入、Word 和 PNG 导出。旁边的「导出 PDF」优先使用 PDF Worker，未配置时会打开系统打印。|Files includes JSON backup and import, Word and PNG export. Export PDF uses the PDF Worker when configured; otherwise it opens browser printing.
PNG 需要 PDF Worker。更换电脑或清理浏览器前，先导出 JSON 备份；本地自动保存不等于云端同步。|PNG requires a PDF Worker. Export JSON backups before changing computers or clearing browser data. Local autosave is not cloud sync.
忘了怎么操作？帮助一直在这里|Help is always here
顶部「帮助」按模块整理了使用说明。随时可以重看完整引导，或直接跳到你想了解的功能。|Open Help for instructions organized by feature. Restart this tour anytime, or jump to a specific feature.
现在就开始编辑吧。这次引导只切换界面，没有修改你的简历内容。网站免费，不需要注册或关注后才能导出。|You're ready to start. This tour only changed the view, not your resume. Editing and exporting are free, with no signup or follow requirement.
新手引导 ·|Quick tour ·
关闭新手引导|Close tour
引导步骤|Tour steps
第 {0} 步：{1}|Step {0}: {1}
跳过引导|Skip tour
上一步|Back
开始使用|Start editing
下一步|Next
用好你的简历工作台|Get to know your workspace
按模块查阅，或者跟着高亮提示走一遍。|Browse by feature or take a guided tour.
关闭帮助|Close help
重新开始新手引导|Restart the tour
带我看看|Show me
本地多简历与示例|Local resumes & samples
顶部「我的简历」可新建、重命名、复制、切换和删除。每份简历独立自动保存，切换后撤销历史重新开始。旧草稿会自动迁移；清理浏览器数据会丢失本地简历，请逐份导出 JSON。导入 JSON 会新建一份，不覆盖正在编辑的简历。|My resumes lets you create, rename, duplicate, switch and delete resumes. Each saves independently; switching starts a new undo history. Older drafts migrate automatically. Clearing browser data removes local resumes, so back up each as JSON. Import creates a new resume without overwriting the current one.
再次「载入示例」会先确认，可取消、替换当前简历（可撤销），或新建一份示例。基本信息内的「上传照片」支持 JPG/PNG/WebP，最大 5 MB，图片在本机压缩保存；可一键选择男生或女生 AI 示例头像，首次载入示例默认男生。照片统一为 4:5 竖版直角矩形，实际效果直接在简历纸张中查看，可调整宽度。示例照片请在投递前替换或隐藏，不支持图片识别成简历。|Load sample asks for confirmation: cancel, replace the current resume (undoable), or create a separate sample. Personal details accepts JPG/PNG/WebP up to 5 MB, compressed locally. Male and female fictional AI portraits are available. Photos use a rectangular 4:5 crop with adjustable width; see the result on the paper. Replace or hide sample photos before applying. This upload is not resume OCR.
已有 PDF / Word 简历？使用导入 Skill|Have a PDF or Word resume? Use the import Skill
开源仓库提供 resumecraft-import Skill。将文件交给支持 Skill 的 AI 助手，核对提取结果后生成 ResumeCraft JSON，再从「文件 → 导入」新建简历。 网站本身不直接识别 PDF、Word 或图片；扫描件需助手具备 OCR / 视觉能力。不要把 Key 或真实简历放进公开 Issue。|The repository includes the resumecraft-import Skill. Give your resume to a compatible AI assistant, verify extracted facts, then generate ResumeCraft JSON and import via Files → Import. The website does not directly parse PDF, Word or images. Scans need OCR or vision support in your assistant. Never post keys or real resumes in public issues.
投递前检查，不是招聘评分|Pre-flight checks, not hiring scores
只核对空字段、联系方式、示例资料、时间顺序和较长描述等可解释规则。可手动输入岗位关键词做文本核对，不打总分、不保证 ATS 通过率、不预测录用。数据只在浏览器内处理。|Checks flag empty fields, contact details, sample data, dates and long descriptions using transparent local rules. Enter job keywords for literal text matching. No overall score, ATS pass-rate promise or hiring prediction. All checks run in your browser.
两种布局，不是同一个开关|Two layout tools, two different jobs
纸张上的「调整布局」移动整个区块；左侧每个区块的「字段排版 · 12 格」调整内部字段。十二格设置对同一区块的所有条目生效。行高自动适应内容，文字行距在「模板与样式 → 行高」中设置。|Arrange layout on the paper moves whole sections. Field layout · 12 columns on the left arranges fields within a section and applies to all its items. Rows grow with content; adjust text line height under Templates & style.
Ctrl / ⌘ + Z 撤销；加 Shift 重做。AI 可使用自带密钥；高保真导出需要 PDF Worker，未配置时 PDF 使用系统打印、PNG 暂不可用。浏览器本地草稿请定期导出备份。|Ctrl / ⌘ + Z undoes; add Shift to redo. AI uses your own key. High-fidelity export needs a PDF Worker; without one, PDF uses browser printing and PNG is unavailable. Back up local drafts regularly.
喜欢这个免费工具？|Enjoy this free tool?
在 GitHub 关注作者|Follow the author on GitHub
，或给项目一个 Star。完全自愿，不影响任何编辑和导出功能。|, or star the project. Entirely optional—editing and exports are never gated.
让经历，被看见。|Let your experience speak.
打磨内容，选择版式，准备下一次机会。|Polish your story. Choose a layout. Get ready for what's next.
模板与样式|Templates & style
基本信息|Personal details
添加区块|Add section
隐藏{0}|Hide {0}
显示{0}|Show {0}
删除{0}|Delete {0}
{0}{1}|{0} {1}
紧凑一行|Compact
标准两行|Two rows
纵向堆叠|Stacked
字段排版 · 12 格|Field layout · 12 columns
点击展开 / 收起|Expand / collapse
拖动字段换位，使用 − / + 调宽；纸张同步显示虚线和 12 格辅助线。空内容和隐藏字段不占空间，点击「完成布局」可收起辅助线。|Drag fields to reorder; use − / + to change width. Dashed outlines and 12-column guides appear on the paper. Empty or hidden fields use no space. Done arranging hides the guides.
套用{0}预设|Apply {0} preset
开始移动字段|Picked up field
已找到字段位置|Field position found
未找到字段位置|No field position found
字段已移动|Field moved
已取消移动|Move canceled
移动字段|Move field
↵ = 强制换行|↵ = start a new row
数字 = 占用格数|Number = column span
眼睛 = 仅隐藏呈现|Eye = hide from paper
拖动{0}|Drag {0}
拖动换位；键盘可用空格键拾取|Drag to reorder; press Space to pick up with the keyboard
{0}占用格数|{0} column span
减少{0}宽度|Decrease {0} width
占用格数|Column span
增加{0}宽度|Increase {0} width
{0}{1}强制换行|{0} forced new row for {1}
切换{0}对齐方式，当前{1}|Change {0} alignment; currently {1}
关闭{0}|Close {0}
投递前检查|Pre-flight check
这是本地规则检查，不是招聘评价或 ATS 通过率。不打总分、不预测录用，也不会为了“量化”要求你编造数字。所有检查都在浏览器中完成。|These are local rules, not a hiring assessment or ATS pass-rate estimate. There is no total score or hiring prediction, and you should never invent metrics. All checks run in your browser.
{0} 项值得核对|{0} things to review
未发现当前规则覆盖的问题；不代表简历内容或投递效果已被验证。|No issues found by these rules. This does not validate your claims or predict application outcomes.
建议 · |Tip ·
核对 · |Check ·
去查看|View
岗位关键词核对（可选）|Job keyword check (optional)
自己从岗位描述中挑出关键词，用逗号分隔，例如 Java、MySQL、项目管理|Choose keywords from a job description, separated by commas, e.g. Java, MySQL, project management
最多 20 项，仅检查可见区块内容中是否出现文本，不做语义匹配或判断能力。未出现不等于不具备，不要为匹配而堆词。|Up to 20 terms. Only literal text in visible sections is checked—not meaning or competence. A missing term does not mean a missing skill. Avoid keyword stuffing.
出现过|Found
未找到|Not found
操作失败，数据未清除|Operation failed. Your data was not cleared.
我的简历|My resumes
免费使用，无需登录。简历仅保存在当前浏览器，不会跨设备同步；清理浏览器前请逐份导出 JSON 备份。|Free, no login. Resumes stay in this browser, with no cross-device sync. Export each as a JSON backup before clearing browser data.
新建空白简历|New blank resume
简历名称|Resume name
 · 当前编辑| · currently editing
简历名称 {0}|Resume name {0}
尚未填写姓名|No name yet
打开|Open
{0} · 副本|{0} · copy
复制|Duplicate
删除|Delete
删除「|Deleting “
」后不能撤销。请先导出 JSON 备份。|” cannot be undone. Export a JSON backup first.
确认删除|Confirm deletion
取消|Cancel
区块标题|Section title
3 年后端开发经验，专注高并发交易系统……|Backend engineer with 3 years of experience building high-throughput systems…
添加一条|Add item
未命名条目 {0}|Untitled item {0}
隐藏该条目|Hide item
显示该条目|Show item
上移|Move up
下移|Move down
复制该条目|Duplicate item
删除该条目|Delete item
格式 2024 或 2024-06|Use 2024 or 2024-06
留空表示至今|Leave blank for Present
经历描述（每条一个要点）|Experience bullets
添加要点|Add bullet
第 {0} 条要点|Bullet {0}
用「动词 + 做了什么 + 量化结果」的结构写，例如：主导支付链路重构，将对账差异率从 0.3% 降至 0.002%|Try action + what you did + verified impact. Example: Redesigned payment reconciliation, reducing discrepancies from 0.3% to 0.002%.
删除第 {0} 条要点|Delete bullet {0}
撤销|Undo
重做|Redo
用示例数据填充，方便快速看效果|Load sample content to try the editor
载入示例|Load sample
示例已载入 · 点击收起提示|Sample loaded · dismiss
载入示例？|Load a sample?
替换当前简历会清空当前填写内容、照片和排版，改为示例数据；本次替换可撤销。其他简历不会受影响。|Replacing the current resume replaces its content, photo and layout with sample data. This can be undone. Other resumes are unaffected.
也可以新建一份示例，保留当前简历。|Or create a separate sample to keep your current resume.
示例简历|Sample resume
保存失败，请先导出备份|Save failed. Export a backup first.
新建一份示例|Create a separate sample
确认替换当前简历|Replace current resume
按键 → 预览重绘完成的端到端延迟（ADR-005 预算：P95 < 100ms）|Keystroke-to-preview latency (ADR-005 target: P95 < 100ms)
AI 设置|AI settings
帮助|Help
文件|Files
导入简历|Imported resume
ResumeCraft 备份已导入|ResumeCraft backup imported
JSON Resume 已导入|JSON Resume imported
JSON 导入失败，请检查文件格式|JSON import failed. Check the file format.
导入 ResumeCraft 备份或标准 JSON Resume|Import a ResumeCraft backup or standard JSON Resume
导入|Import
JSON 备份已开始下载|JSON backup download started
JSON Resume 已开始下载|JSON Resume download started
导出 JSON Resume 标准格式|Export standard JSON Resume
正在生成可编辑 DOCX…|Creating editable DOCX…
DOCX 已开始下载|DOCX download started
DOCX 保持内容结构与可编辑性，不保证与 PDF 像素一致|DOCX preserves structure and editability, not pixel-identical PDF styling
DOCX 生成失败，请重试|DOCX generation failed. Try again.
正在从 PDF 渲染首页 PNG…|Rendering the first PDF page as PNG…
PNG 首页已开始下载|First-page PNG download started
PDF Worker 正在处理较多请求，请稍后重试|The PDF Worker is busy. Try again later.
PNG 导出需要配置 PDF Worker|PNG export requires a configured PDF Worker
PNG 生成失败，请重试|PNG generation failed. Try again.
从最终 PDF 的第一页生成 PNG|Create a PNG from the first page of the final PDF
正在生成高保真 PDF…|Creating high-fidelity PDF…
PDF 已开始下载；文本检测暂不可用|PDF download started; text validation is unavailable
PDF 已开始下载；文本可读性 {0}%|PDF download started; text coverage {0}%
PDF 已开始下载；检测到 {0} 项文本可能无法被 ATS 读取|PDF download started; {0} text items may not be machine-readable
PDF 已开始下载；文本完整，但阅读顺序可能异常|PDF download started; text is complete but reading order may differ
缺失示例：{0}|Missing text example: {0}
阅读顺序得分：{0}%|Reading-order match: {0}%
PDF Worker 尚未配置，已打开系统打印|No PDF Worker configured. Browser printing opened.
PDF 生成失败，已打开系统打印|PDF generation failed. Browser printing opened.
优先使用高保真 PDF Worker；未配置时回退到系统打印|Use the PDF Worker if configured; otherwise use browser printing
导出 PDF|Export PDF
读取草稿…|Loading draft…
保存中…|Saving…
已保存 {0}|Saved {0}
已保存|Saved
保存失败|Save failed
完成布局|Done arranging
调整布局|Arrange layout
缩小|Zoom out
放大|Zoom in
适应宽度|Fit width
在末尾添加空白页|Add a blank page
移除末页并合并内容|Remove last page and merge its content
第|Page
页内容超出|content overflows
页 · 实时预览|pages · live preview
外层虚线 = 区块，内层虚线 = 字段，浅色竖线 = 12 格。悬停字段查看占格数与 ↵ 换行规则。 拖动六点手柄可移动区块；在「字段排版 · 12 格」中调整字段。辅助线不参与排版，也不会导出。|Outer dashed lines show sections, inner lines show fields, and faint vertical lines show 12 columns. Hover for span and ↵ wrap rules. Drag handles move sections; Field layout · 12 columns arranges fields. Guides do not affect layout or exports.
页有单一区块高于可用纸面，无法在区块中间自动断开； 请缩短该区块或调小字号/页边距。|contains a section taller than the usable paper. Sections cannot split automatically; shorten it or reduce font size or margins.
开始移动 {0}|Picked up {0}
已找到可放置位置|Drop position found
未找到可放置位置|No drop position found
区块已移动|Section moved
移动区块|Move section
拖动区块 {0}|Drag section {0}
拖动排序；键盘可用空格键拾取|Drag to reorder; press Space to pick up with the keyboard
当前内容仍可通过「文件 → JSON」备份。|You can still back up the current content via Files → JSON.
编辑器视图|Editor view
编辑内容|Edit content
纸张预览|Paper preview
正在读取本地简历…|Loading local resumes…
约束式可视化编辑|Design without guesswork
六套专业版式，搭配字体、配色和区块拖拽。屏幕预览与 PDF 共用一份纸张样式。|Six professional templates, custom typography and colors, and draggable sections. Preview and PDF share the same paper styles.
AI 直出结构化内容|AI writing, on your terms
自带 DeepSeek Key，润色已有要点或从经历生成建议。对照修改、勾选采用，可随时撤销。不使用 AI 也能免费编辑导出。|Bring your own DeepSeek key to polish bullets or draft suggestions. Review changes, select what to keep and undo anytime. Editing and exporting remain free without AI.
导出即校验|Export with confidence
支持 PDF、Word 和 JSON。配置 PDF Worker 后，还可导出 PNG 并检查 PDF 的文本覆盖率与阅读顺序。|Export PDF, Word and JSON. Add a PDF Worker for PNG exports and checks of PDF text coverage and reading order.
本地优先 · 开源简历工作台|Local-first · open-source resume workspace
好的经历，|Your experience
值得一份|deserves a
好简历。|great resume.
从第一段经历，到下一次机会。用清晰的表达与克制的设计，让你的专业被看见。|From your first role to your next opportunity. Tell your story with clear writing and thoughtful design.
开始编辑|Start building
查看源码|View source
免费使用，无需注册 · 本地多简历 · 六套模板 · 不强制关注|Free, no signup · multiple local resumes · six templates · no follow gate
商务模板示例|Executive template example
你的内容，专业呈现。|Your story, professionally presented.
编辑数据默认保存在浏览器。主动使用 AI 时，选定内容会发送给你配置的 AI 服务。高保真导出会发送简历到你配置的 PDF Worker。|Drafts stay in your browser. Using AI sends selected content to the configured provider. High-fidelity export sends your resume to the configured PDF Worker.
觉得有帮助？欢迎关注作者，获取后续更新。|Found it useful? Follow the author for updates.
关注作者|Follow the author
给项目 Star|Star the project
隐私与本地数据说明|Privacy & local data
返回编辑器|Back to the editor
免费、本地优先|Free and local-first
无需注册、付费或关注作者即可使用编辑与导出。简历库和导入照片存于当前浏览器的 IndexedDB，不提供云端同步。清除站点数据、无痕会话结束或存储回收可能导致丢失，请定期逐份导出 JSON 备份。删除简历需要确认，删除后不能撤销。|No signup, payment or follow is required to edit or export. Resumes and uploaded photos are stored in this browser's IndexedDB, without cloud sync. Clearing site data, ending a private session or storage eviction can remove them. Export each resume as JSON regularly. Deletion requires confirmation and cannot be undone.
可选 AI|Optional AI
使用自己的 DeepSeek API Key，模型费用由你的账户承担。Key 只放在当前页面内存，刷新后清除，不包含在简历、IndexedDB 或导出文件中。点击生成时，Key、所选内容、目标岗位和可选 JD 会经本站后端转发到 DeepSeek 官方接口；应用不持久保存密钥，不记录正文或密钥日志。请自行了解模型服务商的数据政策。本站后端仍会在处理请求时接触密钥，并非端到端不可见。|Use your own DeepSeek API key; model costs are billed to your account. The key lives only in page memory, clears on refresh and is excluded from resumes, IndexedDB and exports. When you generate, the backend forwards the key, selected content, target role and optional job description to the official DeepSeek API. The application does not persist keys or log keys or resume text. Review the provider's data policy. This site's backend does handle the key during the request; it is not end-to-end secret from the server.
照片、检查与导出|Photos, checks and exports
上传照片在浏览器内解码、压缩；虚构示意头像仅用于预览。投递前检查使用本地规则，不打招聘分、不预测 ATS 通过率。Word、JSON 和系统打印在本机完成。若自托管者配置了 PDF Worker，高保真 PDF/PNG 会把简历 HTML（含照片）发送到该 Worker。JSON 备份含完整个人资料，请妥善保管。|Photos are decoded and compressed in your browser. Fictional sample portraits are for previews only. Pre-flight checks use local rules, not hiring scores or ATS pass-rate predictions. Word, JSON and browser printing run locally. If the host configures a PDF Worker, high-fidelity PDF/PNG sends resume HTML, including photos, to that Worker. JSON backups contain your full personal details; keep them private.
托管与外部链接|Hosting and external links
托管平台可能处理请求 IP、时间和常规访问日志。关注作者与 Star 均为自愿，不会阻止导出。打开外部链接或加载导入文件中的远程照片时，相关站点可能获得请求信息；优先使用本地上传照片。|The hosting platform may process IP addresses, request times and standard access logs. Following or starring is optional and never blocks exports. External links or remote photos in imported files can send request information to those sites. Prefer locally uploaded photos.
公司|Company
某科技有限公司|Example Technologies
职位|Role
后端开发工程师|Backend engineer
开始时间|Start date
结束时间|End date
2025-06 或留空|2025-06 or leave blank
链接|Link
一句话概述|Short summary
技术栈|Tech stack
项目名称|Project name
分布式任务调度平台|Distributed task scheduler
担任角色|Your role
核心开发|Core developer
仓库|Repository
线上地址|Live URL
学校|School
某大学|Example University
专业|Major
计算机科学与技术|Computer Science
学历|Degree
本科 / 硕士|Bachelor's / Master's
入学时间|Start date
毕业时间|Graduation date
成绩 / 排名|Grade / ranking
GPA 3.7/4.0，专业前 10%|GPA 3.7/4.0 · top 10%
分类|Category
语言 / 框架 / 中间件|Languages / frameworks / tools
关键词|Keywords
ICPC 区域赛银奖|ICPC regional silver medal
颁发机构|Issuer
时间|Date
备注|Notes
标题|Title
副标题|Subtitle
描述|Description
现代 · Modern|Modern
清晰双栏 · 技术与产品|Crisp two-column · tech & product
经典 · Classic|Classic
居中抬头 · 正式与通用|Centered header · timeless & formal
留白 · Minimal|Minimal
纯粹单栏 · 简洁与克制|Single column · clean & restrained
商务 · Executive|Executive
深蓝题头 · 管理与咨询|Navy header · management & consulting
刊物 · Editorial|Editorial
宋体标题 · 设计与内容|Serif headings · design & content
北欧 · Nordic|Nordic
鼠尾草绿 · 轻盈双栏|Sage green · airy two-column
照片|Photo
求职标签|Headline
其他联系方式|Other links
职位与地点|Role & location
日期|Dates
简介|Summary
经历要点|Experience bullets
技术标签|Tech tags
角色与链接|Role & links
项目要点|Project bullets
学位、专业与地点|Degree, major & location
成绩|Grade
补充说明|Additional details
证书名称|Certificate name
说明|Notes
正文|Body
要点|Bullets
个人简介|Summary
工作经历|Experience
项目经历|Projects
教育经历|Education
专业技能|Skills
技能|Skills
证书 / 奖项|Certificates / awards
证书奖项|Certificates / awards
自定义区块|Custom section
收起|Collapse
展开|Expand
开启|Enable
左|left
中|center
右|right
未命名简历|Untitled resume
我的简历|My resumes
本地简历库格式异常，原始数据已保留，请勿清除浏览器数据。|Invalid local library. Original data is preserved; do not clear browser data.
本地简历库条目异常，原始数据已保留。|Invalid library entry. Original data is preserved.
本地简历库当前条目不存在，原始数据已保留。|The active resume is missing. Original data is preserved.
另一个窗口已初始化简历库，请刷新。|Another window initialized the library. Please refresh.
无法读取浏览器存储，请检查隐私模式或存储权限。|Cannot read browser storage. Check private browsing or storage permissions.
其他窗口更新了简历库。请先导出当前 JSON 备份，再刷新；已停止写入以避免覆盖。|Another window updated the library. Export the current JSON backup, then refresh. Writes stopped to avoid overwriting data.
本地保存失败，请先导出 JSON 备份。|Local save failed. Export a JSON backup first.
`
    .trim()
    .split("\n")
    .map((line) => {
      const i = line.indexOf("|");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
