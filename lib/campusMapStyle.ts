// Shared Google Maps styling so the admin heatmap matches the public campus map.
export const CAMPUS_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eeebef" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#faf9fb" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98929d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbe2e8" }] },
];
