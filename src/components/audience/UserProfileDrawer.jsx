import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  Smartphone,
  MessageSquare,
  Mail,
  Phone,
  Layers,
  Info,
  MessageCircle,
} from "lucide-react";

/* ─── helpers ─── */
function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function timeBetween(a, b) {
  const diff = Math.abs(new Date(b) - new Date(a));
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m gap`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h gap`;
  return `${Math.floor(hrs / 24)}d gap`;
}

/* ─── sub-components ─── */
function Field({ label, value }) {
  const muted = !value || value === "N/A" || value === "" || value === "—";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-text-muted font-medium">{label}</span>
      <span className={`text-[13px] ${muted ? "text-text-muted" : "text-text-primary"}`}>
        {muted ? "N/A" : value}
      </span>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-border py-3 px-2">
      <span className="text-[18px] font-bold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-muted mt-0.5">{label}</span>
    </div>
  );
}

const CHANNEL_CONFIG = [
  { key: "webPush", label: "Web Push", icon: Bell, color: "#6C3AE8" },
  { key: "mobilePush", label: "Mobile Push", icon: Smartphone, color: "#3B82F6" },
  { key: "inapp", label: "In-app", icon: MessageSquare, color: "#8B5CF6" },
  { key: "email", label: "Email", icon: Mail, color: "#10B981" },
  { key: "sms", label: "SMS", icon: MessageSquare, color: "#F59E0B" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { key: "rcs", label: "RCS", icon: Layers, color: "#14B8A6" },
  { key: "call", label: "Call", icon: Phone, color: "#EC4899" },
];

function ReachabilityCard({ channel, status }) {
  const subscribed = status === "subscribed";
  const Icon = channel.icon;
  return (
    <div className="bg-white border border-border rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Icon style={{ color: channel.color }} className="w-4 h-4 flex-shrink-0" />
        <span className="text-[12px] font-semibold text-text-primary">{channel.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: subscribed ? "#10B981" : "#EF4444" }}
        />
        <span className="text-[10px] text-text-muted">{subscribed ? "Subscribed" : "Not subscribed"}</span>
      </div>
      <button
        type="button"
        className="text-[11px] border border-[#6C3AE8] text-[#6C3AE8] rounded px-2 py-0.5 w-fit hover:bg-[#6C3AE8]/5 transition-colors"
      >
        Test Now
      </button>
    </div>
  );
}

function CollapsibleSection({ title, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2 hover:bg-slate-50/60 rounded px-1 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        )}
        <span className="text-[13px] font-semibold text-text-primary flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] bg-slate-100 text-text-muted rounded-full px-1.5 py-0.5">{count}</span>
        )}
      </button>
      {open && <div className="mt-1 pl-5">{children}</div>}
    </div>
  );
}

function KVTable({ rows }) {
  return (
    <table className="w-full text-[12px]">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b border-border last:border-0">
            <td className="py-1.5 pr-3 text-text-muted font-medium w-1/2">{k}</td>
            <td className="py-1.5 text-text-primary">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const DOT_COLOR_MAP = {
  blue: "#3B82F6",
  green: "#10B981",
  gray: "#94A3B8",
  orange: "#F59E0B",
};

function EventRow({ event }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="w-full flex items-start gap-3 py-2.5 hover:bg-slate-50/60 rounded-lg px-2 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[10px] text-text-muted whitespace-nowrap mt-0.5 w-[120px] flex-shrink-0">
          {formatTimestamp(event.timestamp)}
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: DOT_COLOR_MAP[event.dotColor] || "#94A3B8" }}
        />
        <span className="text-[13px] font-semibold text-text-primary flex-1">{event.name}</span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="mx-2 mb-3 bg-white border border-border rounded-lg p-3 grid grid-cols-2 gap-4 text-[12px]">
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-text-muted font-medium">Event Source</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="bg-[#6C3AE8]/10 text-[#6C3AE8] text-[10px] font-bold px-1.5 py-0.5 rounded">mo</span>
                <span className="text-text-primary">{event.source}</span>
              </div>
            </div>
            <div>
              <span className="text-text-muted font-medium">Platform</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Layers className="w-3 h-3 text-text-muted" />
                <span className="text-text-primary">{event.platform}</span>
              </div>
            </div>
            <div>
              <span className="text-text-muted font-medium">Event type</span>
              <div className="text-text-primary mt-0.5">{event.eventType}</div>
            </div>
          </div>
          <div>
            <KVTable rows={event.details.map((d) => [d.key, d.value])} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab 1: User Properties ─── */
function UserPropertiesTab({ user }) {
  return (
    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
      {/* Section A: Basic Details */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-3">Basic Details</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="First Name" value={user.firstName} />
          <Field label="Last Name" value={user.lastName} />
          <Field label="WhatsApp Username" value={user.whatsappUsername} />
          <Field label="Email" value={user.email} />
          <Field label="Mobile Number" value={user.mobile} />
          <Field label="Mobile Number (Enc)" value={user.mobileEnc} />
          <Field label="Engage ID" value={user.engageId} />
          <Field label="Audience Type" value={user.audienceType} />
          <Field label="Gender" value={user.gender} />
          <Field label="Birth Date" value={user.birthDate} />
          <Field label="Anniversary" value={user.anniversary} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Section B: Customer Lifecycle */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-3">Customer Lifecycle</h3>
        <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3">
          <StatCard label="Last Active" value={user.lastActive} />
          <StatCard label="Total Sessions" value={user.totalSessions} />
          <StatCard label="LTV" value={user.ltv} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Section C: Reachability */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Reachability</h3>
          <Info className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CHANNEL_CONFIG.map((ch) => (
            <ReachabilityCard key={ch.key} channel={ch} status={user.reachability?.[ch.key] || "not_subscribed"} />
          ))}
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Section D: User Properties collapsible subsections */}
      <section>
        <h3 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-3">User Properties</h3>

        <CollapsibleSection title="Tracked Custom Attributes" count={user.trackedAttrs?.length}>
          <KVTable rows={(user.trackedAttrs || []).map((a) => [a.name, String(a.value)])} />
        </CollapsibleSection>

        <CollapsibleSection title="Engage Prediction" count={5}>
          <KVTable
            rows={[
              ["Best send time Email", user.engagePrediction?.email || "—"],
              ["Best send time WhatsApp", user.engagePrediction?.whatsapp || "—"],
              ["Best send time RCS", user.engagePrediction?.rcs || "—"],
              ["Best send time Push", user.engagePrediction?.push || "—"],
              ["Best send time SMS", user.engagePrediction?.sms || "—"],
            ]}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Shiprocket Buyer Tags" count={9}>
          {(() => {
            const bt = user.buyerTags || {};
            const boolTags = [];
            if (bt.weekendShopper) boolTags.push("Weekend Shopper");
            if (bt.fullPriceAverse) boolTags.push("Full Price Averse");
            if (bt.bargainHunter) boolTags.push("Bargain Hunter");
            if (bt.valueSeeker) boolTags.push("Value Seeker");
            if (bt.highValueShopper) boolTags.push("High Value Shopper");
            return (
              <div className="space-y-2">
                {boolTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {boolTags.map((t) => (
                      <span key={t} className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <KVTable
                  rows={[
                    ["Gender", bt.gender || "—"],
                    ["Preferred Category", bt.preferredCategory || "—"],
                    ["RTO Risk", bt.rtoRisk || "—"],
                    ["Discount Affinity", bt.discountAffinity || "—"],
                  ]}
                />
              </div>
            );
          })()}
        </CollapsibleSection>

        <CollapsibleSection title="Lifecycle" count={2}>
          <KVTable
            rows={[
              ["First Seen", user.lifecycle?.firstSeen || "—"],
              ["Last Seen", user.lifecycle?.lastSeen || "—"],
            ]}
          />
        </CollapsibleSection>
      </section>
    </div>
  );
}

/* ─── Tab 2: Event Activity ─── */
function EventActivityTab({ user }) {
  const events = user.events || [];
  return (
    <div className="overflow-y-auto flex-1 px-5 py-4">
      <div className="space-y-0">
        {events.map((event, idx) => (
          <div key={event.id}>
            {idx > 0 && (
              <div className="flex items-center gap-2 py-1 px-2">
                <div className="flex-1 border-t border-dashed border-border" />
                <span className="text-[10px] text-text-muted whitespace-nowrap">
                  {timeBetween(events[idx - 1].timestamp, event.timestamp)}
                </span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
            )}
            <EventRow event={event} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 w-full border border-border rounded-lg py-2 text-[13px] text-text-secondary hover:bg-slate-50 transition-colors"
      >
        Fetch More
      </button>
    </div>
  );
}

/* ─── Main Drawer ─── */
export default function UserProfileDrawer({ user, onClose }) {
  const [activeTab, setActiveTab] = useState("properties");
  const [actionsOpen, setActionsOpen] = useState(false);

  useEffect(() => {
    if (user) setActiveTab("properties");
  }, [user?.id]);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isOpen = !!user;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.35)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full bg-surface border-l border-border flex flex-col"
        style={{
          width: 680,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        }}
      >
        {user && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-bold text-text-primary">{user.name}</span>
                      <span
                        className="text-[10px] font-medium rounded-full px-2 py-0.5"
                        style={
                          user.audienceType === "Engage360 Identified"
                            ? { backgroundColor: "#EDE9FF", color: "#6C3AE8" }
                            : { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
                        }
                      >
                        {user.audienceType}
                      </span>
                    </div>
                    <div className="text-[12px] text-text-muted mt-0.5">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionsOpen(!actionsOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-border rounded-md hover:bg-slate-50 transition-colors text-text-secondary"
                    >
                      Actions
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {actionsOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-border rounded-lg shadow-lg z-10 py-1">
                        {["Export Profile", "Add to Segment", "Block User", "Send Campaign"].map((a) => (
                          <button
                            key={a}
                            type="button"
                            className="w-full text-left px-3 py-2 text-[12px] text-text-primary hover:bg-slate-50"
                            onClick={() => setActionsOpen(false)}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors text-text-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 mt-4 border-b border-border -mb-[1px]">
                {[
                  { key: "properties", label: "User properties" },
                  { key: "events", label: "Event activity" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className="px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px"
                    style={
                      activeTab === tab.key
                        ? { borderColor: "#6C3AE8", color: "#6C3AE8" }
                        : { borderColor: "transparent", color: "#94A3B8" }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "properties" ? (
              <UserPropertiesTab user={user} />
            ) : (
              <EventActivityTab user={user} />
            )}
          </>
        )}
      </div>
    </>
  );
}
