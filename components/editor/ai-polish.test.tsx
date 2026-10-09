import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleResume } from "@/fixtures/sample-resume";
import { useResumeStore } from "@/lib/store/resume-store";
import { AiPolish } from "./ai-polish";

function Harness() {
  const section = useResumeStore((s) => s.resume.sections.experience);
  if (section.type !== "experience") return null;
  return (
    <AiPolish sectionId="experience" itemId="exp-1" highlights={section.items[0].highlights} />
  );
}
const currentHighlights = () => {
  const section = useResumeStore.getState().resume.sections.experience;
  return section.type === "experience" ? section.items[0].highlights : [];
};
beforeEach(() => useResumeStore.getState().replaceResume(sampleResume, { recordHistory: false }));
afterEach(() => vi.unstubAllGlobals());

async function open() {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "AI 润色 / 生成要点" }));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
}

describe("AI review workflow", () => {
  it("appends selected generated highlights without removing existing experience", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) =>
        Response.json(
          options?.method === "POST"
            ? { data: { highlights: ["生成要点一", "生成要点二"], missingFacts: [] } }
            : { configured: true },
        ),
      ),
    );
    const original = [...currentHighlights()];
    await open();
    fireEvent.click(screen.getByRole("button", { name: "从经历生成" }));
    fireEvent.change(screen.getByLabelText("用自己的话描述经历"), {
      target: { value: "维护了权限系统" },
    });
    fireEvent.click(screen.getByRole("button", { name: "生成建议" }));
    await screen.findByText("生成要点一");
    fireEvent.click(screen.getByLabelText("采用建议 2"));
    fireEvent.click(screen.getByRole("button", { name: "采用所选建议" }));
    expect(currentHighlights()).toEqual([...original, "生成要点一"]);
    const options = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === "POST")?.[1];
    expect(JSON.parse(String(options?.body)).kind).toBe("generate");
  });

  it("surfaces conflicts instead of overwriting a concurrent manual change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) =>
        Response.json(
          options?.method === "POST"
            ? { data: { highlights: ["待审阅建议"], missingFacts: [] } }
            : { configured: true },
        ),
      ),
    );
    await open();
    fireEvent.click(screen.getByRole("button", { name: "生成建议" }));
    await screen.findByText("待审阅建议", { selector: "span" });
    act(() =>
      useResumeStore.getState().updateItem("experience", "exp-1", (item) => {
        if ("highlights" in item) item.highlights = ["修改后的事实"];
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "采用所选建议" }));
    expect(screen.getByRole("alert")).toHaveTextContent("原文已被修改");
    expect(currentHighlights()).toEqual(["修改后的事实"]);
    fireEvent.click(screen.getByRole("button", { name: "放弃" }));
    expect(screen.queryByText("待审阅建议")).not.toBeInTheDocument();
    expect(currentHighlights()).toEqual(["修改后的事实"]);
  });

  it("keeps original until accepted and supports undo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) =>
        Response.json(
          options?.method === "POST"
            ? {
                data: {
                  highlights: ["整理交易流程，交付订单维护与功能迭代"],
                  missingFacts: ["实际响应时间"],
                },
              }
            : { configured: true },
        ),
      ),
    );
    const original = [...currentHighlights()];
    await open();
    fireEvent.click(screen.getByRole("button", { name: "生成建议" }));
    expect(await screen.findByText("整理交易流程，交付订单维护与功能迭代")).toBeInTheDocument();
    expect(currentHighlights()).toEqual(original);
    fireEvent.click(screen.getByRole("button", { name: "采用所选建议" }));
    expect(currentHighlights()[0]).toBe("整理交易流程，交付订单维护与功能迭代");
    act(() => useResumeStore.temporal.getState().undo());
    expect(currentHighlights()).toEqual(original);
  });

  it("shows setup guidance without pretending generation succeeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) =>
        options?.method === "POST"
          ? Response.json({ error: { code: "configuration" } }, { status: 503 })
          : Response.json({ configured: false }),
      ),
    );
    await open();
    expect(await screen.findByText(/编辑和导出无需密钥/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "生成建议" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("AI 设置");
    expect(screen.queryByRole("button", { name: "采用所选建议" })).not.toBeInTheDocument();
  });

  it("cancellation ignores a late provider response", async () => {
    let resolve: (response: Response) => void = () => {};
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, options) => {
        if (options?.method !== "POST") return Promise.resolve(Response.json({ configured: true }));
        signal = options.signal;
        return new Promise<Response>((done) => {
          resolve = done;
        });
      }),
    );
    const original = [...currentHighlights()];
    await open();
    fireEvent.click(screen.getByRole("button", { name: "生成建议" }));
    fireEvent.click(screen.getByRole("button", { name: "停止生成" }));
    expect(signal?.aborted).toBe(true);
    await act(async () =>
      resolve(Response.json({ data: { highlights: ["迟到的建议"], missingFacts: [] } })),
    );
    expect(screen.queryByText("迟到的建议")).not.toBeInTheDocument();
    expect(currentHighlights()).toEqual(original);
  });
});
