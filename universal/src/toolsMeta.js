/** Currency → local travel metadata for the toolkit (coins, tax, timezone, emergency, phrases). */
export const TOOL_META = {
  JPY: {
    lang: "ja",
    tzOffset: 1,
    taxRate: 10,
    taxThreshold: 5000,
    coins: "¥1 · ¥5 · ¥10 · ¥50 · ¥100 · ¥500",
    coinTip: "¥5 同 ¥50 有窿；神社香油錢好意頭用 ¥5（ご縁）。",
    emergency: [
      { label: "報警", value: "110" },
      { label: "救護／火警", value: "119" },
      { label: "遊客熱線", value: "050-3816-2787（JNTO）" },
    ],
  },
  TWD: {
    lang: "zh",
    tzOffset: 0,
    taxRate: 5,
    taxThreshold: 2000,
    coins: "NT$1 · NT$5 · NT$10 · NT$50",
    coinTip: "NT$50 最大面額；捷運／便利店碌悠遊卡最方便。",
    emergency: [
      { label: "報警", value: "110" },
      { label: "救護／火警", value: "119" },
      { label: "旅遊諮詢", value: "0800-011765" },
    ],
  },
  THB: {
    lang: "th",
    tzOffset: -1,
    taxRate: 7,
    taxThreshold: 2000,
    coins: "฿1 · ฿2 · ฿5 · ฿10",
    coinTip: "฿10 係雙色大硬幣；BTS 入閘用 Rabbit 卡最順。",
    emergency: [
      { label: "報警", value: "191" },
      { label: "救護", value: "1669" },
      { label: "旅遊警察", value: "1155" },
    ],
  },
  KRW: {
    lang: "ko",
    tzOffset: 1,
    taxRate: 10,
    taxThreshold: 30000,
    coins: "₩10 · ₩50 · ₩100 · ₩500",
    coinTip: "₩500 係最大硬幣；T-Money 卡地鐵便利店通用。",
    emergency: [
      { label: "報警", value: "112" },
      { label: "救護／火警", value: "119" },
      { label: "旅遊熱線", value: "1330" },
    ],
  },
  EUR: {
    lang: "en",
    tzOffset: -7,
    taxRate: 20,
    taxThreshold: 100,
    coins: "1c · 2c · 5c · 10c · 20c · 50c · €1 · €2",
    coinTip: "歐元區各國退稅門檻不同；€1/€2 硬幣當紙幣咁使。",
    emergency: [
      { label: "歐洲通用緊急", value: "112" },
      { label: "旅遊保險 hotline", value: "（請填寫）" },
    ],
  },
  GBP: {
    lang: "en",
    tzOffset: -8,
    taxRate: 20,
    taxThreshold: 0,
    coins: "1p · 2p · 5p · 10p · 20p · 50p · £1 · £2",
    coinTip: "£1 係 12 邊形硬幣； contactless 付款極普及。",
    emergency: [
      { label: "緊急", value: "999 / 112" },
      { label: "非緊急醫療", value: "111" },
    ],
  },
  USD: {
    lang: "en",
    tzOffset: -13,
    taxRate: 0,
    taxThreshold: 0,
    coins: "1¢ · 5¢ · 10¢ · 25¢",
    coinTip: "25¢（quarter）最常用；標價多數未連稅。",
    emergency: [{ label: "緊急", value: "911" }],
  },
  SGD: {
    lang: "en",
    tzOffset: 0,
    taxRate: 9,
    taxThreshold: 100,
    coins: "5¢ · 10¢ · 20¢ · 50¢ · S$1",
    coinTip: "EZ-Link 卡地鐵巴士通用。",
    emergency: [
      { label: "報警", value: "999" },
      { label: "救護／火警", value: "995" },
    ],
  },
  AUD: {
    lang: "en",
    tzOffset: 2,
    taxRate: 10,
    taxThreshold: 300,
    coins: "5¢ · 10¢ · 20¢ · 50¢ · A$1 · A$2",
    coinTip: "TRS 退稅：同一商戶滿 A$300，離境前 60 日內。",
    emergency: [{ label: "緊急", value: "000" }],
  },
  CNY: {
    lang: "zh-cn",
    tzOffset: 0,
    taxRate: 11,
    taxThreshold: 500,
    coins: "1角 · 5角 · ¥1",
    coinTip: "流動支付為主；現金硬幣較少用。",
    emergency: [
      { label: "報警", value: "110" },
      { label: "救護", value: "120" },
    ],
  },
  VND: {
    lang: "en",
    tzOffset: -1,
    taxRate: 8,
    taxThreshold: 2000000,
    coins: "以紙幣為主（₫1,000 起）",
    coinTip: "面額好多個零，俾錢前數清楚。",
    emergency: [
      { label: "報警", value: "113" },
      { label: "救護", value: "115" },
    ],
  },
};

export function toolMeta(currency) {
  return (
    TOOL_META[currency] || {
      lang: "en",
      tzOffset: 0,
      taxRate: 0,
      taxThreshold: 0,
      coins: "（此幣種暫無預設資料）",
      coinTip: "",
      emergency: [{ label: "緊急", value: "112（國際通用）" }],
    }
  );
}

export const PHRASES = {
  ja: [
    { zh: "唔該／不好意思", local: "すみません", roman: "sumimasen" },
    { zh: "我要呢個", local: "これをください", roman: "kore wo kudasai" },
    { zh: "埋單唔該", local: "お会計お願いします", roman: "okaikei onegaishimasu" },
    { zh: "有冇 Wi-Fi？", local: "Wi-Fiありますか", roman: "wifi arimasu ka" },
    { zh: "可唔可以用插座？", local: "コンセント使えますか", roman: "konsento tsukaemasu ka" },
    { zh: "可唔可以影相？", local: "写真いいですか", roman: "shashin ii desu ka" },
  ],
  th: [
    { zh: "多謝", local: "ขอบคุณครับ/ค่ะ", roman: "khop khun khrap/kha" },
    { zh: "幾多錢？", local: "เท่าไหร่", roman: "thao rai" },
    { zh: "平啲得唔得？", local: "ลดได้ไหม", roman: "lot dai mai" },
    { zh: "唔辣", local: "ไม่เผ็ด", roman: "mai phet" },
    { zh: "埋單", local: "เช็คบิล", roman: "check bin" },
    { zh: "好味！", local: "อร่อยมาก", roman: "aroi mak" },
  ],
  ko: [
    { zh: "多謝", local: "감사합니다", roman: "gamsahamnida" },
    { zh: "幾多錢？", local: "얼마예요", roman: "eolmayeyo" },
    { zh: "埋單", local: "계산해 주세요", roman: "gyesanhae juseyo" },
    { zh: "平啲得唔得？", local: "깎아주세요", roman: "kkakkajuseyo" },
    { zh: "有冇 Wi-Fi？", local: "와이파이 있어요?", roman: "waipai isseoyo" },
    { zh: "唔辣", local: "맵지 않게 해주세요", roman: "maepji anke haejuseyo" },
  ],
  zh: [
    { zh: "多謝", local: "謝謝", roman: "xièxie" },
    { zh: "幾多錢？", local: "多少錢？", roman: "duōshǎo qián" },
    { zh: "平啲得唔得？", local: "可以便宜一點嗎？", roman: "kěyǐ piányí yīdiǎn ma" },
    { zh: "埋單", local: "買單", roman: "mǎidān" },
    { zh: "有冇 Wi-Fi？", local: "有 Wi-Fi 嗎？", roman: "yǒu Wi-Fi ma" },
    { zh: "唔辣", local: "不要辣", roman: "bú yào là" },
  ],
  "zh-cn": [
    { zh: "多謝", local: "谢谢", roman: "xièxie" },
    { zh: "幾多錢？", local: "多少钱？", roman: "duōshǎo qián" },
    { zh: "平啲得唔得？", local: "可以便宜一点吗？", roman: "kěyǐ piányí yīdiǎn ma" },
    { zh: "埋單", local: "买单", roman: "mǎidān" },
    { zh: "有冇 Wi-Fi？", local: "有 Wi-Fi 吗？", roman: "yǒu Wi-Fi ma" },
    { zh: "唔辣", local: "不要辣", roman: "bù yào là" },
  ],
  en: [
    { zh: "唔該／不好意思", local: "Excuse me", roman: "" },
    { zh: "幾多錢？", local: "How much is this?", roman: "" },
    { zh: "埋單唔該", local: "Check, please", roman: "" },
    { zh: "有冇 Wi-Fi？", local: "Do you have Wi-Fi?", roman: "" },
    { zh: "唔该借個插座", local: "May I use the power outlet?", roman: "" },
    { zh: "可唔可以影相？", local: "May I take a photo?", roman: "" },
  ],
};

export const PHOTO_QUESTS = ["地標", "街景", "美食", "Cafe", "夜景", "交通工具", "紀念品", "當地人日常", "自拍"];
