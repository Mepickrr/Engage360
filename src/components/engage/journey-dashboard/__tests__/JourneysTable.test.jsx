import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import JourneysTable from "../JourneysTable";
import { JOURNEYS } from "../data";

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));
import { previewToast } from "@/components/common/PreviewHeader";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderTable(overrides = {}) {
  const props = {
    journeys: JOURNEYS,
    enabledMap: {},
    onToggle: jest.fn(),
    onPreview: jest.fn(),
    ...overrides,
  };
  render(<JourneysTable {...props} />);
  return props;
}

describe("JourneysTable", () => {
  it("renders all 6 journeys with their audience badges", () => {
    renderTable();
    JOURNEYS.forEach((j) => {
      expect(screen.getByTestId(`journey-row-${j.id}`)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Known").length).toBe(3);
    expect(screen.getAllByText("Fastrr Identified").length).toBe(3);
  });

  it("shows metrics as — when a journey is disabled and 0 when enabled", () => {
    const id = JOURNEYS[0].id;
    const { rerender } = render(
      <JourneysTable journeys={JOURNEYS} enabledMap={{}} onToggle={() => {}} onPreview={() => {}} />
    );
    const disabledRow = screen.getByTestId(`journey-row-${id}`);
    expect(within(disabledRow).getAllByText("—").length).toBeGreaterThan(0);

    rerender(
      <JourneysTable journeys={JOURNEYS} enabledMap={{ [id]: true }} onToggle={() => {}} onPreview={() => {}} />
    );
    const enabledRow = screen.getByTestId(`journey-row-${id}`);
    expect(within(enabledRow).getAllByText("0").length).toBe(6);
    expect(within(enabledRow).getByText("Active")).toBeInTheDocument();
  });

  it("clicking a row's toggle calls onToggle with its id", () => {
    const props = renderTable();
    fireEvent.click(screen.getByTestId(`journey-toggle-${JOURNEYS[0].id}`));
    expect(props.onToggle).toHaveBeenCalledWith(JOURNEYS[0].id);
  });

  it("clicking a row's preview icon calls onPreview with its id", () => {
    const props = renderTable();
    fireEvent.click(screen.getByTestId(`journey-preview-${JOURNEYS[0].id}`));
    expect(props.onPreview).toHaveBeenCalledWith(JOURNEYS[0].id);
  });
});

describe.each([
  "View Analytics",
  "Download Order Report",
  "Download Error Report",
  "Download Conversation Report",
  "View All Chat",
])("kebab menu item %s", (label) => {
  it("calls previewToast when clicked", () => {
    previewToast.mockClear();
    renderTable();
    fireEvent.click(screen.getByTestId(`journey-menu-${JOURNEYS[0].id}`));
    fireEvent.click(screen.getByText(label));
    expect(previewToast).toHaveBeenCalledTimes(1);
  });
});
