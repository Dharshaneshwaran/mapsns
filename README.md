# Event Discovery Platform

A full-stack event discovery starter built with Next.js and NestJS.

## Structure

- `frontend/` - Next.js app router frontend
- `backend/` - NestJS API
- `backend/prisma/schema.prisma` - production data model

## Local setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

## Environment

Copy the example env files:

- `frontend/.env.example`
- `backend/.env.example`

## Included features

- Nearby event discovery
- Search, category filters, and radius filters
- Location tracking prompt
- Event detail pages
- Admin login and dashboard
- Event CRUD endpoints
- JWT-style auth utilities
- Haversine distance calculation
- Cloudinary-style upload responses
- Notification subscription scaffolding

## Notes

The codebase is intentionally self-contained so it can run in this workspace
without pulling additional packages. The Prisma schema and API contracts are in
place, and you can swap the in-memory stores for real database adapters when you
connect Postgres, Redis, Prisma, Cloudinary, and push services.

