# Event Discovery API

NestJS backend for the event discovery platform.

## Local run

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and Redis if you want to wire those services in.
3. Run `npm run start:dev`.

## Included routes

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /events`
- `GET /events/:id`
- `POST /events/nearby`
- `POST /admin/events`
- `PATCH /admin/events/:id`
- `DELETE /admin/events/:id`
- `POST /admin/events/:id/publish`
- `POST /admin/events/:id/unpublish`
- `GET /admin/dashboard`

