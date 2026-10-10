import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ResumeDocument } from "@/components/preview/resume-document";
import { TEMPLATES } from "@/components/templates/registry";
import { parseDraft } from "@/lib/schema/draft";
import { en } from "@/lib/i18n/en";
import { englishShowcaseForTemplate } from "./english-showcase-resume";

it("renders six genuine English A4 template previews for the README", async () => {
  const fixtures = TEMPLATES.map((template) => {
    const resume = englishShowcaseForTemplate(template.id);
    const html = renderToStaticMarkup(<ResumeDocument resume={resume} />);
    expect(html).toContain("Alex Chen");
    expect(html).toContain("Present");
    expect(html).not.toMatch(/[\u3400-\u9fff]+</u);
    return { template, html, resume };
  });
  if (process.env.SHOWCASE_SAMPLES_OUTPUT) {
    const samplesOut = resolve(process.env.SHOWCASE_SAMPLES_OUTPUT);
    mkdirSync(samplesOut, { recursive: true });
    fixtures.forEach(({ template, resume }) =>
      writeFileSync(
        resolve(samplesOut, `resume-${template.id}-en.json`),
        JSON.stringify(parseDraft(resume), null, 2) + "\n",
      ),
    );
  }
  if (!process.env.SHOWCASE_OUTPUT) return;
  const out = resolve(process.env.SHOWCASE_OUTPUT);
  mkdirSync(out, { recursive: true });
  const require = createRequire(import.meta.url);
  const postcss = require(require.resolve("postcss", { paths: [resolve("node_modules/next")] }));
  const tailwind = require("@tailwindcss/postcss");
  const from = resolve("app/globals.css");
  const result = await postcss([tailwind()]).process(readFileSync(from, "utf8"), { from });
  writeFileSync(resolve(out, "styles.css"), result.css);
  const shell = (body: string, css = "") =>
    `<!doctype html><html lang="en-US"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ResumeCraft · English templates</title><link rel="stylesheet" href="styles.css"><style>body{margin:0;background:#eef1ed;color:#213e38;font-family:Arial,sans-serif}.paper{width:794px;margin:24px auto;box-shadow:0 12px 40px #203c3812}.caption{width:794px;margin:26px auto 0;display:flex;justify-content:space-between;align-items:center;font-size:12px}.caption b{font-size:22px}${css}</style><body>${body}</body></html>`;
  fixtures.forEach(({ template, html }) =>
    writeFileSync(
      resolve(out, `${template.id}.html`),
      shell(
        `<div class="caption"><b>${en[template.name]}</b><span>ResumeCraft / fictional sample / full A4 page</span></div><div class="paper">${html}</div>`,
      ),
    ),
  );
  const grid = fixtures
    .map(
      ({ template, html }, i) =>
        `<section><header><b>0${i + 1} / ${en[template.name]}</b><small>${en[template.description]}</small></header><div class="thumb"><div>${html}</div></div></section>`,
    )
    .join("");
  writeFileSync(
    resolve(out, "gallery.html"),
    shell(
      `<main><p class="eyebrow">RESUMECRAFT / THE TEMPLATE COLLECTION</p><h1>One story. Six ways to tell it.</h1><p class="sub">Real templates. Full-page previews. Your content stays yours.</p><div class="gallery">${grid}</div><footer>Fictional sample data and AI portraits · rendered with the same ResumeDocument component used by the app</footer></main>`,
      `main{width:1440px;margin:auto;padding:48px}.eyebrow{font-size:12px;letter-spacing:3px}h1{font-size:48px;font-weight:650;margin:16px 0}.sub{font-size:18px;color:#677b74;margin-bottom:32px}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 24px}.gallery header{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.gallery b{font-size:18px}.gallery small{font-size:12px;color:#677b74}.thumb{width:432px;height:611px;overflow:hidden;box-shadow:0 10px 25px #203c3815}.thumb>div{width:794px;transform:scale(.544);transform-origin:top left}footer{font-size:12px;color:#677b74;margin-top:32px}`,
    ),
  );
  const guides = renderToStaticMarkup(
    <ResumeDocument
      resume={fixtures[0].resume}
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
      `<div class="caption"><b>Layout rules, made visible.</b><span>Section outlines / field boundaries / 12-column guides</span></div><div class="paper layout-mode">${guides}</div>`,
    ),
  );
}, 30000);

it("ships importable English resumes identical to the six preview sources", () => {
  for (const template of TEMPLATES) {
    const published = JSON.parse(
      readFileSync(resolve(`public/examples/resume-${template.id}-en.json`), "utf8"),
    );
    expect(parseDraft(published)).toEqual(parseDraft(englishShowcaseForTemplate(template.id)));
    expect(published.metadata.locale).toBe("en-US");
    expect(JSON.stringify(published.sections)).not.toMatch(/[\u3400-\u9fff]/u);
    expect(published.basics.photo.rounded).toBe(false);
  }
});
