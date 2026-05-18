## v2026.05.18-019 — Referans Liderliği ve Paket Akordeon Düzeltmesi

Tarih: 2026-05-18

### Değişiklikler
- Referans liderlik tablolarında sıralama artık tutara göre değil, alt üye sayısına göre yapılır.
- Şu referans tablolarında `Tutar` sütunu kaldırıldı ve yerine `Alt Üye Sayısı` gösterilir:
  - Haftalık Referans Liderleri
  - Aylık Referans Liderleri
  - Geçen Haftanın Referans Lideri
  - Geçen Ayın Referans Lideri
- Kazanç liderliği tabloları değişmedi; tutara göre sıralanır ve `Tutar` gösterir.
- Paket kartları akordeon davranışıyla açılıp kapanacak şekilde korunup güçlendirildi.
- Akordeon içeriğinde paket genel bilgisi ve satın alma/yenileme/yükseltme butonu görünür.
- Paket fiyatı başlıkta kaldığı için akordeon içinde fiyat tekrarı yapılmaz.
- VIP Üye açıklamasında 3. seviye bilgisi veya olumsuz uyarı cümlesi gösterilmez.
- Cache sürümü `v20260518019` olarak güncellendi.
- Footer ve meta sürüm etiketi `v2026.05.18-019` olarak güncellendi.

### Korunanlar
- v2026.05.18-018 mobil liderlik tablo ve alt menü düzeltmeleri korunmuştur.
- VIP Üye sadece 1. ve 2. seviyeden %20 referans kazancı alır.
- 3. seviye kazanç bilgisi yalnızca CEO Üye paketindedir.
- Supabase kalıcı veritabanı ve mevcut gizlilik formatı korunmuştur.
