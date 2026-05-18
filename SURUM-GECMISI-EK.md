## v2026.05.18-017 — 2026-05-18

**Özet:** Ana sayfa liderlik tabloları görünür hale getirildi, VIP paket seviye hatası düzeltildi ve paket akordeon detaylarındaki tutar tekrarı kaldırıldı.

### Yapılanlar
- Ana sayfada 8 liderlik kategorisi oluşturuldu:
  1. Haftalık Referans Liderleri
  2. Aylık Referans Liderleri
  3. Haftalık En Çok Kazananı
  4. Ayın En Çok Kazananı
  5. Geçen Haftanın Referans Lideri
  6. Geçen Ayın Referans Lideri
  7. Geçen Haftanın En Çok Kazananı
  8. Geçen Ayın En Çok Kazananı
- Her kategoride ilk 5 kişi ve tutar gösterilecek yapı kuruldu.
- Veri yokken liderlik kartları gizlenmez; "Henüz bu kategori için liderlik verisi oluşmadı." mesajı gösterilir.
- VIP Üye paketi yalnızca 1. ve 2. seviyeden %20 kazanç verecek şekilde düzeltildi.
- 3. seviye bilgisi sadece CEO Üye paketinde bırakıldı.
- Paket akordeon başlığında fiyat kalır; açılan detay bölümünde paket tutarı tekrar yazmaz.
- `VERSION.json`, footer sürüm etiketi ve cache parametreleri `v20260518017` olarak güncellendi.

### Korunan kritik özellikler
- Supabase kalıcı veritabanı.
- Gizli film gateway ve premium erişim kontrolü.
- Mükerrer ödeme bildirimi/onayı engeli.
- Açık listelerde gizlilik formatı.
- Admin panelinde tam bilgi görünümü.

