"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { CampusLocation, WalkingState, WalkingRoute } from "@/types/campus";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import { haversineDistance, estimateWalkingTime } from "@/lib/googleMaps";
import { X, Navigation, Check, MapPin, AlertTriangle } from "lucide-react";
import CampusSearch from "@/components/campus/CampusSearch";
import BottomSheet from "@/components/campus/BottomSheet";

type Coordinate = { lat: number; lng: number };

function getBearing(from: Coordinate, to: Coordinate): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

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
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Initializing campus map...</p>
        </div>
      </div>
    ),
  }
);

export default function CampusMapPage() {
  return <CampusMapApp />;
}

function CampusMapApp() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [activeRoute, setActiveRoute] = useState<WalkingRoute | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingPosition, setWalkingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [walkingBearing, setWalkingBearing] = useState(0);
  const [walkingState, setWalkingState] = useState<WalkingState>("idle");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "denied" | "tracking">("idle");
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const handleMapReady = useCallback((map: unknown) => {
    setMapInstance(map);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    setWalkingPosition(null);
    setActiveRoute(null);
    setSelectedLocation(null);
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
    setSelectedLocation(null);
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
        // Fallback route already set
      }

      setWalkingPosition(start);
      setIsWalking(true);
      setWalkingState("idle");
      setLocationStatus("tracking");
      prevPositionRef.current = null;
      setWalkingBearing(0);

      if (navigator.geolocation) {
        let hasMoved = false;
        let idleTimer: ReturnType<typeof setTimeout> | null = null;
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;

            if (prevPositionRef.current) {
              const heading = getBearing(prevPositionRef.current, { lat: newLat, lng: newLng });
              setWalkingBearing(heading);
            }
            prevPositionRef.current = { lat: newLat, lng: newLng };

            setWalkingPosition((prev) => {
              if (prev) {
                const distMoved = haversineDistance(prev.lat, prev.lng, newLat, newLng);
                if (distMoved > 5) {
                  hasMoved = true;
                  setWalkingState("walking");
                  if (idleTimer) clearTimeout(idleTimer);
                  idleTimer = setTimeout(() => {
                    setWalkingState("idle");
                  }, 2000);
                }
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

  const staticDistance = useMemo(() => {
    if (!selectedLocation) return null;
    const origin = userPosition ?? walkingPosition;
    if (!origin) return null;
    return haversineDistance(
      origin.lat,
      origin.lng,
      selectedLocation.position.lat,
      selectedLocation.position.lng
    );
  }, [selectedLocation, userPosition, walkingPosition]);

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

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    if (mins < 1) return "1 min";
    return `${mins} min`;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-100">
      <SNSCampusMap
        onLocationSelect={handleLocationSelect}
        selectedLocationId={selectedLocation?.id ?? null}
        activeRoute={activeRoute}
        mapTypeId="roadmap"
        walkingPosition={walkingPosition}
        walkingBearing={walkingBearing}
        isWalking={isWalking}
        walkingState={walkingState}
        onMapReady={handleMapReady}
      />

      {/* Walking navigation bar - bottom */}
      {isWalking && selectedLocation && walkingPosition && (
        <div className="absolute bottom-0 left-0 right-0 z-40 p-3 pb-6 safe-bottom">
          <div className="bg-white shadow-2xl rounded-2xl mx-auto max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={handleStopWalking}
                className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5 text-red-500" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{selectedLocation.name}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-medium text-blue-600">{formatDistance(distance ?? 0)}</span>
                  <span>&middot;</span>
                  <span>{formatTime(walkingTime ?? 0)}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            {walkingState === "idle" && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Getting your location...</span>
                </div>
              </div>
            )}
            {walkingState === "walking" && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Navigating to {selectedLocation.name}</span>
                </div>
              </div>
            )}
            {walkingState === "arrived" && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                  <Check className="w-4 h-4" />
                  <span>You have arrived!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location requesting overlay */}
      {locationStatus === "requesting" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Getting your location</h3>
            <p className="text-sm text-zinc-500">Please allow location access when prompted by your browser</p>
          </div>
        </div>
      )}

      {/* Location denied overlay */}
      {locationStatus === "denied" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Location access required</h3>
            <p className="text-sm text-zinc-500 mb-4">Please enable location access in your browser settings to use walking navigation</p>
            <button
              onClick={() => {
                setLocationStatus("idle");
                handleStartWalking();
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-2xl transition-colors"
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

      {/* Top bar */}
      {!isWalking && (
        <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 safe-top">
          <div className="max-w-lg mx-auto">
            <CampusSearch onSelectLocation={handleLocationSelect} />
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      {selectedLocation && !isWalking && (
        <BottomSheet
          location={selectedLocation}
          distance={staticDistance}
          walkingTime={staticDistance !== null ? estimateWalkingTime(staticDistance) : null}
          onClose={() => {
            handleStopWalking();
            setSelectedLocation(null);
          }}
          onStartWalking={handleStartWalking}
          isCurrentlyWalking={isWalking}
        />
      )}

      {/* Arrival card */}
      {walkingState === "arrived" && selectedLocation && (
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4 pb-6 safe-bottom">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md mx-auto overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">You have arrived!</h3>
              <p className="text-sm text-zinc-500">{selectedLocation.name}</p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={handleStopWalking}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-2xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom hint */}
      {!selectedLocation && !isWalking && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex justify-center safe-bottom">
          <div className="bg-white/90 backdrop-blur-sm text-xs px-4 py-2 rounded-full shadow-lg text-zinc-600">
            Tap a building to explore
          </div>
        </div>
      )}
    </div>
  );
}
