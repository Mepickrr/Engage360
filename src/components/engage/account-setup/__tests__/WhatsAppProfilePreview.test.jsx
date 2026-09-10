import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppProfilePreview from "../WhatsAppProfilePreview";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  // CRA's default jest config sets resetMocks: true, which clears any
  // jest.fn() implementation before each test — so the createObjectURL
  // stub must be (re)installed per-test rather than once in beforeAll.
  global.URL.createObjectURL = jest.fn(() => "blob:mock-preview");
});

describe("WhatsAppProfilePreview", () => {
  it("renders the header and the number setup card", () => {
    render(<WhatsAppProfilePreview />);
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByText("Business Profile")).toBeInTheDocument();
    expect(screen.getByTestId("number-setup-card")).toBeInTheDocument();
  });

  it("typing the brand name updates the input and the avatar's fallback initial", () => {
    render(<WhatsAppProfilePreview />);
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Avimee");
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("typing into description, website, email, support number, and address updates each field", () => {
    render(<WhatsAppProfilePreview />);
    fireEvent.change(screen.getByTestId("field-description"), { target: { value: "We sell skincare." } });
    expect(screen.getByTestId("field-description")).toHaveValue("We sell skincare.");

    fireEvent.change(screen.getByTestId("field-website"), { target: { value: "https://avimee.com" } });
    expect(screen.getByTestId("field-website")).toHaveValue("https://avimee.com");

    fireEvent.change(screen.getByTestId("field-email"), { target: { value: "hi@avimee.com" } });
    expect(screen.getByTestId("field-email")).toHaveValue("hi@avimee.com");

    fireEvent.change(screen.getByTestId("field-support-number"), { target: { value: "+91 90000 00000" } });
    expect(screen.getByTestId("field-support-number")).toHaveValue("+91 90000 00000");

    fireEvent.change(screen.getByTestId("field-address"), { target: { value: "123 MG Road, Bengaluru" } });
    expect(screen.getByTestId("field-address")).toHaveValue("123 MG Road, Bengaluru");
  });

  it("defaults the business category to 'Shopping & Retail' and can be changed", () => {
    render(<WhatsAppProfilePreview />);
    expect(screen.getByTestId("field-category")).toHaveTextContent("Shopping & Retail");
    fireEvent.click(screen.getByTestId("field-category"));
    fireEvent.click(screen.getByText("Education"));
    expect(screen.getByTestId("field-category")).toHaveTextContent("Education");
  });

  it("selecting a logo file updates the avatar preview image", () => {
    render(<WhatsAppProfilePreview />);
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("logo-file-input"), { target: { files: [file] } });
    expect(screen.getByAltText("Brand logo")).toHaveAttribute("src", "blob:mock-preview");
  });

  it("switching the number setup mode reveals only the corresponding fields", () => {
    render(<WhatsAppProfilePreview />);
    expect(screen.getByTestId("number-setup-has-number-fields")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("number-setup-mode-has_app"));
    expect(screen.getByTestId("number-setup-has-app-fields")).toBeInTheDocument();
    expect(screen.queryByTestId("number-setup-has-number-fields")).not.toBeInTheDocument();
  });
});
