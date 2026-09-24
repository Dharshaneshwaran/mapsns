# Deploying SNS Campus Navigator

Use a Node.js server with persistent writable storage. Run `npm ci`, `npm run build`, and `npm start` behind an HTTPS reverse proxy. A default ephemeral/serverless deployment will lose uploaded content.

Set these environment variables on the server:

- `VITE_GOOGLE_MAPS_API_KEY`: existing Google Maps browser key, restricted to the deployed hostnames.
- `ADMIN_USERNAME`: administrator username (default `admin`).
- `ADMIN_MAP_TOKEN`: a long random password, required in every environment including localhost. `/admin` uses the browser's sign-in dialog (HTTP Basic authentication over HTTPS); the same credentials protect every write endpoint. Existing bearer publish keys remain supported. Set a separate development token in the ignored `.env.local` file. Browser writes require a matching Origin; command-line clients should use Bearer authentication.
- `MAP_IMAGES_DATA_DIR`: absolute path to a persistent metadata directory.
- `MAP_IMAGES_UPLOAD_DIR`: absolute path to a persistent image directory.
- Optional `NEXT_PUBLIC_WALKING_ROUTER_URL` and `NEXT_PUBLIC_DRIVING_ROUTER_URL`: OSRM-compatible URLs ending in `/route/v1/<profile>` for your own routing servers. Defaults use the FOSSGIS walking/driving servers. Set these before building. Respect their service limits; deploy your own router for heavy usage.

Rebuild when changing public environment variables. Preserve `.map-data` and `public/uploads/map-images` if using default directories. Uploads are served dynamically without rebuilding. Landing settings and image metadata live in the metadata directory; advertisement settings also use `data/ads.json`.

## Backup and restore

During a quiet period, run `node scripts/backup.mjs` with the same storage environment variables as the server. It creates a timestamped `backups/` folder containing metadata, image files and advertisement settings. Copy that folder off the server regularly; backups are not committed to Git. Environment secrets are intentionally excluded; keep them in your host's secret store.

To restore, stop the server, preserve the current storage as a separate recovery copy, copy `map-data/` into the configured metadata directory and `map-images/` into the configured upload directory, restore `ads.json` to `data/ads.json`, then restart. Test a public image, sidebar and admin sign-in. Do not restore a `publish.lock` left by an interrupted operation.

## Live visitor activity

Public pages send anonymous browser heartbeats every 20 seconds while visible. The admin panel refreshes counts and the heatmap every 10 seconds; visitors expire after 2 minutes. Admin pages are excluded. Location sharing starts automatically on the first open (the browser may prompt for permission) and can be stopped or re-enabled under More → Campus activity map; this is separate from navigation location permission. Locations are rounded to roughly 55-metre cells; fixes with accuracy worse than 150 metres are omitted. No names or location history are stored. HTTPS is required for geolocation outside localhost.

Presence lives only in memory in one Node.js process, with periodic expiry cleanup. It resets on restart and fills again as browsers send heartbeats. Run a single Node.js process for accurate counts. Multiple workers, replicas, or serverless instances require a shared TTL store before using this feature in that configuration. The summary endpoint uses existing admin authentication. Counts estimate browser activity, not verified attendance; separate devices or private sessions may count separately.

## Routing

### Viewing live visitors from local admin

In the local `.env.local` only, set `LIVE_VISITORS_ORIGIN=https://map.gdta2026.com` and `LIVE_VISITORS_ADMIN_TOKEN` to the live server's `ADMIN_MAP_TOKEN`, then restart Next.js. Keep using the local admin credentials to sign in at `http://admin.localhost:3000`. The local server authenticates the admin first, then fetches the live summary server-side. The live token is never sent to the browser. Missing credentials or connection errors show an error rather than misleading zero counts. Do not set these proxy variables on the live server itself. Other admin editors continue to manage local data.

Route preparation requires a fresh GPS fix and a valid mapped route. Failed requests display an error and Retry rather than an artificial path. Distance and duration come from the routing service; remaining distance/ETA are estimated by progress along its polyline. Uploaded images can be made searchable in the admin editor; their centre is the navigation destination, so position them at an accessible entrance. Accuracy and path coverage still depend on GPS and mapped data.
