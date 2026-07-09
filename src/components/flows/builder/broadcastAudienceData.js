/**
 * broadcastAudienceData.js
 * Mock data and helpers for the Broadcast Schedule + Audience flow.
 * TODO: replace all mock data with real API calls as noted below.
 */

// TODO: replace with real GET /api/csv-uploads
export const MOCK_HISTORICAL_CSVS = [
  { id: "hist_001", name: "Summer_Sale_Contacts.csv",   rowCount: 4821,  uploadedAt: "2026-06-28", size: 124500, columns: ["phone_number", "name", "city", "email"] },
  { id: "hist_002", name: "VIP_Members_June.csv",       rowCount: 1203,  uploadedAt: "2026-06-15", size: 38200,  columns: ["mobile", "customer_name", "tier"] },
  { id: "hist_003", name: "Abandoned_Cart_Users.csv",   rowCount: 8942,  uploadedAt: "2026-05-30", size: 275000, columns: ["phone", "name", "cart_value"] },
  { id: "hist_004", name: "Newsletter_Subscribers.csv", rowCount: 15420, uploadedAt: "2026-05-10", size: 445000, columns: ["phone_number", "first_name", "last_name"] },
  { id: "hist_005", name: "WhatsApp_Optin_July.csv",    rowCount: 3241,  uploadedAt: "2026-07-01", size: 98700,  columns: ["wa_number", "name"] },
];

// TODO: replace with real GET /api/segments?type=broadcast
export const BROADCAST_MOCK_SEGMENTS = [
  { id: "bseg_001", name: "VIP Customers",                  userCount: 5430,  type: "dynamic", updatedAt: "2 hours ago"  },
  { id: "bseg_002", name: "Lapsed Users — 60 Days",         userCount: 8200,  type: "dynamic", updatedAt: "1 day ago"    },
  { id: "bseg_003", name: "Cart Abandoners — Last 7d",       userCount: 3100,  type: "dynamic", updatedAt: "30 min ago"   },
  { id: "bseg_004", name: "New Signups — This Month",        userCount: 1840,  type: "dynamic", updatedAt: "1 hour ago"   },
  { id: "bseg_005", name: "High AOV Buyers — ₹2k+",         userCount:  480,  type: "dynamic", updatedAt: "6 hours ago"  },
  { id: "bseg_006", name: "Offline Export — April 2026",     userCount: 9999,  type: "static",  updatedAt: "01 Apr 2026"  },
  { id: "bseg_007", name: "500_Sellers_Cohort_3_30 march 2026", userCount: 500, type: "static", updatedAt: "30 Mar 2026" },
];

// TODO: replace with real GET /api/users/count
export const MOCK_TOTAL_USERS = 45230;

// Sample CSV template content
export const SAMPLE_CSV_CONTENT = "phone_number,name\n9876543210,Rahul Sharma\n9765432109,Priya Nair\n9654321098,Amit Patel";
export const SAMPLE_CSV_FILENAME = "broadcast_sample.csv";

// Common IANA timezones for the scheduler dropdown
export const TIMEZONES = [
  { value: "Asia/Kolkata",       label: "Asia/Kolkata (UTC+0530)"       },
  { value: "Asia/Dubai",         label: "Asia/Dubai (UTC+0400)"         },
  { value: "Asia/Singapore",     label: "Asia/Singapore (UTC+0800)"     },
  { value: "Asia/Tokyo",         label: "Asia/Tokyo (UTC+0900)"         },
  { value: "UTC",                label: "UTC (UTC+0000)"                },
  { value: "Europe/London",      label: "Europe/London (UTC+0000)"      },
  { value: "Europe/Berlin",      label: "Europe/Berlin (UTC+0100)"      },
  { value: "America/New_York",   label: "America/New_York (UTC-0500)"   },
  { value: "America/Chicago",    label: "America/Chicago (UTC-0600)"    },
  { value: "America/Los_Angeles",label: "America/Los_Angeles (UTC-0800)"},
  { value: "Australia/Sydney",   label: "Australia/Sydney (UTC+1100)"   },
];

/**
 * getMockReachCount — calculates a mock estimated reach value.
 * TODO: replace with real POST /api/audience/count API call.
 */
export function getMockReachCount({ sourceType, selectedSegments = [], csvRowCount = 0, hasInclude = false, hasExclude = false }) {
  let base = 0;
  if (sourceType === "all_users")              base = MOCK_TOTAL_USERS;
  else if (sourceType === "segment")           base = selectedSegments.reduce((s, seg) => s + (seg.userCount || 0), 0);
  else if (sourceType === "csv")               base = csvRowCount;
  else if (sourceType === "direct_csv")        base = csvRowCount;

  if (hasInclude && base > 0)  base = Math.round(base * 0.78);
  if (hasExclude && base > 0)  base = Math.round(base * 0.91);
  return base;
}

// TODO: replace with real GET /api/audience/reachability?userCount=
const CHANNEL_REACH_PCT = [
  { channel: "Push",     pct: 0.5446 },
  { channel: "Email",    pct: 0.8299 },
  { channel: "SMS",      pct: 0.8841 },
  { channel: "WhatsApp", pct: 0.8839 },
];

/**
 * getChannelReachability — mock split of a reach count across channels.
 * TODO: replace with real GET /api/audience/reachability call.
 */
export function getChannelReachability(reach) {
  return CHANNEL_REACH_PCT.map(({ channel, pct }) => ({
    channel,
    count: Math.round(reach * pct),
    pctOfReachable: Math.round(pct * 100 * 100) / 100,
  }));
}

/**
 * Check if a given date + time combination is in the past relative to now.
 */
export function isPastDateTime(isoDate, hour24, minute) {
  if (!isoDate) return false;
  const dt = new Date(`${isoDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
  return dt < new Date();
}
