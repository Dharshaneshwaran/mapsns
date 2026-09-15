export type AdPlacement = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  buttonLabel: string;
};

export type AdsConfig = {
  landing: AdPlacement;
  placeCard: AdPlacement;
};

export const DEFAULT_ADS: AdsConfig = {
  landing: {
    enabled: true,
    eyebrow: "Campus spotlight",
    title: "Discover SNS Innovation Hub",
    description: "Explore student innovation, technology projects, events, and opportunities across the SNS campus.",
    imageUrl: "/ihub.png",
    linkUrl: "https://snsce.ac.in",
    buttonLabel: "Learn more",
  },
  placeCard: {
    enabled: true,
    eyebrow: "Advertisement",
    title: "Discover SNS Innovation Hub",
    description: "Explore student innovation, technology projects, events, and opportunities across the SNS campus.",
    imageUrl: "/ihub.png",
    linkUrl: "https://snsce.ac.in",
    buttonLabel: "Learn more",
  },
};

export async function fetchAds(): Promise<AdsConfig> {
  const response = await fetch("/api/ads", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load advertisements");
  return response.json() as Promise<AdsConfig>;
}
