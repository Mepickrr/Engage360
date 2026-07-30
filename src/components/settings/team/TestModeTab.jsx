import React, { useState } from "react";
import { X, Info } from "lucide-react";
import {
  DEFAULT_TEST_PHONE_NUMBERS,
  DEFAULT_TEST_INSTAGRAM_HANDLES,
  DEFAULT_TEST_EMAILS,
} from "./constants";

function ChipListInput({ testIdPrefix, value, onAdd, onRemove, placeholder, suggestions = [] }) {
  const [text, setText] = useState("");

  function commit(raw) {
    const trimmed = raw.trim();
    if (!trimmed || value.includes(trimmed)) {
      setText("");
      return;
    }
    onAdd(trimmed);
    setText("");
  }

  const query = text.trim().toLowerCase();
  const matchingSuggestions = query ? suggestions.filter((s) => s.toLowerCase().includes(query)) : [];

  return (
    <div className="relative">
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
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-border rounded-md text-sm placeholder:text-text-muted"
      />

      {matchingSuggestions.length > 0 && (
        <div
          data-testid={`${testIdPrefix}-suggestions`}
          className="absolute z-10 mt-1 w-full bg-white border border-border rounded-md shadow-md max-h-40 overflow-y-auto"
        >
          {matchingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`${testIdPrefix}-suggestion-${s}`}
              onClick={() => commit(s)}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((v) => (
            <span
              key={v}
              data-testid={`${testIdPrefix}-chip-${v}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm text-text-primary bg-white"
            >
              {v}
              <button
                type="button"
                data-testid={`${testIdPrefix}-remove-${v}`}
                onClick={() => onRemove(v)}
                aria-label={`Remove ${v}`}
                className="text-text-muted hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TestModeTab({ members = [] }) {
  const [phones, setPhones] = useState(DEFAULT_TEST_PHONE_NUMBERS);
  const [instagramHandles, setInstagramHandles] = useState(DEFAULT_TEST_INSTAGRAM_HANDLES);
  const [emails, setEmails] = useState(DEFAULT_TEST_EMAILS);

  const memberPhones = [...new Set(members.map((m) => m.phone).filter(Boolean))].filter((v) => !phones.includes(v));
  const memberInstagrams = [...new Set(members.map((m) => m.instagram).filter(Boolean))].filter(
    (v) => !instagramHandles.includes(v)
  );
  const memberEmails = [...new Set(members.map((m) => m.email).filter(Boolean))].filter((v) => !emails.includes(v));

  return (
    <div data-testid="test-mode-tab" className="space-y-4 max-w-2xl">
      <section className="bg-surface border border-border rounded-lg p-5" data-testid="test-mode-phone-section">
        <h3 className="text-base font-bold text-text-primary mb-1">Phone number</h3>
        <p className="text-sm text-text-secondary mb-3">Add test numbers or profile to set the test mode</p>
        <ChipListInput
          testIdPrefix="test-mode-phone"
          value={phones}
          onAdd={(v) => setPhones((prev) => [...prev, v])}
          onRemove={(v) => setPhones((prev) => prev.filter((p) => p !== v))}
          placeholder="eg. +919999999999"
          suggestions={memberPhones}
        />
        <ul className="text-[12px] text-text-secondary mt-3 space-y-0.5 list-disc list-inside">
          <li>Press ENTER to add number</li>
          <li>Add country code before the number</li>
        </ul>
      </section>

      <section className="bg-surface border border-border rounded-lg p-5" data-testid="test-mode-instagram-section">
        <h3 className="text-base font-bold text-text-primary mb-1">Instagram test accounts</h3>
        <p className="text-sm text-text-secondary mb-3">Add test accounts to test the Journeys in the test mode</p>
        <ChipListInput
          testIdPrefix="test-mode-instagram"
          value={instagramHandles}
          onAdd={(v) => setInstagramHandles((prev) => [...prev, v])}
          onRemove={(v) => setInstagramHandles((prev) => prev.filter((h) => h !== v))}
          placeholder="eg. bikspace_"
          suggestions={memberInstagrams}
        />
        <ul className="text-[12px] text-text-secondary mt-3 space-y-0.5 list-disc list-inside">
          <li>Press ENTER to add account</li>
        </ul>

        <div className="mt-4 flex items-start gap-2 bg-primary-tint/60 border border-primary/20 rounded-md p-3">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-primary">
            To initiate a journey, user permission is required through messaging a business. If test mode
            fails, message the business first from that instagram account and then retry testing.
          </p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-lg p-5" data-testid="test-mode-email-section">
        <h3 className="text-base font-bold text-text-primary mb-1">Test Emails</h3>
        <p className="text-sm text-text-secondary mb-3">Add test emails to test the Journeys in the test mode</p>
        <ChipListInput
          testIdPrefix="test-mode-email"
          value={emails}
          onAdd={(v) => setEmails((prev) => [...prev, v])}
          onRemove={(v) => setEmails((prev) => prev.filter((e) => e !== v))}
          placeholder="eg. example@gmail.com"
          suggestions={memberEmails}
        />
        <ul className="text-[12px] text-text-secondary mt-3 space-y-0.5 list-disc list-inside">
          <li>Press ENTER to add email</li>
        </ul>
      </section>
    </div>
  );
}
