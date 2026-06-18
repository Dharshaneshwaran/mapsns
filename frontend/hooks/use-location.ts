"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Coordinates } from "@/types/event";

type LocationState = {
  loading: boolean;
  error: string | null;
  coordinates: Coordinates | null;
};

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    loading: false,
    error: null,
    coordinates: null,
  });
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({
        loading: false,
        error: "Geolocation is not available in this browser.",
        coordinates: null,
      });
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (!("geolocation" in navigator)) {
      setState({
        loading: false,
        error: "Geolocation is not available in this browser.",
        coordinates: null,
      });
      return null;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setState({
            loading: false,
            error: null,
            coordinates,
          });
          resolve(coordinates);
        },
        (error) => {
          setState({
            loading: false,
            error:
              error.code === error.PERMISSION_DENIED
                ? "Location permission denied. You can still browse all events."
                : "Unable to detect your location right now.",
            coordinates: null,
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30_000,
          timeout: 12_000,
        },
      );
    });
  }, []);

  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    setState((current) => ({ ...current, loading: true, error: null }));

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setState({
          loading: false,
          error: null,
          coordinates,
        });
      },
      (error) => {
        setState({
          loading: false,
          error:
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied."
              : "Unable to track your location.",
          coordinates: null,
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 10_000,
      },
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
  };
}
