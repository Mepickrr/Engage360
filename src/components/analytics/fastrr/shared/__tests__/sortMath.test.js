import { nextSort, sortRows } from "../sortMath";

describe("nextSort", () => {
  test("clicking a new field sorts it descending first", () => {
    expect(nextSort({ field: "a", dir: "asc" }, "b")).toEqual({ field: "b", dir: "desc" });
  });
  test("clicking the active field toggles direction", () => {
    expect(nextSort({ field: "a", dir: "desc" }, "a")).toEqual({ field: "a", dir: "asc" });
  });
});

describe("sortRows", () => {
  const rows = [
    { id: 1, revenue: 100, sent: 50 },
    { id: 2, revenue: 300, sent: 10 },
    { id: 3, revenue: 100, sent: 90 },
  ];

  test("sorts ascending by the primary field", () => {
    const sorted = sortRows(rows, { field: "revenue", dir: "asc" });
    expect(sorted.map((r) => r.id)).toEqual([1, 3, 2]);
  });

  test("sorts descending by the primary field", () => {
    const sorted = sortRows(rows, { field: "revenue", dir: "desc" });
    expect(sorted.map((r) => r.id)).toEqual([2, 1, 3]);
  });

  test("breaks ties with the secondary field", () => {
    const sorted = sortRows(rows, { field: "revenue", dir: "desc" }, "sent");
    expect(sorted.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  test("does not mutate the input array", () => {
    const original = [...rows];
    sortRows(rows, { field: "revenue", dir: "desc" });
    expect(rows).toEqual(original);
  });
});
