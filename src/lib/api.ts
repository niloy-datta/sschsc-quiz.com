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
    public retryable = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Returns true when the error means the backend is simply unreachable
 * (network down, CORS, or 5xx without a body).
 */
export function isBackendUnavailable(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status >= 500 && err.retryable) return true;
  return false;
}

/**
 * Returns true when a Response object signals the backend is unreachable
 * (5xx with no JSON body, which typically means the server is down).
 */
function isUnreachableResponse(res: Response): boolean {
  return res.status >= 500 && !res.headers.get("content-type")?.includes("json");
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

  // Retry transparently on network failures and 5xx so transient
  // backend restarts don't immediately surface as errors to the user.
  const maxAttempts = 3; // 1 initial + 2 retries
  const UNAVAILABLE_MSG =
    "Backend API unavailable — start FastAPI on port 8000 (`pnpm dev:backend`)";
  let res!: Response;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      res = await fetch(buildUrl(path), {
        ...options,
        credentials: "include",
        headers,
      });
    } catch (networkErr) {
      // fetch() throws on DNS failure, connection refused, CORS, etc.
      // This is the most common case when the backend hasn't started yet.
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw new ApiError(UNAVAILABLE_MSG, 0, null, true);
    }

    // Server responded but with 5xx and no JSON body — likely still starting.
    if (isUnreachableResponse(res)) {
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw new ApiError(UNAVAILABLE_MSG, res.status, null, true);
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const fallback = `API request failed (${res.status})`;
      const message = parseErrorMessage(errorData, fallback);
      throw new ApiError(message, res.status, errorData);
    }

    break; // success
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export const api = {
  /**
   * Check whether the FastAPI backend is reachable.
   * Useful for showing a retry banner on login / dashboard pages.
   */
  async checkBackend(): Promise<boolean> {
    try {
      await apiRequest<unknown>('/api/auth/me');
      return true;
    } catch {
      return false;
    }
  },

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
