# Shopify Unified Node — Product Design Spec

**Date:** 2026-07-03
**Status:** Approved for implementation
**Audience:** Internal product team, engineers
**Scope:** Unified Shopify action node within Flow Builder (v1 + v2)

---

## 1. Overview

Replace the four separate Shopify palette entries (Customer Tag, Discount Code, Add Order Tag, Order Notes) with a single unified **Shopify** node under the Integrations section. The node uses a card-grid action picker — identical in visual pattern to the WhatsApp template style selector — to let sellers choose one of six Shopify actions. Each action drives distinct right-panel config and a canvas preview line. The node exposes two output handles: **Success** and **Failed**.

---

## 2. Migration: Hide Old Nodes

Remove all four legacy Shopify nodes from both builders:

- **NodePalette.jsx:** Delete the entire "Shopify" section (nodes: `custtag`, `discount`, `ordertag`, `ordernotes`). Add a new `shopify` entry under the existing "Integrations" section.
- **FlowBuilderV2.jsx `V2_ALLOWED_NODES`:** Remove `"custtag"`, `"discount"`, `"ordertag"`, `"ordernotes"`. Add `"shopify"`.

---

## 3. Canvas Node

### 3.1 Unconfigured State
- Dashed border, Shopify green accent (`#96BF48`)
- Shopify bag icon centered
- Label: "Shopify"
- Subtext: "Click to configure"

### 3.2 Configured State
- Solid border, `#96BF48`
- Action chip at top (emoji + action name)
- Preview line per action:

| Action | Preview Line |
|---|---|
| Order Creation | `Order will be created on Shopify` |
| Order Cancellation | `Order will be cancelled on Shopify` |
| Order Tag Update | `Order Tag <first tag> is Updated` |
| Customer Tag Update | `Customer Tag <first tag> is Updated` |
| Order Notes | `Order Note <truncated note> is Updated` |
| Discount Code | `Discount: <title> · <type> · expires <value or "never">` |

### 3.3 Output Handles

| Handle | Color | Meaning |
|---|---|---|
| `Success` | Green | Shopify API call succeeded |
| `Failed` | Red | Shopify API call failed |

---

## 4. Right Panel

### 4.1 Action Picker (top of panel, always visible)

3-column card grid — same visual pattern as `TemplateStylePicker` in `WhatsAppRightPanel.jsx`:
- Each card: emoji circle icon, action name, one-line description
- Default: white background, light gray border
- Hover: light green background, green border
- Selected: green border + green checkmark badge (top-right)

| id | Emoji | Label | Description |
|---|---|---|---|
| `order_creation` | 🛒 | Order Creation | Create an order on Shopify |
| `order_cancellation` | ❌ | Order Cancellation | Cancel an existing order |
| `order_tag` | 🏷️ | Order Tag Update | Add tags to an order |
| `customer_tag` | 👤 | Customer Tag Update | Add tags to a customer |
| `order_notes` | 📝 | Order Notes | Update notes on an order |
| `discount_code` | 🎁 | Discount Code | Generate a discount coupon |

Once an action is selected, the picker grid is replaced by the action-specific config. A small **"Change action"** text link appears at the top of the config section; clicking it resets `action` to null, shows the picker grid again, and clears all action-specific state (no confirmation dialog).

### 4.2 Order Creation

No config fields. Informational banner only:
> "This is a smart node. Shopify order details are automatically resolved."

### 4.3 Order Cancellation

No config fields. Informational banner only:
> "This is a smart node. Shopify order details are automatically resolved."

### 4.4 Order Tag Update

- **Tag input field:** text input + Enter to add tag (matches existing "Add Tags" UI pattern)
- **Tag chips:** displayed below input; mock data seeded: `Nitro`, `nitro`, `fastrr_login`; each chip has an × remove button; "Clear all" link at right
- No character limit on individual tags

### 4.5 Customer Tag Update

Identical layout to Order Tag Update (§4.4), same mock data.

### 4.6 Order Notes

- **Notes textarea:** placeholder "Enter note text here"; no character limit

### 4.7 Discount Code

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coupon Detail
  Discount Coupon Title *          0/30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Discount Details
  [Type selector: Amount | Percentage | Buy X Get Y | Free Shipping]

  ── Amount ──
    Discount Amount [number input]

    Applies to
      ○ Entire Order
      ○ Specific Products  → product(s) / product variable(s) picker
      ○ Specific Collections → collection(s) picker

    Minimum Purchase Requirements [toggle]
      [when enabled]
      Enable coupon only after a [Minimum Order Value ▼ / Minimum Number of Items ▼]
      Minimum value [number input]

  ── Percentage ──
    Discount Percentage [number input, %]
    (same Applies to + Minimum Purchase Requirements as Amount)

  ── Buy X Get Y ──
    Customer Buys
      Quantity [integer]
      Any items from
        ○ Specific Products  → Add Product(s) / Add Product Variable(s)
        ○ Specific Collection → Add Collection(s)

    Customer Gets
      Quantity [integer]
      Any items from
        ○ Specific Products  → Add Product(s) / Add Product Variable(s)
        ○ Specific Collection → Add Collection(s)
      At a discounted value
        ○ Free
        ○ Percentage off [number input, %]

  ── Free Shipping ──
    Minimum Purchase Requirements [toggle]
      (same as Amount minimum purchase section)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ Add Expiration  [collapsed by default]
  [toggle: on/off]
  [when enabled]
  ○ Number of days  [integer]
  ○ Fixed Date      [date picker]
```

---

## 5. Data Structure

```js
// Default / initial node data
{
  action: null,  // "order_creation" | "order_cancellation" | "order_tag" | "customer_tag" | "order_notes" | "discount_code"

  // order_tag / customer_tag
  orderTags: [],      // string[]
  customerTags: [],   // string[]

  // order_notes
  orderNote: "",

  // discount_code
  discount: {
    title: "",
    type: "amount",   // "amount" | "percentage" | "buy_x_get_y" | "free_shipping"

    // amount / percentage
    amount: null,
    percentage: null,
    appliesTo: "entire_order",  // "entire_order" | "specific_products" | "specific_collections"
    products: [],
    collections: [],
    minPurchaseEnabled: false,
    minPurchaseType: "order_value",  // "order_value" | "item_count"
    minPurchaseValue: null,

    // buy_x_get_y
    buyX: {
      quantity: 1,
      type: "specific_products",  // "specific_products" | "specific_collections"
      items: [],
    },
    getY: {
      quantity: 1,
      type: "specific_products",
      items: [],
      discountType: "free",   // "free" | "percentage"
      discountValue: null,
    },

    // expiration
    expirationEnabled: false,
    expirationType: "days",   // "days" | "fixed_date"
    expirationValue: null,    // integer (days) or ISO date string
  },
}
```

---

## 6. File Structure

```
src/components/flows/builder/nodes/ShopifyNode/
  index.jsx                   ← canvas node (unconfigured + configured states, 2 output handles)
  ShopifyRightPanel.jsx        ← right panel with action picker + action-specific sections
  data/
    mockData.js                ← default data, mock tags, action definitions
```

Registration / modification points:

| File | Change |
|---|---|
| `NodePalette.jsx` | Remove Shopify section; add `shopify` entry to Integrations |
| `FlowBuilderV2.jsx` | Remove old IDs from `V2_ALLOWED_NODES`; add `"shopify"` |
| `Canvas.jsx` | Add `shopify: ShopifyNode` to `nodeTypes` map |
| `ConfigTab.jsx` | Add routing block for `node?.type === "shopify"` → `ShopifyRightPanel` |
| `flowMeta.js` | Add `case "shopify"` to `defaultDataForPaletteItem`; add `"shopify"` to `rendererTypeForKind` |

---

## 7. Non-Goals (v1)

- No actual Shopify API calls — UX only
- No variable picker for order/customer ID resolution (smart node resolves automatically)
- No multi-action configuration in a single node (one action per node)
- No output handle branching logic
- No "Change Action" confirmation dialog (switching action resets config silently)
