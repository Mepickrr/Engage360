import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NumberSetupCard from "./NumberSetupCard";
import { BUSINESS_CATEGORIES, DEFAULT_BUSINESS_CATEGORY } from "./data";

export default function WhatsAppProfilePreview() {
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

  function handleLogoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
    }
  }

  return (
    <div data-testid="whatsapp-profile-preview">
      <div
        className="text-white px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ background: "#075E54" }}
      >
        <span className="text-lg leading-none">‹</span>
        <span className="text-[15px] font-semibold">Business Profile</span>
      </div>

      <div className="p-4">
        <NumberSetupCard
          mode={numberMode}
          onModeChange={setNumberMode}
          numberValue={numberValue}
          onNumberValueChange={setNumberValue}
          virtualNumberValue={virtualNumberValue}
          onVirtualNumberChange={setVirtualNumberValue}
          appId={appId}
          onAppIdChange={setAppId}
          apiKeySecret={apiKeySecret}
          onApiKeySecretChange={setApiKeySecret}
        />

        <div className="flex flex-col items-center mb-4">
          <label
            htmlFor="engage-setup-logo-input"
            className="relative w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center cursor-pointer overflow-hidden"
            data-testid="logo-picker"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Brand logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-slate-400">
                {brandName ? brandName.charAt(0).toUpperCase() : "?"}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-white">
              <Camera className="w-3 h-3 text-white" />
            </span>
          </label>
          <input
            id="engage-setup-logo-input"
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="logo-file-input"
            onChange={handleLogoChange}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="field-brand-name-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Brand Name
            </label>
            <Input
              id="field-brand-name-input"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your brand name"
              data-testid="field-brand-name"
            />
          </div>

          <div>
            <label htmlFor="field-description-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Company Description
            </label>
            <Textarea
              id="field-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your business do?"
              data-testid="field-description"
            />
          </div>

          <div>
            <label htmlFor="field-website-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Website URL
            </label>
            <Input
              id="field-website-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourstore.com"
              data-testid="field-website"
            />
          </div>

          <div>
            <label htmlFor="field-category-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Business Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="field-category-input" data-testid="field-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="field-email-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Contact Email
            </label>
            <Input
              id="field-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@yourstore.com"
              data-testid="field-email"
            />
          </div>

          <div>
            <label htmlFor="field-support-number-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Support Number
            </label>
            <Input
              id="field-support-number-input"
              value={supportNumber}
              onChange={(e) => setSupportNumber(e.target.value)}
              placeholder="+91 98765 43210"
              data-testid="field-support-number"
            />
          </div>

          <div>
            <label htmlFor="field-address-input" className="text-[11px] font-medium text-text-secondary mb-1 block">
              Office Address
            </label>
            <Textarea
              id="field-address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state, PIN"
              data-testid="field-address"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
