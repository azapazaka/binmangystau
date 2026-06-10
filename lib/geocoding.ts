import { env, isMapboxConfigured } from "@/lib/env";

export type LocationDetails = {
  lat: number;
  lng: number;
  address: string;
  district: string | null;
  zoneKey: string;
  zoneCoefficient: number;
};

const COUNTRY_CODE = "KZ";
const COUNTRY_LABEL = "Казахстан";
const UNKNOWN_LOCATION_LABEL = "Локация уточняется";

export async function reverseGeocode(lat: number, lng: number): Promise<LocationDetails> {
  if (isMapboxConfigured()) {
    try {
      const response = await fetch(
        `${env.mapboxGeocodingUrl}/reverse?longitude=${lng}&latitude=${lat}&language=ru&country=${COUNTRY_CODE}&access_token=${env.mapboxToken}`,
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          features?: Array<{
            properties?: {
              full_address?: string;
              context?: { district?: { name?: string } };
            };
          }>;
        };
        const feature = payload.features?.[0];

        if (feature) {
          return {
            lat,
            lng,
            address: feature.properties?.full_address ?? UNKNOWN_LOCATION_LABEL,
            district: feature.properties?.context?.district?.name ?? null,
            ...resolveZone(),
          };
        }
      }
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  return {
    lat,
    lng,
    address: UNKNOWN_LOCATION_LABEL,
    district: null,
    ...resolveZone(),
  };
}

export async function forwardGeocode(address: string): Promise<LocationDetails> {
  const normalizedAddress = normalizeCountryScopedAddress(address);

  if (isMapboxConfigured()) {
    try {
      const response = await fetch(
        `${env.mapboxGeocodingUrl}/forward?q=${encodeURIComponent(normalizedAddress)}&language=ru&country=${COUNTRY_CODE}&access_token=${env.mapboxToken}`,
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          features?: Array<{
            geometry?: { coordinates?: [number, number] };
            properties?: {
              full_address?: string;
              context?: { district?: { name?: string } };
            };
          }>;
        };
        const feature = payload.features?.[0];
        const coordinates = feature?.geometry?.coordinates;

        if (feature && coordinates) {
          const [lng, lat] = coordinates;

          return {
            lat,
            lng,
            address: feature.properties?.full_address ?? address,
            district: feature.properties?.context?.district?.name ?? null,
            ...resolveZone(),
          };
        }
      }
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  const hash = Array.from(address).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = env.defaultLat + ((hash % 25) - 12) * 0.0015;
  const lng = env.defaultLng + ((hash % 31) - 15) * 0.0015;

  return {
    lat,
    lng,
    address,
    district: null,
    ...resolveZone(),
  };
}

function normalizeCountryScopedAddress(address: string) {
  const trimmedAddress = address.trim();

  if (trimmedAddress.toLowerCase().includes(COUNTRY_LABEL.toLowerCase())) {
    return trimmedAddress;
  }

  return `${trimmedAddress}, ${COUNTRY_LABEL}`;
}

function resolveZone() {
  return { zoneKey: "nationwide", zoneCoefficient: 1 };
}
