import { DEFAULT_PAYER_ID, formatHkd, payerLabel } from "../data";

const CORE_PAYERS = ["ppg", "mo"];

/**
 * 兩人分帳：計算 ppg / mo 各自實付 vs 應付一半，得出邊個欠邊個。
 * 「大家分攤」類開支計入 shared，兩人各算一半。
 */
export function computeSplitSettlement(expenses) {
  if (!expenses.length) return null;

  const paid = { ppg: 0, mo: 0 };
  let sharedHkd = 0;
  let totalHkd = 0;
  let otherHkd = 0;

  expenses.forEach((entry) => {
    const hkd = Number(entry.baseAmount) || 0;
    if (hkd <= 0) return;
    totalHkd += hkd;
    const payer = entry.payer || DEFAULT_PAYER_ID;
    if (payer === "shared") {
      sharedHkd += hkd;
    } else if (CORE_PAYERS.includes(payer)) {
      paid[payer] += hkd;
    } else {
      otherHkd += hkd;
    }
  });

  if (totalHkd <= 0) return null;

  const halfShared = sharedHkd / 2;
  const effectivePaid = {
    ppg: paid.ppg + halfShared,
    mo: paid.mo + halfShared,
  };
  const fairShare = totalHkd / 2;
  const net = {
    ppg: effectivePaid.ppg - fairShare,
    mo: effectivePaid.mo - fairShare,
  };

  let summary = "";
  let debtor = "";
  let creditor = "";
  let amount = 0;

  if (Math.abs(net.ppg) < 0.01) {
    summary = "兩人分帳已平衡";
  } else if (net.ppg > 0) {
    debtor = "mo";
    creditor = "ppg";
    amount = net.ppg;
    summary = `${payerLabel(debtor)} 欠 ${payerLabel(creditor)} ${formatHkd(amount)}`;
  } else {
    debtor = "ppg";
    creditor = "mo";
    amount = -net.ppg;
    summary = `${payerLabel(debtor)} 欠 ${payerLabel(creditor)} ${formatHkd(amount)}`;
  }

  return {
    paid,
    sharedHkd,
    otherHkd,
    totalHkd,
    effectivePaid,
    fairShare,
    net,
    summary,
    debtor,
    creditor,
    amount,
    balanced: Math.abs(net.ppg) < 0.01,
  };
}

/** 複製分帳摘要文字（WhatsApp 等） */
export function splitSettlementShareText(settlement, tripLabel = "旅程") {
  if (!settlement) return "";
  const lines = [
    `💰 ${tripLabel} 分帳結算`,
    `總支出：${formatHkd(settlement.totalHkd)}`,
    `ppg 實付：${formatHkd(settlement.effectivePaid.ppg)}`,
    `mo 實付：${formatHkd(settlement.effectivePaid.mo)}`,
    `每人應付：${formatHkd(settlement.fairShare)}`,
    settlement.balanced ? "✅ 已平衡" : `➡️ ${settlement.summary}`,
  ];
  return lines.join("\n");
}
