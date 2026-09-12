import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IntroStep from "../IntroStep";
import PhoneNumberStep from "../PhoneNumberStep";
import VerifyPhoneStep from "../VerifyPhoneStep";
import SelectAssetsStep from "../SelectAssetsStep";
import BusinessInfoStep from "../BusinessInfoStep";
import ConnectingStep from "../ConnectingStep";
import EmailVerifyStep from "../EmailVerifyStep";
import SuccessStep from "../SuccessStep";

describe("IntroStep", () => {
  it("renders the consent copy and calls onCancel/onContinue", () => {
    const onCancel = jest.fn();
    const onContinue = jest.fn();
    render(<IntroStep onCancel={onCancel} onContinue={onContinue} />);
    expect(screen.getByText(/Seamlessly connect your account/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("intro-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("intro-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("PhoneNumberStep", () => {
  it("shows the prefilled phone number digits and calls onNext/onBack", () => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    render(<PhoneNumberStep phoneNumber="+91 98765 43210" onBack={onBack} onNext={onNext} />);
    expect(screen.getByTestId("phone-number-input")).toHaveValue("98765 43210");
    fireEvent.click(screen.getByTestId("phone-number-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("phone-number-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe("VerifyPhoneStep", () => {
  it("shows the destination phone number and the prefilled OTP", () => {
    render(<VerifyPhoneStep phoneNumber="+91 98765 43210" onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText(/\+91 98765 43210/)).toBeInTheDocument();
    expect(screen.getByTestId("verify-phone-otp-0")).toHaveTextContent("1");
    expect(screen.getByTestId("verify-phone-otp-5")).toHaveTextContent("6");
  });

  it("shows the resent toast after clicking Resend Code", () => {
    render(<VerifyPhoneStep phoneNumber="+91 98765 43210" onBack={() => {}} onNext={() => {}} />);
    expect(screen.queryByTestId("verify-phone-resent-toast")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("verify-phone-resend"));
    expect(screen.getByTestId("verify-phone-resent-toast")).toBeInTheDocument();
  });
});

describe("SelectAssetsStep", () => {
  it("shows the fixed business portfolio and WABA creation option", () => {
    render(<SelectAssetsStep onBack={() => {}} onNext={() => {}} />);
    expect(screen.getByText("Shiprocket")).toBeInTheDocument();
    expect(screen.getByText("Create a WhatsApp Business account")).toBeInTheDocument();
  });
});

describe("BusinessInfoStep", () => {
  it("prefills name, category, and website from props, with fixed country/timezone", () => {
    render(
      <BusinessInfoStep brandName="Avimee" category="Ecommerce" website="https://avimee.com" onBack={() => {}} onNext={() => {}} />
    );
    expect(screen.getByTestId("business-info-name")).toHaveValue("Avimee");
    expect(screen.getByTestId("business-info-category")).toHaveTextContent("Ecommerce");
    expect(screen.getByTestId("business-info-website")).toHaveValue("https://avimee.com");
    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("(GMT+05:30) Asia/Kolkata")).toBeInTheDocument();
  });
});

describe("ConnectingStep", () => {
  it("calls onAutoAdvance after the delay", () => {
    jest.useFakeTimers();
    const onAutoAdvance = jest.fn();
    render(<ConnectingStep onAutoAdvance={onAutoAdvance} />);
    expect(onAutoAdvance).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1500);
    expect(onAutoAdvance).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});

describe("EmailVerifyStep", () => {
  it("masks the given email and shows the prefilled OTP", () => {
    render(<EmailVerifyStep email="seller@avimee.com" onNext={() => {}} />);
    expect(screen.getByTestId("email-verify-otp-0")).toHaveTextContent("6");
    expect(screen.getByText(/s\*+@a\*+\.com/)).toBeInTheDocument();
  });

  it("calls onNext when clicked", () => {
    const onNext = jest.fn();
    render(<EmailVerifyStep email="seller@avimee.com" onNext={onNext} />);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe("SuccessStep", () => {
  it("shows the derived asset name and calls onFinish", () => {
    const onFinish = jest.fn();
    render(<SuccessStep brandName="Avimee" onFinish={onFinish} />);
    expect(screen.getByText("Avimee WhatsApp Account")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("success-finish"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
