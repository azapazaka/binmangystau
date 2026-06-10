import type { SmartBinRecord, SmartBinStatus } from "@/types";

export function getBinSignalColor(status: SmartBinStatus, fillLevel: number) {
  if (status === "offline") {
    return "#6b7280";
  }

  if (status === "fire" || status === "sos" || status === "full" || fillLevel >= 81) {
    return "#ef4444";
  }

  if (status === "warning" || fillLevel >= 51) {
    return "#facc15";
  }

  return "#22c55e";
}

export function getBinStatusLabel(status: SmartBinStatus) {
  switch (status) {
    case "normal":
      return "Норма";
    case "warning":
      return "Заполняется";
    case "full":
      return "Переполнен";
    case "fire":
      return "Пожар";
    case "sos":
      return "SOS";
    case "offline":
      return "Offline";
  }
}

export function getBinWasteLabel(bin: SmartBinRecord) {
  switch (bin.wasteType) {
    case "plastic":
      return "Пластик";
    case "metal":
      return "Металл";
    case "mixed":
      return "Смешанные";
  }
}

export function formatLastSeen(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function getCityPulseAlertSummary(bins: SmartBinRecord[]) {
  const fireBins = bins.filter((bin) => bin.status === "fire");
  const sosBins = bins.filter((bin) => bin.status === "sos");
  const offlineBins = bins.filter((bin) => bin.status === "offline");

  if (fireBins.length > 0) {
    return `Пожар: ${fireBins.map((bin) => bin.label).join(", ")}`;
  }

  if (sosBins.length > 0) {
    return `SOS: ${sosBins.map((bin) => bin.label).join(", ")}`;
  }

  if (offlineBins.length > 0) {
    return `Offline: ${offlineBins.map((bin) => bin.label).join(", ")}`;
  }

  return "Линия стабильна. Критических тревог нет.";
}
