export function isUsableGpsFix(fix: GeolocationPosition, maxAccuracy = 25, now = Date.now()): boolean {
  const { latitude, longitude, accuracy } = fix.coords;
  return Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= maxAccuracy
    && Number.isFinite(fix.timestamp) && now - fix.timestamp >= 0 && now - fix.timestamp <= 15000;
}

export function isArrivalFix(fix: GeolocationPosition, distanceMeters: number, now = Date.now()): boolean {
  return isUsableGpsFix(fix, 15, now)
    && Number.isFinite(distanceMeters) && distanceMeters >= 0 && distanceMeters <= 7;
}

export function gpsErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (code === 1) return "Location permission was denied. Allow location access in your browser settings and retry.";
  if (code === 2) return "GPS location is unavailable. Check that device location is enabled and try outdoors.";
  if (code === 3) return "GPS signal timed out. Move to an open area and retry.";
  return error instanceof Error ? error.message : "Unable to get your location. Please retry.";
}
