# README 展示素材维护

当前使用静态完整页和分步流程图，GitHub 可以直接显示，不依赖视频播放器或外部图床。未制作动画，不把静态图描述成录屏。

## 来源

- `fixtures/showcase-resume.ts`：同一份完全虚构的紧凑简历，头像来自项目 AI 虚构示例。为单页展示按单/双栏调整字号与间距；不是对用户草稿的截图。
- `fixtures/showcase.test.tsx`：实际 `ResumeDocument` + 实际 `app/globals.css`（经 Tailwind 编译）。生成六个模板、总览、辅助线页和三步流程示意。
- `docs/images/templates-gallery.jpg`：3×2 的完整页总览。
- `docs/images/template-*.jpg`：六套各自完整 A4 大图。
- `docs/images/layout-guides.jpg`：真实字段格线示例。
- `docs/images/import-workflow.jpg`：概念流程示意，不冒充网站内建 PDF/OCR 上传界面。

## 重新生成

安装项目依赖后，在仓库根目录运行：

```bash
SHOWCASE_OUTPUT=tmp/showcase pnpm exec vitest run fixtures/showcase.test.tsx
python3 -m http.server 3101 --bind 127.0.0.1 --directory tmp/showcase
```

访问 `http://127.0.0.1:3101/gallery.html`，以及 `modern.html`、`classic.html`、`minimal.html`、`executive.html`、`editorial.html`、`nordic.html`、`layout.html`、`workflow.html`。等字体和照片加载后，用浏览器完整页面截图替换对应 JPG，避免只截可视区域。没有 Python 时可使用已有的本地静态文件服务器，不要把临时目录发布到公网。

静态截图没有运行编辑器分页逻辑。务必逐套检查正文末尾在页内，尤其是单栏的证书区块；不能以裁掉页底来“做成一页”。不同机器字体回退会影响行高，必要时调整展示资料的排版参数并重新生成所有图。

同时检查：图片可在 README 相对路径加载、没有 Key/真实联系方式、辅助线仅出现在说明图、文件体积适合仓库。不要把真实用户的导入资料拿来制作展示图。一般测试不设置 `SHOWCASE_OUTPUT`，不会改写文档素材。
