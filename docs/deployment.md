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

## Routing

Route preparation requires a fresh GPS fix and a valid mapped route. Failed requests display an error and Retry rather than an artificial path. Distance and duration come from the routing service; remaining distance/ETA are estimated by progress along its polyline. Uploaded images can be made searchable in the admin editor; their centre is the navigation destination, so position them at an accessible entrance. Accuracy and path coverage still depend on GPS and mapped data.
