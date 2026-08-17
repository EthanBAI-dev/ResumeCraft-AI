"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store/resume-store";

/**
 * 「按键 → 预览重绘完成」的端到端延迟采样。
 *
 * ADR-005 给实时预览定了性能预算：P95 < 100ms。
 * 没有埋点就只能靠"感觉不卡"，那个数字进不了简历也扛不住面试追问，
 * 所以从第一天就把它测出来。
 *
 * 计时口径：store 更新那一刻打点 → 浏览器完成下一帧绘制（rAF 之后的宏任务）收点。
 * 这条链路包含 React 重渲染 + 布局 + 绘制，是用户真正感知到的延迟。
 */
export type LatencyStats = {
  samples: number;
  p50: number;
  p95: number;
  max: number;
  last: number;
};

const WINDOW = 120;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

export function useRenderLatency(enabled = true): LatencyStats {
  const samplesRef = useRef<number[]>([]);
  const [stats, setStats] = useState<LatencyStats>({
    samples: 0,
    p50: 0,
    p95: 0,
    max: 0,
    last: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    return useResumeStore.subscribe((state, prev) => {
      if (state.resume === prev.resume) return;
      const start = performance.now();

      requestAnimationFrame(() => {
        // rAF 回调在绘制前触发；再挂一个 0ms 定时器，等这一帧真正提交完
        setTimeout(() => {
          const elapsed = performance.now() - start;
          const samples = samplesRef.current;
          samples.push(elapsed);
          if (samples.length > WINDOW) samples.shift();

          const sorted = [...samples].sort((a, b) => a - b);
          setStats({
            samples: samples.length,
            p50: percentile(sorted, 50),
            p95: percentile(sorted, 95),
            max: sorted[sorted.length - 1],
            last: elapsed,
          });
        }, 0);
      });
    });
  }, [enabled]);

  return stats;
}
