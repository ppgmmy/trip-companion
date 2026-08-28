/**
 * Vercel Cron：觸發 GitHub Actions 每日優化（唔直接 commit，避免雙寫衝突）
 *
 * Auth: Authorization: Bearer $CRON_SECRET
 * Env: CRON_SECRET, GH_WORKFLOW_TOKEN
 */
const OWNER = "ppgmmy";
const REPO = "trip-companion";
const BRANCH = "main";

function todayHktYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization;
  if (header === `Bearer ${secret}`) return true;
  const q = typeof req.query.secret === "string" ? req.query.secret : "";
  return q === secret;
}

async function gh(path, init) {
  const { token, ...rest } = init;
  return fetch(`https://api.github.com${path}`, {
    ...rest,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "trip-companion-daily-opt",
      ...(rest.headers ?? {}),
    },
  });
}

async function dispatchWorkflow(token) {
  const res = await gh(
    `/repos/${OWNER}/${REPO}/actions/workflows/daily-optimization.yml/dispatches`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: BRANCH }),
    },
  );
  if (res.status !== 204 && !res.ok) {
    throw new Error(`workflow_dispatch failed: ${res.status} ${await res.text()}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const token = process.env.GH_WORKFLOW_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: "GH_WORKFLOW_TOKEN not configured" });
  }

  try {
    await dispatchWorkflow(token);
    return res.status(200).json({
      ok: true,
      mode: "dispatch",
      today: todayHktYmd(),
      message: "workflow_dispatch accepted",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[daily-opt-cron]", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
