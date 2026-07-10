// Deterministic mock analytics per template — seeded by template id/name so the
// same template always shows the same numbers (not random-per-render).

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getPushTemplateAnalytics(template) {
  const rand = mulberry32(hashString(template?.id || template?.name || "template"));

  const sent = Math.round(1000 + rand() * 5000);
  const deliveredPct = Math.round(85 + rand() * 12); // 85–97%
  const delivered = Math.round((sent * deliveredPct) / 100);
  const clickedPct = Math.round(3 + rand() * 20); // engagement — of delivered
  const clicked = Math.round((delivered * clickedPct) / 100);
  const dismissed = delivered - clicked;
  const dismissedPct = Math.round((dismissed / (delivered || 1)) * 100);

  return { sent, delivered, deliveredPct, clicked, clickedPct, dismissed, dismissedPct };
}

export const PUSH_ANALYTICS_METRICS = [
  { label: "Sent", value: (d) => String(d.sent) },
  { label: "Delivered", value: (d) => `${d.delivered} · ${d.deliveredPct}%` },
  { label: "Clicked", value: (d) => `${d.clicked} · ${d.clickedPct}%` },
  { label: "Dismissed", value: (d) => `${d.dismissed} · ${d.dismissedPct}%` },
];
