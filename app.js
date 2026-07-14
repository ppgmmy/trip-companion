(() => {
  "use strict";

  const STORAGE_KEYS = {
    checklist: "trip-companion:checklist-v2",
    expenses: "trip-companion:expenses-v2",
    cafes: "trip-companion:cafes-v2",
    rate: "trip-companion:fx-rate-v1",
    budget: "trip-companion:budget-v1",
    tab: "trip-companion:active-tab-v1",
    week: "trip-companion:active-week-v1",
    day: "trip-companion:active-day-v1",
  };

  const DEFAULT_RATE = { hkdPerTwd: 0.24, source: "manual", updatedAt: null };
  const DEFAULT_BUDGET_TWD = 60000;
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

  const PLACES = [
    {
      id: "coffee-water",
      zone: "near",
      category: "Cafe",
      name: "Coffee Water（永春）",
      detail: "永春站周邊人氣獨立咖啡，適合早上開筆電。",
      transit: "走路約 5–10 分",
      mapsQuery: "Coffee Water Yongchun Taipei",
    },
    {
      id: "out-of-office",
      zone: "near",
      category: "Cafe",
      name: "Out of Office（永春／信義）",
      detail: "巷弄質感 Cafe，適合午後久坐。",
      transit: "走路可達",
      mapsQuery: "Out of Office cafe Taipei Xinyi Yongchun",
    },
    {
      id: "skm-a4",
      zone: "near",
      category: "商場",
      name: "新光三越 A4",
      detail: "信義美食街與逛街起點。",
      transit: "步行／藍線市政府",
      mapsQuery: "Shin Kong Mitsukoshi A4 Xinyi Taipei",
    },
    {
      id: "skm-a8",
      zone: "near",
      category: "商場",
      name: "新光三越 A8 / A9 / A11",
      detail: "雨天連通百貨路線。",
      transit: "步行可達",
      mapsQuery: "Shin Kong Mitsukoshi A11 Xinyi Taipei",
    },
    {
      id: "breeze-nanshan",
      zone: "near",
      category: "商場",
      name: "微風南山",
      detail: "高空景觀與下午茶。",
      transit: "步行 · 近 101",
      mapsQuery: "Breeze Nan Shan Taipei",
    },
    {
      id: "bellavita",
      zone: "near",
      category: "商場",
      name: "BELLAVITA 寶麗廣場",
      detail: "信義精品與氛圍逛街。",
      transit: "步行可達",
      mapsQuery: "BELLAVITA Taipei Xinyi",
    },
    {
      id: "eslite",
      zone: "near",
      category: "書店",
      name: "誠品信義",
      detail: "書區、選品與深夜能量補給。",
      transit: "步行可達",
      mapsQuery: "Eslite Bookstore Xinyi Taipei",
    },
    {
      id: "taipei-101",
      zone: "near",
      category: "地標",
      name: "台北 101",
      detail: "商場與廣場夜景。",
      transit: "步行可達",
      mapsQuery: "Taipei 101",
    },
    {
      id: "songshan-crepark",
      zone: "near",
      category: "文創",
      name: "松山文創園區",
      detail: "展覽、市集與園區 Cafe。",
      transit: "短程步行／公車",
      mapsQuery: "Songshan Cultural and Creative Park Taipei",
    },
    {
      id: "chifeng",
      zone: "expedition",
      category: "Cafe",
      name: "赤峰街 Cafe 圈",
      detail: "中山文青巷弄半日遠征。",
      transit: "藍／紅線至中山",
      mapsQuery: "Chifeng Street cafe Zhongshan Taipei",
    },
    {
      id: "huashan",
      zone: "expedition",
      category: "文創",
      name: "華山 1914 文創園區",
      detail: "展覽與園區散步，藍線可達。",
      transit: "藍線善導寺／忠孝新生再步行",
      mapsQuery: "Huashan 1914 Creative Park Taipei",
    },
  ];

  /** Every day Aug 7 – Sep 6, 2026 — no free-day placeholders. */
  const SAMPLE_BY_DATE = {
    "2026-08-07": {
      title: "抵達 · 永春 check-in",
      vibe: "落樓即到 · 安頓基地",
      mode: "near",
      items: [
        item("12:00", "捷運永春站報到", "機場捷運／公車進城，入住信義區酒店。", "交通", "near", "Yongchun MRT Station Taipei"),
        item("16:00", "永春巷弄採買", "松山路／永吉路超商、全聯補日用品。", "生活", "near", "Yongji Road Yongchun Taipei"),
        item("19:00", "新光三越 A4 晚餐", "第一餐不走遠，A4 美食街解決。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
      ],
    },
    "2026-08-08": {
      title: "信義百貨連通日",
      vibe: "落樓即到 · A8–A11",
      mode: "near",
      items: [
        item("11:00", "新光三越 A8 / A9", "雨天友善室內連通，慢慢逛時尚與生活選品。", "商場", "near", "Shin Kong Mitsukoshi A8 Xinyi Taipei"),
        item("14:30", "新光三越 A11", "雜貨、餐飲與伴手禮初步勘查。", "商場", "near", "Shin Kong Mitsukoshi A11 Taipei"),
        item("18:30", "信義路側散步晚餐", "回永春前在信義吃一頓輕鬆的。", "美食", "near", "Xinyi Road restaurants Taipei"),
      ],
    },
    "2026-08-09": {
      title: "Coffee Water · 松菸",
      vibe: "落樓即到 · Cafe＋文創",
      mode: "near",
      items: [
        item("10:30", "Coffee Water 早咖啡", "永春站周邊開張，試當長住常客店。", "Cafe", "near", "Coffee Water Yongchun Taipei"),
        item("14:00", "松山文創園區", "倉庫園區散步、看展、園區 Cafe。", "文創", "near", "Songshan Cultural and Creative Park Taipei"),
        item("19:00", "永春巷弄晚餐", "落樓找小吃，早點回酒店休息。", "美食", "near", "restaurants near Yongchun Station Taipei"),
      ],
    },
    "2026-08-10": {
      title: "A4 美食 · BELLAVITA",
      vibe: "落樓即到 · 信義核心",
      mode: "near",
      items: [
        item("12:00", "新光三越 A4 午餐", "美食街試幾樣台灣味。", "美食", "near", "Shin Kong Mitsukoshi A4 food court"),
        item("15:00", "BELLAVITA 寶麗廣場", "精品氛圍逛街，拍信義街景。", "商場", "near", "BELLAVITA Taipei"),
        item("19:30", "微風信義附近晚餐", "信義路側收工。", "美食", "near", "Breeze Xinyi Taipei"),
      ],
    },
    "2026-08-11": {
      title: "Out of Office · 誠品信義",
      vibe: "落樓即到 · 久坐日",
      mode: "near",
      items: [
        item("11:00", "Out of Office Cafe", "巷弄質感座位，適合看書／回覆訊息。", "Cafe", "near", "Out of Office cafe Taipei Xinyi"),
        item("15:30", "誠品信義", "書區與選品樓層慢慢逛。", "書店", "near", "Eslite Bookstore Xinyi Taipei"),
        item("20:00", "信義深夜輕食", "誠品附近或 A4 帶點回酒店。", "美食", "near", "Eslite Xinyi restaurants"),
      ],
    },
    "2026-08-12": {
      title: "微風南山 · 台北 101",
      vibe: "落樓即到 · 地標日",
      mode: "near",
      items: [
        item("11:30", "微風南山逛街", "商場＋高空氛圍，適合下午茶。", "商場", "near", "Breeze Nan Shan Taipei"),
        item("16:00", "台北 101 商場／廣場", "室內逛完再到廣場看天際線。", "地標", "near", "Taipei 101"),
        item("19:00", "遠百 A13 一帶晚餐", "與 101 同側收工。", "美食", "near", "Far Eastern A13 Xinyi Taipei"),
      ],
    },
    "2026-08-13": {
      title: "永春節奏 · A11 補給",
      vibe: "落樓即到 · Week 1 收束",
      mode: "near",
      items: [
        item("10:30", "永春巷弄早午餐", "Coffee Water 或其他常客店二訪。", "Cafe", "near", "cafe near Yongchun MRT Taipei"),
        item("14:00", "新光三越 A11 日用品", "洗劑、零食、長住耗材一次補。", "商場", "near", "Shin Kong Mitsukoshi A11 Taipei"),
        item("18:30", "酒店附近晚餐", "早睡，隔天遠征赤峰街。", "生活", "near", "Yongchun Station Taipei"),
      ],
    },
    "2026-08-14": {
      title: "遠征 · 赤峰街 Cafe",
      vibe: "5% 遠征 · 中山",
      mode: "expedition",
      items: [
        item("10:30", "永春藍線出發", "轉乘至中山站，預留轉車時間。", "交通", "expedition", "Yongchun MRT Station Taipei"),
        item("12:00", "赤峰街文青 Cafe 圈", "獨立咖啡、選物店半日漫遊。", "Cafe", "expedition", "Chifeng Street cafe Taipei"),
        item("16:30", "中山線性公園後回程", "傍晚前藍／紅線回永春。", "漫步", "expedition", "Zhongshan Linear Park Taipei"),
      ],
    },
    "2026-08-15": {
      title: "信義恢復日",
      vibe: "落樓即到 · 充電",
      mode: "near",
      items: [
        item("11:00", "Out of Office 早午餐", "遠征隔天只走步行圈。", "Cafe", "near", "Out of Office cafe Taipei"),
        item("15:00", "微風南山躲雨", "午後雷陣雨就待在冷氣商場。", "商場", "near", "Breeze Nan Shan Taipei"),
        item("19:00", "A4 或巷弄晚餐", "輕鬆收工。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
      ],
    },
    "2026-08-16": {
      title: "BELLAVITA · 信義夜逛",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("12:00", "BELLAVITA 午餐逛街", "精品廣場慢慢晃。", "商場", "near", "BELLAVITA Taipei Xinyi"),
        item("16:00", "新光三越 A8／A9", "連通館別補逛街清單。", "商場", "near", "Shin Kong Mitsukoshi A9 Taipei"),
        item("19:30", "101 廣場夜景散步", "看信義亮燈後回永春。", "地標", "near", "Taipei 101 plaza"),
      ],
    },
    "2026-08-17": {
      title: "松菸深度半日",
      vibe: "落樓即到 · 文創",
      mode: "near",
      items: [
        item("11:00", "松山文創園區展覽", "挑一個展或市集慢慢看。", "文創", "near", "Songshan Cultural and Creative Park Taipei"),
        item("14:30", "園區 Cafe 午後", "倉庫區找座位休息。", "Cafe", "near", "Songshan Cultural Park cafe Taipei"),
        item("18:30", "永春站附近晚餐", "短程回基地。", "美食", "near", "Yongchun Station food Taipei"),
      ],
    },
    "2026-08-18": {
      title: "Coffee Water 工作日",
      vibe: "落樓即到 · 久坐",
      mode: "near",
      items: [
        item("10:00", "Coffee Water 開機", "有插座的位子待一上午。", "Cafe", "near", "Coffee Water Yongchun Taipei"),
        item("14:00", "誠品信義換場景", "書區繼續做事或隨便翻書。", "書店", "near", "Eslite Bookstore Xinyi Taipei"),
        item("19:00", "信義晚餐", "A4／巷弄擇一。", "美食", "near", "Xinyi District dinner Taipei"),
      ],
    },
    "2026-08-19": {
      title: "遠百 A13 · 101 商場",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("12:00", "遠東百貨信義 A13", "與 101 同側逛街午餐。", "商場", "near", "Far Eastern Department Store A13 Taipei"),
        item("15:30", "台北 101 商場", "室內逛、吹冷氣。", "商場", "near", "Taipei 101 Mall"),
        item("19:00", "微風南山／101 晚餐", "收工回永春。", "美食", "near", "Breeze Nan Shan restaurants"),
      ],
    },
    "2026-08-20": {
      title: "永春生活圈日",
      vibe: "落樓即到 · Week 2 收束",
      mode: "near",
      items: [
        item("11:00", "永春巷弄 Cafe", "Out of Office 或新店試喝。", "Cafe", "near", "cafe Hulin Street Yongchun Taipei"),
        item("15:00", "全聯／超市補貨", "長住食材與日用品。", "生活", "near", "PX Mart near Yongchun Taipei"),
        item("18:30", "巷弄晚餐＋早睡", "隔天遠征華山。", "美食", "near", "Yongchun alleys restaurants Taipei"),
      ],
    },
    "2026-08-21": {
      title: "遠征 · 華山 1914",
      vibe: "5% 遠征 · 文創",
      mode: "expedition",
      items: [
        item("10:30", "藍線往華山／善導寺", "永春出發，步行進園區。", "交通", "expedition", "Huashan 1914 Creative Park Taipei"),
        item("12:00", "華山 1914 文創園區", "展覽、市集、園區用餐。", "文創", "expedition", "Huashan 1914 Creative Park"),
        item("16:30", "回程永春", "傍晚前藍線回家，晚上落樓輕食。", "交通", "expedition", "Yongchun MRT Station Taipei"),
      ],
    },
    "2026-08-22": {
      title: "微風信義 · 新光三越",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("11:30", "微風信義", "信義路側逛街與午餐。", "商場", "near", "Breeze Xinyi Taipei"),
        item("15:00", "新光三越 A9／A11", "連通館別補清單。", "商場", "near", "Shin Kong Mitsukoshi A11 Taipei"),
        item("19:00", "A4 美食街晚餐", "經典信義收工。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
      ],
    },
    "2026-08-23": {
      title: "Out of Office · 巷弄散步",
      vibe: "落樓即到 · 慢活",
      mode: "near",
      items: [
        item("10:30", "Out of Office", "上午咖啡與輕食。", "Cafe", "near", "Out of Office cafe Taipei"),
        item("14:00", "永春／虎林街散步", "找新店、拍巷弄。", "漫步", "near", "Hulin Street Yongchun Taipei"),
        item("18:30", "永春晚餐", "落樓即到。", "美食", "near", "Yongchun dinner Taipei"),
      ],
    },
    "2026-08-24": {
      title: "誠品信義深潛",
      vibe: "落樓即到 · 書店日",
      mode: "near",
      items: [
        item("11:00", "誠品信義整天晃", "書、文具、選品一次看完。", "書店", "near", "Eslite Bookstore Xinyi Taipei"),
        item("16:00", "誠品 Cafe／附近咖啡", "坐下整理這個月想買的書單。", "Cafe", "near", "Eslite Xinyi cafe Taipei"),
        item("19:30", "信義晚餐", "書店附近收工。", "美食", "near", "Xinyi District restaurants Taipei"),
      ],
    },
    "2026-08-25": {
      title: "A4 美食 · 101 夜景",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("12:00", "新光三越 A4 午餐", "美食街再訪最愛攤位。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
        item("15:00", "BELLAVITA 午後", "吹冷氣、逛街窗。", "商場", "near", "BELLAVITA Taipei"),
        item("18:30", "台北 101 廣場夜景", "散步看燈後回永春。", "地標", "near", "Taipei 101"),
      ],
    },
    "2026-08-26": {
      title: "永春 Cafe 巡禮",
      vibe: "落樓即到 · 咖啡日",
      mode: "near",
      items: [
        item("10:30", "Coffee Water", "早上第一杯。", "Cafe", "near", "Coffee Water Yongchun Taipei"),
        item("14:00", "第二間巷弄 Cafe", "比較座位、插座與安靜度，記進足跡。", "Cafe", "near", "cafe near Yongchun Taipei"),
        item("18:30", "巷弄晚餐", "咖啡日用鹹食收尾。", "美食", "near", "Yongchun food Taipei"),
      ],
    },
    "2026-08-27": {
      title: "微風南山 · 伴手禮初探",
      vibe: "落樓即到 · Week 3 收束",
      mode: "near",
      items: [
        item("11:30", "微風南山", "記下想買的伴手禮，先不結帳。", "商場", "near", "Breeze Nan Shan Taipei"),
        item("15:30", "101／遠百 A13 比價", "同一品項比價做清單。", "購物", "near", "Taipei 101 Mall souvenirs"),
        item("19:00", "信義晚餐", "早點休息。", "美食", "near", "Xinyi dinner Taipei"),
      ],
    },
    "2026-08-28": {
      title: "松菸市集／展覽",
      vibe: "落樓即到 · 文創",
      mode: "near",
      items: [
        item("11:00", "松山文創園區", "看當期展覽或週末市集。", "文創", "near", "Songshan Cultural and Creative Park Taipei"),
        item("14:30", "園區 Cafe", "下午茶後慢慢走回。", "Cafe", "near", "Songshan Creative Park cafe"),
        item("18:30", "永春晚餐", "落樓收工。", "美食", "near", "Yongchun Station Taipei"),
      ],
    },
    "2026-08-29": {
      title: "BELLAVITA · 信義精品氛圍",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("12:00", "BELLAVITA 半日", "逛街窗與中庭氛圍。", "商場", "near", "BELLAVITA Taipei Xinyi"),
        item("16:00", "新光三越 A8", "連通道繼續晃。", "商場", "near", "Shin Kong Mitsukoshi A8 Taipei"),
        item("19:00", "A4 或巷弄晚餐", "回永春。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
      ],
    },
    "2026-08-30": {
      title: "Coffee Water 早午餐",
      vibe: "落樓即到 · 週末慢",
      mode: "near",
      items: [
        item("11:00", "Coffee Water 早午餐", "週末不趕行程。", "Cafe", "near", "Coffee Water Yongchun Taipei"),
        item("15:00", "誠品信義午後", "翻書、吹冷氣。", "書店", "near", "Eslite Bookstore Xinyi Taipei"),
        item("19:00", "信義晚餐", "隨意。", "美食", "near", "Xinyi restaurants Taipei"),
      ],
    },
    "2026-08-31": {
      title: "新光三越終點賽",
      vibe: "落樓即到 · 百貨日",
      mode: "near",
      items: [
        item("11:00", "A8 → A9 → A11 全線", "把還沒逛完的樓層走完。", "商場", "near", "Shin Kong Mitsukoshi Xinyi Taipei"),
        item("15:30", "A4 下午茶／小吃", "休息腿力。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
        item("19:00", "永春回程晚餐", "落樓。", "美食", "near", "Yongchun dinner Taipei"),
      ],
    },
    "2026-09-01": {
      title: "微風南山下午茶",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("12:00", "微風南山午餐", "商場餐廳。", "美食", "near", "Breeze Nan Shan Taipei"),
        item("15:00", "南山高空／窗景座位", "慢慢待到傍晚。", "商場", "near", "Breeze Nan Shan Taipei"),
        item("19:00", "101 一帶晚餐", "夜景收工。", "美食", "near", "Taipei 101 restaurants"),
      ],
    },
    "2026-09-02": {
      title: "Out of Office · 生活補給",
      vibe: "落樓即到",
      mode: "near",
      items: [
        item("10:30", "Out of Office", "咖啡＋整理行李草稿清單。", "Cafe", "near", "Out of Office cafe Taipei"),
        item("14:00", "A11／超市補耗材", "最後一週日用品。", "生活", "near", "Shin Kong Mitsukoshi A11 Taipei"),
        item("18:30", "永春晚餐", "落樓。", "美食", "near", "Yongchun food Taipei"),
      ],
    },
    "2026-09-03": {
      title: "伴手禮決選日",
      vibe: "落樓即到 · Week 4 收束",
      mode: "near",
      items: [
        item("11:00", "微風／新光／101 比價", "鎖定要買的清單。", "購物", "near", "Xinyi shopping district Taipei"),
        item("15:00", "Coffee Water 整理清單", "坐下來決定買什麼。", "Cafe", "near", "Coffee Water Yongchun Taipei"),
        item("19:00", "信義晚餐", "早睡。", "美食", "near", "Xinyi dinner Taipei"),
      ],
    },
    "2026-09-04": {
      title: "伴手禮結帳日",
      vibe: "落樓即到 · Week 5",
      mode: "near",
      items: [
        item("11:00", "主力商場一次買齊", "新光三越／微風／101 擇一戰場。", "購物", "near", "Shin Kong Mitsukoshi A11 Taipei"),
        item("15:30", "遠百 A13 補漏", "漏網之魚最後補。", "購物", "near", "Far Eastern A13 Taipei"),
        item("19:00", "永春輕鬆晚餐", "少走路。", "美食", "near", "Yongchun Station Taipei"),
      ],
    },
    "2026-09-05": {
      title: "告別信義",
      vibe: "落樓即到 · 收心",
      mode: "near",
      items: [
        item("11:00", "回訪最愛 Cafe", "Coffee Water 或 Out of Office。", "Cafe", "near", "Coffee Water Yongchun Taipei"),
        item("15:00", "酒店整理行李", "檢查證件、充電器、伴手禮。", "生活", "near", "Yongchun MRT Station Taipei"),
        item("19:00", "告別晚餐（A4／巷弄）", "回訪這個月最常去的那一餐。", "美食", "near", "Shin Kong Mitsukoshi A4 Taipei"),
      ],
    },
    "2026-09-06": {
      title: "返程 · 永春出發",
      vibe: "落樓即到 · 一路順風",
      mode: "near",
      items: [
        item("依航班", "永春站前往機場", "藍線轉機場捷運，預留安檢時間。", "交通", "near", "Yongchun Station to Airport MRT Taipei"),
        item("出發前", "酒店 check-out", "確認沒有東西留在房間。", "生活", "near", "Yongchun MRT Station Taipei"),
      ],
    },
  };

  const WEEK_META = {
    1: { label: "Week 1", hint: "永春安頓 · 信義步行" },
    2: { label: "Week 2", hint: "赤峰遠征 · 落樓恢復" },
    3: { label: "Week 3", hint: "華山遠征 · 信義深度" },
    4: { label: "Week 4", hint: "松菸 · 伴手禮決選" },
    5: { label: "Week 5", hint: "結帳 · 告別 · 返程" },
  };

  const DEFAULT_CHECKLIST = [
    {
      category: "護照與重要文件",
      items: [
        { id: "passport", label: "護照／身分證件" },
        { id: "tickets", label: "機票／登機證截圖" },
        { id: "hotel-booking", label: "酒店訂單與地址（信義·永春）" },
        { id: "insurance", label: "旅遊保險文件" },
        { id: "easycard", label: "悠遊卡／一卡通" },
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
        { id: "walk-shoes", label: "好走的鞋 ×2（信義常走路）" },
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
    budgetTwd: DEFAULT_BUDGET_TWD,
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

  function buildDays() {
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

  function zoneLabel(zone) {
    return zone === "expedition" ? "遠征 5%" : "落樓即到";
  }

  function zoneClass(zone) {
    return zone === "expedition" ? "zone-expedition" : "zone-near";
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
    return `HK$ ${amount.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    const saved = readJSON(STORAGE_KEYS.checklist, null);
    const next = {};
    DEFAULT_CHECKLIST.forEach((group) => {
      group.items.forEach((entry) => {
        next[entry.id] = Boolean(saved && saved[entry.id]);
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
    return raw.map((cafe) => {
      if (Array.isArray(cafe.tags)) return cafe;
      const tags = [];
      if (cafe.hasOutlets) tags.push("outlets");
      if (cafe.quiet) tags.push("quiet");
      if (cafe.excellentCoffee) tags.push("coffee");
      return { ...cafe, tags };
    });
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
      els.cafeList.innerHTML = `<li class="rounded-2xl border border-dashed border-jade-100 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">還沒有足跡，從 Coffee Water 或 Out of Office 開始吧。</li>`;
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

  function migrateExpenses(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => ({
      ...entry,
      categoryId: entry.categoryId || guessCategoryId(entry.note),
      week: entry.week || weekOf(new Date(entry.createdAt || Date.now())),
    }));
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
    const rate = state.rate.hkdPerTwd;
    els.rateDisplay.textContent = `1 TWD = ${rate.toFixed(3)} HKD`;
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
    const twd = Number(els.expenseAmount.value);
    if (!Number.isFinite(twd) || twd <= 0) {
      els.expensePreview.textContent = "換算預覽：—";
      return;
    }
    els.expensePreview.textContent = `換算預覽：${formatTwd(twd)} ≈ ${formatHkd(twdToHkd(twd))}`;
  }

  function expenseWeekTotals() {
    const totals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    state.expenses.forEach((entry) => {
      const w = entry.week || weekOf(new Date(entry.createdAt));
      totals[w] = (totals[w] || 0) + entry.twd;
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
      totals[id] = (totals[id] || 0) + entry.twd;
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

  function renderExpenseSummary() {
    const totalTwd = state.expenses.reduce((sum, e) => sum + e.twd, 0);
    const totalHkd = totalTwd * state.rate.hkdPerTwd;
    const avgDaily = totalTwd / TRIP_DAYS;
    const remaining = state.budgetTwd - totalTwd;
    const budgetPct = state.budgetTwd > 0 ? Math.min(100, Math.round((totalTwd / state.budgetTwd) * 100)) : 0;
    const remainClass = remaining < 0 ? "text-coral" : "text-jade-700";

    els.expenseSummary.innerHTML = `
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">總支出 TWD</p>
        <p class="mt-1 font-display text-lg font-bold text-ink">${formatTwd(totalTwd)}</p>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">等值 HKD</p>
        <p class="mt-1 font-display text-lg font-bold text-jade-700">${formatHkd(totalHkd)}</p>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">日均（31 天）</p>
        <p class="mt-1 font-display text-lg font-bold text-ink">${formatTwd(avgDaily)}</p>
      </div>
      <div class="rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">剩餘預算</p>
        <p class="mt-1 font-display text-lg font-bold ${remainClass}">${formatTwd(remaining)}</p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-jade-50">
          <div class="h-full rounded-full ${remaining < 0 ? "bg-coral" : "bg-jade-500"}" style="width:${budgetPct}%"></div>
        </div>
      </div>`;
  }

  function renderExpenseAnalytics() {
    const weekTotals = expenseWeekTotals();
    const catTotals = expenseCategoryTotals();
    const monthTwd = Object.values(weekTotals).reduce((a, b) => a + b, 0);
    const maxWeek = Math.max(...Object.values(weekTotals), 1);
    const catEntries = EXPENSE_CATEGORIES.map((c) => ({ ...c, total: catTotals[c.id] || 0 })).sort(
      (a, b) => b.total - a.total
    );
    const maxCat = Math.max(...catEntries.map((c) => c.total), 1);

    els.expenseAnalytics.innerHTML = `
      <div class="rounded-3xl bg-white/85 p-4 shadow-soft backdrop-blur">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-display text-sm font-bold text-ink">每週開支比較</h3>
          <span class="text-[10px] font-semibold text-ink-faint">Week 1–5</span>
        </div>
        <div class="space-y-3">
          ${[1, 2, 3, 4, 5]
            .map((w) => {
              const pct = Math.round((weekTotals[w] / maxWeek) * 100);
              const active = state.filterWeek === String(w);
              return `<button type="button" class="week-filter-row w-full text-left ${active ? "opacity-100" : ""}" data-filter-week="${w}">
                <div class="mb-1 flex items-center justify-between text-xs">
                  <span class="font-semibold text-ink">Week ${w}${active ? " · 篩選中" : ""}</span>
                  <span class="text-ink-soft">${formatTwd(weekTotals[w])}</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-jade-50">
                  <div class="h-full rounded-full bg-gradient-to-r from-jade-500 to-jade-600 transition-all" style="width:${pct}%"></div>
                </div>
              </button>`;
            })
            .join("")}
        </div>
        <div class="mt-4 flex h-20 items-end gap-1.5">
          ${[1, 2, 3, 4, 5]
            .map((w) => {
              const barH = Math.max(4, Math.round((weekTotals[w] / maxWeek) * 64));
              const active = state.filterWeek === String(w);
              return `<button type="button" class="flex flex-1 flex-col items-center justify-end gap-1" data-filter-week="${w}" aria-label="篩選 Week ${w}">
                <div class="w-full rounded-t-lg ${active ? "bg-coral" : "bg-jade-500/90"} transition-all" style="height:${barH}px"></div>
                <span class="text-[10px] font-semibold text-ink-faint">W${w}</span>
              </button>`;
            })
            .join("")}
        </div>
      </div>

      <div class="rounded-3xl bg-white/85 p-4 shadow-soft backdrop-blur">
        <h3 class="mb-3 font-display text-sm font-bold text-ink">分類佔比</h3>
        <div class="space-y-2.5">
          ${catEntries
            .map((c) => {
              const share = monthTwd ? Math.round((c.total / monthTwd) * 100) : 0;
              const bar = Math.round((c.total / maxCat) * 100);
              const active = state.filterCategory === c.id;
              return `<button type="button" class="w-full text-left" data-filter-cat="${c.id}">
                <div class="mb-1 flex items-center justify-between text-xs">
                  <span class="font-semibold ${active ? "text-coral" : "text-ink"}">${escapeHtml(c.label)}${active ? " · 篩選中" : ""} · ${share}%</span>
                  <span class="text-ink-soft">${formatTwd(c.total)}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-coral-soft">
                  <div class="h-full rounded-full ${active ? "bg-coral" : "bg-coral/80"} transition-all" style="width:${bar}%"></div>
                </div>
              </button>`;
            })
            .join("")}
        </div>
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
          <p class="text-xs text-ink-soft">${formatTwd(entry.twd)}</p>
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

  function addExpense(twd, note, categoryId) {
    const now = Date.now();
    state.expenses = [
      {
        id: crypto.randomUUID(),
        twd,
        hkd: twdToHkd(twd),
        rateUsed: state.rate.hkdPerTwd,
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

  function applyRate(hkdPerTwd, source) {
    state.rate = { hkdPerTwd, source, updatedAt: Date.now() };
    writeJSON(STORAGE_KEYS.rate, state.rate);
    renderRate();
    updateExpensePreview();
    renderExpenses();
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

  function loadBudget() {
    const saved = readJSON(STORAGE_KEYS.budget, null);
    state.budgetTwd = typeof saved === "number" && saved >= 0 ? saved : DEFAULT_BUDGET_TWD;
    els.budgetInput.value = String(state.budgetTwd);
  }

  function applyBudget() {
    const value = Number(els.budgetInput.value);
    if (!Number.isFinite(value) || value < 0) {
      alert("請輸入有效預算");
      return;
    }
    state.budgetTwd = value;
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
      const res = await fetch("https://open.er-api.com/v6/latest/TWD");
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
      const twd = Number(els.expenseAmount.value);
      if (!Number.isFinite(twd) || twd <= 0) return;
      addExpense(twd, els.expenseNote.value, state.expenseCategoryId);
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
    state.days = buildDays();
    state.expenses = migrateExpenses(
      readJSON(STORAGE_KEYS.expenses, readJSON("trip-companion:expenses-v1", []))
    );
    state.cafes = migrateCafes(
      readJSON(STORAGE_KEYS.cafes, readJSON("trip-companion:cafes-v1", []))
    );
    ensureChecklistState();
    loadRateFromStorage();
    loadBudget();

    const savedTab = readJSON(STORAGE_KEYS.tab, "itinerary");
    const savedWeek = Number(readJSON(STORAGE_KEYS.week, 1)) || 1;
    const savedDay = readJSON(STORAGE_KEYS.day, null);

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
