"use client";

import { useEffect, useRef } from "react";
import { WalkPoint, WalkingState } from "@/types/campus";

type Props = {
  route: WalkPoint[] | null;
  isWalking: boolean;
  onPositionUpdate: (lat: number, lng: number, heading: number) => void;
  onStateChange: (state: WalkingState) => void;
  onArrived: () => void;
};

function getBearing(from: WalkPoint, to: WalkPoint): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function WalkingCharacter({
  route,
  isWalking,
  onPositionUpdate,
  onStateChange,
  onArrived,
}: Props) {
  const animFrameRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const progressRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const prevHeadingRef = useRef(0);

  useEffect(() => {
    if (!isWalking || !route || route.length < 2) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    currentIndexRef.current = 0;
    progressRef.current = 0;
    lastTimestampRef.current = null;
    prevHeadingRef.current = 0;
    onStateChange("walking");

    function animate(timestamp: number) {
      const currentRoute = route;
      if (!currentRoute || currentRoute.length < 2) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const speed = 0.0008;
      progressRef.current += delta * speed;

      if (progressRef.current >= 1) {
        progressRef.current = 0;
        currentIndexRef.current++;

        if (currentIndexRef.current >= currentRoute.length - 1) {
          const last = currentRoute[currentRoute.length - 1];
          onPositionUpdate(last.lat, last.lng, prevHeadingRef.current);
          onStateChange("arrived");
          onArrived();
          return;
        }

        onStateChange("turning");
        setTimeout(() => {
          if (currentIndexRef.current < currentRoute.length - 1) {
            const newHeading = getBearing(
              currentRoute[currentIndexRef.current],
              currentRoute[currentIndexRef.current + 1]
            );
            prevHeadingRef.current = newHeading;
            onStateChange("walking");
          }
        }, 300);
      }

      const from = currentRoute[currentIndexRef.current];
      const to = currentRoute[Math.min(currentIndexRef.current + 1, currentRoute.length - 1)];

      const lat = lerp(from.lat, to.lat, progressRef.current);
      const lng = lerp(from.lng, to.lng, progressRef.current);

      const heading = getBearing(from, to);
      const smoothedHeading =
        Math.abs(heading - prevHeadingRef.current) > 180
          ? heading
          : lerp(prevHeadingRef.current, heading, 0.1);
      prevHeadingRef.current = smoothedHeading;

      onPositionUpdate(lat, lng, smoothedHeading);

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isWalking, route, onPositionUpdate, onStateChange, onArrived]);

  return null;
}
