import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const entry = createRequire(import.meta.url).resolve("playwright", {
  paths: [resolve("services/pdf-worker")],
});
const { default: playwright } = await import(pathToFileURL(entry).href);
const out = process.env.QA_OUTPUT || "/tmp/resumecraft-local-first-qa";
await fs.mkdir(out, { recursive: true });
const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem("resumecraft:guide:v1", "seen"));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let aiCalls = 0;
  await page.route("**/api/ai/resume", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { configured: false, mode: "byok" } });
    aiCalls++;
    assert.equal(route.request().headers()["x-resumecraft-key"], "test-session-key-not-real");
    return route.fulfill({
      json: { data: { highlights: ["参与订单接口开发。"], missingFacts: [] } },
    });
  });
  await page.goto("http://127.0.0.1:3000/builder");
  const name = page.getByRole("textbox", { name: "姓名", exact: true });
  await name.waitFor();
  assert.equal(await name.inputValue(), "陈亦然");
  const sample = page.getByRole("button", { name: "载入示例", exact: true });
  assert.equal(await sample.getAttribute("aria-pressed"), "true");
  await sample.click();
  assert.equal(await sample.getAttribute("aria-pressed"), "false");
  await name.fill("本地测试甲");
  await name.blur();
  await sample.click();
  await page.getByRole("dialog", { name: "载入示例？" }).waitFor();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  assert.equal(await name.inputValue(), "本地测试甲");
  await page.getByRole("button", { name: "我的简历", exact: true }).click();
  await page.getByRole("button", { name: "新建空白简历", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await name.inputValue(), "");
  await name.fill("本地测试乙");
  await name.blur();
  await page.getByRole("button", { name: "我的简历", exact: true }).click();
  await page.screenshot({ path: `${out}/library.png` });
  await page.getByRole("button", { name: "打开 示例简历", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await name.inputValue(), "本地测试甲");
  await page
    .getByRole("button", { name: "撤销", exact: true })
    .isDisabled()
    .then((v) => assert.ok(v));
  // A tiny locally generated PNG fixture, not a remote asset or user photo.
  const photo = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 80;
    const x = c.getContext("2d");
    x.fillStyle = "#528574";
    x.fillRect(0, 0, 64, 80);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("上传照片文件").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await page.getByAltText("简历照片").waitFor({ state: "attached" });
  await page.waitForTimeout(700);
  await page.reload();
  await name.waitFor();
  assert.equal(await name.inputValue(), "本地测试甲");
  assert.ok((await page.getByAltText("简历照片").getAttribute("src")).startsWith("data:image/png"));
  await page.getByRole("button", { name: "投递前检查", exact: true }).click();
  await page.getByRole("dialog", { name: "投递前检查" }).waitFor();
  await page.screenshot({ path: `${out}/checks.png` });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "AI 设置", exact: true }).click();
  await page.getByLabel("DeepSeek API Key", { exact: true }).fill("test-session-key-not-real");
  await page.getByRole("button", { name: "本次会话使用" }).click();
  await page.getByRole("button", { name: "展开工作经历", exact: true }).click();
  await page.getByRole("button", { name: "AI 润色 / 生成要点" }).first().click();
  await page.getByRole("button", { name: "生成建议", exact: true }).click();
  await page.getByRole("button", { name: "采用所选建议" }).waitFor();
  await page.getByText("查看文字修改 · 删除 / 新增").click();
  await page.screenshot({ path: `${out}/byok-review.png` });
  assert.equal(aiCalls, 1);
  const stored = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("keyval-store");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return await new Promise((resolve, reject) => {
      const r = db.transaction("keyval").objectStore("keyval").get("resumecraft:library:v1");
      r.onsuccess = () => resolve(JSON.stringify(r.result));
      r.onerror = () => reject(r.error);
    });
  });
  assert.ok(!stored.includes("test-session-key-not-real"), "Key excluded from local library");
  await page.reload();
  await name.waitFor();
  await page.getByRole("button", { name: "AI 设置", exact: true }).click();
  assert.equal(await page.getByLabel("DeepSeek API Key", { exact: true }).inputValue(), "");
  await page.keyboard.press("Escape");
  await sample.click();
  await page.getByRole("button", { name: "确认替换当前简历" }).click();
  assert.equal(await name.inputValue(), "陈亦然");
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  assert.equal(await name.inputValue(), "本地测试甲");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "我的简历", exact: true }).click();
  await page.screenshot({ path: `${out}/mobile-library.png` });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        result: "passed",
        checks:
          "first sample, confirmation/cancel/undo, independent local drafts, photo upload/reload, local checks, BYOK header/no persistence",
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
