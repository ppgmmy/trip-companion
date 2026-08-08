import { useEffect, useMemo, useRef, useState } from "react";
import { EVOLUTION_POOL } from "../evolutionPool";
import { PHOTO_QUESTS, PHRASES, toolMeta } from "../toolsMeta";
import { currencyInfo, formatMoney, toDateId, tripDays } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey } from "../storage";

const INPUT =
  "h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2";
const BTN = "h-11 shrink-0 rounded-2xl bg-jade px-4 text-sm font-bold text-white transition active:scale-95";
const DEL = "shrink-0 text-ink-faint transition active:scale-90";

function today() {
  return toDateId(new Date());
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function useTool(tripId, toolId, initial) {
  return useLocalStorage(tripKey(tripId, `tool_${toolId}`), initial);
}

/* ---------- generic add/remove list tool ---------- */
function ListTool({ trip, toolId, fields, initial = [] }) {
  const [items, setItems] = useTool(trip.id, toolId, initial);
  const [draft, setDraft] = useState({});
  function add(e) {
    e.preventDefault();
    if (!fields[0] || !(draft[fields[0].key] || "").trim()) return;
    const entry = { id: `li-${Date.now()}` };
    fields.forEach((f) => (entry[f.key] = (draft[f.key] || "").trim()));
    setItems((prev) => [...prev, entry]);
    setDraft({});
  }
  return (
    <div className="space-y-2">
      <form onSubmit={add} className="flex flex-wrap gap-2">
        {fields.map((f) => (
          <input
            key={f.key}
            value={draft[f.key] || ""}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            placeholder={f.label}
            className={`${INPUT} min-w-0 flex-1`}
            style={{ flexBasis: fields.length > 1 ? "45%" : "100%" }}
          />
        ))}
        <button type="submit" className={BTN}>加</button>
      </form>
      <ul className="space-y-1.5">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-mist px-3 py-2.5 text-center text-xs text-ink-faint">未有記錄</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 rounded-2xl bg-mist px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 text-ink">
                {fields.map((f, i) => (
                  <span key={f.key}>
                    {i > 0 && <span className="text-ink-faint"> · </span>}
                    {it[f.key]}
                  </span>
                ))}
              </span>
              <button type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className={DEL} aria-label="刪除">
                <XIcon />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/* ---------- individual tools ---------- */

function CoinsTool({ trip }) {
  const meta = toolMeta(trip.targetCurrency);
  return (
    <div className="space-y-2 text-[13px] text-ink-soft">
      <p className="rounded-2xl bg-mist px-3 py-2.5 font-semibold text-ink">{meta.coins}</p>
      {meta.coinTip && <p className="px-1 leading-relaxed">{meta.coinTip}</p>}
    </div>
  );
}

function TaxTool({ trip }) {
  const meta = toolMeta(trip.targetCurrency);
  const [cfg, setCfg] = useTool(trip.id, "taxrefund", { rate: meta.taxRate, threshold: meta.taxThreshold });
  const [amount, setAmount] = useState("");
  const refund = (Number(amount) || 0) * (cfg.rate / 100);
  const eligible = Number(amount) >= cfg.threshold;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">退稅率 %</span>
          <input type="number" min="0" step="0.5" value={cfg.rate} onChange={(e) => setCfg((c) => ({ ...c, rate: Number(e.target.value) || 0 }))} className={INPUT} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">門檻（{trip.targetCurrency}）</span>
          <input type="number" min="0" value={cfg.threshold} onChange={(e) => setCfg((c) => ({ ...c, threshold: Number(e.target.value) || 0 }))} className={INPUT} />
        </label>
      </div>
      <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`消費金額（${trip.targetCurrency}）`} className={INPUT} />
      {Number(amount) > 0 && (
        <p className={`rounded-2xl px-3 py-2.5 text-[13px] font-semibold ${eligible ? "bg-jade-soft/70 text-jade-deep" : "bg-coral-soft text-coral"}`}>
          {eligible ? `預計可退稅 ${formatMoney(refund, trip.targetCurrency)}` : `未達門檻 ${formatMoney(cfg.threshold, trip.targetCurrency)}`}
        </p>
      )}
    </div>
  );
}

function CafeWheelTool({ trip, spots }) {
  const [picked, setPicked] = useState(null);
  const pool = spots.length ? spots : null;
  function spin() {
    if (!pool) return;
    setPicked(pool[Math.floor(Math.random() * pool.length)]);
  }
  return (
    <div className="space-y-2">
      <button type="button" onClick={spin} disabled={!pool} className="min-h-12 w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] font-bold text-white shadow-md transition active:scale-[0.97] disabled:opacity-50">
        🎰 抽一間！
      </button>
      {picked && (
        <p className="rounded-2xl bg-[#faf5ff] px-3 py-2.5 text-center font-display text-[15px] font-bold text-ink">
          {picked.name}
          {picked.area ? <span className="ml-1 text-xs font-medium text-ink-faint">（{picked.area}）</span> : null}
        </p>
      )}
      {!pool && <p className="px-1 text-xs text-ink-faint">先去「足跡」記低幾間 Cafe／餐廳，再返嚟抽。</p>}
    </div>
  );
}

function GachaBudgetTool({ trip, expenses }) {
  const [amount, setAmount] = useState("");
  const [split, setSplit] = useState(null);
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);
  const perDay = Math.max(0, (trip.budget - totalSpent) / Math.max(1, tripDays(trip)));
  function roll() {
    const base = Number(amount) > 0 ? Number(amount) : perDay;
    if (base <= 0) return;
    let a = Math.random(), b = Math.random(), c = Math.random();
    const sum = a + b + c;
    const eat = Math.round((base * a) / sum);
    const buy = Math.round((base * b) / sum);
    const play = Math.max(0, Math.round(base) - eat - buy);
    setSplit({ eat, buy, play, base: Math.round(base) });
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`今日預算（留空用日均 ${formatMoney(Math.round(perDay), trip.targetCurrency)}）`} className={`${INPUT} min-w-0 flex-1`} />
        <button type="button" onClick={roll} className={BTN}>扭！</button>
      </div>
      {split && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["🍜 食", split.eat], ["🛍 買", split.buy], ["🎡 玩", split.play]].map(([label, v]) => (
            <div key={label} className="rounded-2xl bg-mist px-2 py-2.5">
              <p className="text-[11px] font-bold text-ink-faint">{label}</p>
              <p className="font-display text-sm font-bold text-ink">{formatMoney(v, trip.targetCurrency)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhraseTool({ trip }) {
  const meta = toolMeta(trip.targetCurrency);
  const list = PHRASES[meta.lang] || PHRASES.en;
  return (
    <ul className="space-y-1.5">
      {list.map((p) => (
        <li key={p.local} className="rounded-2xl bg-mist px-3 py-2">
          <p className="text-[13px] font-semibold text-ink">{p.zh}</p>
          <p className="text-[13px] text-jade-deep">{p.local}{p.roman ? <span className="ml-1.5 text-xs text-ink-faint">{p.roman}</span> : null}</p>
        </li>
      ))}
    </ul>
  );
}

function OfflineMapTool({ trip }) {
  const [log, setLog] = useTool(trip.id, "offline-map", {});
  const key = today();
  const done = !!log[key];
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setLog((p) => ({ ...p, [key]: !p[key] }))}
        aria-pressed={done}
        className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border px-4 text-sm font-bold transition active:scale-[0.98] ${done ? "border-transparent bg-jade text-white" : "border-jade/15 bg-mist text-ink"}`}
      >
        <span>{key} 今日區域離線地圖</span>
        <span>{done ? "✅ 已下載" : "未下載"}</span>
      </button>
      <p className="px-1 text-xs text-ink-faint">Google Maps → 離線地圖 → 自訂範圍，覆蓋今日行程區域。</p>
    </div>
  );
}

function StepsTool({ trip }) {
  const [cfg, setCfg] = useTool(trip.id, "steps", { target: 20000, log: {} });
  const key = today();
  const actual = cfg.log[key] || "";
  const pct = cfg.target > 0 && actual ? Math.min(100, Math.round((actual / cfg.target) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">每日目標</span>
          <input type="number" min="0" step="1000" value={cfg.target} onChange={(e) => setCfg((c) => ({ ...c, target: Number(e.target.value) || 0 }))} className={INPUT} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">今日步數</span>
          <input type="number" min="0" value={actual} onChange={(e) => setCfg((c) => ({ ...c, log: { ...c.log, [key]: Number(e.target.value) || 0 } }))} className={INPUT} />
        </label>
      </div>
      <div className="rounded-2xl bg-mist px-3 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-faint">今日進度</span>
          <span className="font-bold text-ink">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-jade-soft">
          <div className="h-full rounded-full bg-jade transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function SouvenirTool({ trip }) {
  const [items, setItems] = useTool(trip.id, "souvenir", []);
  const [draft, setDraft] = useState({ to: "", item: "", price: "" });
  function add(e) {
    e.preventDefault();
    if (!draft.item.trim()) return;
    setItems((p) => [...p, { id: `sv-${Date.now()}`, to: draft.to.trim(), item: draft.item.trim(), price: Number(draft.price) || 0, bought: false }]);
    setDraft({ to: "", item: "", price: "" });
  }
  const total = items.reduce((s, i) => s + (i.bought ? 0 : i.price), 0);
  return (
    <div className="space-y-2">
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} placeholder="送俾" className={`${INPUT} min-w-0 flex-1`} style={{ flexBasis: "30%" }} />
        <input value={draft.item} onChange={(e) => setDraft((d) => ({ ...d, item: e.target.value }))} placeholder="手信" className={`${INPUT} min-w-0 flex-1`} style={{ flexBasis: "40%" }} />
        <input type="number" min="0" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} placeholder="預算" className={`${INPUT} w-20`} />
        <button type="submit" className={BTN}>加</button>
      </form>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 rounded-2xl bg-mist px-3 py-2 text-[13px]">
            <button
              type="button"
              onClick={() => setItems((p) => p.map((x) => (x.id === it.id ? { ...x, bought: !x.bought } : x)))}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-bold ${it.bought ? "border-jade bg-jade text-white" : "border-jade/30 text-transparent"}`}
              aria-label="已買"
            >
              ✓
            </button>
            <span className={`min-w-0 flex-1 ${it.bought ? "text-ink-faint line-through" : "text-ink"}`}>
              {it.item}{it.to ? <span className="text-ink-faint"> → {it.to}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-ink-soft">{it.price ? formatMoney(it.price, trip.targetCurrency) : ""}</span>
            <button type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className={DEL} aria-label="刪除"><XIcon /></button>
          </li>
        ))}
      </ul>
      {items.length > 0 && <p className="px-1 text-xs text-ink-faint">未買預算合計：{formatMoney(total, trip.targetCurrency)}</p>}
    </div>
  );
}

function TransitCardTool({ trip }) {
  const [entries, setEntries] = useTool(trip.id, "transit-card", []);
  const [amount, setAmount] = useState("");
  const balance = entries.reduce((s, e) => s + e.amount, 0);
  function add(sign) {
    const v = Number(amount);
    if (!Number.isFinite(v) || v <= 0) return;
    setEntries((p) => [...p, { id: `tc-${Date.now()}`, amount: sign * v, date: today() }]);
    setAmount("");
  }
  return (
    <div className="space-y-2">
      <p className="rounded-2xl bg-mist px-3 py-2.5 text-center">
        <span className="text-[11px] font-semibold text-ink-faint">估算餘額</span>
        <span className="ml-2 font-display text-lg font-bold text-ink">{formatMoney(balance, trip.targetCurrency)}</span>
      </p>
      <div className="flex gap-2">
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`金額（${trip.targetCurrency}）`} className={`${INPUT} min-w-0 flex-1`} />
        <button type="button" onClick={() => add(1)} className={BTN}>增值</button>
        <button type="button" onClick={() => add(-1)} className="h-11 shrink-0 rounded-2xl border border-jade/15 bg-white px-4 text-sm font-bold text-ink transition active:scale-95">扣除</button>
      </div>
      {entries.length > 0 && (
        <button type="button" onClick={() => setEntries([])} className="text-xs font-semibold text-ink-faint underline">重設記錄</button>
      )}
    </div>
  );
}

function FxAlertTool({ trip, rateState }) {
  const [threshold, setThreshold] = useTool(trip.id, "fx-alert", 0);
  const rate = rateState?.rate || 0;
  const hit = threshold > 0 && rate > 0 && rate >= threshold;
  return (
    <div className="space-y-2">
      <p className="rounded-2xl bg-mist px-3 py-2.5 text-[13px] text-ink-soft">
        而家 1 {trip.targetCurrency} ≈ <span className="font-bold text-ink">{rate ? rate.toFixed(4) : "—"}</span> HKD
      </p>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-ink-faint">提醒門檻（1 {trip.targetCurrency} = ? HKD）</span>
        <input type="number" min="0" step="0.0001" value={threshold || ""} onChange={(e) => setThreshold(Number(e.target.value) || 0)} className={INPUT} />
      </label>
      {threshold > 0 && rate > 0 && (
        <p className={`rounded-2xl px-3 py-2.5 text-[13px] font-semibold ${hit ? "bg-jade-soft/70 text-jade-deep" : "bg-mist text-ink-soft"}`}>
          {hit ? "🔔 已升穿門檻，唱錢／大手消費好時機！" : "未達門檻，繼續觀望。"}
        </p>
      )}
    </div>
  );
}

function LuggageTool({ trip }) {
  const [cfg, setCfg] = useTool(trip.id, "luggage", { allowance: 23, items: [] });
  const [name, setName] = useState("");
  const [kg, setKg] = useState("");
  const total = cfg.items.reduce((s, i) => s + i.kg, 0);
  const over = total > cfg.allowance;
  function add(e) {
    e.preventDefault();
    const w = Number(kg);
    if (!name.trim() || !Number.isFinite(w) || w <= 0) return;
    setCfg((c) => ({ ...c, items: [...c.items, { id: `lg-${Date.now()}`, name: name.trim(), kg: w }] }));
    setName("");
    setKg("");
  }
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-ink-faint">寄艙上限（kg）</span>
        <input type="number" min="0" value={cfg.allowance} onChange={(e) => setCfg((c) => ({ ...c, allowance: Number(e.target.value) || 0 }))} className={INPUT} />
      </label>
      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="物品（例：手信零食）" className={`${INPUT} min-w-0 flex-1`} />
        <input type="number" min="0" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="kg" className={`${INPUT} w-20`} />
        <button type="submit" className={BTN}>加</button>
      </form>
      <p className={`rounded-2xl px-3 py-2.5 text-[13px] font-semibold ${over ? "bg-coral-soft text-coral" : "bg-jade-soft/70 text-jade-deep"}`}>
        估算總重 {total.toFixed(1)} kg / {cfg.allowance} kg{over ? " · ⚠️ 超重！" : " · 安全"}
      </p>
      <ul className="space-y-1.5">
        {cfg.items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 rounded-2xl bg-mist px-3 py-2 text-[13px]">
            <span className="min-w-0 flex-1 text-ink">{it.name}</span>
            <span className="shrink-0 text-xs text-ink-soft">{it.kg} kg</span>
            <button type="button" onClick={() => setCfg((c) => ({ ...c, items: c.items.filter((x) => x.id !== it.id) }))} className={DEL} aria-label="刪除"><XIcon /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiaryTool({ trip }) {
  const [log, setLog] = useTool(trip.id, "diary", {});
  const key = today();
  const entry = log[key] || { best: "", worst: "", tomorrow: "" };
  function set(field, value) {
    setLog((p) => ({ ...p, [key]: { ...entry, [field]: value } }));
  }
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold text-ink-faint">{key} · 每晚三行</p>
      {[["best", "🌟 最正一刻"], ["worst", "💥 最伏一刻"], ["tomorrow", "🔭 聽日最期待"]].map(([field, label]) => (
        <label key={field} className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">{label}</span>
          <input value={entry[field]} onChange={(e) => set(field, e.target.value)} className={INPUT} />
        </label>
      ))}
      <p className="px-1 text-[11px] text-ink-faint">已寫 {Object.keys(log).length} 日 · 自動保存</p>
    </div>
  );
}

function PhotoQuestTool({ trip }) {
  const [done, setDone] = useTool(trip.id, "photo-quest", {});
  const count = PHOTO_QUESTS.filter((q) => done[q]).length;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {PHOTO_QUESTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setDone((p) => ({ ...p, [q]: !p[q] }))}
            aria-pressed={!!done[q]}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition active:scale-95 ${done[q] ? "border-transparent bg-jade text-white" : "border-jade/15 bg-mist text-ink-soft"}`}
          >
            <span className="text-base">{done[q] ? "📸" : "▫️"}</span>
            {q}
          </button>
        ))}
      </div>
      <p className="px-1 text-xs text-ink-faint">進度 {count} / {PHOTO_QUESTS.length}{count === PHOTO_QUESTS.length ? " · 🎉 儲齊！" : ""}</p>
    </div>
  );
}

function TimezoneTool({ trip }) {
  const meta = toolMeta(trip.targetCurrency);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const local = new Date(now.getTime() + meta.tzOffset * 3600000);
  const fmt = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="grid grid-cols-2 gap-2 text-center">
      <div className="rounded-2xl bg-mist px-2 py-3">
        <p className="text-[11px] font-bold text-ink-faint">{trip.city || "當地"}</p>
        <p className="font-display text-xl font-bold text-ink">{fmt(local)}</p>
      </div>
      <div className="rounded-2xl bg-mist px-2 py-3">
        <p className="text-[11px] font-bold text-ink-faint">香港</p>
        <p className="font-display text-xl font-bold text-jade-deep">{fmt(now)}</p>
      </div>
      <p className="col-span-2 px-1 text-[11px] text-ink-faint">時差 {meta.tzOffset >= 0 ? "+" : ""}{meta.tzOffset} 小時（以標準時間計，夏令時間或差 1 小時）</p>
    </div>
  );
}

function EmergencyTool({ trip }) {
  const meta = toolMeta(trip.targetCurrency);
  return (
    <ListTool
      trip={trip}
      toolId="emergency"
      fields={[{ key: "label", label: "名稱（例：報警）" }, { key: "value", label: "號碼／資料" }]}
      initial={meta.emergency}
    />
  );
}

/* ---------- registry ---------- */

const TOOL_COMPONENTS = {
  coins: CoinsTool,
  taxrefund: TaxTool,
  "cafe-wheel": CafeWheelTool,
  "gacha-budget": GachaBudgetTool,
  "phrase-card": PhraseTool,
  "offline-map": OfflineMapTool,
  steps: StepsTool,
  souvenir: SouvenirTool,
  "transit-card": TransitCardTool,
  "queue-log": (props) => <ListTool {...props} toolId="queue-log" fields={[{ key: "place", label: "店名" }, { key: "mins", label: "等候（分鐘）" }]} />,
  "fx-alert": FxAlertTool,
  luggage: LuggageTool,
  "wifi-notes": (props) => <ListTool {...props} toolId="wifi-notes" fields={[{ key: "place", label: "地點" }, { key: "wifi", label: "Wi-Fi 名稱" }, { key: "pass", label: "密碼" }]} />,
  diary: DiaryTool,
  "photo-quest": PhotoQuestTool,
  timezone: TimezoneTool,
  emergency: EmergencyTool,
  "rainy-planb": (props) => <ListTool {...props} toolId="rainy-planb" fields={[{ key: "plan", label: "落雨替代行程（例：室內商場 Cafe）" }]} />,
};

export default function ToolkitTab({ trip, spots, expenses, rateState, expandedTool }) {
  const [openId, setOpenId] = useState(expandedTool || null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!expandedTool) return;
    setOpenId(expandedTool);
    const t = setTimeout(() => {
      document.getElementById(`tool-${expandedTool}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(t);
  }, [expandedTool]);

  return (
    <div className="space-y-3" ref={listRef}>
      <div>
        <h2 className="font-display text-xl font-bold text-ink">🧰 外掛工具箱</h2>
        <p className="text-sm text-ink-soft">18 個神級外掛已全部實裝 · 資料按旅程獨立累積保存</p>
      </div>
      {EVOLUTION_POOL.map((tool) => {
        const Comp = TOOL_COMPONENTS[tool.id];
        const open = openId === tool.id;
        return (
          <div key={tool.id} id={`tool-${tool.id}`} className={`overflow-hidden rounded-3xl bg-white/85 shadow-[var(--shadow-soft)] transition ${open ? "ring-2 ring-[#a855f7]/50" : ""}`}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : tool.id)}
              aria-expanded={open}
              className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f3e8ff] text-sm" aria-hidden="true">🧩</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-bold text-ink">{tool.name}</span>
                <span className="block truncate text-[11px] text-ink-faint">{tool.desc}</span>
              </span>
              <svg className={`h-4 w-4 shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && Comp && (
              <div className="border-t border-jade-soft/60 px-4 py-3">
                <Comp trip={trip} spots={spots} expenses={expenses} rateState={rateState} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
