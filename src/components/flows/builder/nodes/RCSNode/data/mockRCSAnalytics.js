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

export function getRCSTemplateAnalytics(template) {
  const rand = mulberry32(hashString(template?.id || template?.name || "template"));

  const sent = Math.round(600 + rand() * 3400);
  const deliveredPct = Math.round(88 + rand() * 10); // 88–98%
  const delivered = Math.round((sent * deliveredPct) / 100);
  const readPct = Math.round(40 + rand() * 45); // 40–85% of delivered
  const read = Math.round((delivered * readPct) / 100);
  const failed = sent - delivered;
  const failedPct = Math.round((failed / sent) * 100);

  return { sent, delivered, deliveredPct, read, readPct, failed, failedPct };
}

export const RCS_ANALYTICS_METRICS = [
  { label: "Sent", value: (d) => String(d.sent) },
  { label: "Delivered", value: (d) => `${d.delivered} · ${d.deliveredPct}%` },
  { label: "Read", value: (d) => `${d.read} · ${d.readPct}%` },
  { label: "Failed", value: (d) => `${d.failed} · ${d.failedPct}%` },
];
