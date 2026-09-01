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
];
