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

export function getOnsiteTemplateAnalytics(template) {
  const rand = mulberry32(hashString(template?.id || template?.name || "template"));

  const shown = Math.round(800 + rand() * 4000);
  const clickedPct = Math.round(4 + rand() * 22); // engagement — of shown
  const clicked = Math.round((shown * clickedPct) / 100);
  const dismissedPct = Math.round(30 + rand() * 40);
  const dismissed = Math.round((shown * dismissedPct) / 100);
  const timedOut = Math.max(0, shown - clicked - dismissed);
  const timedOutPct = Math.round((timedOut / (shown || 1)) * 100);

  return { shown, clicked, clickedPct, dismissed, dismissedPct, timedOut, timedOutPct };
}

export const ONSITE_ANALYTICS_METRICS = [
  { label: "Shown", value: (d) => String(d.shown) },
  { label: "Clicked", value: (d) => `${d.clicked} · ${d.clickedPct}%` },
  { label: "Dismissed", value: (d) => `${d.dismissed} · ${d.dismissedPct}%` },
  { label: "Timed Out", value: (d) => `${d.timedOut} · ${d.timedOutPct}%` },
];
