import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup2";
import { STORAGE_KEY } from "@/lib/metaSignupMock2";
import { toast } from "sonner";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// react-router-dom cannot be resolved by Jest in this project (its package.json
// "exports" map is ESM-only under Jest's default "node" condition). This page
// only needs MemoryRouter as a passthrough wrapper and Link rendered as a
// plain anchor — see e.g. BuilderTopbar.test.jsx for the same workaround.
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
  it("renders both columns and an exit-setup link back to /fastrr-engage-2", () => {
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-engage-account-setup")).toBeInTheDocument();
    expect(screen.getByTestId("setup-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByTestId("exit-setup-link")).toHaveAttribute("href", "/fastrr-engage-2");
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
      "/engage-2/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );

    window.localStorage.clear();
    openSpy.mockClear();
    fireEvent.click(screen.getByTestId("setup-cta-ai"));

    const storedAgain = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(storedAgain.brandName).toBe("Avimee");
    expect(storedAgain.phoneNumber).toBe("+91 98765 43210");
    expect(openSpy).toHaveBeenCalledWith(
      "/engage-2/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );

    openSpy.mockRestore();
  });

  it("shows an error toast when the popup is blocked", () => {
    jest.spyOn(window, "open").mockImplementation(() => null);
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId("setup-cta-manual"));
    expect(toast.error).toHaveBeenCalledWith(
      "Your browser blocked the signup popup. Please allow popups for this site and try again."
    );
  });
});
