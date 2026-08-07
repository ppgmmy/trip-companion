import { useState } from "react";

const DEFAULT_GROUPS = [
  {
    category: "證件與文件",
    items: [
      { id: "passport", label: "護照／身分證件" },
      { id: "tickets", label: "機票／登機證截圖" },
      { id: "booking", label: "住宿訂單與地址" },
      { id: "insurance", label: "旅遊保險" },
      { id: "cards", label: "信用卡／現金／交通卡" },
    ],
  },
  {
    category: "衣物",
    items: [
      { id: "tops", label: "上衣" },
      { id: "bottoms", label: "褲／裙" },
      { id: "underwear", label: "內衣褲襪" },
      { id: "jacket", label: "外套／雨具" },
      { id: "shoes", label: "好走的鞋" },
    ],
  },
  {
    category: "電子與藥物",
    items: [
      { id: "phone", label: "手機＋充電器" },
      { id: "powerbank", label: "行動電源" },
      { id: "adapter", label: "轉插／網卡" },
      { id: "meds", label: "個人藥物" },
    ],
  },
];

export default function ChecklistTab({ checked, setChecked }) {
  const groups = DEFAULT_GROUPS;
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const done = groups.reduce((s, g) => s + g.items.filter((i) => checked[i.id]).length, 0);
  const pct = total ? (done / total) * 100 : 0;

  function toggle(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">行李清單</h2>
          <p className="text-sm text-ink-soft">狀態自動保存於此旅程</p>
        </div>
        <button
          type="button"
          onClick={() => setChecked({})}
          className="min-h-11 rounded-2xl border border-jade/15 bg-white/80 px-3 text-xs font-semibold text-jade-deep transition active:scale-95"
        >
          重設
        </button>
      </div>

      <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">完成進度</span>
          <span className="font-bold text-ink">{done} / {total}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-jade-soft">
          <div className="h-full rounded-full bg-jade transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">{group.category}</h3>
          <ul className="divide-y divide-jade-soft overflow-hidden rounded-3xl bg-white/85 shadow-[var(--shadow-soft)]">
            {group.items.map((item) => {
              const on = !!checked[item.id];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={`flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left transition active:bg-jade-soft/40 ${on ? "opacity-70" : ""}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold transition ${on ? "border-jade bg-jade text-white" : "border-jade/30 text-transparent"}`}>
                      ✓
                    </span>
                    <span className={`text-[15px] font-medium ${on ? "text-ink-faint line-through" : "text-ink"}`}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
