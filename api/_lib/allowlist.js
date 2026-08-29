/** 暫時只開放呢兩個 email 登入／同步（大小寫唔計） */
export const ALLOWED_EMAILS = [
  "wanlokszevenus@gmail.com",
  "whatnamecaniuseonjg99gle@gmail.com",
];

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isEmailAllowed(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return ALLOWED_EMAILS.some((allowed) => allowed === normalized);
}
