/**
 * 前海兩日一夜（2026-10-12 – 10-13）
 * 過夜基地：蛇口石雲路 · 深圳蛇口海上世界RANY芮汐酒店
 * 主口岸：深圳灣。Day 1 入住海上世界；Day 2 桂灣後退房返港。
 */

import { QIANHAI_PLACE_SEED_VERSION, QIANHAI_PLACES } from "./places/qianhaiPlaces.js";

export const QIANHAI_TRIP_ID = "qianhai-2026-10";
export const QIANHAI_SEED_VERSION = QIANHAI_PLACE_SEED_VERSION;
export const QIANHAI_SEED_FLAG = "universal_qianhai_trip_seed_v3";

export const QIANHAI_TRIP = {
  id: QIANHAI_TRIP_ID,
  city: "前海",
  country: "深圳 · 海上世界",
  flag: "🌊",
  startDate: "2026-10-12",
  endDate: "2026-10-13",
  targetCurrency: "CNY",
  baseCurrency: "HKD",
  budget: 2500,
  createdAt: 1760227200000,
};

export const QIANHAI_HOTEL = {
  name: QIANHAI_PLACES.hotel.officialName,
  area: QIANHAI_PLACES.hotel.address,
  earliestCheckIn: "08:00",
  checkInDate: "2026-10-12",
  checkOutDate: "2026-10-13",
  nights: 1,
  lat: QIANHAI_PLACES.hotel.lat,
  lng: QIANHAI_PLACES.hotel.lng,
  mapsQuery: QIANHAI_PLACES.hotel.mapsQuery,
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

/** 種子旅程 qianhai-2026-10：對齊兩日一夜日期 */
export function alignQianhaiTrip(trip) {
  if (!trip || trip.id !== QIANHAI_TRIP_ID) return trip;
  if (trip.startDate === QIANHAI_TRIP.startDate && trip.endDate === QIANHAI_TRIP.endDate) return trip;
  return {
    ...trip,
    startDate: QIANHAI_TRIP.startDate,
    endDate: QIANHAI_TRIP.endDate,
  };
}

export function qianhaiLogSeedKey(tripId) {
  return `universal_trip_${tripId}_${QIANHAI_SEED_VERSION}`;
}

export const QIANHAI_DAY_ITINERARY = {
  "2026-10-12": [
    { id: "qh-1012-0800", time: "08:00", text: "🏨 RANY芮汐酒店最早可入住（08:00）· 石雲路25號", placeId: "hotel" },
    { id: "qh-1012-0830", time: "08:30", text: "香港出發往深圳灣口岸（專線巴士）", placeId: "shenzhenBayPort" },
    { id: "qh-1012-0930", time: "09:30", text: "過關：深圳灣口岸 → 的士／網約去石雲路", placeId: "shenzhenBayPort" },
    { id: "qh-1012-1030", time: "10:30", text: "到東角頭，辦理入住 RANY芮汐酒店", placeId: "hotel" },
    { id: "qh-1012-1400", time: "14:00", text: "🍜 潮巷里（B106）· 約下午2點已食（實際紀錄）", placeId: "chaoXiangLi" },
    { id: "qh-1012-1500", time: "15:00", text: "📍 去海上世界廣場：明華輪＋環船廣場＋食玩（行約15分鐘或地鐵一站）", placeId: "seaWorldPlaza" },
    { id: "qh-1012-1630", time: "16:30", text: "🎨 可選：女媧像／文化藝術中心（望海路1187，廣場旁邊）", placeId: "seaWorldArtCenter" },
    { id: "qh-1012-1830", time: "18:30", text: "🍜 廣場晚餐：李小太／Terrace／南海小廚 → 返石雲路 RANY（潮巷里唔鎖晚餐鐘點）", placeId: "foodStreet" },
  ],
  "2026-10-13": [
    { id: "qh-1013-0900", time: "09:00", text: "🏨 RANY 退房 · 兩日一夜，行李一齊帶走或先寄一陣", placeId: "hotel" },
    { id: "qh-1013-0930", time: "09:30", text: "出發去前海桂灣（地鐵／的士）", placeId: "guiwanStation" },
    { id: "qh-1013-1030", time: "10:30", text: "📍 前海石公園散步（前海大道／金岸中街）", placeId: "stonePark" },
    { id: "qh-1013-1230", time: "12:30", text: "🍜 午餐 · 前海壹方匯食樓（聽海大道5059號）", placeId: "uniwalkHui" },
    { id: "qh-1013-1430", time: "14:30", text: "🛍️ 壹方匯／嘉里短暫走動（唔好去寶安壹方城）", placeId: "uniwalkHui" },
    { id: "qh-1013-1600", time: "16:00", text: "前往深圳灣口岸（東濱路1號，唔好當步行）", placeId: "shenzhenBayPort" },
    { id: "qh-1013-1700", time: "17:00", text: "回程過關：深圳灣口岸 → 香港（預留 60–90 分鐘）", placeId: "shenzhenBayPort" },
    { id: "qh-1013-1800", time: "18:00", text: "過關後乘巴士返港 · 唔追尾班", placeId: "shenzhenBayPort" },
  ],
};

function footprintFromPlace(id, extra) {
  const place = QIANHAI_PLACES[id];
  return {
    id: extra.id,
    dayId: extra.dayId,
    time: extra.time,
    type: extra.type,
    name: extra.name || place.name,
    area: place.officialName,
    note: extra.note || place.note || place.address,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    mapsQuery: place.mapsQuery,
    placeId: place.id,
    rating: extra.rating ?? 0,
    badges: extra.badges || [],
  };
}

export const QIANHAI_NEARBY_SPOTS = [
  footprintFromPlace("hotel", {
    id: "qh-fp-hotel",
    dayId: "2026-10-12",
    time: "10:30",
    type: "hotel",
    badges: ["again"],
    note: "兩日一夜過夜基地。最早 10/12 08:00 可入住，10/13 退房。石雲路25號，最近地鐵東角頭。",
  }),
  
  footprintFromPlace("fanlou", {
    id: "qh-fp-fanlou",
    dayId: "2026-10-12",
    time: "12:30",
    type: "food",
    badges: ["again", "value"],
    note: "石雲路／蛇口新街152號，RANY 對面一帶。粵菜點心，入住後就近醫肚。",
  }),
  footprintFromPlace("liXiaotaiBbq", {
    id: "qh-fp-lixiaotai",
    dayId: "2026-10-12",
    time: "18:30",
    type: "food",
    badges: ["value"],
    note: "廣場裏面 C 區船後廣場 102。串燒、生蠔、砂鍋粥；宵夜都得。",
  }),
  footprintFromPlace("nanhaiXiaochu", {
    id: "qh-fp-nanhai",
    dayId: "2026-10-12",
    time: "18:30",
    type: "food",
    note: "廣場裏面船尾 5 棟 101。想正式啲粵菜／海景位可嚟呢度。",
  }),
  footprintFromPlace("terraceThai", {
    id: "qh-fp-terrace",
    dayId: "2026-10-12",
    time: "19:00",
    type: "food",
    note: "廣場裏面 L2 露台泰菜；想輕鬆同氣氛可揀。入夜可有駐唱。",
  }),
  footprintFromPlace("chaoXiangLi", {
    id: "qh-fp-chaoxiangli",
    dayId: "2026-10-12",
    time: "14:00",
    type: "food",
    badges: ["again", "value"],
    note: "船尾廣場 B區 L1 B106。潮汕粿条／牛肉。今日已食／到訪（實際紀錄，約下午2點）。附近食玩、唔鎖鐘點——之後想再去都得。",
  }),
footprintFromPlace("seaWorldPlaza", {
    id: "qh-fp-plaza",
    dayId: "2026-10-12",
    time: "15:00",
    type: "spot",
    badges: ["view", "again"],
    note: "今日主線：望海路1128 海上世界廣場。裏面有明華輪、環船／船頭／船後廣場、餐飲酒吧街；食可揀 潮巷里（B區B106）、Terrace（L2）、李小太（C區102）、南海小廚（5棟101）。裏面有白日夢商場 Daydream（環船廣場／C區）；旁邊匯港商場、女媧像／文化藝術中心。由 RANY 步行約15分鐘，或東角頭→海上世界站 A 口。",
  }),
  footprintFromPlace("nvwa", {
    id: "qh-fp-ocean",
    dayId: "2026-10-12",
    type: "spot",
    badges: ["view"],
    note: "女媧補天像喺文化藝術中心旁。深圳冇「海上世界海洋世界」園區；小梅沙海洋世界喺鹽田，唔好去錯。",
  }),
  footprintFromPlace("seaWorldArtCenter", {
    id: "qh-fp-artcenter",
    dayId: "2026-10-12",
    time: "16:30",
    type: "spot",
    note: "望海路1187。廣場旁邊展館／文創；展期同時間以當日為準。同女媧像一齊行得。",
  }),
  footprintFromPlace("shekouOldStreet", {
    id: "qh-fp-oldstreet",
    type: "spot",
    note: "海昌街／海濱社區舊街。短程的士或步行，唔係觀光長線。",
  }),
  footprintFromPlace("stonePark", {
    id: "qh-fp-stone",
    dayId: "2026-10-13",
    time: "10:30",
    type: "spot",
    badges: ["view"],
    note: "前海大道與金岸中街。由東角頭出發要地鐵或的士。Day 2 散步為主。",
  }),
  footprintFromPlace("daydreamMall", {
    id: "qh-fp-daydream",
    dayId: "2026-10-12",
    time: "15:40",
    type: "shop",
    badges: ["again"],
    note: "現場名白日夢商場 Daydream。地圖標環船廣場／海上世界C區（望海路1128），同明華輪廣場一體；旁邊匯港。",
  }),
  footprintFromPlace("gatewayMall", {
    id: "qh-fp-maoye",
    dayId: "2026-10-12",
    type: "shop",
    note: "工業三路1號，海上世界站 D 口。補日用品同冷氣休息。唔係華強北茂業天地。",
  }),
  footprintFromPlace("gardenCity", {
    id: "qh-fp-garden",
    type: "shop",
    note: "太子灣郵輪大道一帶。唔想去前海購物先嚟呢度。",
  }),
  footprintFromPlace("uniwalkHui", {
    id: "qh-fp-uniwalk",
    dayId: "2026-10-13",
    time: "15:00",
    type: "shop",
    badges: ["value"],
    note: "聽海大道5059號，桂灣站 A2。唔好去寶安中心新湖路99號壹方城。",
  }),
  footprintFromPlace("kerry", {
    id: "qh-fp-kerry",
    dayId: "2026-10-13",
    type: "shop",
    note: "桂灣四路99號，同前海石公園一街之隔。同一日唔使兩個商場都行完。",
  }),
  footprintFromPlace("foodStreet", {
    id: "qh-fp-foodstreet",
    dayId: "2026-10-12",
    time: "18:30",
    type: "food",
    badges: ["value"],
    note: "廣場餐飲酒吧街（環明華輪）。已核實：Terrace L2、李小太 C區、南海小廚 5棟；潮巷里 B106 隨時可去（唔鎖鐘點）。食完可睇夜景／噴泉；先確認微信／支付寶。",
  }),
  footprintFromPlace("uniwalkHui", {
    id: "qh-fp-uniwalk-food",
    dayId: "2026-10-13",
    time: "12:30",
    type: "food",
    name: "前海壹方匯食樓",
    note: "Day 2 午餐穩定選擇，聽海大道5059號商場樓層。",
  }),
  footprintFromPlace("dongjiaotouStation", {
    id: "qh-fp-mtr",
    type: "move",
    note: "酒店最近地鐵。去桂灣要轉綫，行李多優先的士。",
  }),
  footprintFromPlace("seaWorldStation", {
    id: "qh-fp-mtr-seaworld",
    type: "move",
    note: "去廣場／匯港用呢站。酒店最近係東角頭，唔係呢站。",
  }),
  footprintFromPlace("shekouPortStation", {
    id: "qh-fp-shekou-port",
    type: "move",
    note: "近碼頭。蛇口船班先核對當日時間，唔係今回主口岸。",
  }),
  footprintFromPlace("shenzhenBayPort", {
    id: "qh-fp-taxi",
    dayId: "2026-10-12",
    type: "move",
    name: "深圳灣口岸的士／網約",
    badges: ["again"],
    note: "東濱路1號。來回酒店都坐車。報「石雲路25號 RANY芮汐酒店」。",
  }),
];

export function isQianhaiSeedFootprint(spot) {
  if (!spot) return false;
  if (spot.readonly === true || spot.locked === true) {
    return typeof spot.id === "string" && spot.id.startsWith("qh-fp-");
  }
  return typeof spot.id === "string" && spot.id.startsWith("qh-fp-");
}

function isQianhaiSeedItem(item) {
  return typeof item?.id === "string" && item.id.startsWith("qh-");
}

export function mergeQianhaiDayItinerary(existingItinerary = {}) {
  const next = { ...(existingItinerary && typeof existingItinerary === "object" ? existingItinerary : {}) };
  let changed = false;
  const seedDates = new Set(Object.keys(QIANHAI_DAY_ITINERARY));

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
      if (prev.time !== item.time || prev.text !== item.text || prev.placeId !== item.placeId) {
        Object.assign(prev, { time: item.time, text: item.text, placeId: item.placeId });
        changed = true;
      }
    });
    const allowed = new Set(items.map((item) => item.id));
    const trimmed = current.filter((item) => !isQianhaiSeedItem(item) || allowed.has(item.id));
    if (trimmed.length !== current.length) changed = true;
    trimmed.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
    next[dateId] = trimmed;
  });

  Object.keys(next).forEach((dateId) => {
    if (seedDates.has(dateId)) return;
    const day = Array.isArray(next[dateId]) ? next[dateId] : [];
    const kept = day.filter((item) => !isQianhaiSeedItem(item));
    if (kept.length !== day.length) changed = true;
    if (kept.length === 0) delete next[dateId];
    else next[dateId] = kept;
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
      prev.dayId !== nextSpot.dayId ||
      prev.address !== nextSpot.address ||
      prev.mapsQuery !== nextSpot.mapsQuery ||
      prev.placeId !== nextSpot.placeId ||
      prev.lat !== nextSpot.lat ||
      prev.lng !== nextSpot.lng
    ) {
      list[at] = nextSpot;
      changed = true;
    }
  });
  return { spots: list, changed };
}
