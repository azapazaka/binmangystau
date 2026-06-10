import type { AiValidationStatus, ReviewStatus } from "@/types";

type ModeratorAiStatusMeta = {
  label: string;
  shortLabel: string;
  tone: string;
};

export function getModeratorAiStatusMeta(
  reviewStatus: ReviewStatus,
  aiValidationStatus: AiValidationStatus,
): ModeratorAiStatusMeta {
  switch (reviewStatus) {
    case "confirmed":
      return {
        label: "Проверка AI пройдена",
        shortLabel: "Проверка пройдена",
        tone: "bg-emerald-100 text-emerald-900",
      };
    case "corrected":
      return {
        label: "Нужно скорректировать решение AI",
        shortLabel: "Нужно скорректировать",
        tone: "bg-amber-100 text-amber-900",
      };
    case "invalidated":
      return {
        label: "AI не прошёл проверку",
        shortLabel: "AI не прошёл проверку",
        tone: "bg-rose-100 text-rose-900",
      };
    case "pending":
      if (aiValidationStatus === "unavailable") {
        return {
          label: "Оценка AI недоступна",
          shortLabel: "Нет оценки AI",
          tone: "bg-slate-100 text-slate-800",
        };
      }

      return {
        label: "Решение AI ожидает проверки модератора",
        shortLabel: "На проверке",
        tone: "bg-slate-100 text-slate-800",
      };
  }
}
