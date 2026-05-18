## v2026.05.18-018 — Mobil Liderlik Tablosu Düzeltmesi

Tarih: 2026-05-18

### Değişiklikler
- Mobil görünümde liderlik tablolarındaki `Tutar` sütununun görünmemesi düzeltildi.
- Liderlik tabloları mobilde `Sıra / Üye / Tutar` şeklinde sabit sütun yapısına alındı.
- `Tutar` sütunu sağa hizalandı ve dar ekranlarda görünür kalacak şekilde genişlikleri ayarlandı.
- Uzun üye adlarının tabloyu taşırması engellendi; mobilde üç nokta ile kısaltılır.
- Liderlik kartlarının mobil padding, genişlik ve taşma davranışları iyileştirildi.
- Alt mobil menünün ekranı kesmesi ve içerikle çakışması için güvenli alt boşluk eklendi.
- Sağdaki menü öğelerinin kesilmesini azaltmak için mobil alt menüye yatay kaydırma ve güvenli alan düzeltmesi eklendi.
- Cache sürümü `v20260518018` olarak güncellendi.
- Footer ve meta sürüm etiketi `v2026.05.18-018` olarak güncellendi.

### Korunanlar
- v2026.05.18-017 ile gelen 8 liderlik kategorisi korunmuştur.
- VIP Üye sadece 1. ve 2. seviyeden %20 kazanç alır; 3. seviye bilgisi VIP paketinde gösterilmez.
- 3. seviye kazanç bilgisi yalnızca CEO Üye paketindedir.
- Supabase kalıcı veritabanı ve mevcut gizlilik formatı korunmuştur.

