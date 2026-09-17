import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup2";
import { STORAGE_KEY } from "@/lib/metaSignupMock2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
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
  mockNavigate.mockClear();
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

  it("clicking either signup CTA writes the current form snapshot to localStorage and navigates to Meta Embedded Signup in-tab", () => {
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
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/meta-embedded-signup");

    window.localStorage.clear();
    mockNavigate.mockClear();
    fireEvent.click(screen.getByTestId("setup-cta-ai"));

    const storedAgain = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(storedAgain.brandName).toBe("Avimee");
    expect(storedAgain.phoneNumber).toBe("+91 98765 43210");
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/meta-embedded-signup");
  });
});
