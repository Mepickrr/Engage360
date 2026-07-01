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
// Wizard produces: { kind, triggerGroups: [{ event, conditions, evaluate, evaluateTime, combinator }],
//   groupsCombinator, exitTrigger: { open, events: [{ qualifier, event, conditions }] }, audience, broadcast }

function fmtConditionLine(c) {
  if (!c?.property) return null;
  const hideVal = ["exists", "does not exist", "Exists", "Doesn't Exist"].includes(c.operator);
  const parts = [c.property, c.operator, hideVal ? null : trunc(String(c.value || ""), 14)];
  return parts.filter(Boolean).join(" ");
}

function summariseAudienceNew(audience) {
  if (!audience || audience.include_all) {
    return {
      whoLine: null,
      whoExtraCount: 0,
      frequencyLine: null,
      audienceTypePill: audience?.include_all ? "All Users" : null,
      audienceTab: null,
      audienceConditions: [],
      audienceCombinator: "AND",
    };
  }

  const kindMap = { all: "All Users", known: "Known Users", identified: "Engage Identified", custom: "Custom" };
  const audienceTypePill = kindMap[audience.audience_kind] || (audience.include_all ? "All Users" : null);

  const frequencyLine = audience.limit_enabled
    ? `Max ${audience.limit_entry?.count ?? 1}× / ${audience.limit_entry?.window ?? 1} ${audience.limit_entry?.unit || "days"}`
    : null;

  // ── New blocks format ─────────────────────────────────────────
  const blocks = audience.include?.blocks;
  if (blocks?.length) {
    const blocksCombinator = audience.include.blocksCombinator || "AND";
    const allLines = [];
    for (const block of blocks) {
      if (block.type === "segment") {
        const segs = (block.segments || []).filter(Boolean);
        segs.slice(0, 2).forEach((s) => allLines.push(`In segment "${trunc(s, 16)}"`));
      } else if (block.type === "affinity") {
        (block.conditions || []).filter((c) => c.event).slice(0, 2).forEach((c) => allLines.push(`Affinity: ${c.event}`));
      } else if (block.type === "behavior") {
        (block.conditions || []).filter((c) => c.event).slice(0, 2).forEach((c) => {
          const q = c.qualifier === "has_not_executed" ? "Has not done" : "Has done";
          allLines.push(`${q} ${c.event}`);
        });
      } else {
        (block.conditions || []).filter((c) => c.property).slice(0, 2).forEach((c) => {
          const line = fmtConditionLine(c);
          if (line) allLines.push(line);
        });
      }
    }
    const shown = allLines.slice(0, 4);
    return {
      whoLine: shown[0] || null,
      whoExtraCount: Math.max(0, allLines.length - 1),
      frequencyLine,
      audienceTypePill,
      audienceTab: blocks[0]?.type || null,
      audienceConditions: shown,
      audienceCombinator: blocksCombinator,
    };
  }

  // ── Legacy tabs format ────────────────────────────────────────
  const tabs = audience.include?.tabs || {};

  // User property conditions
  const propConds = (tabs.property?.conditions || []).filter((c) => c.property);
  if (propConds.length) {
    const lines = propConds.slice(0, 4).map((c) => fmtConditionLine(c) || c.property).filter(Boolean);
    return {
      whoLine: lines[0] || null,
      whoExtraCount: propConds.length - 1,
      frequencyLine,
      audienceTypePill,
      audienceTab: "property",
      audienceConditions: lines,
      audienceCombinator: tabs.property?.combinator || "AND",
    };
  }

  // User behavior conditions
  const behConds = (tabs.behavior?.conditions || []).filter((c) => c.event);
  if (behConds.length) {
    const lines = behConds.slice(0, 4).map((c) => {
      const q = c.qualifier === "has_not_executed" ? "Has not done" : "Has done";
      return `${q} ${c.event}`;
    });
    return {
      whoLine: lines[0] || null,
      whoExtraCount: behConds.length - 1,
      frequencyLine,
      audienceTypePill,
      audienceTab: "behavior",
      audienceConditions: lines,
      audienceCombinator: tabs.behavior?.combinator || "AND",
    };
  }

  // Affinity conditions
  const affConds = (tabs.affinity?.conditions || []).filter((c) => c.event);
  if (affConds.length) {
    const lines = affConds.slice(0, 4).map((c) => `Affinity: ${c.event}`);
    return {
      whoLine: lines[0] || null,
      whoExtraCount: affConds.length - 1,
      frequencyLine,
      audienceTypePill,
      audienceTab: "affinity",
      audienceConditions: lines,
      audienceCombinator: tabs.affinity?.combinator || "AND",
    };
  }

  // Segment
  const segs = (tabs.segment?.segments || []).filter(Boolean);
  if (segs.length) {
    const lines = segs.slice(0, 4).map((s) => `In segment "${trunc(s, 16)}"`);
    return {
      whoLine: lines[0] || null,
      whoExtraCount: segs.length - 1,
      frequencyLine,
      audienceTypePill,
      audienceTab: "segment",
      audienceConditions: lines,
      audienceCombinator: "OR",
    };
  }

  return {
    whoLine: null,
    whoExtraCount: 0,
    frequencyLine,
    audienceTypePill,
    audienceTab: null,
    audienceConditions: [],
    audienceCombinator: "AND",
  };
}

function summariseExitNew(exitTrigger) {
  if (!exitTrigger?.open) return { exitLine: null, exitExtraCount: 0, noExit: true, exitEvents: [], exitCombinator: "OR" };
  const events = (exitTrigger.events || []).filter((e) => e.event);
  if (!events.length) return { exitLine: null, exitExtraCount: 0, noExit: true, exitEvents: [], exitCombinator: "OR" };
  const lines = events.slice(0, 4).map((e) => {
    const q = e.qualifier === "has_not_done" ? "Has not done" : "Has done";
    return `${q} ${e.event}`;
  });
  return {
    exitLine: lines[0] || null,
    exitExtraCount: events.length - 1,
    noExit: false,
    exitEvents: lines,
    exitCombinator: exitTrigger.combinator || "OR",
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
    const allFilters = conditions.map((c) => fmtConditionLine(c)).filter(Boolean);
    const firstFilter = allFilters[0] || null;
    const extraFilterCount = Math.max(0, allFilters.length - 1);
    return {
      events: [eventName],
      eventExtra: 0,
      firstFilter,
      extraFilterCount,
      allFilters,
      filterCombinator: group.combinator || "AND",
      hasEvaluate: !!group.evaluate?.value,
      evaluateLine: (group.evaluateTime?.value > 0 && group.evaluate?.value)
        ? `Evaluate: ${group.evaluate.value}`
        : (group.evaluateTime?.value > 0)
        ? `Evaluate within ${group.evaluateTime.value} ${group.evaluateTime.unit}`
        : null,
    };
  });

  const { whoLine, whoExtraCount, frequencyLine, audienceTypePill, audienceTab, audienceConditions, audienceCombinator } = summariseAudienceNew(config.audience);
  const { exitLine, exitExtraCount, noExit, exitEvents, exitCombinator } = summariseExitNew(config.exitTrigger);
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
    audienceTypePill: audienceTypePill || null,
    audienceTab: audienceTab || null,
    audienceConditions: audienceConditions || [],
    audienceCombinator: audienceCombinator || "AND",
    exitEvents: exitEvents || [],
    exitCombinator: exitCombinator || "OR",
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
    const allFilters = filters.map((f) => formatFilter(f)).filter(Boolean);
    return {
      events: eventDisplay,
      eventExtra,
      firstFilter: allFilters[0] || null,
      extraFilterCount: Math.max(0, allFilters.length - 1),
      allFilters,
      filterCombinator: group.combinator || "AND",
      hasEvaluate: !!group.evaluate?.computation,
    };
  });

  let whoLine = null, whoExtraCount = 0, audienceTypePill = null, audienceTab = null, audienceConditions = [];
  if (config.audience) {
    if (config.audience.mode === "all_users") {
      whoLine = "All users";
      audienceTypePill = "All Users";
    } else {
      const allConds = (config.audience.filterGroups || []).flatMap((g) => g.conditions || []);
      if (allConds.length) {
        whoLine = formatCondition(allConds[0]);
        whoExtraCount = allConds.length - 1;
        audienceConditions = allConds.slice(0, 3).map(formatCondition).filter(Boolean);
        // Detect tab from condition types
        const firstType = allConds[0]?.type;
        if (firstType === "user_property") audienceTab = "property";
        else if (firstType === "user_behavior") audienceTab = "behavior";
        else if (firstType === "user_affinity") audienceTab = "affinity";
        else if (firstType === "custom_segment") audienceTab = "segment";
      }
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
  const exitEvents = exitConds.slice(0, 4).map((c) => {
    if (c.event) return c.event.replace(/_/g, " ");
    return formatCondition(c);
  }).filter(Boolean);

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
    audienceTypePill,
    audienceTab,
    audienceConditions,
    audienceCombinator: "AND",
    exitEvents,
    exitCombinator: "OR",
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
