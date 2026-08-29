import { createClerkClient, verifyToken } from "@clerk/backend";
import { isEmailAllowed, normalizeEmail } from "./allowlist.js";

function bearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

/**
 * Verify Clerk session JWT and enforce email allowlist.
 * @returns {Promise<{ ok: true, userId: string, email: string } | { ok: false, status: number, error: string }>}
 */
export async function requireAllowedUser(req) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, status: 503, error: "CLERK_SECRET_KEY not configured" };
  }

  const token = bearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: "Missing authorization token" };
  }

  let payload;
  try {
    payload = await verifyToken(token, { secretKey });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid token";
    return { ok: false, status: 401, error: message };
  }

  const userId = payload?.sub;
  if (!userId) {
    return { ok: false, status: 401, error: "Invalid session subject" };
  }

  const clerk = createClerkClient({ secretKey });
  let user;
  try {
    user = await clerk.users.getUser(userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load user";
    return { ok: false, status: 401, error: message };
  }

  const primaryId = user.primaryEmailAddressId;
  const primary = user.emailAddresses?.find((e) => e.id === primaryId);
  const fallback = user.emailAddresses?.[0];
  const email = normalizeEmail(primary?.emailAddress || fallback?.emailAddress);

  if (!email) {
    return { ok: false, status: 403, error: "Account has no email address" };
  }

  if (!isEmailAllowed(email)) {
    return { ok: false, status: 403, error: "此 email 未獲授權使用 Trip Companion" };
  }

  return { ok: true, userId, email };
}
