"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { type AdBanner, type AdPlacement, type AdsConfig, createBanner } from "@/lib/ads";

const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  landing: "Landing sidebar",
  placeCard: "Place detail card",
};

function BannerCard({
  banner,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  banner: AdBanner;
  index: number;
  total: number;
  onChange: (updated: AdBanner) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const latest = useRef({ banner, onChange });
  useEffect(() => { latest.current = { banner, onChange }; }, [banner, onChange]);

  return (
    <div className="rounded-xl border border-[#e3e7ee] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="cursor-grab text-[#9aa0a6] hover:text-[#5f6368]" title="Drag to reorder">
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="text-[#9aa0a6] hover:text-[#5f6368] disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="text-[#9aa0a6] hover:text-[#5f6368] disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{banner.title || "Untitled banner"}</p>
          <p className="text-xs text-[#5f6368]">
            {banner.placements.map((p) => PLACEMENT_LABELS[p]).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...banner, enabled: !banner.enabled })}
          className={`rounded-full p-1.5 ${banner.enabled ? "text-[#137333] bg-[#e6f4ea]" : "text-[#9aa0a6] bg-[#f1f3f4]"}`}
          title={banner.enabled ? "Disable" : "Enable"}
        >
          {banner.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"
          title={expanded ? "Collapse" : "Expand"}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1.5 text-[#9aa0a6] hover:bg-red-50 hover:text-red-600"
          title="Delete banner"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#e3e7ee] bg-[#f8f9fa] px-4 py-4 space-y-4">
          {/* Placements */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Show on</p>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(PLACEMENT_LABELS) as AdPlacement[]).map((placement) => (
                <label key={placement} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={banner.placements.includes(placement)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...banner.placements, placement]
                        : banner.placements.filter((p) => p !== placement);
                      if (next.length > 0) onChange({ ...banner, placements: next });
                    }}
                    className="h-4 w-4 rounded border-[#dadce0] text-[#008b92] focus:ring-[#008b92]"
                  />
                  {PLACEMENT_LABELS[placement]}
                </label>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#3c4043]">
              Eyebrow label
              <input
                maxLength={50}
                value={banner.eyebrow}
                onChange={(e) => onChange({ ...banner, eyebrow: e.target.value })}
                placeholder="Campus spotlight"
                className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
              />
            </label>
            <label className="block text-sm font-medium text-[#3c4043]">
              Title
              <input
                required
                maxLength={100}
                value={banner.title}
                onChange={(e) => onChange({ ...banner, title: e.target.value })}
                placeholder="Discover SNS Innovation Hub"
                className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-[#3c4043]">
            Description
            <textarea
              maxLength={280}
              rows={3}
              value={banner.description}
              onChange={(e) => onChange({ ...banner, description: e.target.value })}
              placeholder="Explore student innovation, technology projects, events, and opportunities."
              className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
            />
          </label>

          {/* Image upload */}
          <div>
            <p className="mb-1 text-sm font-medium text-[#3c4043]">Banner image</p>
            {banner.imageUrl ? (
              <div className="relative inline-block">
                <div className="h-32 w-48 overflow-hidden rounded-lg border border-[#dadce0] bg-[#f8f9fa]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt="Banner preview"
                    className="h-full w-full object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/place-placeholder.svg"; }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...banner, imageUrl: "" })}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex h-32 w-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#dadce0] bg-[#f8f9fa] text-[#5f6368] transition hover:border-[#008b92] hover:bg-[#e0f3f4]">
                <Upload className="h-6 w-6" />
                <span className="text-xs font-medium">{uploading ? "Uploading…" : "Upload image"}</span>
                <span className="text-[10px] text-[#9aa0a6]">PNG, JPEG, WebP (max 5 MB)</span>
                <input
                  type="file"
                  disabled={uploading}
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadError("");
                    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
                      setUploadError("Choose a PNG, JPEG, or WebP image up to 5 MB.");
                      e.target.value = "";
                      return;
                    }
                    const uploadBannerImage = async () => {
                      setUploading(true);
                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const response = await fetch("/api/ads/upload", { method: "POST", body: formData, credentials: "same-origin" });
                        const data = await response.json().catch(() => ({}));
                        if (!response.ok) throw new Error(response.status === 401 ? "Sign in again, then retry the upload." : data.error || "Upload failed. Please try again.");
                        if (typeof data.url !== "string") throw new Error("Upload returned no image URL. Please retry.");
                        latest.current.onChange({ ...latest.current.banner, imageUrl: data.url });
                      } catch (error) { setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again."); }
                      finally { setUploading(false); }
                    };
                    void uploadBannerImage();
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {uploadError && <p role="alert" className="mt-2 text-sm text-red-600">{uploadError}</p>}
            {banner.imageUrl && <p className="mt-2 text-xs text-[#5f6368]">Click Save / Publish banners to show this image on the public map.</p>}
            <label className="mt-2 block text-xs font-medium text-[#5f6368]">
              Or enter URL
              <input
                maxLength={500}
                value={banner.imageUrl}
                onChange={(e) => onChange({ ...banner, imageUrl: e.target.value })}
                placeholder="/ihub.png or https://..."
                className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-[#3c4043]">
            Link URL
            <input
              maxLength={500}
              value={banner.linkUrl}
              onChange={(e) => onChange({ ...banner, linkUrl: e.target.value })}
              placeholder="https://snsce.ac.in"
              className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#3c4043]">
              Button text
              <input
                maxLength={40}
                value={banner.buttonLabel}
                onChange={(e) => onChange({ ...banner, buttonLabel: e.target.value })}
                placeholder="Learn more"
                className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
              />
            </label>
            <label className="block text-sm font-medium text-[#3c4043]">
              Display order
              <input
                type="number"
                value={banner.order}
                onChange={(e) => onChange({ ...banner, order: Number(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-lg border border-[#dadce0] bg-white p-2 text-sm font-normal focus:border-[#008b92] focus:ring-1 focus:ring-[#008b92]"
              />
            </label>
          </div>

          {/* Preview */}
          {banner.title && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Preview</p>
              <div className="overflow-hidden rounded-xl border border-[#e3e7ee] bg-white max-w-sm">
                {banner.imageUrl && (
                  <div className="relative h-32 bg-[#e0f3f4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="h-full w-full object-contain p-2"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/place-placeholder.svg"; }}
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#5f6368]">Sponsored · {banner.eyebrow}</p>
                  <h4 className="mt-1 text-sm font-semibold">{banner.title}</h4>
                  <p className="mt-1 text-xs leading-5 text-[#5f6368] line-clamp-2">{banner.description}</p>
                  <span className="mt-2 inline-block text-xs font-medium text-[#008b92]">{banner.buttonLabel} ↗</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdBannerEditor() {
  const [config, setConfig] = useState<AdsConfig | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | AdPlacement>("all");

  useEffect(() => {
    let active = true;
    void fetch("/api/ads", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load ad banners.");
        return r.json();
      })
      .then((data) => { if (active) setConfig(data); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const addBanner = useCallback(() => {
    if (!config) return;
    const banner = createBanner({ order: config.banners.length });
    setConfig({ banners: [...config.banners, banner] });
    setMessage("");
  }, [config]);

  const updateBanner = useCallback((index: number, updated: AdBanner) => {
    if (!config) return;
    const banners = [...config.banners];
    banners[index] = updated;
    setConfig({ banners });
    setMessage("");
  }, [config]);

  const removeBanner = useCallback((index: number) => {
    if (!config) return;
    setConfig({ banners: config.banners.filter((_, i) => i !== index) });
    setMessage("");
  }, [config]);

  const moveBanner = useCallback((from: number, to: number) => {
    if (!config || to < 0 || to >= config.banners.length) return;
    const banners = [...config.banners];
    const [moved] = banners.splice(from, 1);
    banners.splice(to, 0, moved);
    setConfig({ banners });
    setMessage("");
  }, [config]);

  const save = useCallback(async () => {
    if (!config) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/ads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      setConfig(data);
      setMessage("Ad banners published. Changes appear within 10 seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed. Your edits are still here.");
    } finally {
      setBusy(false);
    }
  }, [config]);

  const filteredBanners = config?.banners.filter(
    (b) => filter === "all" || b.placements.includes(filter)
  ) ?? [];

  return (
    <section className="mb-7 rounded-2xl border border-[#e3e7ee] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Ad banners</h2>
          <p className="mt-1 text-sm text-[#5f6368]">
            Manage sponsored banners shown on the landing sidebar and place detail cards.
          </p>
        </div>
        <button
          type="button"
          onClick={addBanner}
          disabled={!config}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#008b92] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#006d73] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add banner
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2">
        {(["all", "landing", "placeCard"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === value
                ? "bg-[#008b92] text-white"
                : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
            }`}
          >
            {value === "all" ? "All banners" : PLACEMENT_LABELS[value]}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-[#9aa0a6]">
          {filteredBanners.length} banner{filteredBanners.length !== 1 ? "s" : ""}
        </span>
      </div>

      {!config && !error && <p className="mt-4 text-sm text-[#5f6368]">Loading...</p>}

      {config && (
        <form
          onSubmit={(e) => { e.preventDefault(); void save(); }}
          className="mt-4 space-y-3"
        >
          {filteredBanners.length === 0 && (
            <p className="py-8 text-center text-sm text-[#9aa0a6]">
              No banners yet. Click &quot;Add banner&quot; to create one.
            </p>
          )}
          {filteredBanners.map((banner) => {
            const realIndex = config.banners.indexOf(banner);
            return (
              <BannerCard
                key={banner.id}
                banner={banner}
                index={realIndex}
                total={config.banners.length}
                onChange={(updated) => updateBanner(realIndex, updated)}
                onRemove={() => removeBanner(realIndex)}
                onMoveUp={() => moveBanner(realIndex, realIndex - 1)}
                onMoveDown={() => moveBanner(realIndex, realIndex + 1)}
              />
            );
          })}

          {/* Footer actions */}
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-[#e3e7ee]">
            
            <button
              type="submit"
              disabled={busy || !config}
              className="rounded-full bg-[#008b92] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#006d73] disabled:opacity-50"
            >
              {busy ? "Publishing..." : "Save / Publish banners"}
            </button>
          </div>
        </form>
      )}

      {message && <p role="status" className="mt-4 text-sm text-[#137333]">{message}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}
