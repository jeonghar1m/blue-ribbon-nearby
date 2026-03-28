const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6_371_000;

export function getBoundingBox(
  lat: number,
  lng: number,
  distanceMeters: number,
) {
  const latDelta = distanceMeters / EARTH_RADIUS_M / DEG_TO_RAD;
  const lngDelta =
    distanceMeters / (EARTH_RADIUS_M * Math.cos(lat * DEG_TO_RAD)) / DEG_TO_RAD;

  return {
    lat1: lat - latDelta,
    lat2: lat + latDelta,
    lng1: lng - lngDelta,
    lng2: lng + lngDelta,
  };
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
