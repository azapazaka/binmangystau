import type { ClusterRecord, ReportCategory } from "@/types";

export const CLUSTER_RADIUS_METERS = 50;

type MatchClusterInput = {
  category: ReportCategory;
  lat: number;
  lng: number;
  clusters: ClusterRecord[];
};

export function findMatchingCluster({
  category,
  lat,
  lng,
  clusters,
}: MatchClusterInput) {
  return (
    clusters.find((cluster) => {
      if (cluster.category !== category) {
        return false;
      }

      return getDistanceInMeters(lat, lng, cluster.lat, cluster.lng) <= CLUSTER_RADIUS_METERS;
    }) ?? null
  );
}

export function getDistanceInMeters(
  sourceLat: number,
  sourceLng: number,
  targetLat: number,
  targetLng: number,
) {
  const earthRadius = 6_371_000;
  const latDelta = toRadians(targetLat - sourceLat);
  const lngDelta = toRadians(targetLng - sourceLng);
  const lat1 = toRadians(sourceLat);
  const lat2 = toRadians(targetLat);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
