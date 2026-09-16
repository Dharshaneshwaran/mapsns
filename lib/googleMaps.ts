let googleMapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMapsApi(): Promise<typeof google> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Maps API can only be loaded in the browser"));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(
        new Error(
          "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local"
        )
      );
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript) {
      waitForGoogle(resolve, reject);
      return;
    }

    // Use the recommended loading pattern with async
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps API"));
    document.head.appendChild(script);

    // The namespace appears before the asynchronously loaded constructors are ready.
    waitForGoogle(resolve, reject);
  });

  return googleMapsPromise;
}

function waitForGoogle(
  resolve: (value: typeof google) => void,
  reject: (reason: Error) => void
) {
  const maxAttempts = 100;
  let attempts = 0;

  const check = () => {
    if (typeof window.google?.maps?.Map === "function" && typeof window.google.maps.OverlayView === "function" && typeof window.google.maps.Polygon === "function") {
      resolve(window.google);
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(check, 100);
    } else {
      reject(new Error("Google Maps API failed to initialize"));
    }
  };

  check();
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateWalkingTime(distanceMeters: number): number {
  const walkingSpeedMps = 1.4;
  return distanceMeters / walkingSpeedMps;
}
