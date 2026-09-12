import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileDetailsModal from "../ProfileDetailsModal";
import { writeSignupPayload, MOCK_WABA_ID } from "@/lib/metaSignupMock2";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("ProfileDetailsModal", () => {
  it("renders nothing when closed", () => {
    render(<ProfileDetailsModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("profile-details-modal")).not.toBeInTheDocument();
  });

  it("prefills the profile preview from the signup payload, plus the assigned WABA ID", () => {
    writeSignupPayload({
      brandName: "Avimee",
      category: "Ecommerce",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      phoneNumber: "+91 98765 43210",
    });
    render(<ProfileDetailsModal open={true} onClose={() => {}} />);

    expect(screen.getByTestId("profile-details-modal")).toBeInTheDocument();
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Avimee");
    expect(screen.getByTestId("field-website")).toHaveValue("https://avimee.com");
    expect(screen.getByTestId("field-email")).toHaveValue("hi@avimee.com");
    expect(screen.getByTestId("number-setup-phone-input")).toHaveValue("98765 43210");
    expect(screen.getByTestId("field-waba-id")).toHaveTextContent(MOCK_WABA_ID);
  });

  it("the profile fields are editable", () => {
    render(<ProfileDetailsModal open={true} onClose={() => {}} />);
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "New Brand" } });
    expect(screen.getByTestId("field-brand-name")).toHaveValue("New Brand");

    fireEvent.change(screen.getByTestId("field-description"), {
      target: { value: "We sell skincare." },
    });
    expect(screen.getByTestId("field-description")).toHaveValue("We sell skincare.");
  });
});
