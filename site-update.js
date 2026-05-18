// İzleKazan v2026.05.18-017 güncelleme yamaları
// Bu dosya app.js yüklendikten sonra çalışır; paket görünümü, liderlik tabloları ve küçük davranış düzeltmelerini uygular.

(function () {
  const VERSION = "v2026.05.18-017";

  function safeCell(value, fallback = "-") {
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  function money(value) {
    const n = Number(value || 0);
    return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " TL";
  }

  function desiredPackages() {
    return [
      {
        id: 1,
        name: "Standart Üye",
        price: 100,
        depth: 1,
        rate: 0.10,
        durationDays: 365,
        badge: "Başlangıç",
        summary: "Sadece 1. seviyeden %10 referans kazancı.",
        features: [
          "1 yıl premium film erişimi",
          "Reklamsız Film Platformu filmlerine erişim",
          "1. seviye referanslardan %10 kazanç",
          "Referans kodu paket aktif olunca görünür",
          "Siteye Film Ekleme Kazancı",
          "Cüzdan, destek ve çekim talebi"
        ]
      },
      {
        id: 2,
        name: "VIP Üye",
        price: 500,
        depth: 2,
        rate: 0.20,
        durationDays: 365,
        badge: "VIP",
        summary: "Sadece 1. ve 2. seviyeden %20 referans kazancı.",
        features: [
          "1 yıl premium film erişimi",
          "Reklamsız Film Platformu filmlerine erişim",
          "1. seviye referanslardan %20 kazanç",
          "2. seviye referanslardan %20 kazanç",
          "Gelişmiş referans kazanç takibi",
          "Siteye Film Ekleme Kazancı",
          "Cüzdan, destek ve çekim talebi"
        ]
      },
      {
        id: 3,
        name: "CEO Üye",
        price: 1000,
        depth: 3,
        rate: 0.30,
        durationDays: 365,
        badge: "CEO",
        summary: "1, 2 ve 3. seviyeden %30 referans kazancı.",
        features: [
          "1 yıl premium film erişimi",
          "Reklamsız Film Platformu filmlerine erişim",
          "1. seviye referanslardan %30 kazanç",
          "2. seviye referanslardan %30 kazanç",
          "3. seviye referanslardan %30 kazanç",
          "CEO film ön onay paneli",
          "Siteye Film Ekleme Kazancı",
          "Cüzdan, destek ve çekim talebi"
        ]
      }
    ];
  }

  function normalizedPackages(serverPackages) {
    const base = desiredPackages();
    const incoming = Array.isArray(serverPackages) ? serverPackages : [];
    return base.map((pack) => {
      const fromServer = incoming.find((p) => Number(p.id) === pack.id || String(p.name || "").toLocaleLowerCase("tr-TR") === pack.name.toLocaleLowerCase("tr-TR"));
      return { ...pack, ...(fromServer || {}), ...pack };
    });
  }

  function ensurePatchStyles() {
    if (document.getElementById("ik-v20260518017-style")) return;
    const style = document.createElement("style");
    style.id = "ik-v20260518017-style";
    style.textContent = `
      .packageGrid.v20260518017{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;align-items:start}
      .package.v20260518017{padding:0;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(15,23,42,.72)}
      .packageHeaderBtn{width:100%;border-radius:0;background:transparent;color:var(--text,#fff);box-shadow:none;border:0;padding:22px;text-align:left;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .packageHeaderBtn:hover{transform:none;box-shadow:none;background:rgba(255,255,255,.04)}
      .packageHeaderMain{display:flex;flex-direction:column;gap:8px}
      .packageHeaderMain small{color:var(--muted,#a8b3c7);font-weight:700}
      .packageHeaderPrice{white-space:nowrap;color:var(--gold2,#ffd36a);font-size:20px;font-weight:900}
      .packageAccordionBody{padding:0 22px 22px;border-top:1px solid rgba(255,255,255,.08)}
      .packageAccordionBody.hidden{display:none!important}
      .packageAccordionBody ul{margin:14px 0 18px;padding-left:18px}
      .packageAccordionBody li{margin:6px 0;color:var(--muted,#a8b3c7)}
      .packageSummaryLine{margin:16px 0 8px;color:var(--text,#fff);font-weight:800}
      .packageMetaLine{color:var(--muted,#a8b3c7);font-size:13px;margin-bottom:10px}
      .leaderboardSection{margin-top:26px}
      .leaderboardGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:18px}
      .leaderboardCard{padding:18px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(15,23,42,.86),rgba(2,6,23,.68));border-radius:22px;box-shadow:0 18px 50px rgba(0,0,0,.26)}
      .leaderboardCard h3{margin:0 0 14px;font-size:16px;line-height:1.25}
      .leaderboardTable{width:100%;border-collapse:collapse;font-size:13px}
      .leaderboardTable th{color:var(--muted,#a8b3c7);font-size:11px;text-transform:uppercase;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);padding:0 0 8px}
      .leaderboardTable th:last-child,.leaderboardTable td:last-child{text-align:right}
      .leaderboardTable td{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}
      .leaderboardRank{width:32px;color:var(--gold2,#ffd36a);font-weight:900}
      .leaderboardEmpty{color:var(--muted,#a8b3c7);font-size:13px;margin:0}
      @media(max-width:1020px){.leaderboardGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.packageGrid.v20260518017{grid-template-columns:1fr}}
      @media(max-width:640px){.leaderboardGrid{grid-template-columns:1fr}.packageHeaderBtn{flex-direction:column}.packageHeaderPrice{font-size:18px}}
    `;
    document.head.appendChild(style);
  }

  window.togglePackageAccordion = function togglePackageAccordion(id) {
    document.querySelectorAll(".packageAccordionBody").forEach((body) => {
      if (body.id !== `packageDetail-${id}`) body.classList.add("hidden");
    });
    const body = document.getElementById(`packageDetail-${id}`);
    if (body) body.classList.toggle("hidden");
  };

  window.loadPackages = async function loadPackages() {
    let serverPacks = [];
    try { serverPacks = await api("/api/packages"); } catch (e) {}
    const packs = normalizedPackages(serverPacks);

    if (isLoggedIn()) {
      try {
        const d = await api("/api/me");
        me = d.user;
        refreshMenu();
      } catch (e) {}
    }

    const el = $("packageList");
    if (!el) return;
    ensurePatchStyles();
    el.classList.add("v20260518017");
    el.innerHTML = packs.map((x) => {
      const state = packageButtonState(x);
      const currentNote = state.className === "currentPackage" ? `<div class="packageNote">Mevcut paketiniz. Yenileme yaparsanız yeni süre mevcut bitiş tarihinden sonra başlar.</div>` : "";
      const disabledNote = state.disabled ? `<div class="packageNote muted">Bu paket mevcut paketinizden düşük olduğu için seçilemez.</div>` : "";
      return `
        <div class="package v20260518017 ${state.className}">
          <button class="packageHeaderBtn" type="button" onclick="togglePackageAccordion(${x.id})" aria-controls="packageDetail-${x.id}">
            <span class="packageHeaderMain">
              <span class="badge">${x.badge}</span>
              <strong>${x.name}</strong>
              <small>${x.summary}</small>
            </span>
            <span class="packageHeaderPrice">${money(x.price)}</span>
          </button>
          <div id="packageDetail-${x.id}" class="packageAccordionBody hidden">
            <div class="packageSummaryLine">${x.summary}</div>
            <div class="packageMetaLine">1 yıl / 365 gün geçerli • ${x.depth} seviye • %${Number(x.rate * 100).toFixed(0)} prim</div>
            <ul>${x.features.map((f) => `<li>${f}</li>`).join("")}</ul>
            ${currentNote}${disabledNote}
            <button ${state.disabled ? "disabled" : ""} onclick="choosePack(${x.id}, ${x.price})">${state.text}</button>
          </div>
        </div>`;
    }).join("");
  };

  window.choosePack = async function choosePack(id, price) {
    if (!isLoggedIn()) {
      const go = confirm("Paket satın almak için önce üye olmanız gerekmektedir.");
      if (go) page("auth");
      return;
    }

    const currentId = getCurrentPackageId();
    if (currentId && id < currentId) {
      toast("Mevcut paketinizden düşük paket seçemezsiniz.");
      return;
    }

    try { selectedPackageId = id; selectedPackagePrice = price; } catch (e) {}

    let serverPacks = [];
    try { serverPacks = await api("/api/packages"); } catch (e) {}
    const packs = normalizedPackages(serverPacks);
    const p = packs.find((x) => Number(x.id) === Number(id));
    const box = $("packageInfoBox");
    if (!box || !p) return;

    box.innerHTML = `
      <h2>${p.name}</h2>
      <p>${p.summary}</p>
      <p>Bu paket 1 yıl / 365 gün geçerlidir. Aynı aktif paketi yenilerseniz yeni süre mevcut bitiş tarihinizin sonrasına eklenir.</p>
      <ul>${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      <div class="actionRow">
        <button onclick="showPaymentGuide(${p.id}, ${p.price})">${getCurrentPackageId() === p.id ? "Paketi Yenile" : getCurrentPackageId() ? "Paketi Yükselt" : "Paketi Satın Al"}</button>
        <button class="ghost" onclick="page('packages')">Diğer Paketleri İncele</button>
      </div>`;
    page("packageInfo");
  };

  // Aramıza Katılanlar tablosunda "Davet Eden Telefon" sütununu kaldırır ve gizlilik formatını korur.
  window.publicMembers = async function publicMembers() {
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
            <thead>
              <tr>
                <th>Üye</th>
                <th>Telefon</th>
                <th>Paket</th>
                <th>Davet Eden</th>
                <th>Katılım Tarihi</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((m) => `
                <tr>
                  <td>${safeCell(m.maskedName)}</td>
                  <td>${safeCell(m.maskedPhone)}</td>
                  <td>${safeCell(m.packageName, "Paket Yok")}</td>
                  <td>${safeCell(m.inviterMaskedName, "Sistem")}</td>
                  <td>${m.createdAt ? new Date(m.createdAt).toLocaleString("tr-TR") : "-"}</td>
                </tr>
              `).join("") || `<tr><td colspan="5">Henüz üye kaydı yok</td></tr>`}
            </tbody>
          </table>
        </div>`;
    } catch (e) {
      box.innerHTML = `<div class="card">Üye kayıtları alınamadı: ${e.message}</div>`;
    }
  };

  window.handleVizyonClick = async function handleVizyonClick() {
    if (!isLoggedIn()) {
      alert("Üye olmalısınız");
      page("auth");
      return;
    }

    try {
      const m = await api("/api/movies");
      if (!m.length) {
        toast("Yayında film bulunmuyor");
        return;
      }
      const first = m[0];
      if (first.locked) {
        premiumRequiredForMovie();
        return;
      }
      openFilmModal(first.watchLink || first.embedLink || first.link || "");
    } catch (e) {
      toast(e.message || "Film açılamadı");
    }
  };

  const emptyBoardTitles = [
    "Haftalık Referans Liderleri",
    "Aylık Referans Liderleri",
    "Haftalık En Çok Kazananı",
    "Ayın En Çok Kazananı",
    "Geçen Haftanın Referans Lideri",
    "Geçen Ayın Referans Lideri",
    "Geçen Haftanın En Çok Kazananı",
    "Geçen Ayın En Çok Kazananı"
  ];

  function normalizeBoards(boards) {
    const incoming = Array.isArray(boards) ? boards : [];
    return emptyBoardTitles.map((title) => {
      const found = incoming.find((b) => String(b.title || "").toLocaleLowerCase("tr-TR") === title.toLocaleLowerCase("tr-TR"));
      return found || { title, rows: [] };
    });
  }

  function ensureHomeLeaderboards() {
    const home = $("home");
    if (!home) return null;
    let box = $("homeLeaderboards");
    if (box) return box;

    box = document.createElement("div");
    box.id = "homeLeaderboards";
    box.className = "leaderboardSection card";

    const teaser = home.querySelector(".databaseTeaser");
    if (teaser) home.insertBefore(box, teaser);
    else home.appendChild(box);
    return box;
  }

  function renderLeaderboards(boards) {
    const box = ensureHomeLeaderboards();
    if (!box) return;
    const normalized = normalizeBoards(boards);
    box.innerHTML = `
      <div class="sectionIntro compactIntro">
        <span>Canlı Liderlik</span>
        <h2>Liderlik Tabloları</h2>
        <p>Her kategoride ilk 5 kişi ve ilgili tutar listelenir. Kişisel bilgiler gizlilik kurallarına göre maskelenir.</p>
      </div>
      <div class="leaderboardGrid">
        ${normalized.map((board) => {
          const rows = Array.isArray(board.rows) ? board.rows.slice(0, 5) : [];
          return `<div class="leaderboardCard">
            <h3>${board.title}</h3>
            ${rows.length ? `<table class="leaderboardTable">
              <thead><tr><th>Sıra</th><th>Üye</th><th>Tutar</th></tr></thead>
              <tbody>
                ${rows.map((r, i) => `<tr>
                  <td class="leaderboardRank">${i + 1}</td>
                  <td>${safeCell(r.maskedName || r.name)}</td>
                  <td>${money(r.amount)}</td>
                </tr>`).join("")}
              </tbody>
            </table>` : `<p class="leaderboardEmpty">Henüz bu kategori için liderlik verisi oluşmadı.</p>`}
          </div>`;
        }).join("")}
      </div>`;
  }

  window.loadHomeLeaderboards = async function loadHomeLeaderboards() {
    ensurePatchStyles();
    const box = ensureHomeLeaderboards();
    if (!box) return;
    box.innerHTML = `<div class="sectionIntro compactIntro"><span>Canlı Liderlik</span><h2>Liderlik Tabloları</h2><p>Liderlik verileri yükleniyor...</p></div>`;
    try {
      const d = await api("/api/public/leaderboards");
      renderLeaderboards(d.boards || []);
    } catch (e) {
      renderLeaderboards([]);
    }
  };

  const originalPage = window.page;
  if (typeof originalPage === "function" && !originalPage.__ikPatchedV20260518017) {
    const patchedPage = function patchedPage(id) {
      const result = originalPage.apply(this, arguments);
      const targetId = id === "withdrawalsPublic" ? "database" : id;
      if (targetId === "home") setTimeout(loadHomeLeaderboards, 150);
      return result;
    };
    patchedPage.__ikPatchedV20260518017 = true;
    window.page = patchedPage;
  }

  function refreshVisibleVersion() {
    const meta = document.querySelector('meta[name="app-version"]');
    if (meta) meta.setAttribute("content", VERSION);
    document.querySelectorAll(".siteVersionFooter strong").forEach((el) => { el.textContent = VERSION; });
  }

  ensurePatchStyles();
  setTimeout(() => {
    refreshVisibleVersion();
    if ($("packageList")) loadPackages().catch(() => {});
    if ($("home") && $("home").classList.contains("active")) loadHomeLeaderboards();
  }, 250);
})();
