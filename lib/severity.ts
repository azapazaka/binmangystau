import type { ReportCategory } from "@/types";

export const CATEGORY_WEIGHTS: Record<ReportCategory, number> = {
  road: 3,
  light: 2.5,
  traffic: 2,
  trash: 1.5,
  other: 1,
};

type SeverityInput = {
  reportCount: number;
  category: ReportCategory;
  zoneCoefficient?: number;
};

export function calculateSeverity({
  reportCount,
  category,
  zoneCoefficient = 1,
}: SeverityInput) {
  const rawScore = reportCount * CATEGORY_WEIGHTS[category] * zoneCoefficient;

  return Math.round(rawScore * 100) / 100;
}
