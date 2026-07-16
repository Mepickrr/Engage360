import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, Trash2,
  FileText, MessageCircle, ShieldCheck, GalleryHorizontal, MapPin, Mic,
  ShoppingCart, PackageCheck, ClipboardCheck, CreditCard,
  UserRound, Phone, Mail, UserCircle2, MapPinned, Star, LocateFixed, Hash,
  Image as ImageIcon, Video, Type, SlidersHorizontal, PhoneCall,
  Package, Boxes, LayoutGrid, ListOrdered, Flame,
  List as ListIcon, ClipboardList, Trophy,
} from "lucide-react";
import UnifiedTemplateModal from "./UnifiedTemplateModal";
import {
  WABA_NUMBERS, isConnectable,
  DELIVERY_OUTPUT_OPTIONS,
} from "./data/mockTemplates";
import { useFlowVariant } from "@/components/flows/FlowVariantContext";
import { Group, Row, UTMFields, RetryFields } from "../shared/DeliveryKit";

const WA_GREEN       = "#25D366";
const PRIMARY        = "#6C3AE8";
const BORDER         = "#E5E7EB";
const MUTED          = "#94A3B8";

// ── Shared helpers ─────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? WA_GREEN : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

// ── Template Styles ─────────────────────────────────────────────
// Grouped catalogue: each item's `id` is what gets written to data.templateStyle,
// UNLESS `mapsTo` is set — then the item is a shortcut into an existing style's
// builder (optionally pre-seeding it via `presetInputType`).
const TEMPLATE_STYLE_GROUPS = [
  {
    group: "Standard",
    items: [
      { id: "standard", label: "Template", Icon: FileText, popular: true,
        desc: "Meta-approved templates for utility and marketing — automations, promotions, order updates, payment reminders, tracking links, product links, and more" },
      { id: "session", label: "Session", Icon: MessageCircle,
        desc: "Basic conversation session message" },
      { id: "authentication", label: "Authentication", Icon: ShieldCheck,
        desc: "Basic authentication template" },
      { id: "carousel", label: "Carousel", Icon: GalleryHorizontal,
        desc: "Horizontal cards with images, text and buttons" },
      { id: "location", label: "Location send", Icon: MapPin,
        desc: "Share a live or static location pin" },
      { id: "audio", label: "Audio", Icon: Mic,
        desc: "Share a voice note or audio clip" },
    ],
  },
  {
    group: "Order",
    items: [
      { id: "order_payment", label: "Order & Payment", Icon: ShoppingCart,
        desc: "Send product details along with a payment link" },
      { id: "order_confirmation", label: "Order Confirmation Status", Icon: PackageCheck,
        desc: "Send the order status after the payment process" },
      { id: "complete_checkout", label: "Complete Checkout", Icon: ClipboardCheck,
        desc: "A guided flow covering order details, payment, address capture and order placement" },
      { id: "payment_link", label: "Payment Link", Icon: CreditCard,
        desc: "Send a UPI or payment link directly in chat" },
    ],
  },
  {
    group: "Ask Customer",
    items: [
      { id: "ask_name", mapsTo: "collect_input", presetInputType: "text", label: "Name", Icon: UserRound,
        desc: "Ask for a name during a conversation" },
      { id: "ask_phone", mapsTo: "collect_input", presetInputType: "phone", label: "Phone number", Icon: Phone,
        desc: "Ask for a phone number during a conversation" },
      { id: "ask_email", mapsTo: "collect_input", presetInputType: "email", label: "Email", Icon: Mail,
        desc: "Ask for an email address during a conversation" },
      { id: "ask_gender", mapsTo: "collect_input", presetInputType: "gender", label: "Gender", Icon: UserCircle2,
        desc: "Ask for a gender during a conversation" },
      { id: "address", mapsTo: "collect_input", presetInputType: "address", label: "Address", Icon: MapPinned,
        desc: "Ask for a delivery or pickup address during a conversation" },
      { id: "ask_rating", mapsTo: "collect_input", presetInputType: "rating", label: "Rating", Icon: Star,
        desc: "Ask for a rating during a conversation" },
      { id: "ask_location", mapsTo: "collect_input", presetInputType: "location", label: "Location", Icon: LocateFixed,
        desc: "Ask for the customer's location during a conversation" },
      { id: "ask_order_id", mapsTo: "collect_input", presetInputType: "text", label: "Order ID", Icon: Hash,
        desc: "Ask for an order ID during a conversation" },
      { id: "ask_image", mapsTo: "collect_input", presetInputType: "image", label: "Image", Icon: ImageIcon,
        desc: "Ask the customer to send an image" },
      { id: "ask_video", mapsTo: "collect_input", presetInputType: "video", label: "Video", Icon: Video,
        desc: "Ask the customer to send a video" },
      { id: "ask_text", mapsTo: "collect_input", presetInputType: "text", label: "Text", Icon: Type,
        desc: "Ask a free-text question during a conversation" },
      { id: "collect_input", label: "Custom", Icon: SlidersHorizontal,
        desc: "Ask a name, phone number, address or custom question and collect structured input from users during a conversation" },
      { id: "call_permission", label: "Call Permission", Icon: PhoneCall,
        desc: "Request permission to call the customer" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { id: "catalog_single", label: "Single Product", Icon: Package,
        desc: "Show a single product from your catalog" },
      { id: "catalog_multiple", label: "Multiple Product", Icon: Boxes,
        desc: "Show multiple products from your catalog" },
      { id: "catalog_view", label: "Catalog View", Icon: LayoutGrid,
        desc: "Show your catalog as a scrollable list" },
      { id: "catalog_list_bestsellers", label: "List Catalog", Icon: ListOrdered,
        desc: "A list of bestsellers from your catalog products" },
      { id: "catalog", label: "Catalog View Bestsellers", Icon: Flame,
        desc: "Showcase products from your WhatsApp catalog" },
    ],
  },
  {
    group: "List",
    items: [
      { id: "list", label: "List", Icon: ListIcon,
        desc: "Scrollable list of up to 10 sections with items" },
      { id: "list_order", mapsTo: "list", label: "Order", Icon: ClipboardList,
        desc: "Scrollable list of all the order details" },
      { id: "list_bestsellers", mapsTo: "list", label: "Bestsellers", Icon: Trophy,
        desc: "Scrollable list of all the bestsellers" },
    ],
  },
];

// Flattened lookup — every pickable card, keyed by its own id (not the resolved mapsTo).
const ALL_STYLE_ITEMS = TEMPLATE_STYLE_GROUPS.flatMap((g) => g.items);

// Resolve a style id to the entry that actually drives the builder (follows mapsTo).
// Exported so the canvas node can render a matching label/icon for any style id.
export function resolveStyleInfo(templateStyle) {
  return ALL_STYLE_ITEMS.find((s) => (s.mapsTo || s.id) === templateStyle && !s.mapsTo)
    || ALL_STYLE_ITEMS.find((s) => s.id === templateStyle);
}

const TOOLTIP_WIDTH = 180;
const TOOLTIP_MARGIN = 8; // min gap kept from viewport edges

// Portal-rendered tooltip, positioned from the hovered card's actual screen rect.
// Rendering into document.body (instead of nesting inside the card) means it's never
// clipped by the canvas/panel's overflow, and its position is clamped to the viewport
// so it stays fully visible even for cards in a corner of the grid.
function StyleCardTooltip({ anchorRect, text }) {
  if (!anchorRect) return null;
  const centerX = anchorRect.left + anchorRect.width / 2;
  const left = Math.min(
    Math.max(centerX - TOOLTIP_WIDTH / 2, TOOLTIP_MARGIN),
    window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN
  );
  const spaceAbove = anchorRect.top;
  const showBelow = spaceAbove < 90; // not enough room above — flip below the card
  const top = showBelow ? anchorRect.bottom + 6 : anchorRect.top - 6;
  const arrowLeft = Math.min(Math.max(centerX - left, 12), TOOLTIP_WIDTH - 12);

  return createPortal(
    <div
      style={{
        position: "fixed", left, top,
        transform: showBelow ? "translateY(0)" : "translateY(-100%)",
        width: TOOLTIP_WIDTH, background: "#0F172A", color: "#fff", fontSize: 10, lineHeight: 1.45,
        borderRadius: 6, padding: "6px 8px", zIndex: 1000, pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {text}
      <div style={{
        position: "absolute", left: arrowLeft, transform: "translateX(-50%)",
        ...(showBelow
          ? { bottom: "100%", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "5px solid #0F172A" }
          : { top: "100%", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #0F172A" }),
        width: 0, height: 0,
      }} />
    </div>,
    document.body
  );
}

// ── Template Style Card ───────────────────────────────────────────
// Icon-only card; description surfaces as a tooltip on hovering anywhere on the card (saves vertical space).
function StyleCard({ style, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const cardRef = useRef(null);
  const Icon = style.Icon;

  const handleEnter = () => {
    setHovered(true);
    if (cardRef.current) setAnchorRect(cardRef.current.getBoundingClientRect());
  };
  const handleLeave = () => setHovered(false);

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: 112,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        background: isSelected ? "#F0FDF4" : "#fff",
        border: `${isSelected ? 2 : 1.5}px solid ${isSelected || hovered ? "#25D366" : "#E5E7EB"}`,
        borderRadius: 10,
        padding: "10px 8px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Popular pill row — reserved on every card (empty when not popular) so heights stay uniform */}
      <div style={{ height: 14, marginBottom: 4, display: "flex", alignItems: "center" }}>
        {style.popular && (
          <div style={{
            fontSize: 8, fontWeight: 700, color: "#065F46",
            background: "#DCFCE7", borderRadius: 4, padding: "1px 5px",
          }}>Popular</div>
        )}
      </div>

      {/* Checkmark badge when selected */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 5, right: 5,
          width: 12, height: 12, borderRadius: "50%",
          background: "#25D366", color: "#fff",
          fontSize: 9, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✓</div>
      )}

      {/* Icon circle */}
      <div style={{ width: 30, height: 30, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "#DCFCE7",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color="#0F766E" />
        </div>
      </div>

      {/* Name — fixed-height, vertically centered so 1-line and 2-line labels align across cards without shrinking text */}
      <div style={{
        flex: 1, minWidth: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, color: "#0F172A", marginTop: 6, textAlign: "center", lineHeight: 1.25,
        overflowWrap: "break-word", wordBreak: "break-word",
      }}>{style.label}</div>

      {hovered && <StyleCardTooltip anchorRect={anchorRect} text={style.desc} />}
    </div>
  );
}

// ── Template Style Picker ────────────────────────────────────────
function TemplateStylePicker({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const { allowedTemplateStyleIds } = useFlowVariant();

  // Blueprint groups kept intact — filtered per-item in V2 via context.
  // To re-enable a style in V2, add its id to allowedTemplateStyleIds in FlowBuilderV2.jsx.
  const visibleGroups = TEMPLATE_STYLE_GROUPS
    .map((g) => ({
      ...g,
      items: allowedTemplateStyleIds
        ? g.items.filter((s) => allowedTemplateStyleIds.includes(s.id))
        : g.items,
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Choose Template Style</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>Select the type of WhatsApp message you want to send</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
        {visibleGroups.map((g) => (
          <div key={g.group}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{g.group}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              {g.items.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isSelected={selected === style.id}
                  onSelect={() => {
                    setSelected(style.id);
                    onSelect(style);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fallback Template Section ──────────────────────────────────
export function FallbackTemplateSection({ data, patch, customTemplates = [], onSaveCustomTemplate }) {
  const [fallbackModalOpen, setFallbackModalOpen] = useState(false);
  const { fallback = {} } = data;

  const handleFallbackSave = (tpl) => {
    const withId = tpl.id ? tpl : { ...tpl, id: `tpl_standard_${Date.now()}` };
    patch({ fallback: { ...fallback, template: withId } });
    if (onSaveCustomTemplate) onSaveCustomTemplate(withId);
    setFallbackModalOpen(false);
  };

  return (
    <>
      {fallbackModalOpen && (
        <UnifiedTemplateModal
          open
          styleId="standard"
          styleLabel="Template"
          initialTemplate={null}
          customTemplates={customTemplates}
          onSave={handleFallbackSave}
          onClose={() => setFallbackModalOpen(false)}
        />
      )}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Fallback Template</Label>
          <Toggle on={!!fallback?.enabled} onChange={(v) => patch({ fallback: { ...fallback, enabled: v } })} />
        </div>
        {fallback?.enabled && (
          !fallback.template ? (
            <button onClick={() => setFallbackModalOpen(true)} style={{ width: "100%", padding: "12px", border: `2px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", color: MUTED, fontSize: 12, textAlign: "center" }}>
              Click to select approved fallback template
            </button>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{fallback.template.name}</span>
              <button onClick={() => patch({ fallback: { ...fallback, template: null } })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          )
        )}
      </div>
    </>
  );
}

// ── Template Tab ────────────────────────────────────────────────
export function TemplateTab({ data, patch }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("browse"); // browse | edit-existing
  const [pendingPresetInputType, setPendingPresetInputType] = useState(null);
  const [customTemplatesByStyle, setCustomTemplatesByStyle] = useState({});

  const templateStyle = data.templateStyle ?? null;
  const styleInfo = resolveStyleInfo(templateStyle);
  const { template, wabaNumberId, fallback = {} } = data;

  // ── Step 0: pick a sender number first, then a template style ──
  if (!wabaNumberId || !templateStyle) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label>Sender Number</Label>
          <select
            value={wabaNumberId || ""}
            onChange={(e) => patch({ wabaNumberId: e.target.value })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            <option value="" disabled>Select a phone number</option>
            {WABA_NUMBERS.map((n) => (
              <option key={n.id} value={n.id} disabled={n.status === "inactive"}>
                {n.nickname} · ····{n.number.slice(-4)}{n.status === "inactive" ? " (Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {wabaNumberId && (
          <TemplateStylePicker
            onSelect={(style) => {
              const resolvedId = style.mapsTo || style.id;
              patch({ templateStyle: resolvedId });
              setPendingPresetInputType(style.presetInputType || null);
              setModalMode("browse");
              setModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  const resolvedStyleId = styleInfo ? (styleInfo.mapsTo || styleInfo.id) : templateStyle;

  const handleModalSave = (tpl) => {
    const { variableMap, ...templateFields } = tpl;
    const withId = templateFields.id ? templateFields : { ...templateFields, id: `tpl_${resolvedStyleId}_${Date.now()}` };
    setCustomTemplatesByStyle((prev) => {
      const existing = prev[resolvedStyleId] || [];
      const already = existing.find((t) => t.id === withId.id);
      return { ...prev, [resolvedStyleId]: already ? existing.map((t) => (t.id === withId.id ? withId : t)) : [...existing, withId] };
    });
    patch({ template: withId, variableMap: variableMap || {} });
    setModalOpen(false);
  };

  return (
    <>
      {modalOpen && (
        <UnifiedTemplateModal
          open
          styleId={resolvedStyleId}
          styleLabel={styleInfo?.label || "Template"}
          presetInputType={pendingPresetInputType}
          initialTemplate={modalMode === "edit-existing" && template ? { ...template, variableMap: data.variableMap || {} } : null}
          customTemplates={customTemplatesByStyle[resolvedStyleId] || []}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Style chip */}
        {styleInfo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F0FDF4", borderRadius: 20, border: "1px solid #BBF7D0", alignSelf: "flex-start" }}>
            <styleInfo.Icon size={13} color="#065F46" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#065F46" }}>{styleInfo.label}</span>
            <span style={{ fontSize: 11, color: MUTED }}>·</span>
            <span
              onClick={() => { patch({ templateStyle: null, template: null }); setPendingPresetInputType(null); }}
              style={{ fontSize: 11, color: WA_GREEN, cursor: "pointer", fontWeight: 500 }}
            >Change</span>
          </div>
        )}

        {/* Sender Number */}
        <div>
          <Label>Sender Number</Label>
          <select value={wabaNumberId || "waba_1"} onChange={(e) => patch({ wabaNumberId: e.target.value })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}>
            {WABA_NUMBERS.map((n) => <option key={n.id} value={n.id} disabled={n.status === "inactive"}>{n.nickname} · ····{n.number.slice(-4)}{n.status === "inactive" ? " (Inactive)" : ""}</option>)}
          </select>
        </div>

        {/* Template section — one generic summary/CTA for every style */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>Template</Label>
          </div>

          {!template ? (
            <button type="button" onClick={() => { setModalMode("browse"); setModalOpen(true); }} style={{
              width: "100%", padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Create New
            </button>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {template.name || (template.isCollectInput ? `${template.inputType} input` : template.isListMessage ? "List Message" : "Template")}
                </span>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <button onClick={() => { setModalMode("edit-existing"); setModalOpen(true); }} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => { setModalMode("browse"); setModalOpen(true); }} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  {(template.body || template.questionMessage || "").slice(0, 120) || <span style={{ color: MUTED, fontStyle: "italic" }}>No content set</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {template && !styleInfo?.mapsTo && resolvedStyleId !== "collect_input" && (
          <FallbackTemplateSection
            data={data}
            patch={patch}
            customTemplates={customTemplatesByStyle.standard || []}
            onSaveCustomTemplate={(tpl) => setCustomTemplatesByStyle((prev) => {
              const existing = prev.standard || [];
              const already = existing.find((t) => t.id === tpl.id);
              return { ...prev, standard: already ? existing.map((t) => (t.id === tpl.id ? tpl : t)) : [...existing, tpl] };
            })}
          />
        )}
      </div>
    </>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
function DeliveryTab({ data, patch }) {
  const { markAsMarketing, utm = {}, aiBestTime, smartRetry = {} } = data;
  return (
    <div>
      <Group title="Attribution">
        <Row>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input type="checkbox" id="wa-marketing" checked={markAsMarketing !== false} onChange={(e) => patch({ markAsMarketing: e.target.checked })} style={{ marginTop: 2, accentColor: WA_GREEN }} />
            <div>
              <label htmlFor="wa-marketing" style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer", display: "block", marginBottom: 2 }}>Mark as Revenue Attribution</label>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Automatically map this communication's performance to revenue, based on your attribution settings.</p>
            </div>
          </div>
        </Row>
        <Row last>
          <UTMFields
            utm={utm}
            onChange={(v) => patch({ utm: v })}
            accentColor={WA_GREEN}
            defaults={{
              utm_source: "whatsapp",
              utm_medium: "journey",
              utm_campaign: data.template?.name || "abandoned_cart_reminder",
              utm_term: "promo",
              utm_content: data.template?.name || "wa_template",
            }}
          />
        </Row>
      </Group>

      <Group title="Send Optimization">
        <Row>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Toggle on={!!aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>AI Best Sent Time</div>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Sends at each user's optimal engagement window. Usually within 0–4 hours.</p>
            </div>
          </div>
        </Row>
        <Row last>
          <RetryFields smartRetry={smartRetry} onChange={(v) => patch({ smartRetry: v })} accentColor={WA_GREEN} />
        </Row>
      </Group>
    </div>
  );
}

// ── Output Tab ──────────────────────────────────────────────────
const BRANCH_OPTIONS = DELIVERY_OUTPUT_OPTIONS.filter((o) => o.id !== "next_step");

function OutputTab({ data, patch }) {
  const template        = data?.template;
  const outputCfg       = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], noResponseValue: 5, noResponseUnit: "hours", wiredPorts: [] };
  const routingMode     = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];
  const connectableBtns = (template?.buttons ?? []).filter(isConnectable);

  const setMode = (mode) => {
    patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : (selectedBranches.length ? selectedBranches : ["delivered"]) } });
  };

  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id) ? selectedBranches.filter((x) => x !== id) : [...selectedBranches, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  const deliveryPortCount = routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1);
  const totalPorts = deliveryPortCount + connectableBtns.length;

  const radioStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    border: `1.5px solid ${active ? WA_GREEN : BORDER}`,
    borderRadius: 10, cursor: "pointer", background: active ? "#F0FDF4" : "#fff",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Choose how this node routes users after the message is sent. Each mode creates different output ports on the canvas.
      </p>

      {/* Mode toggle — MECE */}
      <div>
        <Label>Routing Mode</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Option A — Next Step */}
          <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "next_step" ? WA_GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "next_step" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: WA_GREEN }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Single output port — all users continue to the same next node regardless of delivery status.
              </div>
            </div>
          </div>

          {/* Option B — Delivery Branches */}
          <div style={radioStyle(routingMode === "branches")} onClick={() => setMode("branches")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "branches" ? WA_GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "branches" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: WA_GREEN }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Delivery Branches</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Separate output port per delivery status — route users differently based on whether the message was sent, read, failed, etc.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch checkboxes — only when mode is "branches" */}
      {routingMode === "branches" && (
        <div>
          <Label>Select Branch Statuses</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {BRANCH_OPTIONS.map((opt, i) => {
              const selected = selectedBranches.includes(opt.id);
              return (
                <div key={opt.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: selected ? "#F0FDF4" : "#fff", cursor: "pointer", transition: "background 0.15s",
                }} onClick={() => toggleBranch(opt.id)}>
                  <input type="checkbox" readOnly checked={selected} style={{ accentColor: WA_GREEN, width: 14, height: 14, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                  {opt.hasTimeConfig && selected && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                      <input type="number" min={1} value={outputCfg.noResponseValue ?? 5}
                        onChange={(e) => patch({ outputConfig: { ...outputCfg, noResponseValue: parseInt(e.target.value) || 1 } })}
                        style={{ width: 44, padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
                      <select value={outputCfg.noResponseUnit ?? "hours"}
                        onChange={(e) => patch({ outputConfig: { ...outputCfg, noResponseUnit: e.target.value } })}
                        style={{ padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer" }}>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Select at least one status to create output ports.</p>
          )}
        </div>
      )}

      {/* Response Outputs from buttons */}
      {connectableBtns.length > 0 && (
        <div>
          <Label>Response Outputs (from buttons)</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {connectableBtns.map((btn, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: i < connectableBtns.length - 1 ? `1px solid ${BORDER}` : "none",
                background: "#F0FDF4",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: WA_GREEN, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{btn.label}</span>
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, fontWeight: 500, background: btn.type === "QUICK_REPLY" ? "#EFF6FF" : "#F3E8FF", color: btn.type === "QUICK_REPLY" ? "#2563EB" : "#7C3AED" }}>
                  {btn.type === "QUICK_REPLY" ? "Quick Reply" : "URL"}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 8, lineHeight: 1.5 }}>
            ⚠ Using button ports disables "On Link Click". Once a user goes through a branch they cannot enter subsequent branches.
          </p>
        </div>
      )}

      {!template && (
        <div style={{ textAlign: "center", color: MUTED, padding: "20px 0", fontSize: 12 }}>
          Select a template first to see response output ports
        </div>
      )}

      {/* Port count summary */}
      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{totalPorts}</span>
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────
const TABS = [
  { id: "template", label: "Template" },
  { id: "delivery", label: "Delivery" },
  { id: "output",   label: "Output"   },
];

export default function WhatsAppRightPanel({ node, updateNodeData, removeNode }) {
  const [tab, setTab] = useState("template");
  const [editingLabel, setEditingLabel] = useState(false);
  if (!node) return null;

  const data  = node.data || {};
  const patch = (p) => updateNodeData(node.id, p);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, color: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 13 }}>✓</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingLabel ? (
              <input
                autoFocus
                value={data.label || ""}
                onChange={(e) => patch({ label: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingLabel(false); }}
                placeholder="Send WhatsApp"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", borderBottom: `1.5px solid ${WA_GREEN}`, outline: "none", background: "transparent", width: "100%", padding: "0 0 1px" }}
              />
            ) : (
              <div
                onClick={() => setEditingLabel(true)}
                title="Click to rename"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {data.label || "Send WhatsApp"}
                <span style={{ fontSize: 9, color: MUTED, marginLeft: 5, fontWeight: 400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: MUTED }}>Configure message &amp; delivery</div>
          </div>
        </div>
        <button onClick={() => removeNode(node.id)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          Delete
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 500,
            border: "none", borderBottom: `2px solid ${tab === id ? WA_GREEN : "transparent"}`,
            background: tab === id ? "#F0FDF4" : "transparent",
            color: tab === id ? WA_GREEN : MUTED, cursor: "pointer", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {tab === "template" && <TemplateTab data={data} patch={patch} />}
        {tab === "delivery" && <DeliveryTab data={data} patch={patch} />}
        {tab === "output"   && (
          data.templateStyle === "collect_input" ? (
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Output Ports</div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
                Collect Input nodes have 4 fixed output ports: <strong>Success</strong>, <strong>No Response</strong>, <strong>Limit Reached</strong>, and <strong>Send Failed</strong>. Wire each port to the appropriate next step on the canvas.
              </div>
            </div>
          ) : (
            <OutputTab data={data} patch={patch} />
          )
        )}
      </div>

      {/* Save footer */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={() => alert("Changes saved")} style={{ width: "100%", padding: "9px", background: WA_GREEN, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
