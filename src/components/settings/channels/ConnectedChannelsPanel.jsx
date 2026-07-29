import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { CHANNEL_TYPES } from "./channelIcons";
import Badge from "./Badge";
import ChannelRow from "./ChannelRow";
import ConnectChannelModal from "./ConnectChannelModal";
import ShopifyDetail from "./ShopifyDetail";
import WhatsAppNumberDetail from "./WhatsAppNumberDetail";
import SimpleChannelDetail from "./SimpleChannelDetail";
import {
  SHOPIFY_STORE, WHATSAPP_NUMBERS, FACEBOOK_PAGES, INSTAGRAM_ACCOUNTS,
  EMAIL_ADDRESSES, WEB_PUSH_CHANNEL, EMAIL_MARKETING_CHANNEL,
} from "./data/mockChannels";

function qualityTone(quality) {
  if (quality === "High") return "emerald";
  if (quality === "Medium") return "amber";
  return "rose";
}

const SIMPLE_IDENTIFIER_CONFIG = {
  facebook:       { key: "url",     label: "Page URL" },
  instagram:      { key: "handle",  label: "Handle" },
  emails:         { key: "address", label: "Email address" },
  webpush:        { key: "name",    label: "Website name" },
  emailmarketing: { key: "name",    label: "Sender name" },
  livechat:       { key: "name",    label: "Widget name" },
  rcs:            { key: "number",  label: "Phone number" },
};

function rowTitle(groupKey, item) {
  if (groupKey === "shopify") return item.name;
  if (groupKey === "whatsapp") return item.number;
  if (groupKey === "emails") return item.address;
  return item.name;
}

function rowSubtitle(groupKey, item) {
  if (groupKey === "whatsapp" && item.username) return `@${item.username}`;
  return null;
}

function rowMetadata(groupKey, item) {
  if (groupKey === "shopify") return <span className="text-[12px] text-text-muted">{item.domain}</span>;
  if (groupKey === "whatsapp") {
    return (
      <>
        {item.isExistingNumber && <Badge tone="amber">Existing number</Badge>}
        <Badge tone="slate">Provider: {item.provider}</Badge>
        <Badge tone={qualityTone(item.quality)}>Quality: {item.quality}</Badge>
        {item.isDefaultForCampaigns && <Badge tone="emerald">Default for Campaigns</Badge>}
        <Badge tone="violet">{item.apiTier}</Badge>
      </>
    );
  }
  if (groupKey === "facebook") return <span className="text-[12px] text-text-muted">{item.url}</span>;
  if (groupKey === "instagram") return <span className="text-[12px] text-text-muted">{item.handle}</span>;
  return null;
}

export default function ConnectedChannelsPanel() {
  const [shopify, setShopify] = useState(SHOPIFY_STORE);
  const [whatsappNumbers, setWhatsappNumbers] = useState(WHATSAPP_NUMBERS);
  const [simpleChannels, setSimpleChannels] = useState({
    facebook: FACEBOOK_PAGES,
    instagram: INSTAGRAM_ACCOUNTS,
    emails: EMAIL_ADDRESSES,
    webpush: [WEB_PUSH_CHANNEL],
    emailmarketing: [EMAIL_MARKETING_CHANNEL],
    livechat: [],
    rcs: [],
  });
  const [view, setView] = useState({ type: "list" });
  const [modalOpen, setModalOpen] = useState(false);

  const onMakeDefault = (id) => {
    setWhatsappNumbers((prev) => prev.map((n) => ({ ...n, isDefaultForCampaigns: n.id === id })));
  };

  const updateSimpleItem = (groupKey, id, patch) => {
    setSimpleChannels((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey].map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  };

  const disconnectSimpleItem = (groupKey, id) => {
    setSimpleChannels((prev) => ({ ...prev, [groupKey]: prev[groupKey].filter((i) => i.id !== id) }));
  };

  const findSimpleItem = (groupKey, id) => (simpleChannels[groupKey] || []).find((i) => i.id === id);

  const handleConnect = (typeId, values) => {
    const id = `${typeId}_${Date.now()}`;
    if (typeId === "whatsapp") {
      setWhatsappNumbers((prev) => [...prev, {
        id, number: values.number, username: "", isExistingNumber: false, isDefaultForCampaigns: false,
        apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High", voiceCallEnabled: false,
        businessDescription: "", messagesConsumed: 0, messagingLimit: 25000, about: "", businessAddress: "",
        businessEmail: "", businessWebsite: "", catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
        brandName: "", brandLogoUrl: "", wabaId: "", businessPortfolioId: "", wabaProvider: "",
      }]);
      return;
    }
    const name = values.name || values.handle || values.url || values.address || values.number || "";
    setSimpleChannels((prev) => ({
      ...prev,
      [typeId]: [...(prev[typeId] || []), { id, name, ...values }],
    }));
  };

  const openDetail = (groupKey, id) => {
    if (groupKey === "shopify") setView({ type: "shopify" });
    else if (groupKey === "whatsapp") setView({ type: "whatsapp", id });
    else setView({ type: "simple", groupKey, id });
  };

  const backToList = () => setView({ type: "list" });

  const groups = [
    { key: "shopify", label: "Shopify", items: [shopify] },
    { key: "emailmarketing", label: "Email", items: simpleChannels.emailmarketing },
    { key: "webpush", label: "Web push", items: simpleChannels.webpush },
    { key: "whatsapp", label: "Whatsapp", items: whatsappNumbers },
    { key: "facebook", label: "Facebook", items: simpleChannels.facebook },
    { key: "instagram", label: "Instagram", items: simpleChannels.instagram },
    { key: "emails", label: "Emails", items: simpleChannels.emails },
    { key: "livechat", label: "Live Chat", items: simpleChannels.livechat },
    { key: "rcs", label: "RCS", items: simpleChannels.rcs },
  ];

  if (view.type === "shopify") {
    return <ShopifyDetail store={shopify} onBack={backToList} onUpdate={(patch) => setShopify((prev) => ({ ...prev, ...patch }))} />;
  }

  if (view.type === "whatsapp") {
    return (
      <WhatsAppNumberDetail
        number={whatsappNumbers.find((n) => n.id === view.id)}
        onBack={backToList}
        onMakeDefault={onMakeDefault}
      />
    );
  }

  if (view.type === "simple") {
    const config = SIMPLE_IDENTIFIER_CONFIG[view.groupKey];
    const meta = CHANNEL_TYPES[view.groupKey];
    return (
      <SimpleChannelDetail
        item={findSimpleItem(view.groupKey, view.id)}
        groupLabel={meta.label}
        Icon={meta.Icon}
        iconColor={meta.color}
        identifierLabel={config.label}
        identifierKey={config.key}
        onBack={backToList}
        onUpdate={(id, patch) => updateSimpleItem(view.groupKey, id, patch)}
        onDisconnect={(id) => { disconnectSimpleItem(view.groupKey, id); backToList(); }}
      />
    );
  }

  return (
    <div data-testid="connected-channels-panel">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Connected channels</h2>
          <p className="text-[13px] text-text-secondary mt-1">Here is the list of channels that are already connected on your inbox</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          data-testid="connect-channel-btn"
          className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
        >
          Connect channel
        </button>
      </div>

      {groups.filter((g) => g.items.length > 0).map((g) => (
        <div key={g.key} className="mb-6" data-testid={`channel-group-${g.key}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-text-primary">{g.label}</span>
            {g.key === "whatsapp" && (
              <a href="https://business.facebook.com/commerce/catalogs" target="_blank" rel="noreferrer" data-testid="channel-whatsapp-facebook-catalog-link" className="text-[12px] text-primary font-medium inline-flex items-center gap-1">
                Facebook Catalog <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {g.items.map((item) => (
              <ChannelRow
                key={item.id}
                title={rowTitle(g.key, item)}
                subtitle={rowSubtitle(g.key, item)}
                metadata={rowMetadata(g.key, item)}
                onClick={() => openDetail(g.key, item.id)}
                testId={`channel-row-${g.key}-${item.id}`}
              />
            ))}
          </div>
        </div>
      ))}

      <ConnectChannelModal open={modalOpen} onClose={() => setModalOpen(false)} onConnect={handleConnect} />
    </div>
  );
}
