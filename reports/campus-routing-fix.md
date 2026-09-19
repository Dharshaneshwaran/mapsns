# Campus routing change — 2026-09-19

The public walking router returned HTTP 400 with `NoRoute` and `Impossible route between points` for ai campus → iHub. The application previously discarded the response body and displayed a service-unavailable error. The saved Main Gate coordinate → iHub returned HTTP 200 and 31.6 m with the same request options. The exact GPS request shown in the screenshot was not available.

Walking navigation now first uses the existing road geometry copied from `mapsns/frontend/public/campus-roads.json`. It constructs a bidirectional graph of shared road vertices, snaps endpoints to segments within 30 m, and finds the shortest connected path. Only segments inside the displayed convex campus boundary are used. It does not bridge disconnected roads or draw direct paths across unmapped ground.

If the local graph cannot serve a trip, the public router is still queried. Returned routes to campus destinations must stay inside the boundary. HTTP routing errors now explain missing paths or disconnected routes, instead of calling those failures a service outage.

Regression verification: the saved northern road endpoint (11.103914, 77.026619) reaches the published iHub pin using 578 m of internal road geometry without any network request. Tests also cover outside detours, internal alternatives, endpoint limits, same-segment routing, and HTTP 400 error bodies.

The geometry is existing repository data; physical accessibility and completeness have not been field-verified. This change does not make every possible GPS position routable. The earlier `campus-route-audit.md` describes public-router results only, not this local graph.
