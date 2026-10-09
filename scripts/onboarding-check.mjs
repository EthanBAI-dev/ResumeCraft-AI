import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const entry = createRequire(import.meta.url).resolve("playwright", {
  paths: [resolve("services/pdf-worker")],
});
const { default: playwright } = await import(pathToFileURL(entry).href);
const out = process.env.QA_OUTPUT || "/tmp/resumecraft-onboarding-qa";
await fs.mkdir(out, { recursive: true });
const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const errors = [];

try {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => errors.push(error.message));
    let generationCalls = 0;
    await page.route("**/api/ai/resume", (route) => {
      if (route.request().method() === "POST") generationCalls++;
      return route.fulfill({ contentType: "application/json", body: '{"configured":true}' });
    });
    await page.goto("http://127.0.0.1:3000/builder");
    await page.getByRole("dialog", { name: "先把经历写进来" }).waitFor();
    for (let step = 0; step < 7; step++) {
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${out}/${name}-step-${step + 1}.png` });
      const rect = await page.locator(".guide-card").boundingBox();
      assert.ok(
        rect &&
          rect.x >= 0 &&
          rect.y >= 0 &&
          rect.x + rect.width <= width + 1 &&
          rect.y + rect.height <= height + 1,
        `${name} step ${step + 1} card fits`,
      );
      const hole = page.locator(".guide-spotlight");
      assert.equal(await hole.count(), 1, `${name} step ${step + 1} has visible target`);
      await page
        .getByRole("button", { name: step === 6 ? "开始使用" : "下一步", exact: true })
        .click();
    }
    assert.equal(await page.locator("dialog[open]").count(), 0);
    assert.equal(
      await page.locator(".preview-document-scale .resume-basics__name").count(),
      1,
      "first visit loads a sample; tour preserves it",
    );
    assert.equal(generationCalls, 0, "tour does not invoke AI");
    assert.equal(await page.evaluate(() => localStorage.getItem("resumecraft:guide:v1")), "seen");
    await page.reload();
    await page.waitForTimeout(1000);
    assert.equal(await page.locator("dialog[open]").count(), 0, "seen tour does not auto-reopen");
    await page.getByRole("button", { name: "帮助", exact: true }).click();
    await page.getByRole("dialog", { name: "用好你的简历工作台" }).waitFor();
    await page.screenshot({ path: `${out}/${name}-help.png` });
    await page.getByRole("button", { name: /带我看看.*一行十二格，字段自己排/ }).click();
    await page.getByRole("dialog", { name: "一行十二格，字段自己排" }).waitFor();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(50);
    assert.equal(await page.locator("dialog[open]").count(), 0, "Escape dismisses tour");
    assert.equal(
      await page
        .getByRole("button", { name: "帮助", exact: true })
        .evaluate((node) => document.activeElement === node),
      true,
      "focus returns to help entry",
    );

    const basicsLayout = page.locator("#panel-basics .item-layout-editor");
    if (!(await basicsLayout.evaluate((node) => node.open)))
      await basicsLayout.locator("summary").click();
    await basicsLayout.getByRole("button", { name: "减少照片宽度", exact: true }).click();
    const photo = basicsLayout.locator('[data-atom-field="photo"]');
    assert.equal(await photo.getAttribute("data-atom-span"), "2");
    const widthControls = photo.getByRole("group", { name: "照片占用格数" });
    assert.deepEqual(
      await widthControls.evaluate((node) => [...node.children].map((child) => child.tagName)),
      ["BUTTON", "SPAN", "BUTTON"],
      "width number sits between minus and plus",
    );
    const cardBounds = await photo.boundingBox();
    const controlsBounds = await widthControls.boundingBox();
    assert.ok(
      controlsBounds.x >= cardBounds.x &&
        controlsBounds.x + controlsBounds.width <= cardBounds.x + cardBounds.width + 1,
      `${name}: 2-column controls stay within card`,
    );
    assert.equal(await photo.locator(".item-layout-actions button").count(), 3);
    assert.equal(await photo.locator(".lucide-corner-down-left").count(), 1);
    await photo.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/${name}-compact-controls.png` });
    await basicsLayout.getByRole("button", { name: "增加照片宽度", exact: true }).click();

    if (name === "desktop") {
      const layoutBounds = await page.locator('[data-tour="layout"]').boundingBox();
      const zoomBounds = await page
        .getByRole("button", { name: "缩小", exact: true })
        .boundingBox();
      assert.ok(layoutBounds.x < zoomBounds.x, "layout entry precedes zoom controls on the left");
      await page.getByRole("button", { name: "展开工作经历", exact: true }).click();
      const section = page.locator("#panel-experience");
      await section.locator("summary").click();
      const company = page
        .locator(
          '.preview-document-scale [data-layout-section="experience"] [data-item-slot="primary"]',
        )
        .first();
      const span = Number(await company.getAttribute("data-span"));
      await section.getByRole("button", { name: "增加公司宽度", exact: true }).click();
      assert.equal(Number(await company.getAttribute("data-span")), span + 1);
      await section.getByRole("button", { name: "隐藏日期", exact: true }).click();
      assert.equal(
        await page
          .locator(
            '.preview-document-scale [data-layout-section="experience"] [data-item-slot="date"]',
          )
          .count(),
        0,
      );
      await section.getByRole("button", { name: "显示日期", exact: true }).click();
      const grid = section.locator(".item-layout-grid");
      const before = await grid
        .locator("[data-atom-field]")
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.atomField));
      const source = section.getByRole("button", { name: "拖动公司", exact: true });
      const target = section.getByRole("button", { name: "拖动日期", exact: true });
      await source.scrollIntoViewIfNeeded();
      const a = await source.boundingBox();
      const b = await target.boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
      await page.mouse.up();
      const after = await grid
        .locator("[data-atom-field]")
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.atomField));
      assert.notDeepEqual(after, before, "field drag changes order");
      await page.waitForTimeout(250); // Let dnd-kit's post-drag click suppression settle.
      await page.getByRole("button", { name: "调整布局", exact: true }).click();
      await page.waitForFunction(() => {
        const handle = document.querySelector(".layout-mode .layout-drag-handle");
        return handle && getComputedStyle(handle).opacity === "1";
      });
      await page.screenshot({ path: `${out}/restored-field-layout.png` });
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        result: "passed",
        checks: "desktop/mobile tour, repeat/skip/focus, no mutation, field width/hide/drag",
        errors,
        output: out,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
