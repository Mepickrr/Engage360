import React, { useState } from "react";
import { RATING_OPTIONS, DEFAULT_MESSAGES, VARIABLE_GROUPS } from "./data/mockData";

const ORANGE = "#F97316";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

const CHANNELS = [
  { id: "whatsapp",  label: "💬 WhatsApp"  },
  { id: "rcs",       label: "📱 RCS"       },
  { id: "instagram", label: "📸 Instagram" },
];

function FieldLabel({ text }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "#6B7280",
      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
    }}>
      {text}
    </div>
  );
}

function FieldTextarea({ label, value, onChange, maxLength = 1000, placeholder, testId }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <FieldLabel text={label} />}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={3}
        data-testid={testId}
        style={{
          width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "6px 8px", fontSize: 12, resize: "none", outline: "none",
          boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
        }}
      />
      <div style={{ fontSize: 10, color: MUTED, textAlign: "right" }}>{value.length}/{maxLength}</div>
    </div>
  );
}

function FieldInput({ label, value, onChange, maxLength, placeholder, type = "text", min, max, testId }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <FieldLabel text={label} />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        min={min}
        max={max}
        data-testid={testId}
        style={{
          width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "6px 8px", fontSize: 12, outline: "none",
          boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
        }}
      />
      {maxLength && (
        <div style={{ fontSize: 10, color: MUTED, textAlign: "right", marginTop: 2 }}>
          {String(value).length}/{maxLength}
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle, testId }) {
  return (
    <button
      onClick={onToggle}
      data-testid={testId}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? ORANGE : "#E5E7EB",
        border: "none", cursor: "pointer", position: "relative", transition: "background 0.15s",
      }}
    >
      <span style={{
        display: "block", width: 14, height: 14, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: on ? 19 : 3, transition: "left 0.15s",
      }} />
    </button>
  );
}

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: "#374151",
        }}
      >
        {title}
        <span style={{ fontSize: 10, color: MUTED }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

function SectionHeader({ label, color = ORANGE }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 10 }}>{label}</div>
  );
}

function Bubble({ children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "10px 10px 10px 2px",
      padding: "8px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", fontSize: 11, color: "#374151",
    }}>
      {children}
    </div>
  );
}

function WhatsAppPreview({ ratingQuestion, ratingButton, reviewQuestion, imageEnabled, imageQuestion, allowSkipImage, imageSkipLabel }) {
  return (
    <div style={{ background: "#E5DDD5", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <Bubble>
        {ratingQuestion || DEFAULT_MESSAGES.rating}
        <div style={{ marginTop: 6, borderTop: `1px solid ${BORDER}`, paddingTop: 6 }}>
          <div
            data-testid="preview-wa-rating-btn"
            style={{ fontSize: 10, color: "#6366F1", textAlign: "center" }}
          >
            📋 {ratingButton || DEFAULT_MESSAGES.ratingButton}
          </div>
        </div>
      </Bubble>
      <Bubble>{reviewQuestion || DEFAULT_MESSAGES.reviewText}</Bubble>
      {imageEnabled && (
        <Bubble>
          {imageQuestion || DEFAULT_MESSAGES.image}
          {allowSkipImage && (
            <div style={{ marginTop: 6, borderTop: `1px solid ${BORDER}`, paddingTop: 6 }}>
              <div style={{ fontSize: 10, color: "#25D366", textAlign: "center" }}>
                {imageSkipLabel || DEFAULT_MESSAGES.imageSkip}
              </div>
            </div>
          )}
        </Bubble>
      )}
    </div>
  );
}

function RCSPreview({ ratingQuestion, reviewQuestion, imageEnabled, imageQuestion, allowSkipImage, imageSkipLabel }) {
  return (
    <div style={{ background: "#F0F4F8", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <Bubble>{ratingQuestion || DEFAULT_MESSAGES.rating}</Bubble>
        <div
          data-testid="preview-rcs-chips"
          style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}
        >
          {["⭐1", "⭐2", "⭐3", "⭐4", "⭐5"].map((chip) => (
            <span key={chip} style={{
              fontSize: 10, padding: "3px 8px", border: "1px solid #6366F1",
              borderRadius: 20, color: "#6366F1", background: "#fff",
            }}>
              {chip}
            </span>
          ))}
        </div>
      </div>
      <Bubble>{reviewQuestion || DEFAULT_MESSAGES.reviewText}</Bubble>
      {imageEnabled && (
        <div>
          <Bubble>{imageQuestion || DEFAULT_MESSAGES.image}</Bubble>
          {allowSkipImage && (
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <span style={{
                fontSize: 10, padding: "3px 8px", border: "1px solid #6366F1",
                borderRadius: 20, color: "#6366F1", background: "#fff",
              }}>
                {imageSkipLabel || DEFAULT_MESSAGES.imageSkip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InstagramPreview({ ratingQuestion, reviewQuestion, imageEnabled, imageQuestion, allowSkipImage, imageSkipLabel }) {
  return (
    <div style={{
      background: "#FAFAFA", borderRadius: 8, padding: 10,
      border: "1px solid rgba(225,48,108,0.15)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div>
        <Bubble>{ratingQuestion || DEFAULT_MESSAGES.rating}</Bubble>
        <div
          data-testid="preview-ig-replies"
          style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}
        >
          {["⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5"].map((btn) => (
            <span key={btn} style={{
              fontSize: 10, padding: "3px 8px", border: "1px solid #E1306C",
              borderRadius: 20, color: "#E1306C", background: "#fff",
            }}>
              {btn}
            </span>
          ))}
        </div>
      </div>
      <Bubble>{reviewQuestion || DEFAULT_MESSAGES.reviewText}</Bubble>
      {imageEnabled && (
        <div>
          <Bubble>{imageQuestion || DEFAULT_MESSAGES.image}</Bubble>
          {allowSkipImage && (
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <span style={{
                fontSize: 10, padding: "3px 8px", border: "1px solid #E1306C",
                borderRadius: 20, color: "#E1306C", background: "#fff",
              }}>
                {imageSkipLabel || DEFAULT_MESSAGES.imageSkip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JudgeMeRightPanel({ node, updateNodeData }) {
  if (!node) return null;

  const data = node.data ?? {};
  const patch = (changes) => updateNodeData(node.id, changes);

  const channel        = data.channel        ?? "whatsapp";
  const productVar     = data.productVar     ?? "";
  const ratingQuestion = data.ratingQuestion ?? DEFAULT_MESSAGES.rating;
  const ratingButton   = data.ratingButton   ?? DEFAULT_MESSAGES.ratingButton;
  const reviewQuestion = data.reviewQuestion ?? DEFAULT_MESSAGES.reviewText;
  const reviewError    = data.reviewError    ?? DEFAULT_MESSAGES.reviewError;
  const retryCount     = data.retryCount     ?? 2;
  const imageEnabled   = data.imageEnabled   ?? false;
  const imageQuestion  = data.imageQuestion  ?? DEFAULT_MESSAGES.image;
  const allowSkipImage = data.allowSkipImage ?? true;
  const imageSkipLabel = data.imageSkipLabel ?? DEFAULT_MESSAGES.imageSkip;
  const noResponseValue = data.noResponseValue ?? 24;
  const noResponseUnit  = data.noResponseUnit  ?? "hours";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Judge.me Review</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          Collect product reviews during conversation
        </div>
      </div>

      {/* Channel selector */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <FieldLabel text="Channel" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => patch({ channel: ch.id })}
              style={{
                padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${channel === ch.id ? ORANGE : BORDER}`,
                background: channel === ch.id ? "#FFF7ED" : "#fff",
                color: channel === ch.id ? ORANGE : "#6B7280",
                cursor: "pointer",
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product variable */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <FieldLabel text="Product Variable" />
        <select
          value={productVar}
          onChange={(e) => patch({ productVar: e.target.value || null })}
          style={{
            width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "6px 8px", fontSize: 12, background: "#fff", color: "#374151",
          }}
        >
          <option value="">— Select variable —</option>
          {VARIABLE_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.variables.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}{v.recommended ? " ★" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Step 1 — Rating */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <SectionHeader label="Step 1 — Rating" />
        <FieldTextarea
          label="Question message"
          value={ratingQuestion}
          onChange={(v) => patch({ ratingQuestion: v })}
          placeholder={DEFAULT_MESSAGES.rating}
        />
        {channel === "whatsapp" && (
          <FieldInput
            label="Button text"
            value={ratingButton}
            onChange={(v) => patch({ ratingButton: v.slice(0, 20) })}
            maxLength={20}
            placeholder="Rate"
          />
        )}
        <div style={{ marginTop: 4 }}>
          <FieldLabel text="Rating options (fixed)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {RATING_OPTIONS.map((opt) => (
              <div key={opt.value} style={{
                fontSize: 11, color: "#6B7280", padding: "3px 8px",
                background: "#F9FAFB", borderRadius: 4, border: `1px solid ${BORDER}`,
              }}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2 — Review Text */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <SectionHeader label="Step 2 — Review Text" />
        <FieldTextarea
          label="Question message"
          value={reviewQuestion}
          onChange={(v) => patch({ reviewQuestion: v })}
          placeholder={DEFAULT_MESSAGES.reviewText}
        />
      </div>

      <CollapsibleSection title="Error & Retries">
        <FieldTextarea
          label="Error message"
          value={reviewError}
          onChange={(v) => patch({ reviewError: v })}
          placeholder={DEFAULT_MESSAGES.reviewError}
        />
        <FieldLabel text="Retry attempts (1–3)" />
        <input
          type="number"
          min={1}
          max={3}
          value={retryCount}
          onChange={(e) => patch({ retryCount: Math.min(3, Math.max(1, Number(e.target.value))) })}
          style={{
            width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "6px 8px", fontSize: 12, outline: "none",
            boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
          }}
        />
      </CollapsibleSection>

      {/* Step 3 — Image Upload */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: imageEnabled ? ORANGE : MUTED }}>
            Step 3 — Image Upload
          </div>
          <Toggle
            on={imageEnabled}
            onToggle={() => patch({ imageEnabled: !imageEnabled })}
            testId="image-toggle"
          />
        </div>
        {imageEnabled && (
          <div style={{ padding: "0 16px 12px" }}>
            <FieldTextarea
              label="Question message"
              value={imageQuestion}
              onChange={(v) => patch({ imageQuestion: v })}
              placeholder={DEFAULT_MESSAGES.image}
            />
          </div>
        )}
      </div>

      {imageEnabled && (
        <CollapsibleSection title="Skip option">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <FieldLabel text="Allow skip" />
            <Toggle
              on={allowSkipImage}
              onToggle={() => patch({ allowSkipImage: !allowSkipImage })}
              testId="skip-toggle"
            />
          </div>
          {allowSkipImage && (
            <FieldInput
              label="Skip button label"
              value={imageSkipLabel}
              onChange={(v) => patch({ imageSkipLabel: v })}
              placeholder="Skip"
            />
          )}
        </CollapsibleSection>
      )}

      {/* No Response */}
      <CollapsibleSection title="No Response">
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number"
            min={1}
            value={noResponseValue}
            onChange={(e) => patch({ noResponseValue: Number(e.target.value) || 1 })}
            data-testid="no-response-value"
            style={{
              flex: 1, border: `1px solid ${BORDER}`, borderRadius: 6,
              padding: "6px 8px", fontSize: 12, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
            }}
          />
          <select
            value={noResponseUnit}
            onChange={(e) => patch({ noResponseUnit: e.target.value })}
            data-testid="no-response-unit"
            style={{
              flex: 1, border: `1px solid ${BORDER}`, borderRadius: 6,
              padding: "6px 8px", fontSize: 12, background: "#fff", color: "#374151",
            }}
          >
            <option value="minutes">minutes</option>
            <option value="hours">hours</option>
          </select>
        </div>
      </CollapsibleSection>

      {/* Live Preview */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
          Live Preview
        </div>
        {channel === "whatsapp" && (
          <WhatsAppPreview
            ratingQuestion={ratingQuestion}
            ratingButton={ratingButton}
            reviewQuestion={reviewQuestion}
            imageEnabled={imageEnabled}
            imageQuestion={imageQuestion}
            allowSkipImage={allowSkipImage}
            imageSkipLabel={imageSkipLabel}
          />
        )}
        {channel === "rcs" && (
          <RCSPreview
            ratingQuestion={ratingQuestion}
            reviewQuestion={reviewQuestion}
            imageEnabled={imageEnabled}
            imageQuestion={imageQuestion}
            allowSkipImage={allowSkipImage}
            imageSkipLabel={imageSkipLabel}
          />
        )}
        {channel === "instagram" && (
          <InstagramPreview
            ratingQuestion={ratingQuestion}
            reviewQuestion={reviewQuestion}
            imageEnabled={imageEnabled}
            imageQuestion={imageQuestion}
            allowSkipImage={allowSkipImage}
            imageSkipLabel={imageSkipLabel}
          />
        )}
      </div>

    </div>
  );
}
