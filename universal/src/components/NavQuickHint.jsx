import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";

export default function NavQuickHint() {
  const [hints, setHints] = useLocalStorage(REGISTRY_KEYS.appHints, { navQuick: false }, {
    migrate: (v) => (v && typeof v === "object" ? v : { navQuick: false }),
  });

  if (hints.navQuick) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-lg px-4">
      <div className="pointer-events-auto rounded-2xl border border-jade/20 bg-white/95 px-3 py-2 shadow-[var(--shadow-nav)] backdrop-blur">
        <p className="text-[11px] font-bold text-jade-deep">💡 快捷提示</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">
          底欄「記帳」長撳 → ⚡ 快速記帳 · 右下角 ⚡ 隨時開 · 記帳完會保留你嘅篩選同分類
        </p>
        <button
          type="button"
          onClick={() => setHints((prev) => ({ ...prev, navQuick: true }))}
          className="mt-1.5 text-[10px] font-bold text-jade-deep"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
