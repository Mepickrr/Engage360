// Static mock content for the Segment management homepage — separate from
// segmentsData.js (the real segment CRUD store) since none of this flows
// through create/update paths. Frontend-only, no backend.

import {
  Trophy,
  Gem,
  Rocket,
  UserPlus,
  Star,
  AlertTriangle,
  Clock,
  Anchor,
  Moon,
  UserX,
  Flame,
  Coffee,
  Snowflake,
  Sprout,
} from "lucide-react";

export const OPPORTUNITY_CARDS = [
  {
    id: "opp_1",
    headline: "89.87K Hibernating customers can be recovered",
    description: "These long-inactive have a good chance of responding",
    gain: "₹58,69,329",
    boostEnabled: true,
  },
  {
    id: "opp_2",
    headline: "42.62K high-value customers are active",
    description: "Few Big Spenders are showing signs of buying again",
    gain: "₹13,21,726",
    boostEnabled: true,
  },
  {
    id: "opp_3",
    headline: "11.80K Dormant customers show small signals",
    description: "Long-lost customers. A few are can become active again",
    gain: "₹3,78,925",
    boostEnabled: false,
  },
];

export const RETENTION_SEGMENTS = [
  { id: "ret_1", name: "Champions", Icon: Trophy, updated: "11:25 PM, 22nd Jul", description: "Your top fans - they buy often, spend the most, and purchased recently. Treat them like VIPs.", users: "1,63,073", avgRevenuePerUser: "₹3,733" },
  { id: "ret_2", name: "Loyal customers", Icon: Gem, updated: "11:30 PM, 22nd Jul", description: "Repeat buyers who come back regularly. Not as frequent as Champions, but very reliable.", users: "69,540", avgRevenuePerUser: "₹2,940" },
  { id: "ret_3", name: "Potential loyalists", Icon: Rocket, updated: "12:19 AM, 23rd Jul", description: "Bought recently and showing early signs of becoming Loyalists, they just need a little nudge.", users: "5,12,566", avgRevenuePerUser: "₹663" },
  { id: "ret_4", name: "New customers", Icon: UserPlus, updated: "12:25 AM, 23rd Jul", description: "Made their first purchase recently but haven't come back yet. The goal is to get them to order again.", users: "1,14,121", avgRevenuePerUser: null },
  { id: "ret_5", name: "Promising", Icon: Star, updated: "12:52 AM, 23rd Jul", description: "Bought a few times but inconsistently. They like you, they just haven't made it a habit yet.", users: "3,42,560", avgRevenuePerUser: "₹1,007" },
  { id: "ret_6", name: "Need attention", Icon: AlertTriangle, updated: "1:03 AM, 23rd Jul", description: "Used to buy regularly but have slowed down. They're starting to re-engage, a good time to reach out.", users: "1,83,591", avgRevenuePerUser: "₹1,270" },
  { id: "ret_7", name: "At risk", Icon: Clock, updated: "1:36 AM, 23rd Jul", description: "Were frequent buyers but have gone quiet.", users: "3,97,251", avgRevenuePerUser: "₹1,328" },
  { id: "ret_8", name: "Can't lose them", Icon: Anchor, updated: "1:46 AM, 23rd Jul", description: "High spenders who are at risk of leaving your brand. They don't buy often, but when they do, it's big.", users: "1,79,723", avgRevenuePerUser: "₹1,949" },
  { id: "ret_9", name: "Hibernating", Icon: Moon, updated: "2:08 AM, 23rd Jul", description: "Haven't bought in a long time and weren't very active. A re-introduction campaign may wake them up.", users: "3,60,385", avgRevenuePerUser: "₹642" },
  { id: "ret_10", name: "Lost customers", Icon: UserX, updated: "2:11 AM, 23rd Jul", description: "Customers who purchased long ago and haven't returned", users: "47,302", avgRevenuePerUser: null },
];

export const RETENTION_INFO_BANNER =
  "Customers who have purchased from you. Keep them engaged, prevent churn, and grow their value.";

export const ACQUISITION_SEGMENTS = [
  { id: "acq_1", name: "Hot Leads", Icon: Flame, updated: "2:16 AM, 23rd Jul", description: "Leads who took high-intent actions in the last 7 days (like add to cart or replied)", users: "59,607" },
  { id: "acq_2", name: "Warm Leads", Icon: Coffee, updated: "2:43 AM, 23rd Jul", description: "Leads who showed interest recently (like clicks or product views)", users: "3,81,173" },
  { id: "acq_3", name: "Cold Leads", Icon: Snowflake, updated: "3:26 AM, 23rd Jul", description: "Leads with only light or older activity (like message delivered or profile created)", users: "5,82,784" },
  { id: "acq_4", name: "Nurture Leads", Icon: Sprout, updated: "3:40 AM, 23rd Jul", description: "Leads who've gone quiet after early interest — a nudge campaign can re-engage them.", users: "2,14,300" },
];

export const ACQUISITION_INFO_BANNER =
  "Potential customers who haven't purchased yet. Convert them with targeted campaigns based on their intent.";

const SEGMENT_LIBRARY_BASE = [
  { id: "lib_1", name: "promising Customer", updated: "4:59 PM, 11th Mar", description: "Customers who have made frequent purchases and spent a lot but haven't engaged recently.", users: "2,63,037" },
  { id: "lib_2", name: "Repeat buyers", updated: "10:18 PM, 7th Mar", description: "Customers who have purchased more than twice from your store.", users: "1,33,873" },
  { id: "lib_3", name: "Engaged customers", updated: "5:20 PM, 13th Dec", description: "Customers who have either clicked on or replied to your messages at least three times in the last 60 days.", users: "87,409" },
  { id: "lib_4", name: "Subscribers who never purchased", updated: "6:21 PM, 1st Dec", description: "All customers who are reachable on at least one messaging channel but have never placed an order.", users: "11,75,823" },
  { id: "lib_5", name: "All WhatsApp subscribers", updated: "5:51 PM, 16th Aug", description: "All customers who are reachable on WhatsApp.", users: "15,08,035" },
  { id: "lib_6", name: "All email subscribers", updated: "1:07 PM, 7th Feb", description: "All customers who are reachable on email.", users: "0" },
  { id: "lib_7", name: "All subscribers", updated: "1:07 PM, 7th Feb", description: "All customers who are reachable on at least one messaging channel.", users: "0" },
  { id: "lib_8", name: "New subscribers (30 days)", updated: "1:07 PM, 7th Feb", description: "New reachable customers acquired in the last 30 days.", users: "0" },
  { id: "lib_9", name: "All SMS subscribers", updated: "1:07 PM, 7th Feb", description: "All customers who are reachable on SMS.", users: "0" },
];

export const SEGMENT_LIBRARY_INFO_BANNER = "Pre-built segments ready to use.";

const SHOPIFY_SEGMENTS_BASE = [
  { id: "shop_1", name: "Last 30 days", updated: "6:08 PM, 23rd Jul", rule: "last_order_date > -30d" },
  { id: "shop_2", name: "Customers Who Purchase...", updated: "3:52 PM, 8th Jul", rule: "products_purchased MATCHES ( id = 7698145706200, date >= -30d )" },
  { id: "shop_3", name: "Customers Who Purchase...", updated: "11:51 AM, 8th Jul", rule: "products_purchased MATCHES ( id = 8164014194904, date >= -30d )" },
  { id: "shop_4", name: "Customers Who Purchase...", updated: "11:50 AM, 8th Jul", rule: "products_purchased MATCHES (id IN (7968704037080, 9180697002200, 9180692185304, 9092271603928), date >= -30d)" },
  { id: "shop_5", name: "Customers Who Purchase...", updated: "11:43 AM, 8th Jul", rule: "products_purchased MATCHES (id IN (8174008369368, 7698045665496), date >= -30d)" },
  { id: "shop_6", name: "Customers Who Purchase...", updated: "6:21 PM, 7th Jul", rule: "products_purchased MATCHES (id IN (7698126242008, 8377127502040, 7971095871704, 8852681064664,...)" },
  { id: "shop_7", name: "Customers Who Purchase...", updated: "6:19 PM, 7th Jul", rule: "products_purchased MATCHES (id IN (7698126242008, 8377127502040, 7971095871704, 8852681064664,...)" },
  { id: "shop_8", name: "Customers who purchase...", updated: "5:57 PM, 7th Jul", rule: "products_purchased MATCHES ( id = 7698126242008 )" },
  { id: "shop_9", name: "Customers Who Have Pur...", updated: "10:56 AM, 1st Jul", rule: "number_of_orders >= 3" },
];

export const SHOPIFY_LAST_SYNCED = "23 Jul 2026 at 6:08 PM";

export const SUPPRESSION_ASSETS = [
  {
    id: "supp_1",
    name: "Email suppressed by Fastrr",
    updated: "6:24 AM, 20th Jul",
    description:
      "Fastrr-generated list of customers who shouldn't be targeted in campaigns, such as opted-out or invalid email or marked emails as spam.",
    users: "1",
  },
  {
    id: "supp_2",
    name: "WhatsApp suppressed by Fastrr",
    updated: "5:22 AM, 20th Jul",
    description:
      "Fastrr-generated list of customers who shouldn't be targeted in campaigns, such as opted-out or invalid phone numbers",
    users: "4,81,734",
  },
];

// Deterministic filler generator (no Math.random/Date.now) — used to pad
// Segment library (9 → 21) and Shopify segments (9 → 61) to their wireframe
// "Showing X out of Y" totals with entries not depicted in the wireframes.
export function makeFillerCards(prefix, count, startIndex) {
  return Array.from({ length: count }, (_, i) => {
    const n = startIndex + i;
    return {
      id: `${prefix}_filler_${n}`,
      name: `${prefix === "lib" ? "Segment" : "Shopify segment"} ${n}`,
      updated: "9:00 AM, 1st Jan",
      description: prefix === "lib" ? "Additional pre-built segment." : undefined,
      rule: prefix === "shop" ? `custom_rule_${n} = true` : undefined,
      users: prefix === "lib" ? "0" : undefined,
    };
  });
}

export const SEGMENT_LIBRARY = [...SEGMENT_LIBRARY_BASE, ...makeFillerCards("lib", 12, 1)];

export const SHOPIFY_SEGMENTS = [...SHOPIFY_SEGMENTS_BASE, ...makeFillerCards("shop", 52, 1)];
