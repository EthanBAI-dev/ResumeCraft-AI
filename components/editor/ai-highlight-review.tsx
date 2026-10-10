"use client";

import { useEffect, useMemo, useRef } from "react";
import { Check, LoaderCircle, RefreshCw, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { diffWords } from "@/lib/ai/diff";
import { ResumeAiClientError, rewriteResumeHighlights } from "@/lib/ai/client";
import { aiTargetKey, useAiStore, type AiSuggestion } from "@/lib/store/ai-store";
import { cn } from "@/lib/utils";

export function AiHighlightReview({
  sectionId,
  itemId,
  values,
  onCommit,
}: {
  sectionId: string;
  itemId: string;
  values: string[];
  onCommit: (values: string[]) => void;
}) {
  const target = useMemo(() => aiTargetKey(sectionId, itemId), [itemId, sectionId]);
  const job = useAiStore((state) => state.jobs[target]);
  const start = useAiStore((state) => state.start);
  const complete = useAiStore((state) => state.complete);
  const fail = useAiStore((state) => state.fail);
  const resolve = useAiStore((state) => state.resolve);
  const clear = useAiStore((state) => state.clear);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const run = async () => {
    const populated = values
      .map((value, sourceIndex) => ({ value: value.trim(), sourceIndex }))
      .filter(({ value }) => value.length > 0);
    const originals = populated.map(({ value }) => value);
    if (originals.length === 0) {
      toast.info("先写一条经历描述，再让 AI 优化");
      return;
    }

    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    const requestId = start(target);
    try {
      const result = await rewriteResumeHighlights(
        { highlights: originals, tone: "impactful", locale: "zh-CN" },
        currentController.signal,
      );
      complete(
        target,
        requestId,
        originals,
        result.data.highlights,
        result.data.missingFacts,
        populated.map(({ sourceIndex }) => sourceIndex),
      );
      toast.success("AI 建议已生成，请逐条审阅");
    } catch (error) {
      if (currentController.signal.aborted) return;
      const normalized =
        error instanceof ResumeAiClientError
          ? error
          : new ResumeAiClientError("AI 请求失败，请稍后重试");
      fail(target, requestId, normalized.message, normalized.retryable);
    }
  };

  const stop = () => {
    controller.current?.abort();
    controller.current = null;
    const requestId = job?.requestId;
    if (requestId) fail(target, requestId, "请求已停止", true);
  };

  const accept = (suggestion: AiSuggestion) => {
    const next = [...values];
    if (suggestion.sourceIndex < next.length) next[suggestion.sourceIndex] = suggestion.proposed;
    else next.push(suggestion.proposed);
    onCommit(next);
    if (job?.suggestions.length === 1) clear(target);
    else resolve(target, suggestion.id);
  };

  const acceptAll = () => {
    const next = [...values];
    for (const suggestion of job?.suggestions ?? []) {
      if (suggestion.sourceIndex < next.length) next[suggestion.sourceIndex] = suggestion.proposed;
      else next.push(suggestion.proposed);
    }
    onCommit(next);
    clear(target);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {job?.status === "loading" ? (
          <Button variant="outline" size="xs" onClick={stop}>
            <Square className="size-3" />
            停止
          </Button>
        ) : (
          <Button variant="outline" size="xs" onClick={run} disabled={!values.some(Boolean)}>
            <Sparkles className="size-3" />
            AI 优化
          </Button>
        )}
      </div>

      {job?.status === "loading" ? (
        <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs">
          <LoaderCircle className="size-3.5 animate-spin" />
          正在生成结构化建议，不会直接覆盖原文…
        </div>
      ) : null}

      {job?.status === "error" ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs">
          <p>{job.error}</p>
          {job.retryable ? (
            <Button variant="ghost" size="xs" className="mt-1" onClick={run}>
              <RefreshCw className="size-3" />
              重试
            </Button>
          ) : null}
        </div>
      ) : null}

      {job?.status === "ready" && job.suggestions.length > 0 ? (
        <div className="border-primary/25 bg-primary/3 space-y-2 rounded-lg border p-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary size-3.5" />
            <span className="flex-1 text-xs font-medium">{job.suggestions.length} 条待审建议</span>
            <Button variant="ghost" size="xs" onClick={acceptAll}>
              全部接受
            </Button>
            <Button variant="ghost" size="xs" onClick={() => clear(target)}>
              全部拒绝
            </Button>
          </div>

          {job.suggestions.map((suggestion) => (
            <DiffSuggestion
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => accept(suggestion)}
              onReject={() => {
                if (job.suggestions.length === 1) clear(target);
                else resolve(target, suggestion.id);
              }}
            />
          ))}

          <Button variant="ghost" size="xs" onClick={run}>
            <RefreshCw className="size-3" />
            重新生成
          </Button>
        </div>
      ) : null}

      {job?.status === "ready" && job.suggestions.length === 0 ? (
        <p className="text-muted-foreground text-xs">AI 没有提出需要替换的内容。</p>
      ) : null}

      {job?.status === "ready" && job.missingFacts.length ? (
        <div className="bg-muted/60 rounded-md px-3 py-2 text-xs">
          <p className="font-medium">建议补充事实</p>
          <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-4">
            {job.missingFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DiffSuggestion({
  suggestion,
  onAccept,
  onReject,
}: {
  suggestion: AiSuggestion;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-background rounded-md border p-2.5">
      <div className="text-foreground text-xs leading-5">
        {diffWords(suggestion.original, suggestion.proposed).map((part, index) => (
          <span
            key={`${part.type}-${index}`}
            className={cn(
              part.type === "insert" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
              part.type === "delete" &&
                "bg-destructive/10 text-destructive decoration-destructive/60 line-through",
            )}
          >
            {part.value}
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-end gap-1">
        <Button variant="ghost" size="xs" onClick={onReject}>
          <X className="size-3" />
          拒绝
        </Button>
        <Button variant="secondary" size="xs" onClick={onAccept}>
          <Check className="size-3" />
          接受
        </Button>
      </div>
    </div>
  );
}
