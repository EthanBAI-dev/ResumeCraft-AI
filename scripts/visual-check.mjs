// Isolated browser context: never reads or changes the user's existing draft.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const playwrightPath = createRequire(import.meta.url).resolve("playwright", {
  paths: [resolve("services/pdf-worker")],
});
const { default: playwright } = await import(pathToFileURL(playwrightPath).href);
const { chromium } = playwright;

(async () => {
  const out = process.env.QA_OUTPUT || "/tmp/resumecraft-visual-qa";
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(() => localStorage.setItem("resumecraft:guide:v1", "seen"));
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:3000/builder");
    await page.getByRole("button", { name: "载入示例" }).click();
    await page.getByRole("tab", { name: "模板与样式" }).click();
    const ids = ["modern", "classic", "minimal", "executive", "editorial", "nordic"];
    const summaries = [];
    for (const id of ids) {
      const cards = page.locator(".template-card");
      await cards.nth(ids.indexOf(id)).click();
      await page.locator(`.preview-document-scale [data-template="${id}"]`).waitFor();
      await page.evaluate(() => document.fonts.ready);
      // Allow layout effects and automatic pagination to settle.
      await page.waitForTimeout(350);
      const paper = page.locator(".preview-document-scale .resume-page");
      await page.screenshot({ path: `${out}/${id}-workspace.png` });
      await page.setViewportSize({ width: 1440, height: 1500 });
      await paper.first().screenshot({ path: `${out}/${id}-paper.png` });
      await page.setViewportSize({ width: 1440, height: 1000 });
      summaries.push({
        id,
        pages: await paper.count(),
        name: await paper.locator(".resume-basics__name").textContent(),
      });
      assert.equal(await paper.locator(".resume-basics__name").textContent(), "陈亦然");
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll(".preview-document-scale .resume-page")].some((p) =>
          [...p.querySelectorAll(".resume-column")].some(
            (c) => c.getBoundingClientRect().right > p.getBoundingClientRect().right + 1,
          ),
        ),
      );
      assert.equal(overflow, false, `${id} columns overflow horizontally`);
    }
    // Export must serialize the actual document, never a template thumbnail.
    let exported = "";
    await page.route("**/api/export/pdf", async (route) => {
      exported = route.request().postDataJSON().html;
      await route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"QA"}' });
    });
    await Promise.all([
      page.waitForResponse("**/api/export/pdf"),
      page.getByRole("button", { name: "导出 PDF", exact: true }).click(),
    ]);
    assert.ok(exported.includes('data-template="nordic"'));
    assert.ok(!exported.includes('data-template="modern"'));
    await page.unroute("**/api/export/pdf");
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".editor-sidebar").isVisible(), false);
    await page.pdf({ path: `${out}/nordic-print.pdf`, format: "A4", printBackground: true });
    await page.emulateMedia({ media: "screen" });

    await page.getByRole("tab", { name: "内容", exact: true }).click();
    const expand = page.getByRole("button", { name: "展开工作经历", exact: true });
    if (await expand.count()) await expand.click();
    // Keep setup-state tests deterministic even on machines with real credentials.
    await page.route("**/api/ai/resume", async (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ configured: false }),
      }),
    );
    await page.getByRole("button", { name: "AI 润色 / 生成要点" }).first().click();
    await page.getByText(/编辑和导出无需密钥/).waitFor();
    await page.screenshot({ path: `${out}/ai-unconfigured.png` });
    await page.unroute("**/api/ai/resume");
    // A clearly synthetic response exercises the UI without incurring model fees.
    await page.route("**/api/ai/resume", async (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(
          route.request().method() === "GET"
            ? { configured: true }
            : {
                data: {
                  highlights: ["测试建议：梳理支付链路，完善异常处理与补偿机制。"],
                  missingFacts: ["请补充实际性能变化"],
                },
              },
        ),
      }),
    );
    await page.getByRole("button", { name: "生成建议", exact: true }).first().click();
    await page.getByRole("button", { name: "采用所选建议" }).waitFor();
    await page.screenshot({ path: `${out}/ai-review.png` });
    await page.getByRole("button", { name: "采用所选建议" }).click();
    assert.ok((await page.locator(".preview-document-scale").textContent()).includes("测试建议："));
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    assert.ok(
      !(await page.locator(".preview-document-scale").textContent()).includes("测试建议："),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${out}/mobile-editor.png` });
    assert.ok(await page.getByRole("tab", { name: "内容", exact: true }).isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole("button", { name: "纸张预览", exact: true }).click();
    await page.screenshot({ path: `${out}/mobile-preview.png` });
    assert.ok(await page.locator(".preview-document-scale .resume-page").first().isVisible());
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://127.0.0.1:3000");
    await page.screenshot({ path: `${out}/home.png` });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ summaries, errors, output: out }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
