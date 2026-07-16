import React, { useState } from "react";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import ChannelChip from "@/components/flows/ChannelChip";
import { Search, Filter } from "lucide-react";
import UserProfileDrawer from "@/components/audience/UserProfileDrawer";

const KPIS = [
  { label: "Total targetable users",  value: "45.2K", delta: "+1.2K",  testId: "aud-kpi-total"  },
  { label: "Known",   value: "32.1K", delta: "+820",   testId: "aud-kpi-id"     },
  { label: "Fastrr identified",    value: "13.1K",                  testId: "aud-kpi-anon"   },
  { label: "Active 30d",   value: "18.9K", delta: "+6.1%",  testId: "aud-kpi-active" },
];

function makeEvents(name) {
  const now = Date.now();
  const m   = (n) => now - n * 60 * 1000;
  const detail = (overrides = {}) => [
    { key: "Event Time",              value: new Date(now).toLocaleString("en-IN") },
    { key: "Event Received Time",     value: new Date(now).toLocaleString("en-IN") },
    { key: "SDK Version",             value: "unknown" },
    { key: "App Version",             value: "unknown" },
    { key: "Campaign Name",           value: "export_email_opened" },
    { key: "status_code",             value: "200" },
    { key: "Readable Campaign Id",    value: "6903524adf25ee88754846b7" },
    { key: "Campaign Channel",        value: overrides.channel || "Connector" },
    { key: "Campaign Version Number", value: "1" },
    { key: "Delivery Type",           value: "Event Triggered" },
    { key: "coupon_lists",            value: "Empty data" },
    { key: "Campaign Type",           value: overrides.type || "Webhook" },
    { key: "MOE Event Category",      value: "Campaign Activity" },
    { key: "Event Sent Time",         value: "1780910436" },
    { key: "MOE Event Source",        value: "INTERNAL" },
    { key: "coupon_codes",            value: "Empty data" },
    { key: "Campaign Id",             value: "6903524adf25ee88754846b7_F_T..." },
  ];
  return [
    { id: "e1", timestamp: new Date(m(7)).toISOString(),    name: "Connector Sent",   dotColor: "blue",   source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Connector" }) },
    { id: "e2", timestamp: new Date(m(440)).toISOString(),  name: "Email Opened",     dotColor: "green",  source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Email", type: "Email" }) },
    { id: "e3", timestamp: new Date(m(441)).toISOString(),  name: "Connector Sent",   dotColor: "blue",   source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Connector" }) },
    { id: "e4", timestamp: new Date(m(442)).toISOString(),  name: "Email Delivered",  dotColor: "green",  source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Email", type: "Email" }) },
    { id: "e5", timestamp: new Date(m(443)).toISOString(),  name: "Email Sent",       dotColor: "blue",   source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Email", type: "Email" }) },
    { id: "e6", timestamp: new Date(m(2300)).toISOString(), name: "Connector Sent",   dotColor: "blue",   source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Connector" }) },
    { id: "e7", timestamp: new Date(m(2308)).toISOString(), name: "Email Opened",     dotColor: "green",  source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Email", type: "Email" }) },
    { id: "e8", timestamp: new Date(m(5000)).toISOString(), name: "Connector Sent",   dotColor: "blue",   source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Connector" }) },
    { id: "e9", timestamp: new Date(m(5001)).toISOString(), name: "Email Delivered",  dotColor: "green",  source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Email", type: "Email" }) },
    { id: "e10",timestamp: new Date(m(5002)).toISOString(), name: "Email Sent",       dotColor: "blue",   source: "MoEngage", platform: "Webhook", eventType: "Campaign Activity", details: detail({ channel: "Email", type: "Email" }) },
    { id: "e11",timestamp: new Date(m(7200)).toISOString(), name: "App Opened",       dotColor: "gray",   source: "MoEngage", platform: "SDK",     eventType: "App Activity",      details: detail({ channel: "App", type: "App" }) },
    { id: "e12",timestamp: new Date(m(7500)).toISOString(), name: "Page Viewed",      dotColor: "gray",   source: "MoEngage", platform: "SDK",     eventType: "App Activity",      details: detail({ channel: "App", type: "App" }) },
    { id: "e13",timestamp: new Date(m(9000)).toISOString(), name: "Add to Cart",      dotColor: "orange", source: "MoEngage", platform: "SDK",     eventType: "Ecommerce",         details: detail({ channel: "App", type: "Ecommerce" }) },
    { id: "e14",timestamp: new Date(m(10080)).toISOString(),name: "Purchase",         dotColor: "green",  source: "MoEngage", platform: "SDK",     eventType: "Ecommerce",         details: detail({ channel: "App", type: "Ecommerce" }) },
  ];
}

const USERS = [
  {
    id: "u1", name: "Aanya Sharma",   initials: "AS", color: "#10B981",
    firstName: "Aanya",      lastName: "Sharma",
    whatsappUsername: "@aanya.sharma", email: "aanya.s@example.com",
    mobile: "+91 98765 43210", mobileEnc: "****43210",
    engageId: "ENG-10001", audienceType: "Fastrr Identified",
    gender: "Female", birthDate: "14 Mar 1993", anniversary: "22 Nov 2018",
    lastActive: "2 min ago", totalSessions: "14", ltv: "₹14,820",
    channels: ["whatsapp", "email"],
    reachability: { webPush: "subscribed", mobilePush: "subscribed", inapp: "subscribed", email: "subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",    value: "false" },
      { name: "Gharsoap_popup_dismissed",  value: "true"  },
      { name: "ACTIVE_PLAN",               value: "Lite"  },
      { name: "ACTIVE_WALLET_AMOUNT",      value: "3688.24" },
      { name: "GROSS_REVENUE",             value: "3267" },
    ],
    engagePrediction: { email: "05:00 PM (06:00 UTC)", whatsapp: "07:00 PM (08:00 UTC)", rcs: "06:00 PM (06:00 UTC)", push: "09:00 AM (04:00 UTC)", sms: "10:00 AM (04:30 UTC)" },
    buyerTags: { weekendShopper: true, fullPriceAverse: false, bargainHunter: false, valueSeeker: true, highValueShopper: false, gender: "Female", preferredCategory: "Fashion", rtoRisk: "Low", discountAffinity: "Medium" },
    lifecycle: { firstSeen: "05 Jan 2025, 10:35:05 am", lastSeen: "08 Jun 2026, 02:50 pm" },
    events: makeEvents("Aanya"),
  },
  {
    id: "u2", name: "Rohan Mehta",    initials: "RM", color: "#3B82F6",
    firstName: "Rohan",      lastName: "Mehta",
    whatsappUsername: "@rohan.mehta", email: "rohan.m@example.com",
    mobile: "+91 87654 32109", mobileEnc: "****32109",
    engageId: "ENG-10002", audienceType: "Known User",
    gender: "Male", birthDate: "02 Jul 1990", anniversary: "—",
    lastActive: "12 min ago", totalSessions: "7", ltv: "₹3,210",
    channels: ["whatsapp"],
    reachability: { webPush: "not_subscribed", mobilePush: "subscribed", inapp: "not_subscribed", email: "not_subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "true"  },
      { name: "Gharsoap_popup_dismissed", value: "false" },
      { name: "ACTIVE_PLAN",              value: "Basic" },
    ],
    engagePrediction: { email: "—", whatsapp: "08:00 PM (08:30 UTC)", rcs: "—", push: "10:00 AM (04:30 UTC)", sms: "11:00 AM (05:30 UTC)" },
    buyerTags: { weekendShopper: false, fullPriceAverse: true, bargainHunter: true, valueSeeker: false, highValueShopper: false, gender: "Male", preferredCategory: "Electronics", rtoRisk: "Medium", discountAffinity: "High" },
    lifecycle: { firstSeen: "12 Mar 2025, 09:15:00 am", lastSeen: "08 Jun 2026, 01:38 pm" },
    events: makeEvents("Rohan"),
  },
  {
    id: "u3", name: "Ishaan Kapoor",  initials: "IK", color: "#8B5CF6",
    firstName: "Ishaan",     lastName: "Kapoor",
    whatsappUsername: "@ishaan.kapoor", email: "ishaan@example.com",
    mobile: "+91 76543 21098", mobileEnc: "****21098",
    engageId: "ENG-10003", audienceType: "Fastrr Identified",
    gender: "Male", birthDate: "29 Oct 1988", anniversary: "05 Feb 2014",
    lastActive: "1 h ago", totalSessions: "22", ltv: "₹9,440",
    channels: ["email", "push"],
    reachability: { webPush: "subscribed", mobilePush: "subscribed", inapp: "subscribed", email: "subscribed", sms: "not_subscribed", whatsapp: "not_subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "false" },
      { name: "Gharsoap_popup_dismissed", value: "false" },
      { name: "COMPANY_TYPE",             value: "IT"    },
    ],
    engagePrediction: { email: "06:00 PM (12:30 UTC)", whatsapp: "—", rcs: "—", push: "08:00 AM (02:30 UTC)", sms: "—" },
    buyerTags: { weekendShopper: true, fullPriceAverse: false, bargainHunter: false, valueSeeker: false, highValueShopper: true, gender: "Male", preferredCategory: "Books", rtoRisk: "Low", discountAffinity: "Low" },
    lifecycle: { firstSeen: "21 Jun 2024, 08:00:00 am", lastSeen: "08 Jun 2026, 12:45 pm" },
    events: makeEvents("Ishaan"),
  },
  {
    id: "u4", name: "Sneha Iyer",     initials: "SI", color: "#EC4899",
    firstName: "Sneha",      lastName: "Iyer",
    whatsappUsername: "@sneha.iyer", email: "sneha.i@example.com",
    mobile: "+91 65432 10987", mobileEnc: "****10987",
    engageId: "ENG-10004", audienceType: "Fastrr Identified",
    gender: "Female", birthDate: "07 Dec 1995", anniversary: "14 Feb 2020",
    lastActive: "Yesterday", totalSessions: "41", ltv: "₹22,110",
    channels: ["whatsapp", "sms"],
    reachability: { webPush: "subscribed", mobilePush: "subscribed", inapp: "subscribed", email: "subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "true"  },
      { name: "Gharsoap_popup_dismissed", value: "true"  },
      { name: "GROSS_REVENUE",            value: "18540" },
    ],
    engagePrediction: { email: "04:00 PM (10:30 UTC)", whatsapp: "09:00 PM (15:30 UTC)", rcs: "07:00 PM (13:30 UTC)", push: "07:00 AM (01:30 UTC)", sms: "12:00 PM (06:30 UTC)" },
    buyerTags: { weekendShopper: true, fullPriceAverse: false, bargainHunter: false, valueSeeker: false, highValueShopper: true, gender: "Female", preferredCategory: "Beauty", rtoRisk: "Low", discountAffinity: "Low" },
    lifecycle: { firstSeen: "15 Aug 2024, 11:00:00 am", lastSeen: "07 Jun 2026, 08:30 pm" },
    events: makeEvents("Sneha"),
  },
  {
    id: "u5", name: "Karthik Rao",    initials: "KR", color: "#F59E0B",
    firstName: "Karthik",    lastName: "Rao",
    whatsappUsername: "—", email: "karthik.r@example.com",
    mobile: "+91 54321 09876", mobileEnc: "****09876",
    engageId: "ENG-10005", audienceType: "Known User",
    gender: "Male", birthDate: "19 Apr 1992", anniversary: "—",
    lastActive: "3 d ago", totalSessions: "5", ltv: "₹1,820",
    channels: ["email"],
    reachability: { webPush: "not_subscribed", mobilePush: "not_subscribed", inapp: "not_subscribed", email: "subscribed", sms: "not_subscribed", whatsapp: "not_subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "false" },
      { name: "Gharsoap_popup_dismissed", value: "false" },
    ],
    engagePrediction: { email: "03:00 PM (09:30 UTC)", whatsapp: "—", rcs: "—", push: "—", sms: "—" },
    buyerTags: { weekendShopper: false, fullPriceAverse: true, bargainHunter: true, valueSeeker: true, highValueShopper: false, gender: "Male", preferredCategory: "Sports", rtoRisk: "High", discountAffinity: "High" },
    lifecycle: { firstSeen: "03 Oct 2025, 03:45:00 pm", lastSeen: "05 Jun 2026, 06:12 am" },
    events: makeEvents("Karthik"),
  },
  {
    id: "u6", name: "Meera Pillai",   initials: "MP", color: "#14B8A6",
    firstName: "Meera",      lastName: "Pillai",
    whatsappUsername: "@meera.pillai", email: "meera.p@example.com",
    mobile: "+91 43210 98765", mobileEnc: "****98765",
    engageId: "ENG-10006", audienceType: "Fastrr Identified",
    gender: "Female", birthDate: "23 Aug 1991", anniversary: "10 Jan 2016",
    lastActive: "8 min ago", totalSessions: "63", ltv: "₹31,290",
    channels: ["whatsapp", "email", "push"],
    reachability: { webPush: "subscribed", mobilePush: "subscribed", inapp: "subscribed", email: "subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "subscribed", call: "subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "true"  },
      { name: "Gharsoap_popup_dismissed", value: "false" },
      { name: "GROSS_REVENUE",            value: "28440" },
      { name: "ACTIVE_PLAN",              value: "Premium" },
    ],
    engagePrediction: { email: "07:00 PM (13:30 UTC)", whatsapp: "06:00 PM (12:30 UTC)", rcs: "05:00 PM (11:30 UTC)", push: "08:00 AM (02:30 UTC)", sms: "09:00 AM (03:30 UTC)" },
    buyerTags: { weekendShopper: true, fullPriceAverse: false, bargainHunter: false, valueSeeker: false, highValueShopper: true, gender: "Female", preferredCategory: "Jewelry", rtoRisk: "Low", discountAffinity: "Low" },
    lifecycle: { firstSeen: "01 Jan 2024, 00:00:00 am", lastSeen: "08 Jun 2026, 02:52 pm" },
    events: makeEvents("Meera"),
  },
  {
    id: "u7", name: "Aditya Singh",   initials: "AS", color: "#6366F1",
    firstName: "Aditya",     lastName: "Singh",
    whatsappUsername: "—", email: "aditya.s@example.com",
    mobile: "+91 32109 87654", mobileEnc: "****87654",
    engageId: "ENG-10007", audienceType: "Known User",
    gender: "Male", birthDate: "11 Jun 1997", anniversary: "—",
    lastActive: "5 h ago", totalSessions: "3", ltv: "₹612",
    channels: ["sms"],
    reachability: { webPush: "not_subscribed", mobilePush: "not_subscribed", inapp: "not_subscribed", email: "not_subscribed", sms: "subscribed", whatsapp: "not_subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "false" },
      { name: "Gharsoap_popup_dismissed", value: "false" },
    ],
    engagePrediction: { email: "—", whatsapp: "—", rcs: "—", push: "—", sms: "02:00 PM (08:30 UTC)" },
    buyerTags: { weekendShopper: false, fullPriceAverse: true, bargainHunter: true, valueSeeker: false, highValueShopper: false, gender: "Male", preferredCategory: "Electronics", rtoRisk: "Medium", discountAffinity: "High" },
    lifecycle: { firstSeen: "18 Feb 2026, 04:30:00 pm", lastSeen: "08 Jun 2026, 09:45 am" },
    events: makeEvents("Aditya"),
  },
  {
    id: "u8", name: "Priyanka Joshi", initials: "PJ", color: "#EF4444",
    firstName: "Priyanka",   lastName: "Joshi",
    whatsappUsername: "@priyanka.joshi", email: "priyanka.j@example.com",
    mobile: "+91 21098 76543", mobileEnc: "****76543",
    engageId: "ENG-10008", audienceType: "Fastrr Identified",
    gender: "Female", birthDate: "30 Sep 1994", anniversary: "08 Mar 2021",
    lastActive: "Just now", totalSessions: "29", ltv: "₹8,940",
    channels: ["whatsapp", "email"],
    reachability: { webPush: "subscribed", mobilePush: "subscribed", inapp: "subscribed", email: "subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "true"  },
      { name: "Gharsoap_popup_dismissed", value: "false" },
      { name: "ACTIVE_PLAN",              value: "Lite"  },
    ],
    engagePrediction: { email: "05:30 PM (12:00 UTC)", whatsapp: "08:30 PM (15:00 UTC)", rcs: "—", push: "07:30 AM (02:00 UTC)", sms: "11:30 AM (06:00 UTC)" },
    buyerTags: { weekendShopper: true, fullPriceAverse: false, bargainHunter: false, valueSeeker: true, highValueShopper: false, gender: "Female", preferredCategory: "Home Decor", rtoRisk: "Low", discountAffinity: "Medium" },
    lifecycle: { firstSeen: "07 Apr 2025, 02:00:00 pm", lastSeen: "08 Jun 2026, 02:54 pm" },
    events: makeEvents("Priyanka"),
  },
  {
    id: "u9", name: "Yash Bansal",    initials: "YB", color: "#64748B",
    firstName: "Yash",       lastName: "Bansal",
    whatsappUsername: "@yash.bansal", email: "yash.b@example.com",
    mobile: "+91 10987 65432", mobileEnc: "****65432",
    engageId: "ENG-10009", audienceType: "Known User",
    gender: "Male", birthDate: "05 May 1996", anniversary: "—",
    lastActive: "Yesterday", totalSessions: "11", ltv: "₹4,210",
    channels: ["whatsapp"],
    reachability: { webPush: "not_subscribed", mobilePush: "subscribed", inapp: "not_subscribed", email: "not_subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "not_subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "false" },
      { name: "Gharsoap_popup_dismissed", value: "true"  },
    ],
    engagePrediction: { email: "—", whatsapp: "06:30 PM (13:00 UTC)", rcs: "—", push: "09:30 AM (04:00 UTC)", sms: "01:00 PM (07:30 UTC)" },
    buyerTags: { weekendShopper: false, fullPriceAverse: false, bargainHunter: true, valueSeeker: true, highValueShopper: false, gender: "Male", preferredCategory: "Footwear", rtoRisk: "Medium", discountAffinity: "High" },
    lifecycle: { firstSeen: "29 Jul 2025, 07:00:00 pm", lastSeen: "07 Jun 2026, 11:20 am" },
    events: makeEvents("Yash"),
  },
  {
    id: "u10", name: "Nikita Verma",  initials: "NV", color: "#8B5CF6",
    firstName: "Nikita",     lastName: "Verma",
    whatsappUsername: "@nikita.verma", email: "nikita.v@example.com",
    mobile: "+91 09876 54321", mobileEnc: "****54321",
    engageId: "ENG-10010", audienceType: "Fastrr Identified",
    gender: "Female", birthDate: "18 Jan 1989", anniversary: "25 Dec 2017",
    lastActive: "2 d ago", totalSessions: "34", ltv: "₹17,300",
    channels: ["email", "whatsapp"],
    reachability: { webPush: "subscribed", mobilePush: "subscribed", inapp: "subscribed", email: "subscribed", sms: "subscribed", whatsapp: "subscribed", rcs: "subscribed", call: "not_subscribed" },
    trackedAttrs: [
      { name: "Gharsoap_popup_clicked",   value: "true"  },
      { name: "Gharsoap_popup_dismissed", value: "false" },
      { name: "GROSS_REVENUE",            value: "14200" },
      { name: "ACTIVE_PLAN",              value: "Pro"   },
    ],
    engagePrediction: { email: "04:30 PM (11:00 UTC)", whatsapp: "07:30 PM (14:00 UTC)", rcs: "06:30 PM (13:00 UTC)", push: "08:30 AM (03:00 UTC)", sms: "10:30 AM (05:00 UTC)" },
    buyerTags: { weekendShopper: true, fullPriceAverse: false, bargainHunter: false, valueSeeker: false, highValueShopper: true, gender: "Female", preferredCategory: "Clothing", rtoRisk: "Low", discountAffinity: "Low" },
    lifecycle: { firstSeen: "10 Nov 2024, 05:15:00 pm", lastSeen: "06 Jun 2026, 03:40 pm" },
    events: makeEvents("Nikita"),
  },
];

const FILTERS = ["All users", "Identified", "VIPs", "Active 30d", "Cart abandoners", "New signups"];

export default function AudiencePage() {
  const [activeFilter,  setActiveFilter]  = useState("All users");
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");

  const filteredUsers = USERS.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.mobile.includes(q)
    );
  });

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-audience">
      <PreviewHeader
        title="Audience"
        subtitle="Your unified customer view, across every channel and touchpoint."
        testIdPrefix="audience"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              data-testid="audience-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, phone..."
              className="pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-surface w-[300px] focus:outline-none focus:border-primary/60"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => <KpiTile key={k.testId} {...k} />)}
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar" data-testid="audience-filters">
        <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            data-testid={`audience-filter-${f.toLowerCase().replace(/\s+/g, "-")}`}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border whitespace-nowrap transition-colors ${
              activeFilter === f
                ? "border-primary text-primary bg-primary-tint"
                : "border-border text-text-secondary hover:border-text-muted/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="audience-table">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Last seen</th>
              <th className="px-4 py-2 font-medium">Channels</th>
              <th className="px-4 py-2 font-medium">LTV</th>
              <th className="px-4 py-2 font-medium hidden sm:table-cell">Audience Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.id}
                data-testid={`audience-row-${u.id}`}
                onClick={() => setSelectedUser(u)}
                className={`border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer ${
                  selectedUser?.id === u.id ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-text-primary text-[13px]">{u.name}</div>
                      <div className="text-[11px] text-text-muted truncate">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{u.lastActive}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {u.channels.map((c) => <ChannelChip key={c} channel={c} />)}
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold text-text-primary tabular-nums">{u.ltv}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span
                    className="text-[10px] font-medium rounded-full px-2 py-0.5 whitespace-nowrap"
                    style={
                      u.audienceType === "Fastrr Identified"
                        ? { backgroundColor: "#EDE9FF", color: "#6C3AE8" }
                        : { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
                    }
                  >
                    {u.audienceType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserProfileDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
