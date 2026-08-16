/**
 * Vercel Cron：每日開支儀表板優化
 *
 * Auth: Authorization: Bearer $CRON_SECRET
 * Env: CRON_SECRET, GH_WORKFLOW_TOKEN
 */
const OWNER = "ppgmmy";
const REPO = "trip-companion";
const BRANCH = "main";
const ENABLED_PATH = "universal/src/data/enabledExpenseFeatures.json";
const HISTORY_PATH = "optimization_history.json";
const BACKLOG_PATH = "universal/src/data/expenseDailyBacklog.js";

function todayHktYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseBacklog(source) {
  const items = [];
  const blockRe =
    /\{\s*id:\s*"([^"]+)",\s*title:\s*"((?:\\"|[^"])*)",\s*description:\s*"((?:\\"|[^"])*)"/g;
  let m;
  while ((m = blockRe.exec(source)) !== null) {
    items.push({
      id: m[1],
      title: m[2].replace(/\\"/g, '"'),
      description: m[3].replace(/\\"/g, '"'),
    });
  }
  return items;
}

function planDailyOptimization({ today, backlogSrc, history, enabled }) {
  const doneToday = history.entries.find((e) => e.date === today);
  if (doneToday) {
    return {
      status: "already_done",
      today,
      id: doneToday.id,
      title: doneToday.title,
    };
  }

  const backlog = parseBacklog(backlogSrc);
  const used = new Set([
    ...history.entries.map((e) => e.id),
    ...(enabled.enabled ?? []),
  ]);
  const next = backlog.find((f) => !used.has(f.id));
  if (!next) return { status: "exhausted", today };

  return {
    status: "apply",
    today,
    id: next.id,
    title: next.title,
    description: next.description,
    nextEnabled: {
      enabled: Array.from(new Set([...(enabled.enabled ?? []), next.id])),
      updatedAt: new Date().toISOString(),
      lastFeatureId: next.id,
      lastTitle: next.title,
    },
    nextHistory: {
      entries: [
        ...history.entries,
        {
          date: today,
          id: next.id,
          title: next.title,
          description: next.description,
        },
      ],
    },
  };
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

async function getFile(token, path) {
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
    token,
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const text = Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { sha: json.sha, text };
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

async function commitBothFiles(token, message, files) {
  const refRes = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, { token });
  if (!refRes.ok) throw new Error(`get ref failed: ${refRes.status} ${await refRes.text()}`);
  const refJson = await refRes.json();
  const headSha = refJson.object.sha;

  const commitRes = await gh(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`, { token });
  if (!commitRes.ok) {
    throw new Error(`get commit failed: ${commitRes.status} ${await commitRes.text()}`);
  }
  const commitJson = await commitRes.json();

  const treeRes = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    token,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: commitJson.tree.sha,
      tree: files.map((f) => ({
        path: f.path,
        mode: "100644",
        type: "blob",
        content: f.content,
      })),
    }),
  });
  if (!treeRes.ok) {
    throw new Error(`create tree failed: ${treeRes.status} ${await treeRes.text()}`);
  }
  const treeJson = await treeRes.json();

  const newCommitRes = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    token,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: treeJson.sha,
      parents: [headSha],
      author: {
        name: "trip-companion-cron",
        email: "41898282+github-actions[bot]@users.noreply.github.com",
      },
    }),
  });
  if (!newCommitRes.ok) {
    throw new Error(`create commit failed: ${newCommitRes.status} ${await newCommitRes.text()}`);
  }
  const newCommit = await newCommitRes.json();

  const updateRes = await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    token,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRes.ok) {
    throw new Error(`update ref failed: ${updateRes.status} ${await updateRes.text()}`);
  }
  return newCommit.sha;
}

async function applyViaGitApi(token) {
  const today = todayHktYmd();
  const [enabledFile, historyFile, backlogFile] = await Promise.all([
    getFile(token, ENABLED_PATH),
    getFile(token, HISTORY_PATH),
    getFile(token, BACKLOG_PATH),
  ]);

  const plan = planDailyOptimization({
    today,
    backlogSrc: backlogFile.text,
    history: JSON.parse(historyFile.text),
    enabled: JSON.parse(enabledFile.text),
  });

  if (plan.status !== "apply") {
    return { plan, committed: false, sha: null };
  }

  const message = `feat(daily): enable ${plan.id} — ${plan.title}

Automated daily optimization (Vercel Cron → GitHub Git Data API).`;

  const sha = await commitBothFiles(token, message, [
    {
      path: HISTORY_PATH,
      content: `${JSON.stringify(plan.nextHistory, null, 2)}\n`,
    },
    {
      path: ENABLED_PATH,
      content: `${JSON.stringify(plan.nextEnabled, null, 2)}\n`,
    },
  ]);

  return { plan, committed: true, sha };
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
    if (req.query.mode === "dispatch") {
      await dispatchWorkflow(token);
      return res.status(200).json({
        ok: true,
        mode: "dispatch",
        today: todayHktYmd(),
        message: "workflow_dispatch accepted",
      });
    }

    const result = await applyViaGitApi(token);
    const { plan } = result;

    if (plan.status === "already_done") {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: "already_done",
        today: plan.today,
        id: plan.id,
        title: plan.title,
      });
    }
    if (plan.status === "exhausted") {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: plan.status,
        today: plan.today,
      });
    }

    return res.status(200).json({
      ok: true,
      skipped: false,
      mode: "git_data",
      today: plan.today,
      id: plan.id,
      title: plan.title,
      description: plan.description,
      sha: result.sha,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[daily-opt-cron]", message);
    try {
      await dispatchWorkflow(token);
      return res.status(200).json({
        ok: true,
        degraded: true,
        mode: "dispatch",
        today: todayHktYmd(),
        warning: message,
      });
    } catch (dispatchErr) {
      return res.status(500).json({
        ok: false,
        error: message,
        dispatchError:
          dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr),
      });
    }
  }
}
