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
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const presetIds = new Set(PAYER_PRESETS.map((item) => item.id));
  const activePreset = presetIds.has(payer) && !customPayer.trim() ? payer : "";
  const extraRecentPayers = recentPayers.filter((name) => !presetIds.has(name));

  function selectPreset(id) {
    setPayer(id);
    setCustomPayer("");
  }

  const chipClass = (active) =>
    `min-h-9 rounded-xl border px-2 text-xs font-bold transition active:scale-[0.98] ${
      active ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
    }`;

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {QUICK_PAYER_IDS.map((id) => {
          const item = PAYER_PRESETS.find((p) => p.id === id);
          return (
            <button key={id} type="button" onClick={() => selectPreset(id)} className={chipClass(activePreset === id)}>
              {item?.label}
            </button>
          );
        })}
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setPaymentMethod(method.id)}
            className={chipClass(paymentMethod === method.id)}
          >
            {method.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl bg-mist/60 px-2.5 py-1.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold text-ink-soft">
          其他：{customPayer.trim() || payerLabel(payer) || "ppg"}
        </span>
        <span className="text-[10px] font-bold text-ink-faint">{open ? "收起" : "更多"}</span>
      </button>

      {open && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-jade/10 bg-mist/30 p-2">
          {PAYER_PRESETS.filter((item) => !QUICK_PAYER_IDS.includes(item.id)).map((item) => (
            <button key={item.id} type="button" onClick={() => selectPreset(item.id)} className={chipClass(activePreset === item.id)}>
              {item.label}
            </button>
          ))}
          {extraRecentPayers.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setPayer(name);
                setCustomPayer(name);
              }}
              className={chipClass(customPayer === name || payer === name)}
            >
              {name}
            </button>
          ))}
          <input
            value={customPayer}
            onChange={(e) => {
              const value = e.target.value;
              setCustomPayer(value);
              setPayer(value.trim() || activePreset || DEFAULT_PAYER_ID);
            }}
            placeholder="自訂姓名"
            className="h-9 min-w-[5rem] flex-1 rounded-xl border border-jade/15 bg-white px-2.5 text-xs outline-none ring-jade focus:ring-2"
          />
        </div>
      )}
    </div>
  );
}
