"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER, isInsideCampus } from "@/data/campusBoundary";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import { CampusLocation, WalkingRoute, WalkingState } from "@/types/campus";
import CampusCharacterMarker from "./CampusCharacterMarker";

type Props = {
  onLocationSelect: (location: CampusLocation) => void;
  selectedLocationId: string | null;
  activeRoute: WalkingRoute | null;
  mapTypeId: "satellite" | "roadmap";
  walkingPosition: { lat: number; lng: number } | null;
  walkingBearing: number;
  isWalking: boolean;
  walkingState: WalkingState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapReady?: (map: any) => void;
};

export default function SNSCampusMap({
  onLocationSelect,
  selectedLocationId,
  activeRoute,
  mapTypeId,
  walkingPosition,
  walkingBearing,
  isWalking,
  walkingState,
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
  const heritageOverlayRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminOverlayRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heritageBuildingOverlayRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ihubOverlayRef = useRef<any>(null);
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
        mapTypeId: mapTypeId,
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

      // Create heritage building using GroundOverlay
      const heritageLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "temple");
      if (heritageLocation && heritageLocation.customIcon && isInsideCampus(heritageLocation.position.lat, heritageLocation.position.lng)) {
        const lat = heritageLocation.position.lat;
        const lng = heritageLocation.position.lng;
        const latSize = 0.0006;
        const lngSize = latSize / Math.cos((lat * Math.PI) / 180);
        const overlayBounds = {
          north: lat + latSize / 2,
          south: lat - latSize / 2,
          east: lng + lngSize / 2,
          west: lng - lngSize / 2,
        };
        const groundOverlay = new google.maps.GroundOverlay(
          heritageLocation.customIcon,
          overlayBounds,
          { map, opacity: 0.9, clickable: true }
        );
        groundOverlay.addListener("click", () => {
          onLocationSelect(heritageLocation);
          map.panTo(heritageLocation.position);
          map.setZoom(18);
        });
        heritageOverlayRef.current = groundOverlay;
      }

      // Admin building
      const adminBuildingBounds = {
        north: 11.10009421400155 + 0.00038,
        south: 11.10009421400155 - 0.00038,
        east: 77.02664133529711 + 0.00038,
        west: 77.02664133529711 - 0.00038,
      };
      const adminBuildingLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "admin-building");
      if (adminBuildingLocation && isInsideCampus(adminBuildingLocation.position.lat, adminBuildingLocation.position.lng)) {
        const adminOverlay = new google.maps.GroundOverlay("/admin_building.png", adminBuildingBounds, { map, opacity: 0.9, clickable: true });
        adminOverlay.addListener("click", () => {
          onLocationSelect(adminBuildingLocation);
          map.panTo(adminBuildingLocation.position);
          map.setZoom(18);
        });
        adminOverlayRef.current = adminOverlay;
      }

      // Heritage courtyard
      const heritageBuildingBounds = {
        north: 11.101011353839342 + 0.0004,
        south: 11.101011353839342 - 0.0004,
        east: 77.0275747454194 + 0.0005,
        west: 77.0275747454194 - 0.0005,
      };
      const heritageBuildingLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "heritage-courtyard");
      if (heritageBuildingLocation && isInsideCampus(heritageBuildingLocation.position.lat, heritageBuildingLocation.position.lng)) {
        const heritageBuildingOverlay = new google.maps.GroundOverlay("/heritage_building.png", heritageBuildingBounds, { map, opacity: 0.9, clickable: true });
        heritageBuildingOverlay.addListener("click", () => {
          onLocationSelect(heritageBuildingLocation);
          map.panTo(heritageBuildingLocation.position);
          map.setZoom(18);
        });
        heritageBuildingOverlayRef.current = heritageBuildingOverlay;
      }

      // iHub
      const ihubBounds = {
        north: 11.100081 + 0.00025,
        south: 11.100081 - 0.00025,
        east: 77.027381 + 0.00025,
        west: 77.027381 - 0.00025,
      };
      const ihubLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "ihub");
      if (ihubLocation && isInsideCampus(ihubLocation.position.lat, ihubLocation.position.lng)) {
        const ihubOverlay = new google.maps.GroundOverlay("/ihub.png", ihubBounds, { map, opacity: 0.9, clickable: true });
        ihubOverlay.addListener("click", () => {
          onLocationSelect(ihubLocation);
          map.panTo(ihubLocation.position);
          map.setZoom(18);
        });
        ihubOverlayRef.current = ihubOverlay;
      }

      onMapReady?.(map);
      return true;
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Failed to initialize Google Maps");
      return false;
    }
  }, [onMapReady, mapTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [mapTypeId]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current.clear();
  }, [isMapLoaded]);

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
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          strokeColor: "#4285F4",
          strokeOpacity: 0.2,
          strokeWeight: 1,
          clickable: false,
        });
        blueDotPulseRef.current = pulse;
      } else {
        blueDotPulseRef.current.setCenter(pos);
      }

      // Blue dot
      if (!blueDotRef.current) {
        const dot = new google.maps.Circle({
          map: mapRef.current,
          center: pos,
          radius: 7,
          fillColor: "#4285F4",
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
  }, [walkingPosition, isWalking, isMapLoaded]);

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
        strokeColor: "#1A73E8",
        strokeOpacity: 0.4,
        strokeWeight: 10,
        map: mapRef.current,
        clickable: false,
      });

      // Main route line
      const polyline = new google.maps.Polyline({
        path: activeRoute.points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 1,
        strokeWeight: 6,
        map: mapRef.current,
        clickable: false,
        icons: isWalking ? undefined : [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            fillColor: "#4285F4",
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

  // Cleanup
  useEffect(() => {
    const markers = markersRef.current;
    const heritageOverlay = heritageOverlayRef.current;
    const adminOverlay = adminOverlayRef.current;
    const heritageBuildingOverlay = heritageBuildingOverlayRef.current;
    const ihubOverlay = ihubOverlayRef.current;
    const boundary = boundaryRef.current;
    const polyline = routePolylineRef.current;
    const blueDot = blueDotRef.current;
    const blueDotPulse = blueDotPulseRef.current;
    return () => {
      markers.forEach((marker: { map: null }) => { marker.map = null; });
      heritageOverlay?.setMap(null);
      adminOverlay?.setMap(null);
      heritageBuildingOverlay?.setMap(null);
      ihubOverlay?.setMap(null);
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
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {isWalking && walkingPosition && mapInstance && (
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
