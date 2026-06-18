import type { EventRecord } from "@/types/event";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

async function safeJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function uploadAdminImage(file: File, folder = "events"): Promise<string> {
  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(`${apiBaseUrl}/uploads/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Image upload did not return a URL");
  }

  return payload.url;
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

      const errorBody = await response.text();
      throw new Error(errorBody || "Unable to sign in");
    } catch (error) {
      if (error instanceof Error && error.message !== "Failed to fetch") {
        throw error;
      }
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

      const errorBody = await response.text();
      throw new Error(errorBody || "Unable to save event");
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Unable to save event");
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

async function adminJsonRequest<T>(path: string, method: "POST" | "PATCH" | "DELETE") {
  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const token = window.localStorage.getItem("event-discovery-admin-token");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Your admin session expired. Please sign in again."
        : (await response.text()) || `Request failed: ${method} ${path}`;

    if (response.status === 401 || response.status === 403) {
      window.localStorage.removeItem("event-discovery-admin-token");
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function publishAdminEvent(id: string) {
  return adminJsonRequest<EventRecord>(`/admin/events/${id}/publish`, "POST");
}

export async function unpublishAdminEvent(id: string) {
  return adminJsonRequest<EventRecord>(`/admin/events/${id}/unpublish`, "POST");
}

export async function deleteAdminEvent(id: string) {
  return adminJsonRequest<void>(`/admin/events/${id}`, "DELETE");
}
