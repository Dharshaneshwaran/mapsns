export type AdPlacement = "landing" | "placeCard";

export type AdBanner = {
  id: string;
  enabled: boolean;
  placements: AdPlacement[];
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  buttonLabel: string;
  order: number;
};

export type AdsConfig = {
  banners: AdBanner[];
};

export function adImageSource(value: string): string | null {
  const source = value.trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(source)) return source;
  const local = source.startsWith("uploads/") ? `/${source}` : source;
  return /^\/(?!\/)/.test(local) ? local : null;
}

let _counter = 0;
function nextId(): string {
  _counter++;
  return `ad-${Date.now()}-${_counter}`;
}

export function createBanner(overrides: Partial<Omit<AdBanner, "id">> & { id?: string } = {}): AdBanner {
  return {
    id: overrides.id ?? nextId(),
    enabled: overrides.enabled ?? true,
    placements: overrides.placements ?? ["landing"],
    eyebrow: overrides.eyebrow ?? "",
    title: overrides.title ?? "",
    description: overrides.description ?? "",
    imageUrl: overrides.imageUrl ?? "",
    linkUrl: overrides.linkUrl ?? "",
    buttonLabel: overrides.buttonLabel ?? "Learn more",
    order: overrides.order ?? 0,
  };
}

export const DEFAULT_ADS: AdsConfig = {
  banners: [
    {
      id: "default-landing",
      enabled: true,
      placements: ["landing"],
      eyebrow: "Campus spotlight",
      title: "Discover SNS Innovation Hub",
      description: "Explore student innovation, technology projects, events, and opportunities across the SNS campus.",
      imageUrl: "/ihub.png",
      linkUrl: "https://snsce.ac.in",
      buttonLabel: "Learn more",
      order: 0,
    },
    {
      id: "default-placecard",
      enabled: true,
      placements: ["placeCard"],
      eyebrow: "Advertisement",
      title: "Discover SNS Innovation Hub",
      description: "Explore student innovation, technology projects, events, and opportunities across the SNS campus.",
      imageUrl: "/ihub.png",
      linkUrl: "https://snsce.ac.in",
      buttonLabel: "Learn more",
      order: 0,
    },
  ],
};

export async function fetchAds(): Promise<AdsConfig> {
  const response = await fetch("/api/ads", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load advertisements");
  return response.json() as Promise<AdsConfig>;
}

export async function fetchBannersForPlacement(placement: AdPlacement): Promise<AdBanner[]> {
  const config = await fetchAds();
  return config.banners
    .filter((b) => b.enabled && b.placements.includes(placement))
    .sort((a, b) => a.order - b.order);
}
