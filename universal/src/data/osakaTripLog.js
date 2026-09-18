/**
 * 大阪旅程真實日程紀錄（由用戶口述整理）。
 * 已有 8/30、8/31、9/1、9/2、9/9；其餘日子之後再補。
 */

export const OSAKA_DAY_LOG_SEED_VERSION = "osaka-day-log-v5-2026-09-02";
/** 一鍵入口預設跳去最新補完嗰日 */
export const OSAKA_FOCUS_DAY_ID = "2026-09-09";
export const OSAKA_LOG_BANNER_LABEL = "8/30–9/9 旅程紀錄";
/** @deprecated 用 OSAKA_FOCUS_DAY_ID */
export const OSAKA_DEPARTURE_DAY_ID = OSAKA_FOCUS_DAY_ID;
/** @deprecated 用 OSAKA_LOG_BANNER_LABEL */
export const OSAKA_DEPARTURE_DAY_LABEL = OSAKA_LOG_BANNER_LABEL;

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
  "2026-08-31": [
    {
      id: "osaka-0831-1200",
      time: "12:00",
      text: "訓到好晏 · 午前休息",
    },
    {
      id: "osaka-0831-1400",
      time: "14:00",
      text: "落樓下珈琲館食晏",
    },
    {
      id: "osaka-0831-1445",
      time: "14:45",
      text: "踩單車／滑板落心齋橋行街",
    },
    {
      id: "osaka-0831-1600",
      time: "16:00",
      text: "麥當勞 · 薄荷朱古力飲品＋迷你熱香餅",
    },
    {
      id: "osaka-0831-1830",
      time: "18:30",
      text: "行到難波 · 睇固力果大 poster（道頓堀）",
    },
    {
      id: "osaka-0831-1930",
      time: "19:30",
      text: "南海難波商場 · 食蛋包飯",
    },
    {
      id: "osaka-0831-2030",
      time: "20:30",
      text: "難波渣滑板車返酒店 · 過程十分驚險",
    },
  ],
  "2026-09-01": [
    {
      id: "osaka-0901-1000",
      time: "10:00",
      text: "訓到大約十點 · 午前先出動",
    },
    {
      id: "osaka-0901-1100",
      time: "11:00",
      text: "心齋橋商店街 · PARCO 同大丸",
    },
    {
      id: "osaka-0901-1230",
      time: "12:30",
      text: "上樓食牛扒 · 約港紙 $130／位 · 中低價食到高質 · 幾抵",
    },
    {
      id: "osaka-0901-1400",
      time: "14:00",
      text: "星乃咖啡 · soufflé 難食 · 咖啡好飲",
    },
    {
      id: "osaka-0901-1530",
      time: "15:30",
      text: "幾層雜貨鋪 · 下層文具 · 上面包裝袋／招紙",
    },
    {
      id: "osaka-0901-1830",
      time: "18:30",
      text: "返酒店 · 望咗下樓下珈琲館 · 想買咖啡豆",
    },
  ],
  "2026-09-02": [
    {
      id: "osaka-0902-0930",
      time: "09:30",
      text: "起身梳洗 · 落樓下珈琲館食早餐",
    },
    {
      id: "osaka-0902-1030",
      time: "10:30",
      text: "搭去日本橋 → 轉近鐵去奈良",
    },
    {
      id: "osaka-0902-1200",
      time: "12:00",
      text: "小雨 · 行陣睇鹿",
    },
    {
      id: "osaka-0902-1300",
      time: "13:00",
      text: "奈良微型商店街 · Daiso 買咗幾對襪",
    },
    {
      id: "osaka-0902-1430",
      time: "14:30",
      text: "附近壽司店 · 壽司超好味、烏冬都好食（之後有人肚痛唔認）",
    },
    {
      id: "osaka-0902-1530",
      time: "15:30",
      text: "繼續行街 · 感覺比大阪簡樸、接近民生",
    },
    {
      id: "osaka-0902-1630",
      time: "16:30",
      text: "Seattle Best Cafe · 飲嘢唔錯",
    },
    {
      id: "osaka-0902-1730",
      time: "17:30",
      text: "返鐵路站 · 買奈良特色毛巾（¥600 幾）",
    },
    {
      id: "osaka-0902-1930",
      time: "19:30",
      text: "約七點半到酒店附近 · 7-Eleven 買少少嘢返酒店",
    },
  ],
  "2026-09-09": [
    {
      id: "osaka-0909-1000",
      time: "10:00",
      text: "訓到大約十點 · 午前先出動",
    },
    {
      id: "osaka-0909-1100",
      time: "11:00",
      text: "去天王寺站 → 行去動物園前站商場一帶",
    },
    {
      id: "osaka-0909-1200",
      time: "12:00",
      text: "3COINS PLUS 睇生活用品 · 耳機 ¥2000（約港紙 $100）先睇唔買",
    },
    {
      id: "osaka-0909-1300",
      time: "13:00",
      text: "Bic Camera · 睇 Google Pixel 10a 系列電話最後無買 · 睇到手信可以俾朋友",
    },
    {
      id: "osaka-0909-1500",
      time: "15:00",
      text: "另一間商場 NAMCO · 打太鼓同夾公仔",
    },
    {
      id: "osaka-0909-1630",
      time: "16:30",
      text: "連接商場之間嘅橋 · 景色好靚",
    },
    {
      id: "osaka-0909-1730",
      time: "17:30",
      text: "返 3COINS PLUS 買咗耳機 · 真係好抵",
    },
    {
      id: "osaka-0909-1830",
      time: "18:30",
      text: "搭火車返酒店",
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
  {
    id: "osaka-fp-0831-sleepin",
    dayId: "2026-08-31",
    time: "12:00",
    type: "other",
    name: "訓到好晏",
    area: "堺筋本町酒店",
    note: "8/31 訓到好晏，午前休息，晏晝先出動。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0831-cafe",
    dayId: "2026-08-31",
    time: "14:00",
    type: "cafe",
    name: "樓下珈琲館",
    area: "堺筋本町",
    note: "晏晝兩點落樓下珈琲館食。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0831-luup",
    dayId: "2026-08-31",
    time: "14:45",
    type: "experience",
    name: "踩單車／滑板 · 心齋橋",
    area: "心齋橋",
    note: "食完珈琲館踩單車、踩滑板落心齋橋行街。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0831-mcd",
    dayId: "2026-08-31",
    time: "16:00",
    type: "food",
    name: "麥當勞 · 薄荷朱古力＋迷你熱香餅",
    area: "心齋橋",
    note: "行到去麥當勞，食薄荷朱古力飲品同迷你熱香餅。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0831-glico",
    dayId: "2026-08-31",
    time: "18:30",
    type: "spot",
    name: "固力果大 poster",
    area: "道頓堀／難波",
    note: "夜晚行到難波一帶，睇埋固力果大 poster（行到尾段先到）。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0831-omurice",
    dayId: "2026-08-31",
    time: "19:30",
    type: "food",
    name: "南海難波商場 · 蛋包飯",
    area: "難波",
    note: "去南海難波商場食蛋包飯。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0831-skate-home",
    dayId: "2026-08-31",
    time: "20:30",
    type: "experience",
    name: "難波渣滑板車返酒店",
    area: "難波 → 堺筋本町",
    note: "食完蛋包飯喺難波渣滑板車返去，過程十分驚險。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0901-sleepin",
    dayId: "2026-09-01",
    time: "10:00",
    type: "other",
    name: "訓到大約十點",
    area: "堺筋本町酒店",
    note: "9/1 訓到大約十點，之後先出門。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0901-shinsaibashi",
    dayId: "2026-09-01",
    time: "11:00",
    type: "shop",
    name: "心齋橋商店街 · PARCO／大丸",
    area: "心齋橋",
    note: "去心齋橋商店街，逛 PARCO 同大丸。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0901-steak",
    dayId: "2026-09-01",
    time: "12:30",
    type: "food",
    name: "上樓食牛扒",
    area: "心齋橋／PARCO・大丸",
    note: "香港中低價錢但食到高質牛扒，幾抵；每位約港紙 $130。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0901-hoshino",
    dayId: "2026-09-01",
    time: "14:00",
    type: "cafe",
    name: "星乃咖啡 · soufflé／咖啡",
    area: "心齋橋商店街",
    note: "出返心齋橋商店街去星乃咖啡：soufflé 難食，咖啡好飲。",
    rating: 3,
    badges: [],
  },
  {
    id: "osaka-fp-0901-zakka",
    dayId: "2026-09-01",
    time: "15:30",
    type: "shop",
    name: "幾層雜貨鋪",
    area: "心齋橋商店街",
    note: "行埋商店街有間幾層雜貨鋪：下層文具，上面幾層賣產品包裝袋、招紙等。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0901-kohikan",
    dayId: "2026-09-01",
    time: "18:30",
    type: "cafe",
    name: "酒店樓下珈琲館",
    area: "堺筋本町",
    note: "夜晚返酒店望咗下樓下珈琲館，想買下佢啲咖啡豆。（店名就係「珈琲館」，唔係 cafe。）",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0902-breakfast",
    dayId: "2026-09-02",
    time: "09:30",
    type: "cafe",
    name: "樓下珈琲館早餐",
    area: "堺筋本町",
    note: "九點半起身梳洗，落樓下珈琲館食早餐。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0902-kintetsu",
    dayId: "2026-09-02",
    time: "10:30",
    type: "move",
    name: "日本橋 → 近鐵奈良",
    area: "日本橋／奈良",
    note: "先搭去日本橋，再轉近鐵去奈良。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0902-deer",
    dayId: "2026-09-02",
    time: "12:00",
    type: "spot",
    name: "小雨睇鹿",
    area: "奈良公園",
    note: "果日好似有點小雨，行咗陣去睇鹿。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0902-daiso",
    dayId: "2026-09-02",
    time: "13:00",
    type: "shop",
    name: "奈良微型商店街 · Daiso",
    area: "奈良",
    note: "落返去奈良微型商店街，有 Daiso；行咗陣買咗幾對襪。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0902-sushi",
    dayId: "2026-09-02",
    time: "14:30",
    type: "food",
    name: "奈良壽司店",
    area: "奈良商店街附近",
    note: "壽司超好味，烏冬都好好食；不過啲壽司食完會肚痛（有人唔認及扮嘢）。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0902-walk",
    dayId: "2026-09-02",
    time: "15:30",
    type: "spot",
    name: "奈良街景散步",
    area: "奈良",
    note: "繼續行；同大阪市感覺有啲唔同，比較簡樸、接近民生。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0902-seattle",
    dayId: "2026-09-02",
    time: "16:30",
    type: "cafe",
    name: "Seattle Best Cafe",
    area: "奈良",
    note: "去咗間 cafe 飲嘢，叫 Seattle Best Cafe，間嘢都唔錯。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0902-towel",
    dayId: "2026-09-02",
    time: "17:30",
    type: "shop",
    name: "奈良特色毛巾",
    area: "奈良鐵路站",
    note: "返鐵路站買咗一條有奈良特色嘅毛巾，¥600 幾。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0902-seven",
    dayId: "2026-09-02",
    time: "19:30",
    type: "shop",
    name: "酒店附近 7-Eleven",
    area: "堺筋本町",
    note: "約七點半到酒店附近，7 仔買少少嘢，之後返酒店。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0909-sleepin",
    dayId: "2026-09-09",
    time: "10:00",
    type: "other",
    name: "訓到大約十點",
    area: "堺筋本町酒店",
    note: "9/9 訓到大約十點，之後先出門。",
    rating: 0,
    badges: [],
  },
  {
    id: "osaka-fp-0909-tennoji",
    dayId: "2026-09-09",
    time: "11:00",
    type: "move",
    name: "天王寺站 → 動物園前站",
    area: "天王寺／動物園前",
    note: "去天王寺站，再行去動物園前站一帶；嗰邊都係商場。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0909-3coins-look",
    dayId: "2026-09-09",
    time: "12:00",
    type: "shop",
    name: "3COINS PLUS · 先睇耳機",
    area: "動物園前",
    note: "睇生活用品，見到耳機幾抵：¥2000（約港紙 $100）。果陣無買，走咗。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0909-bic",
    dayId: "2026-09-09",
    time: "13:00",
    type: "shop",
    name: "Bic Camera · Pixel 10a／手信",
    area: "天王寺／動物園前",
    note: "睇 Google Pixel 10a 系列電話，最後無買；反而睇到手信可以買返去俾朋友食。",
    rating: 4,
    badges: [],
  },
  {
    id: "osaka-fp-0909-namco",
    dayId: "2026-09-09",
    time: "15:00",
    type: "experience",
    name: "NAMCO · 太鼓＋夾公仔",
    area: "天王寺商場",
    note: "去另一間商場 NAMCO，打太鼓同夾公仔。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0909-bridge",
    dayId: "2026-09-09",
    time: "16:30",
    type: "spot",
    name: "商場之間連接橋",
    area: "天王寺",
    note: "去到連接唔同商場之間嘅橋，覺得嗰到景色好靚。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0909-3coins-buy",
    dayId: "2026-09-09",
    time: "17:30",
    type: "shop",
    name: "返 3COINS PLUS 買耳機",
    area: "動物園前",
    note: "最後先返去 3COINS PLUS 買咗個耳機，真係好抵。",
    rating: 5,
    badges: [],
  },
  {
    id: "osaka-fp-0909-train-home",
    dayId: "2026-09-09",
    time: "18:30",
    type: "move",
    name: "搭火車返酒店",
    area: "天王寺 → 堺筋本町",
    note: "買完耳機先搭火車返酒店。",
    rating: 0,
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

/** 合併一日行程：以 seed id 去重／覆寫 seed 欄位；唔抹走用戶其他手動項 */
export function mergeOsakaDayItinerary(existingItinerary = {}) {
  const next = { ...(existingItinerary && typeof existingItinerary === "object" ? existingItinerary : {}) };
  let changed = false;
  Object.entries(OSAKA_DAY_ITINERARY).forEach(([dateId, items]) => {
    const current = Array.isArray(next[dateId]) ? [...next[dateId]] : [];
    const byId = new Map(current.map((item) => [item.id, item]));
    items.forEach((item) => {
      const prev = byId.get(item.id);
      if (!prev) {
        current.push({ ...item });
        byId.set(item.id, item);
        changed = true;
        return;
      }
      if (prev.time !== item.time || prev.text !== item.text) {
        Object.assign(prev, { time: item.time, text: item.text });
        changed = true;
      }
    });
    current.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
    next[dateId] = current;
  });
  return { itinerary: next, changed };
}

/** 合併足跡：以 seed id 去重／覆寫 seed 欄位，可安全重跑 */
export function mergeOsakaDayFootprints(existingSpots = []) {
  const list = Array.isArray(existingSpots) ? [...existingSpots] : [];
  const indexById = new Map(list.map((s, i) => [s.id, i]));
  let changed = false;
  const base = Date.now();
  OSAKA_DAY_FOOTPRINTS.forEach((spot, index) => {
    const at = indexById.get(spot.id);
    if (at == null) {
      list.push({
        ...spot,
        createdAt: base + index,
      });
      indexById.set(spot.id, list.length - 1);
      changed = true;
      return;
    }
    const prev = list[at];
    const next = {
      ...prev,
      dayId: spot.dayId,
      time: spot.time,
      type: spot.type,
      name: spot.name,
      area: spot.area,
      note: spot.note,
      rating: spot.rating,
      badges: Array.isArray(spot.badges) ? [...spot.badges] : [],
    };
    if (
      prev.dayId !== next.dayId ||
      prev.time !== next.time ||
      prev.type !== next.type ||
      prev.name !== next.name ||
      prev.area !== next.area ||
      prev.note !== next.note ||
      prev.rating !== next.rating
    ) {
      list[at] = next;
      changed = true;
    }
  });
  return { spots: list, changed };
}
