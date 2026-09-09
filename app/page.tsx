"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { CampusLocation, CampusCategory, WalkingState, WalkingRoute } from "@/types/campus";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import { haversineDistance, estimateWalkingTime } from "@/lib/googleMaps";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import ThemeSwitcher from "@/components/campus/ThemeSwitcher";
import CampusSearch from "@/components/campus/CampusSearch";
import CategoryFilters from "@/components/campus/CategoryFilters";
import BottomSheet from "@/components/campus/BottomSheet";
import WalkingRouteIndicator from "@/components/campus/WalkingRouteIndicator";
import CampusCharacterMarker from "@/components/campus/CampusCharacterMarker";

type Coordinate = { lat: number; lng: number };

function generateWalkingRoute(start: Coordinate, end: Coordinate): Coordinate[] {
  const points: Coordinate[] = [start];
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const distance = Math.sqrt(dLat * dLat + dLng * dLng);
  const numSteps = Math.max(6, Math.min(20, Math.floor(distance * 3000)));

  for (let i = 1; i < numSteps; i++) {
    const t = i / numSteps;
    const wobbleLat = Math.sin(t * Math.PI * 3) * 0.00005;
    const wobbleLng = Math.cos(t * Math.PI * 2.5) * 0.00005;
    points.push({
      lat: start.lat + dLat * t + wobbleLat,
      lng: start.lng + dLng * t + wobbleLng,
    });
  }

  points.push(end);
  return points;
}

const SNSCampusMap = dynamic(
  () => import("@/components/campus/SNSCampusMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Initializing campus map...</p>
        </div>
      </div>
    ),
  }
);

export default function CampusMapPage() {
  return (
    <ThemeProvider>
      <CampusMapApp />
    </ThemeProvider>
  );
}

function CampusMapApp() {
  const { mode } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<CampusCategory | "all">("all");
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [activeRoute, setActiveRoute] = useState<WalkingRoute | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingPosition, setWalkingPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [walkingHeading, setWalkingHeading] = useState(0);
  const [walkingState, setWalkingState] = useState<WalkingState>("idle");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "denied" | "tracking">("idle");

  const watchIdRef = useRef<number | null>(null);

  const handleMapReady = useCallback((map: unknown) => {
    setMapInstance(map);
  }, []);

  const handleLocationSelect = useCallback((location: CampusLocation) => {
    setSelectedLocation(location);
    setWalkingState("idle");
    setIsWalking(false);
    setWalkingPosition(null);
    setActiveRoute(null);
    setLocationStatus("idle");
  }, []);

  const handleArrived = useCallback(() => {
    setIsWalking(false);
    setWalkingState("arrived");
    setLocationStatus("idle");
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleStopWalking = useCallback(() => {
    setIsWalking(false);
    setWalkingState("idle");
    setWalkingPosition(null);
    setActiveRoute(null);
    setLocationStatus("idle");
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleStartWalking = useCallback(() => {
    if (!selectedLocation || !mapInstance) return;

    const end = selectedLocation.position;
    setLocationStatus("requesting");

    const fetchRouteAndTrack = async (lat: number, lng: number) => {
      const start = { lat, lng };

      const fallbackPoints = generateWalkingRoute(start, end);
      setActiveRoute({
        id: `route-${selectedLocation.id}`,
        name: `Walk to ${selectedLocation.name}`,
        from: "current",
        to: selectedLocation.id,
        points: fallbackPoints,
        isPrototype: true,
      });

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.code === "Ok" && data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => ({ lat: c[1], lng: c[0] })
          );

          if (coords.length > 0) {
            setActiveRoute({
              id: `route-${selectedLocation.id}`,
              name: `Walk to ${selectedLocation.name}`,
              from: "current",
              to: selectedLocation.id,
              points: coords,
              isPrototype: false,
            });
          }
        }
      } catch {
        // Fallback route already set above
      }

      setWalkingPosition(start);
      setIsWalking(true);
      setWalkingState("idle");
      setLocationStatus("tracking");

      if (navigator.geolocation) {
        let hasMoved = false;
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;

            setWalkingPosition((prev) => {
              if (prev) {
                const moved = haversineDistance(prev.lat, prev.lng, newLat, newLng) > 2;
                if (moved && !hasMoved) {
                  hasMoved = true;
                  setWalkingState("walking");
                }
                const bearing = getBearingFromTo(prev, { lat: newLat, lng: newLng });
                if (bearing !== null) setWalkingHeading(bearing);
              }
              return { lat: newLat, lng: newLng };
            });

            const distToDest = haversineDistance(newLat, newLng, end.lat, end.lng);
            if (distToDest < 20) {
              handleArrived();
            }
          },
          (err) => {
            console.error("GPS watch error:", err);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchRouteAndTrack(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          if (err.code === 1 || err.code === 2) {
            setLocationStatus("denied");
            return;
          }
          const gate = CAMPUS_LOCATIONS.find((l) => l.id === "main-gate");
          fetchRouteAndTrack(gate?.position.lat ?? 11.0998, gate?.position.lng ?? 77.0273);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const gate = CAMPUS_LOCATIONS.find((l) => l.id === "main-gate");
      fetchRouteAndTrack(gate?.position.lat ?? 11.0998, gate?.position.lng ?? 77.0273);
    }
  }, [selectedLocation, mapInstance, handleArrived]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const distance = useMemo(() => {
    if (!selectedLocation || !walkingPosition) return null;
    return haversineDistance(
      walkingPosition.lat,
      walkingPosition.lng,
      selectedLocation.position.lat,
      selectedLocation.position.lng
    );
  }, [selectedLocation, walkingPosition]);

  const walkingTime = useMemo(() => {
    if (distance === null) return null;
    return estimateWalkingTime(distance);
  }, [distance]);

  const staticDistance = useMemo(() => {
    if (!selectedLocation) return null;
    return haversineDistance(
      CAMPUS_LOCATIONS.find((l) => l.id === "main-gate")?.position.lat ?? 11.0998,
      CAMPUS_LOCATIONS.find((l) => l.id === "main-gate")?.position.lng ?? 77.0273,
      selectedLocation.position.lat,
      selectedLocation.position.lng
    );
  }, [selectedLocation]);

  return (
    <div className="relative w-full h-screen bg-zinc-900 overflow-hidden">
      <SNSCampusMap
        activeCategory={activeCategory}
        onLocationSelect={handleLocationSelect}
        selectedLocationId={selectedLocation?.id ?? null}
        activeRoute={activeRoute}
        mapTypeId={mode === "classic" ? "satellite" : "roadmap"}
        onMapReady={handleMapReady}
      />

      {walkingPosition && (
        <CampusCharacterMarker
          map={mapInstance}
          position={walkingPosition}
          bearing={walkingHeading}
          isMoving={walkingState === "walking"}
        />
      )}

      <WalkingRouteIndicator route={activeRoute} isWalking={isWalking} />

      {locationStatus === "requesting" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bottom-sheet rounded-3xl p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Getting your location</h3>
            <p className="text-sm text-zinc-500">Please allow location access when prompted by your browser</p>
          </div>
        </div>
      )}

      {locationStatus === "denied" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bottom-sheet rounded-3xl p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Location access required</h3>
            <p className="text-sm text-zinc-500 mb-4">Please enable location access in your browser settings to use walking navigation</p>
            <button
              onClick={() => {
                setLocationStatus("idle");
                handleStartWalking();
              }}
              className="btn-primary w-full text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => setLocationStatus("idle")}
              className="w-full text-zinc-500 font-semibold py-3 rounded-2xl transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 pb-0 safe-top">
        <div className="max-w-md mx-auto flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <CampusSearch onSelectLocation={handleLocationSelect} />
            </div>
            <ThemeSwitcher />
          </div>
          <CategoryFilters
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </div>

      {selectedLocation && (
        <BottomSheet
          location={selectedLocation}
          distance={
            isWalking && walkingPosition
              ? distance
              : staticDistance
          }
          walkingTime={
            isWalking && walkingPosition
              ? walkingTime
              : staticDistance !== null
              ? estimateWalkingTime(staticDistance)
              : null
          }
          onClose={() => {
            handleStopWalking();
            setSelectedLocation(null);
          }}
          onStartWalking={handleStartWalking}
          isCurrentlyWalking={isWalking}
        />
      )}

      {!selectedLocation && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex justify-center safe-bottom">
          <div className="info-badge text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
            Tap a building to explore
          </div>
        </div>
      )}
    </div>
  );
}

function getBearingFromTo(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return bearing;
}
