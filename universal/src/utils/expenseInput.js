/** 安全解析金額表達式，例如 850+120 或 1200*2 */
export function parseAmountExpression(input) {
  const raw = String(input ?? "").trim().replace(/,/g, "");
  if (!raw) return NaN;
  if (/^[+\-*/().\s]+$/.test(raw)) return NaN;
  if (!/[\+\-\*\/]/.test(raw)) {
    const single = Number(raw);
    return Number.isFinite(single) ? single : NaN;
  }
  if (!/^[\d+\-*/().\s]+$/.test(raw)) return NaN;
  try {
    const result = Function(`"use strict"; return (${raw})`)();
    const value = Number(result);
    return Number.isFinite(value) ? value : NaN;
  } catch {
    return NaN;
  }
}

/** 依時間智能建議分類 */
export function suggestCategoryByHour(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "cafe";
  if (h >= 11 && h < 15) return "food";
  if (h >= 15 && h < 18) return "cafe";
  if (h >= 18 && h < 23) return "food";
  return "food";
}

/** 由歷史記錄推斷常用金額 */
export function frequentAmounts(expenses, limit = 4) {
  const counts = new Map();
  for (let i = expenses.length - 1; i >= 0; i -= 1) {
    const amt = Math.round(Number(expenses[i].amount) || 0);
    if (amt <= 0) continue;
    counts.set(amt, (counts.get(amt) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
    .slice(0, limit)
    .map(([amount]) => amount);
}

export function amountExpressionPreview(input) {
  const raw = String(input ?? "").trim();
  if (!raw || !/[\+\-\*\/]/.test(raw)) return null;
  const value = parseAmountExpression(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
