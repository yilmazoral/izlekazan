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
  return !Number.isNaN(d.getTime()) && d >= start && d < end;
}
function addBoardAmount(map, userId, amount) {
  if (!userId || !Number(amount)) return;
  map.set(userId, Number((Number(map.get(userId) || 0) + Number(amount || 0)).toFixed(2)));
}
function addBoardCount(map, userId, count = 1) {
  if (!userId) return;
  const value = Number(count || 1);
  if (!Number.isFinite(value) || value <= 0) return;
  map.set(userId, Number(map.get(userId) || 0) + value);
}
function publicBoardName(d, userId) {
  const u = (d.users || []).find(x => String(x.id) === String(userId));
  return u ? maskName(u.firstName, u.lastName) : "Üye";
}
function resolveSponsorUserId(d, sponsorValue) {
  const key = String(sponsorValue || "").trim();
  if (!key) return null;
  const users = Array.isArray(d.users) ? d.users : [];
  const sponsor = users.find(u =>
    String(u.id || "") === key ||
    String(u.referralCode || "") === key ||
    String(u.refCode || "") === key ||
    String(u.inviteCode || "") === key
  );
  return sponsor ? sponsor.id : key;
}
function topReferralRows(d, rangeKind) {
  const { start, end } = dateRange(rangeKind);
  const totals = new Map();

  for (const child of d.users || []) {
    if (!child || child.role === "admin") continue;
    const sponsorRaw = child.sponsorId || child.sponsorUserId || child.referrerId || child.parentId || child.invitedBy || child.referredBy;
    const sponsorId = resolveSponsorUserId(d, sponsorRaw);
    if (!sponsorId) continue;
    if (!inRange(child.createdAt || child.joinedAt || child.registeredAt, start, end)) continue;
    addBoardCount(totals, sponsorId, 1);
  }

  return Array.from(totals.entries())
    .map(([userId, count]) => {
      const safeCount = Number(count || 0);
      return {
        userId,
        maskedName: publicBoardName(d, userId),
        count: safeCount,
        altMemberCount: safeCount,
        referralCount: safeCount
      };
    })
    .filter(x => Number(x.altMemberCount || 0) > 0)
    .sort((a, b) => Number(b.altMemberCount || 0) - Number(a.altMemberCount || 0) || String(a.maskedName).localeCompare(String(b.maskedName), "tr-TR"))
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
    .filter(x => Number(x.amount || 0) > 0)
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0) || String(a.maskedName).localeCompare(String(b.maskedName), "tr-TR"))
    .slice(0, 5);
}
app.get("/api/public/leaderboards", (req, res) => {
  const d = readDb(); processDb(d);
  res.json({
    version: APP_VERSION || "v2026.05.18-020",
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
