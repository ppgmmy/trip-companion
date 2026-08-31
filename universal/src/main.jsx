import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Bootstrap from "./bootstrap.jsx";
import "./index.css";

// 有 VITE_CLERK_PUBLISHABLE_KEY 時自動啟用 Google 登入＋雲端同步；否則沿用本機 localStorage。

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
