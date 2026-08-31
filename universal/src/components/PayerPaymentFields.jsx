import { useState } from "react";
import { DEFAULT_PAYER_ID, PAYER_PRESETS, payerLabel } from "../data";

/** 一撳：ppg / mo / 共用現金袋 / 信用卡（個人卡） */
const QUICK_PAYER_IDS = ["ppg", "mo", "cash-pool"];
const CASH_POOL_ID = "cash-pool";

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
  const isCashPool = activePreset === CASH_POOL_ID;
  const isCard = paymentMethod === "card" && !isCashPool;

  function selectPreset(id) {
    setPayer(id);
    setCustomPayer("");
    // 共用現金袋：唔屬 ppg／mo，支付方式固定現金
    if (id === CASH_POOL_ID) {
      setPaymentMethod("cash");
    }
  }

  function selectCard() {
    setPaymentMethod("card");
    // 信用卡一定係個人卡 → 若而家係現金袋，改返預設個人
    if (payer === CASH_POOL_ID || payer === "cash") {
      setPayer(DEFAULT_PAYER_ID);
      setCustomPayer("");
    }
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
        <button type="button" onClick={selectCard} className={chipClass(isCard)}>
          信用卡
        </button>
      </div>

      <p className="px-0.5 text-[10px] leading-snug text-ink-faint">
        「現金」＝共用現金袋（唔記 ppg／mo）；信用卡再揀 ppg 或 mo
      </p>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl bg-mist/60 px-2.5 py-1.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold text-ink-soft">
          其他：{customPayer.trim() || payerLabel(payer) || "ppg"}
          {!isCashPool && paymentMethod === "cash" && activePreset && activePreset !== CASH_POOL_ID
            ? " · 現金付"
            : ""}
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
          <button
            type="button"
            onClick={() => {
              if (payer === CASH_POOL_ID) setPayer(DEFAULT_PAYER_ID);
              setPaymentMethod("cash");
            }}
            className={chipClass(paymentMethod === "cash" && !isCashPool)}
          >
            個人現金付
          </button>
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
