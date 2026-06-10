import { describe, expect, it } from "vitest";

import { calculateSeverity, CATEGORY_WEIGHTS } from "@/lib/severity";

describe("calculateSeverity", () => {
  it("calculates score using report count, category weight, and zone coefficient", () => {
    expect(
      calculateSeverity({
        reportCount: 14,
        category: "road",
        zoneCoefficient: 1.5,
      }),
    ).toBe(63);
  });

  it("uses the configured category weight for each category", () => {
    expect(CATEGORY_WEIGHTS.road).toBe(3);
    expect(CATEGORY_WEIGHTS.light).toBe(2.5);
    expect(CATEGORY_WEIGHTS.traffic).toBe(2);
    expect(CATEGORY_WEIGHTS.trash).toBe(1.5);
    expect(CATEGORY_WEIGHTS.other).toBe(1);
  });

  it("rounds to two decimal places for non-integer results", () => {
    expect(
      calculateSeverity({
        reportCount: 3,
        category: "trash",
        zoneCoefficient: 1.2,
      }),
    ).toBe(5.4);
  });

  it("defaults to a neutral zone coefficient when one is not provided", () => {
    expect(
      calculateSeverity({
        reportCount: 2,
        category: "light",
      }),
    ).toBe(5);
  });
});
