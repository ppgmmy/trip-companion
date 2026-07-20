# 東京行程 Companion

Trip Companion 的東京子集，與台北（`/taipei/`）、泰國（`/thailand/`）並列。

```bash
# from trip-companion root
npm run build          # builds this Vite app into tokyo/dist, then assembles dist/
npm start              # hub + all subsets at http://localhost:5174
```

Local Tokyo-only dev:

```bash
cd tokyo
npm run dev
```

使用者資料存在 `tokyo-*` localStorage keys，與台北／泰國互不共用。
