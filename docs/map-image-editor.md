# Campus marker editor

Open `/admin` or `http://admin.localhost:3000`. Right-click the map and choose **Add marker**, or choose **Add marker** in the toolbar and click/tap a position. Select a marker and use **Destination photo** to upload a PNG, JPEG or WebP up to 5 MB. Every marker uses a small red Lucide map pin with a transparent background and shadow. Uploaded photos appear only in destination details after clicking the pin.

Click a marker to select it, edit its name in the sidebar, or drag it to move. You can also select markers from the sidebar. All published markers are searchable destinations; clicking a marker on the public map opens its destination. Position pins at accessible entrances.

**Save / Publish** saves the draft. Public maps refresh within 10 seconds or when focused. Reloading published markers discards the draft after confirmation. Removing a marker takes effect publicly only after publishing.

## Storage and access

The existing `/api/map-images` endpoint and `.map-data/images.json` document remain compatible. New markers use `src: "lucide:map-pin"`; legacy image entries retain their images. Uploaded marker images are saved through the existing image storage endpoint. Legacy image files remain on disk. The 100-entry limit, revision conflict checks, atomic saves and admin publish key still apply.

A persistent writable Node server and the existing Google Maps API configuration are required. `MAP_IMAGES_DATA_DIR` overrides the metadata directory. Set `ADMIN_MAP_TOKEN` for production and enter it under **Admin publish key**. Drafts remain in the browser until published.

## Public share links

Share opens the selected place using `/?place=<location-id>` on the current live domain. Set `NEXT_PUBLIC_SITE_URL=https://your-live-domain.example` before building to use a fixed public domain, including when testing locally. Localhost links are not shared as live links. Rebuild after changing this setting.
