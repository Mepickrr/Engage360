import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SortableTable from "../SortableTable";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "revenue", label: "Revenue", formatter: (v) => `₹${v}` },
];
const ROWS = [
  { id: "a", name: "Journey A", revenue: 100 },
  { id: "b", name: "Journey B", revenue: 300 },
  { id: "c", name: "Journey C", revenue: 200 },
];

describe("SortableTable", () => {
  test("renders rows sorted by the default sort, applying column formatters", () => {
    render(<SortableTable testId="tbl" columns={COLUMNS} rows={ROWS} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" />);
    const rows = screen.getAllByTestId(/^tbl-row-/);
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["tbl-row-b", "tbl-row-c", "tbl-row-a"]);
    expect(screen.getByTestId("tbl-row-b")).toHaveTextContent("₹300");
  });

  test("clicking a column header re-sorts", () => {
    render(<SortableTable testId="tbl" columns={COLUMNS} rows={ROWS} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" />);
    fireEvent.click(screen.getByTestId("tbl-sort-revenue"));
    const rows = screen.getAllByTestId(/^tbl-row-/);
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["tbl-row-a", "tbl-row-c", "tbl-row-b"]);
  });

  test("caps displayed rows at maxRows and shows a disabled view-all stub", () => {
    render(<SortableTable testId="tbl" columns={COLUMNS} rows={ROWS} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" maxRows={2} />);
    expect(screen.getAllByTestId(/^tbl-row-/)).toHaveLength(2);
    expect(screen.getByTestId("tbl-view-all")).toBeDisabled();
  });
});
