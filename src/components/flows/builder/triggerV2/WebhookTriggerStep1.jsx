import React, { useState } from "react";
import { Plus, Copy, Check, X } from "lucide-react";
import { flattenPayload, simulateTestEvent, MOCK_EXISTING_VARIABLES } from "./webhookHelpers";

const ID_TYPES = ["Phone Number"];

export function isWebhookStep1Valid(config) {
  const { error } = flattenPayload(config?.samplePayload);
  return !error && !!config?.samplePayload && !!config?.uniqueId?.type && !!config?.uniqueId?.payloadVariable;
}

function findExistingVariable(key) {
  for (const cat of MOCK_EXISTING_VARIABLES) {
    for (const grp of cat.groups) {
      const item = grp.items.find((i) => i.key === key);
      if (item) return { category: cat.category, group: grp.label, key: item.key, label: item.label };
    }
  }
  return null;
}

export default function WebhookTriggerStep1({ config, setConfig }) {
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const update = (patch) => setConfig({ ...config, ...patch });

  const { variables: payloadVariables, error: parseError } = flattenPayload(config.samplePayload);

  const handleCopy = () => {
    navigator.clipboard?.writeText(config.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePayloadChange = (value) => {
    setTestResult(null);
    update({ samplePayload: value });
  };

  const handleTestEvent = () => {
    setTestResult(simulateTestEvent(config.samplePayload, config.uniqueId));
  };

  const toggleAuth = (checked) => {
    update({
      authProtected: checked,
      authConfig: checked ? config.authConfig || { headerName: "", token: "" } : null,
    });
  };

  const updateUniqueId = (patch) =>
    update({ uniqueId: { type: "Phone Number", payloadVariable: "", ...(config.uniqueId || {}), ...patch } });
  const updateSecondaryId = (patch) =>
    update({ secondaryId: { type: "Phone Number", payloadVariable: "", ...(config.secondaryId || {}), ...patch } });

  const addVariableMappingRow = () => {
    update({
      variableMappings: [
        ...(config.variableMappings || []),
        { payloadVariable: payloadVariables[0]?.path || "", existingVariable: null },
      ],
    });
  };
  const updateVariableMappingRow = (idx, patch) =>
    update({ variableMappings: config.variableMappings.map((m, i) => (i === idx ? { ...m, ...patch } : m)) });
  const removeVariableMappingRow = (idx) =>
    update({ variableMappings: config.variableMappings.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6" data-testid="webhook-step1">
      {/* Webhook URL */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Webhook URL</div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={config.webhookUrl}
            data-testid="webhook-url-input"
            className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-slate-50 text-text-secondary"
          />
          <button
            type="button"
            onClick={handleCopy}
            data-testid="webhook-url-copy"
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Auth */}
      <div>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={config.authProtected}
            onChange={(e) => toggleAuth(e.target.checked)}
            data-testid="webhook-auth-checkbox"
            className="w-3.5 h-3.5 accent-primary rounded"
          />
          Protect the Webhook with an authentication token
        </label>
        {config.authProtected && (
          <div className="mt-2 ml-5 flex items-center gap-2">
            <input
              placeholder="Header name"
              value={config.authConfig?.headerName || ""}
              onChange={(e) => update({ authConfig: { ...config.authConfig, headerName: e.target.value } })}
              data-testid="webhook-auth-header"
              className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface w-40 focus:outline-none focus:border-primary/60"
            />
            <input
              placeholder="Token value"
              value={config.authConfig?.token || ""}
              onChange={(e) => update({ authConfig: { ...config.authConfig, token: e.target.value } })}
              data-testid="webhook-auth-token"
              className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface w-48 focus:outline-none focus:border-primary/60"
            />
          </div>
        )}
      </div>

      {/* Sample payload */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Paste Sample Payload</div>
        <textarea
          rows={6}
          value={config.samplePayload}
          onChange={(e) => handlePayloadChange(e.target.value)}
          placeholder='{"order_id": 12345, "customer": {"phone": "+919999999999"}}'
          data-testid="webhook-sample-payload"
          className="w-full px-3 py-2 text-sm font-mono rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
        {parseError && (
          <div className="mt-1 text-xs text-rose-600" data-testid="webhook-payload-error">
            {parseError}
          </div>
        )}
        {!parseError && payloadVariables.length > 0 && (
          <div
            className="mt-2 border border-border rounded-md divide-y divide-border"
            data-testid="webhook-payload-variables"
          >
            {payloadVariables.map((v) => (
              <div key={v.path} className="flex items-center justify-between px-3 py-1.5 text-xs">
                <span className="font-mono text-primary">{`{{${v.path}}}`}</span>
                <span className="text-text-muted">{v.example}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test event */}
      <div>
        <button
          type="button"
          onClick={handleTestEvent}
          disabled={!config.samplePayload || !!parseError}
          data-testid="webhook-test-event-btn"
          className="px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Test Event
        </button>
        {testResult && (
          <div
            data-testid="webhook-test-result"
            className={`mt-2 px-3 py-2 rounded-md text-sm border ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {testResult.success
              ? `Test event received — ${testResult.variableCount} variable(s) detected${
                  testResult.resolvedIdValue ? ` · Unique ID resolved to ${testResult.resolvedIdValue}` : ""
                }`
              : testResult.error}
          </div>
        )}
      </div>

      {/* Unique ID */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Enter Unique ID</div>
        <div className="flex items-center gap-3">
          <select
            value={config.uniqueId?.type || ""}
            onChange={(e) => updateUniqueId({ type: e.target.value })}
            data-testid="webhook-unique-id-type"
            className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
          >
            <option value="">Select an option</option>
            {ID_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={config.uniqueId?.payloadVariable || ""}
            onChange={(e) => updateUniqueId({ payloadVariable: e.target.value })}
            disabled={payloadVariables.length === 0}
            data-testid="webhook-unique-id-var"
            className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60 disabled:opacity-40"
          >
            <option value="">Payload Variable</option>
            {payloadVariables.map((v) => (
              <option key={v.path} value={v.path}>{`{{${v.path}}}`}</option>
            ))}
          </select>
        </div>

        {!config.secondaryId ? (
          <button
            type="button"
            onClick={() => update({ secondaryId: { type: "Phone Number", payloadVariable: "" } })}
            data-testid="webhook-add-secondary-id"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
          >
            <Plus className="w-3.5 h-3.5" />
            Secondary ID (optional)
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <select
              value={config.secondaryId?.type || ""}
              onChange={(e) => updateSecondaryId({ type: e.target.value })}
              data-testid="webhook-secondary-id-type"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
            >
              <option value="">Select an option</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={config.secondaryId?.payloadVariable || ""}
              onChange={(e) => updateSecondaryId({ payloadVariable: e.target.value })}
              data-testid="webhook-secondary-id-var"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
            >
              <option value="">Payload Variable</option>
              {payloadVariables.map((v) => (
                <option key={v.path} value={v.path}>{`{{${v.path}}}`}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => update({ secondaryId: null })}
              data-testid="webhook-remove-secondary-id"
              className="p-1 text-text-muted hover:text-rose-600 rounded-md"
              aria-label="Remove secondary ID"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Variable mapping */}
      {payloadVariables.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-text-primary mb-1">
            Map Payload Variables to Existing Variables (Optional)
          </div>
          <div className="space-y-2">
            {(config.variableMappings || []).map((m, idx) => (
              <div key={idx} className="flex items-center gap-2" data-testid={`webhook-var-mapping-row-${idx}`}>
                <select
                  value={m.payloadVariable}
                  onChange={(e) => updateVariableMappingRow(idx, { payloadVariable: e.target.value })}
                  data-testid={`webhook-var-mapping-payload-${idx}`}
                  className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                >
                  {payloadVariables.map((v) => (
                    <option key={v.path} value={v.path}>{`{{${v.path}}}`}</option>
                  ))}
                </select>
                <span className="text-text-muted">→</span>
                <select
                  value={m.existingVariable?.key || ""}
                  onChange={(e) => updateVariableMappingRow(idx, { existingVariable: findExistingVariable(e.target.value) })}
                  data-testid={`webhook-var-mapping-existing-${idx}`}
                  className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                >
                  <option value="">Select existing variable…</option>
                  {MOCK_EXISTING_VARIABLES.map((cat) => (
                    <optgroup key={cat.category} label={cat.category}>
                      {cat.groups.map((grp) =>
                        grp.items.map((item) => (
                          <option key={item.key} value={item.key}>{`${grp.label} — ${item.label}`}</option>
                        )),
                      )}
                    </optgroup>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeVariableMappingRow(idx)}
                  data-testid={`webhook-var-mapping-remove-${idx}`}
                  className="p-1 text-text-muted hover:text-rose-600 rounded-md"
                  aria-label="Remove mapping"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariableMappingRow}
            data-testid="webhook-add-var-mapping"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}
