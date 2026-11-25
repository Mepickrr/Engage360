import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BroadcastsPage from "@/pages/Broadcasts";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });

describe("BroadcastsPage", () => {
  it("Create broadcast button opens the broadcast builder", () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    fireEvent.click(screen.getByTestId("broadcasts-new-btn"));
    expect(mockNavigate).toHaveBeenCalledWith("/fastrr/broadcasts/builder/new");
  });

  it("shows the pre-send estimated spend under actual spend and in the drawer's audience section", () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    // 239,934 estimated audience x ₹0.15 (Utility rate at schedule time)
    expect(screen.getByTestId("broadcasts-est-spent-271606").textContent).toBe("Est. ₹35,990.10");
    fireEvent.click(screen.getByTestId("broadcasts-row-271606"));
    const est = within(screen.getByTestId("broadcast-detail-drawer")).getByTestId("broadcast-estimated-spend");
    expect(est.textContent).toContain("Total estimated spend");
    expect(est.textContent).toContain("₹35,990.10");
    expect(est.textContent).toContain("Utility rate");
  });

  it("opens the detail drawer with full stats when a broadcast row is clicked", () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    expect(screen.queryByTestId("broadcast-detail-drawer")).toBeNull();
    fireEvent.click(screen.getByTestId("broadcasts-row-271606"));
    const drawer = screen.getByTestId("broadcast-detail-drawer");
    const d = within(drawer);
    expect(drawer.textContent).toContain("Broadcast · 271606");
    expect(d.getByText("06_nov_diwali_copy_1")).toBeInTheDocument();
    expect(d.getByText("72.0% of Sent")).toBeInTheDocument();
    expect(d.getByText("59.4% of Delivered")).toBeInTheDocument();
    expect(d.getByText("4.0% of Read")).toBeInTheDocument();
    expect(d.getByText("63,379")).toBeInTheDocument();
    // Spend = delivered x rate per template: 44,262 x 0.15 + 1,18,583 x 0.85
    expect(d.getByTestId("broadcast-section-revenue").textContent).toContain("₹1,07,434.85");
    expect(d.getByText("Disabled")).toBeInTheDocument();
    expect(d.getByText("Shop Now & Save")).toBeInTheDocument();
    expect(d.getByText("View Offer")).toBeInTheDocument();
  });

  it("shows the Utility -> Marketing category change, side-by-side comparisons", () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    fireEvent.click(screen.getByTestId("broadcasts-row-271606"));
    const d = within(screen.getByTestId("broadcast-detail-drawer"));
    expect(d.getByTestId("broadcast-category-changed")).toBeInTheDocument();
    expect(d.getByTestId("broadcast-category-change-count").textContent).toContain("Changed 1×");
    expect(d.queryByTestId("broadcast-split-carousel")).toBeNull();
    expect(within(d.getByTestId("broadcast-split-compare")).getByTestId("compare-share-marketing").textContent).toBe("93.8% of spend");
    const compare = within(d.getByTestId("broadcast-split-compare"));
    expect(compare.getByTestId("compare-total-Sent count").textContent).toBe("2,26,210");
    expect(compare.getByTestId("compare-total-Delivered count").textContent).toBe("1,62,845");
    expect(compare.getByTestId("compare-total-Rate").textContent).toBe("");
    expect(compare.getByTestId("compare-total-Spent").textContent).toBe("₹1,07,434.85");
    expect(d.queryByText(/After re-categorisation/)).toBeNull();
    // preview tables stay two-column
    expect(within(d.getByTestId("broadcast-preview-compare-utility")).queryByTestId("compare-total-Spent")).toBeNull();
    expect(d.getByTestId("broadcast-preview-compare-utility")).toBeInTheDocument();
    expect(d.getByTestId("broadcast-preview-compare-marketing")).toBeInTheDocument();
  });

  it("shows a single-column comparison and no change badge when the category never changed", () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    fireEvent.click(screen.getByTestId("broadcasts-row-271544"));
    const d = within(screen.getByTestId("broadcast-detail-drawer"));
    expect(d.queryByTestId("broadcast-category-changed")).toBeNull();
    const compare = d.getByTestId("broadcast-split-compare");
    expect(compare.textContent).toContain("Marketing");
    expect(within(compare).queryByTestId("compare-total-Spent")).toBeNull();
  });

  it("lists broadcasts in a table with the wireframe columns and filters by search and category change", () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toEqual([
      "Broadcast", "Channel", "Status", "Sent", "Delivered", "Read", "Clicked",
      "Orders", "Revenue", "Spent", "ROI", "Actions",
    ]);
    expect(screen.getAllByTestId(/^broadcasts-row-/)).toHaveLength(5);

    fireEvent.click(screen.getByTestId("broadcasts-filter-changed"));
    expect(screen.getAllByTestId(/^broadcasts-row-/).map((el) => el.dataset.testid)).toEqual([
      "broadcasts-row-271606",
      "broadcasts-row-271355",
    ]);

    fireEvent.click(screen.getByTestId("broadcasts-filter-all"));
    fireEvent.change(screen.getByTestId("broadcasts-search"), { target: { value: "cart_reminder" } });
    expect(screen.getAllByTestId(/^broadcasts-row-/)).toHaveLength(1);
    expect(screen.getByTestId("broadcasts-row-271489")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("broadcasts-search"), { target: { value: "zzz" } });
    expect(screen.getByText("No broadcasts match your search.")).toBeInTheDocument();
  });

  it("shows a spent info icon only for category-changed broadcasts, revealing the Utility/Marketing split", async () => {
    render(<MemoryRouter><BroadcastsPage /></MemoryRouter>);
    expect(screen.getByTestId("broadcasts-spent-271606").textContent).toContain("₹1,07,434.85");
    expect(screen.queryByTestId("broadcasts-spent-info-271544")).toBeNull();
    expect(screen.getByTestId("broadcasts-spent-info-271355")).toBeInTheDocument();

    fireEvent.focus(screen.getByTestId("broadcasts-spent-info-271606"));
    const split = (await screen.findAllByTestId("broadcasts-spent-split-271606"))[0];
    expect(split.textContent).toContain("₹6,639.30");
    expect(split.textContent).toContain("₹1,00,795.55");
    expect(within(split).getByTestId("broadcasts-spent-share-271606-utility").textContent).toBe("6.2%");
    expect(within(split).getByTestId("broadcasts-spent-share-271606-marketing").textContent).toBe("93.8%");
    // clicking the icon must not open the drawer
    fireEvent.click(screen.getByTestId("broadcasts-spent-info-271606"));
    expect(screen.queryByTestId("broadcast-detail-drawer")).toBeNull();
  });
});
