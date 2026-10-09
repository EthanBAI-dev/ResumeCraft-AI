"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeAiOutputSchema, type ResumeAiOutput } from "@/lib/ai/output-schema";
import { useResumeStore } from "@/lib/store/resume-store";
import { toast } from "sonner";
import { aiRequestHeaders, useAiSettings } from "@/lib/store/ai-settings";
import { diffText } from "@/lib/ai/text-diff";

type Review = ResumeAiOutput & { source: string[]; index: number; selected: boolean[] };

export function AiPolish({
  sectionId,
  itemId,
  highlights,
}: {
  sectionId: string;
  itemId: string;
  highlights: string[];
}) {
  const id = useId();
  const personalKey = useAiSettings((s) => s.apiKey);
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"rewrite" | "generate">("rewrite");
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState("");
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState("professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );
  useEffect(() => {
    if (!open) return;
    const check = new AbortController();
    void fetch("/api/ai/resume", { signal: check.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setConfigured(typeof data.configured === "boolean" ? data.configured : null))
      .catch(() => {});
    return () => check.abort();
  }, [open]);

  function cancel() {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setNotice("已停止生成，简历内容未变更。");
  }

  async function generate() {
    if (controller.current) return;
    // Read committed state at request time, not a possibly stale render snapshot.
    const resume = useResumeStore.getState().resume;
    const section = resume.sections[sectionId];
    const item =
      section && section.type !== "summary"
        ? section.items.find((entry) => entry.id === itemId)
        : null;
    if (!item || !("highlights" in item)) return;
    const source = [...item.highlights];
    if (mode === "rewrite" && !source[index]?.trim()) {
      setError("请先选择一条有内容的要点。");
      return;
    }
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError("");
    setNotice("");
    setReview(null);
    const timeout = setTimeout(() => current.abort(), 60_000);
    try {
      const context = {
        locale: resume.metadata.locale,
        ...(resume.basics.headline.trim()
          ? { targetRole: resume.basics.headline.slice(0, 200) }
          : {}),
        ...(jd.trim() ? { jobDescription: jd.trim() } : {}),
      };
      const response = await fetch("/api/ai/resume", {
        method: "POST",
        headers: aiRequestHeaders(),
        signal: current.signal,
        body: JSON.stringify({
          kind: mode,
          input:
            mode === "rewrite"
              ? { ...context, highlights: [source[index]], tone }
              : { ...context, rawExperience: raw.trim(), count: 3 },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error?.code === "configuration") {
          setConfigured(false);
          throw new Error("请打开顶部「AI 设置」，输入自己的 DeepSeek API Key 后重试。");
        }
        throw new Error(payload.error?.message || "生成失败，请稍后重试。");
      }
      const parsed = ResumeAiOutputSchema.safeParse(payload.data);
      if (!parsed.success) throw new Error("AI 返回的内容格式不完整，请重新生成。");
      if (controller.current !== current || current.signal.aborted) return;
      setConfigured(true);
      setReview({
        ...parsed.data,
        source,
        index: mode === "rewrite" ? index : -1,
        selected: parsed.data.highlights.map(() => true),
      });
    } catch (cause) {
      if (controller.current !== current) return;
      setError(
        current.signal.aborted
          ? "生成等待超时，请重试。"
          : cause instanceof Error
            ? cause.message
            : "无法连接 AI 服务，请检查网络后重试。",
      );
    } finally {
      clearTimeout(timeout);
      if (controller.current === current) {
        controller.current = null;
        setBusy(false);
      }
    }
  }

  function accept() {
    if (!review) return;
    const chosen = review.highlights.filter((_, i) => review.selected[i]);
    if (!chosen.length) return;
    const next = [...review.source];
    if (review.index < 0) next.push(...chosen);
    else next.splice(review.index, 1, ...chosen);
    if (!useResumeStore.getState().applyAiHighlights(sectionId, itemId, review.source, next)) {
      setError("原文已被修改或条目已删除。为保留最新内容，请重新生成建议。");
      return;
    }
    setReview(null);
    setNotice("已采用所选建议，可通过撤销恢复原文。");
    toast.success("AI 建议已应用");
  }

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        className="border-primary/20 text-primary w-full"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        data-tour="ai"
        onClick={() => {
          if (open) cancel();
          setOpen(!open);
        }}
      >
        <Sparkles className="size-3.5" />
        {open ? "收起 AI 助手" : "AI 润色 / 生成要点"}
      </Button>
      {open && (
        <section id={`${id}-panel`} className="ai-panel mt-2 space-y-3" aria-label="AI 经历助手">
          <div>
            <h3 className="text-primary text-sm font-semibold">把经历写得更有说服力</h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              仅发送选中的要点或你输入的经历、目标岗位和可选 JD 给所配置的 AI
              服务。建议经你确认后才会写入。
            </p>
          </div>
          {configured === false && !personalKey && (
            <div
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
            >
              AI 尚未配置。请在「AI 设置」中输入自己的 DeepSeek Key；编辑和导出无需密钥。
              <button
                className="ml-1 underline"
                onClick={() => useAiSettings.getState().setOpen(true)}
              >
                打开 AI 设置
              </button>
            </div>
          )}
          <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === "rewrite" ? "default" : "outline"}
                aria-pressed={mode === "rewrite"}
                onClick={() => {
                  setMode("rewrite");
                  setReview(null);
                }}
              >
                润色已有要点
              </Button>
              <Button
                size="sm"
                variant={mode === "generate" ? "default" : "outline"}
                aria-pressed={mode === "generate"}
                onClick={() => {
                  setMode("generate");
                  setReview(null);
                }}
              >
                从经历生成
              </Button>
            </div>
            {mode === "rewrite" ? (
              <>
                <label className="block text-xs font-medium" htmlFor={`${id}-source`}>
                  选择要润色的要点
                </label>
                <select
                  id={`${id}-source`}
                  className="h-9 w-full min-w-0 rounded-lg border bg-white px-2 text-xs"
                  value={index}
                  onChange={(e) => {
                    setIndex(Number(e.target.value));
                    setReview(null);
                  }}
                >
                  {highlights.length === 0 && (
                    <option value={0}>请先添加要点，或切换到从经历生成</option>
                  )}
                  {highlights.map((value, i) => (
                    <option key={i} value={i}>
                      {i + 1}. {value.slice(0, 45) || "（空白要点）"}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs" htmlFor={`${id}-tone`}>
                  表达风格
                  <select
                    id={`${id}-tone`}
                    className="h-8 flex-1 rounded-lg border bg-white px-2"
                    value={tone}
                    onChange={(e) => {
                      setTone(e.target.value);
                      setReview(null);
                    }}
                  >
                    <option value="professional">专业清晰</option>
                    <option value="concise">简短精炼</option>
                    <option value="impactful">突出贡献</option>
                  </select>
                </label>
              </>
            ) : (
              <label className="block text-xs font-medium" htmlFor={`${id}-raw`}>
                用自己的话描述经历
                <textarea
                  id={`${id}-raw`}
                  className="mt-2 min-h-24 w-full rounded-lg border bg-white p-2 text-sm"
                  maxLength={12000}
                  value={raw}
                  onChange={(e) => {
                    setRaw(e.target.value);
                    setReview(null);
                  }}
                  placeholder="做了什么、用到什么方法、产生了什么结果？没有准确数字可以先不填。"
                />
              </label>
            )}
            <details>
              <summary className="text-muted-foreground cursor-pointer text-xs">
                针对岗位优化（可选）
              </summary>
              <label className="mt-2 block text-xs" htmlFor={`${id}-jd`}>
                岗位描述 JD
                <textarea
                  id={`${id}-jd`}
                  className="mt-1 min-h-20 w-full rounded-lg border bg-white p-2 text-xs"
                  maxLength={12000}
                  value={jd}
                  onChange={(e) => {
                    setJd(e.target.value);
                    setReview(null);
                  }}
                  placeholder="粘贴目标岗位描述，建议将优先突出相关经历"
                />
              </label>
            </details>
          </fieldset>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy || (mode === "generate" ? !raw.trim() : !highlights[index]?.trim())}
              onClick={() => void generate()}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {busy ? "正在生成建议…" : review ? "重新生成" : "生成建议"}
            </Button>
            {busy && (
              <Button variant="outline" size="sm" onClick={cancel}>
                停止生成
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs leading-relaxed text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-primary text-xs">
              {notice}
            </p>
          )}
          {review && (
            <div className="border-primary/15 space-y-3 border-t pt-3" aria-label="AI 建议审阅">
              {review.index >= 0 && (
                <div className="rounded-lg bg-white p-3">
                  <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-widest">
                    原文
                  </p>
                  <p className="text-xs leading-relaxed">{review.source[review.index]}</p>
                </div>
              )}
              <p className="text-primary text-xs font-semibold">建议版本 · 勾选要采用的内容</p>
              {review.highlights.map((value, i) => (
                <label
                  key={i}
                  className="border-primary/15 flex items-start gap-2 rounded-lg border bg-white p-3 text-xs leading-relaxed"
                >
                  <input
                    aria-label={`采用建议 ${i + 1}`}
                    className="mt-1 accent-[#25635b]"
                    type="checkbox"
                    checked={review.selected[i]}
                    onChange={(e) =>
                      setReview({
                        ...review,
                        selected: review.selected.map((v, j) => (j === i ? e.target.checked : v)),
                      })
                    }
                  />
                  <span>{value}</span>
                </label>
              ))}
              {review.missingFacts.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                  <p className="font-medium">补充这些事实，会更有说服力</p>
                  <ul className="mt-1 list-disc pl-4">
                    {review.missingFacts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                  <p className="mt-2">请核实内容，不要填入未经确认的数字。</p>
                </div>
              )}
              {review.index >= 0 && review.highlights.length === 1 && (
                <details className="rounded-lg border bg-white p-3 text-xs">
                  <summary className="cursor-pointer font-medium">
                    查看文字修改 · 删除 / 新增
                  </summary>
                  <p className="mt-2 leading-relaxed">
                    {diffText(review.source[review.index], review.highlights[0]).map((part, i) =>
                      part.type === "removed" ? (
                        <del key={i} className="bg-red-50 text-red-800">
                          {part.text}
                        </del>
                      ) : part.type === "added" ? (
                        <ins key={i} className="bg-teal-50 text-teal-900">
                          {part.text}
                        </ins>
                      ) : (
                        <span key={i}>{part.text}</span>
                      ),
                    )}
                  </p>
                </details>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={!review.selected.some(Boolean)} onClick={accept}>
                  <Check className="size-3.5" />
                  采用所选建议
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReview(null);
                    setError("");
                    setNotice("建议已放弃，原文未变更。");
                  }}
                >
                  <X className="size-3.5" />
                  放弃
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
