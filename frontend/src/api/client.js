const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "paytm.token";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

let unauthorizedHandler = () => {};

/** Called when an authenticated request gets a 401 (expired or invalid session). */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

export async function apiRequest(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, "Cannot reach the server. Check that the backend is running.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth && token) unauthorizedHandler();
    throw new ApiError(res.status, data.message || `Request failed (${res.status})`, data.details);
  }
  return data;
}

export const api = {
  signup: (body) => apiRequest("/user/signup", { method: "POST", body, auth: false }),
  signin: (body) => apiRequest("/user/signin", { method: "POST", body, auth: false }),
  me: () => apiRequest("/user/me"),
  updateProfile: (body) => apiRequest("/user", { method: "PUT", body }),
  searchUsers: (filter, signal) => apiRequest(`/user/bulk?filter=${encodeURIComponent(filter)}`, { signal }),
  balance: () => apiRequest("/account/balance"),
  transfer: (body) => apiRequest("/account/transfer", { method: "POST", body }),
  transactions: (limit = 10) => apiRequest(`/account/transactions?limit=${limit}`),
};

/** Map of field -> message from a 400 response, for inline form errors. */
export function fieldErrors(error) {
  const map = {};
  for (const d of error?.details ?? []) {
    if (d.field && !map[d.field]) map[d.field] = d.message;
  }
  return map;
}
