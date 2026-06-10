import type {
  CityPulseAnalytics,
  CityPulseDemoAction,
  CityPulseMode,
  SmartBinPriority,
  SmartBinRecord,
  SmartBinStatus,
  SmartBinWasteType,
} from "@/types";

type DeviceEventInput = {
  bin_id: string;
  fill_level?: number;
  temperature?: number;
  waste_type?: SmartBinWasteType;
  status?: Exclude<SmartBinStatus, "offline">;
  sos?: boolean;
  timestamp?: string;
};

const BASELINE_BINS: SmartBinRecord[] = [
  {
    id: "AKT-14-031",
    label: "AKT-14-031",
    district: "14 мкр",
    lat: 43.6523,
    lng: 51.1678,
    wasteType: "plastic",
    fillLevel: 38,
    temperature: 22,
    status: "normal",
    lastSeen: minutesAgo(2),
    source: "simulation",
  },
  {
    id: "AKT-11-082",
    label: "AKT-11-082",
    district: "11 мкр",
    lat: 43.6448,
    lng: 51.1741,
    wasteType: "metal",
    fillLevel: 68,
    temperature: 24,
    status: "warning",
    lastSeen: minutesAgo(3),
    source: "simulation",
  },
  {
    id: "AKT-15-014",
    label: "AKT-15-014",
    district: "15 мкр",
    lat: 43.6615,
    lng: 51.1524,
    wasteType: "mixed",
    fillLevel: 84,
    temperature: 26,
    status: "full",
    lastSeen: minutesAgo(4),
    source: "simulation",
  },
  {
    id: "AKT-CST-007",
    label: "AKT-CST-007",
    district: "Прибрежная зона",
    lat: 43.6492,
    lng: 51.1579,
    wasteType: "plastic",
    fillLevel: 52,
    temperature: 23,
    status: "warning",
    lastSeen: minutesAgo(6),
    source: "simulation",
  },
  {
    id: "AKT-PRM-004",
    label: "AKT-PRM-004",
    district: "Промзона",
    lat: 43.6336,
    lng: 51.1914,
    wasteType: "metal",
    fillLevel: 0,
    temperature: 0,
    status: "offline",
    lastSeen: minutesAgo(47),
    source: "simulation",
  },
  {
    id: "AKT-12-115",
    label: "AKT-12-115",
    district: "12 мкр",
    lat: 43.6561,
    lng: 51.1816,
    wasteType: "mixed",
    fillLevel: 44,
    temperature: 21,
    status: "normal",
    lastSeen: minutesAgo(1),
    source: "simulation",
  },
];

let mode: CityPulseMode = "simulation";
let binsState: SmartBinRecord[] = BASELINE_BINS.map((bin) => ({ ...bin }));

export function getCityPulseMode() {
  return mode;
}

export function setCityPulseMode(nextMode: CityPulseMode) {
  mode = nextMode;
  return mode;
}

export function listSmartBins() {
  return binsState
    .map((bin) => ({ ...bin }))
    .sort((left, right) => getStatusRank(right.status) - getStatusRank(left.status));
}

export function getCityPulseAnalytics(): CityPulseAnalytics {
  const bins = listSmartBins();
  const activeBins = bins.filter((bin) => bin.status !== "offline");
  const priorities = buildPriorities(bins);
  const totalFill = activeBins.reduce((sum, bin) => sum + bin.fillLevel, 0);
  const averageFill = activeBins.length > 0 ? Math.round(totalFill / activeBins.length) : 0;
  const alertBins = bins.filter((bin) => bin.status === "fire" || bin.status === "sos");
  const fullBins = bins.filter((bin) => bin.status === "full").length;
  const offlineBins = bins.filter((bin) => bin.status === "offline").length;
  const routeStops = priorities.slice(0, 4).map((item, index) => {
    return `${index + 1}. ${item.district} - ${item.label}`;
  });

  return {
    kpis: [
      {
        label: "Активные тревоги",
        value: String(alertBins.length),
        note: "fire и SOS на линии",
      },
      {
        label: "Средняя загрузка",
        value: `${averageFill}%`,
        note: "по онлайн-контейнерам",
      },
      {
        label: "Полные баки",
        value: String(fullBins),
        note: "требуют вывоз в ближайший рейс",
      },
      {
        label: "Offline",
        value: String(offlineBins),
        note: "нужна проверка связи или питания",
      },
    ],
    priorities,
    routePlan: {
      summary:
        routeStops.length > 0
          ? `Маршрут: ${routeStops.map((stop) => stop.split(". ")[1]).join(" -> ")}`
          : "Маршрут пуст: активных баков для вывоза нет",
      stops: routeStops,
    },
    wasteBreakdown: buildWasteBreakdown(bins),
    districtLoad: buildDistrictLoad(bins),
    incidentTrend: [
      { label: "08:00", value: 1 },
      { label: "10:00", value: 2 },
      { label: "12:00", value: alertBins.length > 0 ? 4 : 2 },
      { label: "14:00", value: priorities.filter((item) => item.status !== "warning").length + 1 },
      { label: "16:00", value: priorities.length },
    ],
  };
}

export function applyCityPulseDemoAction(
  action: CityPulseDemoAction,
  binId?: string,
) {
  const targetId = binId ?? pickDefaultBinId(action);
  const baselineMap = new Map(BASELINE_BINS.map((bin) => [bin.id, bin]));

  binsState = binsState.map((bin) => {
    if (action === "reset") {
      if (targetId && targetId !== bin.id) {
        return bin;
      }

      const baseline = baselineMap.get(bin.id);
      return baseline ? { ...baseline, lastSeen: new Date().toISOString() } : bin;
    }

    if (bin.id !== targetId) {
      return bin;
    }

    if (action === "fill_up") {
      return {
        ...bin,
        fillLevel: 96,
        temperature: Math.max(bin.temperature, 28),
        status: "full",
        lastSeen: new Date().toISOString(),
        source: "simulation",
      };
    }

    if (action === "fire") {
      return {
        ...bin,
        fillLevel: Math.max(bin.fillLevel, 82),
        temperature: 94,
        status: "fire",
        lastSeen: new Date().toISOString(),
        source: "simulation",
      };
    }

    if (action === "sos") {
      return {
        ...bin,
        fillLevel: Math.max(bin.fillLevel, 71),
        temperature: Math.max(bin.temperature, 30),
        status: "sos",
        lastSeen: new Date().toISOString(),
        source: "simulation",
      };
    }

    return bin;
  });

  return {
    mode,
    bins: listSmartBins(),
    analytics: getCityPulseAnalytics(),
  };
}

export function ingestDeviceEvent(input: DeviceEventInput) {
  mode = "live";
  binsState = binsState.map((bin) => {
    if (bin.id !== input.bin_id) {
      return bin;
    }

    const fillLevel = clampPercent(input.fill_level ?? bin.fillLevel);
    const temperature = input.temperature ?? bin.temperature;
    const status = resolveStatus({
      fillLevel,
      temperature,
      requestedStatus: input.sos ? "sos" : input.status,
      previousStatus: bin.status,
    });

    return {
      ...bin,
      wasteType: input.waste_type ?? bin.wasteType,
      fillLevel,
      temperature,
      status,
      lastSeen: input.timestamp ?? new Date().toISOString(),
      source: "device",
    };
  });

  return {
    mode,
    bins: listSmartBins(),
    analytics: getCityPulseAnalytics(),
  };
}

function buildPriorities(bins: SmartBinRecord[]): SmartBinPriority[] {
  return bins
    .filter((bin) => bin.status !== "normal")
    .sort((left, right) => {
      return (
        getStatusRank(right.status) - getStatusRank(left.status) ||
        right.fillLevel - left.fillLevel
      );
    })
    .map((bin) => ({
      binId: bin.id,
      label: bin.label,
      district: bin.district,
      wasteType: bin.wasteType,
      fillLevel: bin.fillLevel,
      status: bin.status,
      lastSeen: bin.lastSeen,
      reason: getPriorityReason(bin),
    }));
}

function buildWasteBreakdown(bins: SmartBinRecord[]) {
  const totals = new Map<SmartBinWasteType, number>([
    ["plastic", 0],
    ["metal", 0],
    ["mixed", 0],
  ]);

  for (const bin of bins) {
    totals.set(bin.wasteType, (totals.get(bin.wasteType) ?? 0) + 1);
  }

  return [
    { label: "Пластик", value: totals.get("plastic") ?? 0 },
    { label: "Металл", value: totals.get("metal") ?? 0 },
    { label: "Смешанные", value: totals.get("mixed") ?? 0 },
  ];
}

function buildDistrictLoad(bins: SmartBinRecord[]) {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const bin of bins) {
    if (bin.status === "offline") {
      continue;
    }

    const current = totals.get(bin.district) ?? { sum: 0, count: 0 };
    current.sum += bin.fillLevel;
    current.count += 1;
    totals.set(bin.district, current);
  }

  return [...totals.entries()]
    .map(([label, value]) => ({
      label,
      value: Math.round(value.sum / Math.max(value.count, 1)),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
}

function pickDefaultBinId(action: CityPulseDemoAction) {
  if (action === "fill_up") {
    return [...binsState]
      .filter((bin) => bin.status !== "fire" && bin.status !== "sos")
      .sort((left, right) => right.fillLevel - left.fillLevel)[0]?.id;
  }

  if (action === "fire") {
    return "AKT-CST-007";
  }

  if (action === "sos") {
    return "AKT-11-082";
  }

  return undefined;
}

function getPriorityReason(bin: SmartBinRecord) {
  if (bin.status === "fire") {
    return "Датчик температуры вышел в красную зону";
  }

  if (bin.status === "sos") {
    return "Нажат аварийный сигнал контейнера";
  }

  if (bin.status === "offline") {
    return "Нет связи с контейнером";
  }

  if (bin.status === "full") {
    return "Заполненность выше 80%, нужен вывоз";
  }

  return "Контейнер приближается к порогу переполнения";
}

function resolveStatus(input: {
  fillLevel: number;
  temperature: number;
  requestedStatus?: Exclude<SmartBinStatus, "offline">;
  previousStatus: SmartBinStatus;
}): SmartBinStatus {
  if (input.requestedStatus === "fire" || input.temperature >= 80) {
    return "fire";
  }

  if (input.requestedStatus === "sos") {
    return "sos";
  }

  if (input.requestedStatus === "full" || input.fillLevel >= 81) {
    return "full";
  }

  if (input.requestedStatus === "warning" || input.fillLevel >= 51) {
    return "warning";
  }

  if (input.previousStatus === "offline") {
    return "normal";
  }

  return "normal";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getStatusRank(status: SmartBinStatus) {
  switch (status) {
    case "fire":
      return 6;
    case "sos":
      return 5;
    case "full":
      return 4;
    case "offline":
      return 3;
    case "warning":
      return 2;
    default:
      return 1;
  }
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}
