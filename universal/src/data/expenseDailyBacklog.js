/**
 * 開支儀表板每日自動優化 backlog。
 * GitHub Actions / Vercel Cron 會依序啟用尚未開啟的功能。
 *
 * 無限期：無終止日、無「完結日」。已上線 id 順序與內容勿改；只可在末尾追加。
 * 全部啟用後會自動進入輪播，每日仍更新公告同 history，永不停止。
 */

/** @typedef {'convenience' | 'analysis' | 'stickiness'} ExpenseOptPillar */

/**
 * @typedef {{ id: string, title: string, description: string, pillar: ExpenseOptPillar }} ExpenseDailyFeature
 */

/** @type {ExpenseDailyFeature[]} */
export const EXPENSE_DAILY_BACKLOG = [
  {
    id: "daily-opt-banner",
    title: "每日優化公告",
    description: "開支儀表板頂部顯示今日自動啟用的優化說明，方便追蹤成長。",
    pillar: "stickiness",
  },
  {
    id: "today-vs-yesterday",
    title: "今日 vs 昨日使費",
    description: "一眼對比今日與昨日支出，即時察覺消費節奏。",
    pillar: "analysis",
  },
  {
    id: "logging-streak",
    title: "記帳連續日數",
    description: "顯示連續有記帳嘅日數，養成每日記帳習慣。",
    pillar: "stickiness",
  },
  {
    id: "biggest-expense",
    title: "單筆最高消費",
    description: "突出本旅程最大一筆開支，方便回顧大手消費。",
    pillar: "analysis",
  },
  {
    id: "seven-day-sparkline",
    title: "近 7 日趨勢",
    description: "迷你折線圖顯示最近一星期每日使費走勢。",
    pillar: "analysis",
  },
  {
    id: "category-ranking",
    title: "分類排行榜",
    description: "按金額列出 Top 分類，快速搵到最大使費類別。",
    pillar: "analysis",
  },
  {
    id: "category-filter",
    title: "分類快速篩選",
    description: "支出列表可按分類過濾，翻舊帳更快。",
    pillar: "convenience",
  },
  {
    id: "week-over-week",
    title: "本週 vs 上週",
    description: "對比本週同上一週總支出，睇消費有冇升溫。",
    pillar: "analysis",
  },
  {
    id: "quick-amount-chips",
    title: "快速金額按鈕",
    description: "新增開支時一撳常用金額，少打字。",
    pillar: "convenience",
  },
  {
    id: "expense-search",
    title: "備註搜尋",
    description: "用關鍵字搜尋備註，即刻搵到特定消費。",
    pillar: "convenience",
  },
  {
    id: "pace-vs-ideal",
    title: "理想日均對比",
    description: "實際日均 vs 預算理想日均，清楚知超前定落後。",
    pillar: "analysis",
  },
  {
    id: "top-spender-day",
    title: "爆煲日提示",
    description: "標出使費最高嘅日子，避免重蹈覆轍。",
    pillar: "analysis",
  },
  {
    id: "export-csv",
    title: "匯出 CSV",
    description: "一鍵匯出本旅程開支清單，方便試算表分析。",
    pillar: "convenience",
  },
  {
    id: "note-templates",
    title: "備註快捷模板",
    description: "午餐／交通／咖啡等常見備註一撳填入。",
    pillar: "convenience",
  },
  {
    id: "duplicate-last",
    title: "複製上一筆",
    description: "重複消費一撳複製上一筆再微調，極速記帳。",
    pillar: "convenience",
  },
  {
    id: "pinned-budget-alert",
    title: "預算警戒條",
    description: "用咗超過 80% 預算時顯示醒目提示。",
    pillar: "stickiness",
  },
  {
    id: "hkd-list-toggle",
    title: "列表幣種切換",
    description: "支出列表可切換顯示當地幣或港幣。",
    pillar: "convenience",
  },
  {
    id: "category-pct-labels",
    title: "分類百分比標籤",
    description: "分類排行旁顯示佔總支出百分比。",
    pillar: "analysis",
  },
  {
    id: "empty-state-tips",
    title: "空狀態引導",
    description: "未記帳時顯示實用提示，降低第一筆門檻。",
    pillar: "stickiness",
  },
  {
    id: "remaining-days-chip",
    title: "剩餘日數徽章",
    description: "標題旁顯示旅程剩餘日數，強化時間感。",
    pillar: "stickiness",
  },
  {
    id: "avg-per-category",
    title: "分類日均",
    description: "各分類平均每日使費，方便計劃餘下日子。",
    pillar: "analysis",
  },
  {
    id: "fx-rate-impact",
    title: "匯率影響說明",
    description: "對比記帳鎖定港幣同而家匯率重算嘅差額，了解匯率波動點影響總使費。",
    pillar: "stickiness",
  },
  {
    id: "today-budget-gauge",
    title: "今日預算儀表",
    description: "概覽頁一眼睇今日已使同每日可用額，色階提示仲剩幾多，出門前心里有數。",
    pillar: "convenience",
  },
  {
    id: "budget-runway-days",
    title: "預算可用天數",
    description: "照而家使費速度，預算仲夠用幾多日；同旅程剩餘日數對比，一眼知要唔要收油。",
    pillar: "stickiness",
  },
  {
    id: "spending-vs-timeline",
    title: "行程進度對齊",
    description: "對比「旅程已過幾多%」同「預算已用幾多%」，一眼知使費超前定落後行程。",
    pillar: "analysis",
  },
  {
    id: "budget-health-badge",
    title: "預算健康徽章",
    description: "儀表板標題旁常駐色階徽章，任何分頁都睇到預算狀態，撳一下跳概覽。",
    pillar: "stickiness",
  },
  {
    id: "expense-list-sort",
    title: "列表排序切換",
    description: "支出清單可按最新、最舊或金額高低排序，長清單搵大額消費更快。",
    pillar: "convenience",
  },
  {
    id: "recent-3day-pace",
    title: "近 3 日使費節奏",
    description: "對比近 3 日日均同全程日均，及早察覺消費升溫或收油。",
    pillar: "analysis",
  },
  {
    id: "under-budget-streak",
    title: "預算內連續日數",
    description: "顯示連續幾日使費喺當日可用額之內，養成收油習慣同成就感。",
    pillar: "stickiness",
  },
  {
    id: "today-category-chips",
    title: "今日分類快篩",
    description: "記帳頁顯示今日各分類使費晶片，一撳即篩選該類支出，出街對帳更快。",
    pillar: "convenience",
  },
  {
    id: "ledger-daily-pulse",
    title: "記帳頁每日脈搏",
    description: "記帳頁頂部顯示今日 vs 昨日使費對比同記帳 streak，記帳時即刻掌握消費節奏。",
    pillar: "analysis",
  },
  {
    id: "seven-day-logging-dots",
    title: "近 7 日記帳圓點",
    description: "七粒圓點顯示最近一週邊幾日有記帳，一眼睇記帳密度，唔使只靠連續 streak。",
    pillar: "stickiness",
  },
  {
    id: "today-entry-pace",
    title: "今日記帳節奏",
    description: "對比今日記帳筆數同旅程日均，兼顯示平均每筆使費，分辨細碎消費日同大單日。",
    pillar: "convenience",
  },
  {
    id: "today-vs-median-day",
    title: "今日 vs 旅程中位日",
    description: "將今日使費同旅程「典型一日」（中位日）對比，一眼知今日偏高定偏低，唔使只靠感覺。",
    pillar: "analysis",
  },
  {
    id: "today-pace-projection",
    title: "今日節奏延續預估",
    description: "假設餘下旅程每日都跟今日使費，預估總支出同距離預算仲有几遠，購物前心里有底。",
    pillar: "stickiness",
  },
  {
    id: "today-biggest-entry",
    title: "今日最大單筆",
    description: "記帳頁突出今日最高一筆消費，顯示分類、備註同佔今日比例，大額支出一眼識別。",
    pillar: "convenience",
  },
  {
    id: "today-vs-seven-day-avg",
    title: "今日 vs 近 7 日平均",
    description: "將今日使費同過去 7 日（不含今日）日均對比，附迷你走勢，快速知今日係咪異常消費日。",
    pillar: "analysis",
  },
  {
    id: "remaining-budget-countdown",
    title: "剩餘預算倒數",
    description: "記帳頁顯示剩餘預算百分比、依而家節奏可撐幾日，同旅程剩餘日對比，出門消費前心里有數。",
    pillar: "convenience",
  },
  {
    id: "trip-half-pace-compare",
    title: "前半 vs 後半日均",
    description: "將已過旅程拆成前半同後半，對比兩段日均使費，及早發現越玩越豪定越玩越慳。",
    pillar: "analysis",
  },
  {
    id: "logging-gap-hint",
    title: "漏記帳日提示",
    description: "列出旅程已過但未記帳嘅日子，一撳即揀日期補記，唔使漏計開支。",
    pillar: "convenience",
  },
  {
    id: "weekend-weekday-compare",
    title: "週末 vs 平日日均",
    description: "對比週末同平日每日平均使費，搵到市集、活動日同返工日嘅消費節奏差異。",
    pillar: "analysis",
  },
  {
    id: "today-payment-chips",
    title: "今日付款方式快篩",
    description: "記帳頁顯示今日現金／信用卡使費晶片，一撳即篩選該付款方式，對帳同補記更快。",
    pillar: "convenience",
  },
  {
    id: "today-category-shift",
    title: "今日分類變化",
    description: "對比今日同昨日各分類使費，標出升溫或收油最大嘅類別，唔使逐類心算。",
    pillar: "analysis",
  },
];
