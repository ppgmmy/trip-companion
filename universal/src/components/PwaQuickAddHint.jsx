import { useEffect, useState } from "react";

const STORAGE_KEY = "tc_pwa_quick_add_hint_dismissed";

export default function PwaQuickAddHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      if (window.matchMedia("(display-mode: standalone)").matches) return;
    } catch {}
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  }

  return (
    <div className="rounded-xl border border-jade/15 bg-jade-soft/50 px-3 py-2.5 text-[11px] leading-relaxed text-ink-soft">
      <p className="font-bold text-jade-deep">💡 更快記帳</p>
      <p className="mt-1">
        將 App 加到主畫面後，長撳圖示可設「快速記帳」捷徑；底欄「記帳」長撳亦會開 ⚡。
      </p>
      <button type="button" onClick={dismiss} className="mt-2 text-[11px] font-bold text-jade-deep">
        知道了
      </button>
    </div>
  );
}
