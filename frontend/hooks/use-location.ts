"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({
        loading: false,
        error: "Geolocation is not available in this browser.",
        coordinates: null,
      });
    }
  }, []);

  const requestLocation = async (): Promise<Coordinates | null> => {
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
  };

  return {
    ...state,
    requestLocation,
  };
}
