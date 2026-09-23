import React, { useState } from "react";
import SetupInstructions from "@/components/engage2/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { buildSignupPayload, writeSignupPayload } from "@/lib/metaSignupMock2";

export default function WhatsAppSetupStep({ onConfirm }) {
  const [numberMode, setNumberMode] = useState("has_number");
  const [numberValue, setNumberValue] = useState("98765 43210");
  const [virtualNumberValue, setVirtualNumberValue] = useState("");
  const [appId, setAppId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");
  // WhatsAppProfilePreview already renders a gradient-circle initial-letter
  // placeholder ("M") from brandName when logoUrl is empty — that IS this
  // step's "default image", no separate asset needed.
  const [logoUrl, setLogoUrl] = useState(null);
  const [brandName, setBrandName] = useState("Mystore1");
  const [description, setDescription] = useState(
    "Curated home & lifestyle essentials, shipped fast across India."
  );
  const [website, setWebsite] = useState("mystore1.in");
  const [category, setCategory] = useState(DEFAULT_BUSINESS_CATEGORY);
  const [email, setEmail] = useState("hello@mystore1.in");
  const [supportNumber, setSupportNumber] = useState("+91 98765 43210");
  const [address, setAddress] = useState("12, MG Road, Bengaluru, Karnataka 560001");

  function handleLogoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  }

  function handleConfirmSignup() {
    const payload = buildSignupPayload({
      brandName,
      category,
      website,
      email,
      numberMode,
      numberValue,
      virtualNumberValue,
    });
    writeSignupPayload(payload);
    onConfirm();
  }

  return (
    <div data-testid="whatsapp-setup-step">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Step 3 of 3
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <SetupInstructions onStart={handleConfirmSignup} />
        </div>
        <div className="flex justify-center lg:sticky lg:top-10 lg:self-start">
          <PhoneMockup>
            <WhatsAppProfilePreview
              numberMode={numberMode}
              onNumberModeChange={setNumberMode}
              numberValue={numberValue}
              onNumberValueChange={setNumberValue}
              virtualNumberValue={virtualNumberValue}
              onVirtualNumberChange={setVirtualNumberValue}
              appId={appId}
              onAppIdChange={setAppId}
              apiKeySecret={apiKeySecret}
              onApiKeySecretChange={setApiKeySecret}
              logoUrl={logoUrl}
              onLogoFileChange={handleLogoFileChange}
              brandName={brandName}
              onBrandNameChange={setBrandName}
              description={description}
              onDescriptionChange={setDescription}
              website={website}
              onWebsiteChange={setWebsite}
              category={category}
              onCategoryChange={setCategory}
              email={email}
              onEmailChange={setEmail}
              supportNumber={supportNumber}
              onSupportNumberChange={setSupportNumber}
              address={address}
              onAddressChange={setAddress}
            />
          </PhoneMockup>
        </div>
      </div>
    </div>
  );
}
