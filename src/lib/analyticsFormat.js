export function formatCompactCurrency(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e8) return `${sign}₹${(abs / 1e8).toFixed(1)}C`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function formatCompactNumber(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e3) {
    const scaled = abs / 1e3;
    const rounded = Math.round(scaled * 100) / 100;
    return `${sign}${rounded}K`;
  }
  return `${sign}${abs}`;
}

export function formatDelta(deltaPct, deltaAbs, formatter) {
  const tone = deltaPct < 0 ? "negative" : "positive";
  const arrow = deltaPct < 0 ? "↓" : "↑";
  const pctText = Math.abs(deltaPct);
  const absSign = deltaAbs < 0 ? "-" : "+";
  const absText = formatter(Math.abs(deltaAbs));
  return {
    text: `${arrow} ${pctText}% (${absSign}${absText})`,
    tone,
  };
}
