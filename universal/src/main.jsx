import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 登入／雲端同步暫時擱置：每部手機用各自 localStorage，唔共通。
// 相關程式留喺 ./auth/，之後要開返再 wrap AuthGate 即可。

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
