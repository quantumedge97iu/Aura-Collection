import { AppError } from "../http/errors";

export type AuthSession = {
  accessToken: string;
  userId: string;
  email: string;
  fullName: string;
};

type GoTrue = { url: string; anonKey: string; serviceRoleKey?: string | null };

export async function signIn(auth: GoTrue, email: string, password: string): Promise<AuthSession> {
  return sessionFrom(await goTrue(auth, "/token?grant_type=password", { email, password }));
}

export async function signUp(auth: GoTrue, email: string, password: string, fullName: string, redirectTo: string): Promise<AuthSession | { confirmationRequired: true }> {
  const body = await goTrue(auth, `/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { email, password, data: { full_name: fullName } });
  if (!body.access_token) return { confirmationRequired: true };
  return sessionFrom(body);
}

export async function resendConfirmation(auth: GoTrue, email: string, redirectTo: string) {
  await goTrue(auth, `/resend?redirect_to=${encodeURIComponent(redirectTo)}`, { type: "signup", email });
}

export async function requestPasswordReset(auth: GoTrue, email: string, redirectTo: string) {
  try {
    await goTrue(auth, `/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { email });
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    if (error.code === "rate_limited") {
      throw new AppError(429, "rate_limited", "Too many reset emails were sent. Wait a little, then try again.");
    }
    if (error.status === 503 || /sending|smtp/i.test(error.message)) throw error;
    if (/not found|user_not_found/i.test(`${error.code} ${error.message}`)) return;
    throw error;
  }
}

export async function updatePassword(auth: GoTrue, accessToken: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${auth.url.replace(/\/$/, "")}/auth/v1/user`, {
      method: "PUT",
      headers: { apikey: auth.anonKey, authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new AppError(503, "auth_unavailable", "Authentication is unavailable.");
  }
  const body = (await response.json().catch(() => ({}))) as { error_description?: string; msg?: string; message?: string; error_code?: string };
  if (!response.ok) {
    const detail = `${body.error_code ?? ""} ${body.error_description ?? ""} ${body.msg ?? ""} ${body.message ?? ""}`;
    if (/jwt|token|expired|session/i.test(detail)) {
      throw new AppError(401, "unauthorized", "This reset link is missing or has expired.");
    }
    throw authFailure(body);
  }
}

export async function userFromToken(auth: GoTrue, token: string): Promise<{ id: string; email: string | null }> {
  let response: Response;
  try {
    response = await fetch(`${auth.url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: auth.anonKey, authorization: `Bearer ${token}` },
    });
  } catch {
    throw new AppError(503, "auth_unavailable", "Authentication is unavailable.");
  }
  const body = (await response.json().catch(() => ({}))) as { id?: string; email?: string; msg?: string };
  if (!response.ok || !body.id) throw new AppError(401, "unauthorized", "Sign in again.");
  return { id: body.id, email: body.email ?? null };
}

async function goTrue(auth: GoTrue, path: string, payload: unknown) {
  let response: Response;
  try {
    response = await fetch(`${auth.url.replace(/\/$/, "")}/auth/v1${path}`, {
      method: "POST",
      headers: { apikey: auth.anonKey, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AppError(503, "auth_unavailable", "Authentication is unavailable.");
  }
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    user?: { id?: string; email?: string; user_metadata?: { full_name?: string } };
    error_description?: string;
    msg?: string;
    message?: string;
    error_code?: string;
  };
  if (!response.ok) throw authFailure(body);
  return body;
}

function authFailure(body: { error_description?: string; msg?: string; message?: string; error_code?: string }) {
  const message = body.error_description || body.msg || body.message || "Sign-in failed.";
  const code = `${body.error_code ?? ""} ${message}`;
  if (/rate limit/i.test(message)) {
    return new AppError(429, "rate_limited", "Too many confirmation emails were sent. Wait a little, then try again.");
  }
  if (/email not confirmed|email_not_confirmed/i.test(code)) {
    return new AppError(403, "email_not_confirmed", "Confirm your email before signing in. Open the link we sent, then come back.");
  }
  if (/already registered|already been registered|email_exists/i.test(code)) {
    return new AppError(409, "email_taken", "This email already has an account. Sign in, or open the confirmation link if you have not yet.");
  }
  return new AppError(401, "invalid_credentials", message);
}

function sessionFrom(body: { access_token?: string; user?: { id?: string; email?: string; user_metadata?: { full_name?: string } } }): AuthSession {
  if (!body.access_token || !body.user?.id || !body.user.email) {
    throw new AppError(401, "invalid_credentials", "Sign-in failed.");
  }
  return {
    accessToken: body.access_token,
    userId: body.user.id,
    email: body.user.email,
    fullName: body.user.user_metadata?.full_name ?? "",
  };
}
