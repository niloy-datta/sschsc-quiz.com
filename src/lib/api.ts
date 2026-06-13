/**
 * Central API client for FastAPI backend.
 *
 * Local dev (default): NEXT_PUBLIC_USE_API_PROXY=true → same-origin `/api/*`
 * via Next.js rewrite → cookies work with SameSite=Lax.
 *
 * Direct mode: NEXT_PUBLIC_USE_API_PROXY=false + NEXT_PUBLIC_API_URL=http://localhost:8000
 */
const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY !== "false";

const directBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export const API_BASE_URL = useProxy ? "" : directBase;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.detail === "string") return record.detail;
  if (Array.isArray(record.detail)) {
    return record.detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: string }).msg);
        }
        return String(item);
      })
      .join(", ");
  }
  return fallback;
}

function buildUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(buildUrl(path), {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    let fallback = `API request failed (${res.status})`;
    if (res.status >= 500 && !errorData) {
      fallback =
        "Backend API unavailable — start FastAPI on port 8000 (`pnpm dev:backend`)";
    }
    const message = parseErrorMessage(errorData, fallback);
    throw new ApiError(message, res.status, errorData);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "GET" }),

  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiRequest<T>(path, {
      ...init,
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    }),

  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiRequest<T>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "DELETE" }),
};
