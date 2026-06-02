import React from "react";
import { Sparkles, Mail, MessageCircle, MessageSquare, Bell } from "lucide-react";

const CHANNEL_ICONS = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageSquare,
  push: Bell,
};

function WhatsAppMock({ variant }) {
  return (
    <div className="bg-[#E5DDD5] rounded-lg p-3">
      <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[85%]">
        <div className="text-[13px] text-slate-800 whitespace-pre-wrap">
          {variant.body}
        </div>
        {variant.cta && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              className="text-[12px] text-emerald-600 font-medium"
            >
              ▸ {variant.cta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailMock({ variant }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {variant.subject && (
        <div className="border-b border-slate-200 px-3 py-2 bg-slate-50">
          <div className="text-[10px] uppercase tracking-wide text-text-muted">
            Subject
          </div>
          <div className="text-[13px] font-semibold text-text-primary">
            {variant.subject}
          </div>
        </div>
      )}
      <div className="px-3 py-2.5 text-[13px] text-slate-800 whitespace-pre-wrap">
        {variant.body}
      </div>
      {variant.cta && (
        <div className="px-3 pb-3">
          <button
            type="button"
            className="text-[12px] font-medium px-3 py-1.5 bg-primary text-white rounded-md"
          >
            {variant.cta}
          </button>
        </div>
      )}
    </div>
  );
}

function GenericMock({ variant }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-[13px] text-slate-800 whitespace-pre-wrap">
        {variant.body}
      </div>
      {variant.cta && (
        <div className="mt-2 text-[12px] text-primary font-medium">
          → {variant.cta}
        </div>
      )}
    </div>
  );
}

export default function CreativePreview({ payload, onUse, onRegenerate }) {
  if (!payload) return null;
  const Icon = CHANNEL_ICONS[payload.channel] || Sparkles;

  return (
    <div className="flex flex-col h-full" data-testid="creative-preview">
      <div className="px-5 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-pink-500" />
          <h3 className="text-[16px] font-semibold text-text-primary">
            Creative variants
          </h3>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-text-secondary capitalize">
            <Icon className="w-3 h-3" />
            {payload.channel}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {(payload.variants || []).map((variant, i) => {
          let Mock = GenericMock;
          if (payload.channel === "whatsapp") Mock = WhatsAppMock;
          else if (payload.channel === "email") Mock = EmailMock;
          return (
            <div
              key={variant.id || i}
              data-testid={`creative-variant-${variant.id || i}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
                  Variant {i + 1}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    data-testid={`creative-use-${i}`}
                    onClick={() => onUse?.(variant)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-primary text-white hover:bg-primary-hover"
                  >
                    Use this
                  </button>
                  <button
                    type="button"
                    data-testid={`creative-regen-${i}`}
                    onClick={() => onRegenerate?.(variant)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-border text-text-secondary hover:bg-slate-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <Mock variant={variant} />
              {variant.rationale && (
                <div className="mt-1.5 text-[11px] text-text-muted italic">
                  {variant.rationale}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
