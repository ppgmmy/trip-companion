export function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function item(time, title, detail, tag, zone, mapsQuery) {
  return { time, title, detail, tag, zone, mapsQuery };
}

export const TRIP_START = new Date(2026, 7, 7);
export const TRIP_END = new Date(2026, 8, 6);
export const TRIP_DAYS = 31;
export const DEFAULT_RATE = 0.051; // 100 JPY = 5.1 HKD
export const DEFAULT_BUDGET_JPY = 350000;
export const RATE_TTL_MS = 24 * 60 * 60 * 1000;

export const WEEK_META = {
  1: { label: "W1", hint: "澀谷安頓 · 原宿暖身" },
  2: { label: "W2", hint: "PARCO 獵寶 · 秋葉遠征" },
  3: { label: "W3", hint: "中野遠征 · 表參道節奏" },
  4: { label: "W4", hint: "御苑半日 · 長住日常" },
  5: { label: "W5", hint: "收心伴手禮 · 返程" },
};

export function weekOf(date) {
  const diff = Math.floor((date - TRIP_START) / 86400000);
  if (diff < 0) return 1;
  if (diff < 7) return 1;
  if (diff < 14) return 2;
  if (diff < 21) return 3;
  if (diff < 28) return 4;
  return 5;
}

/** Prefer historically locked HKD; never recompute from the live global rate. */
export function lockedHkd(entry, fallbackRate = DEFAULT_RATE) {
  try {
    if (typeof entry?.amountInHKD === "number" && Number.isFinite(entry.amountInHKD) && entry.amountInHKD >= 0) {
      return entry.amountInHKD;
    }
    if (typeof entry?.hkd === "number" && Number.isFinite(entry.hkd) && entry.hkd >= 0) {
      return entry.hkd;
    }
    const rate =
      typeof entry?.storedRate === "number" && entry.storedRate > 0
        ? entry.storedRate
        : fallbackRate;
    const jpy = Number(entry?.jpy);
    return (Number.isFinite(jpy) ? jpy : 0) * rate;
  } catch {
    return 0;
  }
}

/** Safe schema fallback for old transactions missing storedRate / amountInHKD. */
export function normalizeExpense(entry, fallbackRate = DEFAULT_RATE) {
  try {
    const src = entry && typeof entry === "object" ? entry : {};
    const jpyRaw = Number(src.jpy);
    const jpy = Number.isFinite(jpyRaw) ? jpyRaw : 0;
    const storedRate =
      typeof src.storedRate === "number" && src.storedRate > 0
        ? src.storedRate
        : fallbackRate > 0
          ? fallbackRate
          : DEFAULT_RATE;
    let amountInHKD;
    if (typeof src.amountInHKD === "number" && Number.isFinite(src.amountInHKD)) {
      amountInHKD = src.amountInHKD;
    } else if (typeof src.hkd === "number" && Number.isFinite(src.hkd)) {
      amountInHKD = src.hkd;
    } else {
      amountInHKD = jpy * storedRate;
    }
    const createdAt = Number(src.createdAt) || Date.now();
    let week = Number(src.week);
    if (!Number.isFinite(week) || week < 1 || week > 5) {
      try {
        week = weekOf(new Date(createdAt));
      } catch {
        week = 1;
      }
    }
    return {
      ...src,
      id: src.id || `exp-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      jpy,
      storedRate,
      amountInHKD,
      hkd: amountInHKD,
      note: typeof src.note === "string" ? src.note : "未命名",
      categoryId: typeof src.categoryId === "string" ? src.categoryId : "other",
      week,
      createdAt,
    };
  } catch {
    const now = Date.now();
    return {
      id: `exp-recovery-${now}`,
      jpy: 0,
      storedRate: fallbackRate || DEFAULT_RATE,
      amountInHKD: 0,
      hkd: 0,
      note: "無法讀取的紀錄",
      categoryId: "other",
      week: 1,
      createdAt: now,
    };
  }
}

export function hydrateExpenses(raw, fallbackRate = DEFAULT_RATE) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => normalizeExpense(entry, fallbackRate));
}

export const PLACES = [
  {
    id: "parco",
    zone: "near",
    category: "商場",
    name: "Shibuya PARCO（含 6F 興趣樓層）",
    detail: "Nintendo、Capcom、模型／Hobby 店集中，獵寶必到。",
    transit: "澀谷站步行",
    mapsQuery: "Shibuya PARCO Tokyo",
  },
  {
    id: "miyashita",
    zone: "near",
    category: "商場",
    name: "Miyashita Park",
    detail: "屋頂公園、逛街與輕食。",
    transit: "澀谷站步行",
    mapsQuery: "Miyashita Park Shibuya Tokyo",
  },
  {
    id: "crossing",
    zone: "near",
    category: "地標",
    name: "澀谷十字路口",
    detail: "人潮浪潮與夜景必體驗。",
    transit: "澀谷站步行",
    mapsQuery: "Shibuya Scramble Crossing Tokyo",
  },
  {
    id: "takeshita",
    zone: "near",
    category: "街頭",
    name: "竹下通",
    detail: "原宿潮流小吃與雜貨。",
    transit: "原宿站步行",
    mapsQuery: "Takeshita Street Harajuku Tokyo",
  },
  {
    id: "harakado",
    zone: "near",
    category: "商場",
    name: "Harakado",
    detail: "原宿新據點，選物與餐飲。",
    transit: "原宿站步行",
    mapsQuery: "Harakado Harajuku Tokyo",
  },
  {
    id: "omotesando-hills",
    zone: "near",
    category: "商場",
    name: "Omotesando Hills",
    detail: "表參道建築與逛街氛圍。",
    transit: "表參道／明治神宮前步行",
    mapsQuery: "Omotesando Hills Tokyo",
  },
  {
    id: "chop-coffee",
    zone: "near",
    category: "Cafe",
    name: "Chop Coffee（Cat Street）",
    detail: "巷弄質感咖啡，適合久坐。",
    transit: "原宿步行",
    mapsQuery: "Chop Coffee Cat Street Harajuku Tokyo",
  },
  {
    id: "koffee-mameya",
    zone: "near",
    category: "Cafe",
    name: "Koffee Mameya",
    detail: "精品豆專門，短坐也值得。",
    transit: "表參道／青山步行",
    mapsQuery: "Koffee Mameya Tokyo",
  },
  {
    id: "akihabara",
    zone: "expedition",
    category: "遠征",
    name: "秋葉原 ラジオ会館／駿河屋",
    detail: "興趣器材、二手／復古獵寶。",
    transit: "JR／地鐵轉乘",
    mapsQuery: "Radio Kaikan Akihabara Tokyo",
  },
  {
    id: "nakano",
    zone: "expedition",
    category: "遠征",
    name: "中野ブロードウェイ",
    detail: "收藏品與次文化一條龍。",
    transit: "JR 中央線至中野",
    mapsQuery: "Nakano Broadway Tokyo",
  },
  {
    id: "gyoen",
    zone: "expedition",
    category: "遠征",
    name: "新宿御苑",
    detail: "綠地放空半日。",
    transit: "地鐵新宿御苑前",
    mapsQuery: "Shinjuku Gyoen National Garden Tokyo",
  },
];

/** Full Aug 7 – Sep 6, 2026. ~2–3 expedition days (~5–10%). */
export const ITINERARY = [
  {
    id: "2026-08-07",
    day: 1,
    week: 1,
    title: "抵達 · 澀谷 check-in",
    vibe: "步行圈 · 安頓基地",
    mode: "near",
    items: [
      item("12:00", "入住澀谷／原宿步行圈", "以澀谷站為基地放下行李。", "生活", "near", "Shibuya Station Tokyo hotel"),
      item("16:00", "澀谷十字路口初體驗", "先感受人潮節奏，別急著掃貨。", "地標", "near", "Shibuya Scramble Crossing"),
      item("19:00", "Miyashita Park 輕鬆晚餐", "屋頂公園旁找一間坐下來。", "美食", "near", "Miyashita Park Shibuya restaurants"),
    ],
  },
  {
    id: "2026-08-08",
    day: 2,
    week: 1,
    title: "明治神宮 · 竹下通",
    vibe: "步行圈 · 原宿入門",
    mode: "near",
    items: [
      item("10:00", "明治神宮晨間散步", "避開人潮走參道。", "文化", "near", "Meiji Jingu Tokyo"),
      item("12:30", "竹下通小吃逛街", "可麗餅與雜貨慢慢晃。", "街頭", "near", "Takeshita Street Harajuku"),
      item("16:00", "Chop Coffee（Cat Street）", "巷弄咖啡放空，記錄足跡。", "Cafe", "near", "Chop Coffee Cat Street Harajuku"),
      item("19:00", "原宿／表參道晚餐", "步行回澀谷前解決。", "美食", "near", "Omotesando dinner Tokyo"),
    ],
  },
  {
    id: "2026-08-09",
    day: 3,
    week: 1,
    title: "PARCO 6F 興趣樓層",
    vibe: "步行圈 · 獵寶日",
    mode: "near",
    items: [
      item("11:00", "Shibuya PARCO 開逛", "直衝 6F：Nintendo、Capcom、模型／Hobby。", "興趣", "near", "Shibuya PARCO 6F Tokyo"),
      item("14:30", "PARCO Cafe 休息", "整理想買清單，別一次掃光。", "Cafe", "near", "Shibuya PARCO cafe"),
      item("17:30", "十字路口夜景散步", "人潮夜景收工。", "漫步", "near", "Shibuya Crossing night"),
      item("19:30", "澀谷居酒屋", "串燒收工。", "美食", "near", "Shibuya izakaya"),
    ],
  },
  {
    id: "2026-08-10",
    day: 4,
    week: 1,
    title: "Harakado · Cat Street",
    vibe: "步行圈 · 選物",
    mode: "near",
    items: [
      item("11:00", "Harakado", "原宿新據點選物與午餐。", "商場", "near", "Harakado Harajuku Tokyo"),
      item("14:30", "Cat Street 巷弄散步", "服飾、選物店慢慢看。", "漫步", "near", "Cat Street Harajuku Tokyo"),
      item("16:30", "Koffee Mameya", "精品豆短坐補給。", "Cafe", "near", "Koffee Mameya Tokyo"),
      item("19:00", "澀谷晚餐", "回基地圈。", "美食", "near", "Shibuya dinner Tokyo"),
    ],
  },
  {
    id: "2026-08-11",
    day: 5,
    week: 1,
    title: "Omotesando Hills 半日",
    vibe: "步行圈 · 建築逛街",
    mode: "near",
    items: [
      item("11:30", "Omotesando Hills", "建築動線與窗展慢慢逛。", "商場", "near", "Omotesando Hills Tokyo"),
      item("15:00", "表參道 Cafe", "安靜座位整理行程。", "Cafe", "near", "Omotesando cafe Tokyo"),
      item("18:30", "Miyashita Park 晚餐", "回澀谷收工。", "美食", "near", "Miyashita Park restaurants"),
    ],
  },
  {
    id: "2026-08-12",
    day: 6,
    week: 1,
    title: "PARCO 二訪 · Miyashita",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "PARCO 補漏", "只買昨天猶豫的興趣品。", "興趣", "near", "Shibuya PARCO Tokyo"),
      item("14:00", "Miyashita Park 半日", "屋頂公園與逛街。", "商場", "near", "Miyashita Park Shibuya"),
      item("18:00", "澀谷巷弄晚餐", "落樓即到。", "美食", "near", "Shibuya alley restaurants"),
    ],
  },
  {
    id: "2026-08-13",
    day: 7,
    week: 1,
    title: "Chop Coffee 久坐日",
    vibe: "步行圈 · Week 1 收束",
    mode: "near",
    items: [
      item("10:30", "Chop Coffee 開機", "有插座就待一上午。", "Cafe", "near", "Chop Coffee Harajuku"),
      item("14:00", "竹下通輕晃", "下午人潮較可控時再去。", "街頭", "near", "Takeshita Street Harajuku"),
      item("18:30", "早睡準備遠征", "明天秋葉原。", "生活", "near", "Shibuya Station Tokyo"),
    ],
  },
  {
    id: "2026-08-14",
    day: 8,
    week: 2,
    title: "遠征 · 秋葉原獵寶",
    vibe: "5% 遠征 · 興趣／復古",
    mode: "expedition",
    items: [
      item("10:30", "澀谷出發往秋葉原", "JR 山手線或地鐵，預留轉乘。", "交通", "expedition", "Shibuya to Akihabara Tokyo"),
      item("12:00", "ラジオ会館／周邊大樓", "模型、遊戲、興趣器材。", "興趣", "expedition", "Radio Kaikan Akihabara"),
      item("14:30", "駿河屋二手／復古獵寶", "慢慢翻櫃，設好預算上限。", "興趣", "expedition", "Surugaya Akihabara Tokyo"),
      item("18:00", "回澀谷晚餐", "傍晚前返回步行圈。", "美食", "near", "Shibuya Station dinner"),
    ],
  },
  {
    id: "2026-08-15",
    day: 9,
    week: 2,
    title: "恢復日 · Cat Street",
    vibe: "步行圈 · 充電",
    mode: "near",
    items: [
      item("11:00", "Chop Coffee 早午餐", "遠征隔天只走步行圈。", "Cafe", "near", "Chop Coffee Cat Street"),
      item("15:00", "Harakado／原宿室內", "躲雨或吹冷氣。", "商場", "near", "Harakado Harajuku"),
      item("19:00", "澀谷輕鬆晚餐", "早點休息。", "美食", "near", "Shibuya dinner"),
    ],
  },
  {
    id: "2026-08-16",
    day: 10,
    week: 2,
    title: "PARCO 6F 深度",
    vibe: "步行圈 · Hobby",
    mode: "near",
    items: [
      item("11:00", "PARCO 6F Nintendo／Capcom", "專區慢慢看，拍照紀錄價格。", "興趣", "near", "Shibuya PARCO Nintendo Tokyo"),
      item("14:30", "Hobby 樓層補貨", "只買清單內項目。", "興趣", "near", "Shibuya PARCO hobby"),
      item("18:30", "十字路口夜景", "散步收工。", "地標", "near", "Shibuya Scramble Crossing"),
    ],
  },
  {
    id: "2026-08-17",
    day: 11,
    week: 2,
    title: "Koffee Mameya · 表參道",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "Koffee Mameya", "排隊短坐，品味豆香。", "Cafe", "near", "Koffee Mameya Tokyo"),
      item("13:30", "Omotesando Hills", "午後逛街。", "商場", "near", "Omotesando Hills Tokyo"),
      item("18:00", "表參道晚餐後回澀谷", "步行或一站地鐵。", "美食", "near", "Omotesando restaurants Tokyo"),
    ],
  },
  {
    id: "2026-08-18",
    day: 12,
    week: 2,
    title: "Miyashita · 澀谷日常",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:30", "Miyashita Park", "逛街＋屋頂放空。", "商場", "near", "Miyashita Park Shibuya"),
      item("15:00", "澀谷巷弄 Cafe", "安靜久坐寫足跡。", "Cafe", "near", "quiet cafe Shibuya Tokyo"),
      item("19:00", "澀谷晚餐", "落樓。", "美食", "near", "Shibuya food"),
    ],
  },
  {
    id: "2026-08-19",
    day: 13,
    week: 2,
    title: "竹下通 · Harakado",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("12:00", "竹下通午餐逛街", "避開週末最尖峰更好。", "街頭", "near", "Takeshita Street Harajuku"),
      item("15:30", "Harakado 選物", "服飾與雜貨。", "購物", "near", "Harakado Harajuku Tokyo"),
      item("19:00", "原宿晚餐", "回澀谷。", "美食", "near", "Harajuku dinner Tokyo"),
    ],
  },
  {
    id: "2026-08-20",
    day: 14,
    week: 2,
    title: "長住補給日",
    vibe: "步行圈 · Week 2 收束",
    mode: "near",
    items: [
      item("11:00", "Chop Coffee", "開機處理雜事。", "Cafe", "near", "Chop Coffee Harajuku"),
      item("14:00", "澀谷採買日用品", "便利店／藥妝補耗材。", "生活", "near", "Shibuya drugstore Tokyo"),
      item("18:30", "早睡準備中野", "明天遠征。", "生活", "near", "Shibuya Station"),
    ],
  },
  {
    id: "2026-08-21",
    day: 15,
    week: 3,
    title: "遠征 · 中野百老匯",
    vibe: "5% 遠征 · 收藏品",
    mode: "expedition",
    items: [
      item("10:30", "澀谷 → 新宿 → 中野", "JR 山手線轉中央線。", "交通", "expedition", "Shibuya to Nakano Tokyo"),
      item("12:00", "中野ブロードウェイ", "手辦、同人、二手收藏慢慢翻。", "興趣", "expedition", "Nakano Broadway Tokyo"),
      item("16:30", "中野 Cafe 休息後回程", "傍晚前返回澀谷。", "Cafe", "expedition", "cafe near Nakano Broadway Tokyo"),
      item("19:00", "澀谷晚餐", "落樓收工。", "美食", "near", "Shibuya dinner"),
    ],
  },
  {
    id: "2026-08-22",
    day: 16,
    week: 3,
    title: "恢復 · Cat Street Cafe",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "Chop Coffee", "遠征後放空。", "Cafe", "near", "Chop Coffee Cat Street"),
      item("15:00", "PARCO 輕逛", "不強迫消費。", "商場", "near", "Shibuya PARCO"),
      item("19:00", "Miyashita 晚餐", "輕鬆。", "美食", "near", "Miyashita Park dinner"),
    ],
  },
  {
    id: "2026-08-23",
    day: 17,
    week: 3,
    title: "Omotesando Hills 深逛",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:30", "Omotesando Hills 半日", "建築與店舖動線。", "商場", "near", "Omotesando Hills Tokyo"),
      item("15:30", "Koffee Mameya 二訪", "換豆或帶豆。", "Cafe", "near", "Koffee Mameya Tokyo"),
      item("19:00", "表參道／澀谷晚餐", "收工。", "美食", "near", "Omotesando dinner"),
    ],
  },
  {
    id: "2026-08-24",
    day: 18,
    week: 3,
    title: "PARCO Hobby 日",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "PARCO 6F 再開", "對照中野戰利品，避免重複。", "興趣", "near", "Shibuya PARCO 6F"),
      item("14:30", "澀谷 Cafe", "清點收藏清單。", "Cafe", "near", "Shibuya cafe"),
      item("18:30", "十字路口夜景", "散步。", "地標", "near", "Shibuya Crossing"),
    ],
  },
  {
    id: "2026-08-25",
    day: 19,
    week: 3,
    title: "竹下通 · Harakado",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("12:00", "竹下通", "小吃與伴手禮初步。", "街頭", "near", "Takeshita Street"),
      item("15:00", "Harakado", "選物。", "商場", "near", "Harakado Harajuku"),
      item("19:00", "原宿晚餐", "回澀谷。", "美食", "near", "Harajuku restaurants"),
    ],
  },
  {
    id: "2026-08-26",
    day: 20,
    week: 3,
    title: "Miyashita 整天節奏",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "Miyashita Park", "逛街＋公園。", "商場", "near", "Miyashita Park"),
      item("15:00", "澀谷安靜 Cafe", "久坐。", "Cafe", "near", "quiet cafe Shibuya"),
      item("19:00", "澀谷晚餐", "落樓。", "美食", "near", "Shibuya dinner"),
    ],
  },
  {
    id: "2026-08-27",
    day: 21,
    week: 3,
    title: "Chop Coffee 工作日",
    vibe: "步行圈 · Week 3 收束",
    mode: "near",
    items: [
      item("10:30", "Chop Coffee", "插座＋不限時優先。", "Cafe", "near", "Chop Coffee Harajuku"),
      item("14:30", "Cat Street 散步", "活動筋骨。", "漫步", "near", "Cat Street Harajuku"),
      item("18:30", "早睡準備御苑", "明天半日遠征。", "生活", "near", "Shibuya Station"),
    ],
  },
  {
    id: "2026-08-28",
    day: 22,
    week: 4,
    title: "遠征 · 新宿御苑",
    vibe: "5% 遠征 · 綠地放空",
    mode: "expedition",
    items: [
      item("10:30", "澀谷出發往新宿御苑", "地鐵至新宿御苑前站。", "交通", "expedition", "Shinjuku Gyoen-mae Station"),
      item("11:30", "新宿御苑半日", "草地散步、拍照、慢節奏。", "戶外", "expedition", "Shinjuku Gyoen National Garden"),
      item("15:30", "回澀谷休息", "傍晚前返回，晚上落樓輕食。", "生活", "near", "Shibuya Station"),
      item("18:30", "澀谷輕食", "別吃太重。", "美食", "near", "Shibuya light meals"),
    ],
  },
  {
    id: "2026-08-29",
    day: 23,
    week: 4,
    title: "恢復 · Koffee Mameya",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "Koffee Mameya", "短坐補給。", "Cafe", "near", "Koffee Mameya"),
      item("14:00", "Omotesando Hills", "輕逛。", "商場", "near", "Omotesando Hills"),
      item("18:30", "澀谷晚餐", "收工。", "美食", "near", "Shibuya dinner"),
    ],
  },
  {
    id: "2026-08-30",
    day: 24,
    week: 4,
    title: "PARCO 興趣收尾勘查",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:00", "PARCO 6F 比價", "列出最後想帶走的清單。", "興趣", "near", "Shibuya PARCO 6F"),
      item("15:00", "Miyashita Cafe", "整理預算。", "Cafe", "near", "Miyashita Park cafe"),
      item("19:00", "澀谷晚餐", "落樓。", "美食", "near", "Shibuya food"),
    ],
  },
  {
    id: "2026-08-31",
    day: 25,
    week: 4,
    title: "Harakado · 竹下通",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("12:00", "Harakado 午餐逛街", "服飾選物。", "購物", "near", "Harakado Harajuku"),
      item("15:30", "竹下通伴手禮", "零食與小物。", "街頭", "near", "Takeshita Street souvenirs"),
      item("19:00", "原宿晚餐", "回澀谷。", "美食", "near", "Harajuku dinner"),
    ],
  },
  {
    id: "2026-09-01",
    day: 26,
    week: 4,
    title: "Cat Street 整天慢活",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("10:30", "Chop Coffee", "久坐上午。", "Cafe", "near", "Chop Coffee"),
      item("14:00", "Cat Street 選物", "不趕時間。", "漫步", "near", "Cat Street Harajuku"),
      item("18:30", "澀谷晚餐", "落樓。", "美食", "near", "Shibuya dinner"),
    ],
  },
  {
    id: "2026-09-02",
    day: 27,
    week: 4,
    title: "Miyashita · 十字路口",
    vibe: "步行圈",
    mode: "near",
    items: [
      item("11:30", "Miyashita Park", "逛街。", "商場", "near", "Miyashita Park"),
      item("16:00", "澀谷十字路口夕暮", "人潮與燈光。", "地標", "near", "Shibuya Crossing"),
      item("19:00", "澀谷居酒屋", "收工。", "美食", "near", "Shibuya izakaya"),
    ],
  },
  {
    id: "2026-09-03",
    day: 28,
    week: 4,
    title: "伴手禮決選",
    vibe: "步行圈 · Week 4 收束",
    mode: "near",
    items: [
      item("11:00", "PARCO／Miyashita 比價", "鎖定要結帳的清單。", "購物", "near", "Shibuya PARCO"),
      item("15:00", "Chop Coffee 整理清單", "坐下決定買什麼。", "Cafe", "near", "Chop Coffee Harajuku"),
      item("19:00", "澀谷晚餐", "早睡。", "美食", "near", "Shibuya dinner"),
    ],
  },
  {
    id: "2026-09-04",
    day: 29,
    week: 5,
    title: "結帳日 · 興趣＋伴手禮",
    vibe: "步行圈 · Week 5",
    mode: "near",
    items: [
      item("11:00", "PARCO 6F 結帳", "興趣品一次買齊。", "興趣", "near", "Shibuya PARCO 6F"),
      item("14:30", "竹下通／Harakado 補漏", "伴手禮最後補。", "購物", "near", "Takeshita Street Harajuku"),
      item("18:30", "澀谷輕鬆晚餐", "少走路。", "美食", "near", "Shibuya Station food"),
    ],
  },
  {
    id: "2026-09-05",
    day: 30,
    week: 5,
    title: "告別原宿 · 澀谷",
    vibe: "步行圈 · 收心",
    mode: "near",
    items: [
      item("11:00", "回訪最愛 Cafe", "Chop Coffee 或 Koffee Mameya。", "Cafe", "near", "Chop Coffee Cat Street"),
      item("15:00", "酒店整理行李", "檢查護照、模型包裝、充電器。", "生活", "near", "Shibuya hotel"),
      item("19:00", "告別晚餐", "回訪這個月最常去的那一間。", "美食", "near", "Shibuya favorite restaurant"),
    ],
  },
  {
    id: "2026-09-06",
    day: 31,
    week: 5,
    title: "返程日",
    vibe: "步行圈 · 一路順風",
    mode: "near",
    items: [
      item("依航班", "澀谷出發往機場", "預留電車／機場巴士與安檢時間。", "交通", "near", "Shibuya to Haneda or Narita Airport"),
      item("出發前", "酒店 check-out", "確認沒有東西留在房間。", "生活", "near", "Shibuya Station Tokyo"),
    ],
  },
];

export const CHECKLIST = [
  {
    category: "護照與重要文件",
    items: [
      { id: "passport", label: "護照／回程機票" },
      { id: "hotel", label: "酒店訂單（澀谷／原宿）" },
      { id: "ic-card", label: "Suica／Pasmo" },
      { id: "cash-card", label: "現金與信用卡" },
      { id: "insurance", label: "旅遊保險文件" },
      { id: "copies", label: "證件雲端備份" },
    ],
  },
  {
    category: "衣物鞋襪",
    items: [
      { id: "tops", label: "上衣 8–10 件（長住）" },
      { id: "bottoms", label: "長褲／短褲 5–6 件" },
      { id: "underwear", label: "內衣褲襪子（足夠一週＋備用）" },
      { id: "jacket", label: "薄外套（空調房）" },
      { id: "shoes", label: "好走的鞋 ×2（澀谷常走路）" },
      { id: "rain", label: "摺疊傘" },
      { id: "laundry", label: "洗衣相關／髒衣袋" },
    ],
  },
  {
    category: "隨身電子產品",
    items: [
      { id: "phone", label: "手機＋充電器" },
      { id: "powerbank", label: "行動電源" },
      { id: "adapter", label: "轉插（日本兩腳）" },
      { id: "earbuds", label: "耳機" },
      { id: "cable", label: "傳輸線備援" },
      { id: "sim", label: "網卡／eSIM" },
      { id: "laptop", label: "筆電（如需要久坐 Cafe）" },
    ],
  },
  {
    category: "個人護理",
    items: [
      { id: "toothbrush", label: "牙刷牙膏" },
      { id: "skincare", label: "洗面／保濕／防曬" },
      { id: "hygiene", label: "濕紙巾／衛生用品" },
      { id: "bottle", label: "環保杯／水壺" },
      { id: "mask", label: "口罩（地鐵人潮）" },
    ],
  },
  {
    category: "常用藥物",
    items: [
      { id: "prescription", label: "個人處方藥（足夠一個月）" },
      { id: "pain", label: "止痛／感冒藥" },
      { id: "stomach", label: "腸胃藥" },
      { id: "bandages", label: "OK蹦、消毒棉片" },
      { id: "allergy", label: "抗過敏藥（如需要）" },
    ],
  },
];

export const CAFE_TAGS = [
  { id: "quiet", label: "安靜放空", badge: "badge-sky" },
  { id: "outlets", label: "有插座", badge: "badge-teal" },
  { id: "nolimit", label: "不限時", badge: "badge-amber" },
  { id: "coffee", label: "咖啡極正", badge: "badge-rose" },
  { id: "hobby", label: "附近有玩具／模型店", badge: "badge-lime" },
];

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "餐飲", note: "餐飲", color: "#e11d48" },
  { id: "cafe", label: "咖啡店", note: "咖啡店", color: "#0f766e" },
  { id: "shopping", label: "服飾購物", note: "服飾購物", color: "#ea580c" },
  { id: "hobby", label: "玩具／興趣", note: "玩具／興趣", color: "#7c3aed" },
  { id: "transport", label: "交通", note: "交通", color: "#0369a1" },
  { id: "other", label: "其他", note: "其他", color: "#64748b" },
];
