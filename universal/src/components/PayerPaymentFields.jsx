import { useState } from "react";
import { DEFAULT_PAYER_ID, PAYER_PRESETS, PAYMENT_METHODS, payerLabel } from "../data";

const QUICK_PAYER_IDS = ["ppg", "mo"];

export default function PayerPaymentFields({
  payer,
  setPayer,
  customPayer,
  setCustomPayer,
  paymentMethod,
  setPaymentMethod,
  recentPayers = [],
  compact = false,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const presetIds = new Set(PAYER_PRESETS.map((item) => item.id));
  const activePreset = presetIds.has(payer) && !customPayer.trim() ? payer : "";
  const quickPayers = PAYER_PRESETS.filter((item) => QUICK_PAYER_IDS.includes(item.id));
  const extraRecentPayers = recentPayers.filter((name) => !presetIds.has(name));

  function selectPreset(id) {
    setPayer(id);
    setCustomPayer("");
  }

  return (
    <div className="rounded-2xl border border-jade/15 bg-mist/40">
      <div className="space-y-3 px-3 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">邊個付錢</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {quickPayers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectPreset(item.id)}
                className={`min-h-11 rounded-2xl border text-sm font-black transition active:scale-[0.98] ${
                  activePreset === item.id
                    ? "badge-active border-transparent shadow-sm"
                    : "border-jade/15 bg-white text-ink-soft"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">支付方式</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={`min-h-11 rounded-2xl border text-sm font-black transition active:scale-[0.98] ${
                  paymentMethod === method.id
                    ? "badge-active border-transparent shadow-sm"
                    : "border-jade/15 bg-white text-ink-soft"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">其他付款人</p>
          <p className="mt-0.5 truncate text-sm font-bold text-ink">
            {customPayer.trim() || payerLabel(payer) || "ppg"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink-soft">
          {open ? "收起" : "更多"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-jade/10 px-3 pb-3 pt-3">
          <div>
            <div className="flex flex-wrap gap-1.5">
              {PAYER_PRESETS.filter((item) => !QUICK_PAYER_IDS.includes(item.id)).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectPreset(item.id)}
                  className={`min-h-9 rounded-2xl border px-3 text-xs font-bold transition ${
                    activePreset === item.id ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {extraRecentPayers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {extraRecentPayers.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setPayer(name);
                      setCustomPayer(name);
                    }}
                    className={`min-h-8 rounded-2xl border px-2.5 text-[11px] font-bold transition ${
                      customPayer === name || payer === name
                        ? "badge-active border-transparent"
                        : "border-jade/15 bg-white text-ink-soft"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <input
              value={customPayer}
              onChange={(e) => {
                const value = e.target.value;
                setCustomPayer(value);
                setPayer(value.trim() || activePreset || DEFAULT_PAYER_ID);
              }}
              placeholder="自訂姓名"
              className={`mt-2 w-full rounded-2xl border border-jade/15 bg-white px-3 outline-none ring-jade focus:ring-2 ${
                compact ? "h-10 text-sm" : "h-11 text-sm"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
