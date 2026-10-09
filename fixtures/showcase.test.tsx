import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ResumeDocument } from "@/components/preview/resume-document";
import { TEMPLATES } from "@/components/templates/registry";
import { showcaseForTemplate } from "./showcase-resume";

it("builds six real, self-contained template documents for the README gallery", async () => {
  const renders = TEMPLATES.map((template) => ({
    template,
    html: renderToStaticMarkup(<ResumeDocument resume={showcaseForTemplate(template.id)} />),
  }));
  for (const { template, html } of renders) {
    expect(html).toContain(`data-template="${template.id}"`);
    expect(html).toContain("陈亦然");
    expect(html).toContain("data:image/jpeg;base64,");
  }
  // Explicit opt-in: ordinary test runs never write documentation assets.
  if (!process.env.SHOWCASE_OUTPUT) return;
  const out = resolve(process.env.SHOWCASE_OUTPUT);
  mkdirSync(out, { recursive: true });
  const require = createRequire(import.meta.url);
  const postcss = require(require.resolve("postcss", { paths: [resolve("node_modules/next")] }));
  const tailwind = require("@tailwindcss/postcss");
  const from = resolve("app/globals.css");
  const result = await postcss([tailwind()]).process(readFileSync(from, "utf8"), { from });
  writeFileSync(resolve(out, "styles.css"), result.css);
  const shell = (body: string, extra = "") =>
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ResumeCraft · 模板实拍</title><link rel="stylesheet" href="styles.css"><style>body{margin:0;background:#eef1ed;color:#213e38;font-family:Arial,'PingFang SC',sans-serif}.paper{width:794px;margin:24px auto;box-shadow:0 12px 40px #203c3812}.caption{width:794px;margin:26px auto 0;display:flex;justify-content:space-between;font-size:13px}.caption b{font-size:19px}${extra}</style><body>${body}</body></html>`;
  for (const { template, html } of renders)
    writeFileSync(
      resolve(out, `${template.id}.html`),
      shell(
        `<div class="caption"><b>${template.name}</b><span>ResumeCraft · 虚构示例 · A4 完整页</span></div><div class="paper">${html}</div>`,
      ),
    );
  const grid = renders
    .map(
      ({ template, html }, index) =>
        `<section><header><b>0${index + 1} / ${template.name}</b><small>${template.description}</small></header><div class="thumb"><div>${html}</div></div></section>`,
    )
    .join("");
  writeFileSync(
    resolve(out, "gallery.html"),
    shell(
      `<main><p class="eyebrow">RESUMECRAFT / TEMPLATE COLLECTION</p><h1>同一段经历，六种表达。</h1><p class="sub">结构化内容 · 可调排版 · 完整纸张预览</p><div class="gallery">${grid}</div><footer>所有资料与头像均为虚构示例 · 使用实际 ResumeDocument 渲染 · 可自由切换与撤销</footer></main>`,
      `main{width:1440px;margin:auto;padding:48px}.eyebrow{font-size:12px;letter-spacing:3px}h1{font-size:48px;font-weight:650;margin:16px 0}.sub{font-size:18px;color:#677b74;margin-bottom:32px}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 24px}.gallery header{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.gallery b{font-size:18px}.gallery small{font-size:12px;color:#677b74}.thumb{width:432px;height:611px;overflow:hidden;box-shadow:0 10px 25px #203c3815}.thumb>div{width:794px;transform:scale(.544);transform-origin:top left}footer{font-size:12px;color:#677b74;margin-top:32px}`,
    ),
  );
  const layoutHtml = renderToStaticMarkup(
    <ResumeDocument
      resume={showcaseForTemplate("modern")}
      renderBlock={({ id, children }) => (
        <div className="layout-section" data-layout-section={id}>
          {children}
        </div>
      )}
    />,
  );
  writeFileSync(
    resolve(out, "layout.html"),
    shell(
      `<div class="caption"><b>排版规则，看得见。</b><span>区块虚线 / 字段边界 / 12 格参考线</span></div><div class="paper layout-mode">${layoutHtml}</div>`,
    ),
  );
  writeFileSync(
    resolve(out, "workflow.html"),
    shell(
      `<main><p class="eyebrow">RESUMECRAFT / FROM FILE TO RESUME</p><h1>把已有经历，带进新的版式。</h1><p class="sub">保留事实，由你确认。不编造经历，不强制调用网站 AI。</p><div class="steps"><section><em>01</em><h2>交给导入 Skill</h2><p>提供自己的 PDF、Word、图片或文字。<br>AI 助手读取内容，标记识别疑点。</p><small>扫描件需要助手具备 OCR / 视觉能力</small></section><section><em>02</em><h2>核对，再导入</h2><p>生成本地 JSON 和待核对报告。<br>文件 → 导入 JSON，新建独立简历。</p><small>不覆盖旧稿，不猜日期，不补业绩</small></section><section><em>03</em><h2>排版与导出</h2><p>六套模板、十二格字段与虚线辅助。<br>选用 AI 审阅建议，最后确认导出。</p><small>编辑 / 系统打印 / Word / JSON 无需 Key</small></section></div><footer>流程示意 · Skill 运行在 AI 助手中，网站当前仅直接导入 JSON，并非内置 PDF/OCR 识别服务。</footer></main>`,
      `main{width:1440px;padding:56px}.eyebrow{font-size:13px;letter-spacing:3px}h1{font-size:46px;font-weight:650;margin:14px 0}.sub{font-size:20px;color:#677b74}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:42px 0}section{background:#fff;padding:30px;border:1px solid #dce5df;border-radius:16px}em{font-style:normal;font-size:42px;color:#a6bcb1}h2{font-size:25px;margin:20px 0}section p{font-size:17px;line-height:1.9}small{display:block;font-size:12px;color:#677b74;margin-top:28px}footer{font-size:13px;color:#677b74}`,
    ),
  );
}, 30000);
