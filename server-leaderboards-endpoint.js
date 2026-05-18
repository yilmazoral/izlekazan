
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
function topBoardRows(d, mode, rangeKind) {
  const { start, end } = dateRange(rangeKind);
  const totals = new Map();

  for (const e of d.pendingEarnings || []) {
    if (!inRange(e.createdAt, start, end)) continue;
    if (mode === "referans" && e.type !== "referans") continue;
    addBoardAmount(totals, e.userId, Number(e.amount || 0));
  }

  for (const t of d.transactions || []) {
    const amount = Number(t.amount || 0);
    if (amount <= 0) continue;
    if (t.type === "bekleyen_devri") continue;
    if (!inRange(t.createdAt, start, end)) continue;
    if (mode === "referans" && t.type !== "referans") continue;
    addBoardAmount(totals, t.userId, amount);
  }

  return Array.from(totals.entries())
    .map(([userId, amount]) => {
      const u = d.users.find(x => x.id === userId);
      return { userId, maskedName: u ? maskName(u.firstName, u.lastName) : "Üye", amount: Number(amount.toFixed(2)) };
    })
    .filter(x => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}
app.get("/api/public/leaderboards", (req, res) => {
  const d = readDb(); processDb(d);
  res.json({
    boards: [
      { key: "weekly_ref", title: "Haftalık Referans Liderleri", rows: topBoardRows(d, "referans", "week") },
      { key: "monthly_ref", title: "Aylık Referans Liderleri", rows: topBoardRows(d, "referans", "month") },
      { key: "weekly_earn", title: "Haftalık En Çok Kazananı", rows: topBoardRows(d, "earnings", "week") },
      { key: "monthly_earn", title: "Ayın En Çok Kazananı", rows: topBoardRows(d, "earnings", "month") },
      { key: "prev_week_ref", title: "Geçen Haftanın Referans Lideri", rows: topBoardRows(d, "referans", "prevWeek") },
      { key: "prev_month_ref", title: "Geçen Ayın Referans Lideri", rows: topBoardRows(d, "referans", "prevMonth") },
      { key: "prev_week_earn", title: "Geçen Haftanın En Çok Kazananı", rows: topBoardRows(d, "earnings", "prevWeek") },
      { key: "prev_month_earn", title: "Geçen Ayın En Çok Kazananı", rows: topBoardRows(d, "earnings", "prevMonth") }
    ]
  });
});
