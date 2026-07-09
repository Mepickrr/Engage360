import React, { useState } from "react";
import { WABA_NUMBERS } from "@/components/flows/builder/nodes/WhatsAppNode/data/mockTemplates";
import { FallbackTemplateSection } from "@/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel";
import BroadcastSourceStep1 from "@/components/flows/builder/trigger/BroadcastSourceStep1";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

const WABA_QUALITY_META = {
  waba_1: { quality: "Green", limit: "Unlimited" },
  waba_2: { quality: "Yellow", limit: "1,000/day" },
  waba_3: { quality: "Red", limit: "Paused" },
};

const SUPPRESSION_LISTS = [
  { id: "wa_default", label: "WhatsApp suppression list (128)" },
  { id: "none", label: "None" },
];

function resolveAudienceCount(sourceType, config) {
  if (sourceType === "csv") {
    return (config.selectedHistoricalCsvs || []).reduce((a, c) => a + c.rowCount, 0);
  }
  return (config.selectedSegments || []).reduce((a, s) => a + s.userCount, 0);
}

export default function WhatsAppBroadcastDetails({ step }) {
  const updateStepChannelConfig = useCampaignBuilderStore((s) => s.updateStepChannelConfig);
  const updateStepAudience = useCampaignBuilderStore((s) => s.updateStepAudience);
  const [sourceType, setSourceType] = useState(step.audience?.sourceType || "segment");

  const cc = step.channel_config || {};
  const patch = (p) => updateStepChannelConfig(step.id, p);

  const audienceConfig = step.audience?.broadcastSourceConfig || {};
  const setAudienceConfig = (updater) => {
    const nextConfig = typeof updater === "function" ? updater(audienceConfig) : updater;
    updateStepAudience(step.id, { sourceType, broadcastSourceConfig: nextConfig });
  };

  const resolvedCount = resolveAudienceCount(sourceType, audienceConfig);

  return (
    <div data-testid="whatsapp-broadcast-details" className="space-y-6">
      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">Sender Number</label>
        <select
          data-testid="sender-number-select"
          value={cc.wabaNumberId || ""}
          onChange={(e) => patch({ wabaNumberId: e.target.value })}
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        >
          <option value="" disabled>Select a phone number</option>
          {WABA_NUMBERS.map((n) => (
            <option key={n.id} value={n.id} disabled={n.status === "inactive"}>
              {n.nickname} · ····{n.number.slice(-4)}
            </option>
          ))}
        </select>
        {cc.wabaNumberId && (
          <div
            data-testid="quality-limit-strip"
            className="mt-2 flex items-center gap-4 text-[12px] bg-blue-50 border border-blue-100 rounded-md px-3 py-2"
          >
            <span>Quality Rating: <strong>{WABA_QUALITY_META[cc.wabaNumberId]?.quality || "—"}</strong></span>
            <span>Messaging Limit: <strong>{WABA_QUALITY_META[cc.wabaNumberId]?.limit || "—"}</strong></span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">Template</label>
        <div className="text-[13px]" data-testid="template-summary">
          {cc.template ? cc.template.name : (
            <span className="text-amber-700 font-medium">NO TEMPLATE SELECTED — choose from the right panel</span>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[12px] font-medium text-text-secondary">Send To</label>
          {resolvedCount > 0 && (
            <span className="text-[12px] text-text-secondary" data-testid="resolved-audience-count">
              ~{resolvedCount.toLocaleString("en-IN")} users
            </span>
          )}
        </div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            data-testid="source-type-segment"
            onClick={() => setSourceType("segment")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border ${sourceType === "segment" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"}`}
          >
            Use Segment
          </button>
          <button
            type="button"
            data-testid="source-type-csv"
            onClick={() => setSourceType("csv")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border ${sourceType === "csv" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"}`}
          >
            Upload CSV
          </button>
        </div>
        <BroadcastSourceStep1 sourceType={sourceType} config={audienceConfig} setConfig={setAudienceConfig} />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-text-secondary mb-1">Don&apos;t Send To</label>
        <select
          data-testid="suppression-list-select"
          value={cc.suppressionList || "wa_default"}
          onChange={(e) => patch({ suppressionList: e.target.value })}
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        >
          {SUPPRESSION_LISTS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary mb-2">
          <input
            type="checkbox"
            data-testid="utm-enabled-toggle"
            checked={!!cc.utm?.enabled}
            onChange={(e) => patch({ utm: { ...cc.utm, enabled: e.target.checked } })}
            className="accent-primary"
          />
          Add UTM Tracking
        </label>
        {cc.utm?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">UTM Source</label>
              <input
                type="text"
                data-testid="utm-source-field"
                value={cc.utm?.source || ""}
                onChange={(e) => patch({ utm: { ...cc.utm, source: e.target.value } })}
                placeholder="UTM Source"
                className="w-full border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">UTM Medium</label>
              <input
                type="text"
                data-testid="utm-medium-field"
                value={cc.utm?.medium || ""}
                onChange={(e) => patch({ utm: { ...cc.utm, medium: e.target.value } })}
                placeholder="UTM Medium"
                className="w-full border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] text-text-muted mb-1">UTM Campaign</label>
              <input
                type="text"
                data-testid="utm-campaign-field"
                value={cc.utm?.campaign || ""}
                onChange={(e) => patch({ utm: { ...cc.utm, campaign: e.target.value } })}
                placeholder="UTM Campaign"
                className="w-full border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center justify-between text-[13px] font-medium text-text-primary">
          AI Smart Send
          <input
            type="checkbox"
            data-testid="ai-smart-send-toggle"
            checked={!!cc.aiSmartSend}
            onChange={(e) => patch({ aiSmartSend: e.target.checked })}
            className="accent-primary"
          />
        </label>
        <p className="text-[11px] text-text-muted mt-1">
          AI Smart sender boosts broadcast deliverability and revenue by retrying sends to unreached recipients on the best send time behaviour. Set the time window for reattempting delivery.
        </p>
      </div>

      <div>
        <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-2">
          Smart Retry
          <input
            type="checkbox"
            data-testid="smart-retry-toggle"
            checked={!!cc.campaignSmartRetry?.enabled}
            onChange={(e) => patch({ campaignSmartRetry: { ...cc.campaignSmartRetry, enabled: e.target.checked } })}
            className="accent-primary"
          />
        </label>
        {cc.campaignSmartRetry?.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={72}
              data-testid="smart-retry-window"
              value={cc.campaignSmartRetry?.windowHours ?? 72}
              onChange={(e) =>
                patch({ campaignSmartRetry: { ...cc.campaignSmartRetry, windowHours: Math.min(72, Number(e.target.value)) } })
              }
              className="w-20 border border-border rounded-md px-2 py-1.5 text-sm"
            />
            <span className="text-[12px] text-text-muted">hours (max 72)</span>
          </div>
        )}
      </div>

      {cc.template && (
        <div>
          <FallbackTemplateSection data={cc} patch={patch} />
          <p className="text-[11px] text-text-muted mt-1">
            Meta pauses deliverability of templates after a certain point to enhance user experience. Choose a fallback template to send when the primary template delivery is paused.
          </p>
          {cc.fallback?.enabled && (
            <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mt-2">
              Fallback Template Category Change
              <input
                type="checkbox"
                data-testid="fallback-category-change-toggle"
                checked={!!cc.fallback?.categoryChangeEnabled}
                onChange={(e) => patch({ fallback: { ...cc.fallback, categoryChangeEnabled: e.target.checked } })}
                className="accent-primary"
              />
            </label>
          )}
        </div>
      )}

      <div>
        <label className="flex items-center justify-between text-[13px] font-medium text-text-primary">
          Enable International Audience
          <input
            type="checkbox"
            data-testid="international-audience-toggle"
            checked={!!cc.internationalAudience}
            onChange={(e) => patch({ internationalAudience: e.target.checked })}
            className="accent-primary"
          />
        </label>
        <p className="text-[11px] text-text-muted mt-1">
          Send your campaign on international audience, when disabled only the Indian audience will be attempted.
        </p>
      </div>

      <div>
        <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-2">
          Set Validity Window
          <input
            type="checkbox"
            data-testid="validity-window-custom-toggle"
            checked={!!cc.validityWindow?.custom}
            onChange={(e) => patch({ validityWindow: { ...cc.validityWindow, custom: e.target.checked } })}
            className="accent-primary"
          />
        </label>
        {cc.validityWindow?.custom ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              data-testid="validity-window-minutes"
              value={cc.validityWindow?.minutes ?? 10}
              onChange={(e) => patch({ validityWindow: { ...cc.validityWindow, minutes: Number(e.target.value) } })}
              className="w-20 border border-border rounded-md px-2 py-1.5 text-sm"
            />
            <span className="text-[12px] text-text-muted">minutes</span>
          </div>
        ) : (
          <p className="text-[12px] text-text-muted">Standard 10-minute WhatsApp message validity period applies.</p>
        )}
      </div>

      <div className="text-[12px] text-text-secondary" data-testid="pricing-view">
        Estimated cost: ₹1.5 × {resolvedCount.toLocaleString("en-IN")} = ₹{(1.5 * resolvedCount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}
