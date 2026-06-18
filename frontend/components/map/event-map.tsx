"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
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
};

function MapCenterController({ center }: { center: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.latitude, center.longitude], map.getZoom(), {
      animate: true,
    });
  }, [center, map]);

  return null;
}

function makeMarker(color: string, label: string) {
  return divIcon({
    className: "",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 9999px 9999px 9999px 4px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.95);
        box-shadow: 0 10px 18px rgba(0,0,0,0.24);
        display:flex;
        align-items:center;
        justify-content:center;
        color:#020617;
        font-size:8px;
        font-weight:800;
        transform: rotate(-45deg);
      ">${label}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 24],
    popupAnchor: [0, -22],
  });
}

export function EventMap({
  center,
  events,
  title = "Live map",
  subtitle = "Pins update as you search the loaded events.",
  fullscreen = false,
}: EventMapProps) {
  const mapCenter = center ?? {
    latitude: I_HUB_LOCATION.latitude,
    longitude: I_HUB_LOCATION.longitude,
  };

  const selectedLocation = [mapCenter.latitude, mapCenter.longitude] as LatLngExpression;

  return (
    <section
      className={
        fullscreen
          ? "h-full w-full overflow-hidden"
          : "overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20"
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
              ? "relative h-[100vh] w-full"
              : "overflow-hidden rounded-[1.75rem] border border-white/10"
          }
        >
          <div className={fullscreen ? "absolute inset-0" : "relative h-[620px]"}>
            <MapContainer
              center={selectedLocation}
              zoom={18}
              scrollWheelZoom
              className="h-full w-full"
            >
              <MapCenterController center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[mapCenter.latitude, mapCenter.longitude]}
                icon={makeMarker("#22c55e", "S")}
              >
                <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  {COLLEGE_NAME}
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{COLLEGE_NAME}</div>
                    <div className="text-sm text-slate-600">College marker</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[AI_CAMPUS_LOCATION.latitude, AI_CAMPUS_LOCATION.longitude]}
                icon={makeMarker("#f59e0b", "A")}
              >
                <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  {AI_CAMPUS_NAME}
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{AI_CAMPUS_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[SPINE_CENTER_LOCATION.latitude, SPINE_CENTER_LOCATION.longitude]}
                icon={makeMarker("#a855f7", "C")}
              >
                <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  {SPINE_CENTER_NAME}
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{SPINE_CENTER_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[DT_PLAYHOUSE_LOCATION.latitude, DT_PLAYHOUSE_LOCATION.longitude]}
                icon={makeMarker("#ef4444", "D")}
              >
                <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  {DT_PLAYHOUSE_NAME}
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{DT_PLAYHOUSE_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[SNS_LAWN_LOCATION.latitude, SNS_LAWN_LOCATION.longitude]}
                icon={makeMarker("#14b8a6", "L")}
              >
                <Tooltip permanent direction="top" offset={[0, -18]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  Lawn
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{SNS_LAWN_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[MECH_DEPT_LOCATION.latitude, MECH_DEPT_LOCATION.longitude]}
                icon={makeMarker("#f97316", "M")}
              >
                <Tooltip permanent direction="right" offset={[12, 0]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  Mech
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{MECH_DEPT_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[CSE_DEPT_LOCATION.latitude, CSE_DEPT_LOCATION.longitude]}
                icon={makeMarker("#06b6d4", "C")}
              >
                <Tooltip permanent direction="left" offset={[-12, 0]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  CSE
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{CSE_DEPT_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[
                  SNS_COLLEGE_OF_TECHNOLOGY_LOCATION.latitude,
                  SNS_COLLEGE_OF_TECHNOLOGY_LOCATION.longitude,
                ]}
                icon={makeMarker("#84cc16", "T")}
              >
                <Tooltip permanent direction="bottom" offset={[0, 12]} className="border-0 bg-transparent p-0 text-xs font-semibold text-white shadow-none">
                  SNS Tech
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{SNS_COLLEGE_OF_TECHNOLOGY_NAME}</div>
                    <div className="text-sm text-slate-600">Separate campus location</div>
                  </div>
                </Popup>
              </Marker>

              {events.map((event) => (
                <Marker
                  key={event.id}
                  position={[event.latitude, event.longitude]}
                  icon={makeMarker("#67e8f9", "E")}
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
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
