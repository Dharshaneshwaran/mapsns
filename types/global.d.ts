// Global ambient types for Google Maps JS API
// The @types/google.maps package provides the google.maps namespace.
// We extend Window to include the runtime `google` object.

interface Window {
  google?: typeof google;
}
