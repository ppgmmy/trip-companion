import { PAYER_PRESETS, PAYMENT_METHODS } from "../data";

export default function PayerPaymentFields({
  payer,
  setPayer,
  customPayer,
  setCustomPayer,
  paymentMethod,
  setPaymentMethod,
  compact = false,
}) {
  const presetIds = new Set(PAYER_PRESETS.map((item) => item.id));
  const activePreset = presetIds.has(payer) ? payer : "";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
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
                activePreset === item.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          value={customPayer}
          onChange={(e) => {
            const value = e.target.value;
            setCustomPayer(value);
            setPayer(value.trim() || activePreset || "me");
          }}
          placeholder="自訂姓名（例：阿明）"
          className={`mt-2 w-full rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2 ${
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
                paymentMethod === method.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function resolvePayerFields(entry) {
  const presetIds = new Set(PAYER_PRESETS.map((item) => item.id));
  const payer = entry?.payer || "me";
  if (presetIds.has(payer)) {
    return { payer, customPayer: "" };
  }
  return { payer, customPayer: payer };
}
