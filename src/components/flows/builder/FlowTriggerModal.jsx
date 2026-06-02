/**
 * FlowTriggerModal
 *
 * view: "trigger-select" → seller picks an event card
 * view: "step-1"         → seller configures trigger conditions
 * view: "step-2"         → seller qualifies audience (Who enters)
 *
 * onTriggerSelected   — fires when audienceQualificationAllowed === false (skips step-2)
 * onFlowConfigComplete — fires after step-2 Finish with full config payload
 *
 * z-index: canvas (z-0) → backdrop (z-40) → modal panel (z-50)
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  X, Search, ChevronDown, ChevronUp, Plus, Trash2, ChevronLeft,
  ShoppingBag, Package, Truck, UsersRound, GitBranch,
  MessageCircle, Camera, Mail, CalendarHeart, TimerReset,
  Tag, Plug, DatabaseZap, Headphones, Zap, Check,
  AlertTriangle, RefreshCw, Info,
} from "lucide-react";
import {
  ATTRIBUTE_GROUPS, ATTRIBUTE_MAP, BEHAVIOR_EVENT_GROUPS, EVENT_MAP,
  AFFINITY_DIMENSIONS, AFFINITY_DIMENSION_VALUES,
  MOCK_SEGMENTS, getOperatorsForType,
} from "./audienceFilterData";
import {
  BROADCAST_MOCK_SEGMENTS, MOCK_TOTAL_USERS, TIMEZONES,
  SAMPLE_CSV_CONTENT, SAMPLE_CSV_FILENAME,
  getMockReachCount, isPastDateTime,
} from "./broadcastAudienceData";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList,
  CommandGroup, CommandItem, CommandEmpty,
} from "@/components/ui/command";
import {
  getPropertiesForEvent,
  getEvaluateComputations,
  getFamilyForHeader,
  isScheduledHeader,
  TRIGGER_FAMILIES,
  MOCK_SHOPIFY_DATA,
} from "./triggerEventProperties";

// ── constants ─────────────────────────────────────────────────
const PRIMARY    = "#6C3AE8";
const PRIMARY_BG = "#F1ECFE";
let _uid = 0;
const uid = () => `id-${++_uid}`;

// ── CSV parsing (unchanged) ───────────────────────────────────
const CSV_RAW = `Header,Section,Event Category,Event Description,Card State,Event Attribute allowed,Audience Qualification allow,Time Attribute Allow
Ecommerce,Shopping behaviour,App/Website open,User opens app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Product viewed,User views a product detail page on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Add to cart,Product added to active cart on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Search,Product is searched in search box on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Sign Up,User signs up on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Purchased a Product,When a product is purchased on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Checkout started,User enters checkout flow on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Added to Wishlist,Product added to wishlist on app or website,active,yes,yes,no
Ecommerce,Shopping behaviour,Review Created,Event from Judge Me whenever a user adds a review,active,yes,yes,no
Ecommerce,Order,Order placed,Payment confirmed by Shopify,active,yes,yes,no
Ecommerce,Order,Draft order placed,Merchant creates draft order,active,yes,yes,no
Ecommerce,Order,Custom SDK event,Any wigzo.track() call from your store,active,yes,yes,no
Post-purchase,Fulfilment,Order shipped,Tracking number assigned,active,yes,yes,no
Post-purchase,Fulfilment,Out for delivery,Last-mile carrier update,active,yes,yes,no
Post-purchase,Fulfilment,Product Delivered,When an individual product is delivered,active,yes,yes,no
Post-purchase,Fulfilment,Order delivered,Delivery confirmed by carrier on all products delivered,active,yes,yes,no
Post-purchase,Fulfilment,Order Delay,When order delay event is received,active,yes,yes,no
Post-purchase,Fulfilment,Order cancelled,Cancellation confirmed,active,yes,yes,no
Post-purchase,Fulfilment,Refund issued,Refund processed to customer,active,yes,yes,no
Post-purchase,Fulfilment,Returned,Order/Product has been returned,active,yes,yes,no
Segment and state,Segment membership,Segment entry,User qualifies for a saved segment,active,yes,yes,no
Segment and state,Segment membership,Segment exit,User leaves a saved segment,active,yes,yes,no
Communication,Flow state,Flow completed,User reached end of another flow,active,yes,yes,no
Communication,Flow state,Flow exited early,Cancel trigger removed user mid-flow,active,yes,yes,no
Communication,Flow state,Communication,When user gets a particular template being used in any flow,active,yes,yes,no
Inbound message,WhatsApp,WhatsApp message received,User sends any message to your WABA,active,yes,yes,no
Inbound message,WhatsApp,Keyword match,Message contains a defined keyword,active,yes,yes,no
Inbound message,WhatsApp,Click-to-WhatsApp ad,User clicks WhatsApp entry-point ad,active,yes,yes,no
Inbound message,WhatsApp,Button reply received,User taps a quick-reply button,active,yes,yes,no
Inbound message,Instagram,DM Received,When a seller received a DM in Instagram Inbox,active,yes,yes,no
Inbound message,Instagram,Comment Received,When a seller received a comment in Instagram Inbox,active,yes,yes,no
Inbound message,Instagram,Story Tag,When a seller story is tagged,active,yes,yes,no
Inbound message,Email,Email Received,Triggered whenever an email is received from a customer,active,yes,yes,no
Inbound message,Email,Email Unsubscribed,When email gets unsubscribed,active,yes,yes,no
Date and time,User date attributes,Birthday,Fires on user birth date attribute,active,yes,yes,no
Date and time,User date attributes,Anniversary,N years since first order or signup,inactive,yes,yes,no
Date and time,User date attributes,Custom date attribute,Any date field on customer profile,active,yes,yes,no
Date and time,Inactivity and win-back,Inactivity threshold,Has not ordered or visited in N days,active,yes,yes,no
Date and time,Inactivity and win-back,N days after event,Relative to a past event date,active,yes,yes,no
Date and time,Product,Back in Stock,Flow starts when a product is back in stock,active,yes,yes,no
Date and time,Product,Price Drop,Flow starts when a product has a price drop,active,yes,yes,no
Webhook and API,External signals,Webhook trigger,Third-party system sends data to your URL,active,yes,yes,no
Webhook and API,External signals,API trigger,Developer calls E360 REST endpoint,coming soon,yes,yes,no
Broadcast,Audience source,Saved segment,Pick a pre-built segment as audience,active,yes,no,yes
Broadcast,Audience source,CSV upload,Upload phone list with variable columns,active,yes,no,yes
Broadcast,Audience source,Dynamic filter,Build audience inline without saving a segment,active,yes,no,yes
Broadcast,Audience source,All subscribers,Everyone opted-in on this channel,active,yes,no,yes
Agent,Agent,Task Created,Triggered whenever a task is created by agent or AI agent,active,yes,no,no
Agent,Agent,Task Closed,Triggered whenever a task is closed,active,yes,no,no
Agent,Agent,Task Stage Change,Triggered when the ticket stage changes,active,yes,no,no
Agent,Agent,Reassigned Agent,Triggered when ticket is reassigned to another agent,active,yes,no,no
Agent,Agent,Ticket assigned to agent,Triggered whenever ticket gets assigned to an agent,active,yes,no,no`;

function toKebab(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function normaliseStatus(raw) {
  const s = (raw || "").trim().toLowerCase();
  if (s === "coming soon") return "coming_soon";
  if (s === "inactive")    return "inactive";
  return "active";
}
function parseCSV(raw) {
  const lines = raw.trim().split("\n");
  const seenIds = new Map();
  const events  = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 8) continue;
    const header = cols[0].trim();
    if (header.toUpperCase() === "ALL") continue;
    const section       = cols[1].trim();
    const eventCategory = cols[2].trim();
    const eventDesc     = cols[3].trim();
    const status        = normaliseStatus(cols[4].trim());
    const eaAllowed     = cols[5].trim().toLowerCase() === "yes";
    const aqAllowed     = cols[6].trim().toLowerCase() === "yes";
    const taAllowed     = cols[7].trim().toLowerCase() === "yes";
    const baseSlug = toKebab(eventCategory);
    const count    = (seenIds.get(baseSlug) || 0) + 1;
    seenIds.set(baseSlug, count);
    const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;
    events.push({ id, header: toKebab(header), section, eventCategory, eventDescription: eventDesc,
      status, eventAttributeAllowed: eaAllowed, audienceQualificationAllowed: aqAllowed, timeAttributeAllowed: taAllowed });
  }
  return events;
}
export const TRIGGER_EVENTS = parseCSV(CSV_RAW);

// ── sidebar config ────────────────────────────────────────────
const SIDEBAR_HEADERS = [
  { key: "all",               label: "All"               },
  { key: "ecommerce",         label: "Ecommerce"         },
  { key: "post-purchase",     label: "Post-purchase"     },
  { key: "segment-and-state", label: "Segment and state" },
  { key: "communication",     label: "Communication"     },
  { key: "inbound-message",   label: "Inbound message"   },
  { key: "date-and-time",     label: "Date and time"     },
  { key: "webhook-and-api",   label: "Webhook and API"   },
  { key: "broadcast",         label: "Broadcast"         },
  { key: "agent",             label: "Agent"             },
];
const SECTION_ICON_MAP = {
  "Shopping behaviour": ShoppingBag, "Order": Package, "Fulfilment": Truck,
  "Segment membership": UsersRound,  "Flow state": GitBranch,
  "WhatsApp": MessageCircle, "Instagram": Camera, "Email": Mail,
  "User date attributes": CalendarHeart, "Inactivity and win-back": TimerReset,
  "Product": Tag, "External signals": Plug, "Audience source": DatabaseZap, "Agent": Headphones,
};
function getSectionIcon(section) { return SECTION_ICON_MAP[section] || Zap; }

// ── helpers ───────────────────────────────────────────────────
function getHeaderLabel(headerKey) {
  const found = SIDEBAR_HEADERS.find((h) => h.key === headerKey);
  return found ? found.label : "event";
}

function createFilterRow() {
  return { id: uid(), property: null, operator: null, value: "", combinator: "AND", error: false };
}
function createGroup(event) {
  return { id: uid(), event, filters: [], filterCombinator: "AND", evaluate: null };
}

// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// TRIGGER-SELECT VIEW COMPONENTS (unchanged look)
// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───

function EventCard({ event, onSelect, disabled }) {
  const { status } = event;
  const isActive     = status === "active" && !disabled;
  const isComingSoon = status === "coming_soon";
  const forceDisable = disabled && status === "active";

  return (
    <div
      onClick={() => isActive && onSelect(event)}
      className={[
        "relative px-3 py-2.5 border rounded-lg flex flex-col transition-all",
        isActive
          ? "bg-surface border-border cursor-pointer hover:border-primary/50 hover:shadow-sm"
          : isComingSoon
          ? "bg-surface border-border cursor-default"
          : "bg-slate-50 border-border opacity-40 cursor-not-allowed pointer-events-none",
        forceDisable ? "opacity-30" : "",
      ].join(" ")}
      title={forceDisable ? "Incompatible with existing trigger" : undefined}
    >
      {isComingSoon && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
          Coming soon
        </span>
      )}
      <div className={`text-[12px] font-semibold leading-snug ${(status === "inactive" || forceDisable) ? "text-text-muted" : "text-text-primary"} ${isComingSoon ? "pr-20" : ""}`}>
        {event.eventCategory}
      </div>
      <div className={`text-[11px] mt-0.5 leading-relaxed ${(status === "inactive" || forceDisable) ? "text-text-muted" : "text-text-secondary"}`}>
        {event.eventDescription}
      </div>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Search className="w-10 h-10 text-text-muted mb-3" />
      <div className="text-sm font-medium text-text-primary">No events match your search</div>
      {query && <div className="text-[12px] text-text-muted mt-1">Try a different keyword or clear the search</div>}
    </div>
  );
}

// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// STEP 1 COMPONENTS
// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───

// activeStep: 1 | 2   step1Done: bool
function WizardHeader({ activeStep = 1, step1Done = false }) {
  return (
    <div className="flex items-center justify-center px-6 py-3 bg-slate-50 border-b border-border">
      {/* Step 1 */}
      <div className={`flex items-center gap-2 ${activeStep === 1 ? "" : "opacity-60"}`}>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: step1Done ? "#22C55E" : PRIMARY }}
        >
          {step1Done ? <Check className="w-3 h-3" /> : "1"}
        </div>
        <span className={`text-[12px] ${activeStep === 1 ? "font-semibold text-text-primary" : "font-medium text-text-muted"}`}>
          When will users enter the flow
        </span>
      </div>

      {/* Connector */}
      <div className="flex items-center mx-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-slate-300 mx-0.5" />
        ))}
      </div>

      {/* Step 2 */}
      <div className={`flex items-center gap-2 ${activeStep === 2 ? "" : "opacity-50"}`}>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
          style={activeStep === 2
            ? { backgroundColor: PRIMARY, color: "#fff" }
            : { border: "2px solid #94A3B8", color: "#94A3B8" }
          }
        >
          2
        </div>
        <span className={`text-[12px] ${activeStep === 2 ? "font-semibold text-text-primary" : "font-medium text-text-muted"}`}>
          Who will enter the flow
        </span>
      </div>
    </div>
  );
}

// Small inline dropdown for operators and simple selects
function SmallSelect({ value, onChange, options, placeholder = "Select…", error = false }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "h-8 px-2 pr-6 text-[12px] rounded-md border bg-white appearance-none cursor-pointer focus:outline-none focus:border-primary/60",
        error ? "border-rose-400 bg-rose-50" : "border-border text-text-primary",
        !value ? "text-text-muted" : "",
      ].join(" ")}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((op) => (
        <option key={op} value={op}>{op}</option>
      ))}
    </select>
  );
}

// ── Per-property mock values for the multi-select dropdown ───
const MOCK_VALUES = {
  order_id:            ["6578201034968","6509257818328","6781241622744","6892345123456","7012456789123"],
  order_name:          ["#1001","#1002","#1003","#1004","#1005"],
  product_id:          ["8901234567","8912345678","8923456789","8934567890","8945678901"],
  product_name:        ["Vitamin C Serum","Aloe Vera Moisturiser","Sunscreen SPF 50","Night Repair Cream","Lip Butter Rose"],
  sku_id:              ["SKU-001-A","SKU-001-B","SKU-002-A","SKU-003-A","SKU-004-A"],
  variant_id:          ["VAR-001","VAR-002","VAR-003","VAR-004"],
  variant_name:        ["30ml","50ml","100g","200g"],
  courier_name:        ["Delhivery","BlueDart","FedEx","Ekart","XpressBees","Shadowfax","DTDC"],
  carrier_name:        ["Delhivery","BlueDart","FedEx","Ekart","XpressBees"],
  channel:             ["whatsapp","email","sms","push"],
  message_type:        ["text","image","video","document","audio","location"],
  post_type:           ["reel","image","carousel"],
  priority:            ["low","medium","high","urgent"],
  resolution_status:   ["resolved","unresolved","escalated"],
  closed_by:           ["agent","ai_agent","auto_close"],
  created_by:          ["agent","ai_agent","customer"],
  changed_by:          ["agent","ai_agent","automation"],
  assignment_type:     ["manual","auto_assign","ai_routed"],
  previous_stage:      ["open","pending","escalated","in_progress"],
  new_stage:           ["in_progress","resolved","closed","escalated"],
  reassignment_reason: ["capacity","expertise","escalation","shift_change"],
  delay_reason:        ["weather","logistics issue","address issue","customs delay","vehicle breakdown"],
  return_reason:       ["wrong size","not as described","damaged","changed mind","quality issue"],
  return_status:       ["initiated","received","refunded","rejected"],
  refund_type:         ["full","partial"],
  refund_reason:       ["damaged","wrong item","customer request","quality issue"],
  cancel_reason:       ["customer_request","out_of_stock","fraud","address_issue"],
  exit_reason:         ["cancel_trigger","admin_stop","error","completed"],
  delivery_status:     ["delivered","read","clicked","failed"],
  inactivity_type:     ["no_order","no_visit","no_engagement"],
  last_order_channel:  ["whatsapp","email","sms","push"],
  anniversary_type:    ["first_order","signup","custom"],
  reference_event:     ["order_placed","product_delivered","checkout_started","sign_up"],
  signup_source:       ["google","facebook","direct","referral","instagram"],
  signup_channel:      ["web","app","whatsapp"],
  shipping_country:    ["IN","US","GB","AE","SG","AU"],
  currency:            ["INR","USD","GBP","AED"],
  product_price:       ["100","250","500","1000","1500","2000"],
  total_amount:        ["500","1000","1500","2000","3000","5000"],
  cart_value:          ["500","1000","1500","2000","3000"],
  refund_amount:       ["100","250","500","1000"],
  item_count:          ["1","2","3","4","5"],
  waba_number:         ["+91 74360 36062","+91 99880 12345"],
  button_text:         ["Buy Now","Learn More","Get Offer","Confirm Order","Track Order"],
  template_name:       ["checkout_recovery","welcome_series","payday_sale","review_request"],
  flow_id:             ["flow-001","flow-002","flow-003","flow-004"],
  flow_name:           ["Checkout Recovery","Welcome Series","Payday Campaign","Re-engagement"],
};

// Shopify picker types get their values from MOCK_SHOPIFY_DATA
const SHOPIFY_MOCK_MAP = {
  __shopify_product_picker:    () => MOCK_SHOPIFY_DATA.product_picker.map((i) => i.name),
  __shopify_sku_picker:        () => MOCK_SHOPIFY_DATA.sku_picker.map((i) => i.name),
  __shopify_collection_picker: () => MOCK_SHOPIFY_DATA.collection_picker.map((i) => i.name),
  __shopify_order_tag_picker:  () => MOCK_SHOPIFY_DATA.order_tag_picker.map((i) => i.name),
};

function getMockValues(propertyKey) {
  if (SHOPIFY_MOCK_MAP[propertyKey]) return SHOPIFY_MOCK_MAP[propertyKey]();
  return MOCK_VALUES[propertyKey] || [];
}

// ── Two-panel property dropdown ───────────────────────────────
function PropertyDropdown({ value, onChange, properties, error = false }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [hovered, setHovered] = useState(null);
  const isSpecial = properties === "special";

  if (isSpecial) {
    return (
      <input
        className={`h-8 px-2 text-[12px] rounded-md border bg-white focus:outline-none focus:border-primary/60 w-40 ${error ? "border-rose-400 bg-rose-50" : "border-border"}`}
        placeholder="Payload key…"
        value={value?.name || ""}
        onChange={(e) => onChange({ key: e.target.value, name: e.target.value, type: "String", inputType: "special", pickerType: null, ops: ["Is","Is Not","Contains","Doesn't Contain","Exists","Doesn't Exist"] })}
      />
    );
  }

  const all = (properties || []);
  const lq  = search.trim().toLowerCase();
  const filtered = lq ? all.filter((p) => p.name.toLowerCase().includes(lq)) : all;
  const preview  = hovered || value;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(""); setHovered(null); } }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={[
            "h-8 px-2.5 text-[12px] rounded-md border bg-white flex items-center gap-1.5 hover:border-primary/40 min-w-[150px] max-w-[220px]",
            error ? "border-rose-400 bg-rose-50" : "border-border",
            !value ? "text-text-muted" : "text-text-primary",
          ].join(" ")}
        >
          <span className="flex-1 text-left truncate">{value ? value.name : "Select condition"}</span>
          <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 flex" style={{ width: preview ? 480 : 240 }} align="start" sideOffset={4}>
        {/* Left: search + list */}
        <div className="w-60 flex-shrink-0 flex flex-col border-r border-border">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 text-[12px] bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="overflow-y-auto max-h-56">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-[12px] text-text-muted text-center">No match</div>
            )}
            {filtered.map((prop) => (
              <button
                key={prop.key}
                type="button"
                onMouseEnter={() => setHovered(prop)}
                onClick={() => { onChange(prop); setOpen(false); setSearch(""); setHovered(null); }}
                className={[
                  "w-full text-left px-3 py-2 text-[12px] border-b border-border/50 flex items-center gap-2 transition-colors",
                  value?.key === prop.key
                    ? "bg-primary-tint text-primary font-medium"
                    : "text-text-primary hover:bg-slate-50",
                ].join(" ")}
              >
                <span className="flex-1">{prop.name}</span>
                {prop.inputType === "B" && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 flex-shrink-0">Shopify</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: description panel */}
        {preview && (
          <div className="w-[220px] p-4 flex flex-col gap-1.5 bg-white">
            <div className="text-[13px] font-semibold text-text-primary">{preview.name}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-text-muted font-medium">{preview.type}</span>
              {preview.inputType === "B" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">Shopify picker</span>
              )}
            </div>
            {preview.notes && (
              <p className="text-[11px] text-text-secondary leading-relaxed mt-1">{preview.notes}</p>
            )}
            {preview.ops && (
              <div className="mt-1">
                <div className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-1">Operators</div>
                <div className="text-[11px] text-text-secondary">{Array.isArray(preview.ops) ? preview.ops.join(", ") : ""}</div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Multi-select value dropdown with checkboxes ───────────────
function MultiSelectDropdown({ propertyKey, value, onChange, error }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [pending, setPending] = useState([]); // uncommitted selection

  const allItems = getMockValues(propertyKey);
  const lq       = search.trim().toLowerCase();
  const visible  = lq ? allItems.filter((v) => v.toLowerCase().includes(lq)) : allItems;
  const selected = Array.isArray(value) ? value : [];

  // Sync pending when panel opens
  const handleOpen = (o) => {
    if (o) setPending(selected);
    else    setSearch("");
    setOpen(o);
  };

  const toggle = (item) =>
    setPending((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);

  const allChecked = visible.length > 0 && visible.every((v) => pending.includes(v));
  const toggleAll  = () => allChecked
    ? setPending((prev) => prev.filter((x) => !visible.includes(x)))
    : setPending((prev) => [...new Set([...prev, ...visible])]);

  const displayLabel = selected.length === 0
    ? "Select an option"
    : selected.length === 1
    ? selected[0]
    : `${selected[0]} +${selected.length - 1} more`;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={[
            "h-8 px-2.5 text-[12px] rounded-md border bg-white flex items-center gap-1.5 min-w-[160px] max-w-[240px] hover:border-primary/40",
            error ? "border-rose-400 bg-rose-50" : "border-border",
            selected.length === 0 ? "text-text-muted" : "text-text-primary",
          ].join(" ")}
        >
          <span className="flex-1 text-left truncate">{displayLabel}</span>
          <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0 flex flex-col" align="start" sideOffset={4}>
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 text-[12px] bg-transparent outline-none text-text-primary placeholder:text-text-muted"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-48">
          {/* Select All */}
          {visible.length > 0 && (
            <label className="flex items-center gap-2.5 px-3 py-2 border-b border-border/60 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <span className="text-[12px] text-text-primary">Select All</span>
            </label>
          )}
          {visible.length === 0 && (
            <div className="px-3 py-4 text-[12px] text-text-muted text-center">No options found</div>
          )}
          {visible.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2.5 px-3 py-2 border-b border-border/40 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={pending.includes(item)}
                onChange={() => toggle(item)}
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <span className="text-[12px] text-text-primary">{item}</span>
            </label>
          ))}
        </div>

        {/* Footer: Clear + Apply */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-slate-50">
          <button
            type="button"
            onClick={() => { setPending([]); onChange([]); setOpen(false); }}
            className="px-3 py-1 text-[12px] font-semibold rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => { onChange(pending); setOpen(false); }}
            className="px-3 py-1 text-[12px] font-semibold rounded-md text-white hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Value field — adapts to property type ────────────────────
function ValueField({ property, operator, value, onChange, error }) {
  if (!property || !operator) return null;
  if (operator === "Exists" || operator === "Doesn't Exist") return null;

  // Boolean — True/False toggle
  if (property.type === "Boolean" || property.ops === null) {
    return (
      <div className="flex items-center border border-border rounded-md overflow-hidden text-[12px]">
        {["True","False"].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 h-8 font-medium transition-colors ${value === opt ? "bg-primary text-white" : "bg-white text-text-secondary hover:bg-slate-50"}`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // Type B — Shopify picker (multi-select using mock Shopify items)
  if (property.inputType === "B" && property.pickerType) {
    const items    = MOCK_SHOPIFY_DATA[property.pickerType] || [];
    const selected = Array.isArray(value) ? value : [];
    const label    = selected.length === 0 ? "Select an option" : selected.length === 1 ? selected[0] : `${selected[0]} +${selected.length - 1} more`;
    // Re-use MultiSelectDropdown with Shopify item names as values
    const shopifyValues = items.map((i) => i.name || i.id);
    return (
      <MultiSelectDropdown
        propertyKey={`__shopify_${property.pickerType}`}
        value={selected}
        onChange={onChange}
        error={error}
      />
    );
  }

  // DateTime
  if (property.type === "DateTime") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 px-2 text-[12px] rounded-md border bg-white focus:outline-none focus:border-primary/60 ${error ? "border-rose-400 bg-rose-50" : "border-border"}`}
      />
    );
  }

  // Between — two inputs
  if (operator === "Between") {
    const parts = Array.isArray(value) ? value : ["",""];
    return (
      <div className="flex items-center gap-1">
        <input className={`h-8 px-2 text-[12px] rounded-md border w-20 focus:outline-none focus:border-primary/60 ${error ? "border-rose-400 bg-rose-50" : "border-border"}`}
          placeholder="From" value={parts[0] || ""} onChange={(e) => onChange([e.target.value, parts[1]])} />
        <span className="text-[11px] text-text-muted">–</span>
        <input className={`h-8 px-2 text-[12px] rounded-md border w-20 focus:outline-none focus:border-primary/60 ${error ? "border-rose-400 bg-rose-50" : "border-border"}`}
          placeholder="To" value={parts[1] || ""} onChange={(e) => onChange([parts[0], e.target.value])} />
      </div>
    );
  }

  // Default — multi-select dropdown with per-property mock values
  return (
    <MultiSelectDropdown
      propertyKey={property.key}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      error={error && (!value || (Array.isArray(value) && value.length === 0))}
    />
  );
}

// Single filter row
function FilterRow({ row, properties, isFirst, onUpdate, onDelete, onToggleCombinator }) {
  const showValue = row.operator && row.operator !== "Exists" && row.operator !== "Doesn't Exist";

  return (
    <div>
      {/* AND / OR combinator pill between rows */}
      {!isFirst && (
        <div className="pl-1 mb-1.5">
          <button
            type="button"
            onClick={onToggleCombinator}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-semibold transition-colors"
            style={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-tint)",
            }}
          >
            {row.combinator}
            <ChevronDown className="w-2.5 h-2.5 opacity-70" />
          </button>
        </div>
      )}

      {/* Row: property · operator · value · delete */}
      <div className="flex items-center gap-1.5 min-w-0">
        <PropertyDropdown
          value={row.property}
          onChange={(prop) => {
            const firstOp = Array.isArray(prop.ops) && prop.ops.length > 0 ? prop.ops[0] : null;
            onUpdate({ property: prop, operator: firstOp, value: [] });
          }}
          properties={properties}
          error={row.error && !row.property}
        />

        {row.property && row.property.type !== "Boolean" && row.property.ops !== null && (
          <SmallSelect
            value={row.operator}
            onChange={(op) => onUpdate({ operator: op, value: "" })}
            options={row.property.ops || []}
            placeholder="Op"
            error={row.error && !row.operator}
          />
        )}

        {showValue && (
          <ValueField
            property={row.property}
            operator={row.operator}
            value={row.value}
            onChange={(val) => onUpdate({ value: val })}
            error={row.error && !row.value && row.value !== false}
          />
        )}

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-rose-50 text-text-muted hover:text-rose-500 transition-colors flex-shrink-0 ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Evaluate block
function EvaluateBlock({ groupIndex, event, evaluate, onUpdate, onRemove }) {
  const computations = getEvaluateComputations(event?.eventCategory);
  if (!computations) return null;

  const outputVar = `{{trigger${groupIndex + 1}.evaluate}}`;

  if (!evaluate) {
    return (
      <button
        type="button"
        onClick={() => onUpdate({ computation: null, computationLabel: null, windowValue: 30, windowUnit: "days" })}
        className="text-[12px] text-primary hover:underline flex items-center gap-1 mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add Evaluate
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-text-primary">Evaluate</span>
        <button type="button" onClick={onRemove} className="text-[11px] text-text-muted hover:text-rose-500">Remove</button>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[12px] text-text-secondary">Compute</span>
        <SmallSelect
          value={evaluate.computation}
          onChange={(val) => {
            const found = computations.find((c) => c.key === val);
            onUpdate({ ...evaluate, computation: val, computationLabel: found?.label || val });
          }}
          options={computations.map((c) => c.key)}
          placeholder="Select computation"
        />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] text-text-secondary">over the last</span>
        <input
          type="number"
          min={1}
          value={evaluate.windowValue}
          onChange={(e) => onUpdate({ ...evaluate, windowValue: Number(e.target.value) })}
          className="h-8 w-14 px-2 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60"
        />
        <SmallSelect
          value={evaluate.windowUnit}
          onChange={(val) => onUpdate({ ...evaluate, windowUnit: val })}
          options={["minutes","hours","days"]}
        />
      </div>
      <div className="text-[11px] text-text-muted">
        Result stored as <code className="px-1.5 py-0.5 rounded bg-slate-100 text-primary font-mono text-[11px]">{outputVar}</code>
      </div>
    </div>
  );
}

// Channel selector (mock — replace with real channel list)
const MOCK_CHANNELS = [
  { id: "wa1", label: "+91 74360 36062 (WhatsApp)" },
  { id: "wa2", label: "+91 99880 12345 (WhatsApp)" },
  { id: "em1", label: "noreply@tspkarix.com (Email)" },
];
function ChannelSelector({ value, onChange }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 px-2 pr-6 text-[12px] rounded-md border border-border bg-white appearance-none cursor-pointer focus:outline-none focus:border-primary/60 text-text-primary"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
    >
      {MOCK_CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select>
  );
}

// A single trigger group block
function TriggerGroupBlock({
  group, groupIndex, totalGroups, properties,
  onAddFilter, onUpdateFilter, onDeleteFilter,
  onUpdateEvaluate, onRemoveGroup, onOpenEventPicker,
}) {
  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden">
      {/* Event selector row */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-secondary flex-shrink-0">Whenever user performs</span>
          <button
            type="button"
            onClick={onOpenEventPicker}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-white text-[12px] font-semibold text-text-primary hover:border-primary/50 hover:bg-white transition-colors"
          >
            {group.event.eventCategory}
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
        {totalGroups > 1 && (
          <button type="button" onClick={onRemoveGroup} className="text-[11px] text-text-muted hover:text-rose-500 ml-4 flex-shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* Filter rows + add button */}
      {(group.filters.length > 0 || true) && (
        <div className="px-4 py-3">
          {group.filters.length > 0 && (
            <div className="mb-2.5 space-y-1.5">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">With Attribute</span>
              <div className="space-y-1">
                {group.filters.map((row, rowIdx) => (
                  <FilterRow
                    key={row.id}
                    row={row}
                    properties={properties}
                    isFirst={rowIdx === 0}
                    onUpdate={(patch) => onUpdateFilter(rowIdx, patch)}
                    onDelete={() => onDeleteFilter(rowIdx)}
                    onToggleCombinator={() => onUpdateFilter(rowIdx, { combinator: row.combinator === "AND" ? "OR" : "AND" })}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onAddFilter}
            className="text-[12px] text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Attributes
          </button>

          <EvaluateBlock
            groupIndex={groupIndex}
            event={group.event}
            evaluate={group.evaluate}
            onUpdate={(val) => onUpdateEvaluate(val)}
            onRemove={() => onUpdateEvaluate(null)}
          />
        </div>
      )}
    </div>
  );
}

// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// STEP 2 COMPONENTS
// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───

// Searchable grouped dropdown used in step-2 for attributes and events
function GroupedSearchDropdown({ groups, itemKey, itemLabel, value, onChange, placeholder = "Select…", renderPreview }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const [hovered, setHov]   = useState(null);
  const lq = search.trim().toLowerCase();

  const filtered = groups.map((g) => ({
    ...g,
    items: (g.attributes || g.events || []).filter((i) =>
      !lq || (i[itemLabel] || "").toLowerCase().includes(lq),
    ),
  })).filter((g) => g.items.length > 0);

  const selected = value ? (typeof value === "object" ? value[itemLabel] : value) : null;
  const preview = hovered || (value && typeof value === "object" ? value : null);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSearch(""); setHov(null); } }}>
      <PopoverTrigger asChild>
        <button type="button" className={`h-8 px-2.5 text-[12px] rounded-md border bg-white flex items-center gap-1.5 min-w-[180px] max-w-[260px] hover:border-primary/40 ${!value ? "text-text-muted border-border" : "text-text-primary border-border"}`}>
          <span className="flex-1 text-left truncate">{selected || placeholder}</span>
          <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 flex" style={{ width: preview && renderPreview ? 500 : 260 }} align="start" sideOffset={4}>
        <div className="w-64 flex-shrink-0 flex flex-col border-r border-border">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search" className="flex-1 text-[12px] bg-transparent outline-none" />
          </div>
          <div className="overflow-y-auto max-h-60">
            {filtered.map((group) => (
              <div key={group.label || group.key}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wide bg-slate-50 sticky top-0 border-b border-border/50">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item[itemKey] || item.key}
                    type="button"
                    onMouseEnter={() => setHov(item)}
                    onClick={() => { onChange(item); setOpen(false); setSearch(""); setHov(null); }}
                    className={`w-full text-left px-3 py-2 text-[12px] border-b border-border/30 transition-colors ${
                      (value && (typeof value === "object" ? value[itemKey] : value) === item[itemKey])
                        ? "bg-primary-tint text-primary font-medium"
                        : "text-text-primary hover:bg-slate-50"
                    }`}
                  >
                    {item[itemLabel]}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-3 py-4 text-[12px] text-text-muted text-center">No match</div>}
          </div>
        </div>
        {preview && renderPreview && (
          <div className="w-[220px] p-4 bg-white">{renderPreview(preview)}</div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// User Property Tab
function UserPropertyTab({ condition, onUpdate }) {
  const ops = condition.attribute ? getOperatorsForType(condition.attribute.dataType) : [];
  const hideValue = !condition.operator || condition.operator === "exists" || condition.operator === "does not exist";
  const isBoolean = condition.attribute?.dataType === "boolean";

  return (
    <div className="flex items-start gap-2 flex-wrap">
      <GroupedSearchDropdown
        groups={ATTRIBUTE_GROUPS}
        itemKey="key" itemLabel="label"
        value={condition.attribute}
        onChange={(attr) => onUpdate({ attribute: attr, operator: ops[0] || null, value: null })}
        placeholder="Select attribute"
        renderPreview={(attr) => (
          <div>
            <div className="text-[13px] font-semibold text-text-primary mb-1">{attr.label}</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-text-muted font-medium">{attr.dataType}</span>
            {attr.description && <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">{attr.description}</p>}
            {attr.platform && <p className="text-[10px] text-text-muted mt-1">Platform: {attr.platform}</p>}
            <p className="text-[10px] text-text-muted mt-1">Last updated: Today</p>
          </div>
        )}
      />
      {condition.attribute && !isBoolean && ops.length > 0 && (
        <SmallSelect
          value={condition.operator}
          onChange={(op) => onUpdate({ operator: op, value: null })}
          options={ops}
          placeholder="Operator"
          error={condition.error && !condition.operator}
        />
      )}
      {isBoolean && condition.attribute && (
        <div className="flex items-center border border-border rounded-md overflow-hidden text-[12px]">
          {["true","false"].map((v) => (
            <button key={v} type="button" onClick={() => onUpdate({ value: v })}
              className={`px-3 h-8 font-medium capitalize ${condition.value === v ? "bg-primary text-white" : "bg-white text-text-secondary hover:bg-slate-50"}`}>
              {v}
            </button>
          ))}
        </div>
      )}
      {!hideValue && !isBoolean && condition.operator && (
        <input
          className={`h-8 px-2 text-[12px] rounded-md border bg-white w-36 focus:outline-none focus:border-primary/60 ${condition.error && !condition.value ? "border-rose-400 bg-rose-50" : "border-border"}`}
          placeholder="Value…"
          value={condition.value || ""}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      )}
    </div>
  );
}

// User Behavior Tab
function UserBehaviorTab({ condition, onUpdate, triggerEventNames = [] }) {
  const conflict = condition.eventName && triggerEventNames.includes(condition.eventName);
  const showNum  = condition.freqOp !== "zero_times";
  const showTimeN = !["ever","today","yesterday"].includes(condition.timeType);

  return (
    <div className="space-y-2">
      {/* Row 1: execution + event */}
      <div className="flex items-center gap-2 flex-wrap">
        <SmallSelect value={condition.executionQualifier} onChange={(v) => onUpdate({ executionQualifier: v })}
          options={["has_executed","has_not_executed"]} />
        <GroupedSearchDropdown
          groups={BEHAVIOR_EVENT_GROUPS}
          itemKey="key" itemLabel="label"
          value={condition.eventName ? { key: condition.eventName, label: EVENT_MAP[condition.eventName]?.label || condition.eventName } : null}
          onChange={(ev) => onUpdate({ eventName: ev.key })}
          placeholder="Select an event"
          renderPreview={(ev) => (
            <div>
              <div className="text-[13px] font-semibold text-text-primary mb-1">{ev.label}</div>
              {ev.description && <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{ev.description}</p>}
            </div>
          )}
        />
      </div>
      {/* Row 2: frequency */}
      {condition.eventName && (
        <div className="flex items-center gap-2 flex-wrap pl-1">
          <SmallSelect value={condition.freqOp} onChange={(v) => onUpdate({ freqOp: v })}
            options={["at_least","at_most","exactly","zero_times"]} />
          {showNum && (
            <input type="number" min={1} value={condition.freqVal}
              onChange={(e) => onUpdate({ freqVal: Number(e.target.value) })}
              className="h-8 w-14 px-2 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60" />
          )}
          <span className="text-[12px] text-text-secondary">times</span>
        </div>
      )}
      {/* Row 3: time window */}
      {condition.eventName && (
        <div className="flex items-center gap-2 flex-wrap pl-1">
          <SmallSelect value={condition.timeType} onChange={(v) => onUpdate({ timeType: v })}
            options={["in_last","between","ever","today","yesterday"]} />
          {showTimeN && (
            <>
              <input type="number" min={1} value={condition.timeN}
                onChange={(e) => onUpdate({ timeN: Number(e.target.value) })}
                className="h-8 w-14 px-2 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60" />
              {condition.timeType === "in_last" && (
                <SmallSelect value={condition.timeUnit} onChange={(v) => onUpdate({ timeUnit: v })} options={["days","hours","weeks"]} />
              )}
            </>
          )}
        </div>
      )}
      {/* Event conflict warning */}
      {conflict && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          This event is also your flow trigger. The user must fire this event at least twice to qualify.
        </div>
      )}
    </div>
  );
}

// User Affinity Tab
function UserAffinityTab({ condition, onUpdate }) {
  const dimValues    = condition.dimension ? AFFINITY_DIMENSION_VALUES[condition.dimension] : null;
  const isFreeText   = condition.dimension === "CONTENT_CATEGORY";
  const showCaseSens = condition.dimension === "ACTIVITY_NAME" || condition.dimension === "CONTENT_CATEGORY";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-text-secondary">Has Executed</span>
        <GroupedSearchDropdown
          groups={BEHAVIOR_EVENT_GROUPS}
          itemKey="key" itemLabel="label"
          value={condition.baseEvent ? { key: condition.baseEvent, label: EVENT_MAP[condition.baseEvent]?.label || condition.baseEvent } : null}
          onChange={(ev) => onUpdate({ baseEvent: ev.key })}
          placeholder="Select event"
        />
      </div>
      {condition.baseEvent && (
        <div className="flex items-center gap-2 flex-wrap pl-1">
          <span className="text-[12px] text-text-secondary font-medium">Predominantly</span>
          <span className="text-[12px] text-text-secondary">with</span>
          <SmallSelect value={condition.dimension} onChange={(v) => onUpdate({ dimension: v, value: null })}
            options={AFFINITY_DIMENSIONS.map((d) => d.key)} placeholder="Dimension" />
          {condition.dimension && (
            <SmallSelect value={condition.operator} onChange={(v) => onUpdate({ operator: v })} options={["is","is not"]} />
          )}
          {condition.dimension && !isFreeText && dimValues && (
            <SmallSelect value={condition.value} onChange={(v) => onUpdate({ value: v })} options={dimValues} placeholder="Value" />
          )}
          {isFreeText && condition.dimension && (
            <input value={condition.value || ""} onChange={(e) => onUpdate({ value: e.target.value })}
              className="h-8 px-2 text-[12px] rounded-md border border-border bg-white w-36 focus:outline-none focus:border-primary/60"
              placeholder="Category…" />
          )}
          {showCaseSens && condition.dimension && (
            <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
              <input type="checkbox" checked={condition.caseSensitive}
                onChange={(e) => onUpdate({ caseSensitive: e.target.checked })}
                className="w-3 h-3 accent-primary rounded" />
              Case Sensitive
            </label>
          )}
        </div>
      )}
      {condition.baseEvent && (
        <div className="flex items-center gap-2 pl-1">
          <span className="text-[12px] text-text-secondary">in the last</span>
          <input type="number" min={1} value={condition.timeWindowDays}
            onChange={(e) => onUpdate({ timeWindowDays: Number(e.target.value) })}
            className="h-8 w-14 px-2 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60" />
          <span className="text-[12px] text-text-secondary">Days</span>
        </div>
      )}
    </div>
  );
}

// Custom Segment Tab
function CustomSegmentTab({ condition, onUpdate }) {
  const [search, setSearch] = useState("");
  const lq = search.trim().toLowerCase();
  const filtered = lq ? MOCK_SEGMENTS.filter((s) => s.name.toLowerCase().includes(lq)) : MOCK_SEGMENTS;
  const selected = condition.selectedSegments || [];
  const hasStatic = selected.some((id) => MOCK_SEGMENTS.find((s) => s.id === id)?.type === "static");

  const toggle = (segId) => {
    const next = selected.includes(segId) ? selected.filter((x) => x !== segId) : [...selected, segId];
    onUpdate({ selectedSegments: next });
  };

  return (
    <div className="space-y-2">
      {/* TODO: replace MOCK_SEGMENTS with real GET /api/segments call */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search segments…"
          className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60" />
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {filtered.map((seg) => (
          <label key={seg.id} className="flex items-center gap-2.5 px-2 py-2 rounded-md border border-border bg-white cursor-pointer hover:bg-slate-50">
            <input type="checkbox" className="w-3.5 h-3.5 accent-primary rounded"
              checked={selected.includes(seg.id)} onChange={() => toggle(seg.id)} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-text-primary truncate">{seg.name}</div>
              <div className="text-[10px] text-text-muted">{new Intl.NumberFormat("en-IN").format(seg.userCount)} users · {seg.updatedAt}</div>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide flex-shrink-0 ${
              seg.type === "dynamic" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {seg.type}
            </span>
          </label>
        ))}
      </div>
      {hasStatic && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          This segment cannot be evaluated in real-time. Audience is frozen at publish time.
        </div>
      )}
    </div>
  );
}

// Single filter block
function FilterBlock({ group, onUpdate, onRemove, showRemove, triggerEventNames, isNested = false }) {
  const tabs = [
    { key: "user_property", label: "User property" },
    { key: "user_behavior", label: "User behavior" },
    { key: "user_affinity", label: "User affinity" },
    { key: "custom_segment", label: "Custom segment" },
  ];

  const activeConditions = group.conditions;

  const updateCond = (idx, patch) => {
    const next = activeConditions.map((c, i) => i === idx ? { ...c, ...patch } : c);
    onUpdate({ conditions: next });
  };
  const addCond = () => onUpdate({ conditions: [...activeConditions, mkCondForTab(group.tab)] });
  const delCond = (idx) => onUpdate({ conditions: activeConditions.filter((_, i) => i !== idx) });

  const switchTab = (tab) => onUpdate({ tab, conditions: [mkCondForTab(tab)] });

  return (
    <div className={`border border-border rounded-lg bg-white overflow-hidden ${isNested ? "ml-4 border-l-2 border-l-primary/30" : ""}`}>
      {/* Tab bar + collapse */}
      <div className="flex items-center border-b border-border bg-slate-50/60">
        <button type="button" onClick={() => onUpdate({ collapsed: !group.collapsed })}
          className="p-2 pl-3 text-text-muted hover:text-text-primary flex-shrink-0">
          {group.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <div className="flex flex-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button key={tab.key} type="button"
              onClick={() => switchTab(tab.key)}
              className={`px-3 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                group.tab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove} className="p-2 pr-3 text-text-muted hover:text-rose-500 flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!group.collapsed && (
        <div className="px-4 py-3 space-y-3">
          {activeConditions.map((cond, idx) => (
            <div key={cond.id}>
              {/* AND/OR between conditions */}
              {idx > 0 && (
                <div className="mb-2">
                  <button type="button"
                    onClick={() => updateCond(idx, { combinator: cond.combinator === "AND" ? "OR" : "AND" })}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-semibold"
                    style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", backgroundColor: "var(--color-primary-tint)" }}>
                    {cond.combinator || "AND"}<ChevronDown className="w-2.5 h-2.5 opacity-70" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {group.tab === "user_property" && (
                    <UserPropertyTab condition={cond} onUpdate={(p) => updateCond(idx, p)} />
                  )}
                  {group.tab === "user_behavior" && (
                    <UserBehaviorTab condition={cond} onUpdate={(p) => updateCond(idx, p)} triggerEventNames={triggerEventNames} />
                  )}
                  {group.tab === "user_affinity" && (
                    <UserAffinityTab condition={cond} onUpdate={(p) => updateCond(idx, p)} />
                  )}
                  {group.tab === "custom_segment" && (
                    <CustomSegmentTab condition={cond} onUpdate={(p) => updateCond(idx, p)} />
                  )}
                </div>
                {activeConditions.length > 1 && (
                  <button type="button" onClick={() => delCond(idx)} className="p-1.5 rounded hover:bg-rose-50 text-text-muted hover:text-rose-500 flex-shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {group.tab !== "custom_segment" && (
            <button type="button" onClick={addCond}
              className="text-[12px] text-primary hover:underline flex items-center gap-1 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add condition
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Full Step 2 view
function Step2View({ step2, setStep2, triggerGroups, onBack, onFinish }) {
  const [showCountResult, setShowCountResult] = useState(null);
  const [showCountLoading, setShowCountLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [errors, setErrors] = useState([]);

  const s = step2;
  const upd = (patch) => setStep2((prev) => ({ ...prev, ...patch }));
  const updGroup = (idx, patch) => setStep2((prev) => ({
    ...prev,
    filterGroups: prev.filterGroups.map((g, i) => i === idx ? { ...g, ...patch } : g),
  }));
  const addGroup  = () => setStep2((prev) => ({ ...prev, filterGroups: [...prev.filterGroups, mkFilterGroup()] }));
  const delGroup  = (idx) => setStep2((prev) => ({ ...prev, filterGroups: prev.filterGroups.filter((_, i) => i !== idx) }));
  const updExclude = (idx, patch) => setStep2((prev) => ({
    ...prev,
    excludeGroups: prev.excludeGroups.map((g, i) => i === idx ? { ...g, ...patch } : g),
  }));

  const triggerEventNames = triggerGroups.flatMap((g) => g.event ? [g.event.id] : []);

  const handleShowCount = () => {
    setShowCountLoading(true);
    setShowCountResult(null);
    // TODO: wire real count API — GET /api/audience/count
    setTimeout(() => { setShowCountLoading(false); setShowCountResult(12450); }, 1000);
  };

  const handleFinish = () => {
    const errs = [];
    if (s.audienceMode === "filter_by" && s.filterGroups.every((g) => g.conditions.every((c) => {
      if (c.type === "user_property") return !c.attribute;
      if (c.type === "user_behavior") return !c.eventName;
      if (c.type === "user_affinity") return !c.baseEvent;
      if (c.type === "custom_segment") return c.selectedSegments.length === 0;
      return false;
    }))) {
      errs.push("Please add at least one audience filter or switch to All Users.");
    }
    if (s.freqCap.enabled && (!s.freqCap.times || !s.freqCap.withinVal)) {
      errs.push("Please complete the frequency cap settings.");
    }
    if (s.ctrlGroups.flowOn && (s.ctrlGroups.flowPct < 1 || s.ctrlGroups.flowPct > 50)) {
      errs.push("Control group cannot exceed 50% of audience.");
    }
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    onFinish({
      audience: {
        mode: s.audienceMode,
        filterGroups: s.filterGroups.map((g) => ({
          combinator: g.combinator,
          conditions: g.conditions.map((c) => ({ ...c })),
        })),
        excludeFilterGroups: s.excludeEnabled ? s.excludeGroups.map((g) => ({
          combinator: g.combinator,
          conditions: g.conditions.map((c) => ({ ...c })),
        })) : [],
      },
      frequencyCap: {
        enabled: s.freqCap.enabled,
        times: s.freqCap.times,
        withinValue: s.freqCap.withinVal,
        withinUnit: s.freqCap.withinUnit,
      },
      controlGroups: {
        globalEnabled: s.ctrlGroups.globalOn,
        flowEnabled:   s.ctrlGroups.flowOn,
        flowPct:       s.ctrlGroups.flowPct,
      },
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <WizardHeader activeStep={2} step1Done={true} />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Audience mode */}
        <div>
          <div className="text-[13px] font-semibold text-text-primary mb-2">Audience</div>
          <div className="flex items-center gap-5">
            {[["all_users","All users"],["filter_by","Filter users by"]].map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer text-[13px] text-text-primary">
                <input type="radio" className="accent-primary" checked={s.audienceMode === val} onChange={() => upd({ audienceMode: val })} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Filter groups */}
        {s.audienceMode === "filter_by" && (
          <div className="space-y-3">
            {s.filterGroups.map((group, idx) => (
              <div key={group.id}>
                {idx > 0 && (
                  <div className="flex items-center my-1">
                    <button type="button"
                      onClick={() => updGroup(idx, { combinator: group.combinator === "AND" ? "OR" : "AND" })}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-semibold"
                      style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", backgroundColor: "var(--color-primary-tint)" }}>
                      {group.combinator}<ChevronDown className="w-2.5 h-2.5 opacity-70" />
                    </button>
                  </div>
                )}
                <FilterBlock
                  group={group}
                  onUpdate={(patch) => updGroup(idx, patch)}
                  onRemove={() => delGroup(idx)}
                  showRemove={s.filterGroups.length > 1}
                  triggerEventNames={triggerEventNames}
                />
              </div>
            ))}

            <button type="button" onClick={addGroup}
              className="text-[12px] text-text-secondary border border-dashed border-border rounded-md px-3 py-1.5 hover:border-primary/40 hover:text-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        )}

        {/* Exclude Users */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-3.5 h-3.5 accent-primary rounded"
              checked={s.excludeEnabled} onChange={(e) => upd({ excludeEnabled: e.target.checked })} />
            <span className="text-[13px] text-text-primary">Exclude Users</span>
          </label>
          {s.excludeEnabled && s.audienceMode === "filter_by" && (
            <div className="mt-3 space-y-3">
              {s.excludeGroups.map((group, idx) => (
                <FilterBlock key={group.id} group={group}
                  onUpdate={(patch) => updExclude(idx, patch)}
                  onRemove={() => {}} showRemove={false}
                  triggerEventNames={triggerEventNames} />
              ))}
            </div>
          )}
        </div>

        {/* Reset filters */}
        <div className="pt-1">
          {showResetConfirm ? (
            <span className="text-[12px] text-text-secondary">
              Clear all filters?{" "}
              <button type="button" className="text-rose-600 font-medium hover:underline mr-2"
                onClick={() => { setStep2(mkDefaultStep2()); setShowResetConfirm(false); }}>Yes</button>
              <button type="button" className="text-text-muted hover:underline"
                onClick={() => setShowResetConfirm(false)}>Cancel</button>
            </span>
          ) : (
            <button type="button" onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 text-[12px] text-primary hover:underline">
              <RefreshCw className="w-3 h-3" /> Reset filters
            </button>
          )}
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{e}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border bg-white">
        {/* Frequency cap */}
        <div className="px-6 py-3 border-b border-border/60">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" className="w-3.5 h-3.5 accent-primary rounded"
              checked={s.freqCap.enabled} onChange={(e) => upd({ freqCap: { ...s.freqCap, enabled: e.target.checked } })} />
            <span className="text-[12px] font-medium text-text-primary">Limit entry frequency</span>
          </label>
          {s.freqCap.enabled && (
            <div className="flex items-center gap-2 pl-5 text-[12px] text-text-secondary">
              <span>Limit to</span>
              <input type="number" min={1} value={s.freqCap.times}
                onChange={(e) => upd({ freqCap: { ...s.freqCap, times: Number(e.target.value) } })}
                className="h-7 w-12 px-1.5 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60 text-center" />
              <span>time(s) within</span>
              <input type="number" min={1} value={s.freqCap.withinVal}
                onChange={(e) => upd({ freqCap: { ...s.freqCap, withinVal: Number(e.target.value) } })}
                className="h-7 w-12 px-1.5 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60 text-center" />
              <SmallSelect value={s.freqCap.withinUnit} onChange={(v) => upd({ freqCap: { ...s.freqCap, withinUnit: v } })}
                options={["day","week","month","all_time"]} />
            </div>
          )}
        </div>

        {/* Control groups */}
        <div className="px-6 py-3 border-b border-border/60 flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary">
            <input type="checkbox" className="w-3.5 h-3.5 accent-primary rounded"
              checked={s.ctrlGroups.globalOn} onChange={(e) => upd({ ctrlGroups: { ...s.ctrlGroups, globalOn: e.target.checked } })} />
            Global control group
            <span title="Users in the global holdout group are excluded from all flows" className="text-text-muted cursor-help">
              <Info className="w-3 h-3" />
            </span>
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-primary">
              <input type="checkbox" className="w-3.5 h-3.5 accent-primary rounded"
                checked={s.ctrlGroups.flowOn} onChange={(e) => upd({ ctrlGroups: { ...s.ctrlGroups, flowOn: e.target.checked } })} />
              Flow control group
            </label>
            {s.ctrlGroups.flowOn && (
              <>
                <input type="number" min={1} max={50} value={s.ctrlGroups.flowPct}
                  onChange={(e) => upd({ ctrlGroups: { ...s.ctrlGroups, flowPct: Number(e.target.value) } })}
                  className="h-7 w-12 px-1.5 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60 text-center" />
                <span className="text-[12px] text-text-secondary">% of users entering</span>
              </>
            )}
          </div>
        </div>

        {/* Back + Finish */}
        <div className="px-6 py-3 flex items-center justify-between">
          <button type="button" onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:bg-slate-50">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button type="button" onClick={handleFinish}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-white text-[13px] font-medium hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}>
            Finish →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// EXIT TRIGGER COMPONENT
// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───

function mkExitAttr() { return { id: uid(), property: null, operator: null, value: null }; }
function mkExitCond() { return { id: uid(), event: null, attributes: [mkExitAttr()] }; }

function ExitTriggerBlock({ exitTrigger, onChange }) {
  const upd = (patch) => onChange({ ...exitTrigger, ...patch });

  const updCond = (idx, patch) => upd({ conditions: exitTrigger.conditions.map((c, i) => i === idx ? { ...c, ...patch } : c) });
  const delCond = (idx) => upd({ conditions: exitTrigger.conditions.filter((_, i) => i !== idx) });
  const addCond = () => upd({ conditions: [...exitTrigger.conditions, mkExitCond()] });

  const updAttr = (condIdx, attrIdx, patch) => {
    const cond = exitTrigger.conditions[condIdx];
    const attrs = cond.attributes.map((a, i) => i === attrIdx ? { ...a, ...patch } : a);
    updCond(condIdx, { attributes: attrs });
  };
  const delAttr = (condIdx, attrIdx) => {
    const cond = exitTrigger.conditions[condIdx];
    updCond(condIdx, { attributes: cond.attributes.filter((_, i) => i !== attrIdx) });
  };
  const addAttr = (condIdx) => {
    const cond = exitTrigger.conditions[condIdx];
    updCond(condIdx, { attributes: [...cond.attributes, mkExitAttr()] });
  };

  // Entry point — disabled/collapsed
  if (!exitTrigger.enabled) {
    return (
      <button
        type="button"
        onClick={() => upd({ enabled: true, conditions: [mkExitCond()] })}
        className="text-[12px] text-primary hover:underline flex items-center gap-1 font-medium"
      >
        <Plus className="w-3.5 h-3.5" /> Add Exit Trigger
      </button>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <h4 className="text-[13px] font-semibold text-text-primary">Exit Trigger</h4>
          <p className="text-[11px] text-text-muted mt-0.5">
            Exit trigger determines the events which must occur for a user to exit the flow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => upd({ enabled: false, conditions: [] })}
          className="text-[12px] text-rose-500 hover:text-rose-600 font-medium flex-shrink-0 ml-4"
        >
          Clear Exit Trigger
        </button>
      </div>

      {/* Conditions container */}
      <div className="border border-border rounded-lg bg-white px-5 py-4 space-y-5">
        {exitTrigger.conditions.map((cond, condIdx) => {
          const props = cond.event ? getPropertiesForEvent(cond.event) : [];
          const validProps = Array.isArray(props) ? props : [];

          return (
            <div key={cond.id} className="space-y-2">
              {/* WHERE row */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-text-muted w-14 flex-shrink-0">WHERE</span>
                {/* Condition type — fixed to behavioral for now */}
                <div className="h-8 px-2.5 flex items-center gap-1.5 rounded-md border border-border bg-white text-[12px] text-text-primary min-w-[220px]">
                  <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                  </svg>
                  <span>What someone has done (or not done)</span>
                  <ChevronDown className="w-3 h-3 text-text-muted ml-auto" />
                </div>
                {/* Delete this condition (only when >1) */}
                {exitTrigger.conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => delCond(condIdx)}
                    className="ml-auto p-1.5 rounded hover:bg-rose-50 text-text-muted hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Has [event] row */}
              <div className="flex items-center gap-2 pl-16">
                <span className="text-[12px] text-text-secondary flex-shrink-0">Has</span>
                <GroupedSearchDropdown
                  groups={BEHAVIOR_EVENT_GROUPS}
                  itemKey="key"
                  itemLabel="label"
                  value={cond.event ? { key: cond.event, label: EVENT_MAP[cond.event]?.label || cond.event } : null}
                  onChange={(ev) => updCond(condIdx, { event: ev.key, attributes: [mkExitAttr()] })}
                  placeholder="Select event…"
                />
              </div>

              {/* Attribute filter rows */}
              {cond.event && (
                <div className="pl-16 space-y-2">
                  {cond.attributes.map((attr, attrIdx) => {
                    const selProp = attr.property ? validProps.find((p) => p.key === attr.property) : null;
                    const ops     = selProp ? (selProp.ops || getOperatorsForType(selProp.type)) : [];
                    const hideVal = !attr.operator || attr.operator === "Exists" || attr.operator === "Doesn't Exist" || attr.operator === "exists" || attr.operator === "does not exist";

                    return (
                      <div key={attr.id} className="flex items-center gap-2 flex-wrap">
                        {/* Funnel icon */}
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                          <svg className="w-3.5 h-3.5" style={{ color: PRIMARY }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M3 4h18l-7 9v7l-4-2v-5L3 4z" />
                          </svg>
                        </div>

                        {/* Attribute selector */}
                        <select
                          value={attr.property || ""}
                          onChange={(e) => updAttr(condIdx, attrIdx, { property: e.target.value || null, operator: null, value: null })}
                          className="h-8 px-2 pr-7 text-[12px] rounded-md border border-border bg-white appearance-none focus:outline-none focus:border-primary/60 min-w-[160px]"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
                        >
                          <option value="">Select attribute…</option>
                          {validProps.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
                        </select>

                        {/* Operator selector */}
                        {selProp && ops.length > 0 && selProp.type !== "boolean" && (
                          <SmallSelect
                            value={attr.operator}
                            onChange={(op) => updAttr(condIdx, attrIdx, { operator: op, value: null })}
                            options={Array.isArray(ops) ? ops : []}
                            placeholder="Operator"
                          />
                        )}

                        {/* Boolean toggle */}
                        {selProp?.type === "boolean" && (
                          <div className="flex items-center border border-border rounded-md overflow-hidden">
                            {["True","False"].map((v) => (
                              <button key={v} type="button"
                                onClick={() => updAttr(condIdx, attrIdx, { value: v })}
                                className={`px-2.5 h-8 text-[12px] font-medium transition-colors ${attr.value === v ? "bg-primary text-white" : "bg-white text-text-secondary hover:bg-slate-50"}`}>
                                {v}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Value input */}
                        {!hideVal && selProp && selProp.type !== "boolean" && attr.operator && (
                          <input
                            className="h-8 px-2 text-[12px] rounded-md border border-border bg-white w-28 focus:outline-none focus:border-primary/60"
                            placeholder="Value…"
                            value={typeof attr.value === "string" ? attr.value : ""}
                            onChange={(e) => updAttr(condIdx, attrIdx, { value: e.target.value })}
                          />
                        )}

                        {/* Delete attribute */}
                        <button type="button" onClick={() => delAttr(condIdx, attrIdx)}
                          className="p-1.5 rounded hover:bg-rose-50 text-text-muted hover:text-rose-500 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Add attribute */}
                        <button type="button" onClick={() => addAttr(condIdx)}
                          className="w-7 h-7 rounded-md border border-border bg-white flex items-center justify-center text-text-muted hover:border-primary/40 hover:text-primary flex-shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Add condition */}
        <button
          type="button"
          onClick={addCond}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] text-text-secondary hover:border-primary/40 hover:text-primary"
        >
          <Plus className="w-3.5 h-3.5" /> Add Condition
        </button>
      </div>
    </div>
  );
}

// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// BROADCAST COMPONENTS
// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───

// ── Mini calendar picker ──────────────────────────────────────
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarPicker({ value, onChange }) {
  const today   = new Date();
  const sel     = value ? new Date(value + "T00:00:00") : null;
  const [open, setOpen]   = useState(false);
  const [year, setYear]   = useState(sel ? sel.getFullYear() : today.getFullYear());
  const [month, setMonth] = useState(sel ? sel.getMonth() : today.getMonth());

  const firstDay  = new Date(year, month, 1);
  const daysInMon = new Date(year, month + 1, 0).getDate();
  // Monday-first offset: 0=Mon…6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = Array.from({ length: startOffset + daysInMon }, (_, i) =>
    i < startOffset ? null : i - startOffset + 1,
  );
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday   = (d) => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
  const isSelected= (d) => sel && d && year === sel.getFullYear() && month === sel.getMonth() && d === sel.getDate();

  const selectDay = (d) => {
    if (!d) return;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  };

  const goToToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };
  const prevYear  = () => setYear((y) => y - 1);
  const nextYear  = () => setYear((y) => y + 1);
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const displayVal = sel ? sel.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Select date";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 px-3 flex items-center gap-2 rounded-md border border-border bg-white text-[13px] text-text-primary hover:border-primary/50 min-w-[200px]"
      >
        <span className="flex-1 text-left">{displayVal}</span>
        <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg p-3 z-20 w-64">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevYear}  className="p-1 rounded hover:bg-slate-100 text-text-muted text-[12px]">«</button>
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-text-muted text-[12px]">‹</button>
            <span className="text-[12px] font-semibold text-text-primary flex-1 text-center">{MONTHS[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-text-muted text-[12px]">›</button>
            <button type="button" onClick={nextYear}  className="p-1 rounded hover:bg-slate-100 text-text-muted text-[12px]">»</button>
            <button type="button" onClick={goToToday} className="ml-1 text-[11px] text-primary hover:underline font-medium">Today</button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => <div key={d} className="text-center text-[10px] text-text-muted font-medium py-0.5">{d}</div>)}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(d)}
                disabled={!d}
                className={[
                  "h-7 w-7 mx-auto rounded-full text-[12px] flex items-center justify-center transition-colors",
                  !d ? "" :
                  isSelected(d) ? "text-white font-semibold" :
                  isToday(d)    ? "border-2 text-primary font-semibold border-primary" :
                  "text-text-primary hover:bg-slate-100",
                ].join(" ")}
                style={isSelected(d) ? { backgroundColor: PRIMARY } : {}}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Time spinner (HH:MM + am/pm) ─────────────────────────────
function TimeSpinner({ hour, minute, ampm, onChange }) {
  const spin = (field, delta) => {
    if (field === "hour") {
      const next = ((hour - 1 + delta + 12) % 12) + 1;
      onChange({ hour: next, minute, ampm });
    } else {
      const next = (minute + delta + 60) % 60;
      onChange({ hour, minute: next, ampm });
    }
  };
  const SpinBox = ({ value, field }) => (
    <div className="flex flex-col items-center border border-border rounded-md overflow-hidden">
      <button type="button" onClick={() => spin(field, 1)} className="px-2.5 py-0.5 hover:bg-slate-50 text-text-muted text-[10px]">▲</button>
      <div className="px-2.5 py-1 text-[13px] font-mono font-semibold text-text-primary w-9 text-center border-y border-border">
        {String(value).padStart(2, "0")}
      </div>
      <button type="button" onClick={() => spin(field, -1)} className="px-2.5 py-0.5 hover:bg-slate-50 text-text-muted text-[10px]">▼</button>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <SpinBox value={hour} field="hour" />
      <span className="text-[16px] font-semibold text-text-muted">:</span>
      <SpinBox value={minute} field="minute" />
      <div className="flex border border-border rounded-md overflow-hidden ml-1">
        {["am","pm"].map((v) => (
          <button key={v} type="button"
            onClick={() => onChange({ hour, minute, ampm: v })}
            className={`px-2.5 py-1.5 text-[12px] font-medium transition-colors ${ampm === v ? "border border-primary text-primary bg-white" : "text-text-muted hover:bg-slate-50 bg-white"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Broadcast Step 1 — Schedule config ────────────────────────
function BroadcastStep1View({ schedule, onScheduleChange, selectedChannel, onChannelChange, triggerGroups, onNext }) {
  const upd = (patch) => onScheduleChange((p) => ({ ...p, ...patch }));

  const hour24 = schedule.ampm === "am"
    ? (schedule.sendHour === 12 ? 0 : schedule.sendHour)
    : (schedule.sendHour === 12 ? 12 : schedule.sendHour + 12);
  const pastError = schedule.type === "at_specific_date_time" && isPastDateTime(schedule.startDate, hour24, schedule.sendMinute);

  const triggerEvent = triggerGroups[0]?.event;
  const headerLabel  = SIDEBAR_HEADERS.find((h) => h.key === triggerEvent?.header)?.label || "Broadcast";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <WizardHeader activeStep={1} step1Done={false} />

      {/* Subheader */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-text-secondary">Create trigger based on</span>
          <span className="font-semibold text-text-primary">{headerLabel}</span>
        </div>
        <ChannelSelector value={selectedChannel} onChange={onChannelChange} />
      </div>

      {/* Body: sidebar + right panel */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-[220px] flex-shrink-0 border-r border-border px-4 py-5 space-y-1">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">User entry</div>
          <div className="text-[11px] text-text-muted mb-1">One Time</div>
          {[
            { val: "as_soon_as_possible", label: "As soon as possible" },
            { val: "at_specific_date_time", label: "At specific date and time" },
          ].map(({ val, label }) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer py-1">
              <input type="radio" className="accent-primary" checked={schedule.type === val} onChange={() => upd({ type: val })} />
              <span className="text-[13px] text-text-primary">{label}</span>
            </label>
          ))}
        </aside>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
            <h3 className="text-[15px] font-semibold text-text-primary">
              {schedule.type === "as_soon_as_possible" ? "As soon as possible" : "At specific date and time"}
            </h3>
            <button type="button" onClick={() => upd({ type: "as_soon_as_possible", startDate: null, sendHour: 9, sendMinute: 0, ampm: "am" })}
              className="text-[12px] text-primary hover:underline">
              Reset to defaults
            </button>
          </div>

          <div className="px-6 py-5 flex-1">
            {schedule.type === "as_soon_as_possible" && (
              <p className="text-[13px] text-text-secondary leading-relaxed">
                The flow will start sending as soon as it is published.
              </p>
            )}

            {schedule.type === "at_specific_date_time" && (
              <div className="space-y-5">
                {/* Timezone selector */}
                <div className="flex justify-end">
                  <div>
                    <div className="text-[11px] text-text-muted mb-1 text-right">Campaign time zone</div>
                    <select
                      value={schedule.timezone}
                      onChange={(e) => upd({ timezone: e.target.value })}
                      className="h-8 px-2 pr-8 text-[12px] rounded-md border border-border bg-white appearance-none cursor-pointer focus:outline-none focus:border-primary/60"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
                    >
                      {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Date + Time row */}
                <div className="flex items-start gap-8">
                  <div>
                    <div className="text-[12px] text-text-secondary font-medium mb-1.5">Start date</div>
                    <CalendarPicker value={schedule.startDate} onChange={(d) => upd({ startDate: d })} />
                    {pastError && (
                      <p className="text-[11px] text-rose-600 mt-1.5">
                        Start date and time has already passed in {schedule.timezone.replace("_", " ")} time zone
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="text-[12px] text-text-secondary font-medium mb-1.5">Send time</div>
                    <TimeSpinner
                      hour={schedule.sendHour}
                      minute={schedule.sendMinute}
                      ampm={schedule.ampm}
                      onChange={({ hour, minute, ampm }) => upd({ sendHour: hour, sendMinute: minute, ampm })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-white flex-shrink-0">
        <button type="button" onClick={onNext}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-white text-[13px] font-medium hover:opacity-90"
          style={{ backgroundColor: PRIMARY }}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Broadcast Step 2 — Audience selection ─────────────────────
function SegmentPicker({ selectedSegments, onChange }) {
  const [search, setSearch] = useState("");
  const lq = search.trim().toLowerCase();
  const filtered = lq ? BROADCAST_MOCK_SEGMENTS.filter((s) => s.name.toLowerCase().includes(lq)) : BROADCAST_MOCK_SEGMENTS;

  const toggle = (seg) => {
    const exists = selectedSegments.find((s) => s.id === seg.id);
    onChange(exists ? selectedSegments.filter((s) => s.id !== seg.id) : [...selectedSegments, seg]);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search segments…"
          className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-border bg-white focus:outline-none focus:border-primary/60" />
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {/* TODO: replace BROADCAST_MOCK_SEGMENTS with real GET /api/segments */}
        {filtered.map((seg) => (
          <label key={seg.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border bg-white cursor-pointer hover:bg-slate-50">
            <input type="checkbox" className="w-3.5 h-3.5 accent-primary rounded" checked={!!selectedSegments.find((s) => s.id === seg.id)} onChange={() => toggle(seg)} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-text-primary truncate">{seg.name}</div>
              <div className="text-[10px] text-text-muted">{new Intl.NumberFormat("en-IN").format(seg.userCount)} users · {seg.updatedAt}</div>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide flex-shrink-0 ${seg.type === "dynamic" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {seg.type}
            </span>
          </label>
        ))}
      </div>
      {selectedSegments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {selectedSegments.map((seg) => (
            <span key={seg.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-tint text-primary text-[11px] font-medium">
              {seg.name}
              <button type="button" onClick={() => toggle(seg)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CSVUploader({ csvFile, csvMapping, onFileChange, onMappingChange }) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const firstLine = text.split("\n")[0];
      const columns = firstLine.split(",").map((c) => c.trim().replace(/"/g, ""));
      const rowCount = text.split("\n").filter((l) => l.trim()).length - 1;
      onFileChange({ name: file.name, size: file.size, columns, rowCount });
    };
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = SAMPLE_CSV_FILENAME; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3 space-y-3">
      {!csvFile ? (
        <div>
          <div
            className="border-2 border-dashed border-primary/40 rounded-lg px-6 py-6 text-center cursor-pointer hover:bg-primary-tint/20 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="text-[13px] font-medium text-primary mb-1">Upload ↑</div>
            <div className="text-[11px] text-text-muted">Drag and drop or click to browse · Max 10MB</div>
          </div>
          <button type="button" onClick={downloadSample} className="text-[11px] text-text-secondary hover:underline flex items-center gap-1 mt-1.5">
            ↓ Sample File
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-white">
            <div>
              <div className="text-[12px] font-medium text-text-primary">{csvFile.name}</div>
              <div className="text-[11px] text-text-muted">{csvFile.rowCount} contacts · {(csvFile.size / 1024).toFixed(1)} KB</div>
            </div>
            <button type="button" onClick={() => onFileChange(null)} className="p-1 hover:bg-rose-50 rounded text-text-muted hover:text-rose-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Column mapping */}
          <div className="space-y-2">
            <div className="text-[12px] font-medium text-text-secondary">Map your CSV columns:</div>
            {[
              { key: "phoneColumn", label: "Phone number column", required: true },
              { key: "nameColumn",  label: "Name column (optional)", required: false },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[12px] text-text-secondary w-40">{label}</span>
                <select value={csvMapping[key] || ""} onChange={(e) => onMappingChange({ ...csvMapping, [key]: e.target.value || null })}
                  className="h-7 px-2 pr-7 text-[12px] rounded-md border border-border bg-white appearance-none focus:outline-none focus:border-primary/60"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}>
                  <option value="">Select column</option>
                  {csvFile.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EstimatedReachPanel({ reach }) {
  return (
    <div className="w-56 flex-shrink-0 border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-slate-50 border-b border-border">
        <div className="text-[13px] font-semibold text-text-primary text-center">Estimated Reach</div>
        <div className="text-[11px] text-text-muted text-center mt-0.5">This count is an approximate value</div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 bg-white">
        {/* TODO: update reach via real GET /api/audience/count when sourceType/filters change */}
        <div className="text-[40px] font-bold text-text-primary tabular-nums">
          {new Intl.NumberFormat("en-IN").format(reach)}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border bg-slate-50 text-center">
        <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">
          The contacts from your suppression list will not be included in this broadcast
        </p>
        {/* TODO: wire onClick to open Suppression List settings */}
        <button type="button" className="text-[12px] font-medium text-text-primary underline hover:text-primary">
          Suppression List
        </button>
      </div>
    </div>
  );
}

function BroadcastStep2View({ schedule, audience, onAudienceChange, triggerGroups, onBack, onFinish }) {
  const upd = (patch) => onAudienceChange((p) => ({ ...p, ...patch }));
  const [errors, setErrors] = useState([]);

  const reach = getMockReachCount({
    sourceType: audience.activeCard,
    selectedSegments: audience.selectedSegments,
    csvRowCount: audience.csvFile?.rowCount || 0,
    hasInclude: audience.includeGroups.length > 0,
    hasExclude: audience.excludeGroups.length > 0,
  });

  const CARDS = [
    { id: "all_users",   icon: "🌐", title: "Send to all users",         desc: "Send this flow to all of your users" },
    { id: "segment",     icon: "👥", title: "Send to specific users",     desc: "Select your contacts from your segments & CSV uploads" },
    { id: "direct_csv",  icon: "📋", title: "Upload your audience here", desc: "Click to upload CSV files. Max file size 10MB." },
  ];

  const handleFinish = () => {
    const errs = [];
    if (!audience.activeCard) errs.push("Please select a target audience to continue.");
    if (audience.activeCard === "segment" && audience.selectedSegments.length === 0) errs.push("Please select at least one segment.");
    if ((audience.activeCard === "csv" || audience.activeCard === "direct_csv") && audience.csvFile && !audience.csvMapping.phoneColumn) errs.push("Please map the phone number column before continuing.");
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const hour24 = schedule.ampm === "am" ? (schedule.sendHour === 12 ? 0 : schedule.sendHour) : (schedule.sendHour === 12 ? 12 : schedule.sendHour + 12);
    onFinish({
      broadcastSchedule: {
        type: schedule.type,
        startDate: schedule.startDate || null,
        sendTime: schedule.type === "at_specific_date_time" ? `${String(hour24).padStart(2,"0")}:${String(schedule.sendMinute).padStart(2,"0")}` : null,
        timezone: schedule.timezone,
      },
      broadcastAudience: {
        sourceType: audience.activeCard,
        segments: audience.selectedSegments.map((s) => ({ segmentId: s.id, segmentName: s.name, segmentType: s.type, userCount: s.userCount })),
        csvFile: audience.csvFile ? { fileName: audience.csvFile.name, rowCount: audience.csvFile.rowCount, phoneColumn: audience.csvMapping.phoneColumn, nameColumn: audience.csvMapping.nameColumn } : null,
        includeFilters: audience.includeGroups,
        excludeFilters: audience.excludeGroups,
        estimatedReach: reach,
      },
      audience: null,
      frequencyCap: null,
      controlGroups: { globalEnabled: false, flowEnabled: false, flowPct: 0 },
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <WizardHeader activeStep={2} step1Done={true} />

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-4 px-6 py-5">
        {/* Left: audience config */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-w-0">
          <h3 className="text-[14px] font-semibold text-text-primary">Select Your Target Audience</h3>

          {/* Audience cards */}
          <div className="space-y-3">
            {CARDS.map((card) => {
              const active = audience.activeCard === card.id;
              return (
                <div
                  key={card.id}
                  className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${active ? "border-primary/50 bg-white" : "border-border bg-white hover:border-text-muted/40"}`}
                  onClick={() => !active && upd({ activeCard: card.id })}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">{card.icon}</span>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">{card.title}</div>
                      <div className="text-[11px] text-text-secondary">{card.desc}</div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {active && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      {card.id === "all_users" && (
                        <p className="text-[12px] text-text-muted mt-2">All users opted-in on this channel will receive this broadcast.</p>
                      )}

                      {card.id === "segment" && (
                        <div className="mt-2 space-y-3">
                          <div className="flex gap-3">
                            {[
                              { key: "segment",  label: "Select a segment",  icon: "🗂" },
                              { key: "csv",      label: "Select from a CSV",  icon: "📄" },
                            ].map((sub) => (
                              <button
                                key={sub.key}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); upd({ activeCard: sub.key }); }}
                                className="flex-1 flex items-center gap-2 border border-border rounded-lg px-4 py-3 text-[13px] font-medium text-text-primary hover:border-primary/40 hover:bg-slate-50"
                              >
                                <span>{sub.icon}</span>{sub.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {card.id === "direct_csv" && (
                        <CSVUploader
                          csvFile={audience.csvFile}
                          csvMapping={audience.csvMapping}
                          onFileChange={(f) => upd({ csvFile: f, csvMapping: { phoneColumn: null, nameColumn: null } })}
                          onMappingChange={(m) => upd({ csvMapping: m })}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sub-card: segment picker */}
            {audience.activeCard === "segment" && (
              <div className="border border-primary/30 rounded-lg px-4 py-3 bg-white ml-4">
                <div className="text-[12px] font-medium text-text-secondary mb-1">Select segments</div>
                <SegmentPicker
                  selectedSegments={audience.selectedSegments}
                  onChange={(segs) => upd({ selectedSegments: segs })}
                />
              </div>
            )}

            {/* Sub-card: CSV from specific users */}
            {audience.activeCard === "csv" && (
              <div className="border border-primary/30 rounded-lg px-4 py-3 bg-white ml-4">
                <div className="text-[12px] font-medium text-text-secondary mb-1">Upload a CSV</div>
                <CSVUploader
                  csvFile={audience.csvFile}
                  csvMapping={audience.csvMapping}
                  onFileChange={(f) => upd({ csvFile: f, csvMapping: { phoneColumn: null, nameColumn: null } })}
                  onMappingChange={(m) => upd({ csvMapping: m })}
                />
              </div>
            )}
          </div>

          {/* Suppression note */}
          <p className="text-[11px] text-text-muted">
            The contacts from your suppression list will not be included in this broadcast.{" "}
            {/* TODO: wire to Suppression List settings page */}
            <button type="button" className="underline hover:text-primary">Suppression List</button>
          </p>

          {/* Include / Exclude filters */}
          {audience.activeCard && (
            <div className="space-y-3 pt-1">
              {!audience.includeOpen ? (
                <button type="button" onClick={() => upd({ includeOpen: true, includeGroups: audience.includeGroups.length ? audience.includeGroups : [mkFilterGroup()] })}
                  className="text-[12px] text-primary hover:underline flex items-center gap-1 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Include filter
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-text-primary">Include filter</span>
                    <button type="button" onClick={() => upd({ includeOpen: false, includeGroups: [] })} className="text-[11px] text-text-muted hover:text-rose-500">Remove</button>
                  </div>
                  {audience.includeGroups.map((g, idx) => (
                    <FilterBlock key={g.id} group={g}
                      onUpdate={(patch) => { const next = audience.includeGroups.map((x, i) => i === idx ? { ...x, ...patch } : x); upd({ includeGroups: next }); }}
                      onRemove={() => upd({ includeGroups: audience.includeGroups.filter((_, i) => i !== idx) })}
                      showRemove={audience.includeGroups.length > 1}
                      triggerEventNames={[]}
                    />
                  ))}
                </div>
              )}

              {!audience.excludeOpen ? (
                <button type="button" onClick={() => upd({ excludeOpen: true, excludeGroups: audience.excludeGroups.length ? audience.excludeGroups : [mkFilterGroup()] })}
                  className="text-[12px] text-primary hover:underline flex items-center gap-1 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Exclude filter
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-text-primary">Exclude filter</span>
                    <button type="button" onClick={() => upd({ excludeOpen: false, excludeGroups: [] })} className="text-[11px] text-text-muted hover:text-rose-500">Remove</button>
                  </div>
                  {audience.excludeGroups.map((g, idx) => (
                    <FilterBlock key={g.id} group={g}
                      onUpdate={(patch) => { const next = audience.excludeGroups.map((x, i) => i === idx ? { ...x, ...patch } : x); upd({ excludeGroups: next }); }}
                      onRemove={() => upd({ excludeGroups: audience.excludeGroups.filter((_, i) => i !== idx) })}
                      showRemove={audience.excludeGroups.length > 1}
                      triggerEventNames={[]}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{e}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: estimated reach */}
        <EstimatedReachPanel reach={reach} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-white flex-shrink-0">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:bg-slate-50">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button type="button" onClick={handleFinish}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-white text-[13px] font-medium hover:opacity-90"
          style={{ backgroundColor: PRIMARY }}>
          Finish →
        </button>
      </div>
    </div>
  );
}

// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// MAIN COMPONENT
// ── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
// ── Step 2 state helpers ──────────────────────────────────────
function mkPropCond()  { return { id: uid(), type: "user_property", attribute: null, operator: null, value: null, error: false }; }
function mkBehCond()   { return { id: uid(), type: "user_behavior",  executionQualifier: "has_executed", eventName: null, freqOp: "at_least", freqVal: 1, timeType: "in_last", timeN: 7, timeUnit: "days", eventAttributes: [], attrExpanded: false, error: false }; }
function mkAffCond()   { return { id: uid(), type: "user_affinity",  baseEvent: null, dimension: null, operator: "is", value: null, caseSensitive: false, timeWindowDays: 14, eventAttributes: [], attrExpanded: false, error: false }; }
function mkSegCond()   { return { id: uid(), type: "custom_segment", selectedSegments: [], error: false }; }

function mkCondForTab(tab) {
  if (tab === "user_property") return mkPropCond();
  if (tab === "user_behavior")  return mkBehCond();
  if (tab === "user_affinity")  return mkAffCond();
  return mkSegCond();
}

function mkFilterGroup() {
  return { id: uid(), combinator: "AND", tab: "user_behavior", collapsed: false, conditions: [mkBehCond()] };
}

function mkDefaultStep2() {
  return {
    audienceMode: "filter_by",
    filterGroups: [mkFilterGroup()],
    excludeEnabled: false,
    excludeGroups: [mkFilterGroup()],
    freqCap: { enabled: false, times: 1, withinVal: 1, withinUnit: "day" },
    ctrlGroups: { globalOn: false, flowOn: false, flowPct: 5 },
  };
}

export default function FlowTriggerModal({ isOpen, onClose, onTriggerSelected, onFlowConfigComplete, events }) {
  const allEvents = events || TRIGGER_EVENTS;

  // ── view state ────────────────────────────────────────────
  // "trigger-select" | "step-1" | "step-2" | "broadcast-step-1" | "broadcast-step-2"
  const [view, setView] = useState("trigger-select");
  const [step2, setStep2] = useState(mkDefaultStep2);

  // ── broadcast-specific state ──────────────────────────────
  const [exitTrigger, setExitTrigger] = useState({ enabled: false, conditions: [] });

  // ── broadcast-specific state ──────────────────────────────
  const [bcastSchedule, setBcastSchedule] = useState({
    type: "as_soon_as_possible",
    startDate: null,     // "YYYY-MM-DD"
    sendHour: 9,         // 1-12
    sendMinute: 0,
    ampm: "am",
    timezone: "Asia/Kolkata",
  });
  const [bcastAudience, setBcastAudience] = useState({
    activeCard: null,    // "all_users" | "segment" | "csv" | "direct_csv"
    selectedSegments: [],
    csvFile: null,       // { name, size, rowCount, columns: [] }
    csvMapping: { phoneColumn: null, nameColumn: null },
    includeGroups: [],
    excludeGroups: [],
    includeOpen: false,
    excludeOpen: false,
  });

  // ── trigger-select view state ─────────────────────────────
  const [selectedHeader, setSelectedHeader] = useState("all");
  const [search, setSearch] = useState("");

  // ── step-1 view state ─────────────────────────────────────
  const [triggerGroups, setTriggerGroups] = useState([]);
  const [groupCombinator, setGroupCombinator] = useState("AND");
  const [selectedChannel, setSelectedChannel] = useState("wa1");
  // null → initial (first event), { mode:'replace', idx } → swap event in group, { mode:'add' } → append group
  const addingGroupIndexRef = useRef(null);

  // ── trigger-select derived data ───────────────────────────
  const headerEvents = useMemo(() => {
    if (selectedHeader === "all") return allEvents;
    return allEvents.filter((e) => e.header === selectedHeader);
  }, [allEvents, selectedHeader]);

  const sectionMap = useMemo(() => {
    const map = new Map();
    for (const e of headerEvents) {
      if (!map.has(e.section)) map.set(e.section, []);
      map.get(e.section).push(e);
    }
    return map;
  }, [headerEvents]);

  const lq = search.trim().toLowerCase();
  const filteredMap = useMemo(() => {
    if (!lq) return sectionMap;
    const result = new Map();
    for (const [section, evts] of sectionMap) {
      const matched = evts.filter(
        (e) => e.eventCategory.toLowerCase().includes(lq) || e.eventDescription.toLowerCase().includes(lq) || section.toLowerCase().includes(lq),
      );
      if (matched.length > 0) result.set(section, matched);
    }
    return result;
  }, [sectionMap, lq]);

  // Compute which events are incompatible for adding a second group
  const incompatibleHeaders = useMemo(() => {
    if (triggerGroups.length === 0) return new Set();
    const existingFamilies = new Set(
      triggerGroups.map((g) => getFamilyForHeader(g.event.header)).filter(Boolean),
    );
    const blocked = new Set();
    for (const [family, cfg] of Object.entries(TRIGGER_FAMILIES)) {
      const canPairWith = cfg.canPairWith;
      if ([...existingFamilies].some((ef) => !canPairWith.includes(ef) && !cfg.headers.some((h) => existingFamilies.has(getFamilyForHeader(h))))) {
        cfg.headers.forEach((h) => blocked.add(h));
      }
    }
    // Simpler: block anything whose family can't pair with existing
    const allowed = new Set();
    for (const ef of existingFamilies) {
      const cfg = Object.values(TRIGGER_FAMILIES).find((c) => c.headers.some((h) => getFamilyForHeader(h) === ef)) || Object.entries(TRIGGER_FAMILIES).find(([, c]) => c.headers.some((h) => getFamilyForHeader(h) === ef))?.[1];
      (cfg?.canPairWith || []).forEach((f) => {
        const familyCfg = TRIGGER_FAMILIES[f];
        if (familyCfg) familyCfg.headers.forEach((h) => allowed.add(h));
      });
    }
    // Compute blocked headers
    const blockedSet = new Set();
    for (const [, cfg] of Object.entries(TRIGGER_FAMILIES)) {
      cfg.headers.forEach((h) => {
        if (!allowed.has(h) && !existingFamilies.has(getFamilyForHeader(h))) {
          blockedSet.add(h);
        }
      });
    }
    return blockedSet;
  }, [triggerGroups]);

  // Only restrict compatibility when ADDING a new group (not on first selection or event replacement)
  const isEventDisabled = useCallback(
    (event) => addingGroupIndexRef.current?.mode === "add" && incompatibleHeaders.has(event.header),
    [incompatibleHeaders],
  );

  // ── event selection handler ───────────────────────────────
  const handleEventSelect = useCallback((event) => {
    const ref = addingGroupIndexRef.current;
    if (ref === null) {
      // Initial: create first group
      setTriggerGroups([createGroup(event)]);
    } else if (ref.mode === "replace") {
      // Replace the event in an existing group — clear its filters
      setTriggerGroups((prev) =>
        prev.map((g, i) => i === ref.idx ? createGroup(event) : g),
      );
    } else {
      // mode === "add": append a new group
      setTriggerGroups((prev) => [...prev, createGroup(event)]);
    }
    addingGroupIndexRef.current = null;
    // Route broadcast events to their own step-1
    if (event.header === "broadcast") {
      setBcastSchedule({ type: "as_soon_as_possible", startDate: null, sendHour: 9, sendMinute: 0, ampm: "am", timezone: "Asia/Kolkata" });
      setBcastAudience({ activeCard: null, selectedSegments: [], csvFile: null, csvMapping: { phoneColumn: null, nameColumn: null }, includeGroups: [], excludeGroups: [], includeOpen: false, excludeOpen: false });
      setView("broadcast-step-1");
    } else {
      setView("step-1");
    }
  }, []);

  // ── group update helpers ──────────────────────────────────
  const updateGroup = useCallback((groupIdx, updater) => {
    setTriggerGroups((prev) => prev.map((g, i) => i === groupIdx ? updater(g) : g));
  }, []);

  const removeGroup = useCallback((groupIdx) => {
    setTriggerGroups((prev) => prev.filter((_, i) => i !== groupIdx));
  }, []);

  const openEventPickerForGroup = useCallback((groupIdx) => {
    addingGroupIndexRef.current = { mode: "replace", idx: groupIdx };
    setSearch("");
    setView("trigger-select");
  }, []);

  const openEventPickerForNewGroup = useCallback(() => {
    addingGroupIndexRef.current = { mode: "add" };
    setSearch("");
    setView("trigger-select");
  }, []);

  // ── step-1 back to trigger-select ─────────────────────────
  const handleBackToSelect = () => {
    addingGroupIndexRef.current = null;
    setView("trigger-select");
  };

  // ── Step 1 "Next" → validate then go to step-2 or skip ──
  const handleCreate = () => {
    let hasError = false;
    const validated = triggerGroups.map((g) => ({
      ...g,
      filters: g.filters.map((row) => {
        if (!row.property) return { ...row, error: true };
        if (row.property.type !== "Boolean" && row.property.ops !== null && !row.operator) return { ...row, error: true };
        const needsValue = row.operator && row.operator !== "Exists" && row.operator !== "Doesn't Exist";
        const empty = !row.value && row.value !== false && !Array.isArray(row.value);
        if (needsValue && empty) return { ...row, error: true };
        return { ...row, error: false };
      }),
    }));
    for (const g of validated) {
      if (g.filters.some((r) => r.error)) { hasError = true; break; }
      if (g.evaluate && (!g.evaluate.computation || !g.evaluate.windowValue)) { hasError = true; break; }
    }
    if (hasError) { setTriggerGroups(validated); return; }

    const payload = {
      triggerGroups: validated.map((g, i) => ({
        groupIndex: i + 1,
        events: [g.event],
        filters: g.filters.map((row) => ({
          property:                   row.property?.key,
          propertyLabel:              row.property?.name,
          inputType:                  row.property?.inputType,
          shopifySubType:             row.property?.pickerType || null,
          operator:                   row.operator,
          value:                      row.value,
        })),
        filterCombinator: g.filterCombinator || "AND",
        evaluate: g.evaluate ? {
          computation:      g.evaluate.computation,
          computationLabel: g.evaluate.computationLabel,
          windowValue:      g.evaluate.windowValue,
          windowUnit:       g.evaluate.windowUnit,
          outputVariable:   `{{trigger${i + 1}.evaluate}}`,
        } : null,
      })),
      groupCombinator,
      headerLabel: triggerGroups[0] ? getHeaderLabel(triggerGroups[0].event.header) : "",
      channel: MOCK_CHANNELS.find((c) => c.id === selectedChannel)?.label || selectedChannel,
      exitTrigger: exitTrigger.enabled ? {
        conditions: exitTrigger.conditions.map((c) => ({
          event: c.event,
          attributes: c.attributes.filter((a) => a.property).map((a) => ({
            attribute: a.property,
            operator:  a.operator,
            value:     a.value,
          })),
        })),
      } : null,
    };
    // Check if any trigger event disallows audience qualification
    const aqAllowed = triggerGroups.every((g) => g.event?.audienceQualificationAllowed !== false);
    if (!aqAllowed) {
      // Skip step-2, fire final callback immediately
      if (onFlowConfigComplete) {
        onFlowConfigComplete({ ...payload, audience: null, frequencyCap: { enabled: false }, controlGroups: { globalEnabled: false, flowEnabled: false, flowPct: 5 } });
      } else {
        onTriggerSelected(payload);
      }
      onClose();
      return;
    }
    // Transition to step-2
    setStep2(mkDefaultStep2());
    setView("step-2");
  };

  if (!isOpen) return null;

  const sections = [...filteredMap.entries()];
  const firstGroup = triggerGroups[0];
  const isScheduled = firstGroup && isScheduledHeader(firstGroup.event.header);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="relative z-50 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(92vw, 1080px)", height: "min(88vh, 760px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Fixed modal header (always visible) ────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {(view === "step-1" || view === "broadcast-step-1") && (
              <button
                type="button"
                onClick={() => setView("trigger-select")}
                className="p-1 rounded hover:bg-slate-100 text-text-muted"
                title="Back to event selection"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">
                {view === "trigger-select" ? "Select Start Trigger" : "Configure Trigger"}
              </h2>
              <p className="text-[12px] text-text-muted mt-0.5">
                {view === "trigger-select" ? "Choose what starts this flow" : "Define when users will enter this flow"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-text-muted" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── VIEW: trigger-select ─────────────────────────── */}
        {view === "trigger-select" && (
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <aside className="w-[210px] flex-shrink-0 border-r border-border overflow-y-auto py-2">
              {SIDEBAR_HEADERS.map(({ key, label }) => {
                const active = selectedHeader === key;
                const Icon = key === "all" ? Zap : getSectionIcon(label);
                const blocked = triggerGroups.length > 0 && incompatibleHeaders.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSelectedHeader(key); setSearch(""); }}
                    className={[
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-left transition-colors",
                      active ? "bg-primary-tint text-primary" : "text-text-secondary hover:bg-slate-50 hover:text-text-primary",
                      blocked ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={active ? { color: PRIMARY } : { color: "#94A3B8" }} />
                    {label}
                  </button>
                );
              })}
            </aside>

            {/* Right content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="px-5 pt-4 pb-3 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search events…"
                    className="w-full pl-9 pr-3 py-2 text-[13px] rounded-md border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-6">
                {sections.length === 0 ? (
                  <EmptyState query={search} />
                ) : (
                  <div className="space-y-7">
                    {sections.map(([section, evts]) => {
                      const Icon = getSectionIcon(section);
                      return (
                        <div key={section}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY_BG }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                            </div>
                            <h3 className="text-[14px] font-semibold text-text-primary">{section}</h3>
                            <span className="text-[11px] text-text-muted">· {evts.filter((e) => e.status !== "inactive").length} events</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {evts.map((event) => (
                              <EventCard
                                key={event.id}
                                event={event}
                                onSelect={handleEventSelect}
                                disabled={isEventDisabled(event)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW: step-2 ─────────────────────────────────── */}
        {view === "step-2" && (
          <Step2View
            step2={step2}
            setStep2={setStep2}
            triggerGroups={triggerGroups}
            step1Payload={(() => {
              // assemble step-1 payload for the final callback
              return {
                triggerGroups: triggerGroups.map((g, i) => ({
                  groupIndex: i + 1,
                  events: [g.event],
                  filters: g.filters.map((row) => ({
                    property: row.property?.key,
                    propertyLabel: row.property?.name,
                    inputType: row.property?.inputType,
                    shopifySubType: row.property?.pickerType || null,
                    operator: row.operator,
                    value: row.value,
                  })),
                  filterCombinator: g.filterCombinator || "AND",
                  evaluate: g.evaluate ? {
                    computation: g.evaluate.computation,
                    computationLabel: g.evaluate.computationLabel,
                    windowValue: g.evaluate.windowValue,
                    windowUnit: g.evaluate.windowUnit,
                    outputVariable: `{{trigger${i + 1}.evaluate}}`,
                  } : null,
                })),
                groupCombinator,
                headerLabel: triggerGroups[0] ? SIDEBAR_HEADERS.find((h) => h.key === triggerGroups[0].event.header)?.label || "" : "",
                channel: MOCK_CHANNELS.find((c) => c.id === selectedChannel)?.label || selectedChannel,
              };
            })()}
            onBack={() => setView("step-1")}
            onFinish={(audiencePayload) => {
              const step1 = {
                triggerGroups: triggerGroups.map((g, i) => ({
                  groupIndex: i + 1,
                  events: [g.event],
                  filters: g.filters.map((row) => ({
                    property: row.property?.key,
                    propertyLabel: row.property?.name,
                    operator: row.operator,
                    value: row.value,
                  })),
                  filterCombinator: g.filterCombinator || "AND",
                  evaluate: g.evaluate || null,
                })),
                groupCombinator,
                headerLabel: triggerGroups[0] ? SIDEBAR_HEADERS.find((h) => h.key === triggerGroups[0].event.header)?.label || "" : "",
                channel: MOCK_CHANNELS.find((c) => c.id === selectedChannel)?.label || selectedChannel,
              };
              if (onFlowConfigComplete) onFlowConfigComplete({ ...step1, ...audiencePayload });
              else if (onTriggerSelected) onTriggerSelected(step1);
              onClose();
            }}
          />
        )}

        {/* ── VIEW: broadcast-step-1 ──────────────────────── */}
        {view === "broadcast-step-1" && (
          <BroadcastStep1View
            schedule={bcastSchedule}
            onScheduleChange={setBcastSchedule}
            selectedChannel={selectedChannel}
            onChannelChange={setSelectedChannel}
            triggerGroups={triggerGroups}
            onNext={() => setView("broadcast-step-2")}
          />
        )}

        {/* ── VIEW: broadcast-step-2 ──────────────────────── */}
        {view === "broadcast-step-2" && (
          <BroadcastStep2View
            schedule={bcastSchedule}
            audience={bcastAudience}
            onAudienceChange={setBcastAudience}
            triggerGroups={triggerGroups}
            onBack={() => setView("broadcast-step-1")}
            onFinish={(payload) => {
              const step1 = {
                triggerGroups: triggerGroups.map((g, i) => ({
                  groupIndex: i + 1,
                  events: [g.event],
                  filters: [],
                  evaluate: null,
                })),
                groupCombinator,
                headerLabel: "Broadcast",
                channel: MOCK_CHANNELS.find((c) => c.id === selectedChannel)?.label || selectedChannel,
              };
              if (onFlowConfigComplete) onFlowConfigComplete({ ...step1, ...payload });
              onClose();
            }}
          />
        )}

        {/* ── VIEW: step-1 ─────────────────────────────────── */}
        {view === "step-1" && (
          <div className="flex flex-col flex-1 min-h-0">
            <WizardHeader activeStep={1} step1Done={false} />

            {/* Subheader row */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-white flex-shrink-0">
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="text-text-secondary">Create trigger based on</span>
                <span className="font-semibold text-text-primary">
                  {firstGroup ? getHeaderLabel(firstGroup.event.header) : ""}
                </span>
              </div>
              <ChannelSelector value={selectedChannel} onChange={setSelectedChannel} />
            </div>

            {/* Scrollable trigger groups area */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {triggerGroups.map((group, groupIdx) => {
                const props = getPropertiesForEvent(group.event.eventCategory);
                return (
                  <React.Fragment key={group.id}>
                    {groupIdx > 0 && (
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setGroupCombinator((c) => c === "AND" ? "OR" : "AND")}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors"
                          style={{
                            borderColor: "var(--color-primary)",
                            color: "var(--color-primary)",
                            backgroundColor: "var(--color-primary-tint)",
                          }}
                        >
                          {groupCombinator}
                          <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                        </button>
                      </div>
                    )}
                    <TriggerGroupBlock
                      group={group}
                      groupIndex={groupIdx}
                      totalGroups={triggerGroups.length}
                      properties={props}
                      onOpenEventPicker={() => openEventPickerForGroup(groupIdx)}
                      onAddFilter={() => updateGroup(groupIdx, (g) => ({
                        ...g,
                        filters: [...g.filters, createFilterRow()],
                      }))}
                      onUpdateFilter={(rowIdx, patch) => updateGroup(groupIdx, (g) => ({
                        ...g,
                        filters: g.filters.map((r, i) => i === rowIdx ? { ...r, ...patch } : r),
                      }))}
                      onDeleteFilter={(rowIdx) => updateGroup(groupIdx, (g) => ({
                        ...g,
                        filters: g.filters.filter((_, i) => i !== rowIdx),
                      }))}
                      onUpdateEvaluate={(val) => updateGroup(groupIdx, (g) => ({ ...g, evaluate: val }))}
                      onRemoveGroup={() => removeGroup(groupIdx)}
                    />
                  </React.Fragment>
                );
              })}

              {/* + Add another trigger */}
              {!isScheduled && triggerGroups.length < 5 && (
                <button
                  type="button"
                  onClick={openEventPickerForNewGroup}
                  className="flex items-center gap-1.5 text-[12px] text-primary hover:underline font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add another trigger
                </button>
              )}

              {/* Exit trigger */}
              <div className="pt-2 border-t border-border/50">
                <ExitTriggerBlock exitTrigger={exitTrigger} onChange={setExitTrigger} />
              </div>
            </div>

            {/* Bottom action row */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-white flex-shrink-0">
              <button
                type="button"
                onClick={handleCreate}
                disabled={triggerGroups.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: PRIMARY }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
