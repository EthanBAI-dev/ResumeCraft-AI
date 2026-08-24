import { beforeEach, describe, expect, it } from "vitest";
import { aiTargetKey, useAiStore } from "./ai-store";

const target = aiTargetKey("experience", "item-1");

beforeEach(() => useAiStore.setState({ jobs: {} }));

describe("AI 审阅队列", () => {
  it("只把发生变化的建议放进待审队列", () => {
    const requestId = useAiStore.getState().start(target);
    useAiStore
      .getState()
      .complete(target, requestId, ["保持不变", "负责开发"], ["保持不变", "主导开发"], []);

    const job = useAiStore.getState().jobs[target];
    expect(job.status).toBe("ready");
    expect(job.suggestions).toMatchObject([
      { sourceIndex: 1, original: "负责开发", proposed: "主导开发" },
    ]);
  });

  it("重新生成后忽略旧请求的迟到结果", () => {
    const oldRequest = useAiStore.getState().start(target);
    const currentRequest = useAiStore.getState().start(target);

    useAiStore.getState().complete(target, oldRequest, ["原文"], ["旧结果"], []);
    expect(useAiStore.getState().jobs[target].status).toBe("loading");

    useAiStore.getState().complete(target, currentRequest, ["原文"], ["新结果"], ["补充指标"]);
    expect(useAiStore.getState().jobs[target].suggestions[0].proposed).toBe("新结果");
    expect(useAiStore.getState().jobs[target].missingFacts).toEqual(["补充指标"]);
  });

  it("保留过滤空白要点前的原始位置", () => {
    const requestId = useAiStore.getState().start(target);
    useAiStore.getState().complete(target, requestId, ["第二条"], ["优化第二条"], [], [1]);

    expect(useAiStore.getState().jobs[target].suggestions[0].sourceIndex).toBe(1);
  });

  it("支持逐条和批量清空建议", () => {
    const requestId = useAiStore.getState().start(target);
    useAiStore.getState().complete(target, requestId, ["A", "B"], ["A+", "B+"], []);
    const [first] = useAiStore.getState().jobs[target].suggestions;

    useAiStore.getState().resolve(target, first.id);
    expect(useAiStore.getState().jobs[target].suggestions).toHaveLength(1);

    useAiStore.getState().resolveAll(target);
    expect(useAiStore.getState().jobs[target].suggestions).toHaveLength(0);
  });
});
