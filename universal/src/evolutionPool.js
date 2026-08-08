/**
 * Daily Micro-Evolution pool — 18 generic-but-flavored travel upgrades.
 * Each idea ships with a ready-to-paste Cursor prompt.
 */
export const EVOLUTION_POOL = [
  {
    id: "coins",
    name: "外幣硬幣辨識速查卡",
    desc: "當地硬幣／紙幣面額圖鑑＋常見組合，找續唔再慌張。",
  },
  {
    id: "taxrefund",
    name: "退稅計算快捷鍵",
    desc: "輸入金額即時估算可退稅額＋門檻提示，Shopping 前必備。",
  },
  {
    id: "cafe-wheel",
    name: "今日隨機選 Cafe 轉盤",
    desc: "由已記錄嘅足跡／願望清單隨機抽一間，選擇困難救星。",
  },
  {
    id: "gacha-budget",
    name: "扭蛋式預算分配器",
    desc: "將今日剩餘預算隨機拆做「食／買／玩」三份，加啲隨機驚喜。",
  },
  {
    id: "phrase-card",
    name: "當地語言常用語速查卡",
    desc: "點餐／問路／講價必備句型，附羅馬拼音，離線可用。",
  },
  {
    id: "offline-map",
    name: "離線地圖下載提醒",
    desc: "出門前檢查：今日去嘅區域離線地圖下載咗未？",
  },
  {
    id: "steps",
    name: "每日步數目標追蹤",
    desc: "旅行日行兩萬步：記低目標同實際，回望成就感十足。",
  },
  {
    id: "souvenir",
    name: "手信清單＋預算分配",
    desc: "邊個送邊份、預算幾多、買咗未，一頁睇晒。",
  },
  {
    id: "transit-card",
    name: "交通卡餘額追蹤",
    desc: "記低交通卡每次增值同餘額，唔使去到閘口先發現唔夠錢。",
  },
  {
    id: "queue-log",
    name: "餐廳排隊時間記錄",
    desc: "記低熱門店實際等候時間，下次／朋友嚟就有數得計。",
  },
  {
    id: "fx-alert",
    name: "匯率波動提醒",
    desc: "當地幣兌港元升穿／跌穿自設門檻時提示，唱錢買嘢更精明。",
  },
  {
    id: "luggage",
    name: "行李重量估算器",
    desc: "按已買物品估算回程行李重量，避免超重罰款。",
  },
  {
    id: "wifi-notes",
    name: "免費 Wi-Fi 熱點筆記",
    desc: "記低商場／Cafe／車站嘅免費 Wi-Fi 名同密碼。",
  },
  {
    id: "diary",
    name: "每日三行回顧日記",
    desc: "每晚三行：最正一刻／最伏一刻／聽日最期待，旅行回憶即刻立體。",
  },
  {
    id: "photo-quest",
    name: "拍照打卡任務進度",
    desc: "預設 9 宮格打卡任務（地標／美食／街景），儲齊召喚回憶。",
  },
  {
    id: "timezone",
    name: "時差＋香港時間對照器",
    desc: "一眼睇到而家香港幾點，約人打電話／出 Story 都啱時間。",
  },
  {
    id: "emergency",
    name: "緊急聯絡卡",
    desc: "當地報警／救護／領事館／保險 hotline 一頁收藏，離線可睇。",
  },
  {
    id: "rainy-planb",
    name: "下雨天 Plan B 清單",
    desc: "預設落雨替代動線（室內商場／博物館／Cafe），落雨唔使諗。",
  },
  {
    id: "split-bill",
    name: "同行拆賬神器",
    desc: "記低邊個墊咗幾多錢，自動計出每人應找／應收同最少找數次數。",
  },
];

export function buildEvolutionPrompt(idea, appLabel, keyPrefix) {
  return `請在 trip-companion 的 ${appLabel} app 中實裝今日進化提案：「${idea.name}」。

功能說明：${idea.desc}

要求：
- 保持現有 localStorage key 穩定（${keyPrefix}*），不要清掉使用者資料
- UI 需與現有 mobile-first、Tailwind 風格一致
- 新功能資料請用獨立 key 儲存，並支援離線使用
- 完成後協助 build 並準備部署`;
}
