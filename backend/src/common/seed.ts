import { Role } from "@prisma/client";

import { hashPassword } from "./crypto-jwt";
import { PASSWORD_SALT } from "./constants";
import type { EventRecord, UserRecord } from "./types";

export const seededUsers: UserRecord[] = [
  {
    id: "admin-1",
    name: "Platform Admin",
    email: "admin@events.local",
    password: hashPassword("Password123!", PASSWORD_SALT),
    role: Role.admin,
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  },
  {
    id: "user-1",
    name: "Guest Explorer",
    email: "guest@events.local",
    password: hashPassword("Password123!", PASSWORD_SALT),
    role: Role.user,
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  },
];

export const seededEvents: EventRecord[] = [];
