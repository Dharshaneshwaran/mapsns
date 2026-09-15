"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import { CampusLocation, WalkingRoute, WalkingState } from "@/types/campus";
import CampusCharacterMarker from "./CampusCharacterMarker";
import PublishedMapImages from "./PublishedMapImages";
import { publishedPlaces } from "@/lib/publishedPlaces";
import type { PointerStyle } from "./SettingsDialog";

type Props = {
  onLocationSelect: (location: CampusLocation) => void;
  selectedLocation: CampusLocation | null;
  activeRoute: WalkingRoute | null;
  mapTypeId: "satellite" | "roadmap" | "hybrid";
  walkingPosition: { lat: number; lng: number } | null;
  walkingBearing: number;
  isWalking: boolean;
  isWalkingMode: boolean;
  walkingState: WalkingState;
  pointerStyle: PointerStyle;
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
  isWalkingMode,
  walkingState,
  pointerStyle,
  onMapReady,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedMarkerRef = useRef<any>(null);
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
        mapTypeId: "roadmap",
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
        styles: [
          { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.medical", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.place_of_worship", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.attraction", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.government", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.park", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.school", elementType: "all", stylers: [{ visibility: "off" }] },
          { featureType: "poi.sports_complex", elementType: "all", stylers: [{ visibility: "off" }] },
        ],
      });

      map.fitBounds(bounds, 0);
      mapRef.current = map;
      setMapInstance(map);

      const boundary = new google.maps.Polygon({
        paths: CAMPUS_BOUNDARY.map(
          (c) => new google.maps.LatLng(c.lat, c.lng)
        ),
        strokeColor: "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: 2.5,
        fillColor: "#10b981",
        fillOpacity: 0.08,
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

    if (!selectedLocation || isWalking) {
      selectedMarkerRef.current?.setMap(null);
      selectedMarkerRef.current = null;
      return;
    }

    if (!selectedMarkerRef.current) {
      selectedMarkerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: selectedLocation.position,
        title: selectedLocation.name,
        zIndex: 10000,
      });
    } else {
      selectedMarkerRef.current.setPosition(selectedLocation.position);
      selectedMarkerRef.current.setTitle(selectedLocation.name);
      selectedMarkerRef.current.setMap(mapRef.current);
    }

    mapRef.current.panTo(selectedLocation.position);
    mapRef.current.setZoom(18);
  }, [selectedLocation, isWalking, isMapLoaded]);

  // Blue dot - Google Maps style
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    if (!window.google) return;

    if (walkingPosition && isWalking) {
      const pos = new google.maps.LatLng(walkingPosition.lat, walkingPosition.lng);

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
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(18);
      } else {
        blueDotRef.current.setCenter(pos);
        blueDotRef.current.setOptions({ fillColor: pointerColor });
      }

      // Auto-pan map to follow user
      mapRef.current.panTo(pos);
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
  }, [walkingPosition, isWalking, isMapLoaded, pointerColor]);

  // Update route polyline - Google Maps style blue line
  useEffect(() => {
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
        strokeColor: "#4B2ECC",
        strokeOpacity: 0.4,
        strokeWeight: 10,
        map: mapRef.current,
        clickable: false,
      });

      // Main route line
      const polyline = new google.maps.Polyline({
        path: activeRoute.points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
        geodesic: true,
        strokeColor: "#5B35E5",
        strokeOpacity: 1,
        strokeWeight: 6,
        map: mapRef.current,
        clickable: false,
        icons: isWalking ? undefined : [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            fillColor: "#5B35E5",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1,
          },
          offset: "0%",
          repeat: "80px",
        }],
      });

      // White border line on top
      const borderPolyline = new google.maps.Polyline({
        path: activeRoute.points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
        geodesic: true,
        strokeColor: "#ffffff",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        map: mapRef.current,
        clickable: false,
      });

      routePolylineRef.current = { shadow: shadowPolyline, main: polyline, border: borderPolyline };

      // Keep the close navigation camera when starting or updating a route.
      if (isWalking) return;
      // Fit bounds to route, but constrain to campus area
      const routeBounds = new google.maps.LatLngBounds();
      activeRoute.points.forEach((p) => routeBounds.extend(new google.maps.LatLng(p.lat, p.lng)));

      const campusBounds = new google.maps.LatLngBounds();
      CAMPUS_BOUNDARY.forEach((c) => campusBounds.extend(new google.maps.LatLng(c.lat, c.lng)));

      // If route extends outside campus, use campus bounds instead
      const sw = routeBounds.getSouthWest();
      const ne = routeBounds.getNorthEast();
      const campusSw = campusBounds.getSouthWest();
      const campusNe = campusBounds.getNorthEast();

      if (sw.lat() < campusSw.lat() || sw.lng() < campusSw.lng() ||
          ne.lat() > campusNe.lat() || ne.lng() > campusNe.lng()) {
        mapRef.current.fitBounds(campusBounds, 80);
      } else {
        mapRef.current.fitBounds(routeBounds, 80);
      }
    }
  }, [activeRoute, isMapLoaded, isWalking]);

  useEffect(() => {
    if (!mapInstance || !isWalking || !walkingPosition) return;
    const heading = mapInstance.getHeading() || 0;
    const delta = ((walkingBearing - heading + 540) % 360) - 180;
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / 450);
      mapInstance.moveCamera({ center: walkingPosition, heading: heading + delta * progress, tilt: 0 });
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mapInstance, isWalking, walkingPosition, walkingBearing]);

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
    const selectedMarker = selectedMarkerRef.current;
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
      selectedMarker?.setMap(null);
    };
  }, []);

  if (mapError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold mb-2">Map unavailable</h2>
          <p className="text-zinc-400 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-map-canvas relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {mapInstance && <PublishedMapImages map={mapInstance} onClick={(image) => {
        const location = publishedPlaces([image]).find((item) => item.id === image.locationId);
        if (location) onLocationSelect(location);
      }} />}
      {isWalking && isWalkingMode && walkingPosition && mapInstance && pointerStyle === "character" && (
        <CampusCharacterMarker
          map={mapInstance}
          position={walkingPosition}
          bearing={walkingBearing}
          isMoving={walkingState === "walking"}
        />
      )}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm">Loading campus map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
