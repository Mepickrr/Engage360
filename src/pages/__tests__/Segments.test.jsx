import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

import SegmentsPage from "../Segments";

describe("SegmentsPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders the top bar, KPI strip, and defaults to All segments tab (no opportunity carousel there)", () => {
    render(<SegmentsPage />);
    expect(screen.getByText("Segment management")).toBeInTheDocument();
    expect(screen.getByTestId("segments-new-btn")).toBeInTheDocument();
    expect(screen.getByTestId("all-segments-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("opportunity-carousel")).not.toBeInTheDocument();
  });

  test("switching tabs renders the corresponding tab body, opportunity carousel only under Fastrr Signals", () => {
    render(<SegmentsPage />);
    // Radix's TabsTrigger activates on mousedown (not click), so a real user
    // click — which always fires mousedown before click — is simulated with
    // fireEvent.mouseDown here; fireEvent.click alone never reaches jsdom's
    // synthetic mousedown/focus path and the tab would never switch.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Fastrr Signals/ }));
    expect(screen.getByTestId("fastrr-signals-tab")).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-carousel")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: /Custom segments/ }));
    expect(screen.getByTestId("custom-segments-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("opportunity-carousel")).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: /Shopify segments/ }));
    expect(screen.getByTestId("shopify-segments-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("opportunity-carousel")).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: /Suppression assets/ }));
    expect(screen.getByTestId("suppression-assets-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("opportunity-carousel")).not.toBeInTheDocument();
  });

  test("+ New Segment opens NewSegmentModal, and 'Create Segment via filters' navigates to the builder", () => {
    render(<SegmentsPage />);
    fireEvent.click(screen.getByTestId("segments-new-btn"));
    expect(screen.getByTestId("new-segment-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("new-segment-option-filters"));
    expect(mockNavigate).toHaveBeenCalledWith("/segments/builder/new");
    expect(screen.queryByTestId("new-segment-modal")).not.toBeInTheDocument();
  });

  test("+ New Segment then 'Upload CSV' opens the ImportSegmentCsvModal instead", () => {
    render(<SegmentsPage />);
    fireEvent.click(screen.getByTestId("segments-new-btn"));
    fireEvent.click(screen.getByTestId("new-segment-option-csv"));
    expect(screen.queryByTestId("new-segment-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("import-csv-modal")).toBeInTheDocument();
  });

  test("creating a CSV segment lands on Custom segments with the CSV Upload sub-tab active", () => {
    render(<SegmentsPage />);
    fireEvent.click(screen.getByTestId("segments-new-btn"));
    fireEvent.click(screen.getByTestId("new-segment-option-csv"));

    fireEvent.change(screen.getByTestId("import-csv-name-input"), { target: { value: "Diwali giftees" } });
    const file = new File(["a,b\n1,2"], "customers.csv", { type: "text/csv" });
    fireEvent.change(screen.getByTestId("import-csv-file-input"), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId("import-csv-create-btn"));

    expect(screen.queryByTestId("import-csv-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("custom-segments-tab")).toBeInTheDocument();
    expect(screen.getByTestId("custom-toggle-csv")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Diwali giftees")).toBeInTheDocument();
  });

  test("search box filters the active tab's cards", () => {
    render(<SegmentsPage />);
    fireEvent.change(screen.getByTestId("segments-search-input"), { target: { value: "champions" } });
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
  });

  test("page contains no BIK or Avimee strings", () => {
    const { container } = render(<SegmentsPage />);
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
