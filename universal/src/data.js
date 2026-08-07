export const BASE_CURRENCY = "HKD";
export const RATE_TTL_MS = 24 * 60 * 60 * 1000;

export const CURRENCIES = [
  { code: "HKD", symbol: "HK$", name: "港幣" },
  { code: "TWD", symbol: "NT$", name: "新台幣" },
  { code: "JPY", symbol: "¥", name: "日圓" },
  { code: "KRW", symbol: "₩", name: "韓圜" },
  { code: "THB", symbol: "฿", name: "泰銖" },
  { code: "EUR", symbol: "€", name: "歐元" },
  { code: "GBP", symbol: "£", name: "英鎊" },
  { code: "USD", symbol: "$", name: "美元" },
  { code: "SGD", symbol: "S$", name: "新加坡元" },
  { code: "AUD", symbol: "A$", name: "澳元" },
  { code: "CNY", symbol: "¥", name: "人民幣" },
  { code: "VND", symbol: "₫", name: "越南盾" },
];

export function currencyInfo(code) {
  return CURRENCIES.find((c) => c.code === code) || { code, symbol: `${code} `, name: code };
}

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "餐飲", color: "#f97316" },
  { id: "cafe", label: "Cafe", color: "#0d9488" },
  { id: "shopping", label: "購物", color: "#a855f7" },
  { id: "transport", label: "交通", color: "#0ea5e9" },
  { id: "attractions", label: "景點／娛樂", color: "#f43f5e" },
  { id: "hotel", label: "住宿", color: "#f59e0b" },
  { id: "other", label: "其他", color: "#64748b" },
];

export const DEFAULT_BADGES = [
  { id: "outlets", label: "有插座" },
  { id: "quiet", label: "安靜" },
  { id: "again", label: "必回訪" },
  { id: "view", label: "景觀好" },
  { id: "value", label: "高CP值" },
];

export const INDOOR_TAGS = ["商場", "Cafe", "購物", "美食", "生活", "景點", "餐飲"];

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const WEATHER_POOL = [
  { label: "多雲", icon: "⛅", hi: 30, lo: 22, rain: 30 },
  { label: "午後雷陣雨", icon: "⛈️", hi: 32, lo: 24, rain: 70 },
  { label: "晴朗炎熱", icon: "☀️", hi: 35, lo: 26, rain: 10 },
  { label: "局部驟雨", icon: "🌦️", hi: 31, lo: 23, rain: 50 },
  { label: "陰天微雨", icon: "🌧️", hi: 27, lo: 20, rain: 85 },
];

export function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function tripDays(trip) {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diff = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return diff;
}

export function todayIndex(trip) {
  if (!trip) return 0;
  const start = new Date(trip.startDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today - start) / 86400000);
  const days = tripDays(trip);
  if (diff < 0) return 0;
  if (diff > days - 1) return days - 1;
  return diff;
}

export function weatherForDay(trip, index) {
  const h = hashStr(`${trip?.id || "trip"}-${index}`);
  const w = WEATHER_POOL[h % WEATHER_POOL.length];
  return {
    label: w.label,
    icon: w.icon,
    temp: `${w.lo + (h % 2)}–${w.hi}°C`,
    rain: `${w.rain}%`,
    rainy: w.rain >= 50,
    heatwave: w.hi >= 33,
  };
}

export function formatMoney(amount, code) {
  const info = currencyInfo(code);
  const value = Number(amount) || 0;
  const isInt = ["JPY", "KRW", "VND", "TWD", "THB"].includes(code);
  const formatted = isInt
    ? Math.round(value).toLocaleString()
    : value.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${info.symbol} ${formatted}`;
}

export function formatHkd(n) {
  return `HK$ ${(Number(n) || 0).toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function toDateId(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
