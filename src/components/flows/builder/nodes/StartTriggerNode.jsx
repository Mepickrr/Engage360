import React from "react";
import { Handle, Position } from "reactflow";
import {
  Zap, Radio, ShoppingBag, ShoppingCart, CreditCard, Package,
  Receipt, PackageCheck, Truck, XCircle, RefreshCcw, CornerUpLeft,
  Search, UserPlus, Heart, Star, AlertCircle, Users, UserMinus,
  CheckCircle, LogOut, MessageCircle, Hash, MessageSquare, Mail,
  Cake, Gift, RefreshCw, TrendingDown, Headphones, CheckSquare,
  Pencil, Clock,
} from "lucide-react";
import { summariseTriggerConfig } from "../triggerNodeUtils";

const PRIMARY = "#6C3AE8";

const EVENT_ICONS = {
  product_viewed:               ShoppingBag,
  add_to_cart:                  ShoppingCart,
  purchased_a_product:          CreditCard,
  order_placed:                 Package,
  checkout_started:             Receipt,
  cart_abandoned:               ShoppingCart,
  product_abandoned:            ShoppingBag,
  order_cancelled:              XCircle,
  order_delivered:              PackageCheck,
  product_delivered:            PackageCheck,
  order_shipped:                Truck,
  out_for_delivery:             Truck,
  refund_issued:                RefreshCcw,
  returned:                     CornerUpLeft,
  keyword_search:               Search,
  sign_up:                      UserPlus,
  added_to_wishlist:            Heart,
  review_created:               Star,
  order_delay:                  AlertCircle,
  segment_entry:                Users,
  segment_exit:                 UserMinus,
  flow_completed:               CheckCircle,
  flow_exited_early:            LogOut,
  whatsapp_message_received:    MessageCircle,
  keyword_match:                Hash,
  dm_received:                  MessageSquare,
  comment_received:             MessageSquare,
  email_received:               Mail,
  birthday:                     Cake,
  anniversary:                  Gift,
  back_in_stock:                RefreshCw,
  price_drop:                   TrendingDown,
  task_created:                 Headphones,
  task_closed:                  CheckSquare,
  broadcast:                    Radio,
  default:                      Zap,
};

function getEventIcon(eventId) {
  if (!eventId) return Zap;
  const key = eventId.toLowerCase().replace(/[\s-]/g, "_");
  return EVENT_ICONS[key] || Zap;
}

// ── Section label row (supports right-side slot) ─────────────
function SectionLabel({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
        {children}
      </span>
      {right}
    </div>
  );
}

// ── Inter-group combinator (between trigger groups) ───────────
function GroupCombinator({ label }) {
  return (
    <div className="flex items-center gap-2 my-1.5">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 px-2 py-0.5 border border-slate-200 rounded-full bg-white">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ── Conditions list with tree-connector AND/OR ────────────────
function ConditionTree({ conditions, combinator, accent = "#6366F1" }) {
  if (!conditions?.length) return null;
  return (
    <div
      className="mt-1.5 ml-1 pl-3 relative"
      style={{ borderLeft: `2px solid ${accent}22` }}
    >
      {conditions.map((cond, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div
              className="flex items-center my-1"
              style={{ marginLeft: -13 }}
            >
              <span
                className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-white"
                style={{
                  color: accent,
                  borderColor: `${accent}44`,
                  letterSpacing: "0.08em",
                }}
              >
                {combinator}
              </span>
            </div>
          )}
          <div className="text-[10px] text-text-secondary leading-snug py-0.5 truncate">
            {cond}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Conditions for exit (rose accent) ────────────────────────
function ExitConditionTree({ conditions, combinator }) {
  if (!conditions?.length) return null;
  return (
    <div className="mt-1 ml-1 pl-3 relative" style={{ borderLeft: "2px solid #FCA5A522" }}>
      {conditions.map((cond, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div className="flex items-center my-1" style={{ marginLeft: -13 }}>
              <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-white text-rose-400 border-rose-200">
                {combinator}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 py-0.5">
            <LogOut className="w-3 h-3 text-rose-400 flex-shrink-0" />
            <span className="text-[10px] text-rose-600 truncate">{cond}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── One trigger group ─────────────────────────────────────────
function TriggerGroupRow({ group }) {
  const firstEventId = group.events[0]?.toLowerCase().replace(/[\s-]/g, "_") || "default";
  const Icon = getEventIcon(firstEventId);
  const evLabel = group.events.join(" · ") + (group.eventExtra > 0 ? ` +${group.eventExtra} more` : "");
  const allFilters = group.allFilters?.length ? group.allFilters : (group.firstFilter ? [group.firstFilter] : []);

  return (
    <div>
      {/* Event row */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: PRIMARY + "18" }}
        >
          <Icon className="w-3 h-3" style={{ color: PRIMARY }} />
        </div>
        <span className="text-[11px] font-semibold text-text-primary leading-tight flex-1 min-w-0 truncate">
          {evLabel}
        </span>
        {group.hasEvaluate && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-[8px] font-medium text-text-muted border border-border flex-shrink-0">
            ◎ Eval
          </span>
        )}
      </div>

      {/* Conditions with tree connector */}
      {allFilters.length > 0 && (
        <ConditionTree
          conditions={allFilters}
          combinator={group.filterCombinator || "AND"}
          accent={PRIMARY}
        />
      )}
    </div>
  );
}

// ── Audience type pill ────────────────────────────────────────
function getAudiencePillStyle(pill) {
  if (pill === "Engage Identified") return { bg: "#EDE9FE", color: "#6C3AE8" };
  if (pill === "Known Users")       return { bg: "#DBEAFE", color: "#1D4ED8" };
  if (pill === "Custom")            return { bg: "#FEF9C3", color: "#92400E" };
  return { bg: "#F1F5F9", color: "#64748B" };
}

// ── Main node ─────────────────────────────────────────────────
export default function StartTriggerNode({ data, selected }) {
  const config  = data?.config;
  const onEdit  = data?.onEdit;
  const summary = summariseTriggerConfig(config);

  if (!summary) {
    return (
      <div
        data-testid="rf-start-trigger-node"
        className={`w-[268px] bg-white border-2 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`}
        style={{ borderColor: PRIMARY }}
        onClick={onEdit}
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Trigger</div>
            <div className="text-[13px] font-semibold text-text-primary">Start Trigger</div>
            <div className="text-[10px] text-text-muted mt-0.5">Click to configure</div>
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: PRIMARY, width: 8, height: 8 }} />
      </div>
    );
  }

  const hasExit      = !summary.noExitCondition && (summary.exitEvents?.length > 0 || summary.exitLine);
  const exitLines    = summary.exitEvents?.length > 0 ? summary.exitEvents : (summary.exitLine ? [summary.exitLine] : []);
  const hasBroadcast = summary.isBroadcast && (summary.scheduleLine || summary.audienceLine);
  const pillLabel    = summary.audienceTypePill || (summary.whoLine === "All users" ? "All Users" : null);
  const pillStyle    = getAudiencePillStyle(pillLabel);
  const condLines    = summary.audienceConditions?.length > 0 ? summary.audienceConditions : (summary.whoLine ? [summary.whoLine] : []);

  return (
    <div
      data-testid="rf-start-trigger-node"
      className={`w-[268px] bg-white rounded-xl shadow-md transition-all ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ border: `1.5px solid ${PRIMARY}22` }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-xl"
        style={{ background: `linear-gradient(135deg, ${PRIMARY}, #8B5CF6)` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white">
            {summary.isBroadcast ? "Broadcast" : "Start Trigger"}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="w-6 h-6 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Pencil className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* ── Entry ── */}
      <div className="px-3 pt-2.5 pb-2">
        <SectionLabel>Entry</SectionLabel>

        {!summary.isBroadcast && (
          <div>
            {summary.triggerGroups.map((group, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <GroupCombinator label={summary.groupCombinator} />}
                <TriggerGroupRow group={group} />
              </React.Fragment>
            ))}
            {summary.extraGroupCount > 0 && (
              <div className="text-[10px] text-text-muted mt-1.5">
                +{summary.extraGroupCount} more trigger group{summary.extraGroupCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {summary.isBroadcast && hasBroadcast && (
          <div className="space-y-1">
            {summary.scheduleLine && (
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
                <span className="text-[11px] font-semibold text-text-primary">{summary.scheduleLine}</span>
              </div>
            )}
            {summary.audienceLine && (
              <div className="text-[10px] text-text-muted">{summary.audienceLine}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Audience ── */}
      <div className="mx-3 mb-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
        <SectionLabel
          right={
            summary.frequencyLine ? (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-[9px] font-semibold text-violet-600">
                <Clock className="w-2.5 h-2.5" />
                {summary.frequencyLine}
              </div>
            ) : null
          }
        >
          Audience
        </SectionLabel>

        {/* Type pill */}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: pillStyle.bg, color: pillStyle.color }}
        >
          {pillLabel || "All Users"}
        </span>

        {/* Conditions with tree connector */}
        {condLines.length > 0 && (
          <ConditionTree
            conditions={condLines}
            combinator={summary.audienceCombinator || "AND"}
            accent="#6366F1"
          />
        )}
      </div>

      {/* ── Exit ── */}
      {hasExit && (
        <div className="mx-3 mb-2.5 rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-2">
          <SectionLabel>Exit when</SectionLabel>
          <ExitConditionTree
            conditions={exitLines}
            combinator={summary.exitCombinator || "OR"}
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: PRIMARY, width: 8, height: 8 }}
      />
    </div>
  );
}
