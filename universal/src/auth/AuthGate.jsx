import {
  AuthenticateWithRedirectCallback,
  useAuth,
  useClerk,
  useSignIn,
  useUser,
  UserButton,
} from "@clerk/clerk-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ALLOWED_EMAILS, isEmailAllowed, normalizeEmail } from "./allowlist";
import { applySyncPayload, collectSyncPayload, payloadFingerprint } from "./syncStorage";

const SYNC_META_KEY = "universal_cloud_sync_meta";
const SSO_HASH = "#/sso-callback";

function readLocalMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "null") || { updatedAt: 0 };
  } catch {
    return { updatedAt: 0 };
  }
}

function writeLocalMeta(updatedAt) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ updatedAt }));
  } catch {}
}

async function syncFetch(path, token, init = {}) {
  const res = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export function useCloudSync({ enabled }) {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const lastFingerprint = useRef("");
  const bootstrapped = useRef(false);

  const pushNow = useCallback(async () => {
    if (!enabled || !isSignedIn) return;
    setStatus("syncing");
    try {
      const token = await getToken();
      if (!token) throw new Error("No session token");
      const payload = collectSyncPayload();
      const updatedAt = Date.now();
      const { res, data } = await syncFetch("/api/sync", token, {
        method: "PUT",
        body: JSON.stringify({ payload, updatedAt }),
      });
      if (res.status === 403) {
        setStatus("blocked");
        setMessage(data.error || "此帳號未獲授權");
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || `Sync failed (${res.status})`);
      writeLocalMeta(updatedAt);
      lastFingerprint.current = payloadFingerprint(payload);
      setLastSyncedAt(updatedAt);
      setStatus("synced");
      setMessage("已同步到雲端");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "同步失敗");
    }
  }, [enabled, getToken, isSignedIn]);

  const pullOrMerge = useCallback(async () => {
    if (!enabled || !isSignedIn) return;
    setStatus("syncing");
    try {
      const token = await getToken();
      if (!token) throw new Error("No session token");
      const { res, data } = await syncFetch("/api/sync", token, { method: "GET" });
      if (res.status === 403) {
        setStatus("blocked");
        setMessage(data.error || "此帳號未獲授權");
        return { blocked: true };
      }
      if (!res.ok || !data.ok) throw new Error(data.error || `Sync failed (${res.status})`);

      const localMeta = readLocalMeta();
      const localPayload = collectSyncPayload();
      const localCount = Object.keys(localPayload).length;
      const remoteAt = Number(data.updatedAt) || 0;
      const localAt = Number(localMeta.updatedAt) || 0;

      if (data.empty || !data.payload) {
        if (localCount > 0) {
          await pushNow();
          return { uploaded: true };
        }
        setStatus("synced");
        setMessage("雲端尚無資料");
        return { empty: true };
      }

      if (remoteAt >= localAt || localCount === 0) {
        applySyncPayload(data.payload, { wipeMissing: true });
        writeLocalMeta(remoteAt || Date.now());
        lastFingerprint.current = payloadFingerprint(data.payload);
        setLastSyncedAt(remoteAt || Date.now());
        setStatus("synced");
        setMessage("已從雲端載入");
        window.setTimeout(() => window.location.reload(), 350);
        return { pulled: true };
      }

      await pushNow();
      return { uploaded: true };
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "同步失敗");
      return { error: true };
    }
  }, [enabled, getToken, isSignedIn, pushNow]);

  useEffect(() => {
    if (!enabled || !isSignedIn) {
      bootstrapped.current = false;
      return;
    }
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    pullOrMerge();
  }, [enabled, isSignedIn, pullOrMerge]);

  useEffect(() => {
    if (!enabled || !isSignedIn) return undefined;
    let timer = null;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const fp = payloadFingerprint(collectSyncPayload());
        if (fp && fp !== lastFingerprint.current) {
          pushNow();
        }
      }, 1600);
    };
    const onStorage = (e) => {
      if (!e.key || e.key.startsWith("universal_")) schedule();
    };
    window.addEventListener("storage", onStorage);
    const poll = window.setInterval(() => {
      const fp = payloadFingerprint(collectSyncPayload());
      if (fp && lastFingerprint.current && fp !== lastFingerprint.current) {
        schedule();
      } else if (!lastFingerprint.current && fp) {
        lastFingerprint.current = fp;
      }
    }, 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, isSignedIn, pushNow]);

  return { status, message, lastSyncedAt, pushNow, pullOrMerge };
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.3 5.2C39.2 37.3 44 32 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

/** Google OAuth 登入頁：一入嚟自動跳去 Google 揀帳號 */
function LoginScreen({ blockedReason }) {
  const { isLoaded, signIn } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const autoStarted = useRef(false);

  const signInWithGoogle = useCallback(async () => {
    if (!signIn) return;
    setBusy(true);
    setError("");
    try {
      const origin = window.location.origin;
      const base = `${origin}/universal/`;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${base}${SSO_HASH}`,
        redirectUrlComplete: base,
      });
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || "無法啟動 Google 登入";
      setError(msg);
      setBusy(false);
      try {
        sessionStorage.setItem("tc_google_oauth_manual", "1");
      } catch {}
    }
  }, [signIn]);

  // 一入 App 未登入 → 自動跳去 Google 帳號選擇（若用戶取消過就改為手動撳掣）
  useEffect(() => {
    if (!isLoaded || !signIn || autoStarted.current) return;
    let skipped = false;
    try {
      skipped = sessionStorage.getItem("tc_google_oauth_manual") === "1";
    } catch {}
    if (skipped || blockedReason) return;
    autoStarted.current = true;
    const t = window.setTimeout(() => {
      signInWithGoogle();
    }, 250);
    return () => window.clearTimeout(t);
  }, [blockedReason, isLoaded, signIn, signInWithGoogle]);

  return (
    <div className="bg-travel relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-jade-soft/80 blur-3xl" />
        <div className="absolute bottom-10 left-[-15%] h-64 w-64 rounded-full bg-coral-soft/70 blur-3xl" />
      </div>

      <main className="safe-top mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-jade">Trip Companion</p>
        <h1 className="mt-3 font-display text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-ink">
          用 Google<br />登入
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          {busy
            ? "正跳去 Google，請揀你要用嘅帳號…"
            : "一入嚟會自動開啟 Google 帳號選擇。揀完就入 App，資料會同步。"}
        </p>

        <div className="mt-8 rounded-[1.75rem] border border-jade/15 bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem("tc_google_oauth_manual");
              } catch {}
              signInWithGoogle();
            }}
            disabled={!isLoaded || busy}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 text-base font-bold text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa] active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleIcon />
            {busy ? "即將跳去 Google…" : "用 Google 登入"}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-faint">
            {busy ? "如果無自動跳轉，請再撳上面掣" : "或者手動撳掣再開 Google"}
          </p>

          {(error || blockedReason) && (
            <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
              {blockedReason || error}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-3xl bg-white/70 px-4 py-3 text-xs text-ink-soft">
          <p className="font-bold text-ink">暫時只開放</p>
          <ul className="mt-2 space-y-1">
            {ALLOWED_EMAILS.map((email) => (
              <li key={email} className="font-semibold">
                · {email}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-faint">其他 Google 帳號即使登入成功亦無法讀寫資料。</p>
        </div>
      </main>
    </div>
  );
}

export function AuthNotConfigured() {
  return (
    <div className="bg-travel flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-300/40 bg-[#fffbeb] p-6 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-xl font-bold text-ink">尚未設定登入</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          請喺 Vercel／Clerk 設定 Google 登入同環境變數，然後重新部署。詳見專案{" "}
          <code className="rounded bg-white px-1">.env.example</code>。
        </p>
      </div>
    </div>
  );
}

function SsoCallback() {
  return (
    <div className="bg-travel flex min-h-dvh flex-col items-center justify-center gap-3 px-4">
      <p className="text-sm font-semibold text-ink-soft">Google 登入處理中…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}

export function AuthGate({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = normalizeEmail(user?.primaryEmailAddress?.emailAddress);
  const allowed = !email || isEmailAllowed(email);
  const sync = useCloudSync({ enabled: isSignedIn && allowed });
  const [hash, setHash] = useState(() => window.location.hash);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setLoadTimedOut(false);
      return undefined;
    }
    const t = window.setTimeout(() => setLoadTimedOut(true), 10000);
    return () => window.clearTimeout(t);
  }, [isLoaded]);

  useEffect(() => {
    if (!isSignedIn || !email) return;
    if (!isEmailAllowed(email)) {
      signOut();
      return;
    }
    try {
      sessionStorage.removeItem("tc_google_oauth_manual");
    } catch {}
  }, [email, isSignedIn, signOut]);

  useEffect(() => {
    if (sync.status === "blocked") {
      signOut();
    }
  }, [sync.status, signOut]);

  if (hash.startsWith(SSO_HASH) || hash === "#/sso-callback") {
    return <SsoCallback />;
  }

  if (!isLoaded) {
    return (
      <div className="bg-travel flex min-h-dvh flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-sm font-semibold text-ink-soft">
          {loadTimedOut ? "登入服務回應較慢…" : "載入登入狀態…"}
        </p>
        {loadTimedOut && (
          <button
            type="button"
            onClick={async () => {
              try {
                if ("serviceWorker" in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map((r) => r.unregister()));
                }
                if (typeof caches !== "undefined") {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }
              } catch {}
              window.location.reload();
            }}
            className="min-h-11 rounded-2xl bg-jade px-4 text-sm font-bold text-white"
          >
            清除快取後重試
          </button>
        )}
      </div>
    );
  }

  if (!isSignedIn || !allowed) {
    return <LoginScreen blockedReason={!allowed && email ? `${email} 未獲授權` : sync.message} />;
  }

  return (
    <div className="relative">
      <div className="safe-top sticky top-0 z-50 border-b border-jade/10 bg-white/85 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ink">{email}</p>
            <p className="truncate text-[11px] text-ink-faint">
              {sync.status === "syncing" && "同步中…"}
              {sync.status === "synced" && (sync.message || "已同步")}
              {sync.status === "error" && (sync.message || "同步失敗")}
              {sync.status === "idle" && "準備同步"}
              {sync.lastSyncedAt
                ? ` · ${new Date(sync.lastSyncedAt).toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => sync.pushNow()}
            className="min-h-9 shrink-0 rounded-xl bg-jade-soft px-3 text-[11px] font-bold text-jade-deep transition active:scale-95"
          >
            立即同步
          </button>
          <UserButton afterSignOutUrl="/universal/" />
        </div>
      </div>
      {children}
    </div>
  );
}
