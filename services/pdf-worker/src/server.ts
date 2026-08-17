import Fastify from "fastify";
import { z } from "zod";
import { launchBrowser } from "./browser.js";

const RenderRequest = z.object({
  html: z.string().min(100).max(2_000_000),
  filename: z.string().min(1).max(160).optional(),
});

const app = Fastify({ logger: true, bodyLimit: 2_100_000 });
const browser = await launchBrowser();

app.get("/health", async () => ({ ok: browser.isConnected() }));

app.post("/render", async (request, reply) => {
  const body = RenderRequest.parse(request.body);
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
    await page.setContent(body.html, { waitUntil: "networkidle", timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${safeFilename(body.filename)}.pdf"`)
      .send(pdf);
  } finally {
    await context.close();
  }
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: "PDF 渲染参数无效" });
  }
  app.log.error(error);
  return reply.status(500).send({ error: "PDF 渲染失败" });
});

app.addHook("onClose", async () => browser.close());

await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3001) });

function safeFilename(value = "resume") {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160) || "resume";
}
