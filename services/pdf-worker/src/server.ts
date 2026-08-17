import Fastify from "fastify";
import { z } from "zod";
import { launchBrowser } from "./browser.js";
import { RenderGate, RenderQueueFullError } from "./render-gate.js";

const RenderRequest = z.object({
  html: z.string().min(100).max(2_000_000),
  filename: z.string().min(1).max(160).optional(),
});

const renderTimeoutMs = readBoundedEnv("RENDER_TIMEOUT_MS", 25_000, 1_000, 60_000);
const gate = new RenderGate(
  readBoundedEnv("MAX_CONCURRENT_RENDERS", 2, 1, 8),
  readBoundedEnv("MAX_QUEUED_RENDERS", 4, 0, 32),
);
const app = Fastify({ logger: true, bodyLimit: 2_100_000 });
const browser = await launchBrowser();

app.get("/health", async () => ({
  ok: browser.isConnected(),
  ...gate.snapshot,
}));

app.get("/metrics", async () => ({
  browserConnected: browser.isConnected(),
  renderTimeoutMs,
  ...gate.snapshot,
}));

app.post("/render", async (request, reply) => {
  const body = RenderRequest.parse(request.body);
  try {
    const pdf = await gate.run(() => renderPdf(body.html));
    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${safeFilename(body.filename)}.pdf"`)
      .send(pdf);
  } catch (error) {
    if (error instanceof RenderQueueFullError) {
      return reply
        .status(429)
        .header("Retry-After", "5")
        .send({ error: "PDF 渲染繁忙，请稍后重试" });
    }
    throw error;
  }
});

async function renderPdf(html: string) {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  try {
    // 导出 HTML 已内联 CSS；禁止访问公网，避免用户 CSS/HTML 把 Worker 变成 SSRF 代理。
    await page.route("**/*", async (route) => {
      const protocol = new URL(route.request().url()).protocol;
      if (protocol === "about:" || protocol === "data:" || protocol === "blob:") {
        await route.continue();
      } else {
        await route.abort("blockedbyclient");
      }
    });
    page.setDefaultTimeout(20_000);
    await page.setContent(html, { waitUntil: "networkidle", timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    return await withinDeadline(
      page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      }),
      renderTimeoutMs,
    );
  } finally {
    await context.close();
  }
}

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: "PDF 渲染参数无效" });
  }
  if (error instanceof RenderTimeoutError) {
    return reply.status(504).send({ error: "PDF 渲染超时，请稍后重试" });
  }
  app.log.error(error);
  return reply.status(500).send({ error: "PDF 渲染失败" });
});

app.addHook("onClose", async () => {
  gate.close();
  await browser.close();
});

await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3001) });

function safeFilename(value = "resume") {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160) || "resume";
}

function readBoundedEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

async function withinDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new RenderTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

class RenderTimeoutError extends Error {
  constructor() {
    super("PDF 渲染超时");
  }
}
