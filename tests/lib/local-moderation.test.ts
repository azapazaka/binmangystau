import { describe, expect, it } from "vitest";

import { assessReportModeration } from "@/lib/local-moderation";

describe("local report moderation", () => {
  it("accepts a clear city problem description", () => {
    expect(
      assessReportModeration({
        category: "road",
        description: "Большая яма на дороге возле остановки на проспекте Абая",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "accepted",
      suggestedCategory: "road",
    });
  });

  it("asks the citizen to retry when the description is too weak", () => {
    expect(
      assessReportModeration({
        category: "light",
        description: "не работает",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "retry",
    });
  });

  it("accepts plain-language road complaints about poor driving conditions", () => {
    expect(
      assessReportModeration({
        category: "road",
        description: "дороги слишком плохие для нормальной езды",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "accepted",
      suggestedCategory: "road",
    });
  });

  it("accepts plain-language lighting complaints", () => {
    expect(
      assessReportModeration({
        category: "light",
        description: "очень темно во дворе, фонарь не горит",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "accepted",
      suggestedCategory: "light",
    });
  });

  it("accepts plain-language trash complaints about overflowing bins", () => {
    expect(
      assessReportModeration({
        category: "trash",
        description: "переполнены баки во дворе",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "accepted",
      suggestedCategory: "trash",
    });
  });

  it("accepts plain-language traffic complaints", () => {
    expect(
      assessReportModeration({
        category: "traffic",
        description: "светофор работает неправильно на перекрестке",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "accepted",
      suggestedCategory: "traffic",
    });
  });

  it("suggests a different category when the text mismatches the selected one", () => {
    expect(
      assessReportModeration({
        category: "trash",
        description: "Светофор на перекрестке мигает и не регулирует движение",
        moderationAttemptCount: 1,
      }),
    ).toMatchObject({
      decision: "retry",
      suggestedCategory: "traffic",
    });
  });

  it("hard rejects the third invalid attempt", () => {
    expect(
      assessReportModeration({
        category: "road",
        description: "Это моя кухня и холодильник дома",
        moderationAttemptCount: 3,
      }),
    ).toMatchObject({
      decision: "rejected",
    });
  });
});
