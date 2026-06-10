import type { ClusterRecord } from "@/types";

export type SeverityLevel = "low" | "medium" | "critical";

export const SEVERITY_LEVEL_META: Record<
  SeverityLevel,
  {
    label: string;
    shortLabel: string;
    color: string;
    glowColor: string;
    tone: string;
    description: string;
  }
> = {
  low: {
    label: "Низкий приоритет",
    shortLabel: "Низкий",
    color: "#24a36a",
    glowColor: "rgba(36, 163, 106, 0.36)",
    tone: "bg-emerald-100 text-emerald-900",
    description: "Наблюдение без критического риска, можно планировать в обычном цикле.",
  },
  medium: {
    label: "Средний приоритет",
    shortLabel: "Средний",
    color: "#f1b624",
    glowColor: "rgba(241, 182, 36, 0.38)",
    tone: "bg-amber-100 text-amber-900",
    description: "Точка требует внимания и должна попасть в ближайший рабочий план.",
  },
  critical: {
    label: "Критический приоритет",
    shortLabel: "Критичный",
    color: "#e14b3b",
    glowColor: "rgba(225, 75, 59, 0.42)",
    tone: "bg-rose-100 text-rose-900",
    description: "Высокий риск или накопленный дефект, нуждается в быстром ремонте.",
  },
};

export function getSeverityLevel(score: number): SeverityLevel {
  if (score >= 9) {
    return "critical";
  }

  if (score >= 5) {
    return "medium";
  }

  return "low";
}

export function getSeverityLevelSummary(clusters: ClusterRecord[]) {
  return clusters.reduce<Record<SeverityLevel, number>>(
    (summary, cluster) => {
      summary[getSeverityLevel(cluster.severity)] += 1;
      return summary;
    },
    {
      low: 0,
      medium: 0,
      critical: 0,
    },
  );
}
