import type pg from "pg";
import type { Config } from "../config";
import type { Actor, AppRole } from "../domain";
import { AppError } from "../http/errors";
import { withActor } from "../db";
import { enqueue } from "../events/outbox";
import { requestPasswordReset, resendConfirmation, signIn, signUp, updatePassword, userFromToken } from "../auth/supabase";
import { verifyAccessToken } from "../auth/tokens";
import * as repo from "../repositories/commerce";

const guest: Actor = { id: null, role: "guest", jwtRole: "anon", cartToken: null, email: null };

function appUrl(origin: string | undefined, path: string) {
  const fallback = `http://localhost:3000${path}`;
  if (!origin) return fallback;
  try {
    const url = new URL(origin);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const site = url.hostname === "auraloomdimond.com" || url.hostname === "www.auraloomdimond.com";
    if ((url.protocol === "https:" || local) && (local || site)) return `${url.origin}${path}`;
  } catch {
    /* use the local page */
  }
  return fallback;
}

export function createAuthService(pool: pg.Pool, config: Config) {
  function goTrue() {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new AppError(503, "auth_not_configured", "Set SUPABASE_URL and SUPABASE_ANON_KEY before sign-in.");
    }
    return { url: config.supabaseUrl, anonKey: config.supabaseAnonKey, serviceRoleKey: config.supabaseServiceRoleKey };
  }

  async function identity(token: string) {
    try {
      return await verifyAccessToken(config.jwtSecret, token);
    } catch (error) {
      if (!config.supabaseUrl || !config.supabaseAnonKey) throw error;
      return userFromToken({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey }, token);
    }
  }

  return {
    guest(cartToken: string | null): Actor {
      return { ...guest, cartToken };
    },
    async actorFromToken(token: string, cartToken: string | null): Promise<Actor> {
      const claims = await identity(token);
      const row = await withActor(pool, { ...guest, id: claims.id, jwtRole: "authenticated", cartToken }, (db) => repo.profile(db, claims.id));
      if (!row || row.status !== "active") throw new AppError(403, "forbidden", "This account cannot sign in.");
      return { id: claims.id, role: row.role as AppRole, jwtRole: "authenticated", cartToken, email: claims.email };
    },
    async login(email: string, password: string) {
      const session = await signIn(goTrue(), email, password);
      await this.ensure(session.userId, session.fullName);
      return { accessToken: session.accessToken };
    },
    async register(email: string, password: string, fullName: string, origin?: string) {
      const session = await signUp(goTrue(), email, password, fullName, appUrl(origin, "/auth/confirm"));
      if ("confirmationRequired" in session) return session;
      await this.ensure(session.userId, fullName);
      return { accessToken: session.accessToken };
    },
    async resend(email: string, origin?: string) {
      await resendConfirmation(goTrue(), email, appUrl(origin, "/auth/confirm"));
      return { ok: true };
    },
    async forgot(email: string, origin?: string) {
      await requestPasswordReset(goTrue(), email, appUrl(origin, "/auth/reset"));
      return { ok: true };
    },
    async reset(accessToken: string, password: string) {
      await updatePassword(goTrue(), accessToken, password);
      return { ok: true };
    },
    async ensure(userId: string, fullName: string) {
      await withActor(pool, { ...guest, id: userId, jwtRole: "authenticated" }, async (db) => {
        const created = await repo.ensureProfile(db, userId, fullName);
        if (fullName) await repo.fillProfileName(db, userId, fullName);
        if (!created) return;
        await enqueue(db, {
          name: "user.registered.v1",
          aggregateId: created,
          dedupeKey: `user.registered.v1:${created}`,
          payload: { userId: created },
        });
      });
    },
  };
}
