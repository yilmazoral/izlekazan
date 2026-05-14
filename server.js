try { require("dotenv").config(); } catch (e) {}

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch(e) { nodemailer = null; }
let createClient = null;
try { ({ createClient } = require("@supabase/supabase-js")); } catch(e) { createClient = null; }

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "izlekazan_development_secret_change_me";
const DB_FILE = path.join(__dirname, "db.json");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "yilmazoral@hotmail.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "059221";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || "";
const SUPABASE_STATE_TABLE = process.env.SUPABASE_STATE_TABLE || "izlekazan_state";
const SUPABASE_STATE_ID = process.env.SUPABASE_STATE_ID || "main";
const supabase = createClient && SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

let dbCache = null;
let dbSaveQueue = Promise.resolve();

app.use(express.json({ limit: "3mb" }));
app.use(express.static(__dirname));

const PACKAGES = [
  {id:1,name:"Standart Üye",price:100,depth:1,rate:0.10,durationDays:365,badge:"Başlangıç",features:["1 yıl premium film erişimi","Reklamsız Film Platformu filmlerine erişim","1. seviye referanslardan %10 kazanç","Referans kodu paket aktif olunca görünür","Siteye Film Ekleme Kazancı","Cüzdan, destek ve çekim talebi"]},
  {id:2,name:"Kıdemli Üye",price:200,depth:2,rate:0.10,durationDays:365,badge:"2 Seviye",features:["Standart Üye özelliklerinin tamamı","1. ve 2. seviye referanslardan %10 kazanç","Alt üye ağacını daha geniş takip","Referans kazanç geçmişi","1 yıl aktif premium üyelik","Siteye Film Ekleme Kazancı"]},
  {id:3,name:"Ortak",price:300,depth:3,rate:0.10,durationDays:365,badge:"3 Seviye",features:["Kıdemli Üye özelliklerinin tamamı","1, 2 ve 3. seviye referanslardan %10 kazanç","Platform gelir ortaklığına tam katılım","Geniş referans ağı takibi","1 yıl premium erişim","Siteye Film Ekleme Kazancı"]},
  {id:4,name:"Kıdemli Ortak",price:500,depth:3,rate:0.20,durationDays:365,badge:"Yüksek Prim",features:["Ortak paket özelliklerinin tamamı","İlk 3 referans seviyesinden %20 kazanç","Daha yüksek cüzdan kazanç potansiyeli","Gelişmiş kazanç takibi","1 yıl premium erişim","Siteye Film Ekleme Kazancı"]},
  {id:5,name:"CEO Üye",price:1000,depth:3,rate:0.30,durationDays:365,badge:"En Üst Seviye",features:["Tüm özelliklere tam erişim","İlk 3 referans seviyesinden %30 kazanç","CEO film ön onay paneli","Onayladığı film başına extra kazanç","Siteye Film Ekleme Kazancı","1 yıl premium erişim"]}
];

function now(){ return new Date().toISOString(); }
function addDays(days){ const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString(); }
function addDaysToDate(dateValue, days){ const d = new Date(dateValue); d.setDate(d.getDate()+days); return d.toISOString(); }
function expireExpiredPackages(d){
  const t = new Date();
  let changed = false;
  d.users.forEach(u => {
    if(u && Number(u.packageId || 0) > 0 && u.premiumUntil && new Date(u.premiumUntil) <= t){
      u.lastExpiredPackageId = u.packageId;
      u.packageId = 0;
      u.premiumStartedAt = null;
      u.premiumUntil = null;
      if(u.role === "ceo") u.role = "user";
      notify(d, u.id, "Premium Süresi Bitti", "Paket süreniz bitti. Film erişimi ve kazanç üretimi yeni paket alana kadar durduruldu.", "error");
      changed = true;
    }
  });
  return changed;
}
function daysLeft(dateStr){ if(!dateStr) return 0; return Math.max(0, Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24))); }
function isPremium(u){ return !!(u && u.packageId > 0 && u.premiumUntil && new Date(u.premiumUntil) > new Date()); }

function defaultMovie(){
  return {
    id: uuidv4(),
    title: "Reklamsız Film Platformu",
    year: "2026",
    category: "Film Arşivi",
    poster: "/assets/movie-poster.svg",
    description: "Premium üyeler için reklamsız film platformu.",
    link: "https://hdizleplus.com/",
    embedLink: "https://hdizleplus.com/",
    status: "published",
    addedBy: "system",
    ceoApprovedBy: "system",
    adminApprovedBy: "system",
    createdAt: now()
  };
}

function freshDb(){
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

function normalizeDb(data){
  const base = freshDb();
  const d = data && typeof data === "object" ? data : {};
  const out = { ...base, ...d };
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

function readLocalDb(){
  try {
    if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(freshDb(), null, 2));
    return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
  } catch (error) {
    console.error("Yerel db.json okunamadı, yeni veritabanı başlatılıyor:", error.message);
    return freshDb();
  }
}

async function loadDb(){
  if(!supabase){
    console.warn("Supabase ayarı bulunamadı. Geçici olarak db.json kullanılacak. Kalıcı kayıt için SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ekleyin.");
    return readLocalDb();
  }

  try {
    const { data, error } = await supabase
      .from(SUPABASE_STATE_TABLE)
      .select("data")
      .eq("id", SUPABASE_STATE_ID)
      .maybeSingle();

    if(error) throw error;
    if(data && data.data){
      console.log("Supabase veritabanı yüklendi:", SUPABASE_STATE_TABLE);
      return normalizeDb(data.data);
    }

    const firstDb = readLocalDb();
    await persistDb(firstDb);
    console.log("Supabase veritabanı ilk kez oluşturuldu:", SUPABASE_STATE_TABLE);
    return firstDb;
  } catch (error) {
    console.error("Supabase bağlantı/kayıt hatası:", error.message);
    console.error("Tablonun oluşturulduğundan ve Environment Variable değerlerinin doğru olduğundan emin olun.");
    return readLocalDb();
  }
}

async function persistDb(snapshot){
  if(!supabase) return;
  const { error } = await supabase
    .from(SUPABASE_STATE_TABLE)
    .upsert({ id: SUPABASE_STATE_ID, data: snapshot, updated_at: now() }, { onConflict: "id" });
  if(error) throw error;
}

function readDb(){
  if(!dbCache) dbCache = readLocalDb();
  return dbCache;
}

function saveDb(d){
  dbCache = normalizeDb(d);
  try { fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2)); } catch(e) { console.error("Yerel yedek kaydedilemedi:", e.message); }
  if(supabase){
    const snapshot = JSON.parse(JSON.stringify(dbCache));
    dbSaveQueue = dbSaveQueue
      .catch(() => {})
      .then(() => persistDb(snapshot))
      .catch((error) => console.error("Supabase kaydetme hatası:", error.message));
    return dbSaveQueue;
  }
  return Promise.resolve();
}

function pub(u){ if(!u) return null; const {passwordHash, ...r}=u; return {...r, premiumActive:isPremium(u), premiumDaysLeft:daysLeft(u.premiumUntil)}; }
function maskPart(value){
  const text = String(value || "").trim();
  if(!text) return "-***";
  return text.charAt(0).toLocaleUpperCase("tr-TR") + "***";
}
function maskName(firstName, lastName){
  return `${maskPart(firstName)} ${maskPart(lastName)}`;
}
function maskFullName(fullName){
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return "-*** -***";
  return maskName(parts[0], parts.slice(1).join(" "));
}
function maskPhone(phone){
  const raw = String(phone || "").replace(/\D/g, "");
  if(!raw) return "0*** *********";
  return raw.slice(0, 4) + "*********";
}
function maskSensitiveText(d, text){
  let out = String(text || "");
  (d.users || []).forEach(u => {
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    if(full.length > 1){
      out = out.split(full).join(maskName(u.firstName, u.lastName));
    }
    if(u.phone){
      out = out.split(String(u.phone)).join(maskPhone(u.phone));
    }
  });
  return out;
}
function publicChild(c){
  return {
    id: c.id,
    firstName: maskPart(c.firstName),
    lastName: maskPart(c.lastName),
    maskedName: maskName(c.firstName, c.lastName),
    phone: maskPhone(c.phone),
    maskedPhone: maskPhone(c.phone),
    packageId: c.packageId || 0,
    premiumStartedAt: c.premiumStartedAt || null,
    premiumUntil: c.premiumUntil || null,
    premiumActive: isPremium(c)
  };
}
function makeRef(){ return "IK" + Math.random().toString(36).slice(2,8).toUpperCase() + Math.floor(10+Math.random()*89); }
function notify(d,userId,title,message,type="info"){ d.notifications.push({id:uuidv4(),userId,title,message,type,read:false,createdAt:now()}); }
function ticket(d,userId,subject,message,status="open"){ d.supportTickets.push({id:uuidv4(),userId,subject,message,replies:[],status,createdAt:now(),updatedAt:now()}); }
function tx(d,userId,amount,type,desc){ d.transactions.push({id:uuidv4(),userId,amount,type,desc,createdAt:now()}); }
function pending(d,userId,amount,type,desc,availableAtDays=15){ const a = new Date(); a.setDate(a.getDate()+availableAtDays); d.pendingEarnings.push({id:uuidv4(),userId,amount,type,desc,status:"pending",availableAt:a.toISOString(),createdAt:now()}); }
function releasePending(d){
  const t = new Date();
  d.pendingEarnings.filter(e=>e.status==="pending" && new Date(e.availableAt)<=t).forEach(e=>{
    const u=d.users.find(x=>x.id===e.userId);
    if(u && isPremium(u)){
      u.balance = Number((Number(u.balance||0)+Number(e.amount)).toFixed(2));
      e.status="released";
      tx(d,u.id,Number(e.amount),"bekleyen_devri",e.desc+" çekilebilir bakiyeye devredildi");
      notify(d,u.id,"Bekleyen Kazanç Aktarıldı",`${e.amount} TL çekilebilir bakiyenize aktarıldı.`,"success");
    }
  });
}
async function seedAdmin(){
  const d = readDb();
  let admin = d.users.find(u => String(u.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if(!admin){
    d.users.push({
      id: uuidv4(),
      firstName: "Yılmaz",
      lastName: "Oral",
      email: ADMIN_EMAIL.toLowerCase(),
      phone: "05000000000",
      passwordHash: bcrypt.hashSync(ADMIN_PASS, 10),
      referralCode: "ADMIN",
      sponsorId: null,
      packageId: 5,
      premiumStartedAt: now(),
      premiumUntil: addDays(3650),
      balance: 0,
      role: "admin",
      banned: false,
      createdAt: now()
    });
  } else {
    admin.role = "admin";
    admin.packageId = 5;
    admin.referralCode = admin.referralCode || "ADMIN";
    admin.premiumStartedAt = admin.premiumStartedAt || now();
    admin.premiumUntil = admin.premiumUntil || addDays(3650);
    if(process.env.RESET_ADMIN_PASSWORD_ON_START === "true"){
      admin.passwordHash = bcrypt.hashSync(ADMIN_PASS, 10);
    }
  }
  await saveDb(d);
}

function auth(req,res,next){ const h=req.headers.authorization||""; const token=h.startsWith("Bearer ")?h.slice(7):null; if(!token) return res.status(401).json({error:"Giriş gerekli"}); try{req.auth=jwt.verify(token,JWT_SECRET);next()}catch(e){res.status(401).json({error:"Oturum geçersiz"});} }
function user(req,d){return d.users.find(u=>u.id===req.auth.id);}
function adminOnly(req,res,next){const d=readDb();expireExpiredPackages(d);releasePending(d);const u=user(req,d);if(!u||u.role!=="admin")return res.status(403).json({error:"Admin yetkisi gerekli"});saveDb(d);req.db=d;req.user=u;next();}
function ceoOnly(req,res,next){const d=readDb();expireExpiredPackages(d);releasePending(d);const u=user(req,d);if(!u || !(u.role==="admin" || (isPremium(u) && u.packageId===5)))return res.status(403).json({error:"CEO yetkisi gerekli"});saveDb(d);req.db=d;req.user=u;next();}
function distributeReferral(d,buyer,amount){
  let sid=buyer.sponsorId;
  for(let level=1; level<=3; level++){
    if(!sid)break;
    const sponsor=d.users.find(u=>u.id===sid);
    if(!sponsor)break;
    const pack=PACKAGES.find(p=>p.id===sponsor.packageId);
    if(pack && isPremium(sponsor) && level<=pack.depth){
      const earn=Number((amount*pack.rate).toFixed(2));
      pending(d, sponsor.id, earn, "referans", `${maskName(buyer.firstName, buyer.lastName)} ödemesinden ${level}. seviye referans kazancı`, 15);
      notify(d,sponsor.id,"Referans Kazancı Beklemede",`${earn} TL referans kazancı bekleyen bakiyenize eklendi. 15 gün sonra çekilebilir bakiyeye aktarılır.`,"success");
    }
    sid=sponsor.sponsorId;
  }
}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.get("/api/health", (req, res) => res.json({ ok: true, storage: supabase ? "supabase" : "db.json", table: supabase ? SUPABASE_STATE_TABLE : null }));
app.get("/api/packages",(req,res)=>res.json(PACKAGES));

app.post("/api/register",(req,res)=>{
  const {firstName,lastName,email,phone,password,password2,referralCode}=req.body;
  if(!firstName||!lastName||!email||!phone||!password||!password2) return res.status(400).json({error:"Tüm alanları doldurun"});
  if(password!==password2) return res.status(400).json({error:"Şifreler eşleşmiyor"});
  if(!/^0\d{10}$/.test(phone)) return res.status(400).json({error:"Telefon 05XXXXXXXXX formatında olmalı"});
  const d=readDb();
  if(d.users.find(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(400).json({error:"Bu email zaten kayıtlı"});
  if(d.users.find(u=>u.phone===phone)) return res.status(400).json({error:"Bu telefon zaten kayıtlı"});
  const refText = String(referralCode||"").trim().toUpperCase();
  if(!refText) return res.status(400).json({error:"Geçerli bir referans kodu girilmeden üye olunamaz"});
  const sponsor=d.users.find(u=>u.referralCode.toUpperCase()===refText);
  if(!sponsor) return res.status(400).json({error:"Referans kodu geçersiz"});
  const u={id:uuidv4(),firstName,lastName,email:email.toLowerCase(),phone,passwordHash:bcrypt.hashSync(password,10),referralCode:makeRef(),sponsorId:sponsor.id,packageId:0,premiumStartedAt:null,premiumUntil:null,balance:0,role:"user",banned:false,createdAt:now()};
  d.users.push(u); notify(d,u.id,"Hoş Geldiniz","Paket satın aldığınızda referans kodunuz aktif olacak.","info"); saveDb(d); res.json({success:true,user:pub(u)});
});
app.post("/api/login",(req,res)=>{
  const d=readDb(); expireExpiredPackages(d); releasePending(d);
  const u=d.users.find(x=>x.email===String(req.body.email||"").toLowerCase());
  if(!u||!bcrypt.compareSync(req.body.password||"",u.passwordHash)) return res.status(400).json({error:"Email veya şifre hatalı"});
  if(u.banned) return res.status(403).json({error:"Hesabınız yasaklanmış"});
  const token=jwt.sign({id:u.id,role:u.role},JWT_SECRET,{expiresIn:"7d"}); saveDb(d); res.json({token,user:pub(u)});
});
app.get("/api/me",auth,(req,res)=>{ const d=readDb(); expireExpiredPackages(d); releasePending(d); const u=user(req,d); saveDb(d); res.json({user:pub(u),package:PACKAGES.find(p=>p.id===u.packageId)||null}); });
app.post("/api/profile",auth,(req,res)=>{
  const d=readDb(); const u=user(req,d);
  const {firstName,lastName,email,phone,currentPassword,newPassword}=req.body;
  if(firstName)u.firstName=firstName; if(lastName)u.lastName=lastName;
  if(email && email.toLowerCase()!==u.email){ if(d.users.find(x=>x.email===email.toLowerCase() && x.id!==u.id)) return res.status(400).json({error:"Bu email başka hesapta kayıtlı"}); u.email=email.toLowerCase(); }
  if(phone && phone!==u.phone){ if(!/^0\d{10}$/.test(phone)) return res.status(400).json({error:"Telefon 05XXXXXXXXX formatında olmalı"}); if(d.users.find(x=>x.phone===phone && x.id!==u.id)) return res.status(400).json({error:"Bu telefon başka hesapta kayıtlı"}); u.phone=phone; }
  if(newPassword){ if(!bcrypt.compareSync(currentPassword||"",u.passwordHash)) return res.status(400).json({error:"Mevcut şifre hatalı"}); if(newPassword.length<6) return res.status(400).json({error:"Yeni şifre en az 6 karakter olmalı"}); u.passwordHash=bcrypt.hashSync(newPassword,10); notify(d,u.id,"Şifre Değiştirildi","Hesap şifreniz başarıyla değiştirildi.","success"); }
  saveDb(d); res.json({success:true,user:pub(u)});
});
app.get("/api/dashboard",auth,(req,res)=>{
  const d=readDb(); expireExpiredPackages(d); releasePending(d); const u=user(req,d); saveDb(d);
  const children = d.users
    .filter(x=>x.sponsorId===u.id)
    .map(c=>({...publicChild(c), packageName:(PACKAGES.find(p=>p.id===c.packageId)||{}).name||"Paket Yok"}));
  const txList = d.transactions
    .filter(x=>x.userId===u.id)
    .slice()
    .reverse()
    .map(x=>({...x, desc: maskSensitiveText(d, x.desc)}));
  const pendingList = d.pendingEarnings
    .filter(x=>x.userId===u.id)
    .slice()
    .reverse()
    .map(x=>({...x, desc: maskSensitiveText(d, x.desc)}));
  res.json({
    user:pub(u),
    package:PACKAGES.find(p=>p.id===u.packageId)||null,
    children,
    payments:d.payments.filter(x=>x.userId===u.id),
    withdrawals:d.withdrawals.filter(x=>x.userId===u.id),
    movies:d.movies.filter(x=>x.addedBy===u.id),
    tx:txList,
    pendingEarnings:pendingList,
    notifications:d.notifications.filter(x=>x.userId===u.id).slice().reverse(),
    tickets:d.supportTickets.filter(x=>x.userId===u.id).slice().reverse()
  });
});
app.post("/api/payment",auth,(req,res)=>{
  const d=readDb(); expireExpiredPackages(d); const u=user(req,d); const pack=PACKAGES.find(p=>p.id===Number(req.body.packageId));
  if(!pack) return res.status(400).json({error:"Paket bulunamadı"});
  if(req.body.phone!==u.phone) return res.status(400).json({error:"Telefon hesabınızla eşleşmiyor"});
  if(Number(req.body.amount)!==pack.price) return res.status(400).json({error:"Tutar paket fiyatı ile aynı olmalı"});
  if(isPremium(u) && Number(pack.id) < Number(u.packageId||0)) return res.status(400).json({error:"Mevcut paketinizden düşük paket seçemezsiniz"});
  if(d.payments.find(p=>p.userId===u.id&&p.status==="pending")) return res.status(400).json({error:"Bekleyen ödeme bildiriminiz var"});
  d.payments.push({id:uuidv4(),userId:u.id,userFullName:`${u.firstName} ${u.lastName}`,phone:u.phone,packageId:pack.id,packageName:pack.name,amount:pack.price,note:req.body.note||u.phone,status:"pending",createdAt:now(),archive:false});
  notify(d,u.id,"Ödeme Bildirimi Alındı",`${pack.name} için ödeme bildiriminiz admin onayına gönderildi.`,"info"); saveDb(d); res.json({success:true});
});
app.post("/api/withdraw",auth,(req,res)=>{
  const d=readDb(); const u=user(req,d); const amount=Number(req.body.amount);
  if(amount<50||amount%50!==0) return res.status(400).json({error:"Minimum 50 TL ve 50 TL katları çekilebilir"});
  if(amount>Number(u.balance||0)) return res.status(400).json({error:"Yetersiz bakiye"});
  if(d.withdrawals.find(w=>w.userId===u.id&&w.status==="pending")) return res.status(400).json({error:"Bekleyen çekim talebiniz var"});
  const pack=PACKAGES.find(p=>p.id===Number(u.packageId||0));
  d.withdrawals.push({id:uuidv4(),userId:u.id,fullName:req.body.fullName || `${u.firstName} ${u.lastName}`,phone:u.phone,iban:req.body.iban,amount,packageId:Number(u.packageId||0),packageName:pack?pack.name:"Paket Yok",status:"pending",createdAt:now()});
  notify(d,u.id,"Çekim Talebi Alındı",`${amount} TL çekim talebiniz admin onayına gönderildi.`,"info"); saveDb(d); res.json({success:true});
});
app.get("/api/public/withdrawals",(req,res)=>{
  const d=readDb(); expireExpiredPackages(d); releasePending(d); saveDb(d);
  const list = d.withdrawals
    .slice()
    .reverse()
    .map(w=>{
      const u = d.users.find(x=>x.id===w.userId);
      const nameSource = w.fullName || (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "");
      const phoneSource = w.phone || (u ? u.phone : "");
      return {
        id: w.id,
        maskedName: u ? maskName(u.firstName, u.lastName) : maskFullName(nameSource),
        maskedPhone: maskPhone(phoneSource),
        packageId: w.packageId || (u ? Number(u.packageId || 0) : 0),
        packageName: w.packageName || ((PACKAGES.find(p=>p.id===Number(w.packageId || (u ? u.packageId : 0)))||{}).name) || "Paket Yok",
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
        approvedAt: w.approvedAt || null,
        rejectReason: w.status === "rejected" ? (w.rejectReason || "Reddedildi") : undefined
      };
    });
  res.json({withdrawals:list});
});
app.get("/api/movies",(req,res)=>{
  const d=readDb();
  expireExpiredPackages(d);
  releasePending(d);

  let u = null;
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  if(token){
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      u = d.users.find(x => x.id === decoded.id) || null;
    } catch(e) {
      u = null;
    }
  }

  const premium = isPremium(u);
  saveDb(d);

  res.json(
    d.movies
      .filter(m => m.status === "published")
      .map(m => ({
        id: m.id,
        title: m.title,
        year: m.year,
        category: m.category,
        poster: m.poster,
        description: m.description,
        status: m.status,
        locked: !premium,
        link: premium ? m.link : null,
        embedLink: premium ? (m.embedLink || m.playerLink || m.link || null) : null,
        watchLink: premium ? (m.embedLink || m.playerLink || m.link || null) : null
      }))
  );
});
app.post("/api/movies",auth,(req,res)=>{
  const d=readDb(); expireExpiredPackages(d); const u=user(req,d);
  const {title,year,category,poster,description}=req.body;
  const link = String(req.body.link || "").trim();
  const embedLink = String(req.body.embedLink || req.body.playerLink || "").trim();
  const watchLink = embedLink || link;
  if(!isPremium(u)) return res.status(403).json({error:"Film ekleme ve kazanç sistemi yalnızca aktif premium üyeler içindir"});
  if(!title||!watchLink) return res.status(400).json({error:"Film adı ve film sayfa veya embed/player linki zorunlu"});
  if(d.movies.find(m=>(m.link && m.link===link)||(m.embedLink && m.embedLink===embedLink)||(m.title.toLowerCase()===title.toLowerCase()&&m.year===year))) return res.status(400).json({error:"Bu film zaten eklenmiş"});
  d.movies.push({id:uuidv4(),title,year,category,poster,description,link:link || watchLink,embedLink:embedLink || watchLink,status:"ceo_pending",addedBy:u.id,ceoApprovedBy:null,adminApprovedBy:null,createdAt:now()});
  notify(d,u.id,"Film Gönderildi",`${title} filmi CEO onayına gönderildi.`,"info"); saveDb(d); res.json({success:true});
});
app.get("/api/ceo/pending",auth,ceoOnly,(req,res)=>res.json(req.db.movies.filter(m=>m.status==="ceo_pending")));
app.post("/api/ceo/approve/:id",auth,ceoOnly,(req,res)=>{
  const d=req.db; const m=d.movies.find(x=>x.id===req.params.id); if(!m) return res.status(404).json({error:"Film yok"});
  if(m.addedBy===req.user.id) return res.status(400).json({error:"Kendi filminizi onaylayamazsınız"});
  m.status="admin_pending"; m.ceoApprovedBy=req.user.id; m.ceoApprovedAt=now();
  notify(d,m.addedBy,"Film CEO Onayından Geçti",`${m.title} admin yayın onayına gönderildi.`,"success");
  notify(d,req.user.id,"CEO Onayı Tamam",`${m.title} admin yayın onayına gönderildi.`,"success"); saveDb(d); res.json({success:true});
});
app.post("/api/ceo/reject/:id",auth,ceoOnly,(req,res)=>{
  const d=req.db; const m=d.movies.find(x=>x.id===req.params.id); if(!m)return res.status(404).json({error:"Film yok"});
  m.status="rejected"; m.rejectionReason=req.body.reason||"CEO tarafından reddedildi"; m.ceoApprovedBy=req.user.id;
  notify(d,m.addedBy,"Film Reddedildi",`${m.title}: ${m.rejectionReason}`,"error"); ticket(d,m.addedBy,"Reddedilen Film",`${m.title} reddedildi. Neden: ${m.rejectionReason}`,"answered"); saveDb(d); res.json({success:true});
});
app.get("/api/admin/all",auth,adminOnly,(req,res)=>{ const d=req.db; const payments=d.payments.map(p=>{ const u=d.users.find(x=>x.id===p.userId); return {...p, userFullName:p.userFullName || (u?`${u.firstName} ${u.lastName}`:"İsim yok"), packageName:p.packageName || (PACKAGES.find(x=>x.id===p.packageId)||{}).name || `Paket #${p.packageId}`}; }); const withdrawals=d.withdrawals.map(w=>{ const u=d.users.find(x=>x.id===w.userId); const packageId=Number(w.packageId || (u?u.packageId:0) || 0); return {...w, fullName:w.fullName || (u?`${u.firstName} ${u.lastName}`:"İsim yok"), phone:w.phone || (u?u.phone:""), packageId, packageName:w.packageName || (PACKAGES.find(x=>x.id===packageId)||{}).name || "Paket Yok"}; }); res.json({users:d.users.map(pub),payments,withdrawals,movies:d.movies,tx:d.transactions,logs:d.logs,packages:PACKAGES,notifications:d.notifications,supportTickets:d.supportTickets,pendingEarnings:d.pendingEarnings}); });
app.post("/api/admin/payments/:id/approve",auth,adminOnly,(req,res)=>{
  const d=req.db; expireExpiredPackages(d); const p=d.payments.find(x=>x.id===req.params.id); if(!p)return res.status(404).json({error:"Ödeme yok"});
  const u=d.users.find(x=>x.id===p.userId); if(!u)return res.status(404).json({error:"Kullanıcı yok"}); const pack=PACKAGES.find(x=>x.id===p.packageId); if(!pack)return res.status(400).json({error:"Paket bulunamadı"});
  const wasActive = isPremium(u);
  const oldPackageId = wasActive ? Number(u.packageId || 0) : 0;
  if(wasActive && Number(p.packageId) < oldPackageId) return res.status(400).json({error:"Bu ödeme mevcut paketten düşük bir paket için onaylanamaz"});
  p.status="approved"; p.approvedAt=now(); p.archive=true; p.userFullName=p.userFullName || `${u.firstName} ${u.lastName}`; p.packageName=p.packageName || pack.name;
  if(wasActive && Number(p.packageId) === oldPackageId){
    u.premiumUntil = addDaysToDate(u.premiumUntil, pack.durationDays);
    u.premiumStartedAt = u.premiumStartedAt || now();
  } else {
    u.packageId=p.packageId;
    u.premiumStartedAt=now();
    u.premiumUntil=addDays(pack.durationDays);
  }
  if(u.role !== "admin") u.role = Number(u.packageId) === 5 ? "ceo" : "user";
  distributeReferral(d,u,Number(p.amount)); notify(d,u.id,"Ödeme Onaylandı",`${pack.name} paketiniz aktif edildi. Premium bitiş tarihi: ${new Date(u.premiumUntil).toLocaleDateString("tr-TR")}`,"success"); saveDb(d); res.json({success:true});
});
app.post("/api/admin/payments/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const p=d.payments.find(x=>x.id===req.params.id); if(!p)return res.status(404).json({error:"Ödeme yok"}); p.status="rejected"; p.rejectReason=req.body.reason||"Admin tarafından reddedildi"; p.archive=true; notify(d,p.userId,"Ödeme Reddedildi",p.rejectReason,"error"); ticket(d,p.userId,"Ödeme Reddedildi",`Ödeme bildiriminiz reddedildi. Neden: ${p.rejectReason}`,"answered"); saveDb(d); res.json({success:true}); });
app.post("/api/admin/withdrawals/:id/approve",auth,adminOnly,(req,res)=>{ const d=req.db; const w=d.withdrawals.find(x=>x.id===req.params.id); if(!w)return res.status(404).json({error:"Çekim yok"}); const u=d.users.find(x=>x.id===w.userId); if(Number(u.balance)<Number(w.amount))return res.status(400).json({error:"Bakiye yetersiz"}); u.balance=Number((u.balance-w.amount).toFixed(2)); w.status="approved"; w.approvedAt=now(); tx(d,u.id,-w.amount,"çekim","Çekim onaylandı"); notify(d,u.id,"Çekim Onaylandı",`${w.amount} TL çekim talebiniz onaylandı.`,"success"); saveDb(d); res.json({success:true}); });
app.post("/api/admin/withdrawals/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const w=d.withdrawals.find(x=>x.id===req.params.id); if(!w)return res.status(404).json({error:"Çekim yok"}); w.status="rejected"; w.rejectReason=req.body.reason||"Reddedildi"; notify(d,w.userId,"Çekim Reddedildi",w.rejectReason,"error"); saveDb(d); res.json({success:true}); });
app.post("/api/admin/movies/:id/publish",auth,adminOnly,(req,res)=>{
  const d=req.db; const m=d.movies.find(x=>x.id===req.params.id); if(!m)return res.status(404).json({error:"Film yok"});
  m.status="published"; m.adminApprovedBy=req.user.id; m.publishedAt=now();
  const uploader=d.users.find(u=>u.id===m.addedBy); const ceo=d.users.find(u=>u.id===m.ceoApprovedBy);
  if(uploader && isPremium(uploader)){pending(d,uploader.id,1,"film_yukleme",`${m.title} film yükleme kazancı`,15); notify(d,uploader.id,"Film Yayınlandı",`${m.title} yayınlandı. 1 TL bekleyen bakiyenize eklendi.`,"success");}
  if(ceo && ceo.id!==uploader?.id && isPremium(ceo)){pending(d,ceo.id,1,"film_onay",`${m.title} film onay kazancı`,15); notify(d,ceo.id,"Film Yayınlandı",`${m.title} için 1 TL bekleyen bakiyenize eklendi.`,"success");}
  saveDb(d); res.json({success:true});
});
app.post("/api/admin/movies/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const m=d.movies.find(x=>x.id===req.params.id); if(!m)return res.status(404).json({error:"Film yok"}); m.status="rejected"; m.rejectionReason=req.body.reason||"Admin tarafından reddedildi"; notify(d,m.addedBy,"Film Reddedildi",`${m.title}: ${m.rejectionReason}`,"error"); ticket(d,m.addedBy,"Reddedilen Film",`${m.title} admin tarafından reddedildi. Neden: ${m.rejectionReason}`,"answered"); saveDb(d); res.json({success:true}); });
app.post("/api/support",auth,(req,res)=>{ const d=readDb(); const u=user(req,d); ticket(d,u.id,req.body.subject||"Destek Talebi",req.body.message||"", "open"); d.users.filter(x=>x.role==="admin").forEach(a=>notify(d,a.id,"Yeni Destek Mesajı",`${u.firstName} ${u.lastName} destek mesajı gönderdi.`,"info")); saveDb(d); res.json({success:true}); });
app.post("/api/admin/support/:id/reply",auth,adminOnly,(req,res)=>{ const d=req.db; const t=d.supportTickets.find(x=>x.id===req.params.id); if(!t)return res.status(404).json({error:"Destek kaydı yok"}); t.replies.push({from:req.user.id,message:req.body.message||"",createdAt:now()}); t.status="answered"; t.updatedAt=now(); notify(d,t.userId,"Destek Cevaplandı",req.body.message||"Destek kaydınıza cevap verildi.","success"); saveDb(d); res.json({success:true}); });

async function sendResetEmail(to, link){
  if(!nodemailer || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS){
    return {sent:false, reason:"SMTP ayarı yok"};
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "İzleKazan Şifre Sıfırlama",
    html: `<p>Şifrenizi yenilemek için bağlantıya tıklayın:</p><p><a href="${link}">${link}</a></p><p>Bu bağlantı 1 saat geçerlidir.</p>`
  });
  return {sent:true};
}

app.post("/api/forgot-password",(req,res)=>{
  const d=readDb();
  const email=String(req.body.email||"").toLowerCase();
  const u=d.users.find(x=>x.email===email);
  if(!u) return res.json({success:true,message:"Bu e-posta kayıtlıysa şifre sıfırlama bağlantısı gönderilecek."});
  const token=uuidv4()+uuidv4();
  const expiresAt=new Date(Date.now()+60*60*1000).toISOString();
  d.passwordResets.push({id:uuidv4(),userId:u.id,token,used:false,expiresAt,createdAt:now()});
  const baseUrl=process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const link=`${baseUrl}/?reset=${token}`;
  saveDb(d);
  sendResetEmail(u.email, link).then(r=>{
    if(r.sent) console.log("Şifre sıfırlama maili gönderildi:", u.email);
    else console.log("SMTP ayarı yok, test linki:", link);
  }).catch(err=>console.log("Mail gönderim hatası:", err.message));
  res.json({success:true,message:"Şifre sıfırlama bağlantısı hazırlandı.", demoLink:(!process.env.SMTP_HOST?link:undefined)});
});

app.post("/api/reset-password",(req,res)=>{
  const d=readDb();
  const token=String(req.body.token||"");
  const newPassword=String(req.body.newPassword||"");
  if(newPassword.length<6) return res.status(400).json({error:"Yeni şifre en az 6 karakter olmalı"});
  const r=d.passwordResets.find(x=>x.token===token && !x.used);
  if(!r) return res.status(400).json({error:"Geçersiz bağlantı"});
  if(new Date(r.expiresAt)<new Date()) return res.status(400).json({error:"Bağlantının süresi dolmuş"});
  const u=d.users.find(x=>x.id===r.userId);
  if(!u) return res.status(404).json({error:"Kullanıcı bulunamadı"});
  u.passwordHash=bcrypt.hashSync(newPassword,10);
  r.used=true;
  notify(d,u.id,"Şifre Yenilendi","Şifreniz başarıyla yenilendi.","success");
  saveDb(d);
  res.json({success:true});
});


app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
async function startServer(){
  dbCache = await loadDb();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`İzleKazan çalışıyor: ${PORT}`);
    console.log(`Veri kaynağı: ${supabase ? "Supabase" : "db.json"}`);
  });
}

startServer().catch((error) => {
  console.error("Sunucu başlatılamadı:", error);
  process.exit(1);
});
