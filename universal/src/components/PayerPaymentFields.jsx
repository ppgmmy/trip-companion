import { useState } from "react";
import { PAYER_PRESETS, PAYMENT_METHODS, payerLabel, paymentMethodLabel } from "../data";

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
  const activePreset = presetIds.has(payer) ? payer : "";
  const displayPayer = customPayer.trim() || payerLabel(payer) || "我";
  const displayPayment = paymentMethodLabel(paymentMethod) || "現金";

  return (
    <div className="rounded-2xl border border-jade/15 bg-mist/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">付款人 · 支付方式</p>
          <p className="mt-0.5 truncate text-sm font-bold text-ink">
            {displayPayer} · {displayPayment}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink-soft">
          {open ? "收起" : "改"}
        </span>
      </button>

      {open && (
        <div className={`space-y-3 border-t border-jade/10 px-3 pb-3 pt-3 ${compact ? "" : ""}`}>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">邊個付錢</p>
            <div className="flex flex-wrap gap-1.5">
              {PAYER_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPayer(item.id);
                    setCustomPayer("");
                  }}
                  className={`min-h-9 rounded-2xl border px-3 text-xs font-bold transition ${
                    activePreset === item.id ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {recentPayers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recentPayers.map((name) => (
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
                setPayer(value.trim() || activePreset || "me");
              }}
              placeholder="自訂姓名（例：阿明）"
              className={`mt-2 w-full rounded-2xl border border-jade/15 bg-white px-3 outline-none ring-jade focus:ring-2 ${
                compact ? "h-10 text-sm" : "h-11 text-sm"
              }`}
            />
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">支付方式</p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`min-h-9 rounded-2xl border px-3 text-xs font-bold transition ${
                    paymentMethod === method.id ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
