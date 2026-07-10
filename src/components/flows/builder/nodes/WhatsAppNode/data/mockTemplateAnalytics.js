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

const RECOMMENDATIONS = [
  {
    title: "Personalised greetings boost attention and trust",
    description: "Templates with the recipient's name in the first sentence typically perform better.",
  },
  {
    title: "Shorter messages get read more often",
    description: "Templates under 300 characters see higher read rates than longer, denser ones.",
  },
  {
    title: "A single clear call-to-action improves clicks",
    description: "Templates with one prominent button outperform templates with several competing buttons.",
  },
];

export function getTemplateAnalytics(template) {
  const rand = mulberry32(hashString(template?.id || template?.name || "template"));

  const sent = Math.round(800 + rand() * 4200);
  const deliveredPct = Math.round(86 + rand() * 12);
  const readPct = Math.round(35 + rand() * 45);
  const ctrPct = Math.round(2 + rand() * 15);

  const delivered = Math.round((sent * deliveredPct) / 100);
  const read = Math.round((sent * readPct) / 100);
  const clicks = Math.round((sent * ctrPct) / 100);

  const buttons = template?.buttons || [];
  const ctaClicks = buttons.map((btn, i) => {
    const share = buttons.length ? clicks / buttons.length : 0;
    const variance = 0.7 + rand() * 0.6;
    return { label: btn.label || `Button ${i + 1}`, clicks: Math.max(0, Math.round(share * variance)) };
  });

  const similarReadPct = Math.min(96, readPct + Math.round(8 + rand() * 12));
  const similarCtrPct = Math.min(70, ctrPct + Math.round(6 + rand() * 14));

  const recStart = Math.floor(rand() * RECOMMENDATIONS.length);
  const recommendations = [...RECOMMENDATIONS.slice(recStart), ...RECOMMENDATIONS.slice(0, recStart)];

  return {
    sent, delivered, deliveredPct, read, readPct, clicks, ctrPct,
    ctaClicks,
    metaInsights: {
      dateRange: "8 Jun – 7 Jul 2026",
      readRate: { thisTemplate: readPct, similar: similarReadPct },
      clickRate: { thisTemplate: ctrPct, similar: similarCtrPct },
      recommendations,
    },
  };
}
