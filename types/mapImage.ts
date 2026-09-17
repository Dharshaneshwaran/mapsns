export type MapImage = {
  id: string;
  name: string;
  src: string;
  lat: number;
  lng: number;
  width: number; // Longitude span, so size stays fixed on the ground when zooming.
  height: number; // Latitude span.
  rotation: number;
  opacity: number;
  locationId?: string;
  showInShortcuts?: boolean;
};

export type MapImageDocument = { revision: string; images: MapImage[] };
