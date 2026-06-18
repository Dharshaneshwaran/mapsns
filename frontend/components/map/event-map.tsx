"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";

import { formatDistance } from "@/lib/events";
import {
  AI_CAMPUS_LOCATION,
  AI_CAMPUS_NAME,
  DT_PLAYHOUSE_LOCATION,
  DT_PLAYHOUSE_NAME,
  I_HUB_LOCATION,
  COLLEGE_NAME,
  CSE_DEPT_LOCATION,
  CSE_DEPT_NAME,
  MECH_DEPT_LOCATION,
  MECH_DEPT_NAME,
  SNS_LAWN_LOCATION,
  SNS_LAWN_NAME,
  SNS_COLLEGE_OF_TECHNOLOGY_LOCATION,
  SNS_COLLEGE_OF_TECHNOLOGY_NAME,
  SPINE_CENTER_LOCATION,
  SPINE_CENTER_NAME,
} from "@/lib/college-location";
import type { Coordinates, EventWithDistance } from "@/types/event";

type EventMapProps = {
  center?: Coordinates | null;
  events: EventWithDistance[];
  title?: string;
  subtitle?: string;
  fullscreen?: boolean;
  panelClassName?: string;
  mapHeightClassName?: string;
  onEventSelect?: (event: EventWithDistance) => void;
  userLocation?: Coordinates | null;
  selectedEvent?: EventWithDistance | null;
  routeCoords?: [number, number][] | null;
};

function MapCenterController({ center }: { center: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const timeout = setTimeout(() => {
      map.invalidateSize();
      map.setView([center.latitude, center.longitude], map.getZoom() || 18, {
        animate: true,
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [center, map]);

  return null;
}

function MapClickHandler({ onClear }: { onClear: () => void }) {
  useMapEvents({
    click: () => {
      onClear();
    },
  });
  return null;
}

const MIN_PLACE_ZOOM = 16;
const MIN_DISTANCE_PX = 38;

type Place = {
  id: string;
  position: LatLngExpression;
  label: string;
  title: string;
  description: string;
  color: string;
};

function PlacesLayer({
  markers,
  selectedMarkerId,
  setSelectedMarkerId,
}: {
  markers: Place[];
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
}) {
  const map = useMap();
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!map) return;
    const update = () => {
      const zoom = map.getZoom();
      if (zoom < MIN_PLACE_ZOOM) {
        // only keep the selected marker visible
        setVisibleIds(selectedMarkerId ? [selectedMarkerId] : []);
        return;
      }

      const chosen: { id: string; point: any }[] = [];
      for (const m of markers) {
        // always include selected marker
        if (selectedMarkerId === m.id) {
          const p = map.latLngToLayerPoint(m.position as any);
          chosen.push({ id: m.id, point: p });
          continue;
        }
        const p = map.latLngToLayerPoint(m.position as any);
        const colliding = chosen.some((c) => c.point.distanceTo(p) < MIN_DISTANCE_PX);
        if (!colliding) chosen.push({ id: m.id, point: p });
      }
      setVisibleIds(chosen.map((c) => c.id));
    };

    update();
    map.on("moveend zoomend resize", update);
    return () => void map.off("moveend zoomend resize", update);
  }, [map, markers, selectedMarkerId]);

  return (
    <>
      {markers.map((m) => {
        const selected = selectedMarkerId === m.id;
        if (!selected && !visibleIds.includes(m.id)) return null;
        return (
          <Marker
            key={m.id}
            position={m.position}
            icon={selected ? makeMarker(m.color, m.label) : makePlaceIcon(m.color, m.title)}
            eventHandlers={{ click: () => setSelectedMarkerId(m.id) }}
          >
            {selected ? (
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-sm text-slate-600">{m.description}</div>
                </div>
              </Popup>
            ) : null}
          </Marker>
        );
      })}
    </>
  );
}

function makeMarker(color: string, label: string) {
  return divIcon({
    className: "",
    html: `
      <div style="
        position:relative;
        width:32px; height:40px;
        display:flex; align-items:center; justify-content:center;
      ">
        <svg width="32" height="40" viewBox="0 0 32 40" style="position:absolute;inset:0">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path d="M16 2C9.4 2 4 7.4 4 14c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
            fill="${color}" stroke="rgba(255,255,255,0.95)" stroke-width="2" filter="url(#shadow)"/>
        </svg>
        <span style="
          position:relative; z-index:1;
          color:#fff; font-size:10px; font-weight:800;
          margin-bottom:4px; line-height:1;
        ">${label}</span>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
}

function makeDestMarker(color: string) {
  return divIcon({
    className: "",
    html: `
      <div style="
        position:relative;
        width:36px; height:46px;
        display:flex; align-items:center; justify-content:center;
      ">
        <svg width="36" height="46" viewBox="0 0 36 46" style="position:absolute;inset:0">
          <defs>
            <filter id="shadow-dest" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.35"/>
            </filter>
          </defs>
          <path d="M18 2C10.3 2 4 8.3 4 16c0 10.5 14 28 14 28s14-17.5 14-28c0-7.7-6.3-14-14-14z"
            fill="${color}" stroke="rgba(255,255,255,0.95)" stroke-width="2.5" filter="url(#shadow-dest)"/>
          <circle cx="18" cy="16" r="5" fill="rgba(255,255,255,0.4)"/>
        </svg>
        <span style="
          position:relative; z-index:1;
          color:#fff; font-size:13px; font-weight:800;
          margin-bottom:6px; line-height:1;
        ">★</span>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

function makePlaceIcon(color: string, title: string) {
  return divIcon({
    className: "",
    html: `
      <div style="
        padding: 4px 8px;
        border-radius: 8px;
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(0,0,0,0.06);
        color: ${color};
        font-size: 12px;
        font-weight:600;
        white-space:nowrap;
      ">${title}</div>
    `,
    iconSize: [10, 10],
    iconAnchor: [10, 6],
    popupAnchor: [0, -22],
  });
}

const CAMPUS_MARKERS = [
  {
    id: "restroom-1",
    position: [11.101152121170886, 77.02602375483531] as LatLngExpression,
    label: "R1",
    title: "Restroom no. 1",
    description: "Campus restroom",
    color: "#ec4899",
  },
  {
    id: "restroom-2",
    position: [11.103758078932051, 77.0277031814663] as LatLngExpression,
    label: "R2",
    title: "Restroom no. 2",
    description: "Campus restroom",
    color: "#ec4899",
  },
  {
    id: "boys-restroom",
    position: [11.100777362138214, 77.02717188070457] as LatLngExpression,
    label: "BR",
    title: "Boys restroom",
    description: "Campus restroom",
    color: "#ec4899",
  },
  {
    id: "sns-canteen-1",
    position: [11.100802316817546, 77.02753590666593] as LatLngExpression,
    label: "C1",
    title: "SNS Canteen 1",
    description: "Campus canteen",
    color: "#f97316",
  },
  {
    id: "abhis-cafe",
    position: [11.103203577856956, 77.0276775542044] as LatLngExpression,
    label: "AC",
    title: "Abhis Cafe",
    description: "Campus cafe",
    color: "#f97316",
  },
  {
    id: "cafe-square",
    position: [11.103314094540458, 77.02698055533851] as LatLngExpression,
    label: "CS",
    title: "Cafe Square",
    description: "Campus cafe",
    color: "#f97316",
  },
  {
    id: "volleyball-ground",
    position: [11.103987734890795, 77.0268176570159] as LatLngExpression,
    label: "VG",
    title: "Volleyball ground",
    description: "Campus sports facility",
    color: "#0ea5e9",
  },
  {
    id: "canteen-2",
    position: [11.103643571345566, 77.02767208740153] as LatLngExpression,
    label: "C2",
    title: "Canteen 2",
    description: "Campus canteen",
    color: "#f97316",
  },
  {
    id: "indore-badminton",
    position: [11.101799190820543, 77.02764767754073] as LatLngExpression,
    label: "IB",
    title: "Indore Badminton",
    description: "Campus sports facility",
    color: "#0ea5e9",
  },
  {
    id: "cafe",
    position: [11.102136711150571, 77.02779635577538] as LatLngExpression,
    label: "CF",
    title: "Cafe",
    description: "Campus cafe",
    color: "#f97316",
  },
  {
    id: "juice-world",
    position: [11.100699525099818, 77.02733700658891] as LatLngExpression,
    label: "JW",
    title: "Juice world",
    description: "Refreshment spot",
    color: "#f97316",
  },
  {
    id: "mario",
    position: [11.10118512056965, 77.02641387005826] as LatLngExpression,
    label: "M",
    title: "Mario",
    description: "Campus landmark",
    color: "#22c55e",
  },
  {
    id: "boys-hostel",
    position: [11.101276577920542, 77.02634729771269] as LatLngExpression,
    label: "BH",
    title: "Boys hostel",
    description: "Student housing",
    color: "#22c55e",
  },
  {
    id: "girls-hostel",
    position: [11.10118076545699, 77.0278584899574] as LatLngExpression,
    label: "GH",
    title: "Girls hostel",
    description: "Student housing",
    color: "#22c55e",
  },
  {
    id: "sitting-area",
    position: [11.103406219600854, 77.02705296457815] as LatLngExpression,
    label: "SA",
    title: "Sitting area",
    description: "Outdoor seating",
    color: "#22c55e",
  },
  {
    id: "park",
    position: [11.100560161233052, 77.02619640038648] as LatLngExpression,
    label: "P",
    title: "Park",
    description: "Green space",
    color: "#22c55e",
  },
  {
    id: "temple",
    position: [11.10032716211579, 77.02596783533332] as LatLngExpression,
    label: "T",
    title: "Temple",
    description: "Campus temple",
    color: "#a855f7",
  },
  {
    id: "sitting-place",
    position: [11.100723478260496, 77.02650485225435] as LatLngExpression,
    label: "SP",
    title: "Sitting place",
    description: "Outdoor seating",
    color: "#22c55e",
  },
  {
    id: "design-thinking",
    position: [11.103510741500774, 77.02639833652296] as LatLngExpression,
    label: "DT",
    title: "Design thinking",
    description: "Campus design hub",
    color: "#a855f7",
  },
  {
    id: "administrative-office",
    position: [11.10114810211571, 77.02650041412095] as LatLngExpression,
    label: "AO",
    title: "Administrative office",
    description: "Campus administration",
    color: "#0ea5e9",
  },
];

const MANUAL_PLACES: Place[] = [
  {
    id: "college-center",
    position: [I_HUB_LOCATION.latitude, I_HUB_LOCATION.longitude] as LatLngExpression,
    label: "S",
    title: COLLEGE_NAME,
    description: "College marker",
    color: "#22c55e",
  },
  {
    id: "ai-campus",
    position: [AI_CAMPUS_LOCATION.latitude, AI_CAMPUS_LOCATION.longitude] as LatLngExpression,
    label: "A",
    title: AI_CAMPUS_NAME,
    description: "Separate campus location",
    color: "#f59e0b",
  },
  {
    id: "spine-center",
    position: [SPINE_CENTER_LOCATION.latitude, SPINE_CENTER_LOCATION.longitude] as LatLngExpression,
    label: "C",
    title: SPINE_CENTER_NAME,
    description: "Spine center",
    color: "#a855f7",
  },
  {
    id: "dt-playhouse",
    position: [DT_PLAYHOUSE_LOCATION.latitude, DT_PLAYHOUSE_LOCATION.longitude] as LatLngExpression,
    label: "D",
    title: DT_PLAYHOUSE_NAME,
    description: "Design thinking playhouse",
    color: "#ef4444",
  },
  {
    id: "sns-lawn",
    position: [SNS_LAWN_LOCATION.latitude, SNS_LAWN_LOCATION.longitude] as LatLngExpression,
    label: "L",
    title: SNS_LAWN_NAME,
    description: "Lawn",
    color: "#14b8a6",
  },
  {
    id: "mech-dept",
    position: [MECH_DEPT_LOCATION.latitude, MECH_DEPT_LOCATION.longitude] as LatLngExpression,
    label: "M",
    title: MECH_DEPT_NAME,
    description: "Mechanical dept",
    color: "#f97316",
  },
  {
    id: "cse-dept",
    position: [CSE_DEPT_LOCATION.latitude, CSE_DEPT_LOCATION.longitude] as LatLngExpression,
    label: "C",
    title: CSE_DEPT_NAME,
    description: "CSE dept",
    color: "#06b6d4",
  },
  {
    id: "sns-tech",
    position: [
      SNS_COLLEGE_OF_TECHNOLOGY_LOCATION.latitude,
      SNS_COLLEGE_OF_TECHNOLOGY_LOCATION.longitude,
    ] as LatLngExpression,
    label: "T",
    title: SNS_COLLEGE_OF_TECHNOLOGY_NAME,
    description: "SNS Tech",
    color: "#84cc16",
  },
];

const ALL_PLACES: Place[] = [...MANUAL_PLACES, ...CAMPUS_MARKERS];

export function EventMap({
  center,
  events,
  title = "Live map",
  subtitle = "Pins update as you search the loaded events.",
  fullscreen = false,
  panelClassName,
  mapHeightClassName,
  onEventSelect,
  userLocation,
  selectedEvent,
  routeCoords,
}: EventMapProps) {
  const mapCenter = center ?? {
    latitude: I_HUB_LOCATION.latitude,
    longitude: I_HUB_LOCATION.longitude,
  };

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const selectedLocation = [mapCenter.latitude, mapCenter.longitude] as LatLngExpression;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Leaflet needs a resize pass when the container height changes after mount.
      // Without this, the map can look blank even though the control chrome shows up.
      window.dispatchEvent(new Event("resize"));
    }, 50);

    return () => window.clearTimeout(timer);
  }, [fullscreen, mapHeightClassName]);

  return (
    <section
      className={
        [
          fullscreen
            ? "h-full w-full overflow-hidden"
            : "overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20",
          panelClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {fullscreen ? null : (
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">{title}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-300/20">
            {events.length} events
          </span>
        </div>
      )}

      <div className={fullscreen ? "h-full w-full" : "p-4"}>
        <div
          className={
            fullscreen
              ? `relative ${mapHeightClassName ?? "h-[100vh]"} w-full`
              : [
                  "overflow-hidden rounded-[1.75rem] border border-white/10",
                  mapHeightClassName ?? "h-[620px]",
                ].join(" ")
          }
        >
          <div className={fullscreen ? "absolute inset-0" : "relative h-full"}>
              <MapContainer
              key="event-map"
              center={selectedLocation}
              zoom={18}
              scrollWheelZoom
              className="h-full w-full"
            >
              <MapCenterController center={mapCenter} />
              {/* Clear selection when clicking the map background */}
              {/** Map click handler component */}
              <MapClickHandler onClear={() => setSelectedMarkerId(null)} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PlacesLayer markers={ALL_PLACES} selectedMarkerId={selectedMarkerId} setSelectedMarkerId={setSelectedMarkerId} />

              {events.filter((e) => e.id !== selectedEvent?.id).map((event) => (
                <Marker
                  key={event.id}
                  position={[event.latitude, event.longitude]}
                  icon={makeMarker("#67e8f9", "E")}
                  eventHandlers={
                    onEventSelect
                      ? {
                          click: () => onEventSelect(event),
                        }
                      : undefined
                  }
                >
                  <Popup>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {event.title}
                      </div>
                      <div className="text-xs text-slate-600">{event.category}</div>
                      <div className="text-xs text-slate-600">
                        {formatDistance(event.distanceKm)}
                      </div>
                      <div className="text-xs text-slate-600">
                        {event.address}, {event.city}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {userLocation ? (
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={makeMarker("#3b82f6", "Y")}
                >
                  <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                    Your location
                  </Tooltip>
                </Marker>
              ) : null}

              {userLocation && selectedEvent ? (
                <>
                  <Marker
                    position={[selectedEvent.latitude, selectedEvent.longitude]}
                    icon={makeDestMarker("#ef4444")}
                    zIndexOffset={2000}
                  >
                    <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                      {selectedEvent.title}
                    </Tooltip>
                  </Marker>
                  {routeCoords ? (
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{ color: "#3b82f6", weight: 4 }}
                    />
                  ) : (
                    <Polyline
                      positions={[
                        [userLocation.latitude, userLocation.longitude],
                        [selectedEvent.latitude, selectedEvent.longitude],
                      ]}
                      pathOptions={{ color: "#3b82f6", weight: 3, dashArray: "8 4" }}
                    />
                  )}
                </>
              ) : null}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
