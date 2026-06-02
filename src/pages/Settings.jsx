import React, { useState } from "react";
import PreviewHeader, { previewToast } from "@/components/common/PreviewHeader";
import {
  User,
  Plug,
  CreditCard,
  UsersRound,
  BellRing,
  KeyRound,
  Mail,
  MessageCircle,
  MessageSquare,
  Bell,
  Smartphone,
  ShoppingBag,
} from "lucide-react";

const SUB_NAV = [
  { id: "account", label: "Account", Icon: User },
  { id: "channels", label: "Channels", Icon: Plug },
  { id: "billing", label: "Billing", Icon: CreditCard },
  { id: "team", label: "Team", Icon: UsersRound },
  { id: "notifications", label: "Notifications", Icon: BellRing },
  { id: "api", label: "API Keys", Icon: KeyRound },
];

function Field({ label, value, disabled = true, testId }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{label}</span>
      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        data-testid={testId}
        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed"
      />
    </label>
  );
}

function AccountPanel() {
  return (
    <div className="space-y-4 max-w-2xl" data-testid="settings-account">
      <h2 className="text-base font-semibold text-text-primary">Account</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name" value="Himanshu Kumar" testId="settings-name" />
        <Field label="Email" value="himanshu@tspkarix.com" testId="settings-email" />
        <Field label="Tenant" value="TSPKARIX" testId="settings-tenant" />
        <Field label="Timezone" value="Asia/Kolkata" testId="settings-tz" />
        <Field label="Language" value="English (en-IN)" testId="settings-lang" />
        <Field label="Currency" value="INR (₹)" testId="settings-currency" />
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={() => previewToast()}
          data-testid="settings-save"
          className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

const CHANNELS = [
  { id: "whatsapp", name: "WhatsApp Business", Icon: MessageCircle, color: "#10B981", status: "Connected" },
  { id: "email", name: "Email (SendGrid)", Icon: Mail, color: "#3B82F6", status: "Connected" },
  { id: "sms", name: "SMS (Twilio)", Icon: MessageSquare, color: "#8B5CF6", status: "Connected" },
  { id: "push", name: "Mobile Push (FCM)", Icon: Bell, color: "#F59E0B", status: "Not connected" },
  { id: "inapp", name: "In-app", Icon: Smartphone, color: "#14B8A6", status: "Connected" },
  { id: "shopify", name: "Shopify", Icon: ShoppingBag, color: "#6366F1", status: "Connected" },
];

function ChannelsPanel() {
  return (
    <div data-testid="settings-channels">
      <h2 className="text-base font-semibold text-text-primary mb-3">Channels</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CHANNELS.map((c) => {
          const Icon = c.Icon;
          const connected = c.status === "Connected";
          return (
            <div
              key={c.id}
              data-testid={`settings-channel-${c.id}`}
              className="bg-surface border border-border rounded-lg p-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${c.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-text-primary truncate">{c.name}</div>
                <div className={`text-[11px] mt-0.5 inline-flex items-center gap-1 ${connected ? "text-emerald-700" : "text-text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {c.status}
                </div>
              </div>
              <button
                type="button"
                onClick={() => previewToast()}
                data-testid={`settings-channel-${c.id}-btn`}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${
                  connected
                    ? "border border-border text-text-secondary hover:bg-slate-50"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {connected ? "Manage" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INVOICES = [
  { id: "INV-2026-005", period: "May 2026", amount: "₹24,800", status: "Paid", date: "May 1" },
  { id: "INV-2026-004", period: "Apr 2026", amount: "₹22,400", status: "Paid", date: "Apr 1" },
  { id: "INV-2026-003", period: "Mar 2026", amount: "₹22,400", status: "Paid", date: "Mar 1" },
  { id: "INV-2026-002", period: "Feb 2026", amount: "₹19,200", status: "Paid", date: "Feb 1" },
];

function BillingPanel() {
  return (
    <div data-testid="settings-billing">
      <h2 className="text-base font-semibold text-text-primary mb-3">Billing</h2>
      <div className="bg-gradient-to-br from-primary to-[#8B5CF6] text-white rounded-lg p-5 mb-4">
        <div className="text-[11px] uppercase tracking-wide opacity-80">Current plan</div>
        <div className="text-2xl font-semibold mt-1">Growth · ₹24,800 / month</div>
        <div className="text-[12px] mt-2 opacity-90">Includes 200K messages, unlimited flows, all channels, 5 seats.</div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => previewToast()}
            data-testid="settings-upgrade"
            className="px-3 py-1.5 rounded-md bg-white text-primary text-[12px] font-semibold hover:bg-white/95"
          >
            Upgrade
          </button>
          <button
            type="button"
            onClick={() => previewToast()}
            data-testid="settings-invoice-method"
            className="px-3 py-1.5 rounded-md bg-white/15 backdrop-blur text-white text-[12px] font-medium hover:bg-white/25"
          >
            Manage payment method
          </button>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Invoice</th>
              <th className="px-4 py-2 font-medium">Period</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="border-t border-border" data-testid={`settings-invoice-${inv.id}`}>
                <td className="px-4 py-3 font-mono text-[12px] text-text-primary">{inv.id}</td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{inv.period}</td>
                <td className="px-4 py-3 text-[13px] font-semibold text-text-primary">{inv.amount}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-text-muted">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TEAMMATES = [
  { id: "t1", name: "Himanshu Kumar", email: "himanshu@tspkarix.com", role: "Owner", initials: "HK", color: "#6C3AE8" },
  { id: "t2", name: "Riya Sharma", email: "riya@tspkarix.com", role: "Admin", initials: "RS", color: "#EC4899" },
  { id: "t3", name: "Arjun Patel", email: "arjun@tspkarix.com", role: "Editor", initials: "AP", color: "#10B981" },
];

function TeamPanel() {
  return (
    <div data-testid="settings-team">
      <h2 className="text-base font-semibold text-text-primary mb-3">Team</h2>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Teammate</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {TEAMMATES.map((t) => (
              <tr key={t.id} className="border-t border-border" data-testid={`settings-team-${t.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initials}
                    </div>
                    <span className="font-semibold text-text-primary text-[13px]">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{t.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-tint text-primary">
                    {t.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => previewToast()}
        data-testid="settings-invite-teammate"
        className="mt-3 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
      >
        Invite teammate
      </button>
    </div>
  );
}

function NotificationsPanel() {
  const items = [
    { id: "n1", label: "Daily digest email", value: true },
    { id: "n2", label: "Task awaiting approval", value: true },
    { id: "n3", label: "Flow performance drops", value: true },
    { id: "n4", label: "Weekly performance report", value: false },
    { id: "n5", label: "Channel delivery failures", value: true },
  ];
  return (
    <div data-testid="settings-notifications">
      <h2 className="text-base font-semibold text-text-primary mb-3">Notifications</h2>
      <div className="bg-surface border border-border rounded-lg divide-y divide-border">
        {items.map((n) => (
          <div key={n.id} className="px-4 py-3 flex items-center justify-between" data-testid={`settings-notif-${n.id}`}>
            <span className="text-[13px] text-text-primary">{n.label}</span>
            <button
              type="button"
              onClick={() => previewToast()}
              className={`relative w-10 h-5 rounded-full transition-colors ${n.value ? "bg-primary" : "bg-slate-300"}`}
              aria-label={n.label}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  n.value ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiPanel() {
  return (
    <div data-testid="settings-api">
      <h2 className="text-base font-semibold text-text-primary mb-3">API Keys</h2>
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Production key</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-[12px] font-mono bg-slate-50 border border-border rounded-md text-text-secondary truncate">
              sk_prod_tspk_••••••••••••••••••••mFq3
            </code>
            <button
              type="button"
              onClick={() => previewToast()}
              data-testid="settings-api-rotate"
              className="px-3 py-2 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
            >
              Rotate
            </button>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1">Sandbox key</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-[12px] font-mono bg-slate-50 border border-border rounded-md text-text-secondary truncate">
              sk_sandbox_tspk_••••••••••••••••••••aZ91
            </code>
            <button
              type="button"
              onClick={() => previewToast()}
              data-testid="settings-api-copy"
              className="px-3 py-2 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const PANELS = {
  account: AccountPanel,
  channels: ChannelsPanel,
  billing: BillingPanel,
  team: TeamPanel,
  notifications: NotificationsPanel,
  api: ApiPanel,
};

export default function SettingsPage() {
  const [active, setActive] = useState("account");
  const Panel = PANELS[active] || AccountPanel;

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-settings">
      <PreviewHeader title="Settings" subtitle="Workspace, team, integrations, and credentials." testIdPrefix="settings" />

      <div className="flex gap-6">
        <nav
          className="w-[200px] flex-shrink-0 bg-surface border border-border rounded-lg p-1.5 h-fit"
          data-testid="settings-nav"
        >
          {SUB_NAV.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                data-testid={`settings-nav-${id}`}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-left transition-colors ${
                  isActive
                    ? "bg-primary-tint text-primary font-semibold"
                    : "text-text-secondary hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          <div className="route-fade-in" key={active}>
            <Panel />
          </div>
        </div>
      </div>
    </div>
  );
}
