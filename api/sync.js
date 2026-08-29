import { Redis } from "@upstash/redis";
import { requireAllowedUser } from "./_lib/auth.js";

function redisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function syncKey(email) {
  return `trip-companion:sync:v1:${email}`;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET" && req.method !== "PUT") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireAllowedUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error });
  }

  const redis = redisClient();
  if (!redis) {
    return res.status(503).json({
      ok: false,
      error: "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured",
    });
  }

  const key = syncKey(auth.email);

  try {
    if (req.method === "GET") {
      const record = await redis.get(key);
      if (!record) {
        return res.status(200).json({
          ok: true,
          email: auth.email,
          empty: true,
          updatedAt: null,
          payload: null,
        });
      }
      return res.status(200).json({
        ok: true,
        email: auth.email,
        empty: false,
        updatedAt: record.updatedAt || null,
        payload: record.payload || null,
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const payload = body.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({ ok: false, error: "payload must be an object of storage keys" });
    }

    // Soft size guard (~1.5MB JSON)
    const serialized = JSON.stringify(payload);
    if (serialized.length > 1_500_000) {
      return res.status(413).json({ ok: false, error: "Sync payload too large" });
    }

    const updatedAt = Number(body.updatedAt) || Date.now();
    const record = {
      email: auth.email,
      updatedAt,
      payload,
    };
    await redis.set(key, record);

    return res.status(200).json({
      ok: true,
      email: auth.email,
      updatedAt,
      keys: Object.keys(payload).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync]", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
