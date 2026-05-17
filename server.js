try { require("dotenv").config(); } catch (e) {}

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let createClient = null;
try { ({ createClient } = require("@supabase/supabase-js")); } catch (e) {}

let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "izlekazan_development_secret_change_me";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "yilmazoral@hotmail.com").toLowerCase();
const ADMIN_PASS = process.env.ADMIN_PASS || "059221";
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const MOVIE_SITE_URL = process.env.MOVIE_SITE_URL || "https://sinemaizle.org/";
const APP_VERSION = process.env.APP_VERSION || "v2026.05.17-004";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || "";
const SUPABASE_STATE_TABLE = process.env.SUPABASE_STATE_TABLE || "izlekazan_state";
const SUPABASE_STATE_ID = process.env.SUPABASE_STATE_ID || "main";
const supabase = createClient && SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

let dbCache = null;
let dbSaveQueue = Promise.resolve();

app.use(express.json({ limit: "4mb" }));
app.use(express.static(__dirname));

const PACKAGES = [
  { id: 1, name: "Standart Üye", price: 100, depth: 1, rate: 0.10, durationDays: 365, badge: "Başlangıç", features: ["1 yıl premium film erişimi", "Reklamsız Film Platformu filmlerine erişim", "1. seviye referanslardan %10 kazanç", "Referans kodu paket aktif olunca görünür", "Siteye Film Ekleme Kazancı", "Cüzdan, destek ve çekim talebi"] },
  { id: 2, name: "Kıdemli Üye", price: 200, depth: 2, rate: 0.10, durationDays: 365, badge: "2 Seviye", features: ["Standart Üye özelliklerinin tamamı", "1. ve 2. seviye referanslardan %10 kazanç", "Alt üye ağacını daha geniş takip", "Referans kazanç geçmişi", "1 yıl aktif premium üyelik", "Siteye Film Ekleme Kazancı"] },
  { id: 3, name: "Ortak", price: 300, depth: 3, rate: 0.10, durationDays: 365, badge: "3 Seviye", features: ["Kıdemli Üye özelliklerinin tamamı", "1, 2 ve 3. seviye referanslardan %10 kazanç", "Platform gelir ortaklığına tam katılım", "Geniş referans ağı takibi", "1 yıl premium erişim", "Siteye Film Ekleme Kazancı"] },
  { id: 4, name: "Kıdemli Ortak", price: 500, depth: 3, rate: 0.20, durationDays: 365, badge: "Yüksek Prim", features: ["Ortak paket özelliklerinin tamamı", "İlk 3 referans seviyesinden %20 kazanç", "Daha yüksek cüzdan kazanç potansiyeli", "Gelişmiş kazanç takibi", "1 yıl premium erişim", "Siteye Film Ekleme Kazancı"] },
  { id: 5, name: "CEO Üye", price: 1000, depth: 3, rate: 0.30, durationDays: 365, badge: "En Üst Seviye", features: ["Tüm özelliklere tam erişim", "İlk 3 referans seviyesinden %30 kazanç", "CEO film ön onay paneli", "Onayladığı film başına extra kazanç", "Siteye Film Ekleme Kazancı", "1 yıl premium erişim"] }
];

function id() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
function addDays(days) { const d = new Date(); d.setDate(d.getDate() + Number(days || 0)); return d.toISOString(); }
function addDaysTo(dateValue, days) { const d = dateValue ? new Date(dateValue) : new Date(); d.setDate(d.getDate() + Number(days || 0)); return d.toISOString(); }
function daysLeft(dateStr) { if (!dateStr) return 0; return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000)); }
function isPremium(u) { return !!(u && Number(u.packageId || 0) > 0 && u.premiumUntil && new Date(u.premiumUntil) > new Date()); }
function findPackage(packageId) { return PACKAGES.find(p => p.id === Number(packageId)); }
function defaultMovie() {
  return {
    id: id(),
    title: "Reklamsız Film Platformu",
    year: "2026",
    category: "Film Arşivi",
    poster: "/assets/movie-poster.svg",
    description: "Premium üyeler için reklamsız film platformu.",
    link: "/api/film-gateway",
    embedLink: "/api/film-gateway",
    status: "published",
    addedBy: "system",
    ceoApprovedBy: "system",
    adminApprovedBy: "system",
    createdAt: now()
  };
}
function freshDb() {
  return {
    users: [],
    payments: [],
    withdrawals: [],
    transactions: [],
    pendingEarnings: [],
    movies: [defaultMovie()],
    supportTickets: [],
    notifications: [],
    passwordResets: [],
    logs: []
  };
}
function normalizeDb(data) {
  const base = freshDb();
  const d = data && typeof data === "object" ? data : {};
  const out = { ...base, ...d };
  for (const key of Object.keys(base)) if (!Array.isArray(out[key])) out[key] = Array.isArray(base[key]) ? base[key] : out[key];
  out.users = Array.isArray(out.users) ? out.users : [];
  out.payments = Array.isArray(out.payments) ? out.payments : [];
  out.withdrawals = Array.isArray(out.withdrawals) ? out.withdrawals : [];
  out.transactions = Array.isArray(out.transactions) ? out.transactions : [];
  out.pendingEarnings = Array.isArray(out.pendingEarnings) ? out.pendingEarnings : [];
  out.movies = Array.isArray(out.movies) && out.movies.length ? out.movies : [defaultMovie()];
  out.supportTickets = Array.isArray(out.supportTickets) ? out.supportTickets : [];
  out.notifications = Array.isArray(out.notifications) ? out.notifications : [];
  out.passwordResets = Array.isArray(out.passwordResets) ? out.passwordResets : [];
  out.logs = Array.isArray(out.logs) ? out.logs : [];
  return out;
}
function readLocalDb() {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(freshDb(), null, 2));
    return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
  } catch (e) {
    console.error("db.json okunamadı, yeni veritabanı başlatılıyor:", e.message);
    return freshDb();
  }
}
async function persistDb(snapshot) {
  if (!supabase) return;
  const { error } = await supabase
    .from(SUPABASE_STATE_TABLE)
    .upsert({ id: SUPABASE_STATE_ID, data: snapshot, updated_at: now() }, { onConflict: "id" });
  if (error) throw error;
}
async function loadDb() {
  if (!supabase) return readLocalDb();
  try {
    const { data, error } = await supabase.from(SUPABASE_STATE_TABLE).select("data").eq("id", SUPABASE_STATE_ID).maybeSingle();
    if (error) throw error;
    if (data && data.data) return normalizeDb(data.data);
    const firstDb = readLocalDb();
    await persistDb(firstDb);
    return firstDb;
  } catch (e) {
    console.error("Supabase bağlantı/kayıt hatası:", e.message);
    return readLocalDb();
  }
}
function readDb() { if (!dbCache) dbCache = readLocalDb(); return dbCache; }
function saveDb(d) {
  dbCache = normalizeDb(d);
  try { fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2)); } catch (e) { console.error("db.json yazılamadı:", e.message); }
  if (supabase) {
    const snapshot = JSON.parse(JSON.stringify(dbCache));
    dbSaveQueue = dbSaveQueue.catch(() => {}).then(() => persistDb(snapshot)).catch(e => console.error("Supabase kaydetme hatası:", e.message));
  }
  return dbSaveQueue;
}
function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return { ...safe, premiumActive: isPremium(u), premiumDaysLeft: daysLeft(u.premiumUntil) };
}
function maskFirstName(v) {
  const text = String(v || "").trim();
  if (!text) return "-";
  return text;
}
function maskLastName(v) {
  const text = String(v || "").trim();
  if (!text) return "-****";
  return text.charAt(0).toLocaleUpperCase("tr-TR") + "****";
}
function maskName(first, last) { return `${maskFirstName(first)} ${maskLastName(last)}`; }
function maskFullName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "- -****";
  return maskName(parts[0], parts.slice(1).join(" "));
}
function maskPhone(phone) {
  const raw = normalizePhone(phone);
  if (!raw) return "0**** ******";
  return raw.slice(0, 5) + "******";
}
function normalizePhone(phone) {
  let raw = String(phone || "").replace(/\D/g, "");
  if (!raw) return "";
  if (raw.startsWith("90") && raw.length === 12) raw = "0" + raw.slice(2);
  if (raw.startsWith("5") && raw.length === 10) raw = "0" + raw;
  return raw;
}

function makeRef() { return "IK" + Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(10 + Math.random() * 89); }
function notify(d, userId, title, message, type = "info") {
  d.notifications.push({ id: id(), userId, title, message, type, read: false, createdAt: now() });
}
function tx(d, userId, amount, type, desc) {
  d.transactions.push({ id: id(), userId, amount: Number(amount), type, desc, createdAt: now() });
}
function pending(d, userId, amount, type, desc, availableAtDays = 15) {
  d.pendingEarnings.push({ id: id(), userId, amount: Number(amount), type, desc, status: "pending", availableAt: addDays(availableAtDays), createdAt: now() });
}
function releasePending(d) {
  let changed = false;
  for (const e of d.pendingEarnings.filter(x => x.status === "pending" && new Date(x.availableAt) <= new Date())) {
    const u = d.users.find(x => x.id === e.userId);
    if (u && isPremium(u)) {
      u.balance = Number((Number(u.balance || 0) + Number(e.amount || 0)).toFixed(2));
      e.status = "released";
      tx(d, u.id, e.amount, "bekleyen_devri", `${e.desc} çekilebilir bakiyeye devredildi`);
      notify(d, u.id, "Bekleyen Kazanç Aktarıldı", `${e.amount} TL çekilebilir bakiyenize aktarıldı.`, "success");
      changed = true;
    }
  }
  return changed;
}
function expireExpiredPackages(d) {
  let changed = false;
  for (const u of d.users) {
    if (u && Number(u.packageId || 0) > 0 && u.premiumUntil && new Date(u.premiumUntil) <= new Date()) {
      u.lastExpiredPackageId = u.packageId;
      u.packageId = 0;
      u.premiumStartedAt = null;
      u.premiumUntil = null;
      if (u.role === "ceo") u.role = "user";
      notify(d, u.id, "Premium Süresi Bitti", "Paket süreniz bitti. Film erişimi ve kazanç üretimi yeni paket alana kadar durduruldu.", "error");
      changed = true;
    }
  }
  return changed;
}
function processDb(d) {
  const a = expireExpiredPackages(d);
  const b = releasePending(d);
  if (a || b) saveDb(d);
}
function getUserFromReq(req, d) { return d.users.find(u => u.id === req.auth.id); }
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Giriş gerekli" });
  try { req.auth = jwt.verify(token, JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: "Oturum geçersiz" }); }
}
function adminOnly(req, res, next) {
  const d = readDb(); processDb(d);
  const u = getUserFromReq(req, d);
  if (!u || u.role !== "admin") return res.status(403).json({ error: "Admin yetkisi gerekli" });
  req.db = d; req.user = u; next();
}
function ceoOnly(req, res, next) {
  const d = readDb(); processDb(d);
  const u = getUserFromReq(req, d);
  if (!u || !(u.role === "admin" || (isPremium(u) && Number(u.packageId) === 5))) return res.status(403).json({ error: "CEO yetkisi gerekli" });
  req.db = d; req.user = u; next();
}
function userRequired(req, res, next) {
  const d = readDb(); processDb(d);
  const u = getUserFromReq(req, d);
  if (!u) return res.status(401).json({ error: "Kullanıcı bulunamadı" });
  req.db = d; req.user = u; next();
}
function distributeReferral(d, buyer, amount) {
  let sponsorId = buyer.sponsorId;
  for (let level = 1; level <= 3; level++) {
    if (!sponsorId) break;
    const sponsor = d.users.find(u => u.id === sponsorId);
    if (!sponsor) break;
    const pack = findPackage(sponsor.packageId);
    if (pack && isPremium(sponsor) && level <= pack.depth) {
      const earn = Number((Number(amount) * pack.rate).toFixed(2));
      pending(d, sponsor.id, earn, "referans", `${maskName(buyer.firstName, buyer.lastName)} ödemesinden ${level}. seviye referans kazancı`, 15);
      notify(d, sponsor.id, "Referans Kazancı Beklemede", `${earn} TL referans kazancı bekleyen bakiyenize eklendi.`, "success");
    }
    sponsorId = sponsor.sponsorId;
  }
}
function publicMember(d, u) {
  const inviter = d.users.find(x => x.id === u.sponsorId);
  const pack = findPackage(u.packageId);
  return {
    id: u.id,
    maskedName: maskName(u.firstName, u.lastName),
    maskedPhone: maskPhone(u.phone),
    packageId: u.packageId || 0,
    packageName: pack ? pack.name : "Paket Yok",
    inviterMaskedName: inviter ? maskName(inviter.firstName, inviter.lastName) : "Sistem",
    inviterMaskedPhone: inviter ? maskPhone(inviter.phone) : "-",
    createdAt: u.createdAt
  };
}
function publicWithdrawal(d, w) {
  const u = d.users.find(x => x.id === w.userId);
  const pack = findPackage(w.packageId || (u && u.packageId));
  return {
    id: w.id,
    maskedName: w.fullName ? maskFullName(w.fullName) : (u ? maskName(u.firstName, u.lastName) : "-*** -***"),
    maskedPhone: u ? maskPhone(u.phone) : "0*** *********",
    packageName: pack ? pack.name : "Paket Yok",
    packageId: pack ? pack.id : 0,
    amount: w.amount,
    status: w.status,
    createdAt: w.createdAt
  };
}
function childrenOf(d, userId) { return d.users.filter(u => u.sponsorId === userId); }
async function seedAdmin() {
  const d = readDb();
  let admin = d.users.find(u => String(u.email || "").toLowerCase() === ADMIN_EMAIL);
  if (!admin) {
    d.users.push({
      id: id(), firstName: "Yılmaz", lastName: "Oral", email: ADMIN_EMAIL, phone: "05000000000",
      passwordHash: bcrypt.hashSync(ADMIN_PASS, 10), referralCode: "ADMIN", sponsorId: null,
      packageId: 5, premiumStartedAt: now(), premiumUntil: addDays(3650), balance: 0,
      role: "admin", banned: false, createdAt: now()
    });
  } else {
    admin.role = "admin";
    admin.packageId = 5;
    admin.referralCode = admin.referralCode || "ADMIN";
    admin.premiumStartedAt = admin.premiumStartedAt || now();
    admin.premiumUntil = admin.premiumUntil || addDays(3650);
    if (process.env.RESET_ADMIN_PASSWORD_ON_START === "true") admin.passwordHash = bcrypt.hashSync(ADMIN_PASS, 10);
  }
  await saveDb(d);
}
function sendResetMail(email, link) {
  const host = process.env.SMTP_HOST;
  if (!nodemailer || !host) return Promise.resolve(false);
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || ADMIN_EMAIL,
    to: email,
    subject: "İzleKazan Şifre Sıfırlama",
    text: `Şifrenizi yenilemek için bağlantı: ${link}`
  }).then(() => true).catch(e => { console.error("E-posta gönderilemedi:", e.message); return false; });
}

app.get("/api/health", (req, res) => res.json({ ok: true, storage: supabase ? "supabase" : "db.json", time: now(), version: APP_VERSION }));
app.get("/api/version", (req, res) => {
  try {
    const versionFile = path.join(__dirname, "VERSION.json");
    if (fs.existsSync(versionFile)) return res.type("json").send(fs.readFileSync(versionFile, "utf8"));
  } catch (e) {}
  res.json({ currentVersion: APP_VERSION, project: "İzleKazan" });
});
app.get("/api/film-gateway", (req, res) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");

  const rawToken = String(req.query.access || req.query.token || "").trim();
  if (!rawToken) {
    return res.status(403).send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#080b14;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;height:100vh;text-align:center;padding:24px} .box{max-width:520px;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:24px;background:rgba(255,255,255,.06)} h1{font-size:22px} p{color:#cbd5e1}</style></head><body><div class="box"><h1>Premium erişim gerekli</h1><p>Filmleri izlemek için üye girişi yapmanız ve aktif premium paketiniz olması gerekmektedir.</p></div></body></html>`);
  }

  try {
    const decoded = jwt.verify(rawToken, JWT_SECRET);
    const d = readDb(); processDb(d);
    const u = d.users.find(x => x.id === decoded.id);
    if (!u || !isPremium(u)) {
      return res.status(403).send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#080b14;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;height:100vh;text-align:center;padding:24px} .box{max-width:520px;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:24px;background:rgba(255,255,255,.06)} h1{font-size:22px} p{color:#cbd5e1}</style></head><body><div class="box"><h1>Premium erişim gerekli</h1><p>Filmleri izlemek için üye girişi yapmanız ve aktif premium paketiniz olması gerekmektedir.</p></div></body></html>`);
    }
    res.redirect(302, MOVIE_SITE_URL);
  } catch (e) {
    return res.status(403).send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#080b14;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;height:100vh;text-align:center;padding:24px} .box{max-width:520px;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:24px;background:rgba(255,255,255,.06)} h1{font-size:22px} p{color:#cbd5e1}</style></head><body><div class="box"><h1>Oturum doğrulanamadı</h1><p>Lütfen tekrar giriş yapıp premium paket durumunuzu kontrol edin.</p></div></body></html>`);
  }
});

app.get("/api/film-preview", (req, res) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#080b14;color:#fff;font-family:Arial,sans-serif;min-height:100vh;overflow:hidden}.stage{min-height:100vh;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 20% 20%,rgba(246,181,30,.18),transparent 36%),linear-gradient(135deg,#070a13,#111827)}img{width:min(980px,96vw);max-height:82vh;object-fit:cover;border-radius:22px;box-shadow:0 28px 80px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12)}.badge{position:fixed;left:18px;top:18px;background:rgba(0,0,0,.64);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:10px 14px;font-size:13px;color:#f6b51e}</style></head><body><div class="badge">Premium içerik ön izlemesi</div><div class="stage"><img src="/assets/film-afisleri-vitrin.png" alt="Film afişleri"></div></body></html>`);
});
app.get("/api/packages", (req, res) => res.json(PACKAGES));

app.post("/api/register", async (req, res) => {
  const d = readDb(); processDb(d);
  const { firstName, lastName, email, phone, password, password2, referralCode } = req.body || {};
  if (!firstName || !lastName || !email || !phone || !password) return res.status(400).json({ error: "Tüm alanları doldurun" });
  if (password !== password2) return res.status(400).json({ error: "Şifreler eşleşmiyor" });
  const emailNorm = String(email).trim().toLowerCase();
  const phoneNorm = normalizePhone(phone) || String(phone).trim();
  if (d.users.some(u => String(u.email).toLowerCase() === emailNorm)) return res.status(400).json({ error: "Bu e-posta zaten kayıtlı" });
  if (d.users.some(u => normalizePhone(u.phone) === phoneNorm)) return res.status(400).json({ error: "Bu telefon zaten kayıtlı" });
  const sponsor = d.users.find(u => String(u.referralCode || "").toUpperCase() === String(referralCode || "").trim().toUpperCase());
  if (!sponsor) return res.status(400).json({ error: "Geçerli bir referans kodu girilmelidir" });
  const user = {
    id: id(), firstName: String(firstName).trim(), lastName: String(lastName).trim(), email: emailNorm, phone: phoneNorm,
    passwordHash: bcrypt.hashSync(String(password), 10), referralCode: makeRef(), sponsorId: sponsor.id,
    packageId: 0, premiumStartedAt: null, premiumUntil: null, balance: 0, role: "user", banned: false, createdAt: now()
  };
  d.users.push(user);
  notify(d, sponsor.id, "Yeni Referans Kaydı", `${maskName(user.firstName, user.lastName)} referans kodunuzla kayıt oldu.`, "success");
  await saveDb(d);
  res.json({ ok: true, user: publicUser(user) });
});

app.post("/api/login", (req, res) => {
  const d = readDb(); processDb(d);
  const { email, login, username, password } = req.body || {};
  const identifier = String(login || username || email || "").trim();
  const identifierLower = identifier.toLowerCase();
  const identifierPhone = normalizePhone(identifier);
  const u = d.users.find(x =>
    String(x.email || "").toLowerCase() === identifierLower ||
    (identifierPhone && normalizePhone(x.phone) === identifierPhone)
  );
  if (!u || !bcrypt.compareSync(String(password || ""), u.passwordHash || "")) return res.status(401).json({ error: "E-posta/telefon veya şifre hatalı" });
  if (u.banned) return res.status(403).json({ error: "Hesabınız pasif durumda" });
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: publicUser(u) });
});

app.get("/api/me", auth, userRequired, (req, res) => res.json({ user: publicUser(req.user) }));

app.get("/api/dashboard", auth, userRequired, (req, res) => {
  const d = req.db;
  const u = req.user;
  const pack = findPackage(u.packageId);
  const children = childrenOf(d, u.id).map(c => ({ ...publicUser(c), maskedName: maskName(c.firstName, c.lastName), maskedPhone: maskPhone(c.phone), packageName: (findPackage(c.packageId) || {}).name || "Paket Yok" }));
  res.json({
    user: publicUser(u),
    package: pack || null,
    children,
    tx: d.transactions.filter(t => t.userId === u.id).slice().reverse(),
    pendingEarnings: d.pendingEarnings.filter(e => e.userId === u.id).slice().reverse(),
    notifications: d.notifications.filter(n => n.userId === u.id).slice().reverse(),
    tickets: d.supportTickets.filter(t => t.userId === u.id).slice().reverse()
  });
});

app.post("/api/profile", auth, userRequired, async (req, res) => {
  const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body || {};
  const u = req.user;
  if (firstName) u.firstName = String(firstName).trim();
  if (lastName) u.lastName = String(lastName).trim();
  if (email) u.email = String(email).trim().toLowerCase();
  if (phone) u.phone = String(phone).trim();
  if (newPassword) {
    if (!bcrypt.compareSync(String(currentPassword || ""), u.passwordHash || "")) return res.status(400).json({ error: "Mevcut şifre hatalı" });
    u.passwordHash = bcrypt.hashSync(String(newPassword), 10);
  }
  await saveDb(req.db);
  res.json({ ok: true, user: publicUser(u) });
});

app.post("/api/payment", auth, userRequired, async (req, res) => {
  const { packageId, amount, phone, note } = req.body || {};
  const pack = findPackage(packageId);
  if (!pack) return res.status(400).json({ error: "Paket bulunamadı" });

  const existingPending = req.db.payments.find(x => x.userId === req.user.id && x.status === "pending");
  if (existingPending) {
    return res.status(400).json({
      error: "Zaten bekleyen bir ödeme bildiriminiz var. Yeni paket bildirimi yapmadan önce mevcut bildirimin admin tarafından onaylanmasını veya reddedilmesini bekleyin."
    });
  }

  const currentId = isPremium(req.user) ? Number(req.user.packageId || 0) : 0;
  if (currentId && Number(pack.id) < currentId) return res.status(400).json({ error: "Mevcut paketinizden düşük paket seçemezsiniz" });

  const value = Number(amount || pack.price);
  const payment = {
    id: id(), userId: req.user.id, userFullName: `${req.user.firstName} ${req.user.lastName}`,
    packageId: pack.id, amount: value, phone: phone || req.user.phone, note: note || "",
    status: "pending", createdAt: now()
  };
  req.db.payments.push(payment);
  notify(req.db, req.user.id, "Ödeme Bildirimi Alındı", "Ödeme bildiriminiz admin onayına gönderildi. Aynı anda yalnızca 1 ödeme bildirimi oluşturabilirsiniz.", "success");
  await saveDb(req.db);
  res.json({ ok: true, payment });
});

app.post("/api/withdraw", auth, userRequired, async (req, res) => {
  const { fullName, iban, amount } = req.body || {};
  const value = Number(amount || 0);
  if (!value || value <= 0) return res.status(400).json({ error: "Geçerli tutar girin" });
  if (Number(req.user.balance || 0) < value) return res.status(400).json({ error: "Yetersiz çekilebilir bakiye" });
  req.user.balance = Number((Number(req.user.balance || 0) - value).toFixed(2));
  const w = { id: id(), userId: req.user.id, packageId: req.user.packageId || 0, fullName: fullName || `${req.user.firstName} ${req.user.lastName}`, iban: iban || "", amount: value, status: "pending", createdAt: now() };
  req.db.withdrawals.push(w);
  tx(req.db, req.user.id, -value, "çekim_talebi", "Çekim talebi oluşturuldu");
  notify(req.db, req.user.id, "Çekim Talebi Gönderildi", `${value} TL çekim talebiniz admin onayına gönderildi.`, "success");
  await saveDb(req.db);
  res.json({ ok: true, withdrawal: w });
});

app.post("/api/support", auth, userRequired, async (req, res) => {
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ error: "Konu ve mesaj yazın" });
  const t = { id: id(), userId: req.user.id, subject: String(subject), message: String(message), replies: [], status: "open", createdAt: now(), updatedAt: now() };
  req.db.supportTickets.push(t);
  await saveDb(req.db);
  res.json({ ok: true, ticket: t });
});

app.get("/api/movies", authOptional, (req, res) => {
  const d = readDb(); processDb(d);
  const u = req.auth ? d.users.find(x => x.id === req.auth.id) : null;
  const canWatch = !!(u && isPremium(u));
  const movies = d.movies.filter(m => m.status === "published").map(m => ({
    id: m.id,
    title: m.title,
    year: m.year,
    category: m.category,
    poster: m.poster || "/assets/movie-poster.svg",
    description: m.description || "",
    status: m.status,
    // Gerçek film sitesi adresi istemciye verilmez. Üye olmayanlarda da gizli geçit açılır,
    // tıklama/izleme kilidi istemci katmanında korunur.
    watchLink: "/api/film-gateway",
    link: "",
    embedLink: "",
    locked: !canWatch
  }));
  res.json(movies);
});
function authOptional(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (token) { try { req.auth = jwt.verify(token, JWT_SECRET); } catch (e) {} }
  next();
}

app.post("/api/movies", auth, userRequired, async (req, res) => {
  const { title, year, category, poster, link, embedLink, description } = req.body || {};
  if (!title || !link) return res.status(400).json({ error: "Film adı ve link zorunludur" });
  const isCeo = req.user.role === "admin" || (isPremium(req.user) && Number(req.user.packageId) === 5);
  const movie = { id: id(), title, year, category, poster: poster || "/assets/movie-poster.svg", link, embedLink: embedLink || link, description, status: isCeo ? "admin_pending" : "ceo_pending", addedBy: req.user.id, ceoApprovedBy: isCeo ? req.user.id : null, adminApprovedBy: null, createdAt: now() };
  req.db.movies.push(movie);
  await saveDb(req.db);
  res.json({ ok: true, movie });
});

app.get("/api/ceo/pending", auth, ceoOnly, (req, res) => res.json(req.db.movies.filter(m => m.status === "ceo_pending")));
app.post("/api/ceo/approve/:id", auth, ceoOnly, async (req, res) => {
  const m = req.db.movies.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Film bulunamadı" });
  m.status = "admin_pending"; m.ceoApprovedBy = req.user.id; m.ceoApprovedAt = now();
  await saveDb(req.db); res.json({ ok: true });
});
app.post("/api/ceo/reject/:id", auth, ceoOnly, async (req, res) => {
  const m = req.db.movies.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Film bulunamadı" });
  m.status = "rejected"; m.rejectReason = (req.body || {}).reason || "Uygun değil"; m.rejectedAt = now();
  await saveDb(req.db); res.json({ ok: true });
});

app.get("/api/public/withdrawals", (req, res) => { const d = readDb(); processDb(d); res.json({ withdrawals: d.withdrawals.slice().reverse().map(w => publicWithdrawal(d, w)) }); });
app.get("/api/public/members", (req, res) => { const d = readDb(); processDb(d); res.json({ members: d.users.filter(u => u.role !== "admin").slice().reverse().map(u => publicMember(d, u)) }); });

app.get("/api/admin/all", auth, adminOnly, (req, res) => {
  const d = req.db;
  res.json({
    users: d.users.map(publicUser),
    payments: d.payments.slice().reverse(),
    withdrawals: d.withdrawals.slice().reverse(),
    movies: d.movies.slice().reverse(),
    supportTickets: d.supportTickets.slice().reverse(),
    packages: PACKAGES,
    transactions: d.transactions.slice().reverse(),
    pendingEarnings: d.pendingEarnings.slice().reverse()
  });
});

app.post("/api/admin/payments/:id/approve", auth, adminOnly, async (req, res) => {
  const p = req.db.payments.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Ödeme bulunamadı" });
  if (p.status === "approved") return res.json({ ok: true });
  const u = req.db.users.find(x => x.id === p.userId);
  const pack = findPackage(p.packageId);
  if (!u || !pack) return res.status(404).json({ error: "Kullanıcı veya paket bulunamadı" });
  const createdTime = new Date(p.createdAt || 0).getTime();
  const duplicateApproved = req.db.payments.find(x =>
    x.id !== p.id &&
    x.userId === p.userId &&
    x.status === "approved" &&
    Number(x.packageId) === Number(p.packageId) &&
    Number(x.amount || 0) === Number(p.amount || 0) &&
    Math.abs(new Date(x.createdAt || 0).getTime() - createdTime) <= 24 * 60 * 60 * 1000
  );
  if (duplicateApproved) {
    p.status = "rejected";
    p.rejectReason = "Mükerrer ödeme bildirimi: Aynı kullanıcı için aynı paket ödemesi daha önce onaylandı.";
    p.rejectedAt = now();
    p.rejectedBy = req.user.id;
    notify(req.db, u.id, "Mükerrer Ödeme Bildirimi", "Aynı paket için daha önce onaylanan ödeme bulunduğu için bu bildirim işleme alınmadı.", "error");
    await saveDb(req.db);
    return res.status(400).json({ error: "Bu ödeme bildirimi mükerrer görünüyor. Aynı kullanıcı için aynı paket ödemesi daha önce onaylanmış." });
  }

  p.status = "approved"; p.approvedAt = now(); p.approvedBy = req.user.id;
  const startFrom = isPremium(u) && Number(u.packageId) === Number(pack.id) && u.premiumUntil ? u.premiumUntil : now();
  u.packageId = pack.id;
  u.premiumStartedAt = u.premiumStartedAt || now();
  u.premiumUntil = addDaysTo(startFrom, pack.durationDays);
  if (pack.id === 5 && u.role !== "admin") u.role = "ceo";
  if (!u.referralCode) u.referralCode = makeRef();
  tx(req.db, u.id, 0, "paket_onay", `${pack.name} paketi onaylandı`);
  notify(req.db, u.id, "Premium Paket Onaylandı", `${pack.name} paketiniz aktif edildi.`, "success");
  distributeReferral(req.db, u, Number(p.amount || pack.price));
  await saveDb(req.db);
  res.json({ ok: true });
});
app.post("/api/admin/payments/:id/reject", auth, adminOnly, async (req, res) => {
  const p = req.db.payments.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Ödeme bulunamadı" });
  p.status = "rejected"; p.rejectReason = (req.body || {}).reason || "Ödeme doğrulanamadı"; p.rejectedAt = now();
  const u = req.db.users.find(x => x.id === p.userId);
  if (u) notify(req.db, u.id, "Ödeme Reddedildi", p.rejectReason, "error");
  await saveDb(req.db); res.json({ ok: true });
});

app.post("/api/admin/movies/:id/publish", auth, adminOnly, async (req, res) => {
  const m = req.db.movies.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Film bulunamadı" });
  m.status = "published"; m.adminApprovedBy = req.user.id; m.adminApprovedAt = now();
  const owner = req.db.users.find(u => u.id === m.addedBy);
  if (owner && owner.id !== "system" && isPremium(owner)) {
    pending(req.db, owner.id, 10, "film_ekleme", `${m.title} filmi onaylandı`, 15);
    notify(req.db, owner.id, "Film Onaylandı", `${m.title} filmi yayınlandı ve kazanç bekleyen bakiyenize eklendi.`, "success");
  }
  await saveDb(req.db); res.json({ ok: true });
});
app.post("/api/admin/movies/:id/reject", auth, adminOnly, async (req, res) => {
  const m = req.db.movies.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: "Film bulunamadı" });
  m.status = "rejected"; m.rejectReason = (req.body || {}).reason || "Film uygun değil"; m.rejectedAt = now();
  const owner = req.db.users.find(u => u.id === m.addedBy);
  if (owner) notify(req.db, owner.id, "Film Reddedildi", `${m.title}: ${m.rejectReason}`, "error");
  await saveDb(req.db); res.json({ ok: true });
});

app.post("/api/admin/support/:id/reply", auth, adminOnly, async (req, res) => {
  const t = req.db.supportTickets.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "Destek kaydı bulunamadı" });
  const message = (req.body || {}).message || "";
  if (!message) return res.status(400).json({ error: "Cevap yazın" });
  t.replies.push({ id: id(), adminId: req.user.id, message, createdAt: now() });
  t.status = "answered"; t.updatedAt = now();
  notify(req.db, t.userId, "Destek Talebiniz Cevaplandı", message, "success");
  await saveDb(req.db); res.json({ ok: true });
});

app.post("/api/admin/withdrawals/:id/approve", auth, adminOnly, async (req, res) => {
  const w = req.db.withdrawals.find(x => x.id === req.params.id);
  if (!w) return res.status(404).json({ error: "Çekim bulunamadı" });
  w.status = "approved"; w.approvedAt = now(); w.approvedBy = req.user.id;
  notify(req.db, w.userId, "Çekim Talebi Onaylandı", `${w.amount} TL çekim talebiniz ödeme yapıldı olarak işaretlendi.`, "success");
  await saveDb(req.db); res.json({ ok: true });
});
app.post("/api/admin/withdrawals/:id/reject", auth, adminOnly, async (req, res) => {
  const w = req.db.withdrawals.find(x => x.id === req.params.id);
  if (!w) return res.status(404).json({ error: "Çekim bulunamadı" });
  if (w.status === "pending") {
    const u = req.db.users.find(x => x.id === w.userId);
    if (u) u.balance = Number((Number(u.balance || 0) + Number(w.amount || 0)).toFixed(2));
  }
  w.status = "rejected"; w.rejectReason = (req.body || {}).reason || "Çekim reddedildi"; w.rejectedAt = now();
  notify(req.db, w.userId, "Çekim Talebi Reddedildi", w.rejectReason, "error");
  await saveDb(req.db); res.json({ ok: true });
});

app.post("/api/forgot-password", async (req, res) => {
  const d = readDb();
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  const u = d.users.find(x => String(x.email || "").toLowerCase() === email);
  const generic = { ok: true, message: "E-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi." };
  if (!u) return res.json(generic);
  const resetToken = crypto.randomBytes(24).toString("hex");
  d.passwordResets.push({ id: id(), userId: u.id, token: resetToken, expiresAt: addDaysTo(now(), 1), used: false, createdAt: now() });
  const link = `${PUBLIC_URL}/?reset=${resetToken}`;
  await saveDb(d);
  const sent = await sendResetMail(email, link);
  res.json({ ...generic, demoLink: sent ? undefined : link });
});

app.post("/api/reset-password", async (req, res) => {
  const d = readDb();
  const { token, newPassword } = req.body || {};
  const r = d.passwordResets.find(x => x.token === token && !x.used && new Date(x.expiresAt) > new Date());
  if (!r) return res.status(400).json({ error: "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş" });
  const u = d.users.find(x => x.id === r.userId);
  if (!u) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
  if (!newPassword || String(newPassword).length < 4) return res.status(400).json({ error: "Yeni şifre çok kısa" });
  u.passwordHash = bcrypt.hashSync(String(newPassword), 10);
  r.used = true; r.usedAt = now();
  await saveDb(d);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

loadDb().then(async d => {
  dbCache = normalizeDb(d);
  await seedAdmin();
  app.listen(PORT, () => console.log(`İzleKazan çalışıyor: ${PORT} | storage: ${supabase ? "supabase" : "db.json"}`));
}).catch(e => {
  console.error("Sunucu başlatılamadı:", e);
  process.exit(1);
});
