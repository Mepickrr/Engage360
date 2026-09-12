import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import SetupInstructions from "@/components/engage2/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { buildSignupPayload, writeSignupPayload, openSignupPopup } from "@/lib/metaSignupMock2";

export default function EngageAccountSetupPage() {
  const [numberMode, setNumberMode] = useState("has_number");
  const [numberValue, setNumberValue] = useState("");
  const [virtualNumberValue, setVirtualNumberValue] = useState("");
  const [appId, setAppId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");

  const [logoUrl, setLogoUrl] = useState(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState(DEFAULT_BUSINESS_CATEGORY);
  const [email, setEmail] = useState("");
  const [supportNumber, setSupportNumber] = useState("");
  const [address, setAddress] = useState("");

  function handleLogoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
    }
  }

  function handleStartSignup() {
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
    const popup = openSignupPopup();
    if (!popup) {
      toast.error("Your browser blocked the signup popup. Please allow popups for this site and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-engage-account-setup">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <span className="text-sm font-semibold text-text-primary">Fastrr Engage</span>
        <Link
          to="/fastrr-engage-2"
          data-testid="exit-setup-link"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Exit setup
        </Link>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        <div>
          <SetupInstructions onStart={handleStartSignup} />
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
