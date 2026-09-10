"use client";

import { useEffect, useRef } from "react";

const WALK_FRAMES = ["/step_1.png", "/step_3.png", "/step_4.png", "/step_5.png", "/step_6.png"];
const IDLE_FRAME = "/idel.png";
const FRAME_DURATION = 150;
const CHARACTER_SIZE = 100;

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any;
  position: { lat: number; lng: number } | null;
  bearing: number;
  isMoving: boolean;
};

export default function CampusCharacterMarker({
  map,
  position,
  bearing,
  isMoving,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const currentBearingRef = useRef(0);
  const targetBearingRef = useRef(0);

  useEffect(() => {
    if (!map || overlayRef.current) return;

    const container = document.createElement("div");
    container.style.width = `${CHARACTER_SIZE}px`;
    container.style.height = `${CHARACTER_SIZE}px`;
    container.style.position = "relative";
    container.style.transformOrigin = "center center";
    container.className = "walking-character idle";
    containerRef.current = container;

    const img = document.createElement("img");
    img.src = IDLE_FRAME;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.display = "block";
    img.style.imageRendering = "auto";
    img.draggable = false;
    container.appendChild(img);

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function () {
      container.style.position = "absolute";
      container.style.pointerEvents = "none";
      this.getPanes()?.overlayMouseTarget.appendChild(container);
    };
    overlay.draw = function () {
      const projection = this.getProjection();
      const m = this.getMap();
      if (!projection || !m || !("getBounds" in m)) return;

      const worldPoint = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(position?.lat ?? 0, position?.lng ?? 0)
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
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!overlayRef.current || !position) return;
    overlayRef.current.draw();
  }, [position]);

  useEffect(() => {
    if (!overlayRef.current || !containerRef.current) return;

    targetBearingRef.current = bearing;

    const img = containerRef.current.querySelector("img");
    if (!img) return;

    if (!isMoving) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      containerRef.current.className = "walking-character idle";
      containerRef.current.style.cursor = "default";
      img.src = IDLE_FRAME;
      const smoothIdle = () => {
        const diff = ((targetBearingRef.current - currentBearingRef.current + 180) % 360) - 180;
        if (Math.abs(diff) > 0.5) {
          currentBearingRef.current += diff * 0.15;
          if (containerRef.current) {
            containerRef.current.style.transform = `rotate(${currentBearingRef.current}deg)`;
          }
          animFrameRef.current = requestAnimationFrame(smoothIdle);
        }
      };
      animFrameRef.current = requestAnimationFrame(smoothIdle);
      return;
    }

    frameIndexRef.current = 0;
    lastFrameTimeRef.current = 0;
    containerRef.current.className = "walking-character walking";
    containerRef.current.style.cursor = "pointer";

    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;

      if (timestamp - lastFrameTimeRef.current >= FRAME_DURATION) {
        frameIndexRef.current = (frameIndexRef.current + 1) % WALK_FRAMES.length;
        img.src = WALK_FRAMES[frameIndexRef.current];
        lastFrameTimeRef.current = timestamp;
      }

      const diff = ((targetBearingRef.current - currentBearingRef.current + 180) % 360) - 180;
      if (Math.abs(diff) > 0.5) {
        currentBearingRef.current += diff * 0.15;
      } else {
        currentBearingRef.current = targetBearingRef.current;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `rotate(${currentBearingRef.current}deg)`;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isMoving, bearing]);

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
