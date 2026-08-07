import { useState } from "react";

function toDateId(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildPrompt(items, trip) {
  const lines = items.map((f, i) => `${i + 1}. ${f.text}`).join("\n");
  return `請在 trip-companion 的 universal app 中加入以下功能／調整：\n\n${lines}\n\n目前旅程：${trip ? `${trip.city}（${trip.targetCurrency}）` : "未選"}\n\n要求：\n- 保持現有 localStorage key 穩定（universal_*），不要清掉使用者資料\n- UI 需與現有 mobile-first、Tailwind 風格一致\n- 完成後協助 build 並準備部署`;
}

export default function FeedbackModal({ trip, feedback, setFeedback }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  function submit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setFeedback((prev) => [...prev, { id: `fb-${Date.now()}`, text: trimmed, date: toDateId(new Date()) }]);
    setText("");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildPrompt(feedback, trip));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert("複製失敗，請手動選取文字");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="功能願望與回饋"
        className="fixed bottom-[5.5rem] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-jade-deep text-white shadow-[var(--shadow-soft)] transition active:scale-90"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-6m0 0V6m0 6h6m-6 0H6" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="功能願望與回饋"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-jade-soft/60 px-5 py-4">
              <h3 className="font-display text-lg font-bold text-ink">願望清單 / App 回饋</h3>
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-2xl bg-mist text-ink-soft transition active:scale-90" aria-label="關閉">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">快速記下想法</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  required
                  maxLength={500}
                  placeholder="例如：新增離線地圖／多幣種分帳…"
                  className="w-full rounded-2xl border border-jade/15 bg-mist px-4 py-3 text-base outline-none ring-jade focus:ring-2"
                />
              </label>
              <button type="submit" className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
                加入並產生 Cursor Prompt
              </button>
            </form>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto px-5 pb-2 text-sm">
              {feedback.length === 0 ? (
                <li className="rounded-2xl bg-mist px-3 py-2.5 text-center text-xs text-ink-faint">尚未記下任何想法</li>
              ) : (
                feedback
                  .slice()
                  .reverse()
                  .map((f) => (
                    <li key={f.id} className="flex items-start justify-between gap-2 rounded-2xl bg-mist px-3 py-2">
                      <span className="min-w-0 flex-1 text-[13px] text-ink">{f.text}</span>
                      <span className="shrink-0 text-[10px] text-ink-faint">{f.date}</span>
                    </li>
                  ))
              )}
            </ul>
            {feedback.length > 0 && (
              <div className="border-t border-jade-soft/60 px-5 py-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-faint">可直接貼給 Cursor</p>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-ink p-3.5 text-[12px] leading-relaxed text-mist">
                  {buildPrompt(feedback, trip)}
                </pre>
                <button type="button" onClick={copy} className="mt-3 min-h-11 w-full rounded-2xl border border-jade/15 bg-mist text-sm font-bold text-ink transition active:scale-[0.98]">
                  {copied ? "已複製 ✓" : "複製 Prompt"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
