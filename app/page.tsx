"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { CampusLocation, WalkingState, WalkingRoute, TravelMode } from "@/types/campus";
import { useCampusPlaces } from "@/components/campus/useCampusPlaces";
import { haversineDistance, estimateWalkingTime } from "@/lib/googleMaps";
import { Check, AlertTriangle, Settings, X, MapPin, ArrowRight, Navigation } from "lucide-react";
import CampusSearch from "@/components/campus/CampusSearch";
import BottomSheet from "@/components/campus/BottomSheet";
import NavigationOverlay from "@/components/campus/NavigationOverlay";
import RoutePreviewOverlay from "@/components/campus/RoutePreviewOverlay";
import SettingsDialog, { UserProfile } from "@/components/campus/SettingsDialog";
import ExplorePanel from "@/components/campus/ExplorePanel";
import { requestRoute } from "@/lib/requestRoute";
import { routeDeviation } from "@/lib/routeDeviation";

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
    const profile = saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    return { ...profile, mapStyle: profile.mapStyle === "satellite" || profile.mapStyle === "hybrid" ? "satellite" : "roadmap" };
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
  const [gender, setGender] = useState<UserProfile["gender"] | null>(null);
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);

  if (initialProfile) return <CampusMapApp initialProfile={initialProfile} />;

  return (
    <main className="campus-map-app relative isolate overflow-hidden bg-[#e8eaed] text-[#202124]">
      <div className="welcome-map absolute inset-0 pointer-events-none" aria-hidden="true" inert>
        <SNSCampusMap onLocationSelect={() => {}} selectedLocation={null} activeRoute={null} mapTypeId="roadmap" walkingPosition={null} walkingBearing={0} isWalking={false} isFollowingLocation={false} onMapInteraction={() => {}} isWalkingMode walkingState="idle" pointerStyle="character" gender={gender ?? "male"} />
      </div>
      <div className="absolute left-4 right-4 top-[max(16px,env(safe-area-inset-top))] flex h-14 items-center gap-3 rounded-full bg-white px-5 shadow-md sm:right-auto sm:w-80">
        <MapPin className="h-6 w-6 text-[#1a73e8]" />
        <span className="text-base font-medium">SNS Campus</span>
        <span className="ml-auto text-sm text-[#5f6368]">Explore & navigate</span>
      </div>
      <form className="absolute bottom-0 left-0 right-0 max-h-[calc(100%-88px-env(safe-area-inset-top))] overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_#00000018] sm:bottom-6 sm:left-6 sm:right-auto sm:w-[400px] sm:rounded-[24px] sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (!gender) return;
          const nextProfile: UserProfile = { ...getSavedProfile(), gender };
          try { window.localStorage.setItem("sns-campus-profile", JSON.stringify(nextProfile)); } catch { /* Continue even when browser storage is unavailable. */ }
          setInitialProfile(nextProfile);
        }}>
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-[#dadce0] sm:hidden" aria-hidden="true" />
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]"><Navigation size={22} /></div>
        <h1 className="text-[26px] font-medium tracking-tight">Make your way around</h1>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">Choose your character to start exploring campus.</p>
        <fieldset className="mt-5">
          <legend className="sr-only">Select male or female</legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((option) => (
              <label key={option} className="relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-[#e8eaed] bg-[#f8f9fa] px-4 py-3 transition-colors hover:bg-[#f1f3f4] has-checked:border-[#1a73e8] has-checked:bg-[#e8f0fe] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#1a73e8]">
                <input type="radio" name="gender" value={option} required checked={gender === option} onChange={() => setGender(option)} className="sr-only" />
                <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${gender === option ? "border-[#1a73e8] bg-[#1a73e8] text-white" : "border-[#dadce0] bg-white"}`} aria-hidden="true">{gender === option && <Check size={13} strokeWidth={3} />}</span>
                <Image src={option === "male" ? "/idel.png" : "/female/1.png"} alt="" width={72} height={80} unoptimized className="h-20 w-[72px] object-contain" />
                <span className="text-sm font-medium capitalize">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-4 text-center text-xs text-[#5f6368]">You can change your character in Settings.</p>
        <button type="submit" disabled={!gender} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1557b0] disabled:cursor-not-allowed disabled:bg-[#f1f3f4] disabled:text-[#80868b]">Continue<ArrowRight size={18} /></button>
      </form>
    </main>
  );
}

function CampusMapApp({ initialProfile }: { initialProfile: UserProfile }) {
  const places = useCampusPlaces();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedPlace, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [activeRoute, setActiveRoute] = useState<WalkingRoute | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [isFollowingLocation, setIsFollowingLocation] = useState(true);
  const handleMapInteraction = useCallback(() => setIsFollowingLocation(false), []);
  const selectedLocation = selectedPlace && !isWalking
    ? places.find((place) => place.id === selectedPlace.id) ?? selectedPlace
    : selectedPlace;
  const [sharedPlaceId, setSharedPlaceId] = useState<string | null>(null);
  const openedSharedPlace = useRef(false);
  const [walkingPosition, setWalkingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [walkingBearing, setWalkingBearing] = useState(0);
  const [walkingState, setWalkingState] = useState<WalkingState>("idle");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "denied" | "tracking">("idle");
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");
  const [isRoutePreview, setIsRoutePreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const watchIdRef = useRef<number | null>(null);
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const movementAnchorRef = useRef<{ lat: number; lng: number } | null>(null);
  const previewRequest = useRef<AbortController | null>(null);
  const latestFix = useRef<GeolocationPosition | null>(null);
  const [routeError, setRouteError] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  useEffect(() => () => previewRequest.current?.abort(), []);
  const routeRef = useRef(activeRoute);
  const [rerouteMessage, setRerouteMessage] = useState("");
  useEffect(() => { routeRef.current = activeRoute; }, [activeRoute]);

  const handleMapReady = useCallback((map: unknown) => {
    setMapInstance(map);
  }, []);

  useEffect(() => {
    const placeId = new URLSearchParams(window.location.search).get("place");
    queueMicrotask(() => setSharedPlaceId(placeId));
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latestFix.current = pos;
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!sharedPlaceId || openedSharedPlace.current) return;
    const place = places.find((item) => item.id === sharedPlaceId);
    if (!place) return;
    openedSharedPlace.current = true;
    queueMicrotask(() => setSelectedLocation(place));
  }, [places, sharedPlaceId]);

  const handleLocationSelect = useCallback((location: CampusLocation) => {
    previewRequest.current?.abort(); setRouteLoading(false); setRouteError("");
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
    previewRequest.current?.abort(); setRouteLoading(false); setRouteError("");
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

    previewRequest.current?.abort();
    const controller = new AbortController(); previewRequest.current = controller;
    setTravelMode(mode); setRouteError(""); setRouteLoading(true); setActiveRoute(null); setIsRoutePreview(false);
    const end = selectedLocation.position;
    void (async () => {
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        if (!navigator.geolocation) throw new Error("Your browser does not support location.");
        const cached = latestFix.current;
        const fix = cached && Date.now() - cached.timestamp < 10000 && cached.coords.accuracy <= 25
          ? cached
          : await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }));
        latestFix.current = fix;
        controller.signal.throwIfAborted();
        const start = { lat: fix.coords.latitude, lng: fix.coords.longitude };
        const route = await requestRoute(start, end, mode, controller.signal);
        controller.signal.throwIfAborted();
        setUserPosition(start); setWalkingPosition(start);
        setActiveRoute({ ...route, id: `route-${selectedLocation.id}`, name: `Route to ${selectedLocation.name}`, from: "current", to: selectedLocation.id, isPrototype: false });
        setIsWalking(false); setIsRoutePreview(true); setWalkingState("idle"); setRerouteMessage("");
      } catch (error) {
        if (previewRequest.current === controller) setRouteError(controller.signal.aborted ? "Route request timed out. Please retry." : error instanceof Error ? error.message : "Enable location permission and try again.");
      } finally {
        clearTimeout(timeout);
        if (previewRequest.current === controller) setRouteLoading(false);
      }
    })();
  }, [selectedLocation, mapInstance]);

  const handleBeginNavigation = useCallback(() => {
    if (!selectedLocation || !activeRoute || routeLoading) return;
    setSelectedLocation(selectedLocation);
    const gate = places.find((location) => location.id === "main-gate");
    const startPosition = walkingPosition ?? userPosition ?? gate?.position;
    if (startPosition) setWalkingPosition(startPosition);
    setIsRoutePreview(false);
    setIsWalking(true);
    setIsFollowingLocation(true);
    setWalkingState("idle");
    setLocationStatus("tracking");
    prevPositionRef.current = null;
    movementAnchorRef.current = null;
  }, [selectedLocation, walkingPosition, userPosition, activeRoute, routeLoading, places]);

  useEffect(() => {
    if (!isWalking || !selectedLocation || !navigator.geolocation) return;

    const end = selectedLocation.position;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastReroute = 0;
    let deviationCount = 0;
    let deviationSince = 0;
    let furthestProgress = 0;
    let lastFixTimestamp = 0;
    let request: AbortController | null = null;
    let disposed = false;
    const reroute = async (start: Coordinate, heading: number | null) => {
      lastReroute = Date.now();
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      setRerouteMessage("Updating your route…");
      try {
        const result = await requestRoute(start, end, travelMode, controller.signal, heading);
        if (disposed || controller.signal.aborted) return;
        const updated: WalkingRoute = { ...result, id: `route-${selectedLocation.id}`, name: `Route to ${selectedLocation.name}`, from: "current", to: selectedLocation.id, isPrototype: false };
        routeRef.current = updated;
        setActiveRoute(updated);
        furthestProgress = 0;
        deviationCount = 0;
        deviationSince = 0;
        setRerouteMessage("Route updated from your current location.");
      } catch { if (!disposed) setRerouteMessage("Could not update route. Keeping the previous route and retrying as you move."); }
      finally { clearTimeout(timeout); request = null; }
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (disposed || pos.timestamp <= lastFixTimestamp) return;
        lastFixTimestamp = pos.timestamp;
        latestFix.current = pos;
        const nextPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        const anchor = movementAnchorRef.current;
        const displacement = anchor ? haversineDistance(anchor.lat, anchor.lng, nextPosition.lat, nextPosition.lng) : 0;
        const speed = pos.coords.speed;
        const hasSpeed = speed !== null && Number.isFinite(speed) && speed >= 0;
        const reliable = Number.isFinite(pos.coords.accuracy) && pos.coords.accuracy <= 25;
        if (!reliable) {
          deviationCount = 0;
          deviationSince = 0;
          return;
        }
        const moving = reliable && (hasSpeed ? speed >= 0.5 : displacement >= Math.max(WALKING_MOVEMENT_THRESHOLD_METERS, Math.min(pos.coords.accuracy, 8)));

        if (moving) {
          const heading = pos.coords.heading;
          if (heading !== null && Number.isFinite(heading)) setWalkingBearing(heading);
          else if (anchor && displacement >= WALKING_MOVEMENT_THRESHOLD_METERS) setWalkingBearing(getBearing(anchor, nextPosition));
          if (!anchor || displacement >= WALKING_MOVEMENT_THRESHOLD_METERS) movementAnchorRef.current = nextPosition;
          setWalkingState("walking");
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => { setWalkingState("idle"); movementAnchorRef.current = null; }, 2500);
        } else if (!reliable || (hasSpeed && speed < 0.5)) {
          if (idleTimer) clearTimeout(idleTimer);
          setWalkingState("idle");
          movementAnchorRef.current = nextPosition;
        } else if (!anchor) movementAnchorRef.current = nextPosition;

        prevPositionRef.current = nextPosition;
        setWalkingPosition(nextPosition);
        if (pos.coords.accuracy <= 15 && haversineDistance(nextPosition.lat, nextPosition.lng, end.lat, end.lng) < 15) { disposed = true; request?.abort(); handleArrived(); return; }
        const heading = pos.coords.heading !== null && Number.isFinite(pos.coords.heading) ? pos.coords.heading : anchor && displacement >= 3 ? getBearing(anchor, nextPosition) : null;
        const route = routeRef.current;
        if (route) {
          const deviation = routeDeviation(nextPosition, route.points, heading);
          const offRoute = deviation.distance > Math.max(15, pos.coords.accuracy * 1.5);
          if (!offRoute) furthestProgress = Math.max(furthestProgress, deviation.progressMeters);
          const backtracking = moving && deviation.wrongWay && furthestProgress - deviation.progressMeters > Math.max(15, pos.coords.accuracy * 2);
          if (offRoute || backtracking) {
            if (deviationCount === 0) deviationSince = pos.timestamp;
            deviationCount += 1;
          } else { deviationCount = 0; deviationSince = 0; }
          if (deviationCount >= 3 && pos.timestamp - deviationSince >= 3000 && !request && Date.now() - lastReroute > 10000) {
            deviationCount = 0;
            void reroute(nextPosition, heading);
          }
        } else deviationCount = 0;
      },
      (error) => console.error("GPS watch error:", error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => {
      disposed = true;
      request?.abort();
      if (idleTimer) clearTimeout(idleTimer);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isWalking, selectedLocation, handleArrived, travelMode]);

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

  const remainingFraction = activeRoute && walkingPosition && isWalking ? routeDeviation(walkingPosition, activeRoute.points, null).remainingFraction : 1;
  const distance = activeRoute?.distanceMeters !== undefined ? activeRoute.distanceMeters * remainingFraction : null;
  const travelTime = activeRoute?.durationSeconds !== undefined ? activeRoute.durationSeconds * remainingFraction : null;

  return (
    <main className={`campus-map-app relative w-full overflow-hidden bg-zinc-100 ${isWalking ? "navigation-active" : ""} ${isRoutePreview ? "route-preview-active" : ""}`}>
      <SNSCampusMap
        onLocationSelect={handleLocationSelect}
        selectedLocation={selectedLocation}
        activeRoute={activeRoute}
        mapTypeId={profile.mapStyle}
        walkingPosition={walkingPosition}
        walkingBearing={walkingBearing}
        isWalking={isWalking}
        isFollowingLocation={isFollowingLocation}
        onMapInteraction={handleMapInteraction}
        isWalkingMode={travelMode === "walking"}
        walkingState={walkingState}
        pointerStyle={profile.pointerStyle}
        gender={profile.gender}
        onMapReady={handleMapReady}
      />

      {!isWalking && !isRoutePreview && (
        <div className="desktop-map-chips pointer-events-auto absolute left-[424px] right-4 top-[18px] z-30 hidden items-center gap-2 overflow-x-auto pb-2 lg:flex">
          {places.filter((location) => location.showInShortcuts !== false).map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => handleLocationSelect(location)}
              className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#dadce0] bg-white px-3 text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008b92]"
            >
              <MapPin className="h-4 w-4" /> {location.name}
            </button>
          ))}
        </div>
      )}

      {(routeLoading || routeError) && <div role="status" className="absolute left-3 right-3 top-20 z-[70] rounded-xl bg-white p-4 text-sm shadow-lg sm:left-auto sm:max-w-sm">{routeLoading ? "Finding a mapped route…" : routeError}{routeError && <button className="ml-3 font-semibold text-teal-700" onClick={() => handlePrepareRoute(travelMode)}>Retry</button>}</div>}
      {/* Google Maps-style active navigation UI */}
      {isWalking && rerouteMessage && <p role="status" className="absolute left-4 right-4 top-28 z-50 rounded-xl bg-white px-4 py-3 text-sm text-teal-800 shadow-lg sm:right-auto sm:max-w-md">{rerouteMessage}</p>}
      {isWalking && selectedLocation && walkingPosition && (
        <NavigationOverlay
          destination={selectedLocation.name}
          distance={distance ?? 0}
          duration={travelTime ?? 0}
          mode={travelMode}
          onExit={handleStopWalking}
          isFollowingLocation={isFollowingLocation}
          onRecenter={() => { setIsFollowingLocation(true); mapInstance?.moveCamera({ center: walkingPosition, zoom: 20, heading: walkingBearing, tilt: 0 }); }}
          onOverview={() => { setIsWalking(false); setIsRoutePreview(true); }}
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
          onLayers={() => setShowSettings(true)}
          location={selectedLocation}
        />
      )}

      {/* Non-blocking Google-style location notice */}
      {locationStatus === "denied" && (
        <div className="pointer-events-none absolute bottom-5 left-3 right-3 z-[70] flex justify-center safe-bottom sm:bottom-6">
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white/95 text-zinc-600 shadow-lg backdrop-blur-xl transition-colors hover:bg-white hover:text-teal-700 sm:h-12 sm:w-12"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      {selectedLocation && !isWalking && !isRoutePreview && walkingState !== "arrived" && (
        <BottomSheet
          key={selectedLocation.id}
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

      {!selectedLocation && !isWalking && !isRoutePreview && <ExplorePanel onSelect={handleLocationSelect} />}


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
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-2xl transition-colors"
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
