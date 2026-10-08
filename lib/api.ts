export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function origins() {
  const configured = process.env.SHOP_ORIGIN;
  return [...new Set([configured, "http://127.0.0.1:3000", "http://127.0.0.1:3001"].filter((value): value is string => Boolean(value)))];
}

async function call(path: string, init: RequestInit) {
  if (typeof window !== "undefined") return fetch(`/api${path}`, init);
  let last: unknown;
  for (const origin of origins()) {
    try {
      return await fetch(`${origin}/api${path}`, init);
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

export async function api<T>(path: string, init: RequestInit & { token?: string | null; cartToken?: string | null } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  if (init.cartToken) headers.set("x-cart-token", init.cartToken);
  const response = await call(path, { method: init.method, body: init.body, headers, cache: "no-store" });
  const text = await response.text();
  const data = text ? JSON.parse(text) as { error?: { code?: string; message?: string } } : null;
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.code ?? "request_failed", data?.error?.message ?? "The request failed.");
  }
  return data as T;
}
