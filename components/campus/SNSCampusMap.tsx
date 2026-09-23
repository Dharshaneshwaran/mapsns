"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import { CampusLocation, WalkingRoute, WalkingState } from "@/types/campus";
import CampusCharacterMarker from "./CampusCharacterMarker";
import PublishedMapImages from "./PublishedMapImages";
import { publishedPlaces } from "@/lib/publishedPlaces";
import { remainingRoute, routePointerPosition } from "@/lib/routeDeviation";
import type { Gender, PointerStyle } from "./SettingsDialog";

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
  const pointerColor = pointerStyle === "red" ? "#EA4335" : pointerStyle === "green" ? "#34A853" : "#4285F4";

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
        renderingType: google.maps.RenderingType.VECTOR,
        headingInteractionEnabled: true,
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
        // Embedded styles only apply to raster maps; vector maps need cloud map styling.
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
          { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eeebef" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#faf9fb" }] },
          { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98929d" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbe2e8" }] },
        ],
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

    if (routePolylineRef.current) {
      const rp = routePolylineRef.current;
      rp.shadow?.setMap(null);
      rp.main?.setMap(null);
      rp.border?.setMap(null);
      routePolylineRef.current = null;
    }

    if (activeRoute) {
      const google = window.google;
      if (!google) return;

      // Outer glow line (shadow)
      const shadowPolyline = new google.maps.Polyline({
        path: activeRoute.points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
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
        path: activeRoute.points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
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
    }
  }, [activeRoute, isMapLoaded, isWalking]);

  useEffect(() => {
    if (!isWalking || !walkingPosition || !activeRoute || !routePolylineRef.current) return;
    const remaining = remainingRoute(walkingPosition, activeRoute.points, completedRouteProgress.current);
    completedRouteProgress.current = remaining.progress;
    routePolylineRef.current.main.setPath(remaining.points);
    routePolylineRef.current.shadow.setPath(remaining.points);
  }, [walkingPosition, activeRoute, isWalking, isMapLoaded]);

  // Pause camera following only for user gestures, not programmatic camera changes.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!mapInstance || !container || !isWalking || !isFollowingLocation) return;
    const pauseFollowing = () => {
      if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current);
      onMapInteraction();
    };
    let pointer: { id: number; x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => { pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; };
    const pointerMove = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5) pauseFollowing();
    };
    const pointerUp = () => { pointer = null; };
    const keyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "+", "-", "="].includes(event.key)) pauseFollowing();
    };
    const dragListener = mapInstance.addListener("dragstart", pauseFollowing);
    container.addEventListener("pointerdown", pointerDown, { passive: true });
    container.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    container.addEventListener("wheel", pauseFollowing, { passive: true });
    container.addEventListener("dblclick", pauseFollowing);
    container.addEventListener("keydown", keyDown);
    return () => {
      dragListener.remove();
      container.removeEventListener("pointerdown", pointerDown);
      container.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      container.removeEventListener("wheel", pauseFollowing);
      container.removeEventListener("dblclick", pauseFollowing);
      container.removeEventListener("keydown", keyDown);
    };
  }, [mapInstance, isWalking, isFollowingLocation, onMapInteraction]);

  useEffect(() => {
    if (!mapInstance || !isWalking || !walkingPosition || !isFollowingLocation) return;
    const heading = mapInstance.getHeading() || 0;
    const delta = ((walkingBearing - heading + 540) % 360) - 180;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / 450);
      mapInstance.moveCamera({ center: walkingPosition, heading: heading + delta * progress, tilt: 0 });
      if (progress < 1) cameraFrameRef.current = requestAnimationFrame(animate);
    };
    cameraFrameRef.current = requestAnimationFrame(animate);
    return () => { if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current); };
  }, [mapInstance, isWalking, walkingPosition, walkingBearing, isFollowingLocation]);

  useEffect(() => {
    if (mapInstance && isWalking) mapInstance.setZoom(20);
  }, [mapInstance, isWalking]);

  // Return to north-up when navigation ends.
  useEffect(() => {
    if (!mapInstance || isWalking) return;
    if (mapInstance.getHeading?.()) mapInstance.moveCamera({ heading: 0, tilt: 0 });
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
    <div className="campus-map-canvas relative w-full h-full">
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
