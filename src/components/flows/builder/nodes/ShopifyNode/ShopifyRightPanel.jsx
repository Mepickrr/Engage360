// src/components/flows/builder/nodes/ShopifyNode/ShopifyRightPanel.jsx
import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { SHOPIFY_ACTIONS, SHOPIFY_GREEN, defaultShopifyNodeData } from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Action picker ─────────────────────────────────────────────────────────────
function ActionPicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        Select an action
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {SHOPIFY_ACTIONS.map(({ id, label, emoji, desc }) => {
          const highlight = hovered === id;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`shopify-action-${id}`}
              style={{
                position: "relative", borderRadius: 8, padding: "10px 8px",
                textAlign: "center", cursor: "pointer",
                background: highlight ? "#F2F7E8" : "#fff",
                border: `${highlight ? 2 : 1.5}px solid ${highlight ? SHOPIFY_GREEN : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tag input + chip display ──────────────────────────────────────────────────
function TagsEditor({ tags, onChange, testId }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const t = input.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput("");
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        placeholder="Enter text here"
        data-testid={testId}
        style={{
          width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box",
        }}
      />
      <div style={{ fontSize: 10, color: MUTED, marginTop: 4, marginBottom: 8 }}>
        Press Enter to add
      </div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {tags.map((tag) => (
            <span key={tag} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "#F1F5F9", border: `1px solid ${BORDER}`,
              borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151",
            }}>
              {tag}
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </span>
          ))}
          <button
            onClick={() => onChange([])}
            style={{ fontSize: 10, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ── Applies-to radio group ────────────────────────────────────────────────────
function AppliesToPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        Applies to
      </div>
      {[
        { id: "entire_order",         label: "Entire Order"          },
        { id: "specific_products",    label: "Specific Products"     },
        { id: "specific_collections", label: "Specific Collections"  },
      ].map(({ id, label }) => (
        <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
          <input
            type="radio"
            name="appliesTo"
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            style={{ accentColor: SHOPIFY_GREEN }}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

// ── Minimum purchase requirements ─────────────────────────────────────────────
function MinPurchaseSection({ discount, patchDiscount }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 4 }}>
        <input
          type="checkbox"
          checked={discount.minPurchaseEnabled}
          onChange={(e) => patchDiscount({ minPurchaseEnabled: e.target.checked })}
          style={{ accentColor: SHOPIFY_GREEN }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Minimum Purchase Requirements</span>
      </label>
      <div style={{ fontSize: 11, color: MUTED, marginLeft: 22, marginBottom: 8 }}>
        Enable coupon only after a minimum order value
      </div>
      {discount.minPurchaseEnabled && (
        <div style={{ marginLeft: 22 }}>
          <select
            value={discount.minPurchaseType}
            onChange={(e) => patchDiscount({ minPurchaseType: e.target.value })}
            style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", marginBottom: 8, background: "#fff" }}
          >
            <option value="order_value">Minimum Order Value</option>
            <option value="item_count">Minimum Number of Items</option>
          </select>
          <input
            type="number"
            value={discount.minPurchaseValue ?? ""}
            onChange={(e) => patchDiscount({ minPurchaseValue: e.target.value ? Number(e.target.value) : null })}
            placeholder={discount.minPurchaseType === "order_value" ? "Minimum amount" : "Minimum items"}
            min={0}
            style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}
    </div>
  );
}

// ── Item type picker (products/collections placeholder) ───────────────────────
function ItemTypePicker({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      {[
        { id: "specific_products",    label: "Specific Products"   },
        { id: "specific_collections", label: "Specific Collection" },
      ].map(({ id, label: l }) => (
        <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
          <input
            type="radio"
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            style={{ accentColor: SHOPIFY_GREEN }}
          />
          {l}
        </label>
      ))}
      <div style={{
        border: `1.5px dashed ${BORDER}`, borderRadius: 6, padding: "8px 10px",
        fontSize: 11, color: MUTED, textAlign: "center", cursor: "pointer", marginTop: 4,
      }}>
        + Add {value === "specific_products" ? "Product(s) or Product Variable(s)" : "Collection(s)"}
      </div>
    </div>
  );
}

// ── Discount code full config ─────────────────────────────────────────────────
const DISCOUNT_TYPES = [
  { id: "amount",       label: "Amount",       icon: "₹"  },
  { id: "percentage",   label: "Percentage",   icon: "%"  },
  { id: "buy_x_get_y",  label: "Buy X Get Y",  icon: "🎁" },
  { id: "free_shipping",label: "Free Shipping", icon: "🚚" },
];

function DiscountCodeConfig({ discount, patchDiscount }) {
  const buyX = discount.buyX ?? { quantity: 1, type: "specific_products", items: [] };
  const getY = discount.getY ?? { quantity: 1, type: "specific_products", items: [], discountType: "free", discountValue: null };
  return (
    <div style={{ padding: "0 16px 16px" }}>
      {/* Coupon Detail */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginTop: 12, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        Coupon Detail
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Discount Coupon Title
          </span>
          <span style={{ fontSize: 10, color: MUTED }}>{(discount.title || "").length}/30</span>
        </div>
        <input
          type="text"
          value={discount.title}
          onChange={(e) => patchDiscount({ title: e.target.value.slice(0, 30) })}
          placeholder='Eg. "Flat ₹15 Off"'
          data-testid="discount-title"
          style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Discount Details */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        Discount Details
      </div>

      {/* Type selector — 4-column card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
        {DISCOUNT_TYPES.map(({ id, label, icon }) => {
          const sel = discount.type === id;
          return (
            <div
              key={id}
              onClick={() => patchDiscount({ type: id })}
              data-testid={`discount-type-${id}`}
              style={{
                borderRadius: 8, padding: "8px 4px", textAlign: "center", cursor: "pointer",
                background: sel ? "#F2F7E8" : "#fff",
                border: `${sel ? 2 : 1.5}px solid ${sel ? SHOPIFY_GREEN : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: sel ? "#3B6D11" : "#374151", lineHeight: 1.2 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Amount */}
      {discount.type === "amount" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Discount Amount
            </div>
            <input
              type="number"
              value={discount.amount ?? ""}
              onChange={(e) => patchDiscount({ amount: e.target.value ? Number(e.target.value) : null })}
              placeholder="15"
              min={0}
              data-testid="discount-amount"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <AppliesToPicker value={discount.appliesTo} onChange={(v) => patchDiscount({ appliesTo: v })} />
          <MinPurchaseSection discount={discount} patchDiscount={patchDiscount} />
        </>
      )}

      {/* Percentage */}
      {discount.type === "percentage" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Discount Percentage
            </div>
            <input
              type="number"
              value={discount.percentage ?? ""}
              onChange={(e) => patchDiscount({ percentage: e.target.value ? Number(e.target.value) : null })}
              placeholder="15"
              min={0}
              max={100}
              data-testid="discount-percentage"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <AppliesToPicker value={discount.appliesTo} onChange={(v) => patchDiscount({ appliesTo: v })} />
          <MinPurchaseSection discount={discount} patchDiscount={patchDiscount} />
        </>
      )}

      {/* Buy X Get Y */}
      {discount.type === "buy_x_get_y" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Customer Buys</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Quantity
            </div>
            <input
              type="number"
              value={buyX.quantity}
              onChange={(e) => patchDiscount({ buyX: { ...buyX, quantity: Number(e.target.value) || 1 } })}
              min={1}
              data-testid="buyx-quantity"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <ItemTypePicker
            label="Any items from"
            value={buyX.type}
            onChange={(v) => patchDiscount({ buyX: { ...buyX, type: v, items: [] } })}
          />

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 4, marginBottom: 8, fontSize: 11, fontWeight: 700, color: "#374151" }}>
            Customer Gets
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Quantity
            </div>
            <input
              type="number"
              value={getY.quantity}
              onChange={(e) => patchDiscount({ getY: { ...getY, quantity: Number(e.target.value) || 1 } })}
              min={1}
              data-testid="gety-quantity"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <ItemTypePicker
            label="Any items from"
            value={getY.type}
            onChange={(v) => patchDiscount({ getY: { ...getY, type: v, items: [] } })}
          />

          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            At a discounted value
          </div>
          {[
            { id: "free",       label: "Free"          },
            { id: "percentage", label: "Percentage off" },
          ].map(({ id, label }) => (
            <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
              <input
                type="radio"
                name="getYDiscount"
                value={id}
                checked={getY.discountType === id}
                onChange={() => patchDiscount({ getY: { ...getY, discountType: id, discountValue: null } })}
                style={{ accentColor: SHOPIFY_GREEN }}
              />
              {label}
            </label>
          ))}
          {getY.discountType === "percentage" && (
            <input
              type="number"
              value={getY.discountValue ?? ""}
              onChange={(e) => patchDiscount({ getY: { ...getY, discountValue: e.target.value ? Number(e.target.value) : null } })}
              placeholder="10"
              min={0}
              max={100}
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
          )}
        </>
      )}

      {/* Free Shipping */}
      {discount.type === "free_shipping" && (
        <MinPurchaseSection discount={discount} patchDiscount={patchDiscount} />
      )}

      {/* Expiration */}
      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={discount.expirationEnabled}
            onChange={(e) => patchDiscount({ expirationEnabled: e.target.checked })}
            style={{ accentColor: SHOPIFY_GREEN }}
            data-testid="expiration-toggle"
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Add Expiration</span>
        </label>
        <div style={{ fontSize: 11, color: MUTED, marginLeft: 22, marginBottom: 8 }}>
          Make coupon only valid till a certain time
        </div>
        {discount.expirationEnabled && (
          <div style={{ marginLeft: 22 }}>
            {[
              { id: "days",       label: "Number of days" },
              { id: "fixed_date", label: "Fixed Date"     },
            ].map(({ id, label }) => (
              <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
                <input
                  type="radio"
                  name="expType"
                  value={id}
                  checked={discount.expirationType === id}
                  onChange={() => patchDiscount({ expirationType: id, expirationValue: null })}
                  style={{ accentColor: SHOPIFY_GREEN }}
                />
                {label}
              </label>
            ))}
            {discount.expirationType === "days" && (
              <input
                type="number"
                value={discount.expirationValue ?? ""}
                onChange={(e) => patchDiscount({ expirationValue: e.target.value ? Number(e.target.value) : null })}
                placeholder="30"
                min={1}
                data-testid="expiration-days"
                style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            )}
            {discount.expirationType === "fixed_date" && (
              <input
                type="date"
                value={discount.expirationValue ?? ""}
                onChange={(e) => patchDiscount({ expirationValue: e.target.value || null })}
                data-testid="expiration-date"
                style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────
export default function ShopifyRightPanel({ node, updateNodeData, removeNode }) {
  const data = node?.data ?? {};
  const patch = (changes) => updateNodeData(node.id, { ...data, ...changes });
  const patchDiscount = (changes) => patch({ discount: { ...(data.discount ?? defaultShopifyNodeData.discount), ...changes } });

  const action     = data.action ?? null;
  const actionMeta = SHOPIFY_ACTIONS.find((a) => a.id === action);

  const resetAction = () => patch({
    action:       null,
    orderTags:    [],
    customerTags: [],
    orderNote:    "",
    discount:     { ...defaultShopifyNodeData.discount },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: SHOPIFY_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShoppingBag size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Shopify</div>
          {actionMeta && (
            <div style={{ fontSize: 11, color: MUTED }}>{actionMeta.emoji} {actionMeta.label}</div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!action ? (
          <ActionPicker onSelect={(a) => patch({ action: a })} />
        ) : (
          <>
            {/* Change-action link */}
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={resetAction}
                data-testid="shopify-change-action"
                style={{ fontSize: 11, color: SHOPIFY_GREEN, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Change action
              </button>
            </div>

            {/* Order Creation */}
            {action === "order_creation" && (
              <div style={{ padding: 16 }}>
                <div style={{ background: "#F2F7E8", border: "1px solid #C8E190", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#3B6D11", marginBottom: 12 }}>
                  🛒 This is a smart node. Shopify order details are automatically resolved.
                </div>
                <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#475569" }}>
                  Order will be created on Shopify
                </div>
              </div>
            )}

            {/* Order Cancellation */}
            {action === "order_cancellation" && (
              <div style={{ padding: 16 }}>
                <div style={{ background: "#F2F7E8", border: "1px solid #C8E190", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#3B6D11", marginBottom: 12 }}>
                  ❌ This is a smart node. Shopify order details are automatically resolved.
                </div>
                <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#475569" }}>
                  Order will be cancelled on Shopify
                </div>
              </div>
            )}

            {/* Order Tag */}
            {action === "order_tag" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Tag name
                </div>
                <TagsEditor
                  tags={data.orderTags ?? []}
                  onChange={(tags) => patch({ orderTags: tags })}
                  testId="order-tags-input"
                />
              </div>
            )}

            {/* Customer Tag */}
            {action === "customer_tag" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Tag name
                </div>
                <TagsEditor
                  tags={data.customerTags ?? []}
                  onChange={(tags) => patch({ customerTags: tags })}
                  testId="customer-tags-input"
                />
              </div>
            )}

            {/* Order Notes */}
            {action === "order_notes" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Notes
                </div>
                <textarea
                  value={data.orderNote ?? ""}
                  onChange={(e) => patch({ orderNote: e.target.value })}
                  placeholder="Enter your text here"
                  rows={4}
                  data-testid="order-notes-input"
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            )}

            {/* Discount Code */}
            {action === "discount_code" && (
              <DiscountCodeConfig
                discount={data.discount ?? defaultShopifyNodeData.discount}
                patchDiscount={patchDiscount}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
