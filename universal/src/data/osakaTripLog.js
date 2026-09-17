/**
 * 大阪旅程真實日程紀錄（由用戶口述整理）。
 * 8/31–9/10 之後再補；而家先種 8/30 出發日。
 */

export const OSAKA_DAY_LOG_SEED_VERSION = "osaka-day-log-v1-2026-08-30";
export const OSAKA_DEPARTURE_DAY_ID = "2026-08-30";
export const OSAKA_DEPARTURE_DAY_LABEL = "8/30 出發日";

export const OSAKA_DAY_ITINERARY = {
  "2026-08-30": [
    {
      id: "osaka-0830-0430",
      time: "04:30",
      text: "起床出門 · 搭 NA52 巴士去機場 Terminal 2",
    },
    {
      id: "osaka-0830-0530",
      time: "05:30",
      text: "完成登機登記 · N記食早餐熱香餅",
    },
    {
      id: "osaka-0830-0645",
      time: "06:45",
      text: "過關 · 前往 200 幾號閘口 · 期間逛機場舖頭",
    },
    {
      id: "osaka-0830-0815",
      time: "08:15",
      text: "香港起飛前往大阪",
    },
    {
      id: "osaka-0830-1315",
      time: "13:15",
      text: "抵達關西機場（比預計早約一小時）",
    },
    {
      id: "osaka-0830-1500-move",
      time: "15:00",
      text: "南海電鐵 → 難波 → 日本橋 → 堺筋本町 12 號出口",
    },
    {
      id: "osaka-0830-1500-hotel",
      time: "15:00",
      text: "Check-in Daiwa Roynet Hotel Premier 堺筋本町 · 10 樓 1011 房",
    },
    {
      id: "osaka-0830-1600",
      time: "16:00",
      text: "心齋橋食嘢＋行街（由頭行到中段）",
    },
    {
      id: "osaka-0830-1630",
      time: "16:30",
      text: "租 LUUP 滑板／電動單車 · 心齋橋一帶踩住玩",
    },
    {
      id: "osaka-0830-1930",
      time: "19:30",
      text: "返酒店附近 Sukiya 食牛肉飯 · 收工一日",
    },
  ],
};

/** 足跡時間軸：去過邊、做過咩（方便喺「足跡」一頁回睇） */
export const OSAKA_DAY_FOOTPRINTS = [
  {
    id: "osaka-fp-0830-bus",
    dayId: "2026-08-30",
    time: "04:30",
    type: "move",
    name: "NA52 巴士 → 機場 T2",
    area: "香港",
    note: "凌晨四點半起身出門，搭 NA52 去機場 Terminal 2。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0830-checkin",
    dayId: "2026-08-30",
    time: "05:30",
    type: "arrival",
    name: "機場登記完成",
    area: "香港機場 T2",
    note: "朝早五點半完成登機登記。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0830-nkei",
    dayId: "2026-08-30",
    time: "05:40",
    type: "food",
    name: "N記 · 熱香餅早餐",
    area: "香港機場",
    note: "登記完食 N記早餐熱香餅。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0830-imm",
    dayId: "2026-08-30",
    time: "06:45",
    type: "move",
    name: "過關 · 200 幾號閘口",
    area: "香港機場",
    note: "六點四十五分過關，去 200 幾號閘口；期間行下入面舖頭。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0830-flight",
    dayId: "2026-08-30",
    time: "08:15",
    type: "arrival",
    name: "香港 → 大阪航班",
    area: "空中",
    note: "早上八點十五分由香港起飛去大阪。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0830-kix",
    dayId: "2026-08-30",
    time: "13:15",
    type: "arrival",
    name: "抵達關西機場",
    area: "關西機場",
    note: "抵達大阪，比預計早約一小時（約 13:15）。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0830-nankai",
    dayId: "2026-08-30",
    time: "15:00",
    type: "move",
    name: "南海電鐵 → 難波 → 日本橋 → 堺筋本町",
    area: "難波／日本橋",
    note: "搭南海列車去難波，再轉去日本橋，上堺筋本町 12 號出口。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0830-hotel",
    dayId: "2026-08-30",
    time: "15:00",
    type: "hotel",
    name: "Daiwa Roynet Hotel Premier 堺筋本町",
    area: "堺筋本町",
    note: "三點正 check-in，10 樓 1011 號房。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0830-shinsaibashi",
    dayId: "2026-08-30",
    time: "16:00",
    type: "spot",
    name: "心齋橋筋行街＋食嘢",
    area: "心齋橋",
    note: "下午四點去食嘢，同埋行心齋橋——由最頭行到中間。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0830-luup",
    dayId: "2026-08-30",
    time: "16:30",
    type: "experience",
    name: "LUUP 滑板／電動單車",
    area: "心齋橋",
    note: "租 LUUP 滑板同電動單車，喺心齋橋附近周圍踩。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0830-sukiya",
    dayId: "2026-08-30",
    time: "19:30",
    type: "food",
    name: "Sukiya 牛肉飯",
    area: "堺筋本町",
    note: "夜晚返酒店附近 Sukiya 食牛肉飯，一日收工。",
    rating: 4,
    badges: [],
  },
];

export function isOsakaTrip(trip) {
  if (!trip) return false;
  const blob = `${trip.city || ""} ${trip.country || ""} ${trip.name || ""} ${trip.title || ""}`.toLowerCase();
  return blob.includes("大阪") || blob.includes("osaka") || blob.includes("堺筋") || blob.includes("本町");
}

export function findOsakaTrip(trips) {
  if (!Array.isArray(trips)) return null;
  return trips.find((trip) => isOsakaTrip(trip)) || null;
}

export function osakaLogSeedKey(tripId) {
  return `universal_trip_${tripId}_${OSAKA_DAY_LOG_SEED_VERSION}`;
}

/** 合併一日行程：以 seed id 去重；唔抹走用戶其他手動項 */
export function mergeOsakaDayItinerary(existingItinerary = {}) {
  const next = { ...(existingItinerary && typeof existingItinerary === "object" ? existingItinerary : {}) };
  let changed = false;
  Object.entries(OSAKA_DAY_ITINERARY).forEach(([dateId, items]) => {
    const current = Array.isArray(next[dateId]) ? [...next[dateId]] : [];
    const ids = new Set(current.map((item) => item.id));
    items.forEach((item) => {
      if (ids.has(item.id)) return;
      current.push({ ...item });
      ids.add(item.id);
      changed = true;
    });
    current.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
    next[dateId] = current;
  });
  return { itinerary: next, changed };
}

/** 合併足跡：以 seed id 去重，可安全重跑 */
export function mergeOsakaDayFootprints(existingSpots = []) {
  const list = Array.isArray(existingSpots) ? [...existingSpots] : [];
  const ids = new Set(list.map((s) => s.id));
  let changed = false;
  const base = Date.now();
  OSAKA_DAY_FOOTPRINTS.forEach((spot, index) => {
    if (ids.has(spot.id)) return;
    list.push({
      ...spot,
      createdAt: base + index,
    });
    ids.add(spot.id);
    changed = true;
  });
  return { spots: list, changed };
}
