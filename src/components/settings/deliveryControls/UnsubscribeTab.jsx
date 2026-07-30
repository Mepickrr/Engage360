import React, { useState } from "react";
import { X, MessageCircle, Info } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "./SaveBar";
import {
  DEFAULT_SUBSCRIBE_KEYWORDS,
  DEFAULT_UNSUBSCRIBE_KEYWORDS,
  DEFAULT_SUBSCRIBE_REPLY,
  DEFAULT_UNSUBSCRIBE_REPLY,
} from "./constants";

function ToggleSwitch({ checked, onChange, testId }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

function KeywordChipInput({ testIdPrefix, value, onChange }) {
  const [text, setText] = useState("");

  function commit(raw) {
    const trimmed = raw.trim();
    if (!trimmed || value.includes(trimmed)) {
      setText("");
      return;
    }
    onChange([...value, trimmed]);
    setText("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border border-border rounded-md bg-white">
      {value.map((v) => (
        <span
          key={v}
          data-testid={`${testIdPrefix}-chip-${v}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-sm text-text-primary bg-slate-50"
        >
          {v}
          <button
            type="button"
            data-testid={`${testIdPrefix}-remove-${v}`}
            onClick={() => onChange(value.filter((k) => k !== v))}
            aria-label={`Remove ${v}`}
            className="text-text-muted hover:text-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        data-testid={`${testIdPrefix}-input`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
          }
        }}
        placeholder="Type and press Enter"
        className="flex-1 min-w-[140px] py-1 text-sm outline-none placeholder:text-text-muted"
      />
    </div>
  );
}

const INITIAL_STATE = {
  subscribeKeywords: DEFAULT_SUBSCRIBE_KEYWORDS,
  unsubscribeKeywords: DEFAULT_UNSUBSCRIBE_KEYWORDS,
  autoReplyEnabled: true,
  subscribeReply: DEFAULT_SUBSCRIBE_REPLY,
  unsubscribeReply: DEFAULT_UNSUBSCRIBE_REPLY,
  applyAcrossAccounts: false,
};

export default function UnsubscribeTab() {
  const [state, setState] = useState(INITIAL_STATE);
  const [baseline, setBaseline] = useState(INITIAL_STATE);
  const dirty = state !== baseline;

  function patch(fields) {
    setState((prev) => ({ ...prev, ...fields }));
  }

  function handleDiscard() {
    setState(baseline);
  }

  function handleSave() {
    previewToast();
    setBaseline(state);
  }

  return (
    <div data-testid="delivery-unsubscribe" className="space-y-4">
      <SaveBar
        title="WhatsApp Unsubscribe Setup"
        subtitle="Manage opt-in/opt-out keywords and automated responses for your WhatsApp contacts"
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        discardLabel="Cancel"
        testIdPrefix="unsubscribe"
      />

      <section className="bg-surface border border-border rounded-lg p-5" data-testid="unsubscribe-keyword-config">
        <h3 className="text-base font-bold text-text-primary mb-4">Keyword Configuration</h3>

        <div className="mb-4">
          <p className="text-sm font-semibold text-text-primary">Subscribe Keywords</p>
          <p className="text-[12px] text-text-secondary mb-2">
            Automatically assign an agent to handle incoming comments on your posts
          </p>
          <KeywordChipInput
            testIdPrefix="unsubscribe-subscribe-keywords"
            value={state.subscribeKeywords}
            onChange={(v) => patch({ subscribeKeywords: v })}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-text-primary">Unsubscribe Keywords</p>
          <p className="text-[12px] text-text-secondary mb-2">
            Automatically assign an agent to handle incoming comments on your posts
          </p>
          <KeywordChipInput
            testIdPrefix="unsubscribe-unsubscribe-keywords"
            value={state.unsubscribeKeywords}
            onChange={(v) => patch({ unsubscribeKeywords: v })}
          />
        </div>
      </section>

      <section className="bg-surface border border-border rounded-lg p-5" data-testid="unsubscribe-automated-responses">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary">Automated Responses</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Enable Auto-Reply</span>
            <ToggleSwitch
              checked={state.autoReplyEnabled}
              onChange={(v) => patch({ autoReplyEnabled: v })}
              testId="unsubscribe-autoreply-toggle"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Reply on Subscribe</p>
            <textarea
              rows={4}
              disabled={!state.autoReplyEnabled}
              value={state.subscribeReply}
              onChange={(e) => patch({ subscribeReply: e.target.value })}
              data-testid="unsubscribe-subscribe-reply"
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white disabled:bg-slate-50 disabled:text-text-muted disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Reply on Unsubscribe</p>
            <textarea
              rows={4}
              disabled={!state.autoReplyEnabled}
              value={state.unsubscribeReply}
              onChange={(e) => patch({ unsubscribeReply: e.target.value })}
              data-testid="unsubscribe-unsubscribe-reply"
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white disabled:bg-slate-50 disabled:text-text-muted disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-lg p-5" data-testid="unsubscribe-apply-across-accounts">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4.5 h-4.5 text-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-primary">Apply across all linked WhatsApp accounts</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-lime-100 text-lime-700">
                  NEW
                </span>
              </div>
              <p className="text-[12px] text-text-secondary mt-1 max-w-2xl">
                When a customer or your team <span className="font-semibold text-text-primary">unsubscribes</span> —
                or <span className="font-semibold text-text-primary">resubscribes</span> — a contact on one of your
                WhatsApp numbers, the same action will be applied{" "}
                <span className="font-semibold text-text-primary">across all your linked WhatsApp accounts</span>.
                This covers customer keywords (e.g. STOP, START) and manual unsubscribes from the dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-text-secondary">{state.applyAcrossAccounts ? "On" : "Off"}</span>
            <ToggleSwitch
              checked={state.applyAcrossAccounts}
              onChange={(v) => patch({ applyAcrossAccounts: v })}
              testId="unsubscribe-apply-across-toggle"
            />
          </div>
        </div>

        {state.applyAcrossAccounts && (
          <div className="mt-4 flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-md p-3" data-testid="unsubscribe-shared-info">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-primary">This setting is shared across all your linked WhatsApp accounts.</p>
          </div>
        )}

        <p className="text-[12px] text-text-muted mt-3">
          Applies to future events only — past unsubscribes and resubscribes are not retroactively applied across
          accounts.
        </p>
      </section>
    </div>
  );
}
