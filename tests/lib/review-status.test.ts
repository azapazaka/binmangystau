import { describe, expect, it } from "vitest";

import { getModeratorAiStatusMeta } from "@/lib/review-status";

describe("getModeratorAiStatusMeta", () => {
  it("shows a failed review label when moderator marks AI as invalidated", () => {
    const meta = getModeratorAiStatusMeta("invalidated", "valid");

    expect(meta.shortLabel).toBe("AI не прошёл проверку");
    expect(meta.tone).toBe("bg-rose-100 text-rose-900");
  });

  it("shows a correction label when moderator adjusts the AI decision", () => {
    const meta = getModeratorAiStatusMeta("corrected", "valid");

    expect(meta.shortLabel).toBe("Нужно скорректировать");
    expect(meta.tone).toBe("bg-amber-100 text-amber-900");
  });

  it("shows a review passed label when moderator confirms the AI decision", () => {
    const meta = getModeratorAiStatusMeta("confirmed", "uncertain");

    expect(meta.shortLabel).toBe("Проверка пройдена");
    expect(meta.tone).toBe("bg-emerald-100 text-emerald-900");
  });

  it("keeps pending reports in review state until moderator checks them", () => {
    const meta = getModeratorAiStatusMeta("pending", "valid");

    expect(meta.shortLabel).toBe("На проверке");
    expect(meta.tone).toBe("bg-slate-100 text-slate-800");
  });
});
