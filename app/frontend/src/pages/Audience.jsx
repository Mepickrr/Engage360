import React, { useState } from "react";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import ChannelChip from "@/components/flows/ChannelChip";
import { Search, Filter } from "lucide-react";

const KPIS = [
  { label: "Total users", value: "45.2K", delta: "+1.2K", testId: "aud-kpi-total" },
  { label: "Identified", value: "32.1K", delta: "+820", testId: "aud-kpi-id" },
  { label: "Anonymous", value: "13.1K", testId: "aud-kpi-anon" },
  { label: "Active 30d", value: "18.9K", delta: "+6.1%", testId: "aud-kpi-active" },
];

const USERS = [
  { id: "u1", name: "Aanya Sharma", email: "aanya.s@example.com", lastSeen: "2 min ago", channels: ["whatsapp", "email"], ltv: "₹14,820", segments: 4, initials: "AS", color: "#10B981" },
  { id: "u2", name: "Rohan Mehta", email: "rohan.m@example.com", lastSeen: "12 min ago", channels: ["whatsapp"], ltv: "₹3,210", segments: 2, initials: "RM", color: "#3B82F6" },
  { id: "u3", name: "Ishaan Kapoor", email: "ishaan@example.com", lastSeen: "1 h ago", channels: ["email", "push"], ltv: "₹9,440", segments: 6, initials: "IK", color: "#8B5CF6" },
  { id: "u4", name: "Sneha Iyer", email: "sneha.i@example.com", lastSeen: "Yesterday", channels: ["whatsapp", "sms"], ltv: "₹22,110", segments: 5, initials: "SI", color: "#EC4899" },
  { id: "u5", name: "Karthik Rao", email: "karthik.r@example.com", lastSeen: "3 d ago", channels: ["email"], ltv: "₹1,820", segments: 1, initials: "KR", color: "#F59E0B" },
  { id: "u6", name: "Meera Pillai", email: "meera.p@example.com", lastSeen: "8 min ago", channels: ["whatsapp", "email", "push"], ltv: "₹31,290", segments: 7, initials: "MP", color: "#14B8A6" },
  { id: "u7", name: "Aditya Singh", email: "aditya.s@example.com", lastSeen: "5 h ago", channels: ["sms"], ltv: "₹612", segments: 1, initials: "AS", color: "#6366F1" },
  { id: "u8", name: "Priyanka Joshi", email: "priyanka.j@example.com", lastSeen: "Just now", channels: ["whatsapp", "email"], ltv: "₹8,940", segments: 3, initials: "PJ", color: "#EF4444" },
  { id: "u9", name: "Yash Bansal", email: "yash.b@example.com", lastSeen: "Yesterday", channels: ["whatsapp"], ltv: "₹4,210", segments: 2, initials: "YB", color: "#64748B" },
  { id: "u10", name: "Nikita Verma", email: "nikita.v@example.com", lastSeen: "2 d ago", channels: ["email", "whatsapp"], ltv: "₹17,300", segments: 5, initials: "NV", color: "#8B5CF6" },
];

const FILTERS = ["All users", "Identified", "VIPs", "Active 30d", "Cart abandoners", "New signups"];

export default function AudiencePage() {
  const [activeFilter, setActiveFilter] = useState("All users");

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
              placeholder="Search users by name, email, phone..."
              onChange={() => {}}
              className="pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-surface w-[300px] focus:outline-none focus:border-primary/60"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
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
              <th className="px-4 py-2 font-medium">Segments</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => (
              <tr
                key={u.id}
                data-testid={`audience-row-${u.id}`}
                onClick={() => previewToast()}
                className="border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer"
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
                <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{u.lastSeen}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {u.channels.map((c) => (
                      <ChannelChip key={c} channel={c} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold text-text-primary tabular-nums">{u.ltv}</td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{u.segments} segments</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
