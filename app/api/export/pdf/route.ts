import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PdfRequest = z.object({
  html: z.string().min(100).max(2_000_000),
  filename: z.string().min(1).max(160),
});

/** Next 只做代理；Chromium 始终运行在独立容器，避免 Serverless 包体/并发问题。 */
export async function POST(request: Request) {
  const workerUrl = process.env.PDF_WORKER_URL;
  if (!workerUrl) {
    return Response.json({ error: "PDF worker 未配置" }, { status: 503 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = PdfRequest.safeParse(input);
  if (!parsed.success) {
    return Response.json({ error: "PDF 导出参数无效" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${workerUrl.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return Response.json(
      { error: timedOut ? "PDF worker 生成超时" : "无法连接 PDF worker" },
      { status: timedOut ? 504 : 502 },
    );
  }

  if (!response.ok) {
    return Response.json({ error: "PDF worker 生成失败" }, { status: 502 });
  }

  if (!response.headers.get("Content-Type")?.toLowerCase().startsWith("application/pdf")) {
    return Response.json({ error: "PDF worker 返回了无效文件" }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        response.headers.get("Content-Disposition") ?? "attachment; filename=resume.pdf",
      "Cache-Control": "no-store",
    },
  });
}
