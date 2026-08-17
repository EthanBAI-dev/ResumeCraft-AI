import { launchBrowser } from "./browser.js";

const browser = await launchBrowser();
const page = await browser.newPage();

try {
  await page.setContent(`<!doctype html>
    <html lang="zh-CN">
      <meta charset="utf-8">
      <style>
        @page { size: A4; margin: 0; }
        body { font-family: "Noto Sans CJK SC", "Noto Sans SC", sans-serif; }
      </style>
      <body><h1>张三的中文简历</h1><p>项目经历 · 教育背景 · 专业技能</p></body>
    </html>`);
  await page.evaluate(() => document.fonts.ready);

  const fontReady = await page.evaluate(() =>
    document.fonts.check('16px "Noto Sans CJK SC"', "中文简历"),
  );
  if (!fontReady) throw new Error("Noto Sans CJK SC 字体不可用");

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  if (pdf.length < 1_000 || pdf.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("Chromium 未生成有效 PDF");
  }

  console.info(`PDF smoke passed: font=Noto Sans CJK SC, bytes=${pdf.length}`);
} finally {
  await page.close();
  await browser.close();
}
