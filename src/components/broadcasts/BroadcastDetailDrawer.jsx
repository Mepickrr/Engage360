import React, { useEffect, useRef, useState } from "react";
import {
  MessageCircle, Mail, ChevronUp, ChevronLeft, ChevronRight, Maximize2, ExternalLink, Download, Send, ArrowRight, RefreshCw,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { FAILURE_REASONS, CATEGORY_META } from "./data";

const num = (n) => Number(n).toLocaleString("en-IN");
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : "0.0");
const rupees = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rupeesShort = (n) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
};

const STATUS_STYLES = {
  completed: { label: "Completed", bg: "bg-emerald-50", fg: "text-emerald-800", dot: "bg-emerald-600" },
  running: { label: "Running", bg: "bg-blue-50", fg: "text-blue-800", dot: "bg-blue-600" },
  scheduled: { label: "Scheduled", bg: "bg-amber-50", fg: "text-amber-800", dot: "bg-amber-500" },
};

export function BroadcastStatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.completed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${s.bg} ${s.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function WhatsAppPill() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-700">
      <MessageCircle className="w-3.5 h-3.5" />
      WhatsApp
    </span>
  );
}

function Section({ title, right, children, testId }) {
  return (
    <section className="px-6 py-5 border-b border-slate-200" data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[12px] text-slate-400 mb-1">{label}</div>
      <div className="text-[14px] font-semibold text-slate-900">{children}</div>
    </div>
  );
}

function FunnelRow({ label, value, max, note, shade }) {
  const width = max ? Math.max((value / max) * 100, value ? 1.5 : 0) : 0;
  return (
    <div className="grid grid-cols-[72px_1fr_84px_112px] items-center gap-3 py-1.5">
      <span className="text-[13px] font-semibold text-slate-900">{label}</span>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: shade }} />
      </div>
      <span className="text-[14px] font-semibold text-slate-900 tabular-nums text-right">{num(value)}</span>
      <span className="text-[11px] text-slate-400 text-right whitespace-nowrap">{note}</span>
    </div>
  );
}

const FAILURE_SHADES = ["#7C6CF0", "#C4BBF7", "#B3A8F5", "#C9C1F8", "#D9D3FA", "#E5E1FC"];

function renderBody(text) {
  return text.split(/(\*[^*\n]+\*|{{[^}]+}}|\n)/g).map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^{{[^}]+}}$/.test(part))
      return (
        <span key={i} className="px-1 rounded bg-indigo-50 text-indigo-600 font-mono text-[12px]">
          {part}
        </span>
      );
    return part;
  });
}

function MessagePreview({ preview, large }) {
  const { banner } = preview;
  return (
    <div className={`rounded-xl bg-[#E9E3DC] p-3 ${large ? "w-full" : "max-w-[300px]"}`}>
      <div className="text-center text-[11px] font-semibold text-slate-500 tracking-wide mb-2">TODAY</div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div
          className="m-1.5 rounded-lg h-[130px] flex flex-col items-center justify-center text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${banner.from}, ${banner.to})` }}
        >
          <span className="text-[28px] font-extrabold text-amber-300 leading-none drop-shadow">{banner.headline}</span>
          <span className="mt-2 px-2.5 py-0.5 rounded-full border border-white/70 text-[10px] text-white">{banner.tag}</span>
          <span className="absolute bottom-2 left-3 text-lg">🪔</span>
          <span className="absolute top-2 right-3 text-lg">✨</span>
        </div>
        <div className="px-3 pt-1.5 pb-1 text-[13px] text-slate-800 leading-relaxed">{renderBody(preview.body)}</div>
        <div className="px-3 pb-1.5 text-right text-[10px] text-slate-400">now</div>
        <div className="border-t border-slate-100 py-2.5 flex items-center justify-center gap-1.5 text-[13px] font-medium text-sky-600">
          <ExternalLink className="w-3.5 h-3.5" />
          {preview.button}
        </div>
      </div>
    </div>
  );
}

const spentOf = (t) => t.delivered * t.rate;

function CategoryChip({ category, small }) {
  const c = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${c.bg} ${c.fg} ${small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"}`}>
      {c.label}
    </span>
  );
}

function CategoryChangeBadge({ templates }) {
  const from = CATEGORY_META[templates[0].category].label;
  const to = CATEGORY_META[templates[templates.length - 1].category].label;
  return (
    <span
      data-testid="broadcast-category-changed"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-amber-50 text-amber-800"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      {from} <ArrowRight className="w-3 h-3" /> {to}
    </span>
  );
}

// Horizontal scroll-snap carousel: swipe/trackpad on touch, arrows + dots on desktop.
function Carousel({ children, testId, itemClassName = "w-[86%]" }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const items = React.Children.toArray(children);
  const scrollTo = (i) => {
    const el = ref.current;
    const child = el?.children[i];
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onScroll = () => {
      const w = el.children[0]?.offsetWidth || 1;
      setIndex(Math.min(items.length - 1, Math.round(el.scrollLeft / w)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  return (
    <div data-testid={testId}>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div key={i} className={`snap-start shrink-0 ${items.length === 1 ? "w-full" : itemClassName}`}>
            {child}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-[#7C6CF0]" : "w-1.5 bg-slate-300"}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous"
              disabled={index === 0}
              onClick={() => scrollTo(index - 1)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={index === items.length - 1}
              onClick={() => scrollTo(index + 1)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Side-by-side comparison as cards: one card per template category (+ optional Total).
// Each metric is label-over-value inside its card, so it reads as a comparison rather than a grid.
// `highlight` marks the template the surrounding preview belongs to; others are dimmed.
// Total leaves Rate blank — there's no single per-message rate across categories.
function MetricLine({ label, value, sub, testId }) {
  return (
    <div className="py-2 border-t border-slate-100 first:border-t-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-slate-900 tabular-nums min-h-[18px]" data-testid={testId}>
        {value}
        {sub && <span className="ml-1 text-[10px] font-normal text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

function CompareCards({ templates, highlight, testId, showTotal }) {
  const totalSpent = templates.reduce((s, t) => s + spentOf(t), 0);
  const totals = {
    sent: templates.reduce((s, t) => s + t.sent, 0),
    delivered: templates.reduce((s, t) => s + t.delivered, 0),
  };
  const cols = templates.length + (showTotal ? 1 : 0);
  const hasHighlight = highlight !== undefined;

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-testid={testId}>
      {templates.map((t, i) => {
        const c = CATEGORY_META[t.category];
        const spent = spentOf(t);
        const share = totalSpent ? (spent / totalSpent) * 100 : 0;
        const active = !hasHighlight || highlight === i;
        return (
          <div
            key={t.category}
            className={`rounded-xl border px-3 pt-3 pb-2.5 transition-opacity ${
              active ? `bg-white border-slate-200 ${hasHighlight ? `ring-2 ${c.ring}` : ""}` : "bg-slate-50 border-slate-100 opacity-60"
            }`}
          >
            <CategoryChip category={t.category} small />
            <div className="mt-1 mb-1.5 text-[10px] text-slate-400">
              {templates.length > 1 ? (i === 0 ? "Original category" : "Updated category") : "Template category"}
            </div>
            <MetricLine label="Sent" value={num(t.sent)} />
            <MetricLine label="Delivered" value={num(t.delivered)} sub={`${pct(t.delivered, t.sent)}%`} />
            <MetricLine label="Rate" value={`₹${t.rate.toFixed(2)}`} sub="/ msg" />
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Spent</div>
              <div className="mt-0.5 text-[14px] font-bold text-slate-900 tabular-nums">{rupees(spent)}</div>
              {templates.length > 1 && (
                <div className="mt-0.5 text-[10px] text-slate-400 tabular-nums" data-testid={`compare-share-${t.category}`}>
                  {share.toFixed(1)}% of spend
                </div>
              )}
            </div>
          </div>
        );
      })}
      {showTotal && (
        <div className="rounded-xl px-3 pt-3 pb-2.5 bg-violet-50/70 border border-violet-100">
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700">Total</span>
          <div className="mt-1 mb-1.5 text-[10px] text-violet-400">All categories</div>
          <MetricLine label="Sent" value={num(totals.sent)} testId="compare-total-Sent count" />
          <MetricLine label="Delivered" value={num(totals.delivered)} testId="compare-total-Delivered count" />
          <MetricLine label="Rate" value="" testId="compare-total-Rate" />
          <div className="pt-2 border-t border-violet-100">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Spent</div>
            <div className="mt-0.5 text-[14px] font-bold text-violet-800 tabular-nums" data-testid="compare-total-Spent">
              {rupees(totalSpent)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BroadcastDetailDrawer({ broadcast, open, onOpenChange }) {
  const [expanded, setExpanded] = useState(false);
  if (!broadcast) return null;
  const b = broadcast;
  const totalUndelivered = Object.values(b.failures).reduce((s, v) => s + v, 0);
  const topReason = FAILURE_REASONS.reduce((top, r) => (b.failures[r.key] > b.failures[top.key] ? r : top));
  const changed = b.templates.length > 1;
  const totalSpent = b.templates.reduce((s, t) => s + spentOf(t), 0);
  const roi = totalSpent ? (b.revenue / totalSpent).toFixed(2) : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 w-full sm:max-w-[520px] flex flex-col gap-0 bg-white"
        data-testid="broadcast-detail-drawer"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-200 shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Broadcast · {b.id}
          </div>
          <SheetTitle className="mt-1 text-[18px] font-semibold text-slate-900 pr-8 break-all">{b.name}</SheetTitle>
          <SheetDescription className="sr-only">
            Details, timing, audience, delivery and return for {b.name}.
          </SheetDescription>
          <div className="mt-3 flex items-center gap-2">
            <BroadcastStatusPill status={b.status} />
            <WhatsAppPill />
            {changed && <CategoryChangeBadge templates={b.templates} />}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" data-testid="broadcast-detail-scroll">
          <Section title="Campaign details" testId="broadcast-section-details">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Template name">{b.templateName}</Field>
              <Field label="Channel">
                <WhatsAppPill />
              </Field>
              <Field label="Tracking ID">{b.id}</Field>
              <Field label="Template category">
                {changed ? (
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <CategoryChip category={b.templates[0].category} small />
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <CategoryChip category={b.templates[b.templates.length - 1].category} small />
                    </span>
                    <span className="text-[11px] font-normal text-amber-700" data-testid="broadcast-category-change-count">
                      Changed {b.templates.length - 1}× · {b.categoryChangedAt}
                    </span>
                  </span>
                ) : (
                  <CategoryChip category={b.templates[0].category} small />
                )}
              </Field>
            </div>
          </Section>

          <Section title="Timing" testId="broadcast-section-timing">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Created">{b.createdAt}</Field>
              <Field label="Scheduled">{b.scheduledAt}</Field>
              <Field label="Started">{b.startedAt || "—"}</Field>
              <Field label="Retry">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold ${
                    b.retryEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {b.retryEnabled ? "Enabled" : "Disabled"}
                </span>
              </Field>
            </div>
          </Section>

          <Section title="Audience" testId="broadcast-section-audience">
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
              <span className="text-[13px] text-slate-400 mr-1">Includes</span>
              {b.segments.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-[12px] font-semibold">
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4">
              <span className="text-[13px] text-slate-700">Total estimated audience</span>
              <span className="text-[16px] font-semibold text-slate-900 tabular-nums">{num(b.estimatedAudience)}</span>
            </div>
          </Section>

          <Section title="Delivery" testId="broadcast-section-delivery">
            <FunnelRow label="Sent" value={b.sent} max={b.sent} note="" shade="#7C6CF0" />
            <FunnelRow label="Delivered" value={b.delivered} max={b.sent} note={`${pct(b.delivered, b.sent)}% of Sent`} shade="#9F94F4" />
            <FunnelRow label="Read" value={b.read} max={b.sent} note={`${pct(b.read, b.delivered)}% of Delivered`} shade="#BDB5F8" />
            <FunnelRow label="Clicked" value={b.clicked} max={b.sent} note={`${pct(b.clicked, b.read)}% of Read`} shade="#D3CDFA" />
          </Section>

          <Section
            title="Delivery & spend by template"
            testId="broadcast-section-split"
            right={
              changed ? (
                <span className="text-[11px] font-medium text-amber-700">Category changed mid-run</span>
              ) : null
            }
          >
            <CompareCards templates={b.templates} testId="broadcast-split-compare" showTotal={changed} />
          </Section>

          <Section
            title="Delivery failures"
            testId="broadcast-section-failures"
            right={
              <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                Admin only
              </span>
            }
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-slate-600">Undelivered, by reason</span>
              <span className="text-[16px] font-semibold text-slate-900 tabular-nums">{num(totalUndelivered)}</span>
            </div>
            <div className="space-y-4">
              {FAILURE_REASONS.map((r, i) => {
                const count = b.failures[r.key];
                const p = pct(count, totalUndelivered);
                return (
                  <div key={r.key} data-testid={`broadcast-failure-${r.key}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] text-slate-800">{r.label}</span>
                      <span className="flex items-center gap-4">
                        <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{p}%</span>
                        <span className="w-14 text-right text-[12px] text-slate-400 tabular-nums">{num(count)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(Number(p), count ? 0.5 : 0)}%`, background: FAILURE_SHADES[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 pt-4 border-t border-slate-100 text-[13px] text-slate-600">
              <strong className="text-slate-900">{pct(b.failures[topReason.key], totalUndelivered)}%</strong> of undelivered
              messages failed with <strong className="text-slate-900">{topReason.label}</strong>.
            </p>
          </Section>

          <Section title="Return & revenue" testId="broadcast-section-revenue">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Orders">{num(b.orders)}</Field>
              <Field label="Revenue">{rupeesShort(b.revenue)}</Field>
              <Field label="Spent">{rupees(totalSpent)}</Field>
              <Field label="ROI">{roi}</Field>
            </div>
          </Section>

          <Section
            title="Message preview"
            testId="broadcast-section-preview"
            right={
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-900"
                data-testid="broadcast-preview-expand"
              >
                <Maximize2 className="w-4 h-4" />
                Expand
              </button>
            }
          >
            <Carousel testId="broadcast-preview-carousel" itemClassName="w-[92%]">
              {b.templates.map((t, i) => (
                <div key={t.category} className="space-y-3" data-testid={`broadcast-preview-${t.category}`}>
                  <div className="flex items-center gap-2">
                    <CategoryChip category={t.category} small />
                    <span className="text-[12px] text-slate-500">{t.version} template · {t.active}</span>
                  </div>
                  <MessagePreview preview={t.preview} />
                  <CompareCards templates={b.templates} highlight={i} testId={`broadcast-preview-compare-${t.category}`} />
                </div>
              ))}
            </Carousel>
          </Section>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-slate-200 px-6 py-4 flex justify-end bg-white">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="broadcast-reports-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7C6CF0] hover:bg-[#6B5AE8] text-white text-[14px] font-medium"
              >
                <Mail className="w-4 h-4" />
                Reports
                <ChevronUp className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuItem onClick={() => toast.success(`Downloading report for ${b.name}`)}>
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Report will be emailed to you shortly")}>
                <Send className="w-4 h-4 mr-2" /> Email report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-[14px]">Message preview · {b.templateName}</DialogTitle>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {b.templates.map((t) => (
                <div key={t.category}>
                  <div className="mb-2 flex items-center gap-2">
                    <CategoryChip category={t.category} small />
                    <span className="text-[12px] text-slate-500">{t.version} template</span>
                  </div>
                  <MessagePreview preview={t.preview} large />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
