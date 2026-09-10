import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppProfilePreview from "../WhatsAppProfilePreview";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderPreview(overrides = {}) {
  const props = {
    numberMode: "has_number",
    onNumberModeChange: jest.fn(),
    numberValue: "",
    onNumberValueChange: jest.fn(),
    virtualNumberValue: "",
    onVirtualNumberChange: jest.fn(),
    appId: "",
    onAppIdChange: jest.fn(),
    apiKeySecret: "",
    onApiKeySecretChange: jest.fn(),
    logoUrl: null,
    onLogoFileChange: jest.fn(),
    brandName: "",
    onBrandNameChange: jest.fn(),
    description: "",
    onDescriptionChange: jest.fn(),
    website: "",
    onWebsiteChange: jest.fn(),
    category: "Shopping & Retail",
    onCategoryChange: jest.fn(),
    email: "",
    onEmailChange: jest.fn(),
    supportNumber: "",
    onSupportNumberChange: jest.fn(),
    address: "",
    onAddressChange: jest.fn(),
    ...overrides,
  };
  render(<WhatsAppProfilePreview {...props} />);
  return props;
}

describe("WhatsAppProfilePreview", () => {
  it("renders the header and the number setup card", () => {
    renderPreview();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByText("Business Profile")).toBeInTheDocument();
    expect(screen.getByTestId("number-setup-card")).toBeInTheDocument();
  });

  it("typing the brand name calls onBrandNameChange", () => {
    const props = renderPreview();
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    expect(props.onBrandNameChange).toHaveBeenCalledWith("Avimee");
  });

  it("shows the avatar fallback initial derived from brandName", () => {
    renderPreview({ brandName: "Avimee" });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("typing into description, website, email, support number, and address calls each handler", () => {
    const props = renderPreview();
    fireEvent.change(screen.getByTestId("field-description"), { target: { value: "We sell skincare." } });
    expect(props.onDescriptionChange).toHaveBeenCalledWith("We sell skincare.");

    fireEvent.change(screen.getByTestId("field-website"), { target: { value: "https://avimee.com" } });
    expect(props.onWebsiteChange).toHaveBeenCalledWith("https://avimee.com");

    fireEvent.change(screen.getByTestId("field-email"), { target: { value: "hi@avimee.com" } });
    expect(props.onEmailChange).toHaveBeenCalledWith("hi@avimee.com");

    fireEvent.change(screen.getByTestId("field-support-number"), { target: { value: "+91 90000 00000" } });
    expect(props.onSupportNumberChange).toHaveBeenCalledWith("+91 90000 00000");

    fireEvent.change(screen.getByTestId("field-address"), { target: { value: "123 MG Road, Bengaluru" } });
    expect(props.onAddressChange).toHaveBeenCalledWith("123 MG Road, Bengaluru");
  });

  it("shows the given category", () => {
    renderPreview({ category: "Shopping & Retail" });
    expect(screen.getByTestId("field-category")).toHaveTextContent("Shopping & Retail");
  });

  it("selecting a logo file calls onLogoFileChange", () => {
    const props = renderPreview();
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [file] } });
    expect(props.onLogoFileChange).toHaveBeenCalledTimes(1);
  });

  it("renders the given logoUrl as the avatar image", () => {
    renderPreview({ logoUrl: "blob:mock-preview" });
    expect(screen.getByAltText("Brand logo")).toHaveAttribute("src", "blob:mock-preview");
  });

  it("switching the number setup mode calls onNumberModeChange", () => {
    const props = renderPreview();
    fireEvent.click(screen.getByTestId("number-setup-mode-has_app"));
    expect(props.onNumberModeChange).toHaveBeenCalledWith("has_app");
  });
});
