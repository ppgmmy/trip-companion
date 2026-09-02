import { Component } from "react";

/**
 * Catch render crashes so users never see a blank white root.
 * Offers reload + optional Service Worker / cache reset.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try {
      console.error("[TripCompanion] render crash", error, info?.componentStack);
    } catch {}
  }

  async hardReset() {
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
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message =
      this.state.error instanceof Error ? this.state.error.message : String(this.state.error || "未知錯誤");

    return (
      <div className="bg-travel flex min-h-dvh flex-col items-center justify-center px-5 py-10 text-center">
        <div className="w-full max-w-md rounded-3xl border border-coral/25 bg-white/95 p-6 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-coral">Oops</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">畫面載入失敗</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            App 喺顯示時出錯。多數係暫存／舊版檔案衝突，重新整理或清除快取通常就得。
          </p>
          <p className="mt-3 max-h-24 overflow-auto rounded-2xl bg-mist/80 px-3 py-2 text-left font-mono text-[11px] text-ink-faint">
            {message}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-12 rounded-2xl bg-jade text-sm font-bold text-white active:scale-[0.98]"
            >
              重新整理
            </button>
            <button
              type="button"
              onClick={() => this.hardReset()}
              className="min-h-12 rounded-2xl border border-jade/20 bg-white text-sm font-bold text-jade-deep active:scale-[0.98]"
            >
              清除快取後重開
            </button>
          </div>
        </div>
      </div>
    );
  }
}
