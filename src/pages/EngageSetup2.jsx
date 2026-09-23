import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SetupProgressBar from "@/components/engage2/setup/SetupProgressBar";
import SelectRecapStep from "@/components/engage2/setup/SelectRecapStep";
import FundWalletStep from "@/components/engage2/setup/FundWalletStep";
import WhatsAppSetupStep from "@/components/engage2/setup/WhatsAppSetupStep";

const STEP_SELECT = 0;
const STEP_WALLET = 1;
const STEP_WHATSAPP = 2;

export default function EngageSetupPage() {
  const navigate = useNavigate();
  // Arriving here means Continue was already clicked on the listing page —
  // step 0 (select) is "done" the moment you land here, so start on the
  // wallet step; step 0 stays reachable via the progress bar as a recap.
  const [step, setStep] = useState(STEP_WALLET);
  const [furthestStep, setFurthestStep] = useState(STEP_WALLET);

  function goToStep(next) {
    setStep(next);
    setFurthestStep((f) => Math.max(f, next));
  }

  function handleWhatsAppConfirm() {
    navigate("/engage-2/meta-embedded-signup");
  }

  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-engage-setup">
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <SetupProgressBar currentStep={step} furthestStep={furthestStep} onStepClick={goToStep} />
        {step === STEP_SELECT && <SelectRecapStep />}
        {step === STEP_WALLET && (
          <FundWalletStep onDone={() => goToStep(STEP_WHATSAPP)} onSkip={() => goToStep(STEP_WHATSAPP)} />
        )}
        {step === STEP_WHATSAPP && <WhatsAppSetupStep onConfirm={handleWhatsAppConfirm} />}
      </div>
    </div>
  );
}
