"use client";

import { useEffect, useRef } from "react";
import type { Gender } from "./SettingsDialog";

const WALK_FRAMES = ["/step_1.png", "/step_3.png", "/step_4.png", "/step_5.png", "/step_6.png"];
const IDLE_FRAME = "/idel.png";
const FEMALE_FRAMES = ["w 1.png", "w2.png", "w3.png", "w4.png"].map(name => `/female_v_2/${encodeURIComponent(name)}`);
const CART_FRAMES = Array.from({ length: 8 }, (_, index) => `/bullet_cart_v1/${index + 11}.png`);
const FRAME_DURATION = 150;
const CHARACTER_SIZE = 64;
const SPRITE_SCALE = CHARACTER_SIZE / 112;
const SPRITE_WIDTH = 125 * SPRITE_SCALE;
const SPRITE_HEIGHT = 222 * SPRITE_SCALE;
const SPRITE_LEFT = -6 * SPRITE_SCALE;
const SPRITE_TOP = -52 * SPRITE_SCALE;

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any;
  position: { lat: number; lng: number } | null;
  bearing: number;
  isMoving: boolean;
  vehicle?: boolean;
  gender?: Gender;
};

export default function CampusCharacterMarker({
  map,
  position,
  bearing,
  isMoving,
  vehicle = false,
  gender = "male",
}: Props) {
  const frames = vehicle ? CART_FRAMES : gender === "female" ? FEMALE_FRAMES : WALK_FRAMES;
  const idleFrame = vehicle || gender === "female" ? frames[0] : IDLE_FRAME;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const currentBearingRef = useRef(180);
  const targetBearingRef = useRef(180);
  const positionRef = useRef(position);

  useEffect(() => {
    if (!map || overlayRef.current) return;

    const container = document.createElement("div");
    container.style.width = `${CHARACTER_SIZE}px`;
    container.style.height = `${CHARACTER_SIZE}px`;
    container.style.position = "relative";
    container.style.pointerEvents = "none";
    container.style.zIndex = "1000";
    containerRef.current = container;

    const visual = document.createElement("div");
    visual.style.width = "100%";
    visual.style.height = "100%";
    visual.style.position = "relative";
    visual.style.overflow = "hidden";
    visual.style.transformOrigin = "center center";
    visual.style.transform = "rotate(180deg)";
    visual.style.filter = "drop-shadow(0 3px 3px rgba(0, 0, 0, 0.28))";
    visual.className = "walking-character-visual idle";
    visualRef.current = visual;
    container.appendChild(visual);

    const img = document.createElement("img");
    img.src = idleFrame;
    img.alt = vehicle ? "Bullet cart" : `${gender === "female" ? "Female" : "Male"} walking pointer`;
    img.style.position = "absolute";
    img.style.width = `${SPRITE_WIDTH}px`;
    img.style.height = `${SPRITE_HEIGHT}px`;
    img.style.maxWidth = "none";
    img.style.left = `${SPRITE_LEFT}px`;
    img.style.top = `${SPRITE_TOP}px`;
    img.style.display = "block";
    img.style.imageRendering = "auto";
    img.draggable = false;
    if (!vehicle && gender === "female") {
      // Center the shared artwork bounds across all four 767 × 776 frames.
      // Keep one scale and anchor so the walk cycle does not jump between frames.
      const scale = 96 / 776;
      img.style.width = `${767 * scale}px`;
      img.style.height = "96px";
      img.style.left = `${CHARACTER_SIZE / 2 - 441 * scale}px`;
      img.style.top = `${CHARACTER_SIZE / 2 - 397.5 * scale}px`;
      img.style.objectFit = "contain";
      visual.style.overflow = "visible";
    }
    if (vehicle) {
      img.style.width = "112px";
      img.style.height = "112px";
      img.style.left = "-24px";
      img.style.top = "-24px";
      img.style.objectFit = "contain";
      visual.style.overflow = "visible";
    }
    visual.appendChild(img);

    frames.forEach((frame) => {
      const preload = new Image();
      preload.src = frame;
    });

    const overlay = new google.maps.OverlayView();
    const updateRotation = () => {
      visual.style.transform = `rotate(${currentBearingRef.current - (map.getHeading() || 0)}deg)`;
    };
    const headingListener = map.addListener("heading_changed", updateRotation);
    overlay.onAdd = function () {
      container.style.position = "absolute";
      container.style.pointerEvents = "none";
      this.getPanes()?.overlayMouseTarget.appendChild(container);
    };
    overlay.draw = function () {
      const projection = this.getProjection();
      const m = this.getMap();
      if (!projection || !m || !("getBounds" in m)) return;

      const pos = positionRef.current;
      const worldPoint = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(pos?.lat ?? 0, pos?.lng ?? 0)
      );
      if (!worldPoint) return;

      container.style.left = `${worldPoint.x - CHARACTER_SIZE / 2}px`;
      container.style.top = `${worldPoint.y - CHARACTER_SIZE / 2}px`;
    };
    overlay.onRemove = function () {
      container.parentNode?.removeChild(container);
    };
    overlay.setMap(map);
    overlayRef.current = overlay;
    return () => { headingListener.remove(); overlay.setMap(null); overlayRef.current = null; };
  }, [map, vehicle, gender, frames, idleFrame]);

  useEffect(() => {
    positionRef.current = position;
    if (!overlayRef.current || !position) return;
    overlayRef.current.draw();
  }, [position]);

  useEffect(() => {
    // The artwork faces south. Ignore idle GPS headings entirely.
    if (isMoving && Number.isFinite(bearing)) targetBearingRef.current = (bearing + 180) % 360;
  }, [bearing, isMoving]);

  useEffect(() => {
    if (!overlayRef.current || !visualRef.current) return;

    const img = visualRef.current.querySelector("img");
    if (!img) return;

    if (!isMoving) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      visualRef.current.className = "walking-character-visual idle";
      img.src = idleFrame;
      return;
    }

    frameIndexRef.current = 0;
    lastFrameTimeRef.current = 0;
    visualRef.current.className = "walking-character-visual walking";
    img.src = frames[0];

    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;

      if (timestamp - lastFrameTimeRef.current >= FRAME_DURATION) {
        frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;
        img.src = frames[frameIndexRef.current];
        lastFrameTimeRef.current = timestamp;
      }

      const diff = ((targetBearingRef.current - currentBearingRef.current + 180) % 360 + 360) % 360 - 180;
      if (Math.abs(diff) > 0.5) {
        currentBearingRef.current += diff * 0.15;
      } else {
        currentBearingRef.current = targetBearingRef.current;
      }

      if (visualRef.current) {
        visualRef.current.style.transform = `rotate(${currentBearingRef.current - (map.getHeading() || 0)}deg)`;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isMoving, map, vehicle, frames, idleFrame]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, []);

  return null;
}
