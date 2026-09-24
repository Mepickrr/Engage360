import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MetaEmbeddedSignup from "../MetaEmbeddedSignup2";
import { writeSignupPayload } from "@/lib/metaSignupMock2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  mockNavigate.mockClear();
});

afterEach(() => {
  delete window.opener;
});

describe("MetaEmbeddedSignup", () => {
  it("renders the intro step by default inside the Meta top bar chrome", () => {
    render(<MetaEmbeddedSignup />);
    expect(screen.getByTestId("page-meta-embedded-signup")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("intro-step")).toBeInTheDocument();
  });

  it("advances through steps 1-3 via Continue/Next, swapping to the FB Login chrome at step 4", () => {
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    expect(screen.getByTestId("phone-number-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("phone-number-next"));
    expect(screen.getByTestId("verify-phone-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("verify-phone-next"));
    expect(screen.getByTestId("select-assets-step")).toBeInTheDocument();
    expect(screen.getByTestId("fb-login-window-chrome")).toBeInTheDocument();
  });

  it("Back on the phone number step returns to the intro step", () => {
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-back"));
    expect(screen.getByTestId("intro-step")).toBeInTheDocument();
  });

  it("the connecting step auto-advances to the email verify step", () => {
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    expect(screen.getByTestId("connecting-step")).toBeInTheDocument();
    jest.advanceTimersByTime(1500);
    expect(screen.getByTestId("email-verify-step")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("reaches the success step after email verify, back in the Meta top bar chrome, and Finish (no opener) navigates to /fastrr-journey-2", () => {
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    jest.advanceTimersByTime(1500);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    expect(screen.getByTestId("success-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("success-finish"));
    expect(mockNavigate).toHaveBeenCalledWith("/fastrr-journey-2");
    expect(window.sessionStorage.getItem("fastrrJourney2Welcome")).toBe("1");
    jest.useRealTimers();
  });

  it("Finish (with an opener) redirects the opener tab, closes this popup, and sets the welcome flag on the opener's own storage", () => {
    const closeSpy = jest.spyOn(window, "close").mockImplementation(() => {});
    const fakeOpener = { location: { href: "" }, sessionStorage: window.sessionStorage };
    Object.defineProperty(window, "opener", {
      value: fakeOpener,
      configurable: true,
    });
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    jest.advanceTimersByTime(1500);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    fireEvent.click(screen.getByTestId("success-finish"));
    expect(fakeOpener.location.href).toBe("/fastrr-journey-2");
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(fakeOpener.sessionStorage.getItem("fastrrJourney2Welcome")).toBe("1");
    closeSpy.mockRestore();
    jest.useRealTimers();
  });

  it("Cancel (no opener) navigates to account setup instead of the journey dashboard", () => {
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/setup");
  });

  it("Cancel (with an opener) just closes the popup, without redirecting to the journey dashboard", () => {
    const closeSpy = jest.spyOn(window, "close").mockImplementation(() => {});
    const fakeOpener = { location: { href: "" } };
    Object.defineProperty(window, "opener", {
      value: fakeOpener,
      configurable: true,
    });
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-cancel"));
    expect(fakeOpener.location.href).toBe("");
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.mockRestore();
  });

  it("prefills the phone number from a payload written to localStorage before mount", () => {
    writeSignupPayload({
      brandName: "Avimee",
      category: "Ecommerce",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      phoneNumber: "+91 98765 43210",
    });
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    expect(screen.getByTestId("phone-number-input")).toHaveValue("98765 43210");
  });
});
