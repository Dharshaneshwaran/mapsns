"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { CampusLocation, WalkingState, WalkingRoute, TravelMode } from "@/types/campus";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import { haversineDistance, estimateWalkingTime } from "@/lib/googleMaps";
import { Check, AlertTriangle, Settings, X, Utensils, BedDouble, Camera, BusFront, CircleParking } from "lucide-react";
import CampusSearch from "@/components/campus/CampusSearch";
import BottomSheet from "@/components/campus/BottomSheet";
import NavigationOverlay from "@/components/campus/NavigationOverlay";
import RoutePreviewOverlay from "@/components/campus/RoutePreviewOverlay";
import SettingsDialog, { UserProfile } from "@/components/campus/SettingsDialog";

type Coordinate = { lat: number; lng: number };
const WALKING_MOVEMENT_THRESHOLD_METERS = 3;

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  gender: "male",
  pointerStyle: "character",
  mapStyle: "roadmap",
};

function getSavedProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const saved = window.localStorage.getItem("sns-campus-profile");
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

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
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");
  const [isRoutePreview, setIsRoutePreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(getSavedProfile);

  const watchIdRef = useRef<number | null>(null);
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const movementAnchorRef = useRef<{ lat: number; lng: number } | null>(null);

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
    setIsRoutePreview(false);
  }, []);

  const handleArrived = useCallback(() => {
    setIsWalking(false);
    setWalkingState("arrived");
    setWalkingPosition(null);
    setActiveRoute(null);
    setIsRoutePreview(false);
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
    setIsRoutePreview(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handlePrepareRoute = useCallback((mode: TravelMode) => {
    if (!selectedLocation || !mapInstance) return;

    setTravelMode(mode);
    const end = selectedLocation.position;
    setLocationStatus("requesting");

    const fetchRouteAndTrack = async (lat: number, lng: number) => {
      const start = { lat, lng };

      const fallbackPoints = generateWalkingRoute(start, end);
      setActiveRoute({
        id: `route-${selectedLocation.id}`,
        name: `${mode === "walking" ? "Walk" : "Drive"} to ${selectedLocation.name}`,
        from: "current",
        to: selectedLocation.id,
        points: fallbackPoints,
        isPrototype: true,
      });

      // Show the current route UI immediately. The road-aware route replaces
      // this fallback in the background when it becomes available.
      setWalkingPosition(start);
      setIsWalking(false);
      setIsRoutePreview(true);
      setWalkingState("idle");
      setLocationStatus("idle");
      prevPositionRef.current = null;
      setWalkingBearing(0);

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/${mode === "vehicle" ? "driving" : "foot"}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.code === "Ok" && data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => ({ lat: c[1], lng: c[0] })
          );

          if (coords.length > 0) {
            setActiveRoute({
              id: `route-${selectedLocation.id}`,
              name: `${mode === "walking" ? "Walk" : "Drive"} to ${selectedLocation.name}`,
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
    };

    if (userPosition) {
      void fetchRouteAndTrack(userPosition.lat, userPosition.lng);
      return;
    }

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
  }, [selectedLocation, mapInstance, userPosition]);

  const handleBeginNavigation = useCallback(() => {
    if (!selectedLocation) return;
    const gate = CAMPUS_LOCATIONS.find((location) => location.id === "main-gate");
    const startPosition = walkingPosition ?? userPosition ?? gate?.position;
    if (startPosition) setWalkingPosition(startPosition);
    setIsRoutePreview(false);
    setIsWalking(true);
    setWalkingState("idle");
    setLocationStatus("tracking");
    prevPositionRef.current = null;
    movementAnchorRef.current = null;
  }, [selectedLocation, walkingPosition, userPosition]);

  useEffect(() => {
    if (!isWalking || !selectedLocation || !navigator.geolocation) return;

    const end = selectedLocation.position;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        if (prevPositionRef.current) {
          setWalkingBearing(getBearing(prevPositionRef.current, nextPosition));
        }

        if (!movementAnchorRef.current) {
          movementAnchorRef.current = nextPosition;
        } else if (haversineDistance(movementAnchorRef.current.lat, movementAnchorRef.current.lng, nextPosition.lat, nextPosition.lng) >= WALKING_MOVEMENT_THRESHOLD_METERS) {
          movementAnchorRef.current = nextPosition;
          setWalkingState("walking");
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => setWalkingState("idle"), 3500);
        }

        prevPositionRef.current = nextPosition;
        setWalkingPosition(nextPosition);
        if (haversineDistance(nextPosition.lat, nextPosition.lng, end.lat, end.lng) < 20) handleArrived();
      },
      (error) => console.error("GPS watch error:", error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isWalking, selectedLocation, handleArrived]);

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

  const travelTime = useMemo(() => {
    if (distance === null) return null;
    return travelMode === "walking" ? estimateWalkingTime(distance) : distance / 5.5;
  }, [distance, travelMode]);

  return (
    <main className="campus-map-app relative w-full h-screen overflow-hidden bg-zinc-100">
      <SNSCampusMap
        onLocationSelect={handleLocationSelect}
        selectedLocation={selectedLocation}
        activeRoute={activeRoute}
        mapTypeId={profile.mapStyle}
        walkingPosition={walkingPosition}
        walkingBearing={walkingBearing}
        isWalking={isWalking}
        isWalkingMode={travelMode === "walking"}
        walkingState={walkingState}
        pointerStyle={profile.pointerStyle}
        onMapReady={handleMapReady}
      />

      {!isWalking && !isRoutePreview && (
        <div className="desktop-map-chips pointer-events-auto absolute left-[424px] top-[18px] z-30 hidden items-center gap-2 lg:flex">
          {[
            { label: "Restaurants", icon: Utensils },
            { label: "Hotels", icon: BedDouble },
            { label: "Things to do", icon: Camera },
            { label: "Transit", icon: BusFront },
            { label: "Parking", icon: CircleParking },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className="flex h-9 items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 text-sm font-medium text-[#3c4043] shadow-sm hover:bg-[#f8f9fa]">
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Google Maps-style active navigation UI */}
      {isWalking && selectedLocation && walkingPosition && (
        <NavigationOverlay
          destination={selectedLocation.name}
          distance={distance ?? 0}
          duration={travelTime ?? 0}
          mode={travelMode}
          onExit={handleStopWalking}
        />
      )}

      {isRoutePreview && selectedLocation && walkingPosition && (
        <RoutePreviewOverlay
          destination={selectedLocation.name}
          distance={distance ?? 0}
          duration={travelTime ?? 0}
          mode={travelMode}
          onModeChange={handlePrepareRoute}
          onStart={handleBeginNavigation}
          onClose={handleStopWalking}
        />
      )}

      {/* Non-blocking Google-style location notice */}
      {locationStatus === "denied" && (
        <div className="pointer-events-none absolute bottom-5 left-3 right-3 z-50 flex justify-center safe-bottom sm:bottom-6">
          <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-[#202124] px-4 py-3 text-white shadow-xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3c4043]">
              <AlertTriangle className="h-5 w-5 text-[#fdd663]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Location is turned off</p>
              <p className="mt-0.5 text-xs text-[#bdc1c6]">Enable location permission to prepare your route.</p>
            </div>
            <button
              onClick={() => {
                setLocationStatus("idle");
                handlePrepareRoute(travelMode);
              }}
              className="min-h-9 min-w-fit rounded-full px-2 text-sm font-medium text-[#8ab4f8] hover:bg-white/10"
            >
              Retry
            </button>
            <button
              onClick={() => setLocationStatus("idle")}
              aria-label="Dismiss location notice"
              className="flex h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[#bdc1c6] hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      {!isWalking && !isRoutePreview && (
        <div className="campus-search-panel absolute top-0 left-0 right-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 safe-top">
          <div className="campus-search-card max-w-lg mx-auto flex items-start gap-2">
            <CampusSearch onSelectLocation={handleLocationSelect} />
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              title="Settings"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white/95 text-zinc-600 shadow-lg backdrop-blur-xl transition-colors hover:bg-white hover:text-blue-600 sm:h-12 sm:w-12"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      {selectedLocation && !isWalking && !isRoutePreview && walkingState !== "arrived" && (
        <BottomSheet
          location={selectedLocation}
          distance={staticDistance}
          walkingTime={staticDistance !== null ? estimateWalkingTime(staticDistance) : null}
          onClose={() => {
            handleStopWalking();
            setSelectedLocation(null);
          }}
          onStartWalking={() => handlePrepareRoute("walking")}
        />
      )}

      {showSettings && (
        <SettingsDialog
          profile={profile}
          onClose={() => setShowSettings(false)}
          onSave={(nextProfile) => {
            setProfile(nextProfile);
            window.localStorage.setItem("sns-campus-profile", JSON.stringify(nextProfile));
            setShowSettings(false);
          }}
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
      {!selectedLocation && !isWalking && !isRoutePreview && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex justify-center safe-bottom">
          <div className="bg-white/90 backdrop-blur-sm text-xs px-4 py-2 rounded-full shadow-lg text-zinc-600">
            Tap a building to explore
          </div>
        </div>
      )}
    </main>
  );
}
