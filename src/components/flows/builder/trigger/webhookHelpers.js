// webhookHelpers.js
// Pure, framework-free helpers for the Webhook Start Trigger. No React
// dependencies — independently testable.

export function generateWebhookUrl(seed, flowSlug = "flow") {
  return `https://bikapi.bikayi.app/chatbot/webhook/${seed}?flow=${flowSlug}`;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 12);
}

export function emptyWebhookConfig(flowSlug = "flow") {
  return {
    webhookUrl: generateWebhookUrl(randomSeed(), flowSlug),
    authProtected: false,
    authConfig: null,
    samplePayload: "",
    uniqueId: null,
    secondaryId: null,
    variableMappings: [],
  };
}

// Flattens a JSON sample payload into dot-path variables. Arrays only walk
// their first element (kept under the array's own path) so the variable
// list stays finite regardless of payload size.
export function flattenPayload(jsonString) {
  if (!jsonString || !jsonString.trim()) {
    return { variables: [], error: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { variables: [], error: `Invalid JSON: ${e.message}` };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { variables: [], error: "Sample payload must be a JSON object" };
  }

  const variables = [];
  function walk(node, prefix) {
    if (Array.isArray(node)) {
      if (node.length > 0) walk(node[0], prefix);
      return;
    }
    if (node !== null && typeof node === "object") {
      for (const key of Object.keys(node)) {
        walk(node[key], prefix ? `${prefix}.${key}` : key);
      }
      return;
    }
    if (prefix) variables.push({ path: prefix, example: String(node) });
  }
  walk(parsed, "");
  return { variables, error: null };
}

export function simulateTestEvent(samplePayload, uniqueId) {
  const { variables, error } = flattenPayload(samplePayload);
  if (error) {
    return { success: false, variableCount: 0, resolvedIdValue: null, error };
  }
  if (variables.length === 0) {
    return {
      success: false,
      variableCount: 0,
      resolvedIdValue: null,
      error: "No variables found in payload",
    };
  }
  let resolvedIdValue = null;
  if (uniqueId?.payloadVariable) {
    const match = variables.find((v) => v.path === uniqueId.payloadVariable);
    resolvedIdValue = match ? match.example : null;
  }
  return { success: true, variableCount: variables.length, resolvedIdValue, error: null };
}

export const MOCK_EXISTING_VARIABLES = [
  {
    category: "Customer variables",
    groups: [
      {
        label: "Basic",
        items: [
          { key: "customer.phone", label: "Phone" },
          { key: "customer.email", label: "Email" },
          { key: "customer.first_name", label: "First Name" },
          { key: "customer.last_name", label: "Last Name" },
        ],
      },
      {
        label: "Custom Fields",
        items: [
          { key: "customer.loyalty_tier", label: "Loyalty Tier" },
          { key: "customer.referral_code", label: "Referral Code" },
        ],
      },
    ],
  },
  {
    category: "Flow variables",
    groups: [
      {
        label: "Flow",
        items: [
          { key: "flow.entry_source", label: "Entry Source" },
          { key: "flow.session_id", label: "Session ID" },
        ],
      },
    ],
  },
  {
    category: "Store variables",
    groups: [
      {
        label: "Store",
        items: [
          { key: "store.name", label: "Store Name" },
          { key: "store.currency", label: "Store Currency" },
        ],
      },
    ],
  },
  {
    category: "Global variables",
    groups: [
      {
        label: "Global",
        items: [
          { key: "global.support_email", label: "Support Email" },
          { key: "global.support_phone", label: "Support Phone" },
        ],
      },
    ],
  },
];
