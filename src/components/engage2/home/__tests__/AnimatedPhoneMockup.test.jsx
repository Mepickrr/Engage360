import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import AnimatedPhoneMockup, {
  useHeroPlayer,
  SCENE_CHECKOUT,
  SCENE_EXIT_INTENT,
  SCENE_LOCKSCREEN,
  SCENE_NOTIFICATION,
  SCENE_WHATSAPP,
  SCENE_RESTORED,
  SCENE_DONE,
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
  it("renders the phone frame with the checkout screen for SCENE_CHECKOUT", () => {
    render(<AnimatedPhoneMockup scene={SCENE_CHECKOUT} />);
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("phone-phase-checkout")).toBeInTheDocument();
  });

  it("overlays the exit-intent sheet only for SCENE_EXIT_INTENT", () => {
    render(<AnimatedPhoneMockup scene={SCENE_EXIT_INTENT} />);
    expect(screen.getByTestId("phone-phase-checkout")).toBeInTheDocument();
    expect(screen.getByTestId("phone-exit-intent-sheet")).toBeInTheDocument();
  });

  it("renders the lock screen without a notification for SCENE_LOCKSCREEN", () => {
    render(<AnimatedPhoneMockup scene={SCENE_LOCKSCREEN} />);
    expect(screen.getByTestId("phone-phase-lockscreen")).toBeInTheDocument();
    expect(screen.queryByTestId("phone-lock-notification")).not.toBeInTheDocument();
  });

  it("drops in the notification card for SCENE_NOTIFICATION", () => {
    render(<AnimatedPhoneMockup scene={SCENE_NOTIFICATION} />);
    expect(screen.getByTestId("phone-lock-notification")).toBeInTheDocument();
  });

  it("renders the WhatsApp screen for SCENE_WHATSAPP", () => {
    render(<AnimatedPhoneMockup scene={SCENE_WHATSAPP} />);
    expect(screen.getByTestId("phone-phase-whatsapp")).toBeInTheDocument();
  });

  it("shows the confirming-payment spinner only once paying is true", () => {
    const { rerender } = render(<AnimatedPhoneMockup scene={SCENE_RESTORED} paying={false} />);
    expect(screen.queryByTestId("phone-paying")).not.toBeInTheDocument();
    rerender(<AnimatedPhoneMockup scene={SCENE_RESTORED} paying={true} />);
    expect(screen.getByTestId("phone-paying")).toBeInTheDocument();
  });

  it("renders the order-confirmed screen for SCENE_DONE", () => {
    render(<AnimatedPhoneMockup scene={SCENE_DONE} />);
    expect(screen.getByTestId("phone-phase-done")).toBeInTheDocument();
  });
});

describe("useHeroPlayer", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("starts at SCENE_CHECKOUT and advances to SCENE_EXIT_INTENT after the first scene's duration", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useHeroPlayer());
    expect(result.current.scene).toBe(SCENE_CHECKOUT);
    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(result.current.scene).toBe(SCENE_EXIT_INTENT);
    jest.useRealTimers();
  });

  it("jump() moves straight to the requested scene and resets its beats", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useHeroPlayer());
    act(() => {
      result.current.jump(SCENE_RESTORED);
    });
    expect(result.current.scene).toBe(SCENE_RESTORED);
    expect(result.current.paying).toBe(false);
    jest.useRealTimers();
  });

  it("toggle() pauses the player so the scene stops advancing", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useHeroPlayer());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.paused).toBe(true);
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current.scene).toBe(SCENE_CHECKOUT);
    jest.useRealTimers();
  });

  it("freezes on SCENE_WHATSAPP and starts no timer when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    jest.useFakeTimers();
    const { result } = renderHook(() => useHeroPlayer());
    expect(result.current.scene).toBe(SCENE_WHATSAPP);
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current.scene).toBe(SCENE_WHATSAPP);
    jest.useRealTimers();
  });
});
