// İzleKazan güncelleme yamaları
// Bu dosya app.js yüklendikten sonra çalışır ve mevcut sistemi bozmadan küçük davranış düzeltmeleri yapar.

(function () {
  function safeCell(value, fallback = "-") {
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  // Aramıza Katılanlar tablosunda "Davet Eden Telefon" sütununu kaldırır.
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

  // Üye olmayan kullanıcı film görseline tıklarsa net uyarı verir.
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
})();
