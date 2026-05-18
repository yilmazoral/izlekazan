function dateRange(kind) {
  const nowDate = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const startOfWeek = (d) => {
    const x = startOfDay(d);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  };
  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

  if (kind === "week") {
    const start = startOfWeek(nowDate);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return { start, end };
  }
  if (kind === "month") {
    const start = startOfMonth(nowDate);
    const end = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1);
    return { start, end };
  }
  if (kind === "prevWeek") {
    const end = startOfWeek(nowDate);
    const start = new Date(end); start.setDate(start.getDate() - 7);
    return { start, end };
  }
  if (kind === "prevMonth") {
    const start = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
    const end = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    return { start, end };
  }
  return { start: new Date(0), end: new Date(8640000000000000) };
}
function inRange(value, start, end) {
  const d = new Date(value || 0);
  return d >= start && d < end;
}
function addBoardAmount(map, userId, amount) {
  if (!userId || !Number(amount)) return;
  map.set(userId, Number((Number(map.get(userId) || 0) + Number(amount || 0)).toFixed(2)));
}
function addBoardCount(map, userId, count = 1) {
  if (!userId) return;
  map.set(userId, Number(map.get(userId) || 0) + Number(count || 1));
}
function publicBoardName(d, userId) {
  const u = (d.users || []).find(x => x.id === userId);
  return u ? maskName(u.firstName, u.lastName) : "Üye";
}
function topReferralRows(d, rangeKind) {
  const { start, end } = dateRange(rangeKind);
  const totals = new Map();

  for (const child of d.users || []) {
    if (child.role === "admin") continue;
    if (!child.sponsorId) continue;
    if (!inRange(child.createdAt, start, end)) continue;
    addBoardCount(totals, child.sponsorId, 1);
  }

  return Array.from(totals.entries())
    .map(([userId, count]) => ({
      userId,
      maskedName: publicBoardName(d, userId),
      count: Number(count || 0),
      altMemberCount: Number(count || 0)
    }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count || String(a.maskedName).localeCompare(String(b.maskedName), "tr-TR"))
    .slice(0, 5);
}
function topEarningRows(d, rangeKind) {
  const { start, end } = dateRange(rangeKind);
  const totals = new Map();

  for (const e of d.pendingEarnings || []) {
    if (!inRange(e.createdAt, start, end)) continue;
    addBoardAmount(totals, e.userId, Number(e.amount || 0));
  }

  for (const t of d.transactions || []) {
    const amount = Number(t.amount || 0);
    if (amount <= 0) continue;
    if (t.type === "bekleyen_devri") continue;
    if (!inRange(t.createdAt, start, end)) continue;
    addBoardAmount(totals, t.userId, amount);
  }

  return Array.from(totals.entries())
    .map(([userId, amount]) => ({
      userId,
      maskedName: publicBoardName(d, userId),
      amount: Number(amount.toFixed(2))
    }))
    .filter(x => x.amount > 0)
    .sort((a, b) => b.amount - a.amount || String(a.maskedName).localeCompare(String(b.maskedName), "tr-TR"))
    .slice(0, 5);
}
app.get("/api/public/leaderboards", (req, res) => {
  const d = readDb(); processDb(d);
  res.json({
    boards: [
      { key: "weekly_ref", type: "referral_count", metricLabel: "Alt Üye Sayısı", title: "Haftalık Referans Liderleri", rows: topReferralRows(d, "week") },
      { key: "monthly_ref", type: "referral_count", metricLabel: "Alt Üye Sayısı", title: "Aylık Referans Liderleri", rows: topReferralRows(d, "month") },
      { key: "weekly_earn", type: "amount", metricLabel: "Tutar", title: "Haftalık En Çok Kazananı", rows: topEarningRows(d, "week") },
      { key: "monthly_earn", type: "amount", metricLabel: "Tutar", title: "Ayın En Çok Kazananı", rows: topEarningRows(d, "month") },
      { key: "prev_week_ref", type: "referral_count", metricLabel: "Alt Üye Sayısı", title: "Geçen Haftanın Referans Lideri", rows: topReferralRows(d, "prevWeek") },
      { key: "prev_month_ref", type: "referral_count", metricLabel: "Alt Üye Sayısı", title: "Geçen Ayın Referans Lideri", rows: topReferralRows(d, "prevMonth") },
      { key: "prev_week_earn", type: "amount", metricLabel: "Tutar", title: "Geçen Haftanın En Çok Kazananı", rows: topEarningRows(d, "prevWeek") },
      { key: "prev_month_earn", type: "amount", metricLabel: "Tutar", title: "Geçen Ayın En Çok Kazananı", rows: topEarningRows(d, "prevMonth") }
    ]
  });
});
