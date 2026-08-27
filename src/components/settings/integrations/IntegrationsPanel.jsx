import React, { useState } from "react";
import ChannelRow from "@/components/settings/channels/ChannelRow";
import Badge from "@/components/settings/channels/Badge";
import ShopifyDetail from "./ShopifyDetail";
import PosIntegrationDetail from "./PosIntegrationDetail";
import SimpleIntegrationDetail from "./SimpleIntegrationDetail";
import ConnectIntegrationModal from "./ConnectIntegrationModal";
import { INTEGRATION_TYPES } from "./data/mockIntegrations";
import {
  SHOPIFY_INTEGRATION,
  WOOCOMMERCE_INTEGRATION,
  MAGENTO_INTEGRATION,
  RAZORPAY_INTEGRATION,
  CASHFREE_INTEGRATION,
  SHIPROCKET_CHECKOUT_INTEGRATION,
  GOKWIK_INTEGRATION,
  SHOPFLO_INTEGRATION,
  POS_INTEGRATION,
  JUDGE_ME_INTEGRATION,
} from "./data/mockIntegrations";

function rowSubtitle(item) {
  if (item.id === "shopify_1") return item.domain;
  return item.desc;
}

function rowMetadata(item) {
  return item.connected ? <Badge tone="emerald">Connected</Badge> : <Badge tone="slate">Not connected</Badge>;
}

export default function IntegrationsPanel() {
  const [shopify] = useState(SHOPIFY_INTEGRATION);
  const [woocommerce, setWoocommerce] = useState(WOOCOMMERCE_INTEGRATION);
  const [magento, setMagento] = useState(MAGENTO_INTEGRATION);
  const [razorpay, setRazorpay] = useState(RAZORPAY_INTEGRATION);
  const [cashfree, setCashfree] = useState(CASHFREE_INTEGRATION);
  const [shiprocketCheckout, setShiprocketCheckout] = useState(SHIPROCKET_CHECKOUT_INTEGRATION);
  const [gokwik, setGokwik] = useState(GOKWIK_INTEGRATION);
  const [shopflo, setShopflo] = useState(SHOPFLO_INTEGRATION);
  const [pos, setPos] = useState(POS_INTEGRATION);
  const [judgeme, setJudgeme] = useState(JUDGE_ME_INTEGRATION);

  const [view, setView] = useState({ type: "list" });
  const [modalTypeId, setModalTypeId] = useState(null);

  const SETTERS = {
    woocommerce: setWoocommerce,
    magento: setMagento,
    razorpay: setRazorpay,
    cashfree: setCashfree,
    shiprocketCheckout: setShiprocketCheckout,
    gokwik: setGokwik,
    shopflo: setShopflo,
    judgeme: setJudgeme,
  };

  const RECORDS = { woocommerce, magento, razorpay, cashfree, shiprocketCheckout, gokwik, shopflo, judgeme };

  // Shopify already has a connected store (rendered via ShopifyDetail below),
  // but the Platform card still shows in the "Create new integration" picker
  // so a second/alternate platform can be connected alongside it.
  const connectedSimpleIds = Object.entries(RECORDS)
    .filter(([, item]) => item.connected)
    .map(([id]) => id);

  const groups = [
    { key: "platform", label: "Platform", items: [shopify, woocommerce, magento] },
    { key: "payment", label: "Payment", items: [razorpay, cashfree] },
    { key: "checkoutPartners", label: "Checkout Partners", items: [shiprocketCheckout, gokwik, shopflo, razorpay] },
    { key: "pos", label: "POS", items: [pos] },
    { key: "reviews", label: "Reviews", items: [judgeme] },
  ];

  const backToList = () => setView({ type: "list" });

  const openDetail = (id) => {
    if (id === "shopify_1") {
      setView({ type: "shopify" });
    } else if (id === "pos") {
      setView({ type: "pos" });
    } else if (RECORDS[id]?.connected) {
      setView({ type: "simple", id });
    } else {
      setModalTypeId(id);
    }
  };

  const handleConnect = (typeId, values) => {
    const setter = SETTERS[typeId];
    if (setter) setter((prev) => ({ ...prev, ...values, connected: true }));
    setModalTypeId(null);
  };

  const handleDisconnect = (id) => {
    const setter = SETTERS[id];
    if (setter) setter((prev) => ({ ...prev, connected: false, ...(("apiKey" in prev) ? { apiKey: "" } : { domain: "" }) }));
    backToList();
  };

  if (view.type === "shopify") {
    return <ShopifyDetail store={shopify} onBack={backToList} onUpdate={() => {}} />;
  }

  if (view.type === "pos") {
    return <PosIntegrationDetail pos={pos} onBack={backToList} onUpdate={(patch) => setPos((prev) => ({ ...prev, ...patch }))} />;
  }

  if (view.type === "simple") {
    const item = RECORDS[view.id];
    const meta = INTEGRATION_TYPES[view.id];
    return (
      <SimpleIntegrationDetail
        item={item}
        label={meta.label}
        Icon={meta.Icon}
        iconColor={meta.color}
        onBack={backToList}
        onDisconnect={handleDisconnect}
        fieldLabel={"domain" in item ? "Store domain" : "API Key"}
        fieldValue={"domain" in item ? item.domain : item.apiKey}
      />
    );
  }

  return (
    <div data-testid="settings-integrations">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Integrations</h2>
          <p className="text-[13px] text-text-secondary mt-1">Here is the list of all integrations available for your store</p>
        </div>
        <button
          type="button"
          onClick={() => setModalTypeId("__picker__")}
          data-testid="create-integration-btn"
          className="px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
        >
          Create new integration
        </button>
      </div>

      {groups.map((g) => (
        <div key={g.key} className="mb-6" data-testid={`integration-group-${g.key}`}>
          <div className="text-[13px] font-semibold text-text-primary mb-2">{g.label}</div>
          <div className="bg-surface border border-border rounded-lg divide-y divide-border">
            {g.items.map((item) => {
              const meta = INTEGRATION_TYPES[item.id === "shopify_1" ? "shopify" : item.id];
              return (
                <ChannelRow
                  key={`${g.key}-${item.id}`}
                  title={
                    <span className="inline-flex items-center gap-2">
                      {meta?.Icon && <meta.Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />}
                      {item.name}
                    </span>
                  }
                  subtitle={rowSubtitle(item)}
                  metadata={rowMetadata(item)}
                  onClick={() => openDetail(item.id)}
                  testId={`integration-row-${g.key}-${item.id}`}
                />
              );
            })}
          </div>
        </div>
      ))}

      <ConnectIntegrationModal
        open={modalTypeId !== null}
        onClose={() => setModalTypeId(null)}
        onConnect={handleConnect}
        initialTypeId={modalTypeId === "__picker__" ? null : modalTypeId}
        connectedIds={connectedSimpleIds}
      />
    </div>
  );
}
