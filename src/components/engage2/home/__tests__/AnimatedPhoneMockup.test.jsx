import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import AnimatedPhoneMockup, {
  usePhonePhase,
  PHASE_CHECKOUT,
  PHASE_LOCKSCREEN,
  PHASE_WHATSAPP,
} from "../AnimatedPhoneMockup";

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

describe("AnimatedPhoneMockup (presentational)", () => {
  it("renders the phone frame with the screen matching the given phase", () => {
    render(<AnimatedPhoneMockup phase={PHASE_CHECKOUT} />);
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("phone-phase-checkout")).toBeInTheDocument();
  });

  it("renders the WhatsApp screen when phase is PHASE_WHATSAPP", () => {
    render(<AnimatedPhoneMockup phase={PHASE_WHATSAPP} />);
    expect(screen.getByTestId("phone-phase-whatsapp")).toBeInTheDocument();
  });
});

describe("usePhonePhase", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("starts at PHASE_CHECKOUT and advances to PHASE_LOCKSCREEN after the first phase's duration", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePhonePhase());
    expect(result.current).toBe(PHASE_CHECKOUT);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    expect(result.current).toBe(PHASE_LOCKSCREEN);
    jest.useRealTimers();
  });

  it("freezes on PHASE_WHATSAPP and starts no timer when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    jest.useFakeTimers();
    const { result } = renderHook(() => usePhonePhase());
    expect(result.current).toBe(PHASE_WHATSAPP);
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current).toBe(PHASE_WHATSAPP);
    jest.useRealTimers();
  });
});
