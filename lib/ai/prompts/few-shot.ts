export const QUANTIFIED_FEW_SHOTS = [
  {
    source: "我负责订单查询接口的缓存改造，峰值 QPS 12000，P99 从 420ms 优化到 130ms。",
    result: "主导订单查询缓存链路重构，支撑峰值 12,000 QPS，将 P99 延迟从 420ms 降至 130ms。",
    missingFacts: [] as string[],
  },
  {
    source: "做了新用户引导，改版前完成率 31%，改版后 47%，两个月覆盖 8 万新用户。",
    result: "重构新用户引导流程，两个月覆盖 8 万名新用户，将流程完成率从 31% 提升至 47%。",
    missingFacts: [] as string[],
  },
  {
    source: "参与 CI 流程优化，把构建步骤并行化。",
    result: "重构 CI 构建流程，通过任务并行化缩短反馈链路。",
    missingFacts: ["优化前后的构建时长", "影响的仓库、团队或每日构建次数"],
  },
] as const;

export function renderQuantifiedFewShots() {
  return QUANTIFIED_FEW_SHOTS.map(
    (example) =>
      `输入：${JSON.stringify(example.source)}\n输出：${JSON.stringify({ highlights: [example.result], missingFacts: example.missingFacts })}`,
  ).join("\n\n");
}
