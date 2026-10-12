/**
 * Verified Qianhai / Shekou POIs.
 *
 * Rules:
 * - Every mapped place must have officialName + address + lat/lng + mapsQuery.
 * - lat/lng come from OSM / Wikipedia / Amap / official listings — never invented offsets.
 * - mapsQuery is the disambiguated navigation string (official name + street).
 * - Shenzhen bbox is asserted at load time so Osaka fallbacks cannot sneak in.
 */

export const SHENZHEN_BBOX = {
  minLat: 22.4,
  maxLat: 22.85,
  minLng: 113.75,
  maxLng: 114.65,
};

export const QIANHAI_PLACE_SEED_VERSION = "qianhai-places-v8-2026-10-12-chaoxiangli-flex";

/** @typedef {{ id: string, name: string, officialName: string, address: string, lat: number, lng: number, mapsQuery: string, zone: string, source: string, note?: string }} VerifiedPlace */

/** @type {Record<string, VerifiedPlace>} */
export const QIANHAI_PLACES = {
  hotel: {
    id: "hotel",
    name: "RANY芮汐酒店",
    officialName: "深圳蛇口海上世界RANY芮汐酒店",
    address: "广东省深圳市南山区蛇口新街石云路25号",
    lat: 22.49043,
    lng: 113.92248,
    mapsQuery: "深圳蛇口海上世界RANY芮汐酒店 石云路25号",
    zone: "dongjiaotou",
    source: "official hotel site shekouseaworld.rany.hotelsofshenzhen.com; OSM way/393904158 石云路 + 东角头站",
    note: "最近地鐵係東角頭（約 400–500m），唔係海上世界站。正式名唔係「海底世界」。去海上世界廣場步行約 1–1.2km／15 分鐘，或地鐵一站。",
  },
  dongjiaotouStation: {
    id: "dongjiaotouStation",
    name: "地鐵東角頭站（2 號綫）",
    officialName: "深圳地铁2号线东角头站",
    address: "广东省深圳市南山区蛇口新街与湾厦路交界",
    lat: 22.489158,
    lng: 113.926412,
    mapsQuery: "东角头站 深圳地铁2号线",
    zone: "dongjiaotou",
    source: "OSM node/6715085272; Wikipedia 东角头站",
    note: "酒店最近地鐵。Ctrip／永安：RANY 距東角頭步行約 7 分鐘。",
  },
  seaWorldPlaza: {
    id: "seaWorldPlaza",
    name: "海上世界廣場／明華輪",
    officialName: "深圳海上世界（明华轮）",
    address: "广东省深圳市南山区招商街道望海路1128号",
    lat: 22.486343,
    lng: 113.91193,
    mapsQuery: "深圳海上世界 明华轮 望海路1128号",
    zone: "seaworld",
    source: "OSM way/105683429 明华轮 22.48639,113.91197; Wikipedia Minghua; 本地宝／Amap 望海路1128号; Amap B02F302560 商场 22.482264,113.917846（商業廣場針）",
    note: "望海路1128。核心係明華輪＋環船／船頭／船後廣場＋餐飲酒吧街。廣場入面：Terrace L2 露台泰菜、李小太 C區船後102、南海小廚 5棟101、潮巷里 B區船尾B106。旁邊行：白日夢商場 Daydream（環船廣場／C區，現場名）、匯港購物中心（地鐵 D／B 口）、女媧像／文化藝術中心（望海路1187）。由 RANY 石雲路步行約 1–1.2km（約 15 分鐘）向西／西南；或東角頭站坐 2 號綫一站到海上世界站 A 口再行入廣場。",
  },
  nvwa: {
    id: "nvwa",
    name: "女媧補天像",
    officialName: "女娲补天像",
    address: "广东省深圳市南山区望海路1187号海上世界文化艺术中心旁",
    lat: 22.484044,
    lng: 113.912622,
    mapsQuery: "女娲补天像 海上世界 深圳",
    zone: "seaworld",
    source: "OSM node/5250978477 女娲补天像; 深圳本地宝 望海路1187号",
    note: "廣場南邊海邊打卡位；同文化藝術中心一齊行。",
  },
  seaWorldArtCenter: {
    id: "seaWorldArtCenter",
    name: "海上世界文化藝術中心",
    officialName: "海上世界文化艺术中心",
    address: "广东省深圳市南山区蛇口望海路1187号",
    lat: 22.483164,
    lng: 113.912027,
    mapsQuery: "海上世界文化艺术中心 望海路1187号",
    zone: "seaworld",
    source: "OSM way/740022007 22.483164,113.912027; 深圳政府在线 望海路1187号；场馆约 10:00–22:00",
    note: "廣場旁邊展館／文創零售。展期同開放時間以當日為準；由明華輪一帶步行幾分鐘。",
  },
  gatewayMall: {
    id: "gatewayMall",
    name: "海上世界·匯港購物中心",
    officialName: "海上世界·汇港购物中心",
    address: "广东省深圳市南山区工业三路1号（海上世界地铁站D口）",
    lat: 22.488658,
    lng: 113.911126,
    mapsQuery: "海上世界汇港购物中心 工业三路1号",
    zone: "seaworld",
    source: "OSM way/620827387; Amap B0FFI99Y4E 22.485644,113.916014（一期入口）",
    note: "蛇口海上世界商場（工業三路1號）。地鐵海上世界站 B／D 口直達；補日用品同冷氣休息。唔係華強北茂業天地。",
  },
  daydreamMall: {
    id: "daydreamMall",
    name: "白日夢商場 Daydream",
    officialName: "海上世界环船广场",
    address: "广东省深圳市南山区望海路1128号海上世界环船广场",
    lat: 22.4859071,
    lng: 113.9129673,
    mapsQuery: "海上世界环船广场 望海路1128号",
    zone: "seaworld",
    source: "OSM way/543176168 环船广场 shop=mall alt_name=海上世界C区 22.4859071,113.9129673; 旅客現場 2026-10-12 稱白日夢商場 Daydream — Amap/Google/OSM 無獨立「白日梦商场」POI，導航用環船廣場／望海路1128",
    note: "你而家喺嘅商場（現場名 Daydream／白日夢）。地圖正式多數標「環船廣場／海上世界C區」，同明華輪廣場一體；旁邊係匯港（工業三路1號）。",
  },
  foodStreet: {
    id: "foodStreet",
    name: "海上世界食街／酒吧街",
    officialName: "海上世界广场餐饮酒吧街区",
    address: "广东省深圳市南山区望海路1128号海上世界广场一带",
    lat: 22.486343,
    lng: 113.91193,
    mapsQuery: "海上世界广场 酒吧街 望海路1128号 深圳",
    zone: "seaworld",
    source: "same plaza as 明华轮 / OSM way/105683429; 读特／海上世界商圈报道：多国餐饮环船广场",
    note: "圍繞明華輪嘅餐飲酒吧帶（中高低消費都有）。已核實舖：Terrace（L2）、李小太（C區船後）、南海小廚（5棟船尾）、潮巷里（B區船尾B106）。夜晚可睇噴泉／夜景；付款優先微信／支付寶。",
  },
  seaWorldStation: {
    id: "seaWorldStation",
    name: "地鐵海上世界站（2／12 號綫）",
    officialName: "深圳地铁海上世界站",
    address: "广东省深圳市南山区太子路与工业三路交叉路口以南",
    lat: 22.488129,
    lng: 113.910159,
    mapsQuery: "海上世界站 深圳地铁",
    zone: "seaworld",
    source: "OSM node/6715085274; Wikipedia 22.4881111,113.9102694",
    note: "去廣場／匯港用呢站。酒店最近係東角頭。",
  },
  shekouPortStation: {
    id: "shekouPortStation",
    name: "地鐵蛇口港站（2 號綫）",
    officialName: "深圳地铁蛇口港站",
    address: "广东省深圳市南山区蛇口客运码头北侧",
    lat: 22.479714,
    lng: 113.907387,
    mapsQuery: "蛇口港站 深圳地铁2号线",
    zone: "shekou",
    source: "OSM node/6715085276; Wikipedia 22.47722,113.91167",
  },
  shekouOldStreet: {
    id: "shekouOldStreet",
    name: "蛇口老街",
    officialName: "蛇口老街",
    address: "广东省深圳市南山区蛇口街道海昌社区／海滨社区",
    lat: 22.488845,
    lng: 113.922432,
    mapsQuery: "蛇口老街 海昌街 深圳南山",
    zone: "shekou",
    source: "OSM way/101317208 蛇口老街",
  },
  gardenCity: {
    id: "gardenCity",
    name: "太子灣花園城中心",
    officialName: "太子湾花园城",
    address: "广东省深圳市南山区蛇口邮轮大道1号",
    lat: 22.478768,
    lng: 113.908125,
    mapsQuery: "太子湾花园城 邮轮大道 蛇口",
    zone: "shekou",
    source: "OSM node 太子湾花园城招呼站; 深圳貓 邮轮大道1号",
  },
  stonePark: {
    id: "stonePark",
    name: "前海石公園",
    officialName: "前海石公园",
    address: "广东省深圳市南山区前海大道与金岸中街交汇处（前湾二路）",
    lat: 22.526982,
    lng: 113.890178,
    mapsQuery: "前海石公园 前海大道 南山",
    zone: "guiwan",
    source: "Amap B0FFG9KGTS 22.526982,113.890178; OSM way/542328084 park centroid 22.52906,113.88443",
  },
  kerry: {
    id: "kerry",
    name: "前海嘉里中心",
    officialName: "前海嘉里中心",
    address: "广东省深圳市南山区桂湾四路99号（临海大道与前海大道交汇处西侧）",
    lat: 22.528488,
    lng: 113.886644,
    mapsQuery: "前海嘉里中心 桂湾四路99号",
    zone: "guiwan",
    source: "OSM way/1015410204; official 桂湾四路99号; Amap T1 22.525832,113.892281",
  },
  uniwalkHui: {
    id: "uniwalkHui",
    name: "前海壹方匯 Uniwalk",
    officialName: "前海壹方汇",
    address: "广东省深圳市南山区听海大道5059号",
    lat: 22.532102,
    lng: 113.891836,
    mapsQuery: "前海壹方汇 听海大道5059号 桂湾",
    zone: "guiwan",
    source: "OSM relation/19117508 前海壹方汇 Uniway; 本地宝 听海大道5059号 桂湾站A2",
    note: "桂灣商場。唔好同寶安中心「前海壹方城」（新湖路99號）撈亂。",
  },
  guiwanStation: {
    id: "guiwanStation",
    name: "地鐵桂灣站（5 號綫）",
    officialName: "深圳地铁5号线桂湾站",
    address: "广东省深圳市南山区听海大道与桂湾四路交叉口",
    lat: 22.534431,
    lng: 113.892867,
    mapsQuery: "桂湾站 深圳地铁5号线",
    zone: "guiwan",
    source: "OSM node/6836123689; Wikipedia 22.531861,113.898083",
  },

  fanlou: {
    id: "fanlou",
    name: "蘩樓（蛇口大廈店）",
    officialName: "蘩楼(蛇口大厦店)",
    address: "广东省深圳市南山区蛇口新街152号（石云路与蛇口新街交汇处，蛇口大厦对面）",
    lat: 22.488808,
    lng: 113.926824,
    mapsQuery: "蘩楼 蛇口新街152号 石云路",
    zone: "dongjiaotou",
    source: "Amap B0FFKDAS4X 22.488808,113.926824; Dianping shop/129227324",
    note: "RANY 石雲路口步行可到。粵菜／點心，適合入住後就近食。",
  },
  liXiaotaiBbq: {
    id: "liXiaotaiBbq",
    name: "李小太燒烤（海上世界）",
    officialName: "李小太·烧烤(海上世界店)",
    address: "广东省深圳市南山区望海路1128号海上世界C区L1层102号铺（船后广场）",
    lat: 22.483591,
    lng: 113.917775,
    mapsQuery: "李小太烧烤 海上世界C区 船后广场102",
    zone: "seaworld",
    source: "OpenRice r8524797 船后广场102; Amap B0FFFEAE6Z 海上世界C区停车场 22.483591,113.917775（同 C 区船后广场地块）",
    note: "串燒／生蠔／砂鍋粥；開到凌晨左右。地圖針係 C 區船後廣場地塊，入舖再認 102。",
  },
  nanhaiXiaochu: {
    id: "nanhaiXiaochu",
    name: "南海小廚（海上世界）",
    officialName: "南海小厨(海上世界)",
    address: "广东省深圳市南山区望海路1128号海上世界5栋101号铺",
    lat: 22.483471,
    lng: 113.916898,
    mapsQuery: "南海小厨 望海路1128号 海上世界5栋101",
    zone: "seaworld",
    source: "OpenRice r6121438 5栋101; Amap B02F38M9ME 明华轮 22.483471,113.916898（船尾／廣場舖面一帶）",
    note: "較正式粵菜，近明華輪船尾／噴泉。午市晚市時段。",
  },
  terraceThai: {
    id: "terraceThai",
    name: "Terrace 露台泰菜",
    officialName: "Terrace露台泰国美食·现场音乐",
    address: "广东省深圳市南山区望海路1128号海上世界街区广场L2层",
    lat: 22.486343,
    lng: 113.91193,
    mapsQuery: "Terrace 露台泰国美食 望海路1128号 海上世界L2",
    zone: "seaworld",
    source: "OpenRice r5967034 L2层; plaza pin = OSM 明华轮/广场 way/105683429（同廣場，L2 再認星巴克樓上）",
    note: "露台泰菜；入夜偏酒吧／駐唱。地圖針用廣場，上 L2 搵舖。",
  },

  chaoXiangLi: {
    id: "chaoXiangLi",
    name: "潮巷里（海上世界）",
    officialName: "潮巷里·老潮汕美食集市(海上世界店)",
    address: "广东省深圳市南山区望海路1128号海上世界B区L1层B106号铺（船尾广场一栋106）",
    lat: 22.4853271,
    lng: 113.9110046,
    mapsQuery: "潮巷里 海上世界B区 B106 船尾广场 望海路1128",
    zone: "seaworld",
    source: "OpenRice r6209337 潮巷·潮州粿条 海上世界 B区L1 B106 船尾广场1栋; iecity 潮巷里·老潮汕美食集市 船尾广场一栋106; OSM way/543176178 船尾广场 alt_name=海上世界B区 22.4853271,113.9110046",
    note: "潮汕粿条／牛肉專門。船尾廣場 B區 L1 B106；地鐵海上世界站 A 口步行約 310m。食無定時——唔鎖午餐／晚餐鐘點，想食就去。旅客 2026-10-12 到店。",
  },
  shenzhenBayPort: {
    id: "shenzhenBayPort",
    name: "深圳灣口岸",
    officialName: "深圳湾口岸",
    address: "广东省深圳市南山区蛇口街道东滨路1号",
    lat: 22.506033,
    lng: 113.945354,
    mapsQuery: "深圳湾口岸 东滨路1号",
    zone: "border",
    source: "OSM node/12456006180; Wikipedia 深圳湾口岸站 22.50618,113.94463; 灰机wiki 东滨路1号",
  },
};

export const QIANHAI_ZONE_CENTERS = {
  seaworld: { id: "seaworld", label: "海上世界", lat: 22.486343, lng: 113.91193, color: "#0369a1" },
  dongjiaotou: { id: "dongjiaotou", label: "東角頭／酒店", lat: 22.49043, lng: 113.92248, color: "#0284c7" },
  shekou: { id: "shekou", label: "蛇口", lat: 22.488845, lng: 113.922432, color: "#0ea5e9" },
  guiwan: { id: "guiwan", label: "前海桂灣", lat: 22.532102, lng: 113.891836, color: "#f59e0b" },
  border: { id: "border", label: "深圳灣口岸", lat: 22.506033, lng: 113.945354, color: "#14b8a6" },
};

export function isFiniteCoord(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function inShenzhenBbox(lat, lng) {
  return (
    isFiniteCoord(lat) &&
    isFiniteCoord(lng) &&
    lat >= SHENZHEN_BBOX.minLat &&
    lat <= SHENZHEN_BBOX.maxLat &&
    lng >= SHENZHEN_BBOX.minLng &&
    lng <= SHENZHEN_BBOX.maxLng
  );
}

export function getQianhaiPlace(id) {
  return QIANHAI_PLACES[id] || null;
}

export function qianhaiPlaceByName(name) {
  if (!name) return null;
  const blob = String(name).toLowerCase();
  return (
    Object.values(QIANHAI_PLACES).find((place) => {
      const hay = `${place.id} ${place.name} ${place.officialName} ${place.mapsQuery}`.toLowerCase();
      return hay.includes(blob) || blob.includes(place.name.toLowerCase()) || blob.includes(place.officialName.toLowerCase());
    }) || null
  );
}

export function googleMapsSearchUrl(place) {
  if (place?.lat != null && place?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place?.mapsQuery || place?.name || "")}`;
}

export function appleMapsUrl(place) {
  if (place?.lat != null && place?.lng != null) {
    return `https://maps.apple.com/?ll=${place.lat},${place.lng}&q=${encodeURIComponent(place.officialName || place.name)}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(place?.mapsQuery || place?.name || "")}`;
}

export function assertQianhaiPlaces() {
  const errors = [];
  Object.values(QIANHAI_PLACES).forEach((place) => {
    if (!place.officialName || !place.address || !place.mapsQuery) {
      errors.push(`${place.id}: missing officialName/address/mapsQuery`);
    }
    if (!inShenzhenBbox(place.lat, place.lng)) {
      errors.push(`${place.id}: coords outside Shenzhen bbox (${place.lat}, ${place.lng})`);
    }
  });
  return errors;
}

const loadErrors = assertQianhaiPlaces();
if (loadErrors.length) {
  throw new Error(`Qianhai place catalog invalid:\n${loadErrors.join("\n")}`);
}
