/**
 * 行程建議：食 → 景點 → 食 → 景點 交替節奏
 * 大阪（堺筋本町基地）8/30–9/10 有精選日程；曼谷同其他城市另有模板。
 */

import { guideForTrip } from "../placesMeta";
import { toDateId, tripDays, WEEKDAY_LABELS } from "../data";

const FOOD_TAGS = new Set(["美食", "Cafe"]);
const SPOT_TAGS = new Set(["景點", "購物", "玩樂", "室內", "戶外", "市集", "河岸", "商場", "景觀", "公園"]);

const SLOT_TIMES = ["10:30", "13:30", "17:00", "19:30"];
const SLOT_KINDS = ["food", "spot", "food", "spot"];

export const OSAKA_MAP = {
  center: { lat: 34.6819, lng: 135.5068, zoom: 13, query: "堺筋本町駅 大阪" },
  zones: [
    { id: "hommachi", label: "堺筋本町", lat: 34.6819, lng: 135.5068, color: "#0d9488" },
    { id: "shinsaibashi", label: "心齋橋", lat: 34.6717, lng: 135.5012, color: "#0ea5e9" },
    { id: "dotonbori", label: "道頓堀", lat: 34.6686, lng: 135.5023, color: "#f59e0b" },
    { id: "namba", label: "難波", lat: 34.6636, lng: 135.5019, color: "#f97316" },
    { id: "kuromon", label: "黑門市場", lat: 34.6654, lng: 135.5062, color: "#ec4899" },
    { id: "castle", label: "大阪城", lat: 34.6873, lng: 135.5262, color: "#8b5cf6" },
    { id: "umeda", label: "梅田", lat: 34.7024, lng: 135.4959, color: "#14b8a6" },
    { id: "tennoji", label: "天王寺", lat: 34.6462, lng: 135.5133, color: "#6366f1" },
    { id: "nakanoshima", label: "中之島", lat: 34.6924, lng: 135.501, color: "#84cc16" },
    { id: "nara", label: "奈良", lat: 34.6851, lng: 135.8048, color: "#22c55e" },
  ],
};

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

/** 大阪堺筋本町基地 · 8/30–9/10（食→景→食→景） */
const OSAKA_CURATED = {
  "2026-08-30": {
    title: "香港出發 → 大阪安頓",
    vibe: "凌晨出門 · 關西機場 · 堺筋本町 check-in · 心齋橋 LUUP",
    zone: "hommachi",
    slots: [
      slot("spot", "04:30", "NA52 → 機場 T2", "凌晨起床出門，搭 NA52 巴士去機場 Terminal 2", "香港", "Hong Kong Airport Terminal 2"),
      slot("food", "05:30", "N記熱香餅", "完成登機登記後食早餐", "香港機場", "restaurants Hong Kong Airport Terminal 2"),
      slot("spot", "08:15", "起飛香港", "前往大阪；過關後喺 200 幾號閘口一帶等機", "空中", "Kansai Airport Osaka"),
      slot("spot", "13:15", "抵達關西機場", "早到約一小時；南海電鐵入市", "關西機場", "Kansai Airport Nankai Railway"),
      slot("spot", "15:00", "酒店 check-in", "難波→日本橋→堺筋本町 12 號出口 · Daiwa Roynet Premier · 1011 房", "堺筋本町", "Daiwa Roynet Hotel Premier Sakaisuji-Hommachi"),
      slot("spot", "16:00", "心齋橋＋LUUP", "行心齋橋由頭到中、租 LUUP 滑板／電動單車踩", "心齋橋", "Shinsaibashi Osaka LUUP"),
      slot("food", "19:30", "Sukiya 牛肉飯", "返酒店附近收工食一餐", "堺筋本町", "Sukiya Sakaisuji-Hommachi Osaka"),
    ],
  },
  "2026-08-31": {
    title: "心齋橋慢活 → 難波",
    vibe: "訓晏 · 珈琲館 · LUUP · 麥當勞 · 固力果 · 蛋包飯 · 驚險滑板返",
    zone: "shinsaibashi",
    slots: [
      slot("food", "14:00", "樓下珈琲館", "訓到好晏，兩點先落樓食", "堺筋本町", "珈琲館 Sakaisuji-Hommachi Osaka"),
      slot("spot", "14:45", "心齋橋＋LUUP", "踩單車／滑板落心齋橋行街", "心齋橋", "Shinsaibashi Osaka LUUP"),
      slot("food", "16:00", "麥當勞特飲", "薄荷朱古力飲品＋迷你熱香餅", "心齋橋", "McDonalds Shinsaibashi Osaka"),
      slot("spot", "18:30", "固力果招牌", "行到難波／道頓堀睇大 poster", "道頓堀", "Glico sign Dotonbori Osaka"),
      slot("food", "19:30", "南海難波商場", "食蛋包飯", "難波", "Nankai Namba Station restaurants Osaka"),
      slot("spot", "20:30", "滑板車返酒店", "難波渣滑板車返，過程十分驚險", "堺筋本町", "LUUP scooter Namba to Hommachi Osaka"),
    ],
  },
  "2026-09-01": {
    title: "心齋橋商店街日",
    vibe: "PARCO／大丸牛扒 · 星乃 · 雜貨鋪 · 珈琲館咖啡豆",
    zone: "shinsaibashi",
    slots: [
      slot("spot", "11:00", "心齋橋 · PARCO／大丸", "商店街行街", "心齋橋", "PARCO Daimaru Shinsaibashi Osaka"),
      slot("food", "12:30", "上樓牛扒", "約港紙 $130／位，中低價高質幾抵", "心齋橋", "steak restaurant Shinsaibashi PARCO Osaka"),
      slot("food", "14:00", "星乃咖啡", "soufflé 難食，咖啡好飲", "心齋橋", "Hoshino Coffee Shinsaibashi Osaka"),
      slot("spot", "15:30", "幾層雜貨鋪", "下層文具，上面包裝袋／招紙", "心齋橋", "zakka stationery packaging Shinsaibashi Osaka"),
      slot("food", "18:30", "樓下珈琲館", "返酒店望咗下，想買咖啡豆", "堺筋本町", "珈琲館 Sakaisuji-Hommachi Osaka"),
    ],
  },
  "2026-09-02": {
    title: "近鐵奈良日",
    vibe: "小雨睇鹿 · Daiso 襪 · 壽司肚痛謎 · Seattle Cafe · 毛巾",
    zone: "nara",
    slots: [
      slot("food", "09:30", "樓下珈琲館早餐", "九點半起身後落樓食", "堺筋本町", "珈琲館 Sakaisuji-Hommachi Osaka"),
      slot("spot", "10:30", "日本橋 → 近鐵奈良", "轉近鐵出發", "日本橋", "Kintetsu Nara from Nipponbashi"),
      slot("spot", "12:00", "小雨睇鹿", "奈良公園行陣", "奈良", "Nara Park deer"),
      slot("spot", "13:00", "微型商店街 Daiso", "買咗幾對襪", "奈良", "Daiso Nara shopping street"),
      slot("food", "14:30", "壽司店", "壽司超好味、烏冬都好；之後有人肚痛唔認", "奈良", "sushi udon Nara shopping street"),
      slot("food", "16:30", "Seattle Best Cafe", "飲嘢唔錯", "奈良", "Seattle Best Coffee Nara"),
      slot("spot", "17:30", "站前特色毛巾", "¥600 幾買咗一條", "奈良", "Nara souvenir towel station"),
    ],
  },
  "2026-09-03": {
    title: "新世界",
    vibe: "通天閣＋串炸",
    zone: "tennoji",
    slots: [
      slot("food", "10:30", "本町 Cafe", "上午輕鬆出發", "堺筋本町", "cafes Sakaisuji-Hommachi Osaka"),
      slot("spot", "13:30", "通天閣＋新世界", "昭和復古街區打卡", "新世界", "Tsutenkaku Osaka"),
      slot("food", "17:00", "新世界串炸", "炸物放題或名店", "新世界", "kushikatsu Shinsekai Osaka"),
      slot("spot", "19:30", "天王寺／阿倍野", "傍晚行 Q's Mall 或公園", "天王寺", "Tennoji Osaka"),
    ],
  },
  "2026-09-04": {
    title: "美國村＋心齋橋",
    vibe: "潮牌同古著",
    zone: "shinsaibashi",
    slots: [
      slot("food", "10:30", "心齋橋 Brunch", "三角公園附近 Cafe", "美國村", "cafes Amerikamura Osaka"),
      slot("spot", "13:30", "美國村", "古著潮牌同街頭文化", "美國村", "Amerikamura Osaka"),
      slot("food", "17:00", "心齋橋晚餐", "燒肉或居酒屋", "心齋橋", "restaurants Shinsaibashi Osaka"),
      slot("spot", "19:30", "御堂筋夜景", "由心齋橋行返本町", "御堂筋", "Midosuji Avenue Osaka"),
    ],
  },
  "2026-09-05": {
    title: "海遊館日",
    vibe: "大阪港遠征",
    zone: "tennoji",
    slots: [
      slot("food", "10:30", "堺筋本町出發前", "輕食後搭地鐵去港區", "堺筋本町", "cafes near Hommachi Osaka"),
      slot("spot", "13:30", "海遊館", "鯨鯊同企鵝，室內逛半日", "大阪港", "Osaka Aquarium Kaiyukan"),
      slot("food", "17:00", "天保山 Marketplace", "港區商場食晚餐", "天保山", "Tempozan Marketplace Osaka"),
      slot("spot", "19:30", "天保山大摩天輪", "透明車廂睇港灣夜景", "天保山", "Tempozan Ferris Wheel Osaka"),
    ],
  },
  "2026-09-06": {
    title: "基地慢活",
    vibe: "本町休息＋補給",
    zone: "hommachi",
    slots: [
      slot("food", "10:30", "本町咖啡", "久坐整理前幾日戰利品", "堺筋本町", "cafes Hommachi Osaka"),
      slot("spot", "13:30", "大阪生活今昔館", "江戶街道實景，落雨都 OK", "天神橋", "Osaka Museum of Housing and Living"),
      slot("food", "17:00", "黑門市場二訪", "補海鮮或手信食材", "黑門市場", "Kuromon Ichiba Market Osaka"),
      slot("spot", "19:30", "道頓堀輕鬆行", "未食過嘅小食再掃", "道頓堀", "Dotonbori Osaka"),
    ],
  },
  "2026-09-07": {
    title: "中之島",
    vibe: "河川＋文藝",
    zone: "nakanoshima",
    slots: [
      slot("food", "10:30", "中之島 Cafe", "河畔咖啡開場", "中之島", "cafes Nakanoshima Osaka"),
      slot("spot", "13:30", "中之島公園", "玫瑰園同河岸散步", "中之島", "Nakanoshima Park Osaka"),
      slot("food", "17:00", "北新地食街", "高質午餐／晚餐", "北新地", "Kitashinchi restaurants Osaka"),
      slot("spot", "19:30", "大阪市中央公會堂", "夜間建築同河畔影相", "中之島", "Osaka City Central Public Hall"),
    ],
  },
  "2026-09-08": {
    title: "阿倍野 Harukas",
    vibe: "天王寺商圈",
    zone: "tennoji",
    slots: [
      slot("food", "10:30", "堺筋本町出發", "天王寺方向", "堺筋本町", "breakfast Sakaisuji-Hommachi Osaka"),
      slot("spot", "13:30", "阿倍野 HARUKAS 300", "日本第二高樓展望台", "天王寺", "Abeno Harukas Osaka"),
      slot("food", "17:00", "天王寺 Mio 美食", "百貨內用餐", "天王寺", "Tennoji Mio Osaka"),
      slot("spot", "19:30", "四天王寺", "傍晚寺院周邊散步", "天王寺", "Shitennoji Temple Osaka"),
    ],
  },
  "2026-09-09": {
    title: "天王寺／動物園前商場日",
    vibe: "訓到十點 · 3COINS · Bic · NAMCO · 靚橋 · 耳機成交",
    zone: "tennoji",
    slots: [
      slot("spot", "11:00", "天王寺 → 動物園前", "行去動物園前站商場一帶", "天王寺", "Tennoji Station Osaka Dobutsuen-mae"),
      slot("spot", "12:00", "3COINS PLUS 先睇", "耳機 ¥2000 好抵，果陣未買", "動物園前", "3COINS PLUS Dobutsuen-mae Osaka"),
      slot("spot", "13:00", "Bic Camera", "睇 Pixel 10a 無買；睇到手信俾朋友", "天王寺", "Bic Camera Tennoji Osaka"),
      slot("spot", "15:00", "NAMCO 太鼓＋夾公仔", "另一間商場打機玩", "天王寺", "NAMCO Tennoji Osaka"),
      slot("spot", "16:30", "商場連接橋", "連接唔同商場，景色好靚", "天王寺", "Abeno Tennoji pedestrian bridge Osaka"),
      slot("spot", "17:30", "返 3COINS 買耳機", "最後買咗，真係好抵", "動物園前", "3COINS PLUS Dobutsuen-mae Osaka"),
    ],
  },
  "2026-09-10": {
    title: "告別大阪",
    vibe: "手信＋最後一轉",
    zone: "hommachi",
    slots: [
      slot("food", "10:30", "最愛 Cafe 回訪", "堺筋本町或心齋橋", "堺筋本町", "cafes Sakaisuji-Hommachi Osaka"),
      slot("spot", "13:30", "心齋橋最後掃貨", "伴手禮同藥妝", "心齋橋", "Shinsaibashi Osaka"),
      slot("food", "17:00", "最後一頓大阪燒", "道頓堀或難波", "道頓堀", "okonomiyaki Dotonbori Osaka"),
      slot("spot", "19:30", "返堺筋本町整理", "行李同戰利品收尾", "堺筋本町", "Sakaisuji-Hommachi Station Osaka"),
    ],
  },
};

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

function isOsakaTrip(trip) {
  const city = (trip?.city || "").toLowerCase();
  return city.includes("大阪") || city.includes("osaka") || city.includes("堺筋") || city.includes("本町");
}

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
  if (isOsakaTrip(trip) && OSAKA_CURATED[dateId]) {
    return OSAKA_CURATED[dateId];
  }
  if (isBangkokTrip(trip) && BANGKOK_CURATED[dateId]) {
    return BANGKOK_CURATED[dateId];
  }
  return autoDayPlan(trip, dayIndex);
}

export function mapConfigForTrip(trip, activeZoneId) {
  if (isOsakaTrip(trip)) {
    const zone = OSAKA_MAP.zones.find((z) => z.id === activeZoneId);
    if (zone) {
      return {
        query: `${zone.label} 大阪`,
        lat: zone.lat,
        lng: zone.lng,
        zoom: 14,
        zones: OSAKA_MAP.zones,
      };
    }
    return { ...OSAKA_MAP.center, zones: OSAKA_MAP.zones };
  }
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

const AREA_ZONE_HINTS = [
  ["堺筋本町", "hommachi"],
  ["本町", "hommachi"],
  ["心齋橋", "shinsaibashi"],
  ["道頓堀", "dotonbori"],
  ["難波", "namba"],
  ["黑門", "kuromon"],
  ["日本橋", "kuromon"],
  ["大阪城", "castle"],
  ["梅田", "umeda"],
  ["天王寺", "tennoji"],
  ["新世界", "tennoji"],
  ["中之島", "nakanoshima"],
  ["天保山", "tennoji"],
  ["環球", "hommachi"],
  ["奈良", "nara"],
  ["日本橋", "kuromon"],
  ["Phra Ram", "rama9"],
  ["Siam", "siam"],
  ["Chong Nonsi", "chong"],
];

function zoneIdForArea(area, fallbackZoneId, zones) {
  if (!area) return fallbackZoneId;
  const hit = AREA_ZONE_HINTS.find(([hint]) => area.includes(hint));
  if (hit && zones.some((z) => z.id === hit[1])) return hit[1];
  const direct = zones.find((z) => area.includes(z.label) || z.label.includes(area));
  return direct?.id || fallbackZoneId;
}

/** 將當日行程變成地圖標記（頁內顯示，唔使跳轉） */
export function markersForDayPlan(trip, dayPlan) {
  if (!dayPlan?.slots?.length) return [];
  const config = mapConfigForTrip(trip, dayPlan.zone);
  const zones = config.zones || [];
  const fallback = zones.find((z) => z.id === dayPlan.zone) || zones[0];
  const baseLat = config.lat ?? fallback?.lat ?? 34.6819;
  const baseLng = config.lng ?? fallback?.lng ?? 135.5068;

  return dayPlan.slots.map((s, i) => {
    const zoneId = zoneIdForArea(s.area, dayPlan.zone, zones);
    const zone = zones.find((z) => z.id === zoneId) || fallback;
    const lat = (zone?.lat ?? baseLat) + (i - 1.5) * 0.002;
    const lng = (zone?.lng ?? baseLng) + (i % 2 === 0 ? 0.0015 : -0.0015);
    return {
      id: `${s.time}-${s.title}`,
      lat,
      lng,
      time: s.time,
      title: s.title,
      detail: s.detail,
      area: s.area,
      kind: s.kind,
      color: s.kind === "food" ? "#f97316" : "#0d9488",
    };
  });
}
