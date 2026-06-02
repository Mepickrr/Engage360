import React from "react";
import { Handle, Position } from "reactflow";
import {
  Zap, Radio, ShoppingBag, ShoppingCart, CreditCard, Package,
  Receipt, PackageCheck, Truck, XCircle, RefreshCcw, CornerUpLeft,
  Search, UserPlus, Heart, Star, AlertCircle, Users, UserMinus,
  CheckCircle, LogOut, MessageCircle, Hash, MessageSquare, Mail,
  Cake, Gift, RefreshCw, TrendingDown, Headphones, CheckSquare,
} from "lucide-react";
import { summariseTriggerConfig } from "../triggerNodeUtils";

// ── primary brand color (matches rest of canvas) ──────────────
const PRIMARY = "#6C3AE8";

// ── event category → lucide icon ─────────────────────────────
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

// ── small shared sub-components ───────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1.5">
      {children}
    </div>
  );
}

function MutedLine({ children }) {
  return <div className="text-[10px] text-text-muted leading-relaxed">{children}</div>;
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px bg-border" />
      {label && <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted flex-shrink-0">{label}</span>}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CombinatorPill({ label }) {
  return (
    <div className="flex items-center gap-1 my-1 ml-0.5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted px-1.5 py-0.5 border border-border rounded-full">
        {label}
      </span>
    </div>
  );
}

// ── one trigger group row ─────────────────────────────────────
function TriggerGroupRow({ group }) {
  const firstEventId = group.events[0]?.toLowerCase().replace(/[\s-]/g, "_") || "default";
  const Icon = getEventIcon(firstEventId);

  const evLabel = group.events.join(" · ") + (group.eventExtra > 0 ? ` +${group.eventExtra} more` : "");

  return (
    <div className="flex items-start gap-2 py-0.5">
      {/* Event icon */}
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: PRIMARY + "18" }}
      >
        <Icon className="w-3 h-3" style={{ color: PRIMARY }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] font-semibold text-text-primary leading-tight">
            {evLabel}
          </span>
          {group.hasEvaluate && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-medium text-text-muted border border-border">
              ◎ Evaluate
            </span>
          )}
        </div>
        {group.firstFilter && (
          <div className="text-[10px] text-text-secondary leading-tight mt-0.5 truncate">
            {group.firstFilter}
            {group.extraFilterCount > 0 && (
              <span className="text-text-muted ml-1">· +{group.extraFilterCount} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── main node ─────────────────────────────────────────────────
export default function StartTriggerNode({ data, selected }) {
  const config  = data?.config;
  const onEdit  = data?.onEdit;
  const summary = summariseTriggerConfig(config);

  // Fallback when not yet configured
  if (!summary) {
    return (
      <div
        data-testid="rf-start-trigger-node"
        className={`w-[260px] bg-white border-2 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`}
        style={{ borderColor: PRIMARY }}
        onClick={onEdit}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="w-8 h-8 rounded-md flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Trigger</div>
            <div className="text-[13px] font-semibold text-text-primary">Start Trigger</div>
            <div className="text-[10px] text-text-muted">Click to configure</div>
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: PRIMARY, width: 8, height: 8 }} />
      </div>
    );
  }

  const HeaderIcon = summary.isBroadcast ? Radio : Zap;
  const hasExit = !summary.noExitCondition && summary.exitLine;
  const hasBroadcast = summary.isBroadcast && (summary.scheduleLine || summary.audienceLine);

  return (
    <div
      data-testid="rf-start-trigger-node"
      className={`w-[260px] bg-white border-2 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ borderColor: PRIMARY }}
      onClick={onEdit}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: PRIMARY }}
        >
          <HeaderIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: PRIMARY }}>
            Trigger
          </div>
          <div className="text-[13px] font-semibold text-text-primary">
            {summary.headerLabel}
          </div>
        </div>
      </div>

      {/* ── Entry section ──────────────────────────────────── */}
      <div className="px-3 py-2.5 space-y-1.5">
        <SectionLabel>A user will enter this flow when</SectionLabel>

        {/* Standard flow — trigger groups */}
        {!summary.isBroadcast && (
          <div className="space-y-0.5">
            {summary.triggerGroups.map((group, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <CombinatorPill label={summary.groupCombinator} />}
                <TriggerGroupRow group={group} />
              </React.Fragment>
            ))}
            {summary.extraGroupCount > 0 && (
              <MutedLine>+{summary.extraGroupCount} more trigger group{summary.extraGroupCount > 1 ? "s" : ""}</MutedLine>
            )}
          </div>
        )}

        {/* Broadcast flow — schedule + audience */}
        {summary.isBroadcast && hasBroadcast && (
          <div className="space-y-0.5">
            {summary.scheduleLine && (
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
                <span className="text-[11px] font-semibold text-text-primary">{summary.scheduleLine}</span>
              </div>
            )}
            {summary.audienceLine && (
              <MutedLine>{summary.audienceLine}</MutedLine>
            )}
          </div>
        )}

        {/* WHO line */}
        {summary.whoLine && (
          <div className="flex items-center gap-1 pt-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted flex-shrink-0 mr-0.5">WHO</span>
            <span className="text-[10px] text-text-secondary truncate">{summary.whoLine}</span>
            {summary.whoExtraCount > 0 && (
              <span className="text-[10px] text-text-muted flex-shrink-0">· +{summary.whoExtraCount} more</span>
            )}
          </div>
        )}

        {/* Frequency line */}
        {summary.frequencyLine && (
          <MutedLine>{summary.frequencyLine}</MutedLine>
        )}
      </div>

      {/* ── Exit section (only if exit is configured) ──────── */}
      {hasExit && (
        <>
          <Divider label="Exit condition" />
          <div className="px-3 pb-2.5 space-y-1.5">
            <SectionLabel>A user will exit this flow when</SectionLabel>
            <div className="text-[10px] text-text-secondary leading-relaxed truncate">
              {summary.exitLine}
              {summary.exitExtraCount > 0 && (
                <span className="text-text-muted ml-1">· +{summary.exitExtraCount} more</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bottom output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: PRIMARY, width: 8, height: 8 }}
      />
    </div>
  );
}
