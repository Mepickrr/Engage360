import { listSegments, createSegment } from "../segmentsData";

describe("segmentsData creationMethod", () => {
  test("existing seed segments default to filter-based creation", () => {
    const segments = listSegments();
    const seedFilterSegments = segments.filter((s) => s.id.startsWith("seg_") && Number(s.id.split("_")[1]) <= 6);
    expect(seedFilterSegments.length).toBeGreaterThan(0);
    seedFilterSegments.forEach((s) => expect(s.creationMethod).toBe("filter"));
  });

  test("seeds include at least two csv-created segments", () => {
    const segments = listSegments();
    const csvSegments = segments.filter((s) => s.creationMethod === "csv");
    expect(csvSegments.length).toBeGreaterThanOrEqual(2);
    expect(csvSegments.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Diwali excel import", "Store loyalty list Q2"]),
    );
  });

  test("createSegment defaults creationMethod to filter", () => {
    const seg = createSegment({ name: "Test seg", audience: { include: { blocks: [], blocksCombinator: "AND" }, exclude_enabled: false, exclude: { blocks: [], blocksCombinator: "AND" } } });
    expect(seg.creationMethod).toBe("filter");
  });

  test("createSegment accepts an explicit creationMethod", () => {
    const seg = createSegment({
      name: "CSV test seg",
      audience: { include: { blocks: [], blocksCombinator: "AND" }, exclude_enabled: false, exclude: { blocks: [], blocksCombinator: "AND" } },
      creationMethod: "csv",
    });
    expect(seg.creationMethod).toBe("csv");
  });
});
