/**
 * triggerNodeUtils.js
 * Derives a structured display object for StartTriggerNode from the config
 * produced by StartTriggerWizard.
 * No React dependencies — independently testable.
 */

function trunc(str, n = 20) {
  if (!str) return "";
  const s = String(str);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── summary for the new wizard config format ──────────────────
// Wizard produces: { kind, triggerGroups: [{ event, conditions, evaluate }],
//   groupsCombinator, exitTrigger: { open, events }, audience, broadcast }

function fmtConditionLine(c) {
  if (!c?.property) return null;
  const hideVal = ["exists", "does not exist", "Exists", "Doesn't Exist"].includes(c.operator);
  const parts = [c.property, c.operator, hideVal ? null : trunc(String(c.value || ""), 14)];
  return parts.filter(Boolean).join(" ");
}

function summariseAudienceNew(audience) {
  if (!audience || audience.include_all) return { whoLine: null, whoExtraCount: 0, frequencyLine: null };

  const tabs = audience.include?.tabs || {};

  // User property conditions
  const propConds = (tabs.property?.conditions || []).filter((c) => c.property);
  if (propConds.length) {
    const first = propConds[0];
    return {
      whoLine: fmtConditionLine(first) || `${first.property}`,
      whoExtraCount: propConds.length - 1,
      frequencyLine: audience.limit_enabled
        ? `Max ${audience.limit_entry?.count ?? 1}× / ${audience.limit_entry?.window ?? 1} ${audience.limit_entry?.unit || "days"}`
        : null,
    };
  }

  // User behavior conditions
  const behConds = (tabs.behavior?.conditions || []).filter((c) => c.event);
  if (behConds.length) {
    const c = behConds[0];
    const q = c.qualifier === "has_not_executed" ? "Has not done" : "Has done";
    return {
      whoLine: `${q} ${c.event}`,
      whoExtraCount: behConds.length - 1,
      frequencyLine: null,
    };
  }

  // Affinity conditions
  const affConds = (tabs.affinity?.conditions || []).filter((c) => c.event);
  if (affConds.length) {
    const c = affConds[0];
    return {
      whoLine: `Affinity: ${c.event}`,
      whoExtraCount: affConds.length - 1,
      frequencyLine: null,
    };
  }

  // Segment
  const segs = (tabs.segment?.segments || []).filter(Boolean);
  if (segs.length) {
    return { whoLine: `In segment "${trunc(segs[0], 16)}"`, whoExtraCount: segs.length - 1, frequencyLine: null };
  }

  return { whoLine: null, whoExtraCount: 0, frequencyLine: null };
}

function summariseExitNew(exitTrigger) {
  if (!exitTrigger?.open) return { exitLine: null, exitExtraCount: 0, noExit: true };
  const events = (exitTrigger.events || []).filter((e) => e.event);
  if (!events.length) return { exitLine: null, exitExtraCount: 0, noExit: true };
  const first = events[0];
  const q = first.qualifier === "has_not_done" ? "Has not done" : "Has done";
  return {
    exitLine: `${q} ${first.event}`,
    exitExtraCount: events.length - 1,
    noExit: false,
  };
}

function summariseBroadcastNew(broadcastCfg) {
  if (!broadcastCfg) return { scheduleLine: null, audienceLine: null };
  const scheduleLine = broadcastCfg.schedule_kind === "scheduled" && broadcastCfg.send_at_date
    ? `${broadcastCfg.send_at_date} ${broadcastCfg.send_at_time || ""}`.trim()
    : "As soon as published";
  const audienceMap = { all: "All users", segment: broadcastCfg.segment || "Segment", known: "Known users", identified: "Engage Identified" };
  const audienceLine = audienceMap[broadcastCfg.audience_kind || "all"] || "All users";
  return { scheduleLine, audienceLine };
}

function summariseNewFormat(config) {
  const isBroadcast = config.kind === "broadcast" ||
    (config.triggerGroups?.[0]?.event || "").toLowerCase().includes("broadcast") ||
    (config.triggerGroups?.[0]?.event || "").toLowerCase().includes("segment") && config.broadcast;

  const rawGroups = config.triggerGroups || [];
  const SHOW_MAX = 3;
  const shownGroups = rawGroups.slice(0, SHOW_MAX);
  const extraGroupCount = Math.max(0, rawGroups.length - SHOW_MAX);

  const triggerGroups = shownGroups.map((group) => {
    const eventName = group.event || "Event";
    const conditions = (group.conditions || []).filter((c) => c.property);
    const firstFilter = conditions.length ? fmtConditionLine(conditions[0]) : null;
    const extraFilterCount = Math.max(0, conditions.length - 1);
    return {
      events: [eventName],
      eventExtra: 0,
      firstFilter,
      extraFilterCount,
      hasEvaluate: (group.evaluate || []).length > 0,
    };
  });

  const { whoLine, whoExtraCount, frequencyLine } = summariseAudienceNew(config.audience);
  const { exitLine, exitExtraCount, noExit } = summariseExitNew(config.exitTrigger);
  const { scheduleLine, audienceLine } = isBroadcast ? summariseBroadcastNew(config.broadcast) : {};

  return {
    headerLabel: isBroadcast ? "Broadcast" : "Start Trigger",
    isBroadcast,
    triggerGroups,
    groupCombinator: config.groupsCombinator || "AND",
    extraGroupCount,
    whoLine,
    whoExtraCount,
    frequencyLine,
    scheduleLine: scheduleLine || null,
    audienceLine: audienceLine || null,
    exitLine,
    exitExtraCount,
    noExitCondition: noExit,
  };
}

// ── legacy format support (saved flows from old FlowTriggerModal) ─
function fmtOp(op) {
  const M = { "is": "is", "equals": "=", "not equals": "≠", "greater than": ">", "less than": "<",
    "between": "between", "contains": "contains", "exists": "exists", "does not exist": "doesn't exist",
    "before": "before", "after": "after", "on": "on" };
  return M[op] || op || "";
}

function fmtVal(value, operator) {
  const hide = ["exists","Exists","does not exist","Doesn't Exist","is true","is false"].includes(operator);
  if (hide || value == null || value === "") return "";
  if (typeof value === "object" && !Array.isArray(value)) return value.name ? `"${trunc(value.name)}"` : "";
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, 2).map((v) => trunc(v, 10)).join(", ");
  return trunc(String(value), 20);
}

function formatFilter(filter) {
  if (!filter?.propertyLabel) return null;
  return [filter.propertyLabel, fmtOp(filter.operator), fmtVal(filter.value, filter.operator)].filter(Boolean).join(" ");
}

function formatCondition(cond) {
  if (!cond) return null;
  switch (cond.type) {
    case "user_property": return cond.attributeLabel ? [cond.attributeLabel, fmtOp(cond.operator), fmtVal(cond.value, cond.operator)].filter(Boolean).join(" ") : null;
    case "user_behavior": return `${cond.executionQualifier === "has_not_executed" ? "Has not executed" : "Has executed"} ${(cond.eventName || "").replace(/_/g, " ")}`;
    case "user_affinity": return `Predominantly ${(cond.affinityDimension || "").toLowerCase().replace(/_/g, " ")} is ${trunc(cond.value || "", 16)}`;
    case "custom_segment": return `In segment "${trunc(cond.segmentName || "segment", 18)}"`;
    default: return null;
  }
}

function summariseOldFormat(config) {
  const isBroadcast = config.headerLabel === "Broadcast" ||
    config.triggerGroups?.[0]?.events?.[0]?.header === "broadcast";

  const rawGroups = config.triggerGroups || [];
  const SHOW_MAX = 3;
  const shownGroups = rawGroups.slice(0, SHOW_MAX);
  const extraGroupCount = Math.max(0, rawGroups.length - SHOW_MAX);

  const triggerGroups = shownGroups.map((group) => {
    const events = (group.events || []).map((e) => e.eventCategory || e.id || "Event");
    let eventDisplay = events;
    let eventExtra = 0;
    if (events.join(" · ").length > 32 && events.length > 1) {
      eventDisplay = [events[0]];
      eventExtra = events.length - 1;
    }
    const filters = (group.filters || []).filter((f) => f.property || f.propertyLabel);
    return {
      events: eventDisplay,
      eventExtra,
      firstFilter: filters.length ? formatFilter(filters[0]) : null,
      extraFilterCount: Math.max(0, filters.length - 1),
      hasEvaluate: !!group.evaluate?.computation,
    };
  });

  let whoLine = null, whoExtraCount = 0;
  if (config.audience) {
    if (config.audience.mode === "all_users") { whoLine = "All users"; }
    else {
      const allConds = (config.audience.filterGroups || []).flatMap((g) => g.conditions || []);
      if (allConds.length) { whoLine = formatCondition(allConds[0]); whoExtraCount = allConds.length - 1; }
    }
  }

  const frequencyLine = config.frequencyCap?.enabled
    ? `Max ${config.frequencyCap.times}× per ${config.frequencyCap.withinUnit || "day"}`
    : null;

  // Broadcast lines
  const scheduleLine = isBroadcast && config.broadcastSchedule ? (() => {
    const s = config.broadcastSchedule;
    if (s.type === "as_soon_as_possible") return "As soon as published";
    if (s.startDate && s.sendTime) {
      const [y, m, d] = s.startDate.split("-");
      const mos = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const h = parseInt(s.sendTime.split(":")[0]);
      return `${parseInt(d)} ${mos[parseInt(m)-1]} ${y} · ${h > 12 ? h-12 : h || 12}:${s.sendTime.split(":")[1]} ${h >= 12 ? "PM" : "AM"}`;
    }
    return "Scheduled";
  })() : null;

  const audienceLine = isBroadcast && config.broadcastAudience ? (() => {
    const a = config.broadcastAudience;
    if (a.sourceType === "all_users") return "All users";
    if (a.sourceType === "segment") return `${trunc(a.segments?.[0]?.segmentName || "Segment", 18)}${a.segments?.length > 1 ? ` +${a.segments.length-1}` : ""}`;
    if (a.sourceType === "csv" || a.sourceType === "direct_csv") return `CSV upload · ${new Intl.NumberFormat("en-IN").format(a.csvFile?.rowCount || 0)} contacts`;
    return "Audience";
  })() : null;

  // Exit
  const exitConds = (config.exitTrigger?.conditions || []).filter((c) => c.event || c.type);
  const exitLine = exitConds.length ? (() => {
    const c = exitConds[0];
    if (c.event) return c.event.replace(/_/g, " ");
    return formatCondition(c);
  })() : null;

  return {
    headerLabel: isBroadcast ? "Broadcast" : "Start Trigger",
    isBroadcast,
    triggerGroups,
    groupCombinator: config.groupCombinator || "AND",
    extraGroupCount,
    whoLine,
    whoExtraCount,
    frequencyLine,
    scheduleLine,
    audienceLine,
    exitLine,
    exitExtraCount: Math.max(0, exitConds.length - 1),
    noExitCondition: !exitLine,
  };
}

// ── main export ───────────────────────────────────────────────
export function summariseTriggerConfig(config) {
  if (!config) return null;
  // Detect new wizard format: triggerGroups have a string `.event` field
  const isNewFormat = config.kind != null ||
    (config.triggerGroups?.[0] != null && typeof config.triggerGroups[0].event === "string");
  return isNewFormat ? summariseNewFormat(config) : summariseOldFormat(config);
}
