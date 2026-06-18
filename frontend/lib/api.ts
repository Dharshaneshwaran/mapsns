import type { EventRecord } from "@/types/event";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

async function safeJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function loadEvents(): Promise<EventRecord[]> {
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/events`, {
        cache: "no-store",
      });

      if (response.ok) {
        const payload = await safeJson<{ data: EventRecord[] } | EventRecord[]>(
          response,
        );
        if (Array.isArray(payload)) {
          return payload;
        }
        if ("data" in payload) {
          return payload.data;
        }
      }
    } catch {
      // Fall back to local sample data when the API is unavailable.
    }
  }

  return [];
}

export async function loadEvent(id: string): Promise<EventRecord | undefined> {
  if (!apiBaseUrl) {
    return undefined;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/events/${id}`, {
      cache: "no-store",
    });

    if (response.ok) {
      return (await response.json()) as EventRecord;
    }
  } catch {
    // ignored
  }

  return undefined;
}

export async function loginAdmin(email: string, password: string) {
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        return response.json();
      }
    } catch {
      // ignored
    }
  }

  return {
    accessToken: "local-dev-admin-token",
    refreshToken: "local-dev-refresh-token",
    user: {
      id: "admin",
      name: "Admin",
      email,
      role: "admin",
    },
  };
}

export async function createAdminEvent(
  payload: Omit<EventRecord, "id" | "isPublished" | "popularity" | "gallery">,
) {
  if (apiBaseUrl) {
    try {
      const token = window.localStorage.getItem("event-discovery-admin-token");
      const response = await fetch(`${apiBaseUrl}/admin/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return response.json();
      }
    } catch {
      // ignored
    }
  }

  return {
    id: crypto.randomUUID(),
    ...payload,
    isPublished: false,
    popularity: 0,
    gallery: [],
  } as EventRecord;
}
