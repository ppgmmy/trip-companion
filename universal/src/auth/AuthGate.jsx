import { useAuth, useClerk, useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ALLOWED_EMAILS, isEmailAllowed, normalizeEmail } from "./allowlist";
import { applySyncPayload, collectSyncPayload, payloadFingerprint } from "./syncStorage";

const SYNC_META_KEY = "universal_cloud_sync_meta";

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
  const [status, setStatus] = useState("idle"); // idle | syncing | synced | error | blocked
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

      // Prefer newer side; if remote newer or local empty → pull
      if (remoteAt >= localAt || localCount === 0) {
        applySyncPayload(data.payload, { wipeMissing: true });
        writeLocalMeta(remoteAt || Date.now());
        lastFingerprint.current = payloadFingerprint(data.payload);
        setLastSyncedAt(remoteAt || Date.now());
        setStatus("synced");
        setMessage("已從雲端載入");
        // Force remount-friendly reload so hooks re-read localStorage
        window.setTimeout(() => window.location.reload(), 350);
        return { pulled: true };
      }

      // Local newer → upload
      await pushNow();
      return { uploaded: true };
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "同步失敗");
      return { error: true };
    }
  }, [enabled, getToken, isSignedIn, pushNow]);

  // Initial sync after sign-in
  useEffect(() => {
    if (!enabled || !isSignedIn) {
      bootstrapped.current = false;
      return;
    }
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    pullOrMerge();
  }, [enabled, isSignedIn, pullOrMerge]);

  // Debounced push when localStorage changes (same tab writes)
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
    // Same-tab writes don't fire storage events — poll lightly while signed in
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

function LoginScreen({ blockedReason }) {
  return (
    <div className="bg-travel flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-jade/15 bg-white/90 p-6 shadow-[var(--shadow-soft)] backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-jade">Trip Companion</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">登入後即可雲端同步</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          旅程、記帳、清單會喺已授權裝置之間同步。暫時只開放指定 Gmail。
        </p>
        <ul className="mt-4 space-y-1.5 rounded-2xl bg-mist px-4 py-3 text-xs text-ink-soft">
          {ALLOWED_EMAILS.map((email) => (
            <li key={email} className="font-semibold">
              · {email}
            </li>
          ))}
        </ul>
        {blockedReason && (
          <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">{blockedReason}</p>
        )}
        <div className="mt-5">
          <SignInButton mode="modal">
            <button
              type="button"
              className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]"
            >
              用 Google／Email 登入
            </button>
          </SignInButton>
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-faint">未授權帳號即使登入成功亦無法讀寫資料。</p>
      </div>
    </div>
  );
}

export function AuthNotConfigured() {
  return (
    <div className="bg-travel flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-300/40 bg-[#fffbeb] p-6 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-xl font-bold text-ink">尚未設定登入</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          請喺 Vercel 設定 <code className="rounded bg-white px-1">VITE_CLERK_PUBLISHABLE_KEY</code>、
          <code className="rounded bg-white px-1">CLERK_SECRET_KEY</code> 同 Upstash Redis，然後重新部署。
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          暫時只開放：wanlokszevenus@gmail.com、whatnamecaniuseonjg99gle@gmail.com
        </p>
      </div>
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

  useEffect(() => {
    if (!isSignedIn || !email) return;
    if (!isEmailAllowed(email)) {
      signOut();
    }
  }, [email, isSignedIn, signOut]);

  useEffect(() => {
    if (sync.status === "blocked") {
      signOut();
    }
  }, [sync.status, signOut]);

  if (!isLoaded) {
    return (
      <div className="bg-travel flex min-h-dvh items-center justify-center">
        <p className="text-sm font-semibold text-ink-soft">載入登入狀態…</p>
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
              {sync.lastSyncedAt ? ` · ${new Date(sync.lastSyncedAt).toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" })}` : ""}
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
