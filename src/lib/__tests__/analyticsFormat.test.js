import { formatCompactCurrency, formatCompactNumber, formatDelta, formatPercent, formatSeconds } from "../analyticsFormat";

describe("formatCompactCurrency", () => {
  test("formats crores", () => {
    expect(formatCompactCurrency(21000000)).toBe("₹2.1C");
  });
  test("formats lakhs", () => {
    expect(formatCompactCurrency(3610000)).toBe("₹36.1L");
  });
  test("formats thousands", () => {
    expect(formatCompactCurrency(95518)).toBe("₹95.5K");
  });
  test("formats small values with no suffix", () => {
    expect(formatCompactCurrency(449)).toBe("₹449");
  });
});

describe("formatCompactNumber", () => {
  test("formats thousands with K suffix", () => {
    expect(formatCompactNumber(24550)).toBe("24.55K");
  });
  test("formats sub-thousand values as-is", () => {
    expect(formatCompactNumber(155)).toBe("155");
  });
  test("does not lose precision on floating-point-unfriendly values", () => {
    expect(formatCompactNumber(1005)).toBe("1.01K");
  });
});

describe("formatDelta", () => {
  test("positive delta uses up arrow and positive tone", () => {
    const result = formatDelta(8, 1535000, formatCompactCurrency);
    expect(result.text).toBe("↑ 8% (+₹15.35L)");
    expect(result.tone).toBe("positive");
  });
  test("negative delta uses down arrow and negative tone", () => {
    const result = formatDelta(-5, -900, formatCompactNumber);
    expect(result.text).toBe("↓ 5% (-900)");
    expect(result.tone).toBe("negative");
  });
});

describe("formatPercent", () => {
  test("formats with one decimal by default", () => {
    expect(formatPercent(26.345)).toBe("26.3%");
  });
  test("respects a custom digit count", () => {
    expect(formatPercent(26.345, 0)).toBe("26%");
  });
});

describe("formatSeconds", () => {
  test("formats sub-minute durations as seconds only", () => {
    expect(formatSeconds(45)).toBe("45s");
  });
  test("formats minutes and seconds", () => {
    expect(formatSeconds(125)).toBe("2m 5s");
  });
  test("rounds fractional seconds before formatting", () => {
    expect(formatSeconds(59.6)).toBe("1m 0s");
  });
});
