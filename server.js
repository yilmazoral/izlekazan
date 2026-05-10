
const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch(e) { nodemailer = null; }

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "izlekazan_v2_secret";
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json({ limit: "3mb" }));
app.use(express.static(__dirname));

const ADMIN_EMAIL = "yilmazoral@hotmail.com";
const ADMIN_PASS = "059221";

const PACKAGES = [
  {id:1,name:"Standart Üye",price:100,depth:1,rate:0.10,durationDays:365,badge:"Başlangıç",features:["1 yıl premium film erişimi","Reklamsız Film Platformu filmlerine erişim","1. seviye referanslardan %10 kazanç","Referans kodu paket aktif olunca görünür","Siteye Film Ekleme Kazancı","Cüzdan, destek ve çekim talebi"]},
  {id:2,name:"Kıdemli Üye",price:200,depth:2,rate:0.10,durationDays:365,badge:"2 Seviye",features:["Standart Üye özelliklerinin tamamı","1. ve 2. seviye referanslardan %10 kazanç","Alt üye ağacını daha geniş takip","Referans kazanç geçmişi","1 yıl aktif premium üyelik","Siteye Film Ekleme Kazancı"]},
  {id:3,name:"Ortak",price:300,depth:3,rate:0.10,durationDays:365,badge:"3 Seviye",features:["Kıdemli Üye özelliklerinin tamamı","1, 2 ve 3. seviye referanslardan %10 kazanç","Platform gelir ortaklığına tam katılım","Geniş referans ağı takibi","1 yıl premium erişim","Siteye Film Ekleme Kazancı"]},
  {id:4,name:"Kıdemli Ortak",price:500,depth:3,rate:0.20,durationDays:365,badge:"Yüksek Prim",features:["Ortak paket özelliklerinin tamamı","İlk 3 referans seviyesinden %20 kazanç","Daha yüksek cüzdan kazanç potansiyeli","Gelişmiş kazanç takibi","1 yıl premium erişim","Siteye Film Ekleme Kazancı"]},
  {id:5,name:"CEO Üye",price:1000,depth:3,rate:0.30,durationDays:365,badge:"En Üst Seviye",features:["Tüm özelliklere tam erişim","İlk 3 referans seviyesinden %30 kazanç","CEO film ön onay paneli","Onayladığı film başına extra kazanç","Siteye Film Ekleme Kazancı","1 yıl premium erişim"]}
];

function now(){ return new Date().toISOString(); }
function addDays(days){ const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString(); }
function daysLeft(dateStr){ if(!dateStr) return 0; return Math.max(0, Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24))); }
function isPremium(u){ return !!(u && u.packageId > 0 && u.premiumUntil && new Date(u.premiumUntil) > new Date()); }

function freshDb(){
  return {users:[],payments:[],withdrawals:[],transactions:[],pendingEarnings:[],movies:[{id:uuidv4(),title:"Reklamsız Film Platformu",year:"2026",category:"Film Arşivi",poster:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80",description:"Premium üyeler için reklamsız film platformu.",link:"https://sine5.news/",status:"published",addedBy:"system",ceoApprovedBy:"system",adminApprovedBy:"system",createdAt:now()}],supportTickets:[],notifications:[],passwordResets:[],logs:[]};
}
function readDb(){
  if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(freshDb(), null, 2));
  const d = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  d.users ||= []; d.payments ||= []; d.withdrawals ||= []; d.transactions ||= []; d.pendingEarnings ||= []; d.movies ||= []; d.supportTickets ||= []; d.notifications ||= []; d.passwordResets ||= []; d.logs ||= [];
  return d;
}
function saveDb(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function pub(u){ if(!u) return null; const {passwordHash, ...r}=u; return {...r, premiumActive:isPremium(u), premiumDaysLeft:daysLeft(u.premiumUntil)}; }
function makeRef(){ return "IK" + Math.random().toString(36).slice(2,8).toUpperCase() + Math.floor(10+Math.random()*89); }
function notify(d,userId,title,message,type="info"){ d.notifications.push({id:uuidv4(),userId,title,message,type,read:false,createdAt:now()}); }
function ticket(d,userId,subject,message,status="open"){ d.supportTickets.push({id:uuidv4(),userId,subject,message,replies:[],status,createdAt:now(),updatedAt:now()}); }
function tx(d,userId,amount,type,desc){ d.transactions.push({id:uuidv4(),userId,amount,type,desc,createdAt:now()}); }
function pending(d,userId,amount,type,desc,availableAtDays=15){ const a = new Date(); a.setDate(a.getDate()+availableAtDays); d.pendingEarnings.push({id:uuidv4(),userId,amount,type,desc,status:"pending",availableAt:a.toISOString(),createdAt:now()}); }
function releasePending(d){
  const t = new Date();
  d.pendingEarnings.filter(e=>e.status==="pending" && new Date(e.availableAt)<=t).forEach(e=>{
    const u=d.users.find(x=>x.id===e.userId);
    if(u){ u.balance = Number((Number(u.balance||0)+Number(e.amount)).toFixed(2)); e.status="released"; tx(d,u.id,Number(e.amount),"bekleyen_devri",e.desc+" çekilebilir bakiyeye devredildi"); notify(d,u.id,"Bekleyen Kazanç Aktarıldı",`${e.amount} TL çekilebilir bakiyenize aktarıldı.`,"success"); }
  });
}
function seedAdmin(){
  const d=readDb();
  let admin=d.users.find(u=>u.email===ADMIN_EMAIL);
  if(!admin){
    d.users.push({id:uuidv4(),firstName:"Yılmaz",lastName:"Oral",email:ADMIN_EMAIL,phone:"05000000000",passwordHash:bcrypt.hashSync(ADMIN_PASS,10),referralCode:"ADMIN",sponsorId:null,packageId:5,premiumUntil:addDays(3650),balance:0,role:"admin",banned:false,createdAt:now()});
  } else { admin.passwordHash=bcrypt.hashSync(ADMIN_PASS,10); admin.role="admin"; admin.packageId=5; admin.premiumUntil=admin.premiumUntil||addDays(3650); }
  saveDb(d);
}
seedAdmin();

function auth(req,res,next){ const h=req.headers.authorization||""; const token=h.startsWith("Bearer ")?h.slice(7):null; if(!token) return res.status(401).json({error:"Giriş gerekli"}); try{req.auth=jwt.verify(token,JWT_SECRET);next()}catch(e){res.status(401).json({error:"Oturum geçersiz"});} }
function user(req,d){return d.users.find(u=>u.id===req.auth.id);}
function adminOnly(req,res,next){const d=readDb();releasePending(d);const u=user(req,d);if(!u||u.role!=="admin")return res.status(403).json({error:"Admin yetkisi gerekli"});req.db=d;req.user=u;next();}
function ceoOnly(req,res,next){const d=readDb();releasePending(d);const u=user(req,d);if(!u||(u.role!=="admin"&&u.packageId!==5))return res.status(403).json({error:"CEO yetkisi gerekli"});req.db=d;req.user=u;next();}
function distributeReferral(d,buyer,amount){
  let sid=buyer.sponsorId;
  for(let level=1; level<=3; level++){
    if(!sid)break;
    const sponsor=d.users.find(u=>u.id===sid);
    if(!sponsor)break;
    const pack=PACKAGES.find(p=>p.id===sponsor.packageId);
    if(pack && isPremium(sponsor) && level<=pack.depth){
      const earn=Number((amount*pack.rate).toFixed(2));
      pending(d, sponsor.id, earn, "referans", `${buyer.firstName} ${buyer.lastName} ödemesinden ${level}. seviye referans kazancı`, 15);
      notify(d,sponsor.id,"Referans Kazancı Beklemede",`${earn} TL referans kazancı bekleyen bakiyenize eklendi. 15 gün sonra çekilebilir bakiyeye aktarılır.`,"success");
    }
    sid=sponsor.sponsorId;
  }
}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
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
  const d=readDb(); releasePending(d);
  const u=d.users.find(x=>x.email===String(req.body.email||"").toLowerCase());
  if(!u||!bcrypt.compareSync(req.body.password||"",u.passwordHash)) return res.status(400).json({error:"Email veya şifre hatalı"});
  if(u.banned) return res.status(403).json({error:"Hesabınız yasaklanmış"});
  const token=jwt.sign({id:u.id,role:u.role},JWT_SECRET,{expiresIn:"7d"}); saveDb(d); res.json({token,user:pub(u)});
});
app.get("/api/me",auth,(req,res)=>{ const d=readDb(); releasePending(d); const u=user(req,d); saveDb(d); res.json({user:pub(u),package:PACKAGES.find(p=>p.id===u.packageId)||null}); });
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
  const d=readDb(); releasePending(d); const u=user(req,d); saveDb(d);
  res.json({user:pub(u),package:PACKAGES.find(p=>p.id===u.packageId)||null,children:d.users.filter(x=>x.sponsorId===u.id).map(c=>({...pub(c), packageName:(PACKAGES.find(p=>p.id===c.packageId)||{}).name||"Paket Yok"})),payments:d.payments.filter(x=>x.userId===u.id),withdrawals:d.withdrawals.filter(x=>x.userId===u.id),movies:d.movies.filter(x=>x.addedBy===u.id),tx:d.transactions.filter(x=>x.userId===u.id).slice().reverse(),pendingEarnings:d.pendingEarnings.filter(x=>x.userId===u.id).slice().reverse(),notifications:d.notifications.filter(x=>x.userId===u.id).slice().reverse(),tickets:d.supportTickets.filter(x=>x.userId===u.id).slice().reverse()});
});
app.post("/api/payment",auth,(req,res)=>{
  const d=readDb(); const u=user(req,d); const pack=PACKAGES.find(p=>p.id===Number(req.body.packageId));
  if(!pack) return res.status(400).json({error:"Paket bulunamadı"});
  if(req.body.phone!==u.phone) return res.status(400).json({error:"Telefon hesabınızla eşleşmiyor"});
  if(Number(req.body.amount)!==pack.price) return res.status(400).json({error:"Tutar paket fiyatı ile aynı olmalı"});
  if(d.payments.find(p=>p.userId===u.id&&p.status==="pending")) return res.status(400).json({error:"Bekleyen ödeme bildiriminiz var"});
  d.payments.push({id:uuidv4(),userId:u.id,phone:u.phone,packageId:pack.id,amount:pack.price,note:req.body.note||u.phone,status:"pending",createdAt:now(),archive:false});
  notify(d,u.id,"Ödeme Bildirimi Alındı",`${pack.name} için ödeme bildiriminiz admin onayına gönderildi.`,"info"); saveDb(d); res.json({success:true});
});
app.post("/api/withdraw",auth,(req,res)=>{
  const d=readDb(); const u=user(req,d); const amount=Number(req.body.amount);
  if(amount<50||amount%50!==0) return res.status(400).json({error:"Minimum 50 TL ve 50 TL katları çekilebilir"});
  if(amount>Number(u.balance||0)) return res.status(400).json({error:"Yetersiz bakiye"});
  if(d.withdrawals.find(w=>w.userId===u.id&&w.status==="pending")) return res.status(400).json({error:"Bekleyen çekim talebiniz var"});
  d.withdrawals.push({id:uuidv4(),userId:u.id,fullName:req.body.fullName,phone:u.phone,iban:req.body.iban,amount,status:"pending",createdAt:now()});
  notify(d,u.id,"Çekim Talebi Alındı",`${amount} TL çekim talebiniz admin onayına gönderildi.`,"info"); saveDb(d); res.json({success:true});
});
app.get("/api/movies",auth,(req,res)=>{ const d=readDb(); releasePending(d); const u=user(req,d); const premium=isPremium(u); saveDb(d); res.json(d.movies.filter(m=>m.status==="published").map(m=>({...m,locked:!premium,link:premium?m.link:null}))); });
app.post("/api/movies",auth,(req,res)=>{
  const d=readDb(); const u=user(req,d); const {title,year,category,poster,description,link}=req.body;
  if(!title||!link) return res.status(400).json({error:"Film adı ve link zorunlu"});
  if(d.movies.find(m=>m.link===link||(m.title.toLowerCase()===title.toLowerCase()&&m.year===year))) return res.status(400).json({error:"Bu film zaten eklenmiş"});
  d.movies.push({id:uuidv4(),title,year,category,poster,description,link,status:"ceo_pending",addedBy:u.id,ceoApprovedBy:null,adminApprovedBy:null,createdAt:now()});
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
app.get("/api/admin/all",auth,adminOnly,(req,res)=>{ const d=req.db; res.json({users:d.users.map(pub),payments:d.payments,withdrawals:d.withdrawals,movies:d.movies,tx:d.transactions,logs:d.logs,packages:PACKAGES,notifications:d.notifications,supportTickets:d.supportTickets,pendingEarnings:d.pendingEarnings}); });
app.post("/api/admin/payments/:id/approve",auth,adminOnly,(req,res)=>{
  const d=req.db; const p=d.payments.find(x=>x.id===req.params.id); if(!p)return res.status(404).json({error:"Ödeme yok"});
  const u=d.users.find(x=>x.id===p.userId); if(!u)return res.status(404).json({error:"Kullanıcı yok"}); const pack=PACKAGES.find(x=>x.id===p.packageId);
  p.status="approved"; p.approvedAt=now(); p.archive=true; u.packageId=p.packageId; u.premiumStartedAt=now(); u.premiumUntil=addDays(pack.durationDays); if(u.packageId===5)u.role="ceo";
  distributeReferral(d,u,Number(p.amount)); notify(d,u.id,"Ödeme Onaylandı",`${pack.name} paketiniz 1 yıl süreyle aktif edildi. Premium bitiş tarihi: ${new Date(u.premiumUntil).toLocaleDateString("tr-TR")}`,"success"); saveDb(d); res.json({success:true});
});
app.post("/api/admin/payments/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const p=d.payments.find(x=>x.id===req.params.id); if(!p)return res.status(404).json({error:"Ödeme yok"}); p.status="rejected"; p.rejectReason=req.body.reason||"Admin tarafından reddedildi"; p.archive=true; notify(d,p.userId,"Ödeme Reddedildi",p.rejectReason,"error"); ticket(d,p.userId,"Ödeme Reddedildi",`Ödeme bildiriminiz reddedildi. Neden: ${p.rejectReason}`,"answered"); saveDb(d); res.json({success:true}); });
app.post("/api/admin/withdrawals/:id/approve",auth,adminOnly,(req,res)=>{ const d=req.db; const w=d.withdrawals.find(x=>x.id===req.params.id); if(!w)return res.status(404).json({error:"Çekim yok"}); const u=d.users.find(x=>x.id===w.userId); if(Number(u.balance)<Number(w.amount))return res.status(400).json({error:"Bakiye yetersiz"}); u.balance=Number((u.balance-w.amount).toFixed(2)); w.status="approved"; w.approvedAt=now(); tx(d,u.id,-w.amount,"çekim","Çekim onaylandı"); notify(d,u.id,"Çekim Onaylandı",`${w.amount} TL çekim talebiniz onaylandı.`,"success"); saveDb(d); res.json({success:true}); });
app.post("/api/admin/withdrawals/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const w=d.withdrawals.find(x=>x.id===req.params.id); if(!w)return res.status(404).json({error:"Çekim yok"}); w.status="rejected"; w.rejectReason=req.body.reason||"Reddedildi"; notify(d,w.userId,"Çekim Reddedildi",w.rejectReason,"error"); saveDb(d); res.json({success:true}); });
app.post("/api/admin/movies/:id/publish",auth,adminOnly,(req,res)=>{
  const d=req.db; const m=d.movies.find(x=>x.id===req.params.id); if(!m)return res.status(404).json({error:"Film yok"});
  m.status="published"; m.adminApprovedBy=req.user.id; m.publishedAt=now();
  const uploader=d.users.find(u=>u.id===m.addedBy); const ceo=d.users.find(u=>u.id===m.ceoApprovedBy);
  if(uploader){pending(d,uploader.id,1,"film_yukleme",`${m.title} film yükleme kazancı`,15); notify(d,uploader.id,"Film Yayınlandı",`${m.title} yayınlandı. 1 TL bekleyen bakiyenize eklendi.`,"success");}
  if(ceo && ceo.id!==uploader?.id){pending(d,ceo.id,1,"film_onay",`${m.title} film onay kazancı`,15); notify(d,ceo.id,"Film Yayınlandı",`${m.title} için 1 TL bekleyen bakiyenize eklendi.`,"success");}
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
app.listen(PORT,()=>console.log("İzleKazan V2 çalışıyor:",PORT));
