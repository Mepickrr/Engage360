import { MOCK_TEMPLATES } from "@/data/mockTemplates";

export const WHATSAPP_CATALOG_TEMPLATES = MOCK_TEMPLATES.filter((t) => t.channel === "whatsapp");

const BUTTON_TYPE_MAP = { url: "URL", quick_reply: "QUICK_REPLY" };
const TYPE_LABEL_MAP = { marketing: "Marketing", utility: "Utility", authentication: "Authentication" };
const STATUS_LABEL_MAP = {
  active: "Active",
  draft: "Draft",
  rejected: "Rejected",
  in_review: "In Review",
  disabled: "Disabled",
  paused: "Paused",
};

export function mapCatalogTemplateToDraft(entry) {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    language: entry.language,
    type: TYPE_LABEL_MAP[entry.type] || entry.type,
    status: STATUS_LABEL_MAP[entry.status] || entry.status,
    header: entry.preview.header,
    body: entry.preview.body,
    footer: entry.preview.footer,
    buttons: (entry.preview.buttons || []).map((b) => ({
      type: BUTTON_TYPE_MAP[b.type] || b.type,
      label: b.label,
      url: b.url,
    })),
    variables: [],
  };
}
