export const WEBHOOK_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const WEBHOOK_AUTH_TYPES = [
  { id: "none",    label: "None"         },
  { id: "api_key", label: "API Key"      },
  { id: "bearer",  label: "Bearer Token" },
  { id: "basic",   label: "Basic Auth"   },
];

export const WEBHOOK_RETRY_STRATEGIES = [
  { id: "fixed",       label: "Fixed"               },
  { id: "exponential", label: "Exponential Backoff"  },
];

export const WEBHOOK_INITIAL_DELAYS = [
  { id: 10,  label: "10s"  },
  { id: 30,  label: "30s"  },
  { id: 60,  label: "60s"  },
  { id: 300, label: "5min" },
];

export const WEBHOOK_OUTPUT_PORTS = [
  { id: "on_success", label: "On Success", color: "#10B981" },
  { id: "on_failure", label: "On Failure", color: "#EF4444" },
];

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name",  example: "Priya"             },
    { key: "customer.lastName",  label: "Last Name",   example: "Sharma"            },
    { key: "customer.phone",     label: "Phone",       example: "+91 98765 43210"   },
    { key: "customer.email",     label: "Email",       example: "priya@example.com" },
    { key: "customer.id",        label: "Customer ID", example: "CUST_4821"         },
  ],
  Order: [
    { key: "order.id",          label: "Order ID",     example: "#ORD-7842"                  },
    { key: "order.amount",      label: "Order Amount", example: "1299"                       },
    { key: "order.status",      label: "Order Status", example: "Shipped"                    },
    { key: "order.trackingUrl", label: "Tracking URL", example: "https://track.example.com/" },
  ],
  Flow: [
    { key: "flow.name",   label: "Flow Name", example: "Cart Recovery" },
    { key: "flow.nodeId", label: "Node ID",   example: "n5"            },
    { key: "flow.runId",  label: "Run ID",    example: "run_12345"     },
  ],
};

export const defaultWebhookNodeData = {
  label: "Webhook",
  method: "POST",
  url: "",
  auth: {
    type: "none",
    apiKeyName: "",
    apiKeyValue: "",
    apiKeyIn: "header",
    bearerToken: "",
    basicUser: "",
    basicPass: "",
  },
  params: [],
  headers: [],
  payload: {
    mode: "form",
    form: [],
    raw: "",
  },
  retry: {
    enabled: false,
    max: 3,
    strategy: "exponential",
    initialDelay: 30,
  },
  timeout_ms: 10000,
  outputConfig: {
    wiredPorts: [],
  },
};
