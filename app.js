
let token = localStorage.getItem("token") || "";
let me = null;
let selectedPackageId = null;
let selectedPackagePrice = 0;
let lastPageBeforeWatch = "movies";
let filmIsLocked = false;
let filmLockPointerStart = null;
const LOCKED_FILM_MESSAGE = "Filmleri izlemek için üye olmanız ve premium paket olmanız gerekmektedir.";

const $ = (id) => document.getElementById(id);

async function api(url, opt = {}) {
  const r = await fetch(url, {
    ...opt,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(opt.headers || {})
    }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Hata oluştu");
  return j;
}

function toast(message) {
  const t = $("toast");
  if (!t) return alert(message);
  t.innerText = message;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 3000);
}

function isLoggedIn() {
  return !!token;
}

function requireZeroPhoneInput(id) {
  const el = $(id);
  const value = el ? String(el.value || "").trim() : "";
  const digits = value.replace(/\D/g, "");
  if (!digits || !digits.startsWith("0")) {
    toast("Telefon numarası 0 ile başlamalıdır. Lütfen başına 0 koyarak 05XXXXXXXXX formatında yazın.");
    if (el) {
      el.focus();
      el.classList.add("inputError");
      setTimeout(() => el.classList.remove("inputError"), 1800);
    }
    return null;
  }
  return digits;
}

function refreshMenu() {
  const loginTop = $("loginTop");
  const logoutBtn = $("logoutBtn");
  const adminNav = $("adminNav");
  const adminTop = $("adminTop");
  const panelTop = $("panelTop");
  const bottomPanelNav = $("bottomPanelNav");
  const bottomLogoutNav = $("bottomLogoutNav");
  const logged = isLoggedIn();
  const isAdmin = !!(me && me.role === "admin");

  document.body.classList.toggle("loggedIn", logged);
  document.body.classList.toggle("adminLogged", isAdmin);

  if (loginTop) loginTop.classList.toggle("hidden", logged);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !logged);
  if (panelTop) panelTop.classList.toggle("hidden", !logged);
  if (bottomPanelNav) bottomPanelNav.classList.toggle("hidden", !logged || isAdmin);
  if (bottomLogoutNav) bottomLogoutNav.classList.toggle("hidden", !logged);
  if (adminNav) adminNav.classList.toggle("hidden", !isAdmin);
  if (adminTop) adminTop.classList.toggle("hidden", !isAdmin);
}

function page(id) {
  if (id === "withdrawalsPublic") id = "database";
  if (id === "auth" && isLoggedIn()) id = "panel";

  document.body.classList.toggle("watchMode", id === "watch");

  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const target = $(id);
  if (!target) {
    console.error("Sayfa bulunamadı:", id);
    toast("Sayfa bulunamadı: " + id);
    return;
  }
  target.classList.add("active");

  const hero = $("hero");
  if (hero) {
    hero.style.display = id === "watch" ? "none" : "block";
    hero.classList.toggle("subpage", id !== "home" && id !== "watch");
  }

  window.scrollTo(0, 0);

  if (id === "packages") loadPackages();
  if (id === "panel") dash();
  if (id === "movies") {
    movies();
    ceo();
  }
  if (id === "admin") admin();
  if (id === "database") {
    publicWithdrawals();
    publicMembers();
  }
}

function logout() {
  localStorage.removeItem("token");
  token = "";
  me = null;
  refreshMenu();
  page("home");
  toast("Çıkış yapıldı");
}

function toggleAuthPanel(type) {
  const loginPanel = $("loginPanel");
  const registerPanel = $("registerPanel");
  if (!loginPanel || !registerPanel) return;

  const loginActive = type === "login";
  loginPanel.classList.toggle("active", loginActive);
  registerPanel.classList.toggle("active", !loginActive);

  // Mobilde seçilen formu ekranın üstüne al.
  // Böylece Üye Ol açıldığında üstteki Giriş Yap kartı ekranda kalmaz;
  // kullanıcı Giriş Yap'a dönmek isterse sayfayı yukarı kaydırır.
  if (window.matchMedia && window.matchMedia("(max-width: 820px)").matches) {
    const target = loginActive ? loginPanel : registerPanel;
    const moveToTarget = () => {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    };
    window.requestAnimationFrame(() => {
      setTimeout(moveToTarget, 70);
      setTimeout(moveToTarget, 360);
    });
  }
}


const rotatingSlogans = [
  "İzle, Paylaş, Kazanç Fırsatını Büyüt.",
  "Hem Film İzle Hem de Platformun Kazanç Modeline Dahil Ol.",
  "Premium Üyelik Sadece Film İzlemek İçin Değil, Ek Gelir Fırsatı İçin.",
  "Film Keyfini Ek Gelir Modeliyle Birleştiren Yeni Platform."
];
const rotatingSloganColors = ["#f6b51e", "#38bdf8", "#a78bfa", "#34d399"];
let rotatingSloganIndex = 0;

function startRotatingSlogans() {
  const el = $("rotatingSlogan");
  if (!el || el.dataset.started === "1") return;
  el.dataset.started = "1";
  el.innerText = rotatingSlogans[0];
  el.style.setProperty("--slogan-color", rotatingSloganColors[0]);

  setInterval(() => {
    el.classList.add("sloganOut");
    setTimeout(() => {
      rotatingSloganIndex = (rotatingSloganIndex + 1) % rotatingSlogans.length;
      el.innerText = rotatingSlogans[rotatingSloganIndex];
      el.style.setProperty("--slogan-color", rotatingSloganColors[rotatingSloganIndex]);
      el.classList.remove("sloganOut");
      el.classList.add("sloganIn");
      setTimeout(() => el.classList.remove("sloganIn"), 520);
    }, 420);
  }, 7000);
}

async function init() {
  try {
    if (token) {
      const d = await api("/api/me");
      me = d.user;
    }
  } catch (e) {
    localStorage.removeItem("token");
    token = "";
    me = null;
  }

  refreshMenu();
  startRotatingSlogans();
  await loadPackages().catch(() => {});
  checkResetLink();
}

function getCurrentPackageId() {
  return me && me.premiumActive ? Number(me.packageId || 0) : 0;
}

function packageButtonState(pack) {
  const currentId = getCurrentPackageId();
  if (!isLoggedIn() || !currentId) return { disabled: false, text: "Paketi Seç", className: "" };
  if (pack.id < currentId) return { disabled: true, text: "Mevcut Paketinden Düşük", className: "disabledPackage" };
  if (pack.id === currentId) return { disabled: false, text: "Paketi Yenile", className: "currentPackage" };
  return { disabled: false, text: "Paketi Yükselt", className: "upgradePackage" };
}

async function loadPackages() {
  const packs = await api("/api/packages");
  if (isLoggedIn()) {
    try {
      const d = await api("/api/me");
      me = d.user;
      refreshMenu();
    } catch (e) {}
  }
  const el = $("packageList");
  if (!el) return;

  el.innerHTML = packs
    .map((x) => {
      const state = packageButtonState(x);
      const currentNote = state.className === "currentPackage" ? `<div class="packageNote">Mevcut paketiniz. Yenileme yaparsanız yeni süre mevcut bitiş tarihinden sonra başlar.</div>` : "";
      const disabledNote = state.disabled ? `<div class="packageNote muted">Bu paket mevcut paketinizden düşük olduğu için seçilemez.</div>` : "";
      return `
      <div class="package ${state.className}">
        <span class="badge">${x.badge}</span>
        <h3>${x.name}</h3>
        <div class="price">${x.price} TL / Yıl</div>
        <p>1 yıl geçerli | ${x.depth} seviye | %${x.rate * 100} prim</p>
        <ul>${x.features.map((f) => `<li>${f}</li>`).join("")}</ul>
        ${currentNote}${disabledNote}
        <button ${state.disabled ? "disabled" : ""} onclick="choosePack(${x.id}, ${x.price})">${state.text}</button>
      </div>`;
    })
    .join("");
}

async function choosePack(id, price) {
  if(!isLoggedIn()){
    const go = confirm("Paket satın almak için önce üye olmanız gerekmektedir.");
    if(go) page("auth");
    return;
  }
  const currentId = getCurrentPackageId();
  if (currentId && id < currentId) {
    toast("Mevcut paketinizden düşük paket seçemezsiniz.");
    return;
  }
  selectedPackageId = id;
  selectedPackagePrice = price;
  const packs = await api("/api/packages");
  const p = packs.find((x) => x.id === id);
  const box = $("packageInfoBox");
  if (!box || !p) return;

  box.innerHTML = `
    <h2>${p.name}</h2>
    <div class="price">${p.price} TL / Yıl</div>
    <p>Bu paket 1 yıl / 365 gün geçerlidir. Aynı aktif paketi yenilerseniz yeni süre mevcut bitiş tarihinizin sonrasına eklenir.</p>
    <ul>${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>
    <div class="actionRow">
      <button onclick="showPaymentGuide(${p.id}, ${p.price})">${getCurrentPackageId() === p.id ? "Paketi Yenile" : getCurrentPackageId() ? "Paketi Yükselt" : "Paketi Satın Al"}</button>
      <button class="ghost" onclick="page('packages')">Diğer Paketleri İncele</button>
    </div>`;
  page("packageInfo");
}

function showPaymentGuide(id, price) {
  selectedPackageId = id;
  selectedPackagePrice = price;
  const box = $("paymentGuideBox");
  if (!box) return;

  box.innerHTML = `
    <h2>${getCurrentPackageId() === id ? "Paketi Yenile" : getCurrentPackageId() ? "Paketi Yükselt" : "Paketi Satın Al"}</h2>
    <p class="muted">Aşağıdaki IBAN'a ödeme yapın. Açıklama bölümüne kayıtlı telefon numaranızı yazın. Aynı aktif paketi yenilerseniz yeni süre mevcut bitiş tarihinden sonra başlar.</p>
    <div class="ibanBox">
      <b>IBAN:</b> TR78 0015 7000 0000 0037 7980 62<br>
      <b>Alıcı:</b> YILMAZ ORAL<br>
      <b>Tutar:</b> ${price} TL<br>
      <b>Açıklama:</b> Kayıtlı telefon numaranız 05XXXXXXXXX
    </div>
    <input id="payGuidePhone" inputmode="tel" autocomplete="tel" placeholder="Kayıtlı telefon numaranız 05XXXXXXXXX">
    <div class="actionRow">
      <button onclick="paymentFromGuide()">Ödeme Yaptım</button>
      <button class="ghost" onclick="page('packages')">Paket Değiştir</button>
    </div>`;
  page("paymentGuide");
}

async function register() {
  try {
    const phoneNorm = requireZeroPhoneInput("rp");
    if (!phoneNorm) return;
    await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: $("rf").value,
        lastName: $("rl").value,
        email: $("re").value,
        phone: phoneNorm,
        password: $("rs").value,
        password2: $("rs2").value,
        referralCode: $("rr").value
      })
    });
    toast("Kayıt başarılı, giriş yapın");
    toggleAuthPanel("login");
    page("auth");
  } catch (e) {
    toast(e.message);
  }
}

async function login() {
  try {
    const loginValue = $("le").value;
    const d = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ login: loginValue, email: loginValue, password: $("ls").value })
    });
    token = d.token;
    me = d.user;
    localStorage.setItem("token", token);
    refreshMenu();
    toast("Giriş başarılı");
    page("panel");
  } catch (e) {
    toast(e.message);
  }
}

async function dash() {
  try {
    const d = await api("/api/dashboard");
    me = d.user;
    refreshMenu();

    const packs = await api("/api/packages");
    const pEnd = d.user.premiumUntil ? new Date(d.user.premiumUntil).toLocaleDateString("tr-TR") : "Aktif değil";
    const pStart = d.user.premiumStartedAt ? new Date(d.user.premiumStartedAt).toLocaleDateString("tr-TR") : "Aktif değil";
    const pendingList = d.pendingEarnings.filter((x) => x.status === "pending").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const releasedList = d.tx.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const pendingSum = pendingList.reduce((a, b) => a + Number(b.amount), 0).toFixed(2);
    const firstName = d.user.firstName || "";
    const lastName = d.user.lastName || "";
    const userInitials = ((firstName[0] || "Ü") + (lastName[0] || "")).toUpperCase();
    const packageName = d.package ? d.package.name : "Paket aktif değil";
    const balanceSum = Number(d.user.balance || 0).toFixed(2);
    const notifications = d.notifications || [];
    const children = d.children || [];
    const tickets = d.tickets || [];
    const premiumActive = !!d.user.premiumActive;


    $("dash").innerHTML = `
      <div class="memberDashboard">
        <div class="memberHero">
          <div class="memberAvatar">${userInitials}</div>
          <div class="memberHeroText">
            <span class="panelKicker">Üye Kontrol Merkezi</span>
            <h3>Hoş geldin, ${firstName} ${lastName}</h3>
            <p><b>${packageName}</b> • Premium başlangıç: ${pStart} • Premium bitiş: ${pEnd}</p>
          </div>
          <div class="memberHeroActions">
            <span class="accountStatus ${premiumActive ? "active" : "passive"}">${premiumActive ? "Premium Aktif" : "Premium Pasif"}</span>
            <button onclick="page('packages')">${premiumActive && d.user.packageId === 5 ? "Paketi Yenile" : "Paketi Yükselt / Yenile"}</button>
          </div>
        </div>

        <div class="memberQuickGrid">
          <div class="metricCard clickable" onclick="toggleList('pendingList')">
            <i>⏳</i>
            <span>Bekleyen Bakiye</span>
            <strong>${pendingSum} TL</strong>
            <small>15 gün sonra çekilebilir bakiyeye aktarılır.</small>
          </div>
          <div class="metricCard clickable success" onclick="toggleList('releasedList')">
            <i>💳</i>
            <span>Çekilebilir Bakiye</span>
            <strong>${balanceSum} TL</strong>
            <small>Detaylı işlem geçmişi için tıkla.</small>
          </div>
          <div class="metricCard ${premiumActive ? "success" : "warning"}">
            <i>⭐</i>
            <span>Premium Bitiş</span>
            <strong>${pEnd}</strong>
            <small>${d.user.premiumDaysLeft || 0} gün kaldı.</small>
          </div>
          <div class="metricCard blue">
            <i>👥</i>
            <span>Alt Üye</span>
            <strong>${children.length}</strong>
            <small>Referans ağındaki doğrudan üyeler.</small>
          </div>
        </div>

        <div id="pendingList" class="card detailList dashboardWide hidden">
          <div class="panelSectionHead"><div><span>Bekleyen işlemler</span><h3>Bekleyen Bakiye Detayı</h3></div></div>
          ${pendingList.map((e) => `<div class="listItem"><b>+${e.amount} TL</b><span>${e.desc}</span><small>${new Date(e.createdAt).toLocaleString("tr-TR")} • Çekilebilir tarih: ${new Date(e.availableAt).toLocaleDateString("tr-TR")}</small></div>`).join("") || `<div class="emptyState">Bekleyen kazanç yok.</div>`}
        </div>

        <div id="releasedList" class="card detailList dashboardWide hidden">
          <div class="panelSectionHead"><div><span>İşlem geçmişi</span><h3>Çekilebilir Bakiye Detayı</h3></div></div>
          ${releasedList.map((t) => `<div class="listItem"><b>${Number(t.amount) > 0 ? "+" : ""}${t.amount} TL</b><span>${t.desc}</span><small>${new Date(t.createdAt).toLocaleString("tr-TR")} • ${t.type}</small></div>`).join("") || `<div class="emptyState">İşlem yok.</div>`}
        </div>

        <div class="card dashboardWide notificationPanel">
          <div class="panelSectionHead">
            <div><span>Son durum</span><h3>Bildirimlerim</h3></div>
            <b class="miniBadge">${notifications.length} Bildirim</b>
          </div>
          <div class="notificationList">
            ${notifications.map((n) => `<div class="notificationItem ${n.type}"><i>${n.type === "error" ? "!" : "✓"}</i><div><b>${n.title}</b><p>${n.message}</p><small>${new Date(n.createdAt).toLocaleString("tr-TR")}</small></div></div>`).join("") || `<div class="emptyState"><b>Bildirim yok</b><span>Yeni ödeme, çekim ve destek cevapları burada görünür.</span></div>`}
          </div>
        </div>

        <div class="card dashboardWide">
          <div class="panelSectionHead">
            <div><span>Referans ağı</span><h3>Alt Üyelerim</h3></div>
            <b class="miniBadge">${children.length} Üye</b>
          </div>
          <p class="privacyNote">Kullanıcı gizliliği için ad görünür; soyadın yalnızca ilk harfi ve telefonun ilk 5 hanesi gösterilir.</p>
          <div class="tableWrap professionalTable">
            <table>
              <thead><tr><th>Ad Soyad</th><th>Telefon</th><th>Paket</th><th>Premium Başlangıç</th><th>Premium Bitiş</th><th>Durum</th></tr></thead>
              <tbody>
                ${children.map((c) => `<tr><td>${c.maskedName || (c.firstName + " " + c.lastName)}</td><td>${c.maskedPhone || c.phone}</td><td>${c.packageName}</td><td>${c.premiumStartedAt ? new Date(c.premiumStartedAt).toLocaleDateString("tr-TR") : "-"}</td><td>${c.premiumUntil ? new Date(c.premiumUntil).toLocaleDateString("tr-TR") : "-"}</td><td><span class="statusPill ${c.premiumActive ? "success" : "warning"}">${c.premiumActive ? "Premium" : "Pasif"}</span></td></tr>`).join("") || `<tr><td colspan="6">Alt üye yok</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <div class="panelActionGrid">
          <div class="card panelFormCard">
            <div class="panelSectionHead"><div><span>Hesap</span><h3>Üyelik Bilgilerim</h3></div></div>
            <div class="formGrid">
              <label>Ad<input id="pf" value="${d.user.firstName}" placeholder="Ad"></label>
              <label>Soyad<input id="pl" value="${d.user.lastName}" placeholder="Soyad"></label>
              <label>E-posta<input id="pe" value="${d.user.email}" placeholder="Email"></label>
              <label>Telefon<input id="pp" inputmode="tel" autocomplete="tel" value="${d.user.phone}" placeholder="Telefon 05XXXXXXXXX"></label>
              <label>Mevcut şifre<input id="pcp" type="password" placeholder="Mevcut şifre"></label>
              <label>Yeni şifre<input id="pnp" type="password" placeholder="Yeni şifre"></label>
            </div>
            <button onclick="saveProfile()">Bilgileri Güncelle</button>
          </div>

          <div class="card panelFormCard referralCard">
            <div class="panelSectionHead"><div><span>Davet</span><h3>Referans Sistemi</h3></div></div>
            ${premiumActive ? `<p class="muted">Referans kodunu paylaşarak doğrudan üye ağını büyütebilirsin.</p><div class="refBox professionalRef"><span class="refCode" id="refCode">${d.user.referralCode}</span><button onclick="copyRef()">Kopyala</button><button class="ghost" onclick="shareRef()">Paylaş</button></div>` : `<div class="emptyState compact"><b>Referans kodu kapalı</b><span>Referans kodunuz paket satın alındıktan sonra görünür.</span></div>`}
          </div>

          <div class="card panelFormCard paymentCard">
            <div class="panelSectionHead"><div><span>Ödeme</span><h3>IBAN Ödeme Bildir</h3></div></div>
            <div class="bankInfo"><b>IBAN</b><span>TR78 0015 7000 0000 0037 7980 62</span><small>Alıcı: YILMAZ ORAL • Açıklama: Telefon numaranızı yazınız</small></div>
            <label>Paket seçimi<select id="packSel">${packs.map((p) => {
              const currentId = d.user.premiumActive ? Number(d.user.packageId || 0) : 0;
              const disabled = currentId && p.id < currentId;
              const label = disabled ? " - Seçilemez" : currentId === p.id ? " - Yenile" : currentId ? " - Yükselt" : "";
              return `<option value="${p.id}" data-price="${p.price}" ${disabled ? "disabled" : ""}>${p.name} - ${p.price} TL / Yıl${label}</option>`;
            }).join("")}</select></label>
            <label>Tutar<input id="payAmount" placeholder="Tutar"></label>
            <label>Telefon<input id="payPhone" inputmode="tel" autocomplete="tel" value="${d.user.phone}" placeholder="Telefon 05XXXXXXXXX"></label>
            <button onclick="payment()">Ödeme Bildir</button>
          </div>

          <div class="card panelFormCard withdrawCard">
            <div class="panelSectionHead"><div><span>Bakiye</span><h3>Çekim Talebi</h3></div></div>
            <label>Ad Soyad<input id="wName" value="${d.user.firstName} ${d.user.lastName}" placeholder="Ad Soyad"></label>
            <label>IBAN<input id="wIban" placeholder="IBAN"></label>
            <label>Tutar<input id="wAmount" placeholder="50 TL ve katları"></label>
            <button onclick="withdraw()">Çekim Talebi Gönder</button>
          </div>

          <div class="card panelFormCard supportCard dashboardWide">
            <div class="panelSectionHead"><div><span>Yardım</span><h3>Destek Merkezi</h3></div></div>
            <div class="supportGrid">
              <div>
                <label>Konu<input id="supSub" placeholder="Konu"></label>
                <label>Mesaj<textarea id="supMsg" placeholder="Mesajınız"></textarea></label>
                <button onclick="support()">Destek Kaydı Gönder</button>
              </div>
              <div class="ticketList">
                <h4>Destek Kayıtlarım</h4>
                ${tickets.map((t) => `<div class="ticketItem"><b>${t.subject}</b><span>${t.status}</span><p>${t.message}</p>${t.replies.map((r) => `<small>↳ Admin: ${r.message}</small>`).join("")}</div>`).join("") || `<div class="emptyState compact">Kayıt yok.</div>`}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const firstEnabledOption = Array.from($("packSel").options).find((opt) => !opt.disabled);
    if (firstEnabledOption) $("packSel").value = firstEnabledOption.value;
    $("packSel").onchange = () => ($("payAmount").value = $("packSel").options[$("packSel").selectedIndex].dataset.price);
    $("payAmount").value = $("packSel").options[$("packSel").selectedIndex].dataset.price;
  } catch (e) {
    $("dash").innerHTML = '<div class="card">Devam etmek için giriş yapmalısınız.</div>';
  }
}

function toggleList(id) {
  const el = $(id);
  if (el) el.classList.toggle("hidden");
}

async function saveProfile() {
  try {
    const phoneNorm = requireZeroPhoneInput("pp");
    if (!phoneNorm) return;
    await api("/api/profile", {
      method: "POST",
      body: JSON.stringify({
        firstName: $("pf").value,
        lastName: $("pl").value,
        email: $("pe").value,
        phone: phoneNorm,
        currentPassword: $("pcp").value,
        newPassword: $("pnp").value
      })
    });
    toast("Bilgiler güncellendi");
    dash();
  } catch (e) {
    toast(e.message);
  }
}

function copyRef() {
  navigator.clipboard.writeText($("refCode").innerText);
  toast("Referans kodu kopyalandı");
}

function shareRef() {
  const text = `İzleKazan referans kodum: ${$("refCode").innerText}`;
  if (navigator.share) navigator.share({ text });
  else {
    navigator.clipboard.writeText(text);
    toast("Paylaşım metni kopyalandı");
  }
}

async function payment() {
  try {
    const phoneNorm = requireZeroPhoneInput("payPhone");
    if (!phoneNorm) return;
    await api("/api/payment", {
      method: "POST",
      body: JSON.stringify({
        packageId: $("packSel").value,
        amount: $("payAmount").value,
        phone: phoneNorm,
        note: phoneNorm
      })
    });
    toast("Ödeme bildirimi gönderildi");
  } catch (e) {
    toast(e.message);
  }
}

async function paymentFromGuide() {
  try {
    if (!isLoggedIn()) {
      toast("Ödeme bildirimi için önce giriş yapmalısınız");
      page("auth");
      return;
    }
    const phoneNorm = requireZeroPhoneInput("payGuidePhone");
    if (!phoneNorm) return;
    await api("/api/payment", {
      method: "POST",
      body: JSON.stringify({
        packageId: selectedPackageId,
        amount: selectedPackagePrice,
        phone: phoneNorm,
        note: phoneNorm
      })
    });
    toast("Ödeme bildirimi admine gönderildi");
    page("panel");
  } catch (e) {
    toast(e.message);
  }
}

async function withdraw() {
  try {
    await api("/api/withdraw", {
      method: "POST",
      body: JSON.stringify({
        fullName: $("wName").value,
        iban: $("wIban").value,
        amount: $("wAmount").value
      })
    });
    toast("Çekim talebi gönderildi");
  } catch (e) {
    toast(e.message);
  }
}

async function support() {
  try {
    await api("/api/support", {
      method: "POST",
      body: JSON.stringify({ subject: $("supSub").value, message: $("supMsg").value })
    });
    toast("Destek kaydı gönderildi");
    dash();
  } catch (e) {
    toast(e.message);
  }
}

function showAddMovie() {
  $("addMovieBox").classList.remove("hidden");
  window.scrollTo(0, $("addMovieBox").offsetTop - 10);
}

async function openFirstMovie() {
  try {
    const m = await api("/api/movies");
    if (!m.length) {
      toast("Yayında film bulunmuyor");
      return;
    }

    const first = m[0];
    const url = first.watchLink || first.previewLink || first.embedLink || first.link || "";
    openFilmModal(url, !!first.locked);
  } catch (e) {
    toast(e.message || "Film açılamadı");
  }
}

async function handleVizyonClick() {
  await openFirstMovie();
}

function openLockedMovie(url) {
  openFilmModal(url, true);
}

async function movies() {
  try {
    const m = await api("/api/movies");
    const logged = isLoggedIn();

    const showcasePoster = "/assets/film-afisleri-vitrin.png";

    $("movieList").innerHTML = m
      .map((x) => {
        const isDefaultFilmPlatform = /reklamsız film platformu/i.test(x.title || "");
        const posterSrc = (!x.poster || String(x.poster).includes("movie-poster.svg") || isDefaultFilmPlatform)
          ? showcasePoster
          : x.poster;

        return `<div class="card movie ${x.locked ? "locked" : ""}">
          <div class="moviePosterWrap" aria-label="Film afişleri vitrini">
            <img src="${posterSrc}" alt="Film afişleri vitrini" onerror="this.src='/assets/film-afisleri-vitrin.png'">
            ${x.locked ? '<span class="premiumBadge">Premium İçerik</span>' : '<span class="premiumBadge open">Erişim Açık</span>'}
          </div>
          <h3>${x.title}</h3>
          <div class="movieMeta">${x.category || "Film"}${x.year ? " • " + x.year : ""}</div>
          <p>${x.description || ""}</p>
          ${x.locked
            ? `<button onclick='openLockedMovie(${JSON.stringify(x.watchLink || x.previewLink || x.embedLink || x.link || "")})'>Film Sitesini Aç</button><small class="movieHint">Film sitesi görüntülenir; izlemek için üye olup premium paket almanız gerekir.</small>`
            : `<button onclick='openFilmModal(${JSON.stringify(x.watchLink || x.previewLink || x.embedLink || x.link || "")}, false)'>Filmi İzle</button>`}
        </div>`;
      })
      .join("") || '<div class="card">Yayında film bulunmuyor.</div>';
  } catch (e) {
    $("movieList").innerHTML = '<div class="card">Film kataloğu şu anda yüklenemedi. Lütfen tekrar deneyin.</div>';
  }
}

function premiumRequiredForMovie() {
  if (!isLoggedIn()) {
    const go = confirm("Filmleri izlemek için önce üye olmanız ve premium paket almanız gerekmektedir. Üye olma ekranına gitmek ister misiniz?");
    if (go) page("auth");
    return;
  }

  const go = confirm("Bu filmi izlemek için premium üyelik gereklidir. Paketleri görüntülemek ister misiniz?");
  if (go) page("packages");
}

async function addMovie() {
  try {
    await api("/api/movies", {
      method: "POST",
      body: JSON.stringify({
        title: $("mt").value,
        year: $("my").value,
        category: $("mc").value,
        poster: $("mp").value,
        link: $("ml").value,
        embedLink: $("mel") ? $("mel").value : "",
        description: $("md").value
      })
    });
    toast("Film CEO onayına gönderildi");
  } catch (e) {
    toast(e.message);
  }
}

async function ceo() {
  try {
    const m = await api("/api/ceo/pending");
    $("ceoBox").innerHTML = `<div class="card"><h3>CEO Film Ön Onay</h3>${m.map((x) => `<p>${x.title} <button onclick="okMovie('${x.id}')">CEO Onayla</button><button onclick="noMovie('${x.id}')">Reddet</button></p>`).join("") || "Bekleyen film yok"}</div>`;
  } catch (e) {
    $("ceoBox").innerHTML = "";
  }
}

async function okMovie(id) {
  await api("/api/ceo/approve/" + id, { method: "POST" });
  toast("Admin yayın onayına gönderildi");
  ceo();
}

async function noMovie(id) {
  const reason = prompt("Reddetme nedeni:") || "Uygun değil";
  await api("/api/ceo/reject/" + id, { method: "POST", body: JSON.stringify({ reason }) });
  toast("Film reddedildi");
  ceo();
}

async function publicWithdrawals() {
  const box = $("publicWithdrawalsBox");
  if (!box) return;
  box.innerHTML = `<div class="card">Kazanç çekim talepleri yükleniyor...</div>`;
  try {
    const d = await api("/api/public/withdrawals");
    const list = d.withdrawals || [];
    const statusText = (st) => st === "approved" ? "Ödeme Yapıldı" : st === "rejected" ? "Reddedildi" : st === "pending" ? "Bekliyor" : st;
    const statusClass = (st) => st === "approved" ? "success" : st === "rejected" ? "danger" : "warning";
    box.innerHTML = `
      <h3 class="dbTitle">Kazanç Çekim Talepleri</h3>
      <div class="tableWrap publicWithdrawTable">
        <table>
          <thead><tr><th>Üye</th><th>Telefon</th><th>Paket</th><th>Tutar</th><th>Durum</th><th>Tarih</th></tr></thead>
          <tbody>
            ${list.map((w) => `<tr><td>${w.maskedName}</td><td>${w.maskedPhone}</td><td>${w.packageName || "Paket Yok"}</td><td>${w.amount} TL</td><td><span class="statusPill ${statusClass(w.status)}">${statusText(w.status)}</span></td><td>${w.createdAt ? new Date(w.createdAt).toLocaleString("tr-TR") : "-"}</td></tr>`).join("") || `<tr><td colspan="6">Henüz çekim talebi yok</td></tr>`}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    box.innerHTML = `<div class="card">Çekim talepleri alınamadı: ${e.message}</div>`;
  }
}

async function publicMembers() {
  const box = $("publicMembersBox");
  if (!box) return;
  box.innerHTML = `<div class="card">Aramıza katılan üyeler yükleniyor...</div>`;
  try {
    const d = await api("/api/public/members");
    const list = d.members || [];
    box.innerHTML = `
      <h3 class="dbTitle">Aramıza Katılanlar</h3>
      <div class="tableWrap publicWithdrawTable publicMembersTable">
        <table>
          <thead><tr><th>Üye</th><th>Telefon</th><th>Paket</th><th>Davet Eden</th><th>Katılım Tarihi</th></tr></thead>
          <tbody>
            ${list.map((m) => `<tr><td>${m.maskedName}</td><td>${m.maskedPhone}</td><td>${m.packageName || "Paket Yok"}</td><td>${m.inviterMaskedName || "Sistem"}</td><td>${m.createdAt ? new Date(m.createdAt).toLocaleString("tr-TR") : "-"}</td></tr>`).join("") || `<tr><td colspan="5">Henüz üye kaydı yok</td></tr>`}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    box.innerHTML = `<div class="card">Üye kayıtları alınamadı: ${e.message}</div>`;
  }
}

function scrollToDb(id) {
  const el = $(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function admin() {
  try {
    const d = await api("/api/admin/all");
    const pendingPayments = d.payments.filter((p) => p.status === "pending");
    const archivedPayments = d.payments.filter((p) => p.status !== "pending").slice().reverse();
    const adminPending = d.movies.filter((m) => m.status === "admin_pending");
    const supportTickets = d.supportTickets.slice().reverse();
    const withdrawals = d.withdrawals.slice().reverse();
    const users = d.users.slice().reverse();
    const paymentName = (p) => p.userFullName || ((d.users.find((u) => u.id === p.userId) || {}).firstName ? `${(d.users.find((u) => u.id === p.userId) || {}).firstName} ${(d.users.find((u) => u.id === p.userId) || {}).lastName}` : "İsim yok");

    const statusText = (s) => s === "approved" ? "Onaylandı" : s === "rejected" ? "Reddedildi" : s === "pending" ? "Bekliyor" : s;
    const withdrawalStatusText = (s) => s === "approved" ? "Ödeme Yapıldı" : statusText(s);
    const statusClass = (s) => s === "approved" ? "success" : s === "rejected" ? "danger" : "warning";
    const empty = (text) => `<div class="emptyState">${text}</div>`;

    $("adminBox").innerHTML = `
      <div class="adminHeader">
        <div>
          <span class="badge">Yönetim Paneli</span>
          <h3>İzleKazan Operasyon Merkezi</h3>
          <p class="muted">Ödeme onayı, çekim talebi, destek mesajları, film yayın akışı ve kullanıcı kontrolü tek ekranda.</p>
        </div>
        <div class="adminKpis">
          <div><b>${d.users.length}</b><span>Üye</span></div>
          <div><b>${pendingPayments.length}</b><span>Bekleyen Ödeme</span></div>
          <div><b>${withdrawals.filter((w) => w.status === "pending").length}</b><span>Bekleyen Çekim</span></div>
          <div><b>${adminPending.length}</b><span>Film Onayı</span></div>
        </div>
      </div>

      <div class="adminGrid">
        <section class="adminSection wide">
          <h3>Ödeme Bildirimleri</h3>
          ${pendingPayments.map((p) => `
            <div class="adminItem vertical paymentAdminItem">
              <div class="paymentAdminHead">
                <div>
                  <b>${paymentName(p)}</b>
                  <span>${p.phone || "Telefon yok"}</span>
                  <span>${p.amount} TL • Paket #${p.packageId}</span>
                  <small>Bildirim No: ${p.id}</small>
                </div>
                <span class="statusPill warning">Bekliyor</span>
              </div>
              <div class="adminActions paymentActions">
                <button onclick="payOk('${p.id}')">Ödemeyi Onayla</button>
                <button class="dangerBtn" onclick="payNo('${p.id}')">Ödemeyi Reddet</button>
              </div>
            </div>`).join("") || empty("Bekleyen ödeme bildirimi yok")}
        </section>

        <section class="adminSection">
          <h3>Admin Film Yayın Onayı</h3>
          ${adminPending.map((m) => `
            <div class="adminItem vertical">
              <div><b>${m.title}</b><span>${m.category || "Kategori yok"} • ${m.year || "Yıl yok"}</span></div>
              <p>${m.description || "Açıklama girilmemiş"}</p>
              <div class="adminActions">
                <button onclick='openFilmModal(${JSON.stringify(m.embedLink || m.playerLink || m.link || "")})'>Ön İzle</button>
                <button onclick="publishMovie('${m.id}')">Yayınla</button>
                <button class="dangerBtn" onclick="adminRejectMovie('${m.id}')">Reddet</button>
              </div>
            </div>`).join("") || empty("Yayın onayı bekleyen film yok")}
        </section>

        <section class="adminSection">
          <h3>Çekim Talepleri</h3>
          ${withdrawals.map((w) => `
            <div class="adminItem vertical">
              <div><b>${w.amount} TL</b><span>${w.fullName || "İsim yok"}</span><span>${w.packageName || ((d.packages.find((p) => p.id === w.packageId) || {}).name) || "Paket Yok"}</span></div>
              <span class="statusPill ${statusClass(w.status)}">${withdrawalStatusText(w.status)}</span>
              <small>${w.iban || "IBAN yok"}</small>
              ${w.status === "pending" ? `<div class="adminActions"><button onclick="wdOk('${w.id}')">Onayla</button><button class="dangerBtn" onclick="wdNo('${w.id}')">Reddet</button></div>` : ""}
            </div>`).join("") || empty("Çekim talebi yok")}
        </section>

        <section class="adminSection wide">
          <h3>Destek Mesajları</h3>
          ${supportTickets.map((t) => `
            <div class="adminItem vertical">
              <div><b>${t.subject}</b><span>${statusText(t.status)} • ${new Date(t.createdAt).toLocaleString("tr-TR")}</span></div>
              <p>${t.message}</p>
              <input id="rep_${t.id}" placeholder="Kullanıcıya cevap yaz">
              <button onclick="replyTicket('${t.id}')">Cevapla</button>
            </div>`).join("") || empty("Destek mesajı yok")}
        </section>

        <section class="adminSection wide">
          <h3>Ödeme Arşivi</h3>
          <div class="tableWrap">
            <table>
              <thead><tr><th>Ad Soyad</th><th>Telefon</th><th>Tutar</th><th>Paket</th><th>Durum</th><th>Not</th></tr></thead>
              <tbody>${archivedPayments.map((p) => `<tr><td>${paymentName(p)}</td><td>${p.phone}</td><td>${p.amount} TL</td><td>#${p.packageId}</td><td><span class="statusPill ${statusClass(p.status)}">${statusText(p.status)}</span></td><td>${p.rejectReason || "-"}</td></tr>`).join("") || `<tr><td colspan="6">Arşiv boş</td></tr>`}</tbody>
            </table>
          </div>
        </section>

        <section class="adminSection wide">
          <h3>Kullanıcılar</h3>
          <div class="tableWrap">
            <table>
              <thead><tr><th>Ad Soyad</th><th>E-posta</th><th>Telefon</th><th>Paket</th><th>Bakiye</th><th>Rol</th></tr></thead>
              <tbody>${users.map((u) => `<tr><td>${u.firstName} ${u.lastName}</td><td>${u.email}</td><td>${u.phone}</td><td>#${u.packageId || 0}</td><td>${u.balance || 0} TL</td><td>${u.role}</td></tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  } catch (e) {
    $("adminBox").innerHTML = "Admin girişi gerekli";
  }
}

async function payOk(id) {
  await api("/api/admin/payments/" + id + "/approve", { method: "POST" });
  toast("Ödeme onaylandı");
  admin();
}

async function payNo(id) {
  const reason = prompt("Reddetme nedeni:") || "Ödeme doğrulanamadı";
  await api("/api/admin/payments/" + id + "/reject", { method: "POST", body: JSON.stringify({ reason }) });
  toast("Ödeme reddedildi");
  admin();
}

async function publishMovie(id) {
  await api("/api/admin/movies/" + id + "/publish", { method: "POST" });
  toast("Film yayınlandı, kazançlar bekleyen bakiyeye eklendi");
  admin();
}

async function adminRejectMovie(id) {
  const reason = prompt("Reddetme nedeni:") || "Film uygun değil";
  await api("/api/admin/movies/" + id + "/reject", { method: "POST", body: JSON.stringify({ reason }) });
  toast("Film reddedildi");
  admin();
}

async function replyTicket(id) {
  await api("/api/admin/support/" + id + "/reply", {
    method: "POST",
    body: JSON.stringify({ message: $("rep_" + id).value })
  });
  toast("Destek cevabı gönderildi");
  admin();
}

async function wdOk(id) {
  await api("/api/admin/withdrawals/" + id + "/approve", { method: "POST" });
  toast("Çekim onaylandı");
  admin();
}

async function wdNo(id) {
  const reason = prompt("Reddetme nedeni:") || "Çekim reddedildi";
  await api("/api/admin/withdrawals/" + id + "/reject", { method: "POST", body: JSON.stringify({ reason }) });
  toast("Çekim reddedildi");
  admin();
}

function openFilmModal(url, locked = false) {
  if (!url) {
    toast("Film bağlantısı bulunamadı");
    return;
  }

  const cleanUrl = String(url).trim();
  const isSafeRelativeFilmGateway = cleanUrl === "/api/film-gateway" || cleanUrl.startsWith("/api/film-gateway?");
  if (!isSafeRelativeFilmGateway && !/^https?:\/\//i.test(cleanUrl)) {
    toast("Film bağlantısı hatalı. Lütfen yöneticiye bildirin.");
    return;
  }

  filmIsLocked = !!locked;
  lastPageBeforeWatch = (document.querySelector(".page.active") || {}).id || "movies";

  const shell = document.querySelector(".watchShell");
  if (shell) {
    shell.classList.toggle("lockedWatch", filmIsLocked);
    shell.classList.add("croppedWatch");
  }

  const box = document.querySelector(".watchFrameBox");
  if (box) box.style.setProperty("--film-scroll-y", "0px");

  const frame = $("filmFrame");
  if (frame) {
    if (filmIsLocked) {
      // Kilitli kullanımda iframe tıklamaları ve iframe tam ekran yetkisi kapatılır.
      // Tam ekran butonu sadece dış kapsayıcıyı tam ekran yapar; uyarı katmanı üstte kalır.
      frame.removeAttribute("allowfullscreen");
      frame.removeAttribute("webkitallowfullscreen");
      frame.removeAttribute("mozallowfullscreen");
      frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      frame.setAttribute("tabindex", "-1");
    } else {
      frame.setAttribute("allowfullscreen", "true");
      frame.setAttribute("webkitallowfullscreen", "true");
      frame.setAttribute("mozallowfullscreen", "true");
      frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share");
      frame.removeAttribute("tabindex");
    }
    frame.src = cleanUrl;
  }

  const overlay = $("filmLockOverlay");
  if (overlay) {
    overlay.scrollTop = 0;
    overlay.style.pointerEvents = filmIsLocked ? "auto" : "none";
    overlay.classList.toggle("hidden", !filmIsLocked);
    overlay.setAttribute("aria-hidden", filmIsLocked ? "false" : "true");
  }

  page("watch");
}

function lockedFilmClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const overlay = $("filmLockOverlay");
  const endX = event && typeof event.clientX === "number" ? event.clientX : (filmLockPointerStart ? filmLockPointerStart.x : 0);
  const endY = event && typeof event.clientY === "number" ? event.clientY : (filmLockPointerStart ? filmLockPointerStart.y : 0);
  const moved = filmLockPointerStart
    ? Math.abs(endX - filmLockPointerStart.x) + Math.abs(endY - filmLockPointerStart.y)
    : 0;
  const scrolled = overlay && filmLockPointerStart
    ? Math.abs(overlay.scrollTop - filmLockPointerStart.scrollTop)
    : 0;

  // Kullanıcı afişleri görmek için kaydırıyorsa uyarıyı tetikleme; gerçek tıklamada göster.
  if (moved > 10 || scrolled > 10) return;

  alert(LOCKED_FILM_MESSAGE);
}

function rememberFilmLockPointer(event) {
  const overlay = $("filmLockOverlay");
  const p = event && event.touches && event.touches[0] ? event.touches[0] : event;
  filmLockPointerStart = {
    x: p && typeof p.clientX === "number" ? p.clientX : 0,
    y: p && typeof p.clientY === "number" ? p.clientY : 0,
    scrollTop: overlay ? overlay.scrollTop : 0
  };
}

function syncLockedFilmScroll() {
  const overlay = $("filmLockOverlay");
  const box = document.querySelector(".watchFrameBox");
  if (!overlay || !box) return;
  box.style.setProperty("--film-scroll-y", overlay.scrollTop + "px");
}

function bindFilmLockOverlayScroll() {
  const overlay = $("filmLockOverlay");
  if (!overlay || overlay.dataset.scrollBound === "1") return;
  overlay.dataset.scrollBound = "1";
  overlay.addEventListener("scroll", syncLockedFilmScroll, { passive: true });
  overlay.addEventListener("pointerdown", rememberFilmLockPointer, { passive: true });
  overlay.addEventListener("touchstart", rememberFilmLockPointer, { passive: true });
}

function resetFilmWatchState() {
  filmIsLocked = false;
  filmLockPointerStart = null;

  const frame = $("filmFrame");
  if (frame) {
    frame.src = "about:blank";
    frame.removeAttribute("tabindex");
  }

  const overlay = $("filmLockOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    overlay.scrollTop = 0;
    overlay.style.pointerEvents = "none";
  }

  const shell = document.querySelector(".watchShell");
  if (shell) {
    shell.classList.remove("lockedWatch", "croppedWatch");
    shell.style.pointerEvents = "";
  }

  const box = document.querySelector(".watchFrameBox");
  if (box) {
    box.style.setProperty("--film-scroll-y", "0px");
  }
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
}

function exitFullscreenIfNeeded() {
  if (!getFullscreenElement()) return Promise.resolve();

  try {
    if (document.exitFullscreen) return document.exitFullscreen().catch(() => {});
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      return Promise.resolve();
    }
    if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      return Promise.resolve();
    }
    if (document.msExitFullscreen) {
      document.msExitFullscreen();
      return Promise.resolve();
    }
  } catch (e) {}

  return Promise.resolve();
}

function closeFilmModal() {
  const targetPage = lastPageBeforeWatch || "movies";

  // Önce kilidi kapatıyoruz. Böylece tam ekrandan çıkarken fullscreenchange olayı
  // premium kilit katmanını tekrar açıp ekranı tıklanamaz halde bırakmaz.
  resetFilmWatchState();

  exitFullscreenIfNeeded().finally(() => {
    page(targetPage);
    // Bazı mobil tarayıcılar fullscreen çıkışını gecikmeli tamamlıyor; ikinci temizlik ekran kilitlenmesini önler.
    setTimeout(resetFilmWatchState, 80);
    setTimeout(() => document.body.classList.remove("watchMode"), 120);
  });
}

function fullscreenMovie() {
  const shell = document.querySelector(".watchShell");
  const frame = $("filmFrame");
  if (!shell && !frame) return;

  // Kilitli filmde iframe tam ekran yapılmaz; kapsayıcı tam ekran yapılır.
  // Böylece premium uyarı katmanı tam ekranda da tıklamaları yakalamaya devam eder.
  const target = shell || frame;
  const overlay = $("filmLockOverlay");
  if (filmIsLocked && overlay) {
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }

  if (target.requestFullscreen) {
    target.requestFullscreen().catch(() => toast("Tam ekran açılamadı."));
  } else if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen();
  } else {
    toast("Bu tarayıcı tam ekran özelliğini desteklemiyor.");
  }
}

function handleFullscreenGuard() {
  const watchActive = !!document.querySelector("#watch.page.active");

  if (!watchActive) {
    resetFilmWatchState();
    return;
  }

  if (!filmIsLocked) return;

  const overlay = $("filmLockOverlay");
  if (overlay) {
    overlay.style.pointerEvents = "auto";
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }
  const shell = document.querySelector(".watchShell");
  if (shell) shell.classList.add("lockedWatch");
  const frame = $("filmFrame");
  const fsElement = getFullscreenElement();
  if (frame && fsElement === frame) {
    exitFullscreenIfNeeded();
  }
}

document.addEventListener("fullscreenchange", handleFullscreenGuard);
document.addEventListener("webkitfullscreenchange", handleFullscreenGuard);
document.addEventListener("DOMContentLoaded", bindFilmLockOverlayScroll);
bindFilmLockOverlayScroll();

async function forgotPassword() {
  try {
    const d = await api("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: $("forgotEmail").value })
    });
    $("forgotResult").innerHTML =
      `<p>${d.message}</p>` +
      (d.demoLink ? `<p class="muted">SMTP ayarı olmadığı için test bağlantısı: <a href="${d.demoLink}">${d.demoLink}</a></p>` : "");
    toast("Şifre sıfırlama işlemi başlatıldı");
  } catch (e) {
    toast(e.message);
  }
}

async function resetPassword() {
  try {
    const params = new URLSearchParams(location.search);
    const resetToken = params.get("reset");
    await api("/api/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: resetToken, newPassword: $("resetPass").value })
    });
    toast("Şifre yenilendi. Giriş yapabilirsiniz.");
    history.replaceState({}, "", "/");
    page("auth");
  } catch (e) {
    toast(e.message);
  }
}

function checkResetLink() {
  const params = new URLSearchParams(location.search);
  if (params.get("reset")) page("reset");
}

init();
