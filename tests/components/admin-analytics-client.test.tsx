import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AdminAnalyticsClient } from "@/components/admin-analytics-client";
import type { AdminAnalyticsViewModel } from "@/lib/admin-analytics";

const baseModel: AdminAnalyticsViewModel = {
  kpis: {
    totalReports: { label: "Всего заявок", value: 24, note: "Все обращения в системе" },
    activeClusters: { label: "Активные кластеры", value: 8, note: "Открыто или в работе" },
    resolvedClusters: { label: "Закрытые", value: 5, note: "Уже отработано операторами" },
    averageSeverity: {
      label: "Средняя нагрузка",
      value: "3.2",
      note: "Средняя нагрузка по кластерам",
    },
  },
  timeline: [
    { date: "2026-03-27", label: "27.03", count: 2 },
    { date: "2026-03-28", label: "28.03", count: 3 },
    { date: "2026-03-29", label: "29.03", count: 5 },
    { date: "2026-03-30", label: "30.03", count: 4 },
    { date: "2026-03-31", label: "31.03", count: 7 },
    { date: "2026-04-01", label: "01.04", count: 6 },
    { date: "2026-04-02", label: "02.04", count: 4 },
  ],
  categories: [
    { key: "road", label: "Дороги", color: "#d94f3d", value: 8, share: 0.4 },
    { key: "trash", label: "Мусор", color: "#2f8a57", value: 6, share: 0.3 },
    { key: "light", label: "Освещение", color: "#d2a22d", value: 4, share: 0.2 },
    { key: "traffic", label: "Трафик", color: "#2563eb", value: 2, share: 0.1 },
    { key: "other", label: "Другое", color: "#64748b", value: 0, share: 0 },
  ],
  statuses: [
    { key: "open", label: "Открыто", value: 4, share: 0.4, tone: "bg-rose-100 text-rose-900" },
    {
      key: "in_progress",
      label: "В работе",
      value: 3,
      share: 0.3,
      tone: "bg-amber-100 text-amber-900",
    },
    {
      key: "closed",
      label: "Закрыто",
      value: 3,
      share: 0.3,
      tone: "bg-emerald-100 text-emerald-900",
    },
  ],
  districts: [
    { district: "Медеуский район", value: 5, share: 0.5 },
    { district: "Бостандыкский район", value: 3, share: 0.3 },
    { district: "Алмалинский район", value: 2, share: 0.2 },
  ],
  severity: [
    { clusterId: "c1", address: "Абая 10", severity: 4.8, category: "road" },
    { clusterId: "c2", address: "Сатпаева 12", severity: 3.9, category: "light" },
  ],
  highlights: {
    topCategory: "Дороги",
    topDistrict: "Медеуский район",
    hottestCluster: "Абая 10",
    closureRate: "30%",
  },
};

describe("AdminAnalyticsClient", () => {
  it("renders the balanced analytics layout without extra focus cards", () => {
    render(<AdminAnalyticsClient model={baseModel} />);

    expect(screen.getByRole("heading", { name: "Аналитика оператора" })).toBeInTheDocument();
    expect(screen.getByText("Динамика обращений")).toBeInTheDocument();
    expect(screen.getByText("Структура обращений")).toBeInTheDocument();
    expect(screen.getByText("Районы и приоритет")).toBeInTheDocument();
    expect(screen.queryByText("Фокус статуса")).not.toBeInTheDocument();
    expect(screen.queryByText("Фокус района")).not.toBeInTheDocument();
  });

  it("supports period controls for the main timeline", async () => {
    const user = userEvent.setup();

    render(<AdminAnalyticsClient model={baseModel} />);

    await user.click(screen.getByRole("button", { name: "30 дней" }));
    expect(screen.getByRole("button", { name: "30 дней" })).toHaveAttribute("data-active", "true");
  });

  it("shows static category and district data blocks", () => {
    render(<AdminAnalyticsClient model={baseModel} />);

    expect(screen.getByText("Категории")).toBeInTheDocument();
    expect(screen.getByText("Статусы")).toBeInTheDocument();
    expect(screen.getByText("Распределение по районам")).toBeInTheDocument();
    expect(screen.getByText("Приоритетные точки")).toBeInTheDocument();
    expect(screen.getAllByText("Мусор").length).toBeGreaterThan(0);
    expect(screen.getByText("Бостандыкский район")).toBeInTheDocument();
  });

  it("shows graceful empty states when analytics is empty", () => {
    render(
      <AdminAnalyticsClient
        model={{
          ...baseModel,
          timeline: [],
          districts: [],
          severity: [],
        }}
      />,
    );

    expect(screen.getByText("Пока недостаточно данных для графика")).toBeInTheDocument();
    expect(screen.getByText("Районная статистика появится после первых кластеров")).toBeInTheDocument();
    expect(screen.getByText("Данные по нагрузке появятся после накопления обращений")).toBeInTheDocument();
  });
});
