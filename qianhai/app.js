(() => {
  "use strict";

  const STORAGE_KEYS = {
    expenses: "qianhai-expenses",
    itinerary: "qianhai-itinerary",
    checklist: "qianhai-checklist",
    cafes: "qianhai-cafe-log",
    rate: "qianhai-fx-rate",
    budget: "qianhai-budget",
    tab: "qianhai-active-tab",
    day: "qianhai-active-day",
  };

  const DEFAULT_RATE = { hkdPerCny: 1.08, source: "manual", updatedAt: null };
  const DEFAULT_BUDGET_CNY = 2500;
  const RATE_TTL_MS = 12 * 60 * 60 * 1000;
  const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
  const ITINERARY_VERSION = 2;

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
    { id: "indoor", label: "室內冷氣", badge: "badge-jade" },
    { id: "walk", label: "酒店步行", badge: "badge-sky" },
    { id: "food", label: "抵食", badge: "badge-coral" },
    { id: "pay", label: "電子支付順", badge: "badge-amber" },
    { id: "view", label: "景觀靚", badge: "badge-violet" },
    { id: "value", label: "高CP值", badge: "badge-lime" },
  ];

  const NOTES = [
    "住宿係蛇口海上世界嘅海底世界 Rany Hotel，最早 10 月 12 日 08:00 可入住；10 月 14 日退房。",
    "行程目的地仍係前海一帶，但過夜基地喺海上世界，唔係桂灣酒店。",
    "主口岸深圳灣。蛇口船係備選。皇崗／福田可以過關，但再去海上世界要另計車程。",
    "深圳灣口岸唔係 24 小時，回程以口岸同巴士時間為準，唔追尾班。",
    "深圳日常以微信、支付寶為主；香港八達通唔當深圳地鐵主支付。少量人民幣現金備用即可。",
  ];

  function mapsLink(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function item(time, title, detail, tag, zone, mapsQuery, place) {
    return { time, title, detail, tag, zone, mapsQuery, place };
  }

  const PLACES = [
    {
      id: "sea-world-plaza",
      category: "attraction",
      name: "海上世界廣場／女媧像",
      cluster: "海上世界",
      dayHint: "Day 1",
      detail: "酒店出街即到，行人街同地標。適合 Day 1 放行李後行一圈。",
      transit: "酒店步行",
      mapsQuery: "海上世界廣場 蛇口 深圳",
    },
    {
      id: "ocean-world",
      category: "attraction",
      name: "深圳海洋世界",
      cluster: "海上世界",
      dayHint: "Day 1",
      detail: "主題樂園，同酒店同一個圈。想入園先查當日門票同關門時間。",
      transit: "酒店步行",
      mapsQuery: "深圳海洋世界 海上世界",
    },
    {
      id: "shekou-old",
      category: "attraction",
      name: "蛇口老街",
      cluster: "蛇口",
      dayHint: "",
      detail: "短程的士或步行可到。舊街小店，唔係觀光長線。",
      transit: "短程的士／步行",
      mapsQuery: "蛇口老街 深圳",
    },
    {
      id: "qianhai-stone",
      category: "attraction",
      name: "前海石公園",
      cluster: "前海桂灣",
      dayHint: "Day 2",
      detail: "由海上世界出發要地鐵或的士。散步為主，配合 Day 2 桂灣。",
      transit: "地鐵／的士",
      mapsQuery: "前海石公園 深圳",
    },
    {
      id: "maoye",
      category: "shopping",
      name: "海上世界茂業天地",
      cluster: "海上世界",
      dayHint: "Day 1／3",
      detail: "酒店旁邊商場，補日用品、冷氣休息。",
      transit: "酒店步行",
      mapsQuery: "海上世界茂業天地 深圳",
    },
    {
      id: "garden-city",
      category: "shopping",
      name: "花園城中心",
      cluster: "蛇口",
      dayHint: "",
      detail: "蛇口另一個商場，地鐵或短的士。唔想去前海購物先嚟呢度。",
      transit: "地鐵／短的士",
      mapsQuery: "花園城中心 蛇口 深圳",
    },
    {
      id: "uniwalk",
      category: "shopping",
      name: "前海壹方城 Uniwalk",
      cluster: "前海桂灣",
      dayHint: "Day 2",
      detail: "前海主力商場同食樓。Day 2 由酒店出發，唔好當步行。",
      transit: "地鐵／的士",
      mapsQuery: "前海壹方城 Uniwalk 深圳",
    },
    {
      id: "kerry",
      category: "shopping",
      name: "前海嘉里中心",
      cluster: "前海桂灣",
      dayHint: "Day 2",
      detail: "壹方城附近備選。同一日唔使兩個商場都行完。",
      transit: "地鐵／的士",
      mapsQuery: "前海嘉里中心 深圳",
    },
    {
      id: "sea-food",
      category: "food",
      name: "海上世界食街／酒吧街",
      cluster: "海上世界",
      dayHint: "Day 1／3",
      detail: "酒店樓下圈。Day 1、Day 3 晚餐最省來回。先問電子支付。",
      transit: "酒店步行",
      mapsQuery: "海上世界食街 蛇口 深圳",
    },
    {
      id: "uniwalk-food",
      category: "food",
      name: "壹方城食樓",
      cluster: "前海桂灣",
      dayHint: "Day 2",
      detail: "Day 2 午餐穩定選擇，商場樓層為主。",
      transit: "地鐵／的士",
      mapsQuery: "前海壹方城 美食 深圳",
    },
    {
      id: "mtr-sea-world",
      category: "practical",
      name: "地鐵海上世界站（2 號綫）",
      cluster: "海上世界",
      dayHint: "",
      detail: "酒店最近地鐵。去前海要轉綫，行李多優先的士。",
      transit: "酒店步行",
      mapsQuery: "地鐵海上世界站 深圳",
    },
    {
      id: "mtr-shekou",
      category: "practical",
      name: "地鐵蛇口港站",
      cluster: "蛇口",
      dayHint: "",
      detail: "近碼頭。蛇口船班先核對當日時間，唔係今回主口岸。",
      transit: "地鐵 2 號綫",
      mapsQuery: "地鐵蛇口港站 深圳",
    },
    {
      id: "convenience",
      category: "practical",
      name: "便利店（7-Eleven／羅森／美宜佳）",
      cluster: "海上世界",
      dayHint: "",
      detail: "廣場同商場內都有。過夜水同早餐可以喺呢度補。",
      transit: "酒店步行",
      mapsQuery: "7-Eleven 海上世界 蛇口",
    },
    {
      id: "pharmacy",
      category: "practical",
      name: "連鎖藥房（海王星辰／大參林）",
      cluster: "海上世界",
      dayHint: "",
      detail: "商場層常見。常備藥先睇包裝同處方規定。",
      transit: "酒店步行",
      mapsQuery: "海王星辰 海上世界 蛇口",
    },
    {
      id: "taxi-border",
      category: "practical",
      name: "深圳灣口岸的士／網約",
      cluster: "口岸",
      dayHint: "Day 1／3",
      detail: "來回酒店同口岸都坐車。唔好當步行。報酒店用「海上世界海底世界 Rany Hotel」。",
      transit: "的士／網約",
      mapsQuery: "深圳灣口岸",
    },
  ];

  const SAMPLE_BY_DATE = {
    "2026-10-12": {
      title: "過關 · 入住海上世界",
      vibe: "深圳灣入蛇口 · 最早 08:00 可入住",
      mode: "near",
      items: [
        item(
          "08:00",
          "海底世界 Rany Hotel 最早可入住",
          "酒店最早入住時間係 08:00。趕得及過關就可以直接入房放行李，唔使喺桂灣等晚上先住。",
          "住宿",
          "near",
          "海底世界 Rany Hotel 海上世界 蛇口",
          "蛇口海上世界 · 海底世界 Rany Hotel"
        ),
        item(
          "08:30",
          "香港出發往深圳灣",
          "港深西部通道直達深圳灣。預留上車同入閘時間；口岸唔係 24 小時。出閘後的士／網約去海上世界，唔係先入桂灣酒店。",
          "交通",
          "near",
          "深圳灣口岸巴士",
          "各區深圳灣口岸巴士"
        ),
        item(
          "09:30",
          "過關：深圳灣口岸",
          "備妥回鄉證／通行證。出閘後跟旅客指示往的士或網約，報「海上世界海底世界 Rany Hotel」。",
          "交通",
          "near",
          "深圳灣口岸",
          "深圳灣口岸"
        ),
        item(
          "10:30",
          "到海上世界，辦理入住",
          "最早 08:00 已可入住；遲到都係呢間。先放行李，再決定行商場定休息。",
          "住宿",
          "near",
          "海底世界 Rany Hotel 海上世界 蛇口",
          "海底世界 Rany Hotel"
        ),
        item(
          "12:30",
          "午餐",
          "酒店附近商場同食街選擇多。先確認微信／支付寶。",
          "美食",
          "near",
          "海上世界食街 蛇口 深圳",
          "海上世界食肆（自選）"
        ),
        item(
          "15:00",
          "午後走動：海上世界廣場",
          "酒店出街即到。想行商場就茂業天地；想行園可睇深圳海洋世界。前海留畀第二日。",
          "景點",
          "near",
          "海上世界廣場 蛇口 深圳",
          "海上世界廣場／女媧像"
        ),
        item(
          "18:30",
          "晚餐，回酒店",
          "返海上世界食晚餐同過夜。記下酒店中文地址，方便之後來回前海。",
          "美食",
          "near",
          "海底世界 Rany Hotel 海上世界 蛇口",
          "海底世界 Rany Hotel"
        ),
      ],
    },
    "2026-10-13": {
      title: "前海桂灣全日",
      vibe: "壹方城 · 前海石 · 晚上返海上世界",
      mode: "expedition",
      items: [
        item(
          "09:30",
          "由海上世界出發去前海",
          "基地仍係 Rany Hotel。地鐵或的士去桂灣。景點睇前海石公園，購物以壹方城 Uniwalk 為主。行李留喺酒店。",
          "交通",
          "expedition",
          "前海桂灣 深圳",
          "蛇口海上世界 → 桂灣"
        ),
        item(
          "10:30",
          "前海石公園",
          "散步為主，合作區範圍大，唔好當一個商場行得完。",
          "景點",
          "expedition",
          "前海石公園 深圳",
          "前海石公園"
        ),
        item(
          "12:30",
          "午餐",
          "壹方城、嘉里中心食樓選擇穩定。",
          "美食",
          "expedition",
          "前海壹方城 美食 深圳",
          "前海商場食樓（自選）"
        ),
        item(
          "15:00",
          "桂灣／媽灣走動",
          "未去壹方城可轉嘉里中心。同一日唔使兩個商場都行完。傍晚預留時間返海上世界食飯。",
          "購物",
          "expedition",
          "前海嘉里中心 深圳",
          "前海合作區"
        ),
        item(
          "18:30",
          "返回海上世界",
          "回酒店過夜。唔係住桂灣。",
          "交通",
          "near",
          "海底世界 Rany Hotel 海上世界 蛇口",
          "海底世界 Rany Hotel"
        ),
      ],
    },
    "2026-10-14": {
      title: "退房 · 回程過關",
      vibe: "海上世界出發 · 深圳灣返港",
      mode: "near",
      items: [
        item(
          "10:00",
          "退房",
          "辦理退房。如要行多一陣海上世界，可先寄行李（視酒店當日安排）。",
          "住宿",
          "near",
          "海底世界 Rany Hotel 海上世界 蛇口",
          "海底世界 Rany Hotel"
        ),
        item(
          "12:00",
          "午餐",
          "回程前進食，避免過關前後捱餓。海上世界或蛇口都得。",
          "美食",
          "near",
          "海上世界食街 蛇口 深圳",
          "海上世界或蛇口"
        ),
        item(
          "14:00",
          "前往深圳灣口岸",
          "由海上世界的士或網約返深圳灣口岸。蛇口船班係備選，需另查當日時間。",
          "交通",
          "near",
          "深圳灣口岸",
          "海上世界 → 深圳灣口岸"
        ),
        item(
          "15:30",
          "回程過關：深圳灣口岸",
          "深圳灣唔係 24 小時。預留最少 60–90 分鐘過關加接駁，對住巴士尾班。",
          "交通",
          "near",
          "深圳灣口岸",
          "深圳灣口岸 → 香港"
        ),
        item(
          "17:00",
          "返回香港",
          "過關後乘巴士返港。",
          "交通",
          "near",
          "深圳灣口岸巴士",
          "深圳灣口岸巴士"
        ),
      ],
    },
  };

  const DEFAULT_CHECKLIST = [
    {
      category: "證件同過關",
      items: [
        { id: "doc-home-return", label: "回鄉證／通行證（同備份）" },
        { id: "hotel-addr", label: "海底世界 Rany Hotel／海上世界地址已存入手機" },
        { id: "return-slot", label: "已核對深圳灣 10 月 14 日回程時間，唔追尾班" },
        { id: "copies", label: "證件影本或雲端備份" },
      ],
    },
    {
      category: "支付同通訊",
      items: [
        { id: "phone-pay", label: "微信／支付寶已開通，手機有電" },
        { id: "octopus", label: "八達通有餘額（香港段）" },
        { id: "cash", label: "少量港幣同人民幣備用" },
        { id: "sim-esim", label: "漫遊／eSIM 已設定" },
      ],
    },
    {
      category: "過夜用品",
      items: [
        { id: "overnight", label: "過夜用品同換洗衣物（兩晚）" },
        { id: "charger", label: "手機充電器＋行動電源" },
        { id: "meds", label: "常用藥／常備藥" },
        { id: "light-layer", label: "薄外套（商場冷氣）" },
      ],
    },
  ];

  const state = {
    tab: "itinerary",
    dayId: "2026-10-12",
    placeFilter: "attraction",
    days: [],
    checklist: {},
    expenses: [],
    cafes: [],
    cafeRating: 0,
    expenseCategoryId: null,
    filterCategory: "all",
    budgetCny: DEFAULT_BUDGET_CNY,
    rate: { ...DEFAULT_RATE },
  };

  const els = {};

  function cacheEls() {
    Object.assign(els, {
      panels: document.querySelectorAll(".tab-panel"),
      navBtns: document.querySelectorAll(".nav-btn"),
      dayTabs: document.querySelectorAll(".day-tab"),
      placeFilters: document.querySelectorAll(".place-filter"),
      placesRoot: document.getElementById("places-root"),
      dayRange: document.getElementById("day-range"),
      dayTimeline: document.getElementById("day-timeline"),
      notesRoot: document.getElementById("notes-root"),
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
      filterCategories: document.getElementById("filter-categories"),
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

  function zoneLabel(zone) {
    return zone === "expedition" ? "前海桂灣" : "海上世界";
  }

  function zoneClass(zone) {
    return zone === "expedition" ? "zone-expedition" : "zone-near";
  }

  function buildDaysFromSample() {
    return Object.keys(SAMPLE_BY_DATE).map((id, i) => {
      const sample = SAMPLE_BY_DATE[id];
      const [y, m, d] = id.split("-").map(Number);
      return {
        id,
        index: i + 1,
        date: new Date(y, m - 1, d),
        title: sample.title,
        vibe: sample.vibe,
        mode: sample.mode,
        items: sample.items,
      };
    });
  }

  function hydrateDays(rawDays) {
    if (!Array.isArray(rawDays) || !rawDays.length) return null;
    return rawDays.map((day, i) => ({
      id: day.id || `day-${i + 1}`,
      index: Number(day.index) || i + 1,
      date: new Date(day.date || "2026-10-12"),
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
            place: entry.place || "",
          }))
        : [],
    }));
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

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadExisting(canonicalKey) {
    if (!storageHas(canonicalKey)) return null;
    return safeParse(localStorage.getItem(canonicalKey), null);
  }

  function loadOrSeed(canonicalKey, defaultValue) {
    if (storageHas(canonicalKey)) {
      return safeParse(localStorage.getItem(canonicalKey), defaultValue);
    }
    writeJSON(canonicalKey, defaultValue);
    return defaultValue;
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
    writeJSON(STORAGE_KEYS.itinerary, fresh);
    return buildDaysFromSample();
  }

  function currentDay() {
    return state.days.find((d) => d.id === state.dayId) || state.days[0];
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
    els.placesRoot.innerHTML = PLACES.filter((p) => p.category === state.placeFilter)
      .map(
        (place) => `
      <article class="rounded-2xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="rounded-full ${place.cluster === "前海桂灣" ? "zone-expedition" : "zone-near"} px-2.5 py-0.5 text-[10px] font-bold">${escapeHtml(place.cluster)}</span>
          <span class="text-[10px] font-semibold text-ink-faint">${escapeHtml(place.transit)}${place.dayHint ? ` · ${place.dayHint}` : ""}</span>
        </div>
        <h3 class="font-display text-[15px] font-bold text-ink">${escapeHtml(place.name)}</h3>
        <p class="mt-1 text-sm leading-relaxed text-ink-soft">${escapeHtml(place.detail)}</p>
        ${mapButton(place.mapsQuery)}
      </article>`
      )
      .join("");
  }

  function setDay(dayId) {
    const exists = state.days.some((d) => d.id === dayId);
    state.dayId = exists ? dayId : state.days[0].id;
    writeJSON(STORAGE_KEYS.day, state.dayId);
    els.dayTabs.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.day === state.dayId));
    renderDayTimeline();
  }

  function renderDayTimeline() {
    const day = currentDay();
    if (!day) return;
    els.dayRange.textContent = `${formatShort(day.date)} · ${day.vibe}`;
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
              ${entry.place ? `<p class="mt-0.5 text-xs font-semibold text-jade-700">${escapeHtml(entry.place)}</p>` : ""}
              <p class="mt-1 text-sm leading-relaxed text-ink-soft">${escapeHtml(entry.detail)}</p>
              ${mapButton(entry.mapsQuery)}
            </div>
          </li>`;
          })
          .join("")}
      </ol>`;
  }

  function renderNotes() {
    els.notesRoot.innerHTML = NOTES.map((note) => `<li>· ${escapeHtml(note)}</li>`).join("");
  }

  function ensureChecklistState() {
    const saved = loadExisting(STORAGE_KEYS.checklist);
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
        const rating = Math.min(5, Math.max(1, Number(cafe.rating) || 1));
        return {
          id: cafe.id || crypto.randomUUID(),
          name: String(cafe.name || "未命名"),
          area: String(cafe.area || ""),
          rating,
          tags: Array.isArray(cafe.tags) ? cafe.tags.filter(Boolean) : [],
          createdAt: Number(cafe.createdAt) || Date.now(),
        };
      })
      .filter(Boolean);
  }

  function tagBadge(tagId) {
    const def = CAFE_TAG_DEFS.find((t) => t.id === tagId);
    if (!def) return "";
    return `<span class="tag-badge ${def.badge}">${escapeHtml(def.label)}</span>`;
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

  function renderCafes() {
    const sorted = [...state.cafes].sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
    els.cafeCount.textContent = `${sorted.length} 個`;
    if (!sorted.length) {
      els.cafeList.innerHTML = `<li class="rounded-2xl border border-dashed border-jade-100 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">還沒有足跡，從海上世界或前海桂灣開始記。</li>`;
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
    writeJSON(STORAGE_KEYS.cafes, state.cafes);
    renderCafes();
  }

  function removeCafe(id) {
    state.cafes = state.cafes.filter((c) => c.id !== id);
    writeJSON(STORAGE_KEYS.cafes, state.cafes);
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

  function formatHkd(amount) {
    return `HK$ ${amount.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatCny(amount) {
    return `¥ ${Math.round(amount).toLocaleString("zh-HK")}`;
  }

  function cnyToHkd(cny) {
    return cny * state.rate.hkdPerCny;
  }

  function normalizeExpense(entry, fallbackRate) {
    if (!entry || typeof entry !== "object") return null;
    const rateFallback =
      Number.isFinite(fallbackRate) && fallbackRate > 0 ? fallbackRate : DEFAULT_RATE.hkdPerCny;
    const cny = Number(entry.cny ?? entry.amount ?? entry.thb);
    const safeCny = Number.isFinite(cny) && cny >= 0 ? cny : 0;
    const storedRate = Number(entry.storedRate ?? entry.rateUsed ?? entry.rate);
    const safeRate = Number.isFinite(storedRate) && storedRate > 0 ? storedRate : rateFallback;
    let hkd = Number(entry.hkd ?? entry.amountInHKD);
    if (!Number.isFinite(hkd)) hkd = safeCny * safeRate;
    const createdAt = Number(entry.createdAt) || Date.now();
    return {
      id: entry.id || crypto.randomUUID(),
      cny: safeCny,
      hkd,
      storedRate: safeRate,
      note: String(entry.note || entry.category || ""),
      categoryId: entry.categoryId || guessCategoryId(entry.note || entry.category),
      dayId: entry.dayId || toDateId(new Date(createdAt)),
      createdAt,
    };
  }

  function migrateExpenses(raw, fallbackRate) {
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => normalizeExpense(entry, fallbackRate)).filter(Boolean);
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
    const rate = state.rate.hkdPerCny;
    els.rateDisplay.textContent = `1 CNY = ${rate.toFixed(3)} HKD`;
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
    const cny = Number(els.expenseAmount.value);
    if (!Number.isFinite(cny) || cny <= 0) {
      els.expensePreview.textContent = "換算預覽：—";
      return;
    }
    els.expensePreview.textContent = `換算預覽：${formatCny(cny)} ≈ ${formatHkd(cnyToHkd(cny))}`;
  }

  function totalSpent() {
    return state.expenses.reduce((sum, e) => sum + (e.cny || 0), 0);
  }

  function renderExpenseSummary() {
    const spent = totalSpent();
    const remain = Math.max(0, state.budgetCny - spent);
    const hkd = state.expenses.reduce((sum, e) => sum + (e.hkd || 0), 0);
    els.expenseSummary.innerHTML = `
      <div class="rounded-3xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-bold uppercase tracking-wider text-ink-faint">已用</p>
        <p class="font-display text-xl font-bold text-ink">${formatCny(spent)}</p>
        <p class="text-xs text-ink-soft">${formatHkd(hkd)}</p>
      </div>
      <div class="rounded-3xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-bold uppercase tracking-wider text-ink-faint">剩餘預算</p>
        <p class="font-display text-xl font-bold text-jade-700">${formatCny(remain)}</p>
        <p class="text-xs text-ink-soft">預算 ${formatCny(state.budgetCny)}</p>
      </div>`;
  }

  function filteredExpenses() {
    return state.expenses.filter((entry) => {
      return state.filterCategory === "all" || entry.categoryId === state.filterCategory;
    });
  }

  function renderFilterChips() {
    els.filterCategories.innerHTML = [
      `<button type="button" class="filter-chip ${state.filterCategory === "all" ? "is-active" : ""}" data-filter-cat="all">全部</button>`,
      ...EXPENSE_CATEGORIES.map(
        (c) =>
          `<button type="button" class="filter-chip ${state.filterCategory === c.id ? "is-active" : ""}" data-filter-cat="${c.id}">${escapeHtml(c.label)}</button>`
      ),
    ].join("");
  }

  function renderExpenses() {
    renderExpenseSummary();
    renderFilterChips();
    const list = filteredExpenses();
    const catLabel = state.filterCategory === "all" ? "全部分類" : categoryLabel(state.filterCategory);
    els.expenseListMeta.textContent = `${catLabel} · ${list.length} 筆`;

    if (!list.length) {
      els.expenseList.innerHTML = `<li class="rounded-2xl border border-dashed border-jade-100 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">${
        state.expenses.length ? "此篩選條件沒有紀錄。" : "還沒有開支紀錄，點上方分類快速開始吧。"
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
            <span class="rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-ink-soft">${escapeHtml(categoryLabel(entry.categoryId))}</span>
          </div>
          <p class="text-xs text-ink-faint">${formatDateTime(entry.createdAt)}</p>
        </div>
        <div class="text-right">
          <p class="font-display font-bold text-jade-700">${formatHkd(entry.hkd)}</p>
          <p class="text-xs text-ink-soft">${formatCny(entry.cny)}</p>
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

  function addExpense(cny, note, categoryId) {
    const now = Date.now();
    const storedRate = state.rate.hkdPerCny;
    const hkd = cny * storedRate;
    state.expenses = [
      {
        id: crypto.randomUUID(),
        cny,
        hkd,
        storedRate,
        note: note.trim(),
        categoryId: categoryId || guessCategoryId(note),
        dayId: toDateId(new Date(now)),
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

  function applyRate(hkdPerCny, source) {
    state.rate = { hkdPerCny, source, updatedAt: Date.now() };
    writeJSON(STORAGE_KEYS.rate, state.rate);
    renderRate();
    updateExpensePreview();
    renderExpenses();
  }

  function loadRateFromStorage() {
    const saved = loadExisting(STORAGE_KEYS.rate);
    if (!saved || typeof saved.hkdPerCny !== "number" || !(saved.hkdPerCny > 0)) {
      state.rate = { ...DEFAULT_RATE };
      return;
    }
    state.rate = {
      hkdPerCny: saved.hkdPerCny,
      source: saved.source || "manual",
      updatedAt: saved.updatedAt || null,
    };
  }

  function loadBudget() {
    const saved = loadExisting(STORAGE_KEYS.budget);
    if (typeof saved === "number" && saved >= 0) {
      state.budgetCny = saved;
    } else if (saved === null) {
      state.budgetCny = DEFAULT_BUDGET_CNY;
      writeJSON(STORAGE_KEYS.budget, DEFAULT_BUDGET_CNY);
    } else {
      state.budgetCny = DEFAULT_BUDGET_CNY;
    }
    els.budgetInput.value = String(state.budgetCny);
  }

  function applyBudget() {
    const value = Number(els.budgetInput.value);
    if (!Number.isFinite(value) || value < 0) {
      alert("請輸入有效預算");
      return;
    }
    state.budgetCny = value;
    writeJSON(STORAGE_KEYS.budget, value);
    renderExpenses();
  }

  function applyManualRate() {
    const value = Number(els.rateInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      alert("請輸入有效的匯率數字");
      return;
    }
    applyRate(value, "manual");
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
      const res = await fetch("https://open.er-api.com/v6/latest/CNY");
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

  function bindEvents() {
    els.navBtns.forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.nav)));
    els.dayTabs.forEach((btn) => btn.addEventListener("click", () => setDay(btn.dataset.day)));
    els.placeFilters.forEach((btn) =>
      btn.addEventListener("click", () => setPlaceFilter(btn.dataset.placeFilter))
    );

    els.checklistRoot.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-check-id]");
      if (btn) toggleChecklistItem(btn.dataset.checkId);
    });
    els.checklistReset.addEventListener("click", resetChecklist);

    els.cafeStars.addEventListener("click", (e) => {
      const btn = e.target.closest(".star-btn");
      if (btn) setCafeRating(Number(btn.dataset.star));
    });
    els.cafeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (els.cafeName.value || "").trim();
      const area = (els.cafeArea.value || "").trim();
      if (!name || !area) return;
      const rating = state.cafeRating || 3;
      addCafe({
        id: crypto.randomUUID(),
        name,
        area,
        rating,
        tags: selectedCafeTags(),
        createdAt: Date.now(),
      });
      els.cafeForm.reset();
      setCafeRating(0);
      renderCafeTagInputs();
    });
    els.cafeList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cafe-id]");
      if (btn) removeCafe(btn.dataset.cafeId);
    });

    els.expenseCategories.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat-id]");
      if (btn) selectExpenseCategory(btn.dataset.catId);
    });
    els.filterCategories.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-cat]");
      if (btn) setFilterCategory(btn.dataset.filterCat);
    });
    els.expenseAmount.addEventListener("input", updateExpensePreview);
    els.expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cny = Number(els.expenseAmount.value);
      if (!Number.isFinite(cny) || cny <= 0) return;
      addExpense(cny, els.expenseNote.value || categoryLabel(state.expenseCategoryId), state.expenseCategoryId);
      els.expenseAmount.value = "";
      updateExpensePreview();
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

  function pickInitialDay() {
    const saved = loadExisting(STORAGE_KEYS.day);
    if (saved && state.days.some((d) => d.id === saved)) return saved;
    const today = toDateId(new Date());
    if (state.days.some((d) => d.id === today)) return today;
    return state.days[0].id;
  }

  function init() {
    cacheEls();
    state.days = loadItineraryDays();
    loadRateFromStorage();

    const loadedExpenses = loadOrSeed(STORAGE_KEYS.expenses, []);
    state.expenses = migrateExpenses(loadedExpenses, state.rate.hkdPerCny);
    if (Array.isArray(loadedExpenses) && loadedExpenses.length) {
      writeJSON(STORAGE_KEYS.expenses, state.expenses);
    }

    const loadedCafes = loadOrSeed(STORAGE_KEYS.cafes, []);
    state.cafes = migrateCafes(loadedCafes);
    if (Array.isArray(loadedCafes) && loadedCafes.length) {
      writeJSON(STORAGE_KEYS.cafes, state.cafes);
    }

    ensureChecklistState();
    loadBudget();
    renderCafeTagInputs();
    renderChecklist();
    renderPlaces();
    renderCafes();
    renderExpenseCategories();
    renderRate();
    renderExpenses();
    updateExpensePreview();
    renderNotes();
    bindEvents();

    const savedTab = loadExisting(STORAGE_KEYS.tab) || "itinerary";
    const validTabs = ["itinerary", "checklist", "cafelog", "expense"];
    setTab(validTabs.includes(savedTab) ? savedTab : "itinerary");
    setDay(pickInitialDay());

    fetchLiveRate();
    setInterval(() => fetchLiveRate(), RATE_TTL_MS);
  }

  init();
})();
