import { findActiveSectionId } from "../scrollSpy";

describe("findActiveSectionId", () => {
  const sections = [
    { id: "hero", top: 0 },
    { id: "funnel", top: 800 },
    { id: "engagement", top: 1600 },
  ];

  test("defaults to the first section at the top of the page", () => {
    expect(findActiveSectionId(sections, 0)).toBe("hero");
  });

  test("switches to the next section once scrolled past its offset top", () => {
    expect(findActiveSectionId(sections, 700, 96)).toBe("hero");
    expect(findActiveSectionId(sections, 705, 96)).toBe("funnel");
  });

  test("picks the last section whose top has been reached", () => {
    expect(findActiveSectionId(sections, 5000, 96)).toBe("engagement");
  });
});
