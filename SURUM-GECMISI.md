# İzleKazan Sürüm Geçmişi

## v2026.05.17-002 — 2026-05-17

**Özet:** Admin ve kullanıcı paneli profesyonel dashboard tasarımı yeniden sabitlendi.

### Yapılanlar
- Eksik kalan profesyonel panel CSS blokları geri yüklendi.
- Kullanıcı panelindeki Üye Kontrol Merkezi, bakiye kartları, bildirimler, üyelik bilgileri, referans, ödeme, çekim ve destek alanları yeniden profesyonel kart düzenine alındı.
- Admin panelindeki Operasyon Merkezi, KPI kutuları, ödeme bildirimleri, film onayları, çekim talepleri, destek mesajları, ödeme arşivi ve kullanıcı tablosu profesyonel dashboard düzenine alındı.
- Mobilde admin ve kullanıcı paneli tek sütun, okunabilir ve butonları erişilebilir hale getirildi.
- Cache sürümü `v20260517002` olarak güncellendi.

### Korunan kritik özellikler
- Supabase kalıcı veritabanı.
- Gizli film gateway ve premium erişim kontrolü.
- Mükerrer ödeme bildirimi/onayı engeli.
- Açık listelerde ad/soyad/telefon gizlilik formatı.

## v2026.05.17-001 — 2026-05-17

**Özet:** Sürüm takip sistemi başlangıcı ve mevcut kararlı sürümün kayıt altına alınması

### Yapılanlar
- Her güncelleme için zorunlu sürüm numarası sistemi eklendi.
- Site içine VERSION.json ve SURUM-GECMISI.md dosyaları eklendi.
- Sunucuya /api/version kontrol endpoint’i eklendi.
- Kaybolan değişiklikleri takip etmek için dosya manifesti ve değişiklik notları eklendi.
- Mevcut son durum baz alındı: Supabase kalıcı veritabanı, premium film erişim kontrolü, gizli film gateway, mükerrer ödeme engeli, gizlilik formatı ve profesyonel arayüz korunur.

### Bu sürümde korunması gereken kritik özellikler
- Supabase kalıcı veritabanı bağlantısı: `/api/health` sonucunda `"storage":"supabase"` görünmeli.
- Film linki kaynak kodda açık görünmemeli; gerçek adres sunucu tarafında kalmalı.
- Premium olmayan kullanıcı gerçek film izleme sitesine tam erişememeli.
- Mükerrer ödeme bildirimi ve mükerrer admin onayı referans kazancını ikinci kez yazmamalı.
- Açık listelerde ad açık, soyad ilk harf + `****`, telefon ilk 5 hane + `******` formatında görünmeli.

### Güncelleme kuralı
Bundan sonraki her değişiklikte önce bu dosya okunacak, sonra yeni sürüm şu biçimde eklenecek:

`vYYYY.MM.DD-XXX`

Örnek:

`v2026.05.17-002`

Her sürümde şu bilgiler yazılacak:
1. Hangi dosyalar değişti.
2. Hangi özellik eklendi/düzeltildi.
3. Önceki sürümden korunması gereken özellikler.
4. Geri dönüş gerekirse hangi ZIP/dosya kullanılacak.
