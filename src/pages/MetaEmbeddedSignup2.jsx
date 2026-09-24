import React, { useCallback, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import MetaTopBarChrome from "@/components/engage2/meta-signup/MetaTopBarChrome";
import FbLoginWindowChrome from "@/components/engage2/meta-signup/FbLoginWindowChrome";
import StepRail from "@/components/engage2/meta-signup/StepRail";
import IntroStep from "@/components/engage2/meta-signup/steps/IntroStep";
import PhoneNumberStep from "@/components/engage2/meta-signup/steps/PhoneNumberStep";
import VerifyPhoneStep from "@/components/engage2/meta-signup/steps/VerifyPhoneStep";
import SelectAssetsStep from "@/components/engage2/meta-signup/steps/SelectAssetsStep";
import BusinessInfoStep from "@/components/engage2/meta-signup/steps/BusinessInfoStep";
import ConnectingStep from "@/components/engage2/meta-signup/steps/ConnectingStep";
import EmailVerifyStep from "@/components/engage2/meta-signup/steps/EmailVerifyStep";
import SuccessStep from "@/components/engage2/meta-signup/steps/SuccessStep";
import { readSignupPayload } from "@/lib/metaSignupMock2";

const TOTAL_STEPS = 8;

export default function MetaEmbeddedSignup() {
  const [payload] = useState(() => readSignupPayload());
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const goNext = useCallback(() => {
    flushSync(() => {
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    });
  }, []);
  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);
  const handleFinish = useCallback(() => {
    // Consumed once by FastrrJourneyPage to auto-open the welcome modal —
    // never reappears on a later visit or refresh. sessionStorage is
    // per-tab, so when this ran in a popup the flag must be set on the
    // *opener* tab's storage (where /fastrr-journey-2 actually renders),
    // not this popup's own.
    const targetStorage = window.opener ? window.opener.sessionStorage : window.sessionStorage;
    targetStorage.setItem("fastrrJourney2Welcome", "1");
    if (window.opener) {
      window.opener.location.href = "/fastrr-journey-2";
      window.close();
    } else {
      navigate("/fastrr-journey-2");
    }
  }, [navigate]);
  const handleCancel = useCallback(() => {
    if (window.opener) {
      window.close();
    } else {
      navigate("/engage-2/setup");
    }
  }, [navigate]);

  let Chrome;
  let content;

  switch (currentStep) {
    case 0:
      Chrome = MetaTopBarChrome;
      content = <IntroStep onCancel={handleCancel} onContinue={goNext} />;
      break;
    case 1:
      Chrome = MetaTopBarChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={0} count={2} />
          <div className="flex-1">
            <PhoneNumberStep phoneNumber={payload.phoneNumber} onBack={goBack} onNext={goNext} />
          </div>
        </div>
      );
      break;
    case 2:
      Chrome = MetaTopBarChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={1} count={2} />
          <div className="flex-1">
            <VerifyPhoneStep phoneNumber={payload.phoneNumber} onBack={goBack} onNext={goNext} />
          </div>
        </div>
      );
      break;
    case 3:
      Chrome = FbLoginWindowChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={0} count={2} />
          <div className="flex-1">
            <SelectAssetsStep onBack={goBack} onNext={goNext} />
          </div>
        </div>
      );
      break;
    case 4:
      Chrome = FbLoginWindowChrome;
      content = (
        <div className="flex h-full">
          <StepRail activeIndex={1} count={2} />
          <div className="flex-1">
            <BusinessInfoStep
              brandName={payload.brandName}
              category={payload.category}
              website={payload.website}
              onBack={goBack}
              onNext={goNext}
            />
          </div>
        </div>
      );
      break;
    case 5:
      Chrome = FbLoginWindowChrome;
      content = <ConnectingStep onAutoAdvance={goNext} />;
      break;
    case 6:
      Chrome = FbLoginWindowChrome;
      content = <EmailVerifyStep email={payload.email} onNext={goNext} />;
      break;
    case 7:
    default:
      Chrome = MetaTopBarChrome;
      content = <SuccessStep brandName={payload.brandName} onFinish={handleFinish} />;
      break;
  }

  return (
    <div className="h-screen bg-slate-200 flex items-center justify-center" data-testid="page-meta-embedded-signup">
      <div
        className="bg-white rounded-lg shadow-2xl overflow-hidden w-full h-full relative"
        style={{ maxWidth: 560 }}
        data-testid="meta-signup-card"
      >
        <Chrome>{content}</Chrome>
      </div>
    </div>
  );
}
