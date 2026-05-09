
let token=localStorage.getItem("token")||""; let me=null; const $=id=>document.getElementById(id);
async function api(url,opt={}){let r=await fetch(url,{...opt,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(opt.headers||{})}});let j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||"Hata");return j}
function toast(m){$("toast").innerText=m;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",3000)}
function isLoggedIn(){return !!token}
function page(id){ if(id==="auth"&&isLoggedIn())id="panel"; document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active"); $("hero").style.display=id==="home"?"block":"none"; window.scrollTo(0,0); if(id==="packages")loadPackages(); if(id==="panel")dash(); if(id==="movies"){movies();ceo()} if(id==="admin")admin();}
function refreshMenu(){ $("loginTop").classList.toggle("hidden",isLoggedIn()); $("logoutBtn").classList.toggle("hidden",!isLoggedIn()); $("adminNav").classList.toggle("hidden",!(me&&me.role==="admin")); }
function logout(){localStorage.removeItem("token");token="";me=null;refreshMenu();page("home");toast("Çıkış yapıldı")}
async function init(){try{if(token){let d=await api("/api/me");me=d.user;refreshMenu();}}catch(e){localStorage.removeItem("token");token=""}loadPackages();refreshMenu();}
async function loadPackages(){let p=await api("/api/packages");$("packageList").innerHTML=p.map(x=>`<div class="package"><span class="badge">${x.badge}</span><h3>${x.name}</h3><div class="price">${x.price} TL / Yıl</div><p>1 yıl geçerli | ${x.depth} seviye | %${x.rate*100} prim</p><ul>${x.features.map(f=>`<li>${f}</li>`).join("")}</ul><button onclick="choosePack(${x.id},${x.price})">Paketi Seç</button></div>`).join("");}
function choosePack(id,price){page("panel");setTimeout(()=>{let s=$("packSel");if(s){s.value=id;$("payAmount").value=price}},300)}
async function register(){try{await api("/api/register",{method:"POST",body:JSON.stringify({firstName:rf.value,lastName:rl.value,email:re.value,phone:rp.value,password:rs.value,password2:rs2.value,referralCode:rr.value})});toast("Kayıt başarılı, giriş yapın")}catch(e){toast(e.message)}}
async function login(){try{let d=await api("/api/login",{method:"POST",body:JSON.stringify({email:le.value,password:ls.value})});token=d.token;me=d.user;localStorage.setItem("token",token);refreshMenu();toast("Giriş başarılı");page("panel")}catch(e){toast(e.message)}}
async function dash(){
try{
let d=await api("/api/dashboard");
me=d.user; refreshMenu();
let packs=await api("/api/packages");
let pEnd=d.user.premiumUntil?new Date(d.user.premiumUntil).toLocaleDateString("tr-TR"):"Aktif değil";
let pStart=d.user.premiumStartedAt?new Date(d.user.premiumStartedAt).toLocaleDateString("tr-TR"):"Aktif değil";
let pendingList=d.pendingEarnings.filter(x=>x.status==="pending").sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
let releasedList=d.tx.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
let pendingSum=pendingList.reduce((a,b)=>a+Number(b.amount),0).toFixed(2);

$("dash").innerHTML=`
<div class="panelHero">
  <div>
    <h3>Hoş geldin, ${d.user.firstName} ${d.user.lastName}</h3>
    <p>${d.package?d.package.name:"Paket aktif değil"} • Premium başlangıç: ${pStart} • Premium bitiş: ${pEnd}</p>
  </div>
  <button onclick="page('packages')">Paketi Yükselt / Yenile</button>
</div>

<div class="panelGrid">
  <div class="box clickable" onclick="toggleList('pendingList')">
    <span>Bekleyen Bakiye</span>
    <b>${pendingSum} TL</b>
    <small>15 gün sonra çekilebilir bakiyeye aktarılır. Detay için tıkla.</small>
  </div>
  <div class="box clickable" onclick="toggleList('releasedList')">
    <span>Çekilebilir Bakiye</span>
    <b>${d.user.balance} TL</b>
    <small>Detaylı işlem geçmişi için tıkla.</small>
  </div>
  <div class="box">
    <span>Premium Bitiş</span>
    <b>${pEnd}</b>
    <small>${d.user.premiumDaysLeft||0} gün kaldı</small>
  </div>
  <div class="box">
    <span>Alt Üye</span>
    <b>${d.children.length}</b>
    <small>Referans ağındaki doğrudan üyeler</small>
  </div>
</div>

<div id="pendingList" class="card detailList hidden">
  <h3>Bekleyen Bakiye Detayı</h3>
  ${pendingList.map(e=>`<div class="listItem"><b>+${e.amount} TL</b><span>${e.desc}</span><small>${new Date(e.createdAt).toLocaleString("tr-TR")} • Çekilebilir tarih: ${new Date(e.availableAt).toLocaleDateString("tr-TR")}</small></div>`).join("")||"Bekleyen kazanç yok"}
</div>

<div id="releasedList" class="card detailList hidden">
  <h3>Çekilebilir Bakiye / İşlem Geçmişi</h3>
  ${releasedList.map(t=>`<div class="listItem"><b>${Number(t.amount)>0?"+":""}${t.amount} TL</b><span>${t.desc}</span><small>${new Date(t.createdAt).toLocaleString("tr-TR")} • ${t.type}</small></div>`).join("")||"İşlem yok"}
</div>

<div class="card">
  <h3>Bildirimlerim</h3>
  ${d.notifications.map(n=>`<p class="notification ${n.type}">${n.type==="error"?"❌":"✅"} <b>${n.title}</b><br>${n.message}<br><small>${new Date(n.createdAt).toLocaleString("tr-TR")}</small></p>`).join("")||"Bildirim yok"}
</div>

<div class="card">
  <h3>Alt Üyelerim</h3>
  <div class="tableWrap">
    <table>
      <thead><tr><th>Ad Soyad</th><th>Telefon</th><th>Paket</th><th>Premium Başlangıç</th><th>Premium Bitiş</th><th>Durum</th></tr></thead>
      <tbody>
        ${d.children.map(c=>`<tr><td>${c.firstName} ${c.lastName}</td><td>${c.phone}</td><td>${c.packageName}</td><td>${c.premiumStartedAt?new Date(c.premiumStartedAt).toLocaleDateString("tr-TR"):"-"}</td><td>${c.premiumUntil?new Date(c.premiumUntil).toLocaleDateString("tr-TR"):"-"}</td><td>${c.premiumActive?"Premium":"Pasif"}</td></tr>`).join("")||`<tr><td colspan="6">Alt üye yok</td></tr>`}
      </tbody>
    </table>
  </div>
</div>

<div class="card">
  <h3>Üyelik Bilgilerim / Şifre Değiştir</h3>
  <input id="pf" value="${d.user.firstName}" placeholder="Ad">
  <input id="pl" value="${d.user.lastName}" placeholder="Soyad">
  <input id="pe" value="${d.user.email}" placeholder="Email">
  <input id="pp" value="${d.user.phone}" placeholder="Telefon">
  <input id="pcp" type="password" placeholder="Mevcut şifre">
  <input id="pnp" type="password" placeholder="Yeni şifre">
  <button onclick="saveProfile()">Bilgileri Güncelle</button>
</div>

<div class="card">
  <h3>Referans Sistemi</h3>
  ${d.user.premiumActive?`<div class="refBox"><span class="refCode" id="refCode">${d.user.referralCode}</span><button onclick="copyRef()">Kopyala</button><button onclick="shareRef()">Paylaş</button></div>`:"Referans kodunuz paket satın alındıktan sonra görünür."}
</div>

<div class="card">
  <h3>IBAN Ödeme Bildir</h3>
  <p><b>IBAN:</b> TR78 0015 7000 0000 0037 7980 62<br><b>Alıcı:</b> YILMAZ ORAL<br><b>Açıklama:</b> Telefon numaranızı yazınız</p>
  <select id="packSel">${packs.map(p=>`<option value="${p.id}" data-price="${p.price}">${p.name} - ${p.price} TL / Yıl</option>`).join("")}</select>
  <input id="payAmount" placeholder="Tutar">
  <input id="payPhone" value="${d.user.phone}" placeholder="Telefon">
  <button onclick="payment()">Ödeme Bildir</button>
</div>

<div class="card">
  <h3>Çekim Talebi</h3>
  <input id="wName" value="${d.user.firstName} ${d.user.lastName}" placeholder="Ad Soyad">
  <input id="wIban" placeholder="IBAN">
  <input id="wAmount" placeholder="50 TL ve katları">
  <button onclick="withdraw()">Çekim Talebi Gönder</button>
</div>

<div class="card">
  <h3>Destek Merkezi</h3>
  <input id="supSub" placeholder="Konu">
  <textarea id="supMsg" placeholder="Mesajınız"></textarea>
  <button onclick="support()">Destek Kaydı Gönder</button>
  <h4>Destek Kayıtlarım</h4>
  ${d.tickets.map(t=>`<p><b>${t.subject}</b> - ${t.status}<br>${t.message}<br>${t.replies.map(r=>`↳ Admin: ${r.message}`).join("<br>")}</p>`).join("")||"Kayıt yok"}
</div>`;
packSel.onchange=()=>payAmount.value=packSel.options[packSel.selectedIndex].dataset.price;
payAmount.value=packSel.options[0].dataset.price;
}catch(e){$("dash").innerHTML='<div class="card">Devam etmek için giriş yapmalısınız.</div>'}
}
function toggleList(id){$(id).classList.toggle("hidden")}
async function saveProfile(){try{await api("/api/profile",{method:"POST",body:JSON.stringify({firstName:pf.value,lastName:pl.value,email:pe.value,phone:pp.value,currentPassword:pcp.value,newPassword:pnp.value})});toast("Bilgiler güncellendi");dash()}catch(e){toast(e.message)}}
function copyRef(){navigator.clipboard.writeText($("refCode").innerText);toast("Referans kodu kopyalandı")}
function shareRef(){let text=`İzleKazan referans kodum: ${$("refCode").innerText}`; if(navigator.share)navigator.share({text}); else{navigator.clipboard.writeText(text);toast("Paylaşım metni kopyalandı")}}
async function payment(){try{await api("/api/payment",{method:"POST",body:JSON.stringify({packageId:packSel.value,amount:payAmount.value,phone:payPhone.value,note:payPhone.value})});toast("Ödeme bildirimi gönderildi")}catch(e){toast(e.message)}}
async function withdraw(){try{await api("/api/withdraw",{method:"POST",body:JSON.stringify({fullName:wName.value,iban:wIban.value,amount:wAmount.value})});toast("Çekim talebi gönderildi")}catch(e){toast(e.message)}}
async function support(){try{await api("/api/support",{method:"POST",body:JSON.stringify({subject:supSub.value,message:supMsg.value})});toast("Destek kaydı gönderildi");dash()}catch(e){toast(e.message)}}
function showAddMovie(){$("addMovieBox").classList.remove("hidden");window.scrollTo(0,$("addMovieBox").offsetTop-10)}
async function movies(){try{let m=await api("/api/movies");$("movieList").innerHTML=m.map(x=>`<div class="card movie ${x.locked?'locked':''}"><img src="${x.poster||'https://via.placeholder.com/300x450?text=Film'}"><h3>${x.title}</h3><p>${x.description||""}</p>${x.locked?'<span class="lock">Premium üyelik gerekli</span>':`<a href="${x.link}" target="_blank"><button>Filmleri Göster</button></a>`}</div>`).join("")}catch(e){$("movieList").innerHTML='<div class="card">Filmleri görmek için giriş yapmalısınız.</div>'}}
async function addMovie(){try{await api("/api/movies",{method:"POST",body:JSON.stringify({title:mt.value,year:my.value,category:mc.value,poster:mp.value,link:ml.value,description:md.value})});toast("Film CEO onayına gönderildi")}catch(e){toast(e.message)}}
async function ceo(){try{let m=await api("/api/ceo/pending");$("ceoBox").innerHTML=`<div class="card"><h3>CEO Film Ön Onay</h3>${m.map(x=>`<p>${x.title} <button onclick="okMovie('${x.id}')">CEO Onayla</button><button onclick="noMovie('${x.id}')">Reddet</button></p>`).join("")||"Bekleyen film yok"}</div>`}catch(e){$("ceoBox").innerHTML=""}}
async function okMovie(id){await api("/api/ceo/approve/"+id,{method:"POST"});toast("Admin yayın onayına gönderildi");ceo()}
async function noMovie(id){let reason=prompt("Reddetme nedeni:")||"Uygun değil";await api("/api/ceo/reject/"+id,{method:"POST",body:JSON.stringify({reason})});toast("Film reddedildi");ceo()}
async function admin(){try{let d=await api("/api/admin/all");let adminPending=d.movies.filter(m=>m.status==="admin_pending");$("adminBox").innerHTML=`<h3>Ödeme Bildirimleri</h3>${d.payments.filter(p=>p.status==="pending").map(p=>`<p>${p.phone} | ${p.amount} TL | ${p.status} <button onclick="payOk('${p.id}')">Onayla</button><button onclick="payNo('${p.id}')">Reddet</button></p>`).join("")||"Bekleyen ödeme yok"}<h3>Ödeme Bildirimleri Arşivi</h3>${d.payments.filter(p=>p.status!=="pending").map(p=>`<p>${p.phone} | ${p.amount} TL | ${p.status} ${p.rejectReason||""}</p>`).join("")||"Arşiv boş"}<h3>Admin Film Yayın Onayı</h3>${adminPending.map(m=>`<div class="box"><b>${m.title}</b><p>${m.description||""}</p><a href="${m.link}" target="_blank"><button>Sayfada Nasıl Görünüyor?</button></a><button onclick="publishMovie('${m.id}')">Yayınla</button><button onclick="adminRejectMovie('${m.id}')">Filmi Reddet</button></div>`).join("")||"Yayın onayı bekleyen film yok"}<h3>Destek Mesajları</h3>${d.supportTickets.map(t=>`<div class="box"><b>${t.subject}</b> - ${t.status}<p>${t.message}</p><input id="rep_${t.id}" placeholder="Cevap yaz"><button onclick="replyTicket('${t.id}')">Cevapla</button></div>`).join("")||"Destek mesajı yok"}<h3>Çekimler</h3>${d.withdrawals.map(w=>`<p>${w.amount} TL | ${w.status} <button onclick="wdOk('${w.id}')">Onayla</button><button onclick="wdNo('${w.id}')">Reddet</button></p>`).join("")||"Çekim yok"}<h3>Kullanıcılar</h3>${d.users.map(u=>`<p>${u.firstName} ${u.lastName} | ${u.email} | ${u.balance} TL | Paket:${u.packageId}</p>`).join("")}`}catch(e){$("adminBox").innerHTML="Admin girişi gerekli"}}
async function payOk(id){await api("/api/admin/payments/"+id+"/approve",{method:"POST"});toast("Ödeme onaylandı");admin()}
async function payNo(id){let reason=prompt("Reddetme nedeni:")||"Ödeme doğrulanamadı";await api("/api/admin/payments/"+id+"/reject",{method:"POST",body:JSON.stringify({reason})});toast("Ödeme reddedildi");admin()}
async function publishMovie(id){await api("/api/admin/movies/"+id+"/publish",{method:"POST"});toast("Film yayınlandı, kazançlar bekleyen bakiyeye eklendi");admin()}
async function adminRejectMovie(id){let reason=prompt("Reddetme nedeni:")||"Film uygun değil";await api("/api/admin/movies/"+id+"/reject",{method:"POST",body:JSON.stringify({reason})});toast("Film reddedildi");admin()}
async function replyTicket(id){await api("/api/admin/support/"+id+"/reply",{method:"POST",body:JSON.stringify({message:$("rep_"+id).value})});toast("Destek cevabı gönderildi");admin()}
async function wdOk(id){await api("/api/admin/withdrawals/"+id+"/approve",{method:"POST"});toast("Çekim onaylandı");admin()}
async function wdNo(id){let reason=prompt("Reddetme nedeni:")||"Çekim reddedildi";await api("/api/admin/withdrawals/"+id+"/reject",{method:"POST",body:JSON.stringify({reason})});toast("Çekim reddedildi");admin()}
init();
