// src/components/settings/channels/WhatsAppNumberDetail.jsx
import React, { useState } from "react";
import { ArrowLeft, Copy, RefreshCw, UserRound, Camera } from "lucide-react";
import Badge from "./Badge";
import { previewToast } from "@/components/common/PreviewHeader";

function qualityTone(quality) {
  if (quality === "High") return "emerald";
  if (quality === "Medium") return "amber";
  return "rose";
}

function maskedNumber(num) {
  const digits = (num || "").replace(/\D/g, "");
  return `+${digits.slice(0, 2)}${"X".repeat(Math.max(digits.length - 2, 0))}`;
}

function InlineEditableField({ value, onSave, testId, placeholder, as = "text", className = "", inputClassName = "", ariaLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => { onSave(draft.trim()); setEditing(false); };
  const cancel = () => { setDraft((value || "").trim()); setEditing(false); };

  if (editing) {
    if (as === "textarea") {
      return (
        <textarea
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
          rows={2}
          data-testid={`${testId}-input`} className={inputClassName}
        />
      );
    }
    return (
      <input
        type="text" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        data-testid={`${testId}-input`} className={inputClassName}
      />
    );
  }

  return (
    <button
      type="button" onClick={() => { setDraft(value || ""); setEditing(true); }} data-testid={testId}
      aria-label={ariaLabel} className={`${className} cursor-text hover:bg-slate-50 transition-colors`}
    >
      {value || placeholder}
    </button>
  );
}

export default function WhatsAppNumberDetail({ number, onBack, onMakeDefault }) {
  const [businessDescription, setBusinessDescription] = useState(number.businessDescription || "");
  const [about, setAbout] = useState(number.about || "");
  const [brandName, setBrandName] = useState(number.brandName || "");
  const [businessAddress, setBusinessAddress] = useState(number.businessAddress || "");
  const [businessEmail, setBusinessEmail] = useState(number.businessEmail || "");
  const [businessWebsite, setBusinessWebsite] = useState(number.businessWebsite || "");
  const [category, setCategory] = useState(number.category || "Shopping and Retail");
  const [messagesConsumed, setMessagesConsumed] = useState(number.messagesConsumed);
  const [messagingLimit, setMessagingLimit] = useState(number.messagingLimit);
  const [catalogAllowAccess, setCatalogAllowAccess] = useState(number.catalogAllowAccess);
  const [removeOutOfStock, setRemoveOutOfStock] = useState(number.removeOutOfStock);

  const refreshMessagesConsumed = () => setMessagesConsumed(Math.floor(Math.random() * 500));
  const refreshMessagingLimit = () => {
    const tiers = [25000, 50000, 100000];
    setMessagingLimit(tiers[Math.floor(Math.random() * tiers.length)]);
  };

  return (
    <div data-testid="whatsapp-number-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="whatsapp-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-white text-[10px]">✓</div>
          <span className="text-sm font-semibold text-text-primary">Whatsapp</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <UserRound className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold text-text-primary">{number.number}</span>
              <button type="button" onClick={() => navigator.clipboard?.writeText(number.number)} data-testid="whatsapp-copy-number" className="text-text-muted hover:text-text-primary">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {number.username && <span className="text-[13px] text-text-muted">{`@${number.username}`}</span>}
          </div>
        </div>

        <div className="py-3 border-b border-border flex items-center gap-2 flex-wrap" data-testid="whatsapp-summary-row-1">
          <Badge tone="slate">Provider: {number.provider}</Badge>
          <Badge tone={qualityTone(number.quality)}>Quality: {number.quality}</Badge>
          <Badge tone="slate">WABA ID: {number.wabaId}</Badge>
        </div>

        <div className="py-3 border-b border-border mb-4 flex items-center gap-2 flex-wrap justify-between" data-testid="whatsapp-summary-row-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text-primary">Messaging limit:</span>
            <span className="text-[13px] text-text-primary" data-testid="whatsapp-messaging-limit-value">{messagingLimit}</span>
            <span className="text-[12px] text-text-muted">messages per day</span>
            <button type="button" onClick={refreshMessagingLimit} data-testid="whatsapp-messaging-limit-refresh" className="text-text-muted hover:text-text-primary">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {number.isDefaultForCampaigns ? (
              <>
                <Badge tone="emerald">Default for Campaigns</Badge>
                <button type="button" onClick={() => previewToast()} data-testid="whatsapp-migrate-provider"
                  className="px-3 py-1.5 text-[12px] rounded-md border border-primary text-primary font-medium">
                  Migrate provider
                </button>
              </>
            ) : (
              <button type="button" onClick={() => onMakeDefault(number.id)} data-testid="whatsapp-make-default"
                className="px-3 py-1.5 text-[12px] rounded-md bg-primary text-white font-medium">
                Make Default for Campaigns
              </button>
            )}
          </div>
        </div>

        <div className="py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-text-primary">WhatsApp voice call</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">BETA</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">Connect with customers instantly via WhatsApp voice calls in the Helpdesk.</p>
          </div>
          <button type="button" onClick={() => previewToast()} data-testid="whatsapp-voice-call-setup" className="text-[13px] text-primary font-medium flex-shrink-0">Setup</button>
        </div>

        <div className="py-4 border-b border-border flex items-center justify-between" data-testid="whatsapp-messages-consumed">
          <span className="text-[13px] font-semibold text-text-primary">Message consumed</span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-primary" data-testid="whatsapp-messages-consumed-value">{messagesConsumed}</span>
            <span className="text-[12px] text-text-muted">messages consumed</span>
            <button type="button" onClick={refreshMessagesConsumed} data-testid="whatsapp-messages-consumed-refresh" className="text-text-muted hover:text-text-primary">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="py-4 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span className="text-[13px] font-semibold text-text-primary">Account overview</span>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-text-secondary">WhatsApp TSP Onboarding Status - <button type="button" onClick={() => previewToast()} className="text-primary font-medium" data-testid="whatsapp-tsp-view-details">View Details</button></span>
              <span className="text-text-secondary">WhatsApp A/B Testing - <button type="button" onClick={() => previewToast()} className="text-primary font-medium" data-testid="whatsapp-ab-test-now">Test Now</button></span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-800 mb-3">
            Meta enforces daily WhatsApp Business messaging limits for quality, compliance, and tier-based improvements.
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-violet-50 border border-emerald-200 rounded-lg p-3 text-[12px] text-emerald-800 mb-4 flex items-center gap-2">
            Your account is powered by MM Lite API. <span className="text-emerald-600">✓</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Business Portfolio ID", value: number.businessPortfolioId },
              { label: "Phone Number", value: number.number.replace(/\D/g, "") },
            ].map((f) => (
              <div key={f.label} className="flex items-end gap-2">
                <label className="block flex-1">
                  <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{f.label}</span>
                  <input type="text" defaultValue={f.value} disabled data-testid={`whatsapp-field-${f.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
                </label>
                <span className="mb-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">Available</span>
              </div>
            ))}
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">WABA Provider</span>
              <input type="text" defaultValue={number.wabaProvider} disabled data-testid="whatsapp-waba-provider"
                className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
            </label>
          </div>
        </div>

        <div className="mt-6 bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">f</div>
              <span className="text-[13px] font-semibold text-text-primary">Catalog Id:</span>
              <span className="text-[13px] text-text-primary">{number.catalogId}</span>
            </div>
            <a href="https://business.facebook.com/commerce/catalogs" target="_blank" rel="noreferrer" className="text-[12px] text-primary font-medium" data-testid="whatsapp-catalog-manage">Manage ↗</a>
          </div>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={catalogAllowAccess}
              onChange={(e) => setCatalogAllowAccess(e.target.checked)}
              aria-label="Allow customer to access catalog"
              data-testid="whatsapp-catalog-allow-access"
              className="w-4 h-4"
            />
            <span className="text-[12px] text-text-secondary">Allow your customer to access above connected catalog anytime on WhatsApp</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={removeOutOfStock}
              onChange={(e) => setRemoveOutOfStock(e.target.checked)}
              aria-label="Remove Out of Stock products from the catalog"
              data-testid="whatsapp-catalog-remove-oos"
              className="w-4 h-4"
            />
            <span className="text-[12px] text-text-secondary">Remove Out of Stock products from the catalog</span>
          </label>
          <div className="mt-3 bg-violet-50 border border-violet-100 rounded-md p-2 text-[11px] text-violet-700">
            Catalog will be synced regularly at an interval of 24 hours. Any changes made in the catalog will be reflected here after some time.
          </div>
        </div>

        <div className="mt-6 max-w-md mx-auto border-4 border-slate-900 rounded-[2rem] overflow-hidden bg-white" data-testid="whatsapp-big-preview">
          <div className="p-6 text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                <UserRound className="w-9 h-9 text-slate-400" />
              </div>
              <button type="button" onClick={() => previewToast()} data-testid="whatsapp-preview-photo-edit"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <InlineEditableField
              value={brandName} onSave={setBrandName} testId="whatsapp-preview-brand-name"
              placeholder={number.number} className="mt-3 block w-full text-[17px] font-semibold text-text-primary"
              inputClassName="mt-3 block w-full text-[17px] font-semibold text-text-primary text-center border border-border rounded-md px-2 py-1"
              ariaLabel="Edit brand name"
            />
            <div className="mt-1 text-[12px] text-text-muted" data-testid="whatsapp-preview-phone-number">{maskedNumber(number.number)}</div>
            <InlineEditableField
              value={category} onSave={setCategory} testId="whatsapp-preview-category"
              placeholder="Shopping and Retail" className="mt-1 block w-full text-[12px] text-text-muted"
              inputClassName="mt-1 block w-full text-[12px] text-text-muted text-center border border-border rounded-md px-2 py-1"
              ariaLabel="Edit category"
            />
          </div>

          <div className="px-6 py-3 border-t border-slate-100 text-center text-[11px] text-text-muted">
            Official business account
          </div>

          <div className="border-t border-slate-100">
            <InlineEditableField
              value={businessDescription} onSave={setBusinessDescription} as="textarea"
              testId="whatsapp-preview-description" placeholder="Add a business description"
              className="block w-full text-left text-[12px] text-text-primary px-6 py-3 border-b border-slate-100"
              inputClassName="block w-full text-left text-[12px] text-text-primary px-6 py-3 border-b border-slate-100"
              ariaLabel="Edit business description"
            />
            <InlineEditableField
              value={businessAddress} onSave={setBusinessAddress} as="textarea"
              testId="whatsapp-preview-address" placeholder="Add address"
              className="block w-full text-left text-[12px] text-emerald-700 px-6 py-3 border-b border-slate-100"
              inputClassName="block w-full text-left text-[12px] text-emerald-700 px-6 py-3 border-b border-slate-100"
              ariaLabel="Edit business address"
            />
            <InlineEditableField
              value={businessEmail} onSave={setBusinessEmail}
              testId="whatsapp-preview-email" placeholder="Add support email"
              className="block w-full text-left text-[12px] text-emerald-700 px-6 py-3 border-b border-slate-100"
              inputClassName="block w-full text-left text-[12px] text-emerald-700 px-6 py-3 border-b border-slate-100"
              ariaLabel="Edit support email"
            />
            <InlineEditableField
              value={businessWebsite} onSave={setBusinessWebsite}
              testId="whatsapp-preview-website" placeholder="Add website"
              className="block w-full text-left text-[12px] text-emerald-700 px-6 py-3"
              inputClassName="block w-full text-left text-[12px] text-emerald-700 px-6 py-3"
              ariaLabel="Edit website"
            />
          </div>

          <div className="border-t border-slate-100 px-6 py-3 text-left">
            <div className="text-[10px] text-text-muted">About and phone number</div>
            <InlineEditableField
              value={about} onSave={setAbout} testId="whatsapp-preview-about"
              placeholder="Hey there! I am using WhatsApp." className="block w-full text-left text-[12px] text-text-primary"
              inputClassName="block w-full text-left text-[12px] text-text-primary border border-border rounded-md px-2 py-1"
              ariaLabel="Edit about"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
