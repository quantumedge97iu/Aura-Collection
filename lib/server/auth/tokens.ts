import { jwtVerify, SignJWT } from "jose";
import { AppError } from "../http/errors";

export async function verifyAccessToken(secret: string, token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const id = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!id) throw new Error("missing sub");
    return { id, email };
  } catch {
    throw new AppError(401, "unauthorized", "Sign in again.");
  }
}

export async function signTestToken(secret: string, user: { id: string; email: string }) {
  return new SignJWT({ email: user.email, role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}
