"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_MAP_STYLES } from "@/lib/campusMapStyle";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import { CampusLocation, WalkingRoute, WalkingState } from "@/types/campus";
import CampusCharacterMarker from "./CampusCharacterMarker";
import PublishedMapImages from "./PublishedMapImages";
import { publishedPlaces } from "@/lib/publishedPlaces";
import { remainingRoute, routePointerPosition } from "@/lib/routeDeviation";
import { POINTER_COLOR_BY_STYLE, type Gender, type PointerStyle } from "./SettingsDialog";
import { createRasterMapRotation, shortestHeadingDelta } from "@/lib/rasterMapRotation";

// This ID must reference the published campus style in Google Cloud.
// Without it, preserve the existing styled raster map.
const configuredMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
const campusMapId = configuredMapId && !["DEMO_MAP_ID", "your_map_id", "your-map-id"].includes(configuredMapId)
  ? configuredMapId : undefined;

type Props = {
  onLocationSelect: (location: CampusLocation) => void;
  selectedLocation: CampusLocation | null;
  activeRoute: WalkingRoute | null;
  mapTypeId: "satellite" | "roadmap";
  walkingPosition: { lat: number; lng: number } | null;
  walkingBearing: number;
  isWalking: boolean;
  isFollowingLocation: boolean;
  onMapInteraction: () => void;
  isWalkingMode: boolean;
  walkingState: WalkingState;
  pointerStyle: PointerStyle;
  gender: Gender;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapReady?: (map: any) => void;
};

export default function SNSCampusMap({
  onLocationSelect,
  selectedLocation,
  activeRoute,
  mapTypeId,
  walkingPosition,
  walkingBearing,
  isWalking,
  isFollowingLocation,
  onMapInteraction,
  isWalkingMode,
  walkingState,
  pointerStyle,
  gender,
  onMapReady,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const rasterRotationRef = useRef<ReturnType<typeof createRasterMapRotation> | null>(null);
  const rasterHeadingRef = useRef(0);
  const cameraFrameRef = useRef<number | null>(null);
  const completedRouteProgress = useRef(0);
  const initialMapType = useRef(mapTypeId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boundaryRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routePolylineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blueDotRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blueDotPulseRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);
  const pointerColor = POINTER_COLOR_BY_STYLE[pointerStyle] ?? POINTER_COLOR_BY_STYLE.blue;

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      const google = await loadGoogleMapsApi();

      const bounds = new google.maps.LatLngBounds();
      CAMPUS_BOUNDARY.forEach((coord) =>
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng))
      );

      const map = new google.maps.Map(mapContainerRef.current, {
        center: CAMPUS_CENTER,
        zoom: 17,
        mapTypeId: initialMapType.current,
        renderingType: campusMapId ? google.maps.RenderingType.VECTOR : google.maps.RenderingType.RASTER,
        ...(campusMapId ? { mapId: campusMapId } : { styles: CAMPUS_MAP_STYLES }),
        isFractionalZoomEnabled: false,
        tiltInteractionEnabled: false,
        tilt: 0,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "greedy",
        disableDefaultUI: true,
        minZoom: 15,
        maxZoom: 21,
        clickableIcons: false,
        // Vector rotation uses the same campus style published against campusMapId.
      });

      map.fitBounds(bounds, 0);
      mapRef.current = map;
      setMapInstance(map);

      const boundary = new google.maps.Polygon({
        paths: CAMPUS_BOUNDARY.map(
          (c) => new google.maps.LatLng(c.lat, c.lng)
        ),
        strokeColor: "#b2a7bd",
        strokeOpacity: 0.35,
        strokeWeight: 1,
        fillColor: "#e7e0ed",
        fillOpacity: 0.02,
        clickable: false,
      });
      boundary.setMap(map);
      boundaryRef.current = boundary;


      onMapReady?.(map);
      return true;
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Failed to initialize Google Maps");
      return false;
    }
  }, [onMapReady]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const success = await initMap();
      if (!cancelled && success) setIsMapLoaded(true);
    }
    init();
    return () => { cancelled = true; };
  }, [initMap]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(mapTypeId);
  }, [mapTypeId, isMapLoaded]);

  useEffect(() => {
    if (!mapInstance) return;
    // Keep the renderer and style fixed. Return to north-up when leaving navigation.
    if (!isWalking) mapInstance.moveCamera({ heading: 0, tilt: 0 });
  }, [mapInstance, isWalking]);



  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current.clear();
  }, [isMapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !window.google) return;

    if (!selectedLocation || isWalking) return;

    mapRef.current.panTo(selectedLocation.position);
    mapRef.current.setZoom(18);
  }, [selectedLocation, isWalking, isMapLoaded]);

  // Blue dot - Google Maps style
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    if (!window.google) return;

    if (walkingPosition && isWalking) {
      const pos = new google.maps.LatLng(walkingPosition.lat, walkingPosition.lng);

      // The character is the position indicator; keep its background transparent.
      if (!isWalkingMode || pointerStyle === "character") {
        blueDotRef.current?.setMap(null);
        blueDotRef.current = null;
        blueDotPulseRef.current?.setMap(null);
        blueDotPulseRef.current = null;
        return;
      }

      // Blue pulse circle (accuracy ring)
      if (!blueDotPulseRef.current) {
        const pulse = new google.maps.Circle({
          map: mapRef.current,
          center: pos,
          radius: 15,
          fillColor: pointerColor,
          fillOpacity: 0.15,
          strokeColor: pointerColor,
          strokeOpacity: 0.2,
          strokeWeight: 1,
          clickable: false,
        });
        blueDotPulseRef.current = pulse;
      } else {
        blueDotPulseRef.current.setCenter(pos);
        blueDotPulseRef.current.setOptions({ fillColor: pointerColor, strokeColor: pointerColor });
      }

      // Blue dot
      if (!blueDotRef.current) {
        const dot = new google.maps.Circle({
          map: mapRef.current,
          center: pos,
          radius: 7,
          fillColor: pointerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeOpacity: 1,
          strokeWeight: 3,
          clickable: false,
          zIndex: 9999,
        });
        blueDotRef.current = dot;
      } else {
        blueDotRef.current.setCenter(pos);
        blueDotRef.current.setOptions({ fillColor: pointerColor });
      }

    } else {
      // Remove blue dot when not walking
      if (blueDotRef.current) {
        blueDotRef.current.setMap(null);
        blueDotRef.current = null;
      }
      if (blueDotPulseRef.current) {
        blueDotPulseRef.current.setMap(null);
        blueDotPulseRef.current = null;
      }
    }
  }, [walkingPosition, isWalking, isWalkingMode, isMapLoaded, pointerColor, pointerStyle]);

  // Update route polyline - Google Maps style blue line
  useEffect(() => {
    completedRouteProgress.current = 0;
    if (!mapRef.current || !isMapLoaded) return;

    if (activeRoute) {
      const google = window.google;
      if (!google) return;
      const path = activeRoute.points.map((p) => new google.maps.LatLng(p.lat, p.lng));
      const existing = routePolylineRef.current;
      // While navigating, only swap the path so the line does not flicker on reroute.
      if (existing && isWalking) {
        existing.main.setPath(path);
        existing.shadow.setPath(path);
        return;
      }
      if (existing) {
        existing.shadow?.setMap(null);
        existing.main?.setMap(null);
        existing.border?.setMap(null);
        routePolylineRef.current = null;
      }

      // Outer glow line (shadow)
      const shadowPolyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#174ea6",
        strokeOpacity: 1,
        strokeWeight: 8,
        zIndex: 10,
        map: mapRef.current,
        clickable: false,
      });

      // Main route line
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#4285f4",
        strokeOpacity: 1,
        strokeWeight: 6,
        zIndex: 11,
        map: mapRef.current,
        clickable: false,
        icons: isWalking ? undefined : [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            fillColor: "#4285f4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
          },
          offset: "0%",
          repeat: "80px",
        }],
      });

      routePolylineRef.current = { shadow: shadowPolyline, main: polyline };

      // Keep the close navigation camera when starting or updating a route.
      if (isWalking) return;
      // Show the entire route, including the user's position outside campus.
      const routeBounds = new google.maps.LatLngBounds();
      activeRoute.points.forEach((p) => routeBounds.extend(new google.maps.LatLng(p.lat, p.lng)));

      mapRef.current.fitBounds(routeBounds, 80);
      return;
    }

    if (routePolylineRef.current) {
      const rp = routePolylineRef.current;
      rp.shadow?.setMap(null);
      rp.main?.setMap(null);
      rp.border?.setMap(null);
      routePolylineRef.current = null;
    }
  }, [activeRoute, isMapLoaded, isWalking]);

  useEffect(() => {
    if (!isWalking || !walkingPosition || !activeRoute || !routePolylineRef.current) return;
    const remaining = remainingRoute(walkingPosition, activeRoute.points, completedRouteProgress.current);
    completedRouteProgress.current = remaining.progress;
    // Start the visible line at the character so a snapped road start never leaves a gap.
    const path = remaining.points.length
      ? [walkingPosition, ...remaining.points]
      : [walkingPosition];
    routePolylineRef.current.main.setPath(path);
    routePolylineRef.current.shadow.setPath(path);
  }, [walkingPosition, activeRoute, isWalking, isMapLoaded]);

  useEffect(() => {
    if (!mapInstance || !mapContainerRef.current || !mapViewportRef.current) return;
    const rotation = createRasterMapRotation(mapContainerRef.current, mapViewportRef.current, () => {
      google.maps.event.trigger(mapInstance, "resize");
    });
    rasterRotationRef.current = rotation;
    const idle = mapInstance.addListener("idle", rotation.refresh);
    return () => { idle.remove(); rotation.dispose(); rasterRotationRef.current = null; };
  }, [mapInstance]);

  useEffect(() => {
    if (isWalking && isFollowingLocation) return;
    rasterRotationRef.current?.reset();
    rasterHeadingRef.current = 0;
  }, [isWalking, isFollowingLocation]);

  // Pause camera following only for user gestures, not programmatic camera changes.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!mapInstance || !container || !isWalking || !isFollowingLocation) return;
    const pauseFollowing = () => {
      if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current);
      // Restore native coordinates before Google handles a drag or zoom gesture.
      rasterRotationRef.current?.reset();
      rasterHeadingRef.current = 0;
      onMapInteraction();
    };
    let pointer: { id: number; x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (rasterHeadingRef.current !== 0) pauseFollowing();
    };
    const pointerMove = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5) pauseFollowing();
    };
    const pointerUp = () => { pointer = null; };
    const keyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "+", "-", "="].includes(event.key)) pauseFollowing();
    };
    const dragListener = mapInstance.addListener("dragstart", pauseFollowing);
    container.addEventListener("pointerdown", pointerDown, { passive: true, capture: true });
    container.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    container.addEventListener("wheel", pauseFollowing, { passive: true, capture: true });
    container.addEventListener("dblclick", pauseFollowing);
    container.addEventListener("keydown", keyDown);
    return () => {
      dragListener.remove();
      container.removeEventListener("pointerdown", pointerDown, true);
      container.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      container.removeEventListener("wheel", pauseFollowing, true);
      container.removeEventListener("dblclick", pauseFollowing);
      container.removeEventListener("keydown", keyDown);
    };
  }, [mapInstance, isWalking, isFollowingLocation, onMapInteraction]);

  useEffect(() => {
    if (!mapInstance || !isWalking || !walkingPosition || !isFollowingLocation) return;
    if (!Number.isFinite(walkingBearing)) return;
    const raster = mapInstance.getRenderingType() !== google.maps.RenderingType.VECTOR;
    if (raster) {
      rasterRotationRef.current?.setHeading(rasterHeadingRef.current);
      mapInstance.panTo(walkingPosition);
    }
    const heading = raster ? rasterHeadingRef.current : mapInstance.getHeading() || 0;
    const delta = shortestHeadingDelta(heading, walkingBearing);
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / 450);
      const nextHeading = heading + delta * progress;
      if (raster) {
        rasterHeadingRef.current = nextHeading;
        rasterRotationRef.current?.setHeading(nextHeading);
      } else mapInstance.moveCamera({ center: walkingPosition, heading: nextHeading, tilt: 0 });
      if (progress < 1) cameraFrameRef.current = requestAnimationFrame(animate);
    };
    cameraFrameRef.current = requestAnimationFrame(animate);
    return () => { if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current); };
  }, [mapInstance, isWalking, walkingPosition, walkingBearing, isFollowingLocation]);

  useEffect(() => {
    if (mapInstance && isWalking) mapInstance.setZoom(20);
  }, [mapInstance, isWalking]);

  // Cleanup
  useEffect(() => {
    const markers = markersRef.current;
    const boundary = boundaryRef.current;
    const polyline = routePolylineRef.current;
    const blueDot = blueDotRef.current;
    const blueDotPulse = blueDotPulseRef.current;
    return () => {
      markers.forEach((marker: { map: null }) => { marker.map = null; });
      boundary?.setMap(null);
      if (polyline) {
        polyline.shadow?.setMap(null);
        polyline.main?.setMap(null);
        polyline.border?.setMap(null);
      }
      blueDot?.setMap(null);
      blueDotPulse?.setMap(null);
    };
  }, []);

  if (mapError) {
    return (
      <div className="campus-map-canvas relative flex h-full w-full items-center justify-center bg-[#e9e4ed] text-[#5d5368]">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold mb-2">Map unavailable</h2>
          <p className="text-[#81758c] text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapViewportRef} className="campus-map-canvas relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {mapInstance && <PublishedMapImages map={mapInstance} selectedLocation={selectedLocation} onClick={(image) => {
        const location = publishedPlaces([image]).find((item) => item.id === (image.locationId || image.id));
        if (location) onLocationSelect(location);
      }} />}
      {isWalking && walkingPosition && mapInstance && (!isWalkingMode || pointerStyle === "character") && (
        <CampusCharacterMarker
          map={mapInstance}
          position={activeRoute ? routePointerPosition(walkingPosition, activeRoute.points) : walkingPosition}
          bearing={walkingBearing}
          isMoving={walkingState === "walking"}
          vehicle={!isWalkingMode}
          gender={gender}
        />
      )}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e9e4ed]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#92809f] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#81758c] text-sm">Loading campus map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
