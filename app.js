(() => {
  "use strict";

  const STORAGE_KEYS = {
    checklist: "trip-companion:checklist-v1",
    expenses: "trip-companion:expenses-v1",
    rate: "trip-companion:fx-rate-v1",
    tab: "trip-companion:active-tab-v1",
    week: "trip-companion:active-week-v1",
    day: "trip-companion:active-day-v1",
  };

  const DEFAULT_RATE = {
    hkdPerTwd: 0.24,
    source: "manual",
    updatedAt: null,
  };

  const RATE_TTL_MS = 12 * 60 * 60 * 1000;
  const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

  /**
   * Base: 信義區 · 捷運永春站
   * near = 走路／極近（約 95% 日常）
   * expedition = 需搭藍線／紅線等大眾運輸（約 5% 遠征）
   */
  const PLACES = [
    // —— 95% 落樓即到 ——
    {
      id: "yongchun-alleys",
      zone: "near",
      category: "Cafe",
      name: "永春站周邊巷弄 Cafe",
      detail: "松山路、永吉路、虎林街一帶獨立咖啡與早午餐，落樓步行即可。",
      transit: "走路 3–10 分",
    },
    {
      id: "skm-a4",
      zone: "near",
      category: "商場",
      name: "新光三越 A4（美食街）",
      detail: "信義商圈經典美食據點，適合午餐／晚餐快速補給。",
      transit: "走路約 12–18 分 · 或藍線永春→市政府 1 站",
    },
    {
      id: "skm-a8",
      zone: "near",
      category: "商場",
      name: "新光三越 A8",
      detail: "時尚與生活選品，連通道可串其他信義館別。",
      transit: "步行可達信義商圈核心",
    },
    {
      id: "skm-a9",
      zone: "near",
      category: "商場",
      name: "新光三越 A9",
      detail: "與 A8／A11 串連，雨天室內逛街路線首選。",
      transit: "步行可達",
    },
    {
      id: "skm-a11",
      zone: "near",
      category: "商場",
      name: "新光三越 A11",
      detail: "生活雜貨與餐飲選擇多，適合半日慢慢逛。",
      transit: "步行可達",
    },
    {
      id: "breeze-xinyi",
      zone: "near",
      category: "商場",
      name: "微風信義",
      detail: "信義路側逛街點，傍晚燈光好看。",
      transit: "步行可達",
    },
    {
      id: "breeze-nanshan",
      zone: "near",
      category: "商場",
      name: "微風南山",
      detail: "高空與商場複合，適合下午茶與夜景。",
      transit: "步行可達 · 近 101",
    },
    {
      id: "fe-a13",
      zone: "near",
      category: "商場",
      name: "遠東百貨信義 A13",
      detail: "信義商圈另一端，可與 101、微風串成一圈。",
      transit: "步行可達",
    },
    {
      id: "taipei-101",
      zone: "near",
      category: "地標",
      name: "台北 101",
      detail: "展望台、商場與周邊廣場，信義區必走一圈。",
      transit: "走路約 15–25 分 · 或藍線市政府站",
    },
    {
      id: "songshan-crepark",
      zone: "near",
      category: "文創",
      name: "松山文創園區",
      detail: "倉庫園區、展覽與 Cafe，永春／市政府方向都方便。",
      transit: "走路或短程捷運／公車",
    },

    // —— 5% 遠征（藍／紅線）——
    {
      id: "chifeng",
      zone: "expedition",
      category: "Cafe",
      name: "中山 · 赤峰街文青 Cafe 圈",
      detail: "獨立咖啡、選物店與巷弄散步，適合半日遠征。",
      transit: "藍線永春→忠孝新生→轉橘線或走路至中山；或藍線到台北車站轉紅線中山",
    },
    {
      id: "zhongshan-linear",
      zone: "expedition",
      category: "漫步",
      name: "中山線性公園／雙連巷弄",
      detail: "赤峰街延伸散步，傍晚氣氛佳。",
      transit: "紅線中山／雙連站",
    },
    {
      id: "east-district",
      zone: "expedition",
      category: "商圈",
      name: "東區 · 忠孝敦化商圈",
      detail: "忠孝東路四段、敦化南路百貨與巷弄 Cafe。",
      transit: "藍線永春→忠孝敦化（約 2–3 站）",
    },
    {
      id: "dinghao",
      zone: "expedition",
      category: "商場",
      name: "忠孝復興／頂好商圈",
      detail: "東區逛街延伸，可接忠孝敦化一起走。",
      transit: "藍線忠孝復興站",
    },
    {
      id: "dadaocheng",
      zone: "expedition",
      category: "Cafe",
      name: "大稻埕老宅 Cafe",
      detail: "迪化街老屋咖啡、選物與河岸散步。",
      transit: "藍線至西門或北門方向，再轉公車／走路；或紅線至台北車站再接",
    },
    {
      id: "dihua",
      zone: "expedition",
      category: "文化",
      name: "迪化街 · 大稻埕碼頭",
      detail: "老街、中藥行與碼頭夜景，安排一日足夠。",
      transit: "大眾運輸往北門／大橋頭一帶",
    },
  ];

  /** Sample days keyed by YYYY-MM-DD — mostly near-base, sparse expeditions. */
  const SAMPLE_BY_DATE = {
    "2026-08-07": {
      title: "抵達 · 永春安頓",
      vibe: "落樓即到 · 熟悉基地",
      mode: "near",
      items: [
        {
          time: "12:00",
          title: "抵達並入住信義（永春站）",
          detail: "機場捷運／公車進城後，以捷運永春站為基地 check-in。",
          tag: "交通",
          zone: "near",
        },
        {
          time: "16:00",
          title: "永春巷弄散步採買",
          detail: "松山路、永吉路找超商／全聯，順便瞄準幾間巷弄 Cafe。",
          tag: "生活",
          zone: "near",
        },
        {
          time: "19:00",
          title: "信義商圈輕鬆晚餐",
          detail: "新光三越 A4 美食街或附近餐廳，別走太遠。",
          tag: "美食",
          zone: "near",
        },
      ],
    },
    "2026-08-08": {
      title: "信義商圈步行日",
      vibe: "落樓即到 · 百貨連通",
      mode: "near",
      items: [
        {
          time: "11:00",
          title: "新光三越 A8 / A9 / A11",
          detail: "雨天友善：館別連通，慢慢逛生活雜貨與時尚。",
          tag: "商場",
          zone: "near",
        },
        {
          time: "14:00",
          title: "微風信義 · 微風南山",
          detail: "午餐後轉南山，適合下午茶與室內走走。",
          tag: "商場",
          zone: "near",
        },
        {
          time: "17:30",
          title: "台北 101 廣場夜景",
          detail: "步行串到 101 與遠百 A13，看信義區亮燈。",
          tag: "地標",
          zone: "near",
        },
      ],
    },
    "2026-08-09": {
      title: "永春 Cafe · 松菸",
      vibe: "落樓即到 · 慢節奏",
      mode: "near",
      items: [
        {
          time: "10:30",
          title: "永春站周邊特色巷弄 Cafe",
          detail: "虎林街／永吉路選一間坐上午，當長住的第一間常客店。",
          tag: "Cafe",
          zone: "near",
        },
        {
          time: "14:00",
          title: "松山文創園區",
          detail: "倉庫園區散步、看展、再找一間園區 Cafe。",
          tag: "文創",
          zone: "near",
        },
        {
          time: "18:30",
          title: "回永春站附近晚餐",
          detail: "不必進市區核心，落樓找巷弄小吃即可。",
          tag: "美食",
          zone: "near",
        },
      ],
    },
    "2026-08-10": {
      title: "A4 美食 · 信義夜逛",
      vibe: "落樓即到",
      mode: "near",
      items: [
        {
          time: "12:00",
          title: "新光三越 A4 美食街",
          detail: "信義商圈補給站，適合試幾樣台灣味。",
          tag: "美食",
          zone: "near",
        },
        {
          time: "15:00",
          title: "遠東百貨信義 A13",
          detail: "與 101 同側逛一圈，補日用品或伴手禮清單。",
          tag: "商場",
          zone: "near",
        },
      ],
    },
    "2026-08-14": {
      title: "遠征 · 赤峰街 Cafe",
      vibe: "5% 遠征 · 紅／藍線",
      mode: "expedition",
      items: [
        {
          time: "10:30",
          title: "永春站出發（藍線）",
          detail: "藍線往西，轉乘至中山站一帶；預留轉車時間。",
          tag: "交通",
          zone: "expedition",
        },
        {
          time: "12:00",
          title: "赤峰街文青 Cafe 圈",
          detail: "獨立咖啡、選物店與巷弄，半日足夠，別排太滿。",
          tag: "Cafe",
          zone: "expedition",
        },
        {
          time: "16:00",
          title: "中山線性公園散步後回程",
          detail: "傍晚前回永春，晚上在信義落樓解決晚餐。",
          tag: "漫步",
          zone: "expedition",
        },
      ],
    },
    "2026-08-15": {
      title: "信義恢復日",
      vibe: "落樓即到 · 充電",
      mode: "near",
      items: [
        {
          time: "11:00",
          title: "永春巷弄早午餐",
          detail: "遠征隔天放慢，只走步行圈。",
          tag: "Cafe",
          zone: "near",
        },
        {
          time: "15:00",
          title: "微風南山或 101 商場",
          detail: "冷氣商場躲午後雷陣雨。",
          tag: "商場",
          zone: "near",
        },
      ],
    },
    "2026-08-21": {
      title: "遠征 · 忠孝敦化東區",
      vibe: "5% 遠征 · 藍線直達",
      mode: "expedition",
      items: [
        {
          time: "11:00",
          title: "藍線永春 → 忠孝敦化",
          detail: "約 2–3 站即到東區，不用轉車。",
          tag: "交通",
          zone: "expedition",
        },
        {
          time: "12:00",
          title: "忠孝敦化商圈 · 巷弄 Cafe",
          detail: "敦化南路、忠孝東路四段百貨與獨立咖啡。",
          tag: "商圈",
          zone: "expedition",
        },
        {
          time: "16:30",
          title: "忠孝復興延伸（可選）",
          detail: "有體力再往頂好商圈；累了就藍線回永春。",
          tag: "商場",
          zone: "expedition",
        },
      ],
    },
    "2026-08-22": {
      title: "松菸 · 信義室內日",
      vibe: "落樓即到",
      mode: "near",
      items: [
        {
          time: "11:00",
          title: "松山文創園區半日",
          detail: "展覽＋園區 Cafe，距離基地近。",
          tag: "文創",
          zone: "near",
        },
        {
          time: "16:00",
          title: "新光三越 A9 / A11 逛街",
          detail: "補長住日用品，走連通館別不怕熱。",
          tag: "商場",
          zone: "near",
        },
      ],
    },
    "2026-08-28": {
      title: "遠征 · 大稻埕老宅 Cafe",
      vibe: "5% 遠征 · 老台北",
      mode: "expedition",
      items: [
        {
          time: "10:30",
          title: "捷運往大稻埕／迪化街",
          detail: "藍線西行後接公車或轉站，安排半日至一日。",
          tag: "交通",
          zone: "expedition",
        },
        {
          time: "12:00",
          title: "大稻埕老宅 Cafe",
          detail: "老屋咖啡、選物；中午避開最熱時段戶外曝曬。",
          tag: "Cafe",
          zone: "expedition",
        },
        {
          time: "15:30",
          title: "迪化街 · 碼頭散步",
          detail: "年貨街與河岸走一圈，傍晚前藍線／公車回永春。",
          tag: "文化",
          zone: "expedition",
        },
      ],
    },
    "2026-08-29": {
      title: "信義商圈伴手禮勘查",
      vibe: "落樓即到",
      mode: "near",
      items: [
        {
          time: "11:00",
          title: "A8 / A11 / 微風信義比價",
          detail: "列出想買的伴手禮，先勘查不急著結帳。",
          tag: "購物",
          zone: "near",
        },
        {
          time: "15:00",
          title: "永春站 Cafe 整理清單",
          detail: "坐下來消化一天，維持 95% 落樓節奏。",
          tag: "Cafe",
          zone: "near",
        },
      ],
    },
    "2026-09-05": {
      title: "信義收尾 · 伴手禮",
      vibe: "落樓即到",
      mode: "near",
      items: [
        {
          time: "11:00",
          title: "信義商圈一次買齊",
          detail: "新光三越、微風、101、遠百 A13 擇一主力戰場。",
          tag: "購物",
          zone: "near",
        },
        {
          time: "15:00",
          title: "回永春整理行李",
          detail: "檢查證件、充電器，落樓解決最後一餐。",
          tag: "生活",
          zone: "near",
        },
        {
          time: "19:00",
          title: "告別晚餐（信義）",
          detail: "回訪這個月最常去的那間巷弄店或 A4。",
          tag: "美食",
          zone: "near",
        },
      ],
    },
    "2026-09-06": {
      title: "返程日",
      vibe: "永春出發",
      mode: "near",
      items: [
        {
          time: "依航班",
          title: "永春站出發往機場",
          detail: "藍線轉機場捷運或預留計程車時間，旅途愉快。",
          tag: "交通",
          zone: "near",
        },
      ],
    },
  };

  const WEEK_META = {
    1: { label: "Week 1", hint: "永春安頓 · 信義步行" },
    2: { label: "Week 2", hint: "落樓日常 · 一次遠征" },
    3: { label: "Week 3", hint: "信義深度 · 東區遠征" },
    4: { label: "Week 4", hint: "大稻埕一日 · 收心返程" },
  };

  const DEFAULT_CHECKLIST = [
    {
      category: "證件與金錢",
      items: [
        { id: "id-docs", label: "身分證件 / 回程機票" },
        { id: "easycard", label: "悠遊卡（永春站藍線常用）" },
        { id: "cash-card", label: "現金與信用卡" },
        { id: "stay-info", label: "信義區酒店地址（近永春站）" },
      ],
    },
    {
      category: "長住必備",
      items: [
        { id: "meds", label: "常備藥與個人用品" },
        { id: "adapter", label: "充電器 / 延長線" },
        { id: "laundry", label: "洗衣相關（或確認住處有洗衣機）" },
        { id: "weather", label: "薄外套、雨具（午後雷陣雨）" },
        { id: "work", label: "筆電 / 工作用品（如需要）" },
        { id: "walk-shoes", label: "好走的鞋（信義商圈常走路）" },
      ],
    },
    {
      category: "日常與健康",
      items: [
        { id: "toiletries", label: "盥洗與防曬" },
        { id: "clothes", label: "足夠換洗衣物" },
        { id: "bottle", label: "環保杯 / 水壺" },
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
    rate: { ...DEFAULT_RATE },
  };

  const els = {
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
    rateDisplay: document.getElementById("rate-display"),
    rateMeta: document.getElementById("rate-meta"),
    rateRefresh: document.getElementById("rate-refresh"),
    rateInput: document.getElementById("rate-input"),
    rateApply: document.getElementById("rate-apply"),
    expenseForm: document.getElementById("expense-form"),
    expenseAmount: document.getElementById("expense-amount"),
    expenseNote: document.getElementById("expense-note"),
    expensePreview: document.getElementById("expense-preview"),
    expenseTotal: document.getElementById("expense-total"),
    expenseTotalTwd: document.getElementById("expense-total-twd"),
    expenseList: document.getElementById("expense-list"),
    expenseClear: document.getElementById("expense-clear"),
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toDateId(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateId(id) {
    const [y, m, d] = id.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatShort(date) {
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAY_LABELS[date.getDay()]}）`;
  }

  function formatRange(start, end) {
    return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
  }

  function weekOf(date) {
    const start = new Date(2026, 7, 7); // Aug 7
    const diffDays = Math.floor((date - start) / 86400000);
    if (diffDays < 7) return 1;
    if (diffDays < 14) return 2;
    if (diffDays < 21) return 3;
    return 4;
  }

  function buildDays() {
    const days = [];
    const cursor = new Date(2026, 7, 7);
    const end = new Date(2026, 8, 6);
    let index = 1;
    const nearNames = PLACES.filter((p) => p.zone === "near")
      .slice(0, 3)
      .map((p) => p.name)
      .join("、");

    while (cursor <= end) {
      const id = toDateId(cursor);
      const sample = SAMPLE_BY_DATE[id];
      days.push({
        id,
        index,
        week: weekOf(cursor),
        date: new Date(cursor),
        title: sample?.title || `Day ${index} · 永春自由日`,
        vibe: sample?.vibe || "落樓即到 · 95% 日常",
        mode: sample?.mode || "near",
        items: sample?.items || [
          {
            time: "上午",
            title: "永春巷弄 Cafe 或信義商圈",
            detail: `推薦：${nearNames}。以走路為主，維持長住節奏。`,
            tag: "彈性",
            zone: "near",
          },
          {
            time: "下午",
            title: "松菸／101／新光三越擇一",
            detail: "午後雷陣雨就進商場；天氣好可去松山文創園區。",
            tag: "落樓即到",
            zone: "near",
          },
        ],
      });
      cursor.setDate(cursor.getDate() + 1);
      index += 1;
    }
    return days;
  }

  function zoneLabel(zone) {
    return zone === "expedition" ? "遠征 5%" : "落樓即到";
  }

  function zoneClass(zone) {
    return zone === "expedition" ? "zone-expedition" : "zone-near";
  }

  function setPlaceFilter(filter) {
    state.placeFilter = filter;
    els.placeFilters.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.placeFilter === filter);
    });
    renderPlaces();
  }

  function renderPlaces() {
    const list = PLACES.filter((p) => p.zone === state.placeFilter);
    els.placesRoot.innerHTML = list
      .map(
        (place) => `
      <article class="rounded-2xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="rounded-full ${zoneClass(place.zone)} px-2.5 py-0.5 text-[10px] font-bold">
            ${place.category}
          </span>
          <span class="text-[10px] font-semibold text-ink-faint">${place.transit}</span>
        </div>
        <h3 class="font-display text-[15px] font-bold text-ink">${place.name}</h3>
        <p class="mt-1 text-sm leading-relaxed text-ink-soft">${place.detail}</p>
      </article>`
      )
      .join("");
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatHkd(amount) {
    return `HK$ ${amount.toLocaleString("en-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatTwd(amount) {
    return `NT$ ${Math.round(amount).toLocaleString("zh-TW")}`;
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

  function twdToHkd(twd) {
    return twd * state.rate.hkdPerTwd;
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

    els.navBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.nav === tab);
    });
  }

  function setWeek(week, { preserveDay = false } = {}) {
    state.week = week;
    writeJSON(STORAGE_KEYS.week, week);

    els.weekTabs.forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.week) === week);
    });

    const inWeek = daysInWeek(week);
    const start = inWeek[0].date;
    const end = inWeek[inWeek.length - 1].date;
    els.weekRange.textContent = `${WEEK_META[week].hint} · ${formatRange(start, end)} · ${inWeek.length} 天`;

    const keep =
      preserveDay && inWeek.some((d) => d.id === state.dayId) ? state.dayId : inWeek[0].id;
    setDay(keep);
  }

  function setDay(dayId) {
    state.dayId = dayId;
    writeJSON(STORAGE_KEYS.day, dayId);
    renderDaySelect();
    renderDayTimeline();
  }

  function renderDaySelect() {
    const inWeek = daysInWeek(state.week);
    els.daySelect.innerHTML = inWeek
      .map((day) => {
        const selected = day.id === state.dayId ? "selected" : "";
        return `<option value="${day.id}" ${selected}>Day ${day.index} · ${formatShort(day.date)} · ${
          day.mode === "expedition" ? "遠征 · " : ""
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
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-jade-600 font-display text-sm font-bold text-white shadow-soft">
          D${day.index}
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex flex-wrap items-center gap-2">
            <span class="rounded-full ${zoneClass(mode)} px-2.5 py-0.5 text-[10px] font-bold">
              ${zoneLabel(mode)}
            </span>
          </div>
          <h3 class="font-display text-lg font-bold text-ink">${day.title}</h3>
          <p class="text-sm text-ink-soft">${formatShort(day.date)} · ${day.vibe}</p>
        </div>
      </div>
      <ol class="relative ml-5 space-y-4 border-l-2 border-jade-100 pl-6">
        ${day.items
          .map((item, i) => {
            const z = item.zone || mode;
            return `
          <li class="relative">
            <span class="absolute -left-[1.95rem] top-1.5 flex h-3.5 w-3.5 items-center justify-center">
              <span class="h-3.5 w-3.5 rounded-full border-[3px] border-white ${
                z === "expedition" ? "bg-coral" : "bg-jade-500"
              } shadow-sm ${i === 0 ? "ring-4 ring-jade-500/15" : ""}"></span>
            </span>
            <div class="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
              <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
                <time class="text-xs font-bold tracking-wide text-jade-600">${item.time}</time>
                <div class="flex flex-wrap gap-1.5">
                  <span class="rounded-full ${zoneClass(z)} px-2 py-0.5 text-[10px] font-semibold">${zoneLabel(z)}</span>
                  <span class="rounded-full bg-jade-50 px-2.5 py-0.5 text-[10px] font-semibold text-jade-700">${item.tag}</span>
                </div>
              </div>
              <h4 class="font-display text-base font-bold text-ink">${item.title}</h4>
              <p class="mt-1 text-sm leading-relaxed text-ink-soft">${item.detail}</p>
            </div>
          </li>`;
          })
          .join("")}
      </ol>
    `;
  }

  function ensureChecklistState() {
    const saved = readJSON(STORAGE_KEYS.checklist, null);
    const next = {};
    DEFAULT_CHECKLIST.forEach((group) => {
      group.items.forEach((item) => {
        next[item.id] = Boolean(saved && saved[item.id]);
      });
    });
    state.checklist = next;
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
        <h3 class="mb-2 px-1 text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">
          ${group.category}
        </h3>
        <ul class="overflow-hidden rounded-3xl bg-white/85 shadow-soft backdrop-blur divide-y divide-jade-50">
          ${group.items
            .map((item) => {
              const checked = state.checklist[item.id];
              return `
              <li>
                <button
                  type="button"
                  class="checklist-item ${checked ? "is-checked" : ""} flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left active:bg-jade-50/60 transition"
                  data-check-id="${item.id}"
                >
                  <span class="check-box flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-jade-200 text-sm font-bold transition">
                    ${checked ? "✓" : ""}
                  </span>
                  <span class="item-label text-[15px] font-medium text-ink">${item.label}</span>
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

  function renderRate() {
    const rate = state.rate.hkdPerTwd;
    els.rateDisplay.textContent = `1 TWD = ${rate.toFixed(3)} HKD`;
    els.rateInput.value = String(Number(rate.toFixed(4)));

    if (state.rate.source === "live" && state.rate.updatedAt) {
      const nextAt = state.rate.updatedAt + RATE_TTL_MS;
      els.rateMeta.textContent = `線上更新 ${formatDateTime(state.rate.updatedAt)} · 下次約 ${formatDateTime(nextAt)}`;
    } else if (state.rate.source === "manual" && state.rate.updatedAt) {
      els.rateMeta.textContent = `手動設定於 ${formatDateTime(state.rate.updatedAt)}`;
    } else {
      els.rateMeta.textContent = "預設匯率 · 可手動調整 · 每 12 小時自動更新";
    }
  }

  function updateExpensePreview() {
    const twd = Number(els.expenseAmount.value);
    if (!Number.isFinite(twd) || twd <= 0) {
      els.expensePreview.textContent = "換算預覽：—";
      return;
    }
    els.expensePreview.textContent = `換算預覽：${formatTwd(twd)} ≈ ${formatHkd(twdToHkd(twd))}`;
  }

  function renderExpenses() {
    const totalTwd = state.expenses.reduce((sum, item) => sum + item.twd, 0);
    const totalHkd = state.expenses.reduce((sum, item) => sum + item.hkd, 0);

    els.expenseTotal.textContent = formatHkd(totalHkd);
    els.expenseTotalTwd.textContent = formatTwd(totalTwd);

    if (!state.expenses.length) {
      els.expenseList.innerHTML = `
        <li class="rounded-2xl border border-dashed border-jade-100 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">
          還沒有開支紀錄，從第一杯手搖開始吧。
        </li>`;
      return;
    }

    els.expenseList.innerHTML = state.expenses
      .map(
        (item) => `
      <li class="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-ink">${item.note || "未命名開支"}</p>
          <p class="text-xs text-ink-faint">${formatDateTime(item.createdAt)}</p>
        </div>
        <div class="text-right">
          <p class="font-display font-bold text-jade-700">${formatHkd(item.hkd)}</p>
          <p class="text-xs text-ink-soft">${formatTwd(item.twd)}</p>
        </div>
        <button
          type="button"
          class="min-h-10 min-w-10 rounded-xl text-ink-faint hover:bg-jade-50 active:scale-95 transition"
          data-expense-id="${item.id}"
          aria-label="刪除開支"
        >✕</button>
      </li>`
      )
      .join("");
  }

  function addExpense(twd, note) {
    const entry = {
      id: crypto.randomUUID(),
      twd,
      hkd: twdToHkd(twd),
      rateUsed: state.rate.hkdPerTwd,
      note: note.trim(),
      createdAt: Date.now(),
    };
    state.expenses = [entry, ...state.expenses];
    writeJSON(STORAGE_KEYS.expenses, state.expenses);
    renderExpenses();
  }

  function removeExpense(id) {
    state.expenses = state.expenses.filter((item) => item.id !== id);
    writeJSON(STORAGE_KEYS.expenses, state.expenses);
    renderExpenses();
  }

  function clearExpenses() {
    state.expenses = [];
    writeJSON(STORAGE_KEYS.expenses, state.expenses);
    renderExpenses();
  }

  function applyRate(hkdPerTwd, source) {
    state.rate = {
      hkdPerTwd,
      source,
      updatedAt: Date.now(),
    };
    writeJSON(STORAGE_KEYS.rate, state.rate);
    renderRate();
    updateExpensePreview();
  }

  function loadRateFromStorage() {
    const saved = readJSON(STORAGE_KEYS.rate, null);
    if (!saved || typeof saved.hkdPerTwd !== "number") {
      state.rate = { ...DEFAULT_RATE };
      return;
    }
    state.rate = {
      hkdPerTwd: saved.hkdPerTwd,
      source: saved.source || "manual",
      updatedAt: saved.updatedAt || null,
    };
  }

  function isRateFresh() {
    return (
      (state.rate.source === "live" || state.rate.source === "manual") &&
      typeof state.rate.updatedAt === "number" &&
      state.rate.source === "live" &&
      Date.now() - state.rate.updatedAt < RATE_TTL_MS
    );
  }

  async function fetchLiveRate({ force = false } = {}) {
    if (!force && isRateFresh()) {
      renderRate();
      return;
    }

    // Don't overwrite a freshly manual rate unless user forces refresh.
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
      const res = await fetch("https://open.er-api.com/v6/latest/TWD");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hkd = data?.rates?.HKD;
      if (typeof hkd !== "number" || hkd <= 0) throw new Error("Missing HKD rate");
      applyRate(hkd, "live");
    } catch (err) {
      console.warn("FX update failed, keeping current rate.", err);
      if (!state.rate.updatedAt) {
        state.rate = { ...DEFAULT_RATE, updatedAt: Date.now() };
        writeJSON(STORAGE_KEYS.rate, state.rate);
      }
      renderRate();
      els.rateMeta.textContent =
        state.rate.source === "live"
          ? `更新失敗，沿用上次匯率（${formatDateTime(state.rate.updatedAt)}）`
          : "更新失敗，使用目前顯示的匯率";
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
    els.navBtns.forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.nav));
    });

    els.weekTabs.forEach((btn) => {
      btn.addEventListener("click", () => setWeek(Number(btn.dataset.week)));
    });

    els.placeFilters.forEach((btn) => {
      btn.addEventListener("click", () => setPlaceFilter(btn.dataset.placeFilter));
    });

    els.daySelect.addEventListener("change", (event) => {
      setDay(event.target.value);
    });

    els.checklistRoot.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-check-id]");
      if (!btn) return;
      toggleChecklistItem(btn.dataset.checkId);
    });

    els.checklistReset.addEventListener("click", () => {
      if (confirm("確定要重設所有勾選狀態嗎？")) resetChecklist();
    });

    els.expenseAmount.addEventListener("input", updateExpensePreview);
    els.expenseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const twd = Number(els.expenseAmount.value);
      if (!Number.isFinite(twd) || twd <= 0) return;
      addExpense(twd, els.expenseNote.value);
      els.expenseForm.reset();
      updateExpensePreview();
    });

    els.expenseList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-expense-id]");
      if (!btn) return;
      removeExpense(btn.dataset.expenseId);
    });

    els.expenseClear.addEventListener("click", () => {
      if (!state.expenses.length) return;
      if (confirm("確定清空所有開支紀錄嗎？")) clearExpenses();
    });

    els.rateRefresh.addEventListener("click", () => fetchLiveRate({ force: true }));
    els.rateApply.addEventListener("click", applyManualRate);
    els.rateInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyManualRate();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") fetchLiveRate();
    });
  }

  function init() {
    state.days = buildDays();
    state.expenses = readJSON(STORAGE_KEYS.expenses, []);
    ensureChecklistState();
    loadRateFromStorage();

    const savedTab = readJSON(STORAGE_KEYS.tab, "itinerary");
    const savedWeek = Number(readJSON(STORAGE_KEYS.week, 1)) || 1;
    const savedDay = readJSON(STORAGE_KEYS.day, null);

    renderChecklist();
    renderPlaces();
    renderRate();
    renderExpenses();
    updateExpensePreview();
    bindEvents();

    setTab(["itinerary", "checklist", "expense"].includes(savedTab) ? savedTab : "itinerary");

    const week = [1, 2, 3, 4].includes(savedWeek) ? savedWeek : 1;
    state.dayId = savedDay;
    setWeek(week, { preserveDay: true });

    fetchLiveRate();
    setInterval(() => fetchLiveRate(), RATE_TTL_MS);
  }

  init();
})();
