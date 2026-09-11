import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FastrrJourneyPage from "../FastrrJourney";
import { JOURNEYS } from "@/components/engage/journey-dashboard/data";

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

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("FastrrJourneyPage", () => {
  it("does not show the welcome modal on a normal visit", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("shows the welcome modal when arriving fresh from signup, and consumes the flag so it won't reappear", () => {
    window.sessionStorage.setItem("fastrrJourneyWelcome", "1");
    const { unmount } = render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("fastrrJourneyWelcome")).toBeNull();
    unmount();

    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("renders the header, stats row, and journeys table together", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-fastrr-journey")).toBeInTheDocument();
    expect(screen.getByTestId("journey-header")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stats-row")).toBeInTheDocument();
    expect(screen.getByTestId("journeys-table")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("0 / 6");
  });

  it("toggling a row via the table updates the stats row's active count", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId(`journey-toggle-${JOURNEYS[0].id}`));
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("1 / 6");
  });

  it("opening the preview modal and clicking Activate Now activates the journey and updates the stats row", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId(`journey-preview-${JOURNEYS[1].id}`));
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("1 / 6");
  });
});
