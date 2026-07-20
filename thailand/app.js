(() => {
  "use strict";

  const STORAGE_KEYS = {
    expenses: "thailand-expenses",
    itinerary: "thailand-itinerary",
    checklist: "thailand-checklist",
    cafes: "thailand-cafe-log",
    rate: "thailand-fx-rate",
    budget: "thailand-budget",
    tab: "thailand-active-tab",
    week: "thailand-active-week",
    day: "thailand-active-day",
  };

  const LEGACY_KEYS = {
    expenses: [],
    itinerary: [],
    checklist: [],
    cafes: [],
    rate: [],
    budget: [],
    tab: [],
    week: [],
    day: [],
  };

  const DEFAULT_RATE = { hkdPerThb: 0.225, source: "manual", updatedAt: null };
  const DEFAULT_BUDGET_THB = 80000;
  const RATE_TTL_MS = 12 * 60 * 60 * 1000;
  const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
  const TRIP_START = new Date(2026, 7, 7);
  const TRIP_END = new Date(2026, 8, 6);
  const TRIP_DAYS = 31;

  const EXPENSE_CATEGORIES = [
    { id: "breakfast", label: "早餐", note: "早餐" },
    { id: "lunch", label: "午餐", note: "午餐" },
    { id: "dinner", label: "晚餐", note: "晚餐" },
    { id: "cafe", label: "Cafe", note: "Cafe" },
    { id: "shopping", label: "購物", note: "購物" },
    { id: "transport", label: "交通", note: "交通" },
    { id: "hotel", label: "住宿", note: "住宿" },
    { id: "other", label: "其他", note: "其他" },
  ];

  const CAFE_TAG_DEFS = [
    { id: "outlets", label: "有插座", badge: "badge-jade" },
    { id: "quiet", label: "安靜適合久坐", badge: "badge-sky" },
    { id: "coffee", label: "咖啡極正", badge: "badge-coral" },
    { id: "nolimit", label: "不限時", badge: "badge-amber" },
    { id: "cats", label: "有貓咪", badge: "badge-rose" },
    { id: "aesthetic", label: "景觀美／極致裝潢", badge: "badge-violet" },
    { id: "dessert", label: "甜點優秀", badge: "badge-pink" },
    { id: "value", label: "高CP值", badge: "badge-lime" },
  ];

  function mapsLink(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function item(time, title, detail, tag, zone, mapsQuery) {
    return { time, title, detail, tag, zone, mapsQuery };
  }

  const ITINERARY_VERSION = 2;

  const PLACES = [
    { id: "rama9-cafes", zone: "near", category: "Cafe", name: "Phra Ram 9 咖啡圈", detail: "Central Rama 9／G Tower 周邊精品咖啡與早午餐，適合落樓即坐。", transit: "MRT Phra Ram 9 步行", mapsQuery: "cafes near Phra Ram 9 MRT Bangkok" },
    { id: "chong-nonsi-cafes", zone: "near", category: "Cafe", name: "Chong Nonsi／Sathon 咖啡", detail: "Sathon 辦公區與巷弄咖啡多，適合久坐或會議後轉換心情。", transit: "BTS Chong Nonsi 步行", mapsQuery: "cafes near Chong Nonsi BTS Bangkok" },
    { id: "siam-cafes", zone: "near", category: "Cafe", name: "Siam 商場咖啡", detail: "Siam Paragon／Siam Center／Siam Square 冷氣咖啡集中，主力逛街日的補給站。", transit: "BTS Siam 直達", mapsQuery: "cafes Siam Paragon Bangkok" },
    { id: "central-rama9", zone: "near", category: "商場", name: "Central Rama 9", detail: "住家生活圈核心商場：超市、餐飲、日用品與冷氣避暑。", transit: "MRT Phra Ram 9 直連", mapsQuery: "Central Rama 9 Bangkok" },
    { id: "fortune-town", zone: "near", category: "商場", name: "Fortune Town", detail: "電子與配件好去處，補線材、轉插與小電器方便。", transit: "MRT Phra Ram 9 步行", mapsQuery: "Fortune Town Bangkok" },
    { id: "siam-paragon", zone: "near", category: "商場", name: "Siam Paragon", detail: "主力逛街點：精品、餐飲、超市與冷氣一整天都夠用。", transit: "BTS Siam 直連", mapsQuery: "Siam Paragon Bangkok" },
    { id: "siam-center", zone: "near", category: "商場", name: "Siam Center／Siam Discovery", detail: "設計感選品與潮牌較集中，適合慢慢比價。", transit: "BTS Siam 直連", mapsQuery: "Siam Center Bangkok" },
    { id: "centralworld", zone: "near", category: "商場", name: "CentralWorld", detail: "從 Siam 天空步道可走到，餐飲樓層與大型櫃位齊全。", transit: "BTS Siam／Chit Lom", mapsQuery: "CentralWorld Bangkok" },
    { id: "silom-complex", zone: "near", category: "商場", name: "Silom Complex", detail: "Chong Nonsi／Sala Daeng 生活圈商場，適合下班後補給。", transit: "BTS Sala Daeng／Chong Nonsi", mapsQuery: "Silom Complex Bangkok" },
    { id: "mahanakhon", zone: "near", category: "景觀", name: "Mahanakhon SkyWalk", detail: "Chong Nonsi 旁觀景台與商場（非宗教）；傍晚光線較舒適。", transit: "BTS Chong Nonsi 步行", mapsQuery: "King Power Mahanakhon Bangkok" },
    { id: "lumphini", zone: "near", category: "公園", name: "Lumphini Park", detail: "Silom／Sathon 旁城市綠地，傍晚散步避正午酷熱。", transit: "MRT Lumphini／Silom", mapsQuery: "Lumphini Park Bangkok" },
    { id: "chatuchak", zone: "expedition", category: "市集", name: "札都扎週末市集", detail: "週末限定大型市集；從住家圈需跨線移動，建議早到。", transit: "BTS Mo Chit／MRT", mapsQuery: "Chatuchak Weekend Market Bangkok" },
    { id: "iconsiam", zone: "expedition", category: "商場", name: "ICONSIAM", detail: "河岸大型商場與美食區；從 Chong Nonsi 可轉河船或叫車。", transit: "BTS＋河船／叫車", mapsQuery: "ICONSIAM Bangkok" },
    { id: "asiatique", zone: "expedition", category: "河岸", name: "Asiatique", detail: "河岸夜市與商場混合區，適合傍晚出發、晚上回住。", transit: "河船／叫車", mapsQuery: "Asiatique The Riverfront Bangkok" },
  ];

  function nearDay(title, vibe, cafe, cafeQuery, mall, mallQuery, home) {
    const dinner =
      home === "chong"
        ? item("19:00", "Chong Nonsi／Sathon 晚餐", "晚間回 Chong Nonsi 或 Silom／Sathon 一帶吃飯，保留體力給長住節奏。", "美食", "near", "restaurants near Chong Nonsi Bangkok")
        : item("19:00", "Phra Ram 9 晚餐／回住", "晚間回 Phra Ram 9 周邊吃飯，Central Rama 9 或巷弄餐廳都方便。", "美食", "near", "restaurants near Phra Ram 9 Bangkok");
    return {
      title,
      vibe,
      mode: "near",
      items: [
        item("10:30", cafe, "避開正午熱度，先喝咖啡、安排一段室內休息。", "Cafe", "near", cafeQuery),
        item("14:30", mall, "以 BTS／MRT 短程移動，在冷氣商場逛街、吃午餐或補日用品。", "商場", "near", mallQuery),
        dinner,
      ],
    };
  }

  /** Every day Aug 7 – Sep 6, 2026 — Bangkok only, no religious sites. */
  const SAMPLE_BY_DATE = {
    "2026-08-07": nearDay("抵達曼谷 · Phra Ram 9／Chong Nonsi", "安頓雙生活圈基地", "Phra Ram 9 巷弄早午餐", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-08-08": nearDay("Chong Nonsi 熟悉日", "BTS 落樓生活圈", "Chong Nonsi 精品咖啡", "cafes near Chong Nonsi Bangkok", "Silom Complex", "Silom Complex Bangkok", "chong"),
    "2026-08-09": nearDay("Siam 初訪 · Paragon", "主力商圈第一天", "Siam Paragon Cafe", "cafes Siam Paragon Bangkok", "Siam Paragon", "Siam Paragon Bangkok", "rama9"),
    "2026-08-10": nearDay("Siam Center／Discovery", "設計選品日", "Siam Center Cafe", "cafes Siam Center Bangkok", "Siam Center", "Siam Center Bangkok", "chong"),
    "2026-08-11": nearDay("Phra Ram 9 補給", "超市與電子", "G Tower／Rama 9 Cafe", "cafes G Tower Phra Ram 9 Bangkok", "Fortune Town", "Fortune Town Bangkok", "rama9"),
    "2026-08-12": nearDay("CentralWorld 連通逛", "Siam 天空步道", "CentralWorld Cafe", "cafes CentralWorld Bangkok", "CentralWorld", "CentralWorld Bangkok", "chong"),
    "2026-08-13": nearDay("Siam Square 慢逛", "戶外街舖＋冷氣穿梭", "Siam Square Cafe", "cafes Siam Square Bangkok", "Siam Paragon", "Siam Paragon Bangkok", "rama9"),
    "2026-08-14": {
      title: "遠一點 · Siam 終日商圈",
      vibe: "Paragon → Center → CentralWorld",
      mode: "expedition",
      items: [
        item("10:00", "往 Siam（BTS）", "從 Chong Nonsi 搭 Silom Line 直達 Siam；或從 Phra Ram 9 搭 MRT 轉 BTS。預留轉乘與人潮時間。", "交通", "expedition", "BTS Siam Station Bangkok"),
        item("11:00", "Siam Paragon 上午場", "先逛想買的樓層與超市，避開正午室外熱浪。", "商場", "expedition", "Siam Paragon Bangkok"),
        item("14:00", "Siam Center／Discovery", "午後轉設計選品與潮牌，穿梭冷氣連通。", "商場", "expedition", "Siam Center Bangkok"),
        item("17:00", "CentralWorld 餐飲樓", "天空步道走到 CentralWorld，早晚餐或休息再決定是否續逛。", "美食", "expedition", "CentralWorld Bangkok"),
        item("20:00", "回 Phra Ram 9／Chong Nonsi", "BTS／MRT 回住；晚餐也可留在 Siam 再走。", "交通", "expedition", "BTS Chong Nonsi Station Bangkok"),
      ],
    },
    "2026-08-15": nearDay("Siam 後恢復日", "住家圈冷氣＋按摩", "Phra Ram 9 Cafe", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-08-16": nearDay("Chong Nonsi · Mahanakhon", "觀景與 Sathon", "Chong Nonsi Cafe", "cafes near Chong Nonsi Bangkok", "King Power Mahanakhon", "King Power Mahanakhon Bangkok", "chong"),
    "2026-08-17": nearDay("Siam Paragon 二訪", "鎖定想買清單", "Paragon Cafe", "cafes Siam Paragon Bangkok", "Siam Paragon", "Siam Paragon Bangkok", "rama9"),
    "2026-08-18": nearDay("Phra Ram 9 工作日", "久坐與補給", "Rama 9 安靜 Cafe", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-08-19": nearDay("Silom／Sala Daeng", "Chong Nonsi 延伸", "Silom Cafe", "cafes Silom Bangkok", "Silom Complex", "Silom Complex Bangkok", "chong"),
    "2026-08-20": nearDay("ICONSIAM 前輕鬆日", "住家圈放慢", "Chong Nonsi Cafe", "cafes near Chong Nonsi Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-08-21": {
      title: "遠一點 · ICONSIAM 河岸商場",
      vibe: "河岸美食與大型商場",
      mode: "expedition",
      items: [
        item("11:30", "出發往 ICONSIAM", "從 Chong Nonsi 可往 Saphan Taksin 轉河船，或直接叫車；正午熱，優先室內路線。", "交通", "expedition", "ICONSIAM Bangkok"),
        item("13:00", "ICONSIAM 午餐＋逛", "美食區與各樓選品，不趕全館，鎖定 1–2 個目標區。", "商場", "expedition", "ICONSIAM Bangkok"),
        item("17:00", "河岸散步／拍照", "傍晚較涼再出室外；之後決定河船或叫車回住。", "河岸", "expedition", "ICONSIAM riverside Bangkok"),
        item("20:00", "回 Chong Nonsi／Phra Ram 9", "預留塞車時間；晚餐可在商場解決再走。", "交通", "expedition", "BTS Chong Nonsi Station Bangkok"),
      ],
    },
    "2026-08-22": nearDay("河岸後慢活", "按摩與住家商場", "Phra Ram 9 Cafe", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-08-23": nearDay("Siam Center 精選", "潮牌與設計", "Siam Center Cafe", "cafes Siam Center Bangkok", "Siam Discovery", "Siam Discovery Bangkok", "chong"),
    "2026-08-24": nearDay("Lumphini 傍晚散步", "白天室內、傍晚公園", "Silom Cafe", "cafes near Lumphini Park Bangkok", "Silom Complex", "Silom Complex Bangkok", "chong"),
    "2026-08-25": nearDay("Siam × CentralWorld", "連通商圈半日", "CentralWorld Cafe", "cafes CentralWorld Bangkok", "CentralWorld", "CentralWorld Bangkok", "rama9"),
    "2026-08-26": nearDay("Fortune Town 電子日", "線材與配件", "Phra Ram 9 Cafe", "cafes near Phra Ram 9 Bangkok", "Fortune Town", "Fortune Town Bangkok", "rama9"),
    "2026-08-27": nearDay("札都扎前準備", "早睡、帶現金與環保袋", "Chong Nonsi Cafe", "cafes near Chong Nonsi Bangkok", "Silom Complex", "Silom Complex Bangkok", "chong"),
    "2026-08-28": {
      title: "遠一點 · 札都扎週末市集",
      vibe: "早到避熱 · 分區逛",
      mode: "expedition",
      items: [
        item("08:00", "往 Mo Chit／Chatuchak", "從 Chong Nonsi 轉 Siam 再北上，或從 Phra Ram 9 搭 MRT 轉接；週末務必早到。", "交通", "expedition", "Chatuchak Weekend Market Bangkok"),
        item("09:00", "札都扎分區採買", "先逛想買的服飾、家飾與手作區；帶小鈔、飲水和環保袋。", "市集", "expedition", "Chatuchak Weekend Market Bangkok"),
        item("13:00", "JJ Mall／室內休息", "正午進冷氣商場或餐廳整理戰利品，再決定是否續逛。", "美食", "expedition", "JJ Mall Bangkok"),
        item("16:00", "回住家圈", "熱度下降前離開，回 Phra Ram 9 或 Chong Nonsi 補水休息。", "交通", "expedition", "MRT Phra Ram 9 Station Bangkok"),
      ],
    },
    "2026-08-29": nearDay("市集後整理日", "住家商場休息", "Phra Ram 9 Cafe", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-08-30": nearDay("週末再逛 Siam", "補漏買清單", "Siam Paragon Cafe", "cafes Siam Paragon Bangkok", "Siam Paragon", "Siam Paragon Bangkok", "chong"),
    "2026-08-31": nearDay("Asiatique 前輕鬆", "住家圈放慢", "Chong Nonsi Cafe", "cafes near Chong Nonsi Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-09-01": {
      title: "遠一點 · Asiatique 河岸夜",
      vibe: "傍晚出發 · 河岸商場",
      mode: "expedition",
      items: [
        item("15:30", "往 Asiatique", "建議午後出發避開正午；叫車或河船皆可，確認回程方式。", "交通", "expedition", "Asiatique The Riverfront Bangkok"),
        item("16:30", "河岸商場與餐飲", "逛攤位與室內店，先吃一頓再慢慢走。", "商場", "expedition", "Asiatique The Riverfront Bangkok"),
        item("19:30", "夜景與回程", "夜燈較好看時再拍幾張，預留回 Chong Nonsi／Phra Ram 9 時間。", "河岸", "expedition", "Asiatique The Riverfront Bangkok"),
      ],
    },
    "2026-09-02": nearDay("河岸後恢復日", "空調商場與按摩", "Phra Ram 9 Cafe", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-09-03": nearDay("Siam 伴手禮初選", "商場比價", "Siam Center Cafe", "cafes Siam Center Bangkok", "Siam Paragon", "Siam Paragon Bangkok", "chong"),
    "2026-09-04": nearDay("採買結帳日", "Phra Ram 9 最後補貨", "Rama 9 Cafe", "cafes near Phra Ram 9 Bangkok", "Central Rama 9", "Central Rama 9 Bangkok", "rama9"),
    "2026-09-05": nearDay("告別曼谷", "最愛 Cafe／Siam 回訪", "最愛的 Siam／Chong Nonsi Cafe", "cafes Siam Bangkok", "Siam Paragon", "Siam Paragon Bangkok", "chong"),
    "2026-09-06": {
      title: "返程 · 住家圈出發",
      vibe: "一路順風",
      mode: "near",
      items: [
        item("出發前", "酒店 check-out", "確認護照、行李、充電器與伴手禮；向住宿確認前往機場的最佳時間。", "生活", "near", "Phra Ram 9 Bangkok"),
        item("依航班", "前往機場", "Phra Ram 9 可轉 Airport Rail Link（如 Makkasan／Phaya Thai）；Chong Nonsi 可 BTS 至 Siam／Phaya Thai 再轉 ARL，行李多則直接叫車。預留塞車與安檢。", "交通", "near", "Suvarnabhumi Airport Bangkok"),
      ],
    },
  };

  const WEEK_META = {
    1: { label: "Week 1", hint: "安頓雙基地 · Siam 初訪" },
    2: { label: "Week 2", hint: "Siam／住家圈 · ICONSIAM" },
    3: { label: "Week 3", hint: "Siam 回訪 · 札都扎" },
    4: { label: "Week 4", hint: "Asiatique · 伴手禮" },
    5: { label: "Week 5", hint: "告別曼谷 · 返程" },
  };

  const DEFAULT_CHECKLIST = [
    {
      category: "護照與重要文件",
      items: [
        { id: "passport", label: "護照／身分證件" },
        { id: "tickets", label: "機票／登機證截圖" },
        { id: "hotel-booking", label: "酒店訂單與地址（曼谷·Phra Ram 9／Chong Nonsi）" },
        { id: "insurance", label: "旅遊保險文件" },
        { id: "easycard", label: "BTS Rabbit／MRT 卡或 entourage 票" },
        { id: "cash-cards", label: "現金、信用卡、緊急聯絡人" },
        { id: "copies", label: "證件影本或雲端備份" },
      ],
    },
    {
      category: "衣物鞋襪",
      items: [
        { id: "tops", label: "上衣 8–10 件（含透氣材質）" },
        { id: "bottoms", label: "長褲／短褲 5–6 件" },
        { id: "underwear", label: "內衣褲襪子（足夠一週＋備用）" },
        { id: "sleepwear", label: "睡衣／居家服" },
        { id: "light-jacket", label: "薄外套／空調房小外套" },
        { id: "rain-gear", label: "摺疊傘／輕便雨衣（午後雷陣雨）" },
        { id: "walk-shoes", label: "好走的鞋 ×2（曼谷炎熱、常走路／商場）" },
        { id: "slippers", label: "室內拖鞋" },
        { id: "laundry-bag", label: "洗衣袋／髒衣袋" },
      ],
    },
    {
      category: "隨身電子產品與電器",
      items: [
        { id: "phone", label: "手機＋充電器" },
        { id: "powerbank", label: "行動電源" },
        { id: "earbuds", label: "耳機" },
        { id: "laptop", label: "筆電／平板（如需要）" },
        { id: "laptop-charger", label: "筆電充電器／延長線" },
        { id: "adapter", label: "轉插（如需要）" },
        { id: "cable-set", label: "傳輸線／充電線備援" },
        { id: "sim-esim", label: "網卡／eSIM 設定完成" },
      ],
    },
    {
      category: "個人護理與生活用品",
      items: [
        { id: "toothbrush", label: "牙刷牙膏漱口水" },
        { id: "skincare", label: "洗面乳／保濕／防曬" },
        { id: "shampoo", label: "洗髮精／沐浴乳（或確認酒店有）" },
        { id: "towel", label: "毛巾／洗臉巾（視住宿）" },
        { id: "hygiene", label: "衛生用品／濕紙巾" },
        { id: "detergent", label: "旅行洗衣精／衣物除臭" },
        { id: "bottle", label: "環保杯／水壺" },
        { id: "tissues", label: "面紙、購物袋" },
        { id: "glasses", label: "眼鏡／隱眼護理液（如需要）" },
      ],
    },
    {
      category: "常用與急救藥物",
      items: [
        { id: "prescription", label: "個人處方藥（足夠一個月＋緩衝）" },
        { id: "painkiller", label: "止痛藥／感冒藥" },
        { id: "digestive", label: "腸胃藥／止瀉藥" },
        { id: "allergy", label: "抗過敏藥（如需要）" },
        { id: "bandages", label: "OK蹦、消毒棉片" },
        { id: "mosquito", label: "防蚊液／止癢膏" },
        { id: "heat-patch", label: "涼感貼／防暑用品" },
        { id: "thermometer", label: "體溫計（選配）" },
      ],
    },
  ];

  const state = {
    tab: "itinerary",
    week: 1,
    dayId: null,
    placeFilter: "near",
    days: [],
    checklist: {},
    expenses: [],
    cafes: [],
    cafeRating: 0,
    expenseCategoryId: null,
    filterCategory: "all",
    filterWeek: "all",
    budgetThb: DEFAULT_BUDGET_THB,
    rate: { ...DEFAULT_RATE },
  };

  const els = {};

  function cacheEls() {
    Object.assign(els, {
      panels: document.querySelectorAll(".tab-panel"),
      navBtns: document.querySelectorAll(".nav-btn"),
      weekTabs: document.querySelectorAll(".week-tab"),
      placeFilters: document.querySelectorAll(".place-filter"),
      placesRoot: document.getElementById("places-root"),
      weekRange: document.getElementById("week-range"),
      daySelect: document.getElementById("day-select"),
      dayTimeline: document.getElementById("day-timeline"),
      checklistRoot: document.getElementById("checklist-root"),
      checklistProgressLabel: document.getElementById("checklist-progress-label"),
      checklistProgressBar: document.getElementById("checklist-progress-bar"),
      checklistReset: document.getElementById("checklist-reset"),
      cafeForm: document.getElementById("cafe-form"),
      cafeName: document.getElementById("cafe-name"),
      cafeArea: document.getElementById("cafe-area"),
      cafeRating: document.getElementById("cafe-rating"),
      cafeStars: document.getElementById("cafe-stars"),
      cafeTags: document.getElementById("cafe-tags"),
      cafeCount: document.getElementById("cafe-count"),
      cafeList: document.getElementById("cafe-list"),
      rateDisplay: document.getElementById("rate-display"),
      rateMeta: document.getElementById("rate-meta"),
      rateRefresh: document.getElementById("rate-refresh"),
      rateInput: document.getElementById("rate-input"),
      rateApply: document.getElementById("rate-apply"),
      budgetInput: document.getElementById("budget-input"),
      budgetApply: document.getElementById("budget-apply"),
      expenseForm: document.getElementById("expense-form"),
      expenseCategories: document.getElementById("expense-categories"),
      expenseAmount: document.getElementById("expense-amount"),
      expenseNote: document.getElementById("expense-note"),
      expensePreview: document.getElementById("expense-preview"),
      expenseSummary: document.getElementById("expense-summary"),
      expenseAnalytics: document.getElementById("expense-analytics"),
      filterCategories: document.getElementById("filter-categories"),
      filterWeeks: document.getElementById("filter-weeks"),
      expenseListMeta: document.getElementById("expense-list-meta"),
      expenseList: document.getElementById("expense-list"),
      expenseClear: document.getElementById("expense-clear"),
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toDateId(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatShort(date) {
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAY_LABELS[date.getDay()]}）`;
  }

  function formatRange(start, end) {
    return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
  }

  function weekOf(date) {
    const diffDays = Math.floor((date - TRIP_START) / 86400000);
    if (diffDays < 0) return 1;
    if (diffDays < 7) return 1;
    if (diffDays < 14) return 2;
    if (diffDays < 21) return 3;
    if (diffDays < 28) return 4;
    return 5;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mapButton(query) {
    if (!query) return "";
    return `<a href="${mapsLink(query)}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-jade-50 px-3 text-xs font-bold text-jade-700 active:scale-95 transition">
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      在地圖查看
    </a>`;
  }

  function buildDaysFromSample() {
    const days = [];
    const cursor = new Date(TRIP_START);
    let index = 1;
    while (cursor <= TRIP_END) {
      const id = toDateId(cursor);
      const sample = SAMPLE_BY_DATE[id];
      if (!sample) {
        throw new Error(`Missing itinerary for ${id}`);
      }
      days.push({
        id,
        index,
        week: weekOf(cursor),
        date: new Date(cursor),
        title: sample.title,
        vibe: sample.vibe,
        mode: sample.mode,
        items: sample.items,
      });
      cursor.setDate(cursor.getDate() + 1);
      index += 1;
    }
    return days;
  }

  function hydrateDays(rawDays) {
    if (!Array.isArray(rawDays) || !rawDays.length) return null;
    return rawDays.map((day, i) => ({
      id: day.id || `day-${i + 1}`,
      index: Number(day.index) || i + 1,
      week: Number(day.week) || weekOf(new Date(day.date || TRIP_START)),
      date: new Date(day.date || TRIP_START),
      title: day.title || `Day ${i + 1}`,
      vibe: day.vibe || "",
      mode: day.mode === "expedition" ? "expedition" : "near",
      items: Array.isArray(day.items)
        ? day.items.map((entry) => ({
            time: entry.time || "",
            title: entry.title || "",
            detail: entry.detail || "",
            tag: entry.tag || "",
            zone: entry.zone === "expedition" ? "expedition" : "near",
            mapsQuery: entry.mapsQuery || "",
          }))
        : [],
    }));
  }

  function loadItineraryDays() {
    const fresh = { version: ITINERARY_VERSION, days: buildDaysFromSample() };
    if (storageHas(STORAGE_KEYS.itinerary)) {
      const seeded = safeParse(localStorage.getItem(STORAGE_KEYS.itinerary), null);
      if (seeded && Number(seeded.version) === ITINERARY_VERSION) {
        const hydrated = hydrateDays(seeded.days);
        return hydrated && hydrated.length ? hydrated : buildDaysFromSample();
      }
    }
    // Content bump (v2+): replace outdated seed so place changes ship to existing browsers.
    writeJSON(STORAGE_KEYS.itinerary, fresh);
    return buildDaysFromSample();
  }

  function zoneLabel(zone) {
    return zone === "expedition" ? "跨區 5%" : "住家／Siam";
  }

  function zoneClass(zone) {
    return zone === "expedition" ? "zone-expedition" : "zone-near";
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function storageHas(key) {
    return localStorage.getItem(key) !== null;
  }

  function safeParse(raw, fallback) {
    try {
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * Strict conditional load:
   * - If canonical key exists → use it (never overwrite with mocks).
   * - Else try legacy keys → copy the richest payload into canonical once.
   * - Else brand-new user → seed defaultValue and persist once.
   */
  function loadOrSeed(canonicalKey, legacyKeys, defaultValue) {
    if (storageHas(canonicalKey)) {
      return safeParse(localStorage.getItem(canonicalKey), defaultValue);
    }

    const keys = legacyKeys && legacyKeys.length ? legacyKeys : [canonicalKey];
    let bestRaw = null;
    let bestScore = -1;

    for (const key of keys) {
      if (key === canonicalKey) continue;
      if (!storageHas(key)) continue;
      const raw = localStorage.getItem(key);
      const parsed = safeParse(raw, null);
      let score = 0;
      if (Array.isArray(parsed)) score = parsed.length;
      else if (parsed && typeof parsed === "object") score = Object.keys(parsed).length;
      else if (parsed !== null && parsed !== undefined) score = 1;
      if (score > bestScore) {
        bestRaw = raw;
        bestScore = score;
      }
    }

    if (bestRaw !== null) {
      localStorage.setItem(canonicalKey, bestRaw);
      return safeParse(bestRaw, defaultValue);
    }

    writeJSON(canonicalKey, defaultValue);
    return defaultValue;
  }

  /** Load without seeding (returns null if nothing stored anywhere). */
  function loadExisting(canonicalKey, legacyKeys) {
    if (storageHas(canonicalKey)) {
      return safeParse(localStorage.getItem(canonicalKey), null);
    }

    const keys = legacyKeys && legacyKeys.length ? legacyKeys : [];
    let bestRaw = null;
    let bestScore = -1;
    for (const key of keys) {
      if (key === canonicalKey) continue;
      if (!storageHas(key)) continue;
      const raw = localStorage.getItem(key);
      const parsed = safeParse(raw, null);
      let score = 0;
      if (Array.isArray(parsed)) score = parsed.length;
      else if (parsed && typeof parsed === "object") score = Object.keys(parsed).length;
      else if (parsed !== null && parsed !== undefined) score = 1;
      if (score > bestScore) {
        bestRaw = raw;
        bestScore = score;
      }
    }

    if (bestRaw === null) return null;
    localStorage.setItem(canonicalKey, bestRaw);
    return safeParse(bestRaw, null);
  }

  function formatHkd(amount) {
    return `HK$ ${amount.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatThb(amount) {
    return `฿ ${Math.round(amount).toLocaleString("th-TH")}`;
  }

  function formatDateTime(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleString("zh-HK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function thbToHkd(thb) {
    return thb * state.rate.hkdPerThb;
  }

  function daysInWeek(week) {
    return state.days.filter((d) => d.week === week);
  }

  function currentDay() {
    return state.days.find((d) => d.id === state.dayId) || daysInWeek(state.week)[0];
  }

  function setTab(tab) {
    state.tab = tab;
    writeJSON(STORAGE_KEYS.tab, tab);
    els.panels.forEach((panel) => {
      const active = panel.dataset.tab === tab;
      panel.classList.toggle("hidden", !active);
      if (active) {
        panel.classList.remove("animate-fade-up");
        void panel.offsetWidth;
        panel.classList.add("animate-fade-up");
      }
    });
    els.navBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.nav === tab));
  }

  function setPlaceFilter(filter) {
    state.placeFilter = filter;
    els.placeFilters.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.placeFilter === filter));
    renderPlaces();
  }

  function renderPlaces() {
    els.placesRoot.innerHTML = PLACES.filter((p) => p.zone === state.placeFilter)
      .map(
        (place) => `
      <article class="rounded-2xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="rounded-full ${zoneClass(place.zone)} px-2.5 py-0.5 text-[10px] font-bold">${place.category}</span>
          <span class="text-[10px] font-semibold text-ink-faint">${place.transit}</span>
        </div>
        <h3 class="font-display text-[15px] font-bold text-ink">${escapeHtml(place.name)}</h3>
        <p class="mt-1 text-sm leading-relaxed text-ink-soft">${escapeHtml(place.detail)}</p>
        ${mapButton(place.mapsQuery)}
      </article>`
      )
      .join("");
  }

  function setWeek(week, { preserveDay = false } = {}) {
    state.week = week;
    writeJSON(STORAGE_KEYS.week, week);
    els.weekTabs.forEach((btn) => btn.classList.toggle("is-active", Number(btn.dataset.week) === week));
    const inWeek = daysInWeek(week);
    els.weekRange.textContent = `${WEEK_META[week].hint} · ${formatRange(inWeek[0].date, inWeek[inWeek.length - 1].date)} · ${inWeek.length} 天`;
    const keep = preserveDay && inWeek.some((d) => d.id === state.dayId) ? state.dayId : inWeek[0].id;
    setDay(keep);
  }

  function setDay(dayId) {
    state.dayId = dayId;
    writeJSON(STORAGE_KEYS.day, dayId);
    renderDaySelect();
    renderDayTimeline();
  }

  function renderDaySelect() {
    els.daySelect.innerHTML = daysInWeek(state.week)
      .map((day) => {
        const selected = day.id === state.dayId ? "selected" : "";
        return `<option value="${day.id}" ${selected}>Day ${day.index} · ${formatShort(day.date)} · ${
          day.mode === "expedition" ? "跨區 · " : ""
        }${day.title}</option>`;
      })
      .join("");
  }

  function renderDayTimeline() {
    const day = currentDay();
    if (!day) return;
    els.dayTimeline.classList.remove("animate-fade-up");
    void els.dayTimeline.offsetWidth;
    els.dayTimeline.classList.add("animate-fade-up");
    const mode = day.mode || "near";
    els.dayTimeline.innerHTML = `
      <div class="mb-4 flex items-start gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-jade-600 font-display text-sm font-bold text-white shadow-soft">D${day.index}</div>
        <div class="min-w-0 flex-1">
          <span class="rounded-full ${zoneClass(mode)} px-2.5 py-0.5 text-[10px] font-bold">${zoneLabel(mode)}</span>
          <h3 class="mt-1 font-display text-lg font-bold text-ink">${escapeHtml(day.title)}</h3>
          <p class="text-sm text-ink-soft">${formatShort(day.date)} · ${escapeHtml(day.vibe)}</p>
        </div>
      </div>
      <ol class="relative ml-5 space-y-4 border-l-2 border-jade-100 pl-6">
        ${day.items
          .map((entry, i) => {
            const z = entry.zone || mode;
            return `<li class="relative">
            <span class="absolute -left-[1.95rem] top-1.5 h-3.5 w-3.5 rounded-full border-[3px] border-white ${z === "expedition" ? "bg-coral" : "bg-jade-500"} shadow-sm ${i === 0 ? "ring-4 ring-jade-500/15" : ""}"></span>
            <div class="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
              <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
                <time class="text-xs font-bold tracking-wide text-jade-600">${escapeHtml(entry.time)}</time>
                <div class="flex flex-wrap gap-1.5">
                  <span class="rounded-full ${zoneClass(z)} px-2 py-0.5 text-[10px] font-semibold">${zoneLabel(z)}</span>
                  <span class="rounded-full bg-jade-50 px-2.5 py-0.5 text-[10px] font-semibold text-jade-700">${escapeHtml(entry.tag)}</span>
                </div>
              </div>
              <h4 class="font-display text-base font-bold text-ink">${escapeHtml(entry.title)}</h4>
              <p class="mt-1 text-sm leading-relaxed text-ink-soft">${escapeHtml(entry.detail)}</p>
              ${mapButton(entry.mapsQuery)}
            </div>
          </li>`;
          })
          .join("")}
      </ol>`;
  }

  function ensureChecklistState() {
    const saved = loadExisting(STORAGE_KEYS.checklist, LEGACY_KEYS.checklist);
    const next = {};
    DEFAULT_CHECKLIST.forEach((group) => {
      group.items.forEach((entry) => {
        if (saved && Object.prototype.hasOwnProperty.call(saved, entry.id)) {
          next[entry.id] = Boolean(saved[entry.id]);
        } else {
          next[entry.id] = false;
        }
      });
    });
    state.checklist = next;
    // Only seed when this user has never had a checklist key.
    if (saved === null) {
      writeJSON(STORAGE_KEYS.checklist, next);
    }
  }

  function saveChecklist() {
    writeJSON(STORAGE_KEYS.checklist, state.checklist);
  }

  function checklistStats() {
    const ids = Object.keys(state.checklist);
    const done = ids.filter((id) => state.checklist[id]).length;
    return { done, total: ids.length, pct: ids.length ? (done / ids.length) * 100 : 0 };
  }

  function renderChecklist() {
    const { done, total, pct } = checklistStats();
    els.checklistProgressLabel.textContent = `${done} / ${total}`;
    els.checklistProgressBar.style.width = `${pct}%`;
    els.checklistRoot.innerHTML = DEFAULT_CHECKLIST.map(
      (group) => `
      <section>
        <h3 class="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">${group.category}</h3>
        <ul class="overflow-hidden rounded-3xl bg-white/85 shadow-soft backdrop-blur divide-y divide-jade-50">
          ${group.items
            .map((entry) => {
              const checked = state.checklist[entry.id];
              return `<li>
                <button type="button" class="checklist-item ${checked ? "is-checked" : ""} flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left active:bg-jade-50/60 transition" data-check-id="${entry.id}">
                  <span class="check-box flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-jade-200 text-sm font-bold transition">${checked ? "✓" : ""}</span>
                  <span class="item-label text-[15px] font-medium text-ink">${escapeHtml(entry.label)}</span>
                </button>
              </li>`;
            })
            .join("")}
        </ul>
      </section>`
    ).join("");
  }

  function toggleChecklistItem(id) {
    state.checklist[id] = !state.checklist[id];
    saveChecklist();
    renderChecklist();
  }

  function resetChecklist() {
    Object.keys(state.checklist).forEach((id) => {
      state.checklist[id] = false;
    });
    saveChecklist();
    renderChecklist();
  }

  function renderCafeTagInputs() {
    els.cafeTags.innerHTML = CAFE_TAG_DEFS.map(
      (tag) => `
      <label class="cafe-tag flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-jade-100 bg-mist px-3 text-sm font-medium">
        <input type="checkbox" data-cafe-tag="${tag.id}" class="accent-jade-600" />
        ${escapeHtml(tag.label)}
      </label>`
    ).join("");
  }

  function selectedCafeTags() {
    return [...els.cafeTags.querySelectorAll("input[data-cafe-tag]:checked")].map((el) => el.dataset.cafeTag);
  }

  function setCafeRating(rating) {
    state.cafeRating = rating;
    els.cafeRating.value = String(rating);
    els.cafeStars.querySelectorAll(".star-btn").forEach((btn) => {
      const value = Number(btn.dataset.star);
      const on = value <= rating;
      btn.classList.toggle("is-on", on);
      btn.classList.toggle("text-coral", on);
      btn.classList.toggle("text-ink-faint", !on);
      btn.classList.toggle("bg-coral-soft", on);
      btn.classList.toggle("bg-mist", !on);
    });
  }

  function migrateCafes(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((cafe) => {
        if (!cafe || typeof cafe !== "object") return null;
        let tags = Array.isArray(cafe.tags) ? cafe.tags.filter(Boolean) : [];
        if (!tags.length) {
          if (cafe.hasOutlets) tags.push("outlets");
          if (cafe.quiet) tags.push("quiet");
          if (cafe.excellentCoffee) tags.push("coffee");
        }
        const rating = Math.min(5, Math.max(1, Number(cafe.rating) || 1));
        return {
          id: cafe.id || crypto.randomUUID(),
          name: String(cafe.name || "未命名 Cafe"),
          area: String(cafe.area || ""),
          rating,
          tags,
          createdAt: Number(cafe.createdAt) || Date.now(),
        };
      })
      .filter(Boolean);
  }

  function normalizeExpense(entry, fallbackRate) {
    if (!entry || typeof entry !== "object") return null;
    const rateFallback =
      Number.isFinite(fallbackRate) && fallbackRate > 0 ? fallbackRate : DEFAULT_RATE.hkdPerThb;
    const thb = Number(entry.thb ?? entry.amount ?? entry.amountThb);
    const safeThb = Number.isFinite(thb) && thb >= 0 ? thb : 0;
    const storedRate = Number(
      entry.storedRate ?? entry.rateUsed ?? entry.rate ?? entry.fxRate
    );
    const safeRate =
      Number.isFinite(storedRate) && storedRate > 0 ? storedRate : rateFallback;

    let hkd = Number(entry.hkd ?? entry.amountInHKD ?? entry.amountHkd);
    if (!Number.isFinite(hkd)) {
      hkd = safeThb * safeRate;
    }

    const createdAt = Number(entry.createdAt) || Date.now();
    return {
      id: entry.id || crypto.randomUUID(),
      thb: safeThb,
      hkd,
      amountInHKD: hkd,
      storedRate: safeRate,
      rateUsed: safeRate,
      note: String(entry.note || entry.category || ""),
      categoryId: entry.categoryId || guessCategoryId(entry.note || entry.category),
      week: Number(entry.week) || weekOf(new Date(createdAt)),
      createdAt,
    };
  }

  function migrateExpenses(raw, fallbackRate) {
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => normalizeExpense(entry, fallbackRate)).filter(Boolean);
  }

  function saveCafes() {
    writeJSON(STORAGE_KEYS.cafes, state.cafes);
  }

  function tagBadge(tagId) {
    const def = CAFE_TAG_DEFS.find((t) => t.id === tagId);
    if (!def) return "";
    return `<span class="tag-badge ${def.badge}">${escapeHtml(def.label)}</span>`;
  }

  function renderCafes() {
    const sorted = [...state.cafes].sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
    els.cafeCount.textContent = `${sorted.length} 間`;
    if (!sorted.length) {
      els.cafeList.innerHTML = `<li class="rounded-2xl border border-dashed border-jade-100 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">還沒有足跡，從 Siam、Phra Ram 9 或 Chong Nonsi 的咖啡店開始吧。</li>`;
      return;
    }
    els.cafeList.innerHTML = sorted
      .map((cafe) => {
        const stars = "★".repeat(cafe.rating) + "☆".repeat(5 - cafe.rating);
        const badges = (cafe.tags || []).map(tagBadge).join("");
        return `<li class="rounded-2xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
          <div class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-display text-base font-bold text-ink">${escapeHtml(cafe.name)}</h3>
                <span class="rounded-full bg-jade-50 px-2 py-0.5 text-[10px] font-semibold text-jade-700">${escapeHtml(cafe.area)}</span>
              </div>
              <p class="mt-1 text-sm font-semibold tracking-wide text-coral">${stars}</p>
              ${badges ? `<div class="mt-2 flex flex-wrap gap-1.5">${badges}</div>` : ""}
              <p class="mt-2 text-xs text-ink-faint">${formatDateTime(cafe.createdAt)}</p>
            </div>
            <button type="button" class="min-h-10 min-w-10 rounded-xl text-ink-faint hover:bg-jade-50" data-cafe-id="${cafe.id}" aria-label="刪除">✕</button>
          </div>
        </li>`;
      })
      .join("");
  }

  function addCafe(entry) {
    state.cafes = [entry, ...state.cafes];
    saveCafes();
    renderCafes();
  }

  function removeCafe(id) {
    state.cafes = state.cafes.filter((c) => c.id !== id);
    saveCafes();
    renderCafes();
  }

  function guessCategoryId(note) {
    const text = (note || "").toLowerCase();
    const hit = EXPENSE_CATEGORIES.find((c) => text.includes(c.note.toLowerCase()));
    return hit ? hit.id : "other";
  }

  function categoryLabel(id) {
    return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || "其他";
  }

  function renderExpenseCategories() {
    els.expenseCategories.innerHTML = EXPENSE_CATEGORIES.map(
      (cat) =>
        `<button type="button" class="cat-btn ${state.expenseCategoryId === cat.id ? "is-active" : ""} min-h-10 rounded-2xl border border-jade-100 bg-mist px-3 text-xs font-bold text-ink-soft transition" data-cat-id="${cat.id}">${escapeHtml(cat.label)}</button>`
    ).join("");
  }

  function selectExpenseCategory(id) {
    state.expenseCategoryId = id;
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === id);
    if (cat) els.expenseNote.value = cat.note;
    renderExpenseCategories();
  }

  function renderRate() {
    const rate = state.rate.hkdPerThb;
    els.rateDisplay.textContent = `1 THB = ${rate.toFixed(3)} HKD`;
    els.rateInput.value = String(Number(rate.toFixed(4)));
    if (state.rate.source === "live" && state.rate.updatedAt) {
      els.rateMeta.textContent = `線上更新 ${formatDateTime(state.rate.updatedAt)} · 下次約 ${formatDateTime(state.rate.updatedAt + RATE_TTL_MS)}`;
    } else if (state.rate.source === "manual" && state.rate.updatedAt) {
      els.rateMeta.textContent = `手動設定於 ${formatDateTime(state.rate.updatedAt)}`;
    } else {
      els.rateMeta.textContent = "預設匯率 · 可手動調整 · 每 12 小時自動更新";
    }
  }

  function updateExpensePreview() {
    const thb = Number(els.expenseAmount.value);
    if (!Number.isFinite(thb) || thb <= 0) {
      els.expensePreview.textContent = "換算預覽：—";
      return;
    }
    els.expensePreview.textContent = `換算預覽：${formatThb(thb)} ≈ ${formatHkd(thbToHkd(thb))}`;
  }

  function expenseWeekTotals() {
    const totals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    state.expenses.forEach((entry) => {
      const w = entry.week || weekOf(new Date(entry.createdAt));
      totals[w] = (totals[w] || 0) + entry.thb;
    });
    return totals;
  }

  function expenseCategoryTotals() {
    const totals = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      totals[c.id] = 0;
    });
    state.expenses.forEach((entry) => {
      const id = entry.categoryId || "other";
      totals[id] = (totals[id] || 0) + entry.thb;
    });
    return totals;
  }

  function filteredExpenses() {
    return state.expenses.filter((entry) => {
      const week = entry.week || weekOf(new Date(entry.createdAt));
      const catOk = state.filterCategory === "all" || entry.categoryId === state.filterCategory;
      const weekOk = state.filterWeek === "all" || String(week) === String(state.filterWeek);
      return catOk && weekOk;
    });
  }

  const CHART_COLORS = [
    "#0F766E",
    "#14B8A6",
    "#F97316",
    "#EA580C",
    "#0284C7",
    "#7C3AED",
    "#DB2777",
    "#65A30D",
  ];

  function expenseDailyTotals() {
    const totals = {};
    state.days.forEach((d) => {
      totals[d.id] = 0;
    });
    state.expenses.forEach((entry) => {
      const id = toDateId(new Date(entry.createdAt));
      if (totals[id] !== undefined) totals[id] += entry.thb;
      else {
        // Outside trip calendar: fold into nearest trip week day by week index
        const w = entry.week || weekOf(new Date(entry.createdAt));
        const anchor = state.days.find((d) => d.week === w);
        if (anchor) totals[anchor.id] = (totals[anchor.id] || 0) + entry.thb;
      }
    });
    return totals;
  }

  function polar(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function donutSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const [x1, y1] = polar(cx, cy, rOuter, startAngle);
    const [x2, y2] = polar(cx, cy, rOuter, endAngle);
    const [x3, y3] = polar(cx, cy, rInner, endAngle);
    const [x4, y4] = polar(cx, cy, rInner, startAngle);
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  function renderExpenseSummary() {
    const totalTHB = state.expenses.reduce((sum, e) => sum + e.thb, 0);
    const totalHkd = totalTHB * state.rate.hkdPerThb;
    const avgDaily = totalTHB / TRIP_DAYS;
    const avgHkd = avgDaily * state.rate.hkdPerThb;
    const remaining = state.budgetThb - totalTHB;
    const budgetPct = state.budgetThb > 0 ? Math.min(100, Math.round((totalTHB / state.budgetThb) * 100)) : 0;
    const catTotals = expenseCategoryTotals();
    const topCat = EXPENSE_CATEGORIES.map((c) => ({ ...c, total: catTotals[c.id] || 0 })).sort(
      (a, b) => b.total - a.total
    )[0];
    const remainClass = remaining < 0 ? "text-coral" : "text-jade-700";

    els.expenseSummary.innerHTML = `
      <div class="col-span-2 rounded-3xl bg-gradient-to-br from-jade-800 via-jade-600 to-jade-500 p-4 text-white shadow-soft">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-white/70">預算 vs 實際</p>
            <p class="mt-1 font-display text-xl font-bold">${formatThb(totalTHB)} <span class="text-sm font-medium text-white/75">/ ${formatThb(state.budgetThb)}</span></p>
            <p class="mt-1 text-xs text-white/80">剩餘 <span class="font-bold">${formatThb(remaining)}</span> · 已用 ${budgetPct}%</p>
          </div>
          <div class="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-sm">
            <p class="text-[10px] uppercase tracking-wider text-white/70">進度</p>
            <p class="font-display text-lg font-bold">${budgetPct}%</p>
          </div>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
          <div class="h-full rounded-full ${remaining < 0 ? "bg-coral" : "bg-white"}" style="width:${budgetPct}%"></div>
        </div>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">日均開支</p>
        <p class="mt-1 font-display text-base font-bold text-ink">${formatThb(avgDaily)}</p>
        <p class="text-xs text-jade-700">${formatHkd(avgHkd)}</p>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">最高分類</p>
        <p class="mt-1 font-display text-base font-bold text-ink">${
          topCat && topCat.total > 0 ? escapeHtml(topCat.label) : "—"
        }</p>
        <p class="text-xs text-ink-soft">${topCat && topCat.total > 0 ? formatThb(topCat.total) : "尚無資料"}</p>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">總支出 THB</p>
        <p class="mt-1 font-display text-base font-bold text-ink">${formatThb(totalTHB)}</p>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">等值 HKD</p>
        <p class="mt-1 font-display text-base font-bold ${remainClass}">${formatHkd(totalHkd)}</p>
      </div>`;
  }

  function renderDonutChart(catEntries, monthTHB) {
    const cx = 90;
    const cy = 90;
    const rOuter = 70;
    const rInner = 44;
    const active = catEntries.filter((c) => c.total > 0);
    if (!monthTHB || !active.length) {
      return `
        <div class="flex flex-col items-center justify-center py-6">
          <svg viewBox="0 0 180 180" class="h-40 w-40">
            <circle cx="90" cy="90" r="70" fill="none" stroke="#E7F7F4" stroke-width="26" />
            <circle cx="90" cy="90" r="44" fill="#F4F9F8" />
            <text x="90" y="88" text-anchor="middle" class="fill-ink-faint" font-size="11">尚無</text>
            <text x="90" y="104" text-anchor="middle" class="fill-ink-faint" font-size="11">資料</text>
          </svg>
        </div>`;
    }

    let angle = 0;
    const segments = active
      .map((c, i) => {
        const sweep = (c.total / monthTHB) * 360;
        const start = angle;
        const end = angle + Math.max(sweep, 0.8);
        angle += sweep;
        const color = CHART_COLORS[EXPENSE_CATEGORIES.findIndex((x) => x.id === c.id) % CHART_COLORS.length];
        const mid = (start + end) / 2;
        return `<path class="chart-seg cursor-pointer transition-opacity hover:opacity-80" data-filter-cat="${c.id}" d="${donutSegment(
          cx,
          cy,
          rOuter,
          rInner,
          start,
          end
        )}" fill="${color}"><title>${escapeHtml(c.label)} ${Math.round((c.total / monthTHB) * 100)}%</title></path>`;
      })
      .join("");

    return `
      <div class="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <svg viewBox="0 0 180 180" class="h-44 w-44 shrink-0">
          ${segments}
          <circle cx="90" cy="90" r="40" fill="#fff" />
          <text x="90" y="86" text-anchor="middle" fill="#14262B" font-size="11" font-weight="700">本月</text>
          <text x="90" y="102" text-anchor="middle" fill="#0F766E" font-size="10" font-weight="700">${Math.round(monthTHB).toLocaleString("th-TH")}</text>
        </svg>
        <div class="grid w-full grid-cols-2 gap-2">
          ${active
            .map((c) => {
              const color = CHART_COLORS[EXPENSE_CATEGORIES.findIndex((x) => x.id === c.id) % CHART_COLORS.length];
              const share = Math.round((c.total / monthTHB) * 100);
              const on = state.filterCategory === c.id;
              return `<button type="button" data-filter-cat="${c.id}" class="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition ${on ? "bg-jade-50 ring-1 ring-jade-500" : "hover:bg-mist"}">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background:${color}"></span>
                <span class="min-w-0">
                  <span class="block truncate text-[11px] font-bold text-ink">${escapeHtml(c.label)}</span>
                  <span class="text-[10px] text-ink-faint">${share}% · ${formatThb(c.total)}</span>
                </span>
              </button>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  function renderWeeklyBarChart(weekTotals) {
    const maxWeek = Math.max(...Object.values(weekTotals), 1);
    const W = 300;
    const H = 160;
    const padL = 28;
    const padB = 28;
    const padT = 12;
    const chartH = H - padB - padT;
    const gap = 10;
    const barW = (W - padL - 12 - gap * 4) / 5;

    const bars = [1, 2, 3, 4, 5]
      .map((w, i) => {
        const val = weekTotals[w] || 0;
        const h = Math.max(val > 0 ? 6 : 2, (val / maxWeek) * chartH);
        const x = padL + i * (barW + gap);
        const y = padT + chartH - h;
        const active = state.filterWeek === String(w);
        const fill = active ? "#F97316" : "#0F766E";
        return `
          <g class="chart-seg cursor-pointer" data-filter-week="${w}">
            <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="8" fill="${fill}" class="transition-all hover:opacity-85">
              <title>Week ${w}: ${formatThb(val)}</title>
            </rect>
            <text x="${x + barW / 2}" y="${H - 10}" text-anchor="middle" fill="#6D848C" font-size="10" font-weight="700">W${w}</text>
          </g>`;
      })
      .join("");

    return `
      <svg viewBox="0 0 ${W} ${H}" class="h-44 w-full" role="img" aria-label="每週開支長條圖">
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#E7F7F4" stroke-width="1" />
        <line x1="${padL}" y1="${padT + chartH}" x2="${W - 8}" y2="${padT + chartH}" stroke="#E7F7F4" stroke-width="1" />
        ${bars}
      </svg>
      <div class="mt-1 flex justify-between px-1 text-[10px] text-ink-faint">
        ${[1, 2, 3, 4, 5].map((w) => `<span>W${w} ${formatThb(weekTotals[w] || 0).replace("฿ ", "")}</span>`).join("")}
      </div>`;
  }

  function renderDailyTrendChart(dailyTotals) {
    const values = state.days.map((d) => dailyTotals[d.id] || 0);
    const maxV = Math.max(...values, 1);
    const W = 320;
    const H = 150;
    const pad = { l: 8, r: 8, t: 16, b: 24 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const n = values.length;
    const points = values.map((v, i) => {
      const x = pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = pad.t + innerH - (v / maxV) * innerH;
      return [x, y, v];
    });

    const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L ${points[points.length - 1][0].toFixed(1)} ${(pad.t + innerH).toFixed(1)} L ${points[0][0].toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`;
    const peakIdx = values.indexOf(Math.max(...values));
    const peak = points[peakIdx];

    return `
      <svg viewBox="0 0 ${W} ${H}" class="h-40 w-full" role="img" aria-label="每日開支趨勢">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#14B8A6" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#areaFill)" />
        <path d="${line}" fill="none" stroke="#0F766E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${
          values.some((v) => v > 0)
            ? `<circle cx="${peak[0]}" cy="${peak[1]}" r="4.5" fill="#F97316" stroke="#fff" stroke-width="2">
                <title>高峰：${formatThb(peak[2])}</title>
              </circle>`
            : ""
        }
        <text x="${pad.l}" y="${H - 6}" fill="#6D848C" font-size="9">8/7</text>
        <text x="${W / 2}" y="${H - 6}" text-anchor="middle" fill="#6D848C" font-size="9">旅程中段</text>
        <text x="${W - pad.r}" y="${H - 6}" text-anchor="end" fill="#6D848C" font-size="9">9/6</text>
      </svg>
      <p class="mt-1 text-center text-[10px] text-ink-faint">${
        values.some((v) => v > 0)
          ? `高峰日約 ${state.days[peakIdx] ? formatShort(state.days[peakIdx].date) : "—"} · ${formatThb(values[peakIdx])}`
          : "有開支紀錄後會顯示每日曲線"
      }</p>`;
  }

  function renderExpenseAnalytics() {
    const weekTotals = expenseWeekTotals();
    const catTotals = expenseCategoryTotals();
    const dailyTotals = expenseDailyTotals();
    const monthTHB = Object.values(weekTotals).reduce((a, b) => a + b, 0);
    const catEntries = EXPENSE_CATEGORIES.map((c) => ({ ...c, total: catTotals[c.id] || 0 })).sort(
      (a, b) => b.total - a.total
    );

    els.expenseAnalytics.innerHTML = `
      <div class="rounded-3xl bg-white/85 p-4 shadow-soft backdrop-blur">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-display text-sm font-bold text-ink">分類環形圖</h3>
          <span class="text-[10px] font-semibold text-ink-faint">點圖例可篩選</span>
        </div>
        ${renderDonutChart(catEntries, monthTHB)}
      </div>

      <div class="rounded-3xl bg-white/85 p-4 shadow-soft backdrop-blur">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-display text-sm font-bold text-ink">每週比較</h3>
          <span class="text-[10px] font-semibold text-ink-faint">Week 1–5 · 點長條篩選</span>
        </div>
        ${renderWeeklyBarChart(weekTotals)}
      </div>

      <div class="rounded-3xl bg-white/85 p-4 shadow-soft backdrop-blur">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-display text-sm font-bold text-ink">每日開支趨勢</h3>
          <span class="text-[10px] font-semibold text-ink-faint">8/7 – 9/6</span>
        </div>
        ${renderDailyTrendChart(dailyTotals)}
      </div>`;
  }

  function renderFilterChips() {
    els.filterCategories.innerHTML = [
      `<button type="button" class="filter-chip ${state.filterCategory === "all" ? "is-active" : ""}" data-filter-cat="all">全部</button>`,
      ...EXPENSE_CATEGORIES.map(
        (c) =>
          `<button type="button" class="filter-chip ${state.filterCategory === c.id ? "is-active" : ""}" data-filter-cat="${c.id}">${escapeHtml(c.label)}</button>`
      ),
    ].join("");

    els.filterWeeks.innerHTML = [
      `<button type="button" class="filter-chip ${state.filterWeek === "all" ? "is-active" : ""}" data-filter-week="all">全部</button>`,
      ...[1, 2, 3, 4, 5].map(
        (w) =>
          `<button type="button" class="filter-chip ${state.filterWeek === String(w) ? "is-active" : ""}" data-filter-week="${w}">W${w}</button>`
      ),
    ].join("");
  }

  function renderExpenses() {
    renderExpenseSummary();
    renderExpenseAnalytics();
    renderFilterChips();

    const list = filteredExpenses();
    const catLabel = state.filterCategory === "all" ? "全部分類" : categoryLabel(state.filterCategory);
    const weekLabel = state.filterWeek === "all" ? "全部週次" : `Week ${state.filterWeek}`;
    els.expenseListMeta.textContent = `${catLabel} · ${weekLabel} · ${list.length} 筆`;

    if (!list.length) {
      els.expenseList.innerHTML = `<li class="rounded-2xl border border-dashed border-jade-100 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">${
        state.expenses.length ? "此篩選條件沒有紀錄，試試其他分類或週次。" : "還沒有開支紀錄，點上方分類快速開始吧。"
      }</li>`;
      return;
    }

    els.expenseList.innerHTML = list
      .map(
        (entry) => `
      <li class="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate font-semibold text-ink">${escapeHtml(entry.note || "未命名開支")}</p>
            <span class="rounded-full bg-jade-50 px-2 py-0.5 text-[10px] font-semibold text-jade-700">W${entry.week || weekOf(new Date(entry.createdAt))}</span>
            <span class="rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-ink-soft">${escapeHtml(categoryLabel(entry.categoryId))}</span>
          </div>
          <p class="text-xs text-ink-faint">${formatDateTime(entry.createdAt)}</p>
        </div>
        <div class="text-right">
          <p class="font-display font-bold text-jade-700">${formatHkd(entry.hkd)}</p>
          <p class="text-xs text-ink-soft">${formatThb(entry.thb)}</p>
        </div>
        <button type="button" class="min-h-10 min-w-10 rounded-xl text-ink-faint hover:bg-jade-50" data-expense-id="${entry.id}" aria-label="刪除">✕</button>
      </li>`
      )
      .join("");
  }

  function setFilterCategory(id) {
    state.filterCategory = state.filterCategory === id && id !== "all" ? "all" : id;
    renderExpenses();
  }

  function setFilterWeek(week) {
    const value = String(week);
    state.filterWeek = state.filterWeek === value && value !== "all" ? "all" : value;
    renderExpenses();
  }

  function addExpense(thb, note, categoryId) {
    const now = Date.now();
    const storedRate = state.rate.hkdPerThb;
    const hkd = thb * storedRate;
    state.expenses = [
      {
        id: crypto.randomUUID(),
        thb,
        hkd,
        amountInHKD: hkd,
        storedRate,
        rateUsed: storedRate,
        note: note.trim(),
        categoryId: categoryId || guessCategoryId(note),
        week: weekOf(new Date(now)),
        createdAt: now,
      },
      ...state.expenses,
    ];
    writeJSON(STORAGE_KEYS.expenses, state.expenses);
    renderExpenses();
  }

  function removeExpense(id) {
    state.expenses = state.expenses.filter((e) => e.id !== id);
    writeJSON(STORAGE_KEYS.expenses, state.expenses);
    renderExpenses();
  }

  function clearExpenses() {
    state.expenses = [];
    writeJSON(STORAGE_KEYS.expenses, state.expenses);
    renderExpenses();
  }

  function applyRate(hkdPerThb, source) {
    state.rate = { hkdPerThb, source, updatedAt: Date.now() };
    writeJSON(STORAGE_KEYS.rate, state.rate);
    renderRate();
    updateExpensePreview();
    renderExpenses();
  }

  function loadRateFromStorage() {
    const saved = loadExisting(STORAGE_KEYS.rate, LEGACY_KEYS.rate);
    if (!saved || typeof saved.hkdPerThb !== "number" || !(saved.hkdPerThb > 0)) {
      state.rate = { ...DEFAULT_RATE };
      // Do not write default rate until user/API sets it — avoids clobbering later.
      return;
    }
    state.rate = {
      hkdPerThb: saved.hkdPerThb,
      source: saved.source || "manual",
      updatedAt: saved.updatedAt || null,
    };
  }

  function loadBudget() {
    const saved = loadExisting(STORAGE_KEYS.budget, LEGACY_KEYS.budget);
    if (typeof saved === "number" && saved >= 0) {
      state.budgetThb = saved;
    } else if (saved === null) {
      state.budgetThb = DEFAULT_BUDGET_THB;
      writeJSON(STORAGE_KEYS.budget, DEFAULT_BUDGET_THB);
    } else {
      state.budgetThb = DEFAULT_BUDGET_THB;
    }
    els.budgetInput.value = String(state.budgetThb);
  }

  function applyBudget() {
    const value = Number(els.budgetInput.value);
    if (!Number.isFinite(value) || value < 0) {
      alert("請輸入有效預算");
      return;
    }
    state.budgetThb = value;
    writeJSON(STORAGE_KEYS.budget, value);
    renderExpenses();
  }

  function isRateFresh() {
    return (
      state.rate.source === "live" &&
      typeof state.rate.updatedAt === "number" &&
      Date.now() - state.rate.updatedAt < RATE_TTL_MS
    );
  }

  async function fetchLiveRate({ force = false } = {}) {
    if (!force && isRateFresh()) {
      renderRate();
      return;
    }
    if (
      !force &&
      state.rate.source === "manual" &&
      state.rate.updatedAt &&
      Date.now() - state.rate.updatedAt < RATE_TTL_MS
    ) {
      renderRate();
      return;
    }
    els.rateRefresh.classList.add("spin");
    els.rateMeta.textContent = "正在更新匯率…";
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/THB");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hkd = data?.rates?.HKD;
      if (typeof hkd !== "number" || hkd <= 0) throw new Error("Missing HKD rate");
      applyRate(hkd, "live");
    } catch (err) {
      console.warn("FX update failed", err);
      if (!state.rate.updatedAt) {
        state.rate = { ...DEFAULT_RATE, updatedAt: Date.now() };
        writeJSON(STORAGE_KEYS.rate, state.rate);
      }
      renderRate();
      els.rateMeta.textContent = "更新失敗，使用目前顯示的匯率";
    } finally {
      els.rateRefresh.classList.remove("spin");
    }
  }

  function applyManualRate() {
    const value = Number(els.rateInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      alert("請輸入有效的匯率數字");
      return;
    }
    applyRate(value, "manual");
  }

  function bindEvents() {
    els.navBtns.forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.nav)));
    els.weekTabs.forEach((btn) => btn.addEventListener("click", () => setWeek(Number(btn.dataset.week))));
    els.placeFilters.forEach((btn) =>
      btn.addEventListener("click", () => setPlaceFilter(btn.dataset.placeFilter))
    );
    els.daySelect.addEventListener("change", (e) => setDay(e.target.value));

    els.checklistRoot.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-check-id]");
      if (btn) toggleChecklistItem(btn.dataset.checkId);
    });
    els.checklistReset.addEventListener("click", () => {
      if (confirm("確定要重設所有勾選狀態嗎？")) resetChecklist();
    });

    els.cafeStars.addEventListener("click", (e) => {
      const btn = e.target.closest(".star-btn");
      if (btn) setCafeRating(Number(btn.dataset.star));
    });

    els.cafeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!state.cafeRating) {
        alert("請先選擇 1–5 星評分");
        return;
      }
      addCafe({
        id: crypto.randomUUID(),
        name: els.cafeName.value.trim(),
        area: els.cafeArea.value.trim(),
        rating: state.cafeRating,
        tags: selectedCafeTags(),
        createdAt: Date.now(),
      });
      els.cafeForm.reset();
      renderCafeTagInputs();
      setCafeRating(0);
    });

    els.cafeList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cafe-id]");
      if (btn) removeCafe(btn.dataset.cafeId);
    });

    els.expenseCategories.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat-id]");
      if (btn) selectExpenseCategory(btn.dataset.catId);
    });

    els.expenseAmount.addEventListener("input", updateExpensePreview);
    els.expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const thb = Number(els.expenseAmount.value);
      if (!Number.isFinite(thb) || thb <= 0) return;
      addExpense(thb, els.expenseNote.value, state.expenseCategoryId);
      els.expenseForm.reset();
      state.expenseCategoryId = null;
      renderExpenseCategories();
      updateExpensePreview();
    });

    els.expenseAnalytics.addEventListener("click", (e) => {
      const weekBtn = e.target.closest("[data-filter-week]");
      if (weekBtn) {
        setFilterWeek(weekBtn.dataset.filterWeek);
        return;
      }
      const catBtn = e.target.closest("[data-filter-cat]");
      if (catBtn) setFilterCategory(catBtn.dataset.filterCat);
    });

    els.filterCategories.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-cat]");
      if (btn) setFilterCategory(btn.dataset.filterCat);
    });

    els.filterWeeks.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-week]");
      if (btn) setFilterWeek(btn.dataset.filterWeek);
    });

    els.expenseList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-expense-id]");
      if (btn) removeExpense(btn.dataset.expenseId);
    });

    els.expenseClear.addEventListener("click", () => {
      if (!state.expenses.length) return;
      if (confirm("確定清空所有開支紀錄嗎？")) clearExpenses();
    });

    els.budgetApply.addEventListener("click", applyBudget);
    els.rateRefresh.addEventListener("click", () => fetchLiveRate({ force: true }));
    els.rateApply.addEventListener("click", applyManualRate);
    els.rateInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyManualRate();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") fetchLiveRate();
    });
  }

  function init() {
    cacheEls();

    // Itinerary: seed mock only for brand-new users; never overwrite existing.
    state.days = loadItineraryDays();

    // Rate first so expense migration can fall back to current rate.
    loadRateFromStorage();

    // Expenses / cafes: load existing or seed empty — never reset populated stores.
    const loadedExpenses = loadOrSeed(STORAGE_KEYS.expenses, LEGACY_KEYS.expenses, []);
    state.expenses = migrateExpenses(loadedExpenses, state.rate.hkdPerThb);
    // Soft schema upgrade only (adds missing hkd/storedRate) — does not wipe rows.
    if (Array.isArray(loadedExpenses) && loadedExpenses.length) {
      writeJSON(STORAGE_KEYS.expenses, state.expenses);
    }

    const loadedCafes = loadOrSeed(STORAGE_KEYS.cafes, LEGACY_KEYS.cafes, []);
    state.cafes = migrateCafes(loadedCafes);
    if (Array.isArray(loadedCafes) && loadedCafes.length) {
      writeJSON(STORAGE_KEYS.cafes, state.cafes);
    }

    ensureChecklistState();
    loadBudget();

    const savedTab = loadExisting(STORAGE_KEYS.tab, LEGACY_KEYS.tab) || "itinerary";
    const savedWeekRaw = loadExisting(STORAGE_KEYS.week, LEGACY_KEYS.week);
    const savedWeek = Number(savedWeekRaw) || 1;
    const savedDay = loadExisting(STORAGE_KEYS.day, LEGACY_KEYS.day);

    renderCafeTagInputs();
    renderChecklist();
    renderPlaces();
    renderCafes();
    renderExpenseCategories();
    renderRate();
    renderExpenses();
    updateExpensePreview();
    setCafeRating(0);
    bindEvents();

    const validTabs = ["itinerary", "checklist", "cafelog", "expense"];
    setTab(validTabs.includes(savedTab) ? savedTab : "itinerary");
    const week = [1, 2, 3, 4, 5].includes(savedWeek) ? savedWeek : 1;
    state.dayId = savedDay;
    setWeek(week, { preserveDay: true });

    fetchLiveRate();
    setInterval(() => fetchLiveRate(), RATE_TTL_MS);
  }

  init();
})();
