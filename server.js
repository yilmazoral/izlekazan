
const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "izlekazan_secret";
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

const PACKAGES = [
  { id: 1, name: "Üye", price: 100, depth: 1, rate: 0.10 },
  { id: 2, name: "Kıdemli Üye", price: 200, depth: 2, rate: 0.10 },
  { id: 3, name: "Ortak", price: 300, depth: 3, rate: 0.10 },
  { id: 4, name: "Kıdemli Ortak", price: 500, depth: 3, rate: 0.20 },
  { id: 5, name: "CEO", price: 1000, depth: 3, rate: 0.30 }
];

function freshDb(){
  return {
    users: [],
    payments: [],
    withdrawals: [],
    transactions: [],
    movies: [
      {
        id: uuidv4(),
        title: "Sine5 Film Arşivi",
        year: "2026",
        category: "Film Platformu",
        poster: "https://via.placeholder.com/300x450/111111/ffffff?text=IzleKazan",
        description: "Premium üyeler için film kaynağı.",
        link: "https://sine5.news/",
        status: "approved",
        addedBy: "system",
        approvedBy: "system",
        createdAt: new Date().toISOString()
      }
    ],
    logs: []
  }
}
function db(){
  if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(freshDb(), null, 2));
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function save(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function now(){ return new Date().toISOString(); }
function refCode(name){ return (String(name||"IZLE").slice(0,5).toUpperCase()+Math.floor(10000+Math.random()*89999)); }
function cleanUser(u){ if(!u) return null; const {passwordHash, ...r}=u; return r; }
function log(d, actor, action){ d.logs.push({id:uuidv4(), actor, action, at:now()}); }
function tx(d, userId, amount, type, desc){
  d.transactions.push({id:uuidv4(), userId, amount, type, desc, at:now()});
}
function auth(req,res,next){
  const h=req.headers.authorization||"";
  const token=h.startsWith("Bearer ")?h.slice(7):null;
  if(!token) return res.status(401).json({error:"Giriş gerekli"});
  try{ req.auth=jwt.verify(token,JWT_SECRET); next(); }catch(e){ res.status(401).json({error:"Oturum geçersiz"}); }
}
function currentUser(req,d){ return d.users.find(u=>u.id===req.auth.id); }
function adminOnly(req,res,next){
  const d=db(); const u=currentUser(req,d);
  if(!u || u.role!=="admin") return res.status(403).json({error:"Admin yetkisi gerekli"});
  req.user=u; req.db=d; next();
}
function ceoOrAdmin(req,res,next){
  const d=db(); const u=currentUser(req,d);
  if(!u || (u.role!=="admin" && u.packageId!==5)) return res.status(403).json({error:"CEO/Admin yetkisi gerekli"});
  req.user=u; req.db=d; next();
}
function seedAdmin(){
  const d=db();
  if(!d.users.find(u=>u.email==="admin@admin.com")){
    d.users.push({
      id: uuidv4(), firstName:"Admin", lastName:"Yönetici", email:"admin@admin.com", phone:"05000000000",
      passwordHash:bcrypt.hashSync("123456",10), referralCode:"ADMIN", sponsorId:null,
      packageId:5, balance:0, role:"admin", banned:false, createdAt:now()
    });
    save(d);
  }
}
seedAdmin();

function distribute(d,buyer,amount){
  let sid=buyer.sponsorId;
  for(let level=1; level<=3; level++){
    if(!sid) break;
    const s=d.users.find(u=>u.id===sid);
    if(!s) break;
    const p=PACKAGES.find(x=>x.id===s.packageId);
    if(p && level<=p.depth){
      const earn=Number((amount*p.rate).toFixed(2));
      s.balance=Number((Number(s.balance||0)+earn).toFixed(2));
      tx(d,s.id,earn,"referans",`${level}. seviye referans kazancı`);
    }
    sid=s.sponsorId;
  }
}

app.get("/", (req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.get("/api/packages",(req,res)=>res.json(PACKAGES));

app.post("/api/register",(req,res)=>{
  const {firstName,lastName,email,phone,password,password2,referralCode}=req.body;
  if(!firstName||!lastName||!email||!phone||!password||!password2) return res.status(400).json({error:"Tüm alanları doldurun"});
  if(password!==password2) return res.status(400).json({error:"Şifreler eşleşmiyor"});
  if(!/^0\d{10}$/.test(phone)) return res.status(400).json({error:"Telefon 05XXXXXXXXX formatında olmalı"});
  const d=db();
  if(d.users.find(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(400).json({error:"Bu email kayıtlı"});
  if(d.users.find(u=>u.phone===phone)) return res.status(400).json({error:"Bu telefon kayıtlı"});
  const sponsor=d.users.find(u=>u.referralCode.toUpperCase()===String(referralCode||"").toUpperCase());
  const u={id:uuidv4(),firstName,lastName,email:email.toLowerCase(),phone,passwordHash:bcrypt.hashSync(password,10),referralCode:refCode(firstName),sponsorId:sponsor?sponsor.id:null,packageId:0,balance:0,role:"user",banned:false,createdAt:now()};
  d.users.push(u); log(d,u.id,"Kayıt oldu"); save(d);
  res.json({success:true,user:cleanUser(u)});
});
app.post("/api/login",(req,res)=>{
  const d=db(); const u=d.users.find(x=>x.email===String(req.body.email||"").toLowerCase());
  if(!u || !bcrypt.compareSync(req.body.password||"",u.passwordHash)) return res.status(400).json({error:"Email veya şifre hatalı"});
  if(u.banned) return res.status(403).json({error:"Hesap banlı"});
  const token=jwt.sign({id:u.id,role:u.role},JWT_SECRET,{expiresIn:"7d"});
  res.json({token,user:cleanUser(u)});
});
app.get("/api/me",auth,(req,res)=>{
  const d=db(); const u=currentUser(req,d);
  res.json({user:cleanUser(u), package: PACKAGES.find(p=>p.id===u.packageId)||null});
});
app.get("/api/dashboard",auth,(req,res)=>{
  const d=db(); const u=currentUser(req,d);
  res.json({
    user:cleanUser(u),
    children:d.users.filter(x=>x.sponsorId===u.id).map(cleanUser),
    payments:d.payments.filter(x=>x.userId===u.id),
    withdrawals:d.withdrawals.filter(x=>x.userId===u.id),
    movies:d.movies.filter(x=>x.addedBy===u.id),
    tx:d.transactions.filter(x=>x.userId===u.id).reverse()
  });
});
app.post("/api/payment",auth,(req,res)=>{
  const d=db(); const u=currentUser(req,d);
  const pack=PACKAGES.find(p=>p.id===Number(req.body.packageId));
  if(!pack) return res.status(400).json({error:"Paket yok"});
  if(req.body.phone!==u.phone) return res.status(400).json({error:"Telefon hesabınızla eşleşmiyor"});
  if(Number(req.body.amount)!==pack.price) return res.status(400).json({error:"Tutar paket fiyatı ile aynı olmalı"});
  if(d.payments.find(p=>p.userId===u.id && p.status==="pending")) return res.status(400).json({error:"Bekleyen ödeme var"});
  d.payments.push({id:uuidv4(),userId:u.id,phone:u.phone,packageId:pack.id,amount:pack.price,note:req.body.note||u.phone,status:"pending",createdAt:now()});
  save(d); res.json({success:true});
});
app.post("/api/withdraw",auth,(req,res)=>{
  const d=db(); const u=currentUser(req,d); const amount=Number(req.body.amount);
  if(amount<50 || amount%50!==0) return res.status(400).json({error:"Minimum 50 TL ve 50 katları çekilebilir"});
  if(amount>Number(u.balance||0)) return res.status(400).json({error:"Yetersiz bakiye"});
  if(d.withdrawals.find(w=>w.userId===u.id && w.status==="pending")) return res.status(400).json({error:"Bekleyen çekim talebiniz var"});
  d.withdrawals.push({id:uuidv4(),userId:u.id,fullName:req.body.fullName,phone:u.phone,iban:req.body.iban,amount,status:"pending",createdAt:now()});
  save(d); res.json({success:true});
});
app.get("/api/movies",auth,(req,res)=>{
  const d=db(); const u=currentUser(req,d);
  const premium=Number(u.packageId||0)>0;
  const movies=d.movies.filter(m=>m.status==="approved").map(m=>({...m, link: premium ? m.link : null, locked: !premium}));
  res.json(movies);
});
app.post("/api/movies",auth,(req,res)=>{
  const d=db(); const u=currentUser(req,d);
  const {title,year,category,poster,description,link}=req.body;
  if(!title||!link) return res.status(400).json({error:"Film adı ve link zorunlu"});
  if(d.movies.find(m=>m.link===link || (m.title.toLowerCase()===title.toLowerCase() && m.year===year))) return res.status(400).json({error:"Bu film zaten var"});
  d.movies.push({id:uuidv4(),title,year,category,poster,description,link,status:"pending",addedBy:u.id,approvedBy:null,createdAt:now()});
  save(d); res.json({success:true});
});
app.get("/api/ceo/pending",auth,ceoOrAdmin,(req,res)=>{
  res.json(req.db.movies.filter(m=>m.status==="pending"));
});
app.post("/api/ceo/approve/:id",auth,ceoOrAdmin,(req,res)=>{
  const d=req.db; const m=d.movies.find(x=>x.id===req.params.id);
  if(!m) return res.status(404).json({error:"Film yok"});
  if(m.addedBy===req.user.id) return res.status(400).json({error:"Kendi filmini onaylayamazsın"});
  m.status="approved"; m.approvedBy=req.user.id;
  const adder=d.users.find(u=>u.id===m.addedBy); if(adder){adder.balance=Number((Number(adder.balance||0)+0.25).toFixed(2)); tx(d,adder.id,0.25,"film","Film ekleme ödülü");}
  req.user.balance=Number((Number(req.user.balance||0)+0.10).toFixed(2)); tx(d,req.user.id,0.10,"film_onay","Film onay ödülü");
  save(d); res.json({success:true});
});
app.post("/api/ceo/reject/:id",auth,ceoOrAdmin,(req,res)=>{
  const d=req.db; const m=d.movies.find(x=>x.id===req.params.id);
  if(!m) return res.status(404).json({error:"Film yok"});
  m.status="rejected"; m.approvedBy=req.user.id; save(d); res.json({success:true});
});
app.get("/api/admin/all",auth,adminOnly,(req,res)=>{
  const d=req.db;
  res.json({users:d.users.map(cleanUser),payments:d.payments,withdrawals:d.withdrawals,movies:d.movies,tx:d.transactions,logs:d.logs,packages:PACKAGES});
});
app.post("/api/admin/payments/:id/approve",auth,adminOnly,(req,res)=>{
  const d=req.db; const p=d.payments.find(x=>x.id===req.params.id); if(!p) return res.status(404).json({error:"Ödeme yok"});
  const u=d.users.find(x=>x.id===p.userId); if(!u) return res.status(404).json({error:"Kullanıcı yok"});
  p.status="approved"; p.approvedAt=now(); u.packageId=p.packageId; if(u.packageId===5)u.role="ceo"; distribute(d,u,Number(p.amount)); save(d); res.json({success:true});
});
app.post("/api/admin/payments/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const p=d.payments.find(x=>x.id===req.params.id); if(p)p.status="rejected"; save(d); res.json({success:true}); });
app.post("/api/admin/withdrawals/:id/approve",auth,adminOnly,(req,res)=>{ const d=req.db; const w=d.withdrawals.find(x=>x.id===req.params.id); if(!w)return res.status(404).json({error:"Çekim yok"}); const u=d.users.find(x=>x.id===w.userId); if(Number(u.balance)<Number(w.amount))return res.status(400).json({error:"Bakiye yetersiz"}); u.balance=Number((u.balance-w.amount).toFixed(2)); w.status="approved"; tx(d,u.id,-w.amount,"çekim","Çekim onaylandı"); save(d); res.json({success:true}); });
app.post("/api/admin/withdrawals/:id/reject",auth,adminOnly,(req,res)=>{ const d=req.db; const w=d.withdrawals.find(x=>x.id===req.params.id); if(w)w.status="rejected"; save(d); res.json({success:true}); });
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log("İzleKazan Full MVP PORT:",PORT));
