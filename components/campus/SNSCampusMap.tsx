"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import { CampusLocation, CampusCategory, WalkingRoute } from "@/types/campus";

type Props = {
  activeCategory: CampusCategory | "all";
  onLocationSelect: (location: CampusLocation) => void;
  selectedLocationId: string | null;
  activeRoute: WalkingRoute | null;
  mapTypeId: "satellite" | "roadmap";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapReady?: (map: any) => void;
};

export default function SNSCampusMap({
  activeCategory,
  onLocationSelect,
  selectedLocationId,
  activeRoute,
  mapTypeId,
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "greedy",
        disableDefaultUI: true,
        minZoom: 15,
        maxZoom: 21,
      });

      map.fitBounds(bounds, 0);
      mapRef.current = map;

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

      // Create heritage building using GroundOverlay (scales with zoom, feels "pasted in map")
      const heritageLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "temple");
      if (heritageLocation && heritageLocation.customIcon) {
        const lat = heritageLocation.position.lat;
        const lng = heritageLocation.position.lng;

        // Image is landscape (wider than tall), match that ratio
        const width = 0.0007;
        const height = 0.0005;

        const bounds = {
          north: lat + height / 2,
          south: lat - height / 2,
          east: lng + width / 2,
          west: lng - width / 2,
        };

        const groundOverlay = new google.maps.GroundOverlay(
          heritageLocation.customIcon,
          bounds,
          {
            map: map,
            opacity: 0.9,
            clickable: true,
          }
        );

        groundOverlay.addListener("click", () => {
          onLocationSelect(heritageLocation);
          map.panTo(heritageLocation.position);
          map.setZoom(18);
        });

        heritageOverlayRef.current = groundOverlay;
      }

      // Create admin building overlay at specified coordinates
      const adminBuildingBounds = {
        north: 11.10009421400155 + 0.00038,
        south: 11.10009421400155 - 0.00038,
        east: 77.02664133529711 + 0.00038,
        west: 77.02664133529711 - 0.00038,
      };

      const adminBuildingLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "admin-building");
      const adminOverlay = new google.maps.GroundOverlay(
        "/admin_building.png",
        adminBuildingBounds,
        {
          map: map,
          opacity: 0.9,
          clickable: true,
        }
      );

      if (adminBuildingLocation) {
        adminOverlay.addListener("click", () => {
          onLocationSelect(adminBuildingLocation);
          map.panTo(adminBuildingLocation.position);
          map.setZoom(18);
        });
      }

      adminOverlayRef.current = adminOverlay;

      // Create heritage courtyard building overlay
      const heritageBuildingBounds = {
        north: 11.101011353839342 + 0.0004,
        south: 11.101011353839342 - 0.0004,
        east: 77.0275747454194 + 0.0005,
        west: 77.0275747454194 - 0.0005,
      };

      const heritageBuildingLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "heritage-courtyard");
      const heritageBuildingOverlay = new google.maps.GroundOverlay(
        "/heritage_building.png",
        heritageBuildingBounds,
        {
          map: map,
          opacity: 0.9,
          clickable: true,
        }
      );

      if (heritageBuildingLocation) {
        heritageBuildingOverlay.addListener("click", () => {
          onLocationSelect(heritageBuildingLocation);
          map.panTo(heritageBuildingLocation.position);
          map.setZoom(18);
        });
      }

      heritageBuildingOverlayRef.current = heritageBuildingOverlay;

      // Create ihub overlay
      const ihubBounds = {
        north: 11.100081 + 0.00025,
        south: 11.100081 - 0.00025,
        east: 77.027381 + 0.00025,
        west: 77.027381 - 0.00025,
      };

      const ihubLocation = CAMPUS_LOCATIONS.find((loc) => loc.id === "ihub");
      const ihubOverlay = new google.maps.GroundOverlay(
        "/ihub.png",
        ihubBounds,
        {
          map: map,
          opacity: 0.9,
          clickable: true,
        }
      );

      if (ihubLocation) {
        ihubOverlay.addListener("click", () => {
          onLocationSelect(ihubLocation);
          map.panTo(ihubLocation.position);
          map.setZoom(18);
        });
      }

      ihubOverlayRef.current = ihubOverlay;

      onMapReady?.(map);

      return true;
    } catch (err) {
      setMapError(
        err instanceof Error ? err.message : "Failed to initialize Google Maps"
      );
      return false;
    }
  }, [onMapReady, mapTypeId]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const success = await initMap();
      if (!cancelled && success) {
        setIsMapLoaded(true);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [initMap]);

  // Switch map type when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(mapTypeId);
  }, [mapTypeId]);

  // POI markers removed - only ground overlays shown
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();
  }, [isMapLoaded]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (activeRoute) {
      const polyline = new google.maps.Polyline({
        path: activeRoute.points.map(
          (p) => new google.maps.LatLng(p.lat, p.lng)
        ),
        geodesic: true,
        strokeColor: "#10b981",
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapRef.current,
      });
      routePolylineRef.current = polyline;

      const bounds = new google.maps.LatLngBounds();
      activeRoute.points.forEach((p) =>
        bounds.extend(new google.maps.LatLng(p.lat, p.lng))
      );
      mapRef.current.fitBounds(bounds, 80);
    }
  }, [activeRoute, isMapLoaded]);

  // Cleanup
  useEffect(() => {
    const markers = markersRef.current;
    const heritageOverlay = heritageOverlayRef.current;
    const adminOverlay = adminOverlayRef.current;
    const heritageBuildingOverlay = heritageBuildingOverlayRef.current;
    const ihubOverlay = ihubOverlayRef.current;
    const boundary = boundaryRef.current;
    const polyline = routePolylineRef.current;
    return () => {
      markers.forEach((marker: { map: null }) => {
        marker.map = null;
      });
      heritageOverlay?.setMap(null);
      adminOverlay?.setMap(null);
      heritageBuildingOverlay?.setMap(null);
      ihubOverlay?.setMap(null);
      boundary?.setMap(null);
      polyline?.setMap(null);
    };
  }, []);

  if (mapError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold mb-2">Map unavailable</h2>
          <p className="text-zinc-400 text-sm">{mapError}</p>
          <p className="text-zinc-500 text-xs mt-4">
            Check that VITE_GOOGLE_MAPS_API_KEY is set in .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
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

function createMarkerElement(
  location: CampusLocation,
  isSelected: boolean
): HTMLDivElement {
  const colors: Record<CampusCategory, { bg: string; border: string; icon: string }> = {
    academic: { bg: "#1a1a1a", border: "#3b82f6", icon: "🏛️" },
    food: { bg: "#1a1a1a", border: "#f59e0b", icon: "🍽️" },
    sports: { bg: "#1a1a1a", border: "#10b981", icon: "⚽" },
    hostel: { bg: "#1a1a1a", border: "#8b5cf6", icon: "🏠" },
    gate: { bg: "#1a1a1a", border: "#ef4444", icon: "🚪" },
    library: { bg: "#1a1a1a", border: "#06b6d4", icon: "📚" },
    auditorium: { bg: "#1a1a1a", border: "#ec4899", icon: "🎭" },
    admin: { bg: "#1a1a1a", border: "#64748b", icon: "🏢" },
    other: { bg: "#1a1a1a", border: "#78716c", icon: "📍" },
  };

  const color = colors[location.category];
  const size = isSelected ? 44 : 36;
  const scale = isSelected ? 1.15 : 1;

  const div = document.createElement("div");
  div.style.position = "relative";
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.gap = "4px";
  div.innerHTML = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      transform: scale(${scale});
      transition: transform 0.2s ease;
      cursor: pointer;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
      flex-shrink: 0;
    ">
      <div style="
        width: 100%;
        height: 100%;
        background: ${color.bg};
        border: 2px solid ${color.border};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? "18px" : "15px"};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${color.icon}
      </div>
      ${isSelected ? `
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color.border};
        "></div>
      ` : ""}
    </div>
    <div style="
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      pointer-events: none;
    ">
      ${location.name.length > 15 ? location.name.substring(0, 15) + '...' : location.name}
    </div>
  `;
  return div;
}
