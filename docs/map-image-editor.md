# Campus map image editor

Open `/admin` (or `http://admin.localhost:3000`). Right-click the map itself and choose **Add image**, then upload a PNG, JPEG or WebP. On touch devices, choose **Add image** in the toolbar and tap the map.

Select an image and drag to move it. The four corner handles stretch width and height independently around the image centre; the round handle above it rotates it. The sidebar also offers width, height, rotation, opacity and a name. Existing building images are editable. Removing an image only changes the draft until publishing. Reloading published images discards the draft after confirmation.

**Save / Publish** writes both image data and placement to the server. Public maps load the same data and check for changes every 10 seconds, and when the tab regains focus. Edits before publishing remain private to the editor tab. Reloading that tab loses unpublished edits; a browser navigation warning is included.

## Storage and deployment

Uploaded files are stored in `public/uploads/map-images/<sha256>.<png|jpeg|webp>`. Content-based filenames prevent collisions and reuse identical uploads. `.map-data/images.json` stores readable, formatted metadata: image ID, name, public URL, latitude, longitude, width, height, rotation, opacity and optional location ID. Back up both directories. Files are written when you click Save / Publish; drafts stay in the browser until then. Removed overlays retain their files for recovery. Limits: 5 MB per upload, 20 MB per publish request, 100 images.

This implementation requires a Node server with a persistent writable disk. Preserve both `.map-data/` and `public/uploads/map-images/` across deployments. Optional `MAP_IMAGES_DATA_DIR` and `MAP_IMAGES_UPLOAD_DIR` settings override these directories for persistent volumes or isolated tests. All public and admin traffic must use the same storage. An upload-serving route makes newly saved files accessible without rebuilding. Ephemeral/serverless storage (including a default Vercel deployment) is not suitable.

Publishing uses an exclusive lock, revision checks and an atomic file replacement. A stale editor cannot silently overwrite another publish. If the server crashes during publishing and leaves `publish.lock` in the data directory, stop the server, verify no publisher is active and remove that lock before restarting. The last complete `images.json` remains intact.

## Publishing access

Local development on localhost works without a key. For production or access through other hostnames, set a long random `ADMIN_MAP_TOKEN` on the server and restart it. Enter the same value in **Admin publish key** in the editor; the key stays in memory in that tab and is sent only with publish requests. Use HTTPS in production. Reading the published images is public; writes require the key when configured. This protects the map image publishing endpoint only, not other existing admin features.

The existing Google Maps API key setup is still required. New images are visual overlays; adding one does not automatically create a searchable destination or change existing route coordinates.
