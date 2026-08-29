/** 暫時只開放呢兩個 email（前端提示用；真正授權喺 API 再驗一次） */
export const ALLOWED_EMAILS = [
  "wanlokszevenus@gmail.com",
  "whatnamecaniuseonjg99gle@gmail.com",
];

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isEmailAllowed(email) {
  const normalized = normalizeEmail(email);
  return ALLOWED_EMAILS.includes(normalized);
}
