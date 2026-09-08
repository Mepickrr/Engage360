export function computeFunnelStagePercents(stages) {
  const denom = stages[0]?.count || 0;
  return stages.map((stage, i) => ({
    ...stage,
    pctOfTotal: denom > 0 ? (stage.count / denom) * 100 : 0,
    pctOfPrevious: i === 0 ? 100 : (stages[i - 1].count > 0 ? (stage.count / stages[i - 1].count) * 100 : 0),
  }));
}
