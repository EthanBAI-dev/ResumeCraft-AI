import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const validBody = {
  html: `<!doctype html><html><body>${"中文简历".repeat(30)}</body></html>`,
  filename: "张三-ResumeCraft",
};

function request(body: unknown) {
  return new Request("http://localhost/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/export/pdf", () => {
  it("Worker 未配置时返回可降级的 503", async () => {
    vi.stubEnv("PDF_WORKER_URL", "");
    expect((await POST(request(validBody))).status).toBe(503);
  });

  it("拒绝非法 JSON 与不合规参数", async () => {
    vi.stubEnv("PDF_WORKER_URL", "http://worker:3001");
    const invalidJson = new Request("http://localhost/api/export/pdf", {
      method: "POST",
      body: "not-json",
    });

    expect((await POST(invalidJson)).status).toBe(400);
    expect((await POST(request({ html: "too short", filename: "resume" }))).status).toBe(400);
  });

  it("透传 PDF 字节与下载响应头", async () => {
    vi.stubEnv("PDF_WORKER_URL", "http://worker:3001/");
    const upstream = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="resume.pdf"',
        },
      }),
    );
    vi.stubGlobal("fetch", upstream);

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="resume.pdf"');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    );
    expect(upstream).toHaveBeenCalledWith(
      "http://worker:3001/render",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });

  it("拒绝 Worker 的非 PDF 成功响应", async () => {
    vi.stubEnv("PDF_WORKER_URL", "http://worker:3001");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("ok", { headers: { "Content-Type": "text/plain" } })),
    );

    expect((await POST(request(validBody))).status).toBe(502);
  });

  it("保留 Worker 的过载信号，供前端提示稍后重试", async () => {
    vi.stubEnv("PDF_WORKER_URL", "http://worker:3001");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "busy" }), {
          status: 429,
          headers: { "Retry-After": "5" },
        }),
      ),
    );

    const response = await POST(request(validBody));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("5");
  });

  it("把 Worker 超时映射为 504", async () => {
    vi.stubEnv("PDF_WORKER_URL", "http://worker:3001");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")),
    );

    expect((await POST(request(validBody))).status).toBe(504);
  });
});
