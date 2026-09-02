/**
 * 行程建議：食 → 景點 → 食 → 景點 交替節奏
 * 曼谷 Aug 30 – Sep 10 有精選日程；其他城市由 placesMeta 自動輪替。
 */

import { guideForTrip } from "../placesMeta";
import { toDateId, tripDays, WEEKDAY_LABELS } from "../data";

const FOOD_TAGS = new Set(["美食", "Cafe"]);
const SPOT_TAGS = new Set(["景點", "購物", "玩樂", "室內", "戶外", "市集", "河岸", "商場", "景觀", "公園"]);

const SLOT_TIMES = ["10:30", "13:30", "17:00", "19:30"];
const SLOT_KINDS = ["food", "spot", "food", "spot"];

export const BANGKOK_MAP = {
  center: { lat: 13.7563, lng: 100.5018, zoom: 11 },
  zones: [
    { id: "rama9", label: "Phra Ram 9", lat: 13.7594, lng: 100.5651, color: "#0d9488" },
    { id: "chong", label: "Chong Nonsi", lat: 13.7233, lng: 100.5294, color: "#0ea5e9" },
    { id: "siam", label: "Siam", lat: 13.7467, lng: 100.5347, color: "#f59e0b" },
    { id: "silom", label: "Silom", lat: 13.7263, lng: 100.5238, color: "#f97316" },
    { id: "iconsiam", label: "ICONSIAM", lat: 13.7267, lng: 100.5103, color: "#8b5cf6" },
    { id: "chatuchak", label: "Chatuchak", lat: 13.7999, lng: 100.5501, color: "#ec4899" },
    { id: "asiatique", label: "Asiatique", lat: 13.7047, lng: 100.5032, color: "#14b8a6" },
  ],
};

function slot(kind, time, title, detail, area, maps) {
  return {
    id: `${time}-${title}`,
    kind,
    time,
    title,
    detail,
    area,
    maps,
    tag: kind === "food" ? "美食" : "景點",
  };
}

/** 曼谷 8/30–9/10 精選（食→景→食→景） */
const BANGKOK_CURATED = {
  "2026-08-30": {
    title: "週末再逛 Siam",
    vibe: "補漏買清單",
    zone: "siam",
    slots: [
      slot("food", "10:30", "Siam Paragon Cafe", "冷氣咖啡開場，避開正午熱浪", "Siam", "cafes Siam Paragon Bangkok"),
      slot("spot", "13:30", "Siam Paragon", "主力逛街＋超市補貨", "Siam", "Siam Paragon Bangkok"),
      slot("food", "17:00", "Siam Center 美食樓", "室內午餐／下午茶", "Siam", "food court Siam Center Bangkok"),
      slot("spot", "19:30", "Siam Discovery", "設計選品同潮牌收尾", "Siam", "Siam Discovery Bangkok"),
    ],
  },
  "2026-08-31": {
    title: "Asiatique 前輕鬆",
    vibe: "住家圈放慢",
    zone: "rama9",
    slots: [
      slot("food", "10:30", "Phra Ram 9 巷弄早午餐", "Central Rama 9 周邊 Cafe", "Phra Ram 9", "cafes near Phra Ram 9 Bangkok"),
      slot("spot", "13:30", "Central Rama 9", "超市補給＋冷氣休息", "Phra Ram 9", "Central Rama 9 Bangkok"),
      slot("food", "17:00", "Chong Nonsi 晚餐預熱", "Sathon 區午餐或輕食", "Chong Nonsi", "restaurants near Chong Nonsi Bangkok"),
      slot("spot", "19:30", "Silom Complex", "傍晚商場散步", "Silom", "Silom Complex Bangkok"),
    ],
  },
  "2026-09-01": {
    title: "Asiatique 河岸夜",
    vibe: "傍晚出發",
    zone: "asiatique",
    slots: [
      slot("food", "10:30", "住家圈 Cafe", "午前輕鬆，儲力俾傍晚", "Phra Ram 9", "cafes near Phra Ram 9 Bangkok"),
      slot("spot", "13:30", "Central Rama 9", "正午室內避暑", "Phra Ram 9", "Central Rama 9 Bangkok"),
      slot("food", "17:00", "Asiatique 河畔晚餐", "河岸商場先食一頓", "Asiatique", "Asiatique The Riverfront Bangkok"),
      slot("spot", "19:30", "Asiatique 夜景", "夜市攤位＋夜燈散步", "Asiatique", "Asiatique The Riverfront Bangkok"),
    ],
  },
  "2026-09-02": {
    title: "河岸後恢復",
    vibe: "按摩＋商場",
    zone: "rama9",
    slots: [
      slot("food", "10:30", "Phra Ram 9 Cafe", "慢慢飲咖啡回魂", "Phra Ram 9", "cafes near Phra Ram 9 Bangkok"),
      slot("spot", "13:30", "Let's Relax 按摩", "泰式按摩兩小時", "Phra Ram 9", "Let's Relax Rama 9 Bangkok"),
      slot("food", "17:00", "Central Rama 9 美食", "商場內晚餐", "Phra Ram 9", "Central Rama 9 Bangkok"),
      slot("spot", "19:30", "Fortune Town", "電子配件補漏", "Phra Ram 9", "Fortune Town Bangkok"),
    ],
  },
  "2026-09-03": {
    title: "Siam 伴手禮",
    vibe: "商場比價",
    zone: "siam",
    slots: [
      slot("food", "10:30", "Siam Center Cafe", "咖啡開場", "Siam", "cafes Siam Center Bangkok"),
      slot("spot", "13:30", "Siam Paragon", "伴手禮同精品比價", "Siam", "Siam Paragon Bangkok"),
      slot("food", "17:00", "CentralWorld 餐飲", "天空步道連通吃飯", "Siam", "CentralWorld Bangkok"),
      slot("spot", "19:30", "Siam Square", "戶外街舖最後掃貨", "Siam", "Siam Square Bangkok"),
    ],
  },
  "2026-09-04": {
    title: "採買結帳",
    vibe: "最後補貨",
    zone: "rama9",
    slots: [
      slot("food", "10:30", "Rama 9 Cafe", "安靜久坐整理清單", "Phra Ram 9", "cafes near Phra Ram 9 Bangkok"),
      slot("spot", "13:30", "Central Rama 9", "日用品最後補貨", "Phra Ram 9", "Central Rama 9 Bangkok"),
      slot("food", "17:00", "Chong Nonsi 晚餐", "Silom 區餐廳", "Chong Nonsi", "restaurants Silom Bangkok"),
      slot("spot", "19:30", "Mahanakhon SkyWalk", "曼谷夜景打卡", "Chong Nonsi", "King Power Mahanakhon Bangkok"),
    ],
  },
  "2026-09-05": {
    title: "告別曼谷",
    vibe: "最愛再訪",
    zone: "siam",
    slots: [
      slot("food", "10:30", "最愛 Cafe 回訪", "Siam 或 Chong Nonsi 二選一", "Siam", "cafes Siam Bangkok"),
      slot("spot", "13:30", "Siam Paragon", "最後一轉心儀店舖", "Siam", "Siam Paragon Bangkok"),
      slot("food", "17:00", "最後一頓泰菜", "鎖定想再食一次嘅店", "Siam", "restaurants Siam Bangkok"),
      slot("spot", "19:30", "Lumphini 傍晚散步", "公園吹風收尾", "Silom", "Lumphini Park Bangkok"),
    ],
  },
  "2026-09-06": {
    title: "返程準備",
    vibe: "Check-out",
    zone: "rama9",
    slots: [
      slot("food", "10:30", "告別早餐", "酒店附近最後一餐", "Phra Ram 9", "cafes near Phra Ram 9 Bangkok"),
      slot("spot", "13:30", "Central Rama 9 補貨", "機場前最後補給", "Phra Ram 9", "Central Rama 9 Bangkok"),
      slot("food", "17:00", "輕食／打包", "預留時間整理行李", "Phra Ram 9", "Central Rama 9 Bangkok"),
      slot("spot", "19:30", "前往機場", "預留塞車同安檢時間", "交通", "Suvarnabhumi Airport Bangkok"),
    ],
  },
  "2026-09-07": {
    title: "緩衝日 · Siam",
    vibe: "自由慢活",
    zone: "siam",
    slots: [
      slot("food", "10:30", "EmQuartier Cafe", "Phrom Phong 區咖啡", "Phrom Phong", "cafes EmQuartier Bangkok"),
      slot("spot", "13:30", "Terminal 21", "主題商場逐層逛", "Asok", "Terminal 21 Bangkok"),
      slot("food", "17:00", "Jodd Fairs 美食", "火山排骨同夜市小食", "Rama 9", "Jodd Fairs DanNeramit Bangkok"),
      slot("spot", "19:30", "Benjakitti 公園", "天空步道黃昏散步", "Asok", "Benjakitti Forest Park Bangkok"),
    ],
  },
  "2026-09-08": {
    title: "文青區漫步",
    vibe: "Ari／Thonglor",
    zone: "siam",
    slots: [
      slot("food", "10:30", "Ari 區 Brunch", "BTS Ari 文青咖啡", "Ari", "cafes Ari Bangkok"),
      slot("spot", "13:30", "Chatuchak（如開市）", "市集或 JJ Mall 室內", "Chatuchak", "Chatuchak Weekend Market Bangkok"),
      slot("food", "17:00", "Thonglor 晚餐", "日式／泰式餐廳街", "Thonglor", "restaurants Thonglor Bangkok"),
      slot("spot", "19:30", "Talad Noi 壁畫巷", "老城文青打卡", "唐人街", "Talad Noi Bangkok"),
    ],
  },
  "2026-09-09": {
    title: "ICONSIAM 二訪",
    vibe: "河岸商場",
    zone: "iconsiam",
    slots: [
      slot("food", "10:30", "住家圈 Cafe", "儲力出發", "Chong Nonsi", "cafes near Chong Nonsi Bangkok"),
      slot("spot", "13:30", "ICONSIAM", "室內水上市場＋逛館", "ICONSIAM", "ICONSIAM Bangkok"),
      slot("food", "17:00", "ICONSIAM 美食區", "河畔晚餐", "ICONSIAM", "ICONSIAM Bangkok"),
      slot("spot", "19:30", "昭披耶河觀光船", "河景收尾（可選）", "河畔", "Chao Phraya River Bangkok"),
    ],
  },
  "2026-09-10": {
    title: "完美收官",
    vibe: "最後一日",
    zone: "chong",
    slots: [
      slot("food", "10:30", "Chong Nonsi 精品咖啡", "最後一杯", "Chong Nonsi", "cafes near Chong Nonsi Bangkok"),
      slot("spot", "13:30", "Sky Bar 或 Mahanakhon", "高空景觀（擇一）", "Silom", "Sky Bar Bangkok"),
      slot("food", "17:00", "唐人街 Yaowarat", "路邊攤海鮮", "唐人街", "Yaowarat Bangkok"),
      slot("spot", "19:30", "Asiatique 或 Siam 最後一轉", "按體力二選一", "河畔", "Asiatique The Riverfront Bangkok"),
    ],
  },
};

function isBangkokTrip(trip) {
  const city = (trip?.city || "").toLowerCase();
  const country = (trip?.country || "").toLowerCase();
  return city.includes("曼谷") || city.includes("bangkok") || country.includes("泰國") || country.includes("thailand");
}

function isFoodPlace(place) {
  return FOOD_TAGS.has(place.tag);
}

function isSpotPlace(place) {
  return SPOT_TAGS.has(place.tag) || (!isFoodPlace(place) && place.tag);
}

function pickRotating(list, dayIndex, offset) {
  if (!list.length) return null;
  return list[(dayIndex + offset) % list.length];
}

function autoDayPlan(trip, dayIndex) {
  const guide = guideForTrip(trip);
  const foods = guide.places.filter(isFoodPlace);
  const spots = guide.places.filter(isSpotPlace);
  const f1 = pickRotating(foods, dayIndex, 0);
  const s1 = pickRotating(spots, dayIndex, 0);
  const f2 = pickRotating(foods, dayIndex, 1);
  const s2 = pickRotating(spots, dayIndex, 1);
  const picks = [f1, s1, f2, s2];
  return {
    title: `Day ${dayIndex + 1} 建議`,
    vibe: guide.label,
    zone: null,
    slots: SLOT_KINDS.map((kind, i) => {
      const p = picks[i];
      if (!p) return null;
      return slot(kind, SLOT_TIMES[i], p.name, p.detail, p.area, p.maps);
    }).filter(Boolean),
  };
}

export function dayPlanForTrip(trip, dateId, dayIndex) {
  if (isBangkokTrip(trip) && BANGKOK_CURATED[dateId]) {
    return BANGKOK_CURATED[dateId];
  }
  return autoDayPlan(trip, dayIndex);
}

export function mapConfigForTrip(trip, activeZoneId) {
  if (isBangkokTrip(trip)) {
    const zone = BANGKOK_MAP.zones.find((z) => z.id === activeZoneId);
    if (zone) {
      return {
        query: `${zone.label} Bangkok`,
        lat: zone.lat,
        lng: zone.lng,
        zoom: 14,
        zones: BANGKOK_MAP.zones,
      };
    }
    return { ...BANGKOK_MAP.center, query: "Bangkok Thailand", zones: BANGKOK_MAP.zones };
  }
  const label = `${trip?.city || ""} ${trip?.country || ""}`.trim() || "city center";
  return { query: label, lat: null, lng: null, zoom: 12, zones: [] };
}

export function buildTripDayList(trip) {
  if (!trip?.startDate) return [];
  const start = new Date(trip.startDate);
  const total = tripDays(trip);
  const days = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const id = toDateId(d);
    days.push({
      id,
      index: i + 1,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY_LABELS[d.getDay()]}）`,
    });
  }
  return days;
}

export function slotsToItineraryItems(slots) {
  return slots.map((s) => ({
    id: `it-${s.time}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    time: s.time,
    text: `${s.kind === "food" ? "🍜" : "📍"} ${s.title}`,
    note: s.detail,
    area: s.area,
    maps: s.maps,
    kind: s.kind,
  }));
}

export function mapsEmbedUrl({ query, lat, lng, zoom = 13 }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
}

export function mapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
