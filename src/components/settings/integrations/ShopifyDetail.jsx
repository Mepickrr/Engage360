import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiTile, previewToast } from "@/components/common/PreviewHeader";

function DisabledField({ label, value, testId }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{label}</span>
      <input
        type="text"
        defaultValue={value}
        disabled
        data-testid={testId}
        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed"
      />
    </label>
  );
}

function ToggleSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-label={label}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function ShopifyDetail({ store, onBack, onUpdate }) {
  const [shortCode, setShortCode] = useState("");
  const [trackerEnabled, setTrackerEnabled] = useState(store.websiteEventsTrackerEnabled);

  const handleTrackerToggle = (next) => {
    setTrackerEnabled(next);
    onUpdate({ websiteEventsTrackerEnabled: next });
  };

  const handleSaveShortCode = () => onUpdate({ shortCode });

  const initials = store.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div data-testid="shopify-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="shopify-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-sm">🛍️</span>
          <span className="text-sm font-semibold text-text-primary">Shopify</span>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" data-testid="shopify-tab-details">Details</TabsTrigger>
          <TabsTrigger value="others" data-testid="shopify-tab-others">Others</TabsTrigger>
        </TabsList>

        <TabsContent value="details" data-testid="shopify-details-panel">
          <div className="flex gap-4 mt-2">
            <div className="flex-1 bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-text-secondary">
                  {initials}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-text-primary">{store.name}</div>
                  <a href={store.domain} target="_blank" rel="noreferrer" data-testid="shopify-domain-link" className="text-[12px] text-primary">{store.domain}</a>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] text-text-primary">Webhook connection status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">{store.webhookStatus}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <KpiTile label="Customer" value={store.customers.toLocaleString("en-US")} testId="shopify-kpi-customers" />
                <KpiTile label="Orders" value={store.orders.toLocaleString("en-US")} testId="shopify-kpi-orders" />
                <KpiTile label="Products" value={store.products.toLocaleString("en-US")} testId="shopify-kpi-products" />
              </div>
            </div>
            <div className="w-64 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
              Bik's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="others" data-testid="shopify-others-panel">
          <div className="max-w-xl space-y-4 mt-2">
            <DisabledField label="Store name" value={store.name} testId="shopify-others-name" />
            <DisabledField label="Store domain" value={store.domain} testId="shopify-others-domain" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Short code</span>
                <span className="text-[11px] text-text-muted">{shortCode.length}/7</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={shortCode}
                  maxLength={7}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="eg: BIK-UK"
                  data-testid="shopify-shortcode-input"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md text-text-primary"
                />
                <button
                  type="button"
                  disabled={shortCode.length === 0}
                  onClick={handleSaveShortCode}
                  data-testid="shopify-shortcode-save"
                  className="px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Use a short code to identify the store</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">Scopes for website events</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px]">✓</span>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-[13px] font-semibold text-text-primary">Enable/Disable website events tracker</span>
                <p className="text-[11px] text-text-muted mt-1">
                  Your website events tracker permissions can also be tied with cookie consent settings. Please{" "}
                  <button type="button" onClick={() => previewToast()} data-testid="shopify-contact-support" className="text-primary underline">contact support</button> for more on this.
                </p>
              </div>
              <ToggleSwitch on={trackerEnabled} onChange={handleTrackerToggle} label="Enable website events tracker" />
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">Scopes for syncing orders beyond 60 days</span>
              <button type="button" onClick={() => previewToast()} data-testid="shopify-request-access" className="text-[13px] text-primary font-medium">Request access</button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
