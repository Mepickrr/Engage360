import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { readSignupPayload, MOCK_WABA_ID } from "@/lib/metaSignupMock2";

// Derives the number-setup fields from what Embedded Signup actually
// captured — a phone number the seller already had — so the profile
// preview opens already showing it, in "has_number" mode.
function deriveNumberValue(phoneNumber) {
  return (phoneNumber || "").replace(/^\+91\s*/, "");
}

export default function ProfileDetailsModal({ open, onClose }) {
  const [payload] = useState(() => readSignupPayload());

  const [numberMode, setNumberMode] = useState("has_number");
  const [numberValue, setNumberValue] = useState(() => deriveNumberValue(payload.phoneNumber));
  const [virtualNumberValue, setVirtualNumberValue] = useState("");
  const [appId, setAppId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");

  const [logoUrl, setLogoUrl] = useState(null);
  const [brandName, setBrandName] = useState(payload.brandName);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState(payload.website);
  const [category, setCategory] = useState(payload.category || DEFAULT_BUSINESS_CATEGORY);
  const [email, setEmail] = useState(payload.email);
  const [supportNumber, setSupportNumber] = useState("");
  const [address, setAddress] = useState("");

  function handleLogoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[440px]" data-testid="profile-details-modal">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-lg">Business Profile</DialogTitle>
          <DialogDescription className="text-center">
            Based on your Meta Embedded Signup details — editable anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <PhoneMockup>
            <WhatsAppProfilePreview
              wabaId={MOCK_WABA_ID}
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
      </DialogContent>
    </Dialog>
  );
}
