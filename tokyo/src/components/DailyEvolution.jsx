import { useState } from "react";
import { TRIP_DAYS, hashStr, todayIndex } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../storageKeys";

/** Tokyo-flavored daily micro-evolution pool (18 ideas). */
const POOL = [
  { id: "coins", name: "日圓硬幣辨識速查卡", desc: "¥1/¥5/¥10/¥50/¥100/¥500 圖鑑＋自動販賣機找續攻略。" },
  { id: "taxrefund", name: "退稅計算快捷鍵", desc: "輸入金額即時估算 10% 退稅，附 ¥5,000 門檻提醒，藥妝電器必備。" },
  { id: "cafe-wheel", name: "今日隨機選 Cafe 轉盤", desc: "由已記錄嘅 Cafe 足跡隨機抽一間，選擇困難救星。" },
  { id: "gacha-budget", name: "扭蛋預算分配器", desc: "將今日剩餘預算隨機拆做「食／買／扭蛋」三份，每日小驚喜。" },
  { id: "phrase-card", name: "日語 Cafe 常用語速查卡", desc: "點餐／插座／Wi-Fi 必備句型，附羅馬拼音，離線可用。" },
  { id: "konbini", name: "便利店必買評分表", desc: "7-11／FamilyMart／Lawson 新品試食記分，儲低最強宵夜。" },
  { id: "steps", name: "每日步數目標追蹤", desc: "東京日均兩萬步：記低目標同實際，回望成就感十足。" },
  { id: "souvenir", name: "手信清單＋預算分配", desc: "邊個送邊份、東京限定預算幾多、買咗未，一頁睇晒。" },
  { id: "suica", name: "Suica 餘額追蹤", desc: "記低每次增值同餘額，唔使去到閘口先發現唔夠錢。" },
  { id: "queue-log", name: "餐廳排隊時間記錄", desc: "記低一蘭／Harbs 等熱門店實際等候時間，下次有數得計。" },
  { id: "fx-alert", name: "日圓匯率波動提醒", desc: "日元兌港元升穿／跌穿自設門檻時提示，唱錢更精明。" },
  { id: "drugstore", name: "藥妝比價筆記", desc: "同一商品喺松本清／Sundrug／唐吉訶德嘅價錢對照表。" },
  { id: "gacha-log", name: "扭蛋收藏圖鑑", desc: "記低扭咗邊款、重複咗幾多隻、仲欠邊隻先齊。" },
  { id: "diary", name: "每日三行回顧日記", desc: "每晚三行：最正一刻／最伏一刻／聽日最期待。" },
  { id: "photo-quest", name: "拍照打卡任務進度", desc: "預設 9 宮格任務（鳥居／自動販賣機／櫻花…），儲齊召喚回憶。" },
  { id: "wifi-notes", name: "免費 Wi-Fi 熱點筆記", desc: "記低商場／車站／Cafe 嘅免費 Wi-Fi 名同連線方法。" },
  { id: "emergency", name: "緊急聯絡卡", desc: "日本報警 110／救護 119／保險 hotline 一頁收藏，離線可睇。" },
  { id: "rainy-planb", name: "下雨天 Plan B 清單", desc: "預設落雨替代動線（PARCO／Miyashita Park／室內 Cafe），落雨唔使諗。" },
];

function seededOrder(seedKey, length) {
  const arr = Array.from({ length }, (_, i) => i);
  let seed = hashStr(seedKey) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ideaForDay(dayIdx) {
  const order = seededOrder("tokyo-evolution", POOL.length);
  return dayIdx < order.length
    ? POOL[order[dayIdx]]
    : POOL[hashStr(`tokyo-evo-bonus-${dayIdx}`) % POOL.length];
}

function buildPrompt(idea) {
  return `請在 trip-companion 的 tokyo app 中實裝今日進化提案：「${idea.name}」。

功能說明：${idea.desc}

要求：
- 保持現有 localStorage key 穩定（tokyo-*），不要清掉使用者資料
- UI 需與現有 mobile-first、Tailwind 風格一致
- 新功能資料請用獨立 key 儲存，並支援離線使用
- 完成後協助 build 並準備部署`;
}

export default function DailyEvolution() {
  const [implemented, setImplemented] = useLocalStorage(STORAGE_KEYS.evolution, [], {
    legacyKeys: [],
    migrate: (v) =>
      (Array.isArray(v) ? v : []).map((item) =>
        typeof item === "number" ? { day: item, name: ideaForDay(item).name, date: null } : item
      ),
  });
  const [copied, setCopied] = useState(false);

  const dayIdx = todayIndex();
  const idea = ideaForDay(dayIdx);
  const done = implemented.some((e) => e.day === dayIdx);

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildPrompt(idea));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert("複製失敗，請手動選取");
    }
  }

  // Cumulative only: once implemented, the record never disappears.
  function markDone() {
    if (done) return;
    setImplemented((prev) => [
      ...prev,
      { day: dayIdx, name: idea.name, date: new Date().toISOString().slice(0, 10) },
    ]);
  }

  return (
    <section
      aria-label="每日隨機進化彩蛋"
      className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899] p-[1.5px] shadow-[0_14px_36px_-12px_rgb(124_58_237/0.45)]"
    >
      <div className="rounded-[calc(1.5rem-1.5px)] bg-white/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-lg shadow-md" aria-hidden="true">
              🎁
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">今日隨機進化提案</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a855f7]">Daily Upgrade Box</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[10px] font-bold text-[#7c3aed]">
            Day {dayIdx + 1} / {TRIP_DAYS} Evolution
          </span>
        </div>

        <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#faf5ff] to-[#fdf2f8] px-4 py-3">
          <p className="font-display text-[15px] font-bold text-ink">{idea.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{idea.desc}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="min-h-11 flex-1 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-sm font-bold text-white shadow-md transition active:scale-[0.97]"
          >
            {copied ? "已複製 ✓" : "📋 一鍵複製 Cursor Prompt"}
          </button>
          <button
            type="button"
            onClick={markDone}
            disabled={done}
            aria-pressed={done}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-bold transition active:scale-95 ${
              done ? "cursor-default border-transparent bg-teal text-white" : "border-[#a855f7]/30 bg-white text-[#7c3aed]"
            }`}
          >
            {done ? "✅ 已實裝" : "☐ 標記已實裝"}
          </button>
        </div>

        <p className="mt-2.5 px-1 text-[11px] text-ink-faint">
          {done
            ? "已實裝！此記錄會永久保留，只會繼續累積。"
            : "夜晚返酒店貼俾 Cursor，10 秒將呢個功能永久寫入 App。"}
        </p>

        {implemented.length > 0 && (
          <details className="mt-3 rounded-2xl bg-[#faf5ff] px-3 py-2.5">
            <summary className="cursor-pointer text-xs font-bold text-[#7c3aed]">
              進化歷史 · 已收集 {implemented.length} 個神級外掛
            </summary>
            <ul className="mt-2 space-y-1.5">
              {implemented
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((e) => (
                  <li key={e.day} className="flex items-center gap-2 text-[12px] text-ink-soft">
                    <span className="shrink-0 rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-bold text-[#7c3aed]">
                      Day {e.day + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{e.name}</span>
                    {e.date && <span className="shrink-0 text-[10px] text-ink-faint">{e.date}</span>}
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
