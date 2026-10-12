/**
 * 前海三日兩夜（2026-10-12 – 10-14）
 * 過夜基地：蛇口海上世界 · 海底世界 Rany Hotel
 * 主口岸：深圳灣。Day 2 先去桂灣／壹方城／前海石。
 */

export const QIANHAI_TRIP_ID = "qianhai-2026-10";
export const QIANHAI_SEED_VERSION = "qianhai-seed-v1-2026-10-12";
export const QIANHAI_SEED_FLAG = "universal_qianhai_trip_seed_v1";

export const QIANHAI_TRIP = {
  id: QIANHAI_TRIP_ID,
  city: "前海",
  country: "深圳 · 海上世界",
  flag: "🌊",
  startDate: "2026-10-12",
  endDate: "2026-10-14",
  targetCurrency: "CNY",
  baseCurrency: "HKD",
  budget: 2500,
  createdAt: 1760227200000,
};

export const QIANHAI_HOTEL = {
  name: "海底世界 Rany Hotel",
  area: "蛇口海上世界／Sea World",
  earliestCheckIn: "08:00",
  checkInDate: "2026-10-12",
  checkOutDate: "2026-10-14",
};

export function isQianhaiTrip(trip) {
  if (!trip) return false;
  if (trip.id === QIANHAI_TRIP_ID) return true;
  const blob = `${trip.city || ""} ${trip.country || ""} ${trip.name || ""} ${trip.title || ""}`.toLowerCase();
  return blob.includes("前海") || blob.includes("qianhai") || blob.includes("海上世界") || blob.includes("rany");
}

export function findQianhaiTrip(trips) {
  if (!Array.isArray(trips)) return null;
  return trips.find((trip) => trip.id === QIANHAI_TRIP_ID) || trips.find((trip) => isQianhaiTrip(trip)) || null;
}

export function qianhaiLogSeedKey(tripId) {
  return `universal_trip_${tripId}_${QIANHAI_SEED_VERSION}`;
}

export const QIANHAI_DAY_ITINERARY = {
  "2026-10-12": [
    { id: "qh-1012-0800", time: "08:00", text: "🏨 海底世界 Rany Hotel 最早可入住（08:00）" },
    { id: "qh-1012-0830", time: "08:30", text: "香港出發往深圳灣口岸（專線巴士）" },
    { id: "qh-1012-0930", time: "09:30", text: "過關：深圳灣口岸 → 的士／網約去海上世界" },
    { id: "qh-1012-1030", time: "10:30", text: "到海上世界，辦理入住 Rany Hotel" },
    { id: "qh-1012-1230", time: "12:30", text: "🍜 午餐 · 海上世界食肆（先確認微信／支付寶）" },
    { id: "qh-1012-1500", time: "15:00", text: "📍 午後走動：海上世界廣場／女媧像（前海留第二日）" },
    { id: "qh-1012-1830", time: "18:30", text: "🍜 晚餐後回酒店過夜 · 記下中文地址" },
  ],
  "2026-10-13": [
    { id: "qh-1013-0930", time: "09:30", text: "由海上世界出發去前海桂灣（地鐵／的士，行李留酒店）" },
    { id: "qh-1013-1030", time: "10:30", text: "📍 前海石公園散步" },
    { id: "qh-1013-1230", time: "12:30", text: "🍜 午餐 · 壹方城／嘉里中心食樓" },
    { id: "qh-1013-1500", time: "15:00", text: "🛍️ 桂灣走動 · 壹方城 Uniwalk（唔好當步行）" },
    { id: "qh-1013-1830", time: "18:30", text: "返回海上世界過夜 · 唔係住桂灣" },
  ],
  "2026-10-14": [
    { id: "qh-1014-1000", time: "10:00", text: "🏨 退房 · 可先寄行李再行一陣海上世界" },
    { id: "qh-1014-1200", time: "12:00", text: "🍜 午餐 · 海上世界或蛇口" },
    { id: "qh-1014-1400", time: "14:00", text: "前往深圳灣口岸（的士／網約，唔好當步行）" },
    { id: "qh-1014-1530", time: "15:30", text: "回程過關：深圳灣口岸 → 香港（預留 60–90 分鐘）" },
    { id: "qh-1014-1700", time: "17:00", text: "過關後乘巴士返港 · 唔追尾班" },
  ],
};

export const QIANHAI_NEARBY_SPOTS = [
  {
    id: "qh-fp-hotel",
    dayId: "2026-10-12",
    time: "10:30",
    type: "hotel",
    name: "海底世界 Rany Hotel",
    area: "蛇口海上世界",
    note: "過夜基地。最早 10/12 08:00 可入住；10/14 退房。唔係桂灣酒店。",
    rating: 0,
    badges: ["again"],
  },
  {
    id: "qh-fp-plaza",
    dayId: "2026-10-12",
    time: "15:00",
    type: "spot",
    name: "海上世界廣場／女媧像",
    area: "海上世界",
    note: "酒店出街即到。適合 Day 1 放行李後行一圈。",
    rating: 0,
    badges: ["view"],
  },
  {
    id: "qh-fp-ocean",
    dayId: "2026-10-12",
    type: "spot",
    name: "深圳海洋世界",
    area: "海上世界",
    note: "同酒店同一個圈。想入園先查當日門票同關門時間。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-oldstreet",
    type: "spot",
    name: "蛇口老街",
    area: "蛇口",
    note: "短程的士或步行。舊街小店，唔係觀光長線。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-stone",
    dayId: "2026-10-13",
    time: "10:30",
    type: "spot",
    name: "前海石公園",
    area: "前海桂灣",
    note: "由海上世界出發要地鐵或的士。Day 2 散步為主。",
    rating: 0,
    badges: ["view"],
  },
  {
    id: "qh-fp-maoye",
    dayId: "2026-10-12",
    type: "shop",
    name: "海上世界茂業天地",
    area: "海上世界",
    note: "酒店旁邊商場，補日用品、冷氣休息。Day 1／3。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-garden",
    type: "shop",
    name: "花園城中心",
    area: "蛇口",
    note: "蛇口另一個商場。唔想去前海購物先嚟呢度。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-uniwalk",
    dayId: "2026-10-13",
    time: "15:00",
    type: "shop",
    name: "前海壹方城 Uniwalk",
    area: "前海桂灣",
    note: "前海主力商場同食樓。Day 2 由酒店出發，唔好當步行。",
    rating: 0,
    badges: ["value"],
  },
  {
    id: "qh-fp-kerry",
    dayId: "2026-10-13",
    type: "shop",
    name: "前海嘉里中心",
    area: "前海桂灣",
    note: "壹方城附近備選。同一日唔使兩個商場都行完。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-foodstreet",
    dayId: "2026-10-12",
    time: "18:30",
    type: "food",
    name: "海上世界食街／酒吧街",
    area: "海上世界",
    note: "酒店樓下圈。Day 1、Day 3 晚餐最省來回。先問電子支付。",
    rating: 0,
    badges: ["value"],
  },
  {
    id: "qh-fp-uniwalk-food",
    dayId: "2026-10-13",
    time: "12:30",
    type: "food",
    name: "壹方城食樓",
    area: "前海桂灣",
    note: "Day 2 午餐穩定選擇，商場樓層為主。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-mtr",
    type: "move",
    name: "地鐵海上世界站（2 號綫）",
    area: "海上世界",
    note: "酒店最近地鐵。去前海要轉綫，行李多優先的士。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-shekou-port",
    type: "move",
    name: "地鐵蛇口港站",
    area: "蛇口",
    note: "近碼頭。蛇口船班先核對當日時間，唔係今回主口岸。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-convenience",
    type: "shop",
    name: "便利店（7-Eleven／羅森／美宜佳）",
    area: "海上世界",
    note: "廣場同商場內都有。過夜水同早餐可以喺呢度補。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-pharmacy",
    type: "shop",
    name: "連鎖藥房（海王星辰／大參林）",
    area: "海上世界",
    note: "商場層常見。常備藥先睇包裝同處方規定。",
    rating: 0,
    badges: [],
  },
  {
    id: "qh-fp-taxi",
    dayId: "2026-10-12",
    type: "move",
    name: "深圳灣口岸的士／網約",
    area: "口岸",
    note: "來回酒店同口岸都坐車。報「海上世界海底世界 Rany Hotel」。",
    rating: 0,
    badges: ["again"],
  },
];

export function isQianhaiSeedFootprint(spot) {
  if (!spot) return false;
  if (spot.readonly === true || spot.locked === true) {
    return typeof spot.id === "string" && spot.id.startsWith("qh-fp-");
  }
  return typeof spot.id === "string" && spot.id.startsWith("qh-fp-");
}

export function mergeQianhaiDayItinerary(existingItinerary = {}) {
  const next = { ...(existingItinerary && typeof existingItinerary === "object" ? existingItinerary : {}) };
  let changed = false;
  Object.entries(QIANHAI_DAY_ITINERARY).forEach(([dateId, items]) => {
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

export function mergeQianhaiNearbySpots(existingSpots = []) {
  const list = Array.isArray(existingSpots) ? [...existingSpots] : [];
  const indexById = new Map(list.map((s, i) => [s.id, i]));
  let changed = false;
  const base = Date.now();
  QIANHAI_NEARBY_SPOTS.forEach((spot, index) => {
    const at = indexById.get(spot.id);
    if (at == null) {
      list.push({
        ...spot,
        readonly: true,
        createdAt: base + index,
      });
      indexById.set(spot.id, list.length - 1);
      changed = true;
      return;
    }
    const prev = list[at];
    const nextSpot = {
      ...prev,
      ...spot,
      readonly: true,
      createdAt: prev.createdAt || base + index,
    };
    if (
      prev.name !== nextSpot.name ||
      prev.note !== nextSpot.note ||
      prev.area !== nextSpot.area ||
      prev.time !== nextSpot.time ||
      prev.dayId !== nextSpot.dayId
    ) {
      list[at] = nextSpot;
      changed = true;
    }
  });
  return { spots: list, changed };
}
