import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup";
import { STORAGE_KEY } from "@/lib/metaSignupMock";

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("EngageAccountSetupPage", () => {
  it("renders both columns and an exit-setup link back to /fastrr-engage", () => {
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-engage-account-setup")).toBeInTheDocument();
    expect(screen.getByTestId("setup-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByTestId("exit-setup-link")).toHaveAttribute("href", "/fastrr-engage");
  });

  it("clicking either signup CTA writes the current form snapshot to localStorage and opens the signup popup", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    fireEvent.click(screen.getByTestId("setup-cta-manual"));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.brandName).toBe("Avimee");
    expect(stored.phoneNumber).toBe("+91 98765 43210");
    expect(openSpy).toHaveBeenCalledWith(
      "/engage/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );
    openSpy.mockRestore();
  });
});
