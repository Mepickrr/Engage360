// src/components/settings/channels/WhatsAppNumberDetail.jsx
import React, { useState } from "react";
import { ArrowLeft, Copy, Pencil, Trash2, Plus, RefreshCw, UserRound, HelpCircle } from "lucide-react";
import Badge from "./Badge";
import { previewToast } from "@/components/common/PreviewHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function qualityTone(quality) {
  if (quality === "High") return "emerald";
  if (quality === "Medium") return "amber";
  return "rose";
}

function maskedNumber(num) {
  const digits = (num || "").replace(/\D/g, "");
  return `+${digits.slice(0, 2)}${"X".repeat(Math.max(digits.length - 2, 0))}`;
}

function EditableRow({ label, description, value, onSave, onDelete, testId, emptyLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  if (editing) {
    return (
      <div className="py-4 border-b border-border" data-testid={testId}>
        <div className="text-[13px] font-semibold text-text-primary mb-1">{label}</div>
        {description && <p className="text-[11px] text-text-muted mb-2">{description}</p>}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          data-testid={`${testId}-input`}
          className="w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary"
        />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => { onSave(draft); setEditing(false); }} data-testid={`${testId}-save`}
            className="px-3 py-1.5 text-[12px] rounded-md bg-primary text-white">Save</button>
          <button type="button" onClick={() => { setDraft(value || ""); setEditing(false); }} data-testid={`${testId}-cancel`}
            className="px-3 py-1.5 text-[12px] rounded-md border border-border text-text-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-border" data-testid={testId}>
      <div className="text-[13px] font-semibold text-text-primary mb-1">{label}</div>
      {description && <p className="text-[11px] text-text-muted mb-2">{description}</p>}
      {value ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-text-primary flex-1">&ldquo;{value}&rdquo;</p>
          <div className="flex gap-1 flex-shrink-0">
            <button type="button" onClick={() => setEditing(true)} data-testid={`${testId}-edit`}
              className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-text-secondary hover:bg-slate-50">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onDelete} data-testid={`${testId}-delete`}
              className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-text-secondary hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} data-testid={`${testId}-add`}
          className="px-3 py-1.5 text-[12px] rounded-md border border-dashed border-border text-text-secondary hover:bg-slate-50 inline-flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> {emptyLabel}
        </button>
      )}
    </div>
  );
}

export default function WhatsAppNumberDetail({ number, onBack, onMakeDefault }) {
  const [businessDescription, setBusinessDescription] = useState(number.businessDescription || "");
  const [about, setAbout] = useState(number.about || "");
  const [businessAddress, setBusinessAddress] = useState(number.businessAddress || "");
  const [businessEmail, setBusinessEmail] = useState(number.businessEmail || "");
  const [businessWebsite, setBusinessWebsite] = useState(number.businessWebsite || "");
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

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge tone="slate">Provider: {number.provider}</Badge>
              <Badge tone={qualityTone(number.quality)}>Quality: {number.quality}</Badge>
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

          <EditableRow
            label="Business description" description="Edit your WhatsApp Business account description."
            value={businessDescription} onSave={setBusinessDescription} onDelete={() => setBusinessDescription("")}
            testId="whatsapp-business-description" emptyLabel="Add description"
          />

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

          <div className="py-4 border-b border-border flex items-center justify-between" data-testid="whatsapp-messaging-limit">
            <span className="text-[13px] font-semibold text-text-primary">Messaging limit</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-primary" data-testid="whatsapp-messaging-limit-value">{messagingLimit}</span>
              <span className="text-[12px] text-text-muted">messages per day</span>
              <button type="button" onClick={refreshMessagingLimit} data-testid="whatsapp-messaging-limit-refresh" className="text-text-muted hover:text-text-primary">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <EditableRow
            label="About" description="Add your about section to be displayed on your whatsapp business profile."
            value={about} onSave={setAbout} onDelete={() => setAbout("")}
            testId="whatsapp-about" emptyLabel="Add about"
          />

          <EditableRow
            label="Business address" description="Edit your business's physical address."
            value={businessAddress} onSave={setBusinessAddress} onDelete={() => setBusinessAddress("")}
            testId="whatsapp-address" emptyLabel="Add address"
          />

          <EditableRow
            label="Email for business contact" description="Edit your business email as an additional point of contact for you customers."
            value={businessEmail} onSave={setBusinessEmail} onDelete={() => setBusinessEmail("")}
            testId="whatsapp-email" emptyLabel="Add email"
          />

          <EditableRow
            label="Business website" description="Edit your business website. You must include the http:// or https:// portion of the URL."
            value={businessWebsite} onSave={setBusinessWebsite} onDelete={() => setBusinessWebsite("")}
            testId="whatsapp-website" emptyLabel="Add website"
          />

          <div className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="text-[13px] font-semibold text-text-primary">WhatsApp Account Overview</span>
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
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Display Name</span>
                <input type="text" defaultValue={number.brandName || number.number} disabled data-testid="whatsapp-display-name"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Messaging Limit</span>
                <input type="text" defaultValue={`${messagingLimit}`} disabled data-testid="whatsapp-overview-limit"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed" />
              </label>
              {[
                { label: "WABA ID", value: number.wabaId },
                { label: "Phone Number", value: number.number.replace(/\D/g, "") },
                { label: "Business Portfolio ID", value: number.businessPortfolioId },
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

            <p className="text-[13px] font-semibold text-text-primary mt-5 mb-3">Following details will be displayed on your WhatsApp Business Account profile.</p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium inline-flex items-center gap-1">
                  Brand Name
                  <TooltipProvider delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="top">The name shown to customers on your WhatsApp Business profile.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <input type="text" defaultValue={number.brandName} data-testid="whatsapp-brand-name"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary" />
              </label>
              <div>
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Brand Logo</span>
                <div className="mt-1 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-slate-400" />
                </div>
              </div>
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
        </div>

        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4 mx-auto border-4 border-slate-900 rounded-[2rem] w-60 overflow-hidden bg-white">
            <div className="p-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-200 flex items-center justify-center">
                <UserRound className="w-7 h-7 text-slate-400" />
              </div>
              <div className="mt-2 text-[13px] font-semibold text-text-primary">{maskedNumber(number.number)}</div>
              <div className="text-[11px] text-text-muted">Shopping and Retail</div>
              <div className="mt-3 text-[11px] text-text-secondary">Official business account</div>
              <div className="mt-3 text-left space-y-1 text-[11px] text-emerald-700">
                {about && <p>{about}</p>}
                {businessAddress && <p data-testid="whatsapp-preview-address">{businessAddress}</p>}
                {businessEmail && <p>{businessEmail}</p>}
                {businessWebsite && <p>{businessWebsite}</p>}
              </div>
            </div>
            <div className="border-t border-border p-3 text-left">
              <div className="text-[10px] text-text-muted">About and phone number</div>
              <div className="text-[12px] text-text-primary">{about || "Hey there! I am using WhatsApp."}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
