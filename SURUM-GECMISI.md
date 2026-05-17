# İzleKazan Sürüm Geçmişi

## v2026.05.17-010 — 2026-05-17

**Özet:** Sürüm numarası karışıklığını kalıcı olarak düzeltmek için sürüm bilgisi tek merkezden okunacak hale getirildi.

### Yapılanlar
- `index.html` meta sürümü ve görünür footer etiketi `v2026.05.17-010` olarak güncellendi.
- CSS/JS cache sürümleri `v20260517010` olarak güncellendi.
- `server.js` içinde `/api/version` ve `/api/health` sürümü `VERSION.json` dosyasından okuyacak hale getirildi.
- `app.js` footer sürüm yazısını canlı `/api/version` sonucuyla otomatik senkronize eder.
- Önceki `v2026.05.17-009` zorunlu tam ekran film modu korunmuştur.

### Korunan kritik özellikler
- Profesyonel admin/kullanıcı paneli.
- Üye paneli akordeon yapısı.
- Referans davet linki ve otomatik referans kodu doldurma.
- Supabase kalıcı veritabanı.
- Gizli film gateway ve premium erişim kontrolü.
- Mükerrer ödeme engeli.
- Ad açık, soyad ilk harf gizli, telefon ilk 5 hane açık gizlilik formatı.


## v2026.05.17-007 — 2026-05-17

**Özet:** Premium film izleme ekranında kırpma kaldırıldı ve player tam ekran izinleri güçlendirildi.

### Yapılanlar
- Premium üyeler film izlerken dış sitenin üst kısmı artık gizlenmez; site tam görünür.
- Film sitesi adresi tarayıcı adres çubuğunda açık görünmeden `/api/film-gateway` üzerinden açılmaya devam eder.
- `iframe` için `allowfullscreen`, `webkitallowfullscreen`, `mozallowfullscreen` ve `fullscreen` izinleri eklendi/güçlendirildi.
- Eski cache veya eski class kalsa bile premium izleme ekranında crop davranışını kapatan CSS güvenlik kuralı eklendi.
- Footer sürüm etiketi ve `/api/version` varsayılanı `v2026.05.17-007` olarak güncellendi.

### Not
- Tarayıcının sol alt durum çubuğunda iframe içindeki dış sitenin kendi bağlantılarını göstermesi, tarayıcının güvenlik/arayüz davranışıdır. Bunu tamamen gizlemek için dış siteyi doğrudan iframe olarak değil, sunucu taraflı tam proxy ile yeniden yazmak gerekir; bu yöntem film/player çalışmasını bozabileceği için bu sürümde uygulanmamıştır.

### Korunan kritik özellikler
- Üye paneli akordeon yapısı korunmuştur.
- Referans davet linki otomatik doldurma sistemi korunmuştur.
- Supabase kalıcı veritabanı korunmuştur.
- Gizli film gateway ve premium erişim kontrolü korunmuştur.
- Mükerrer ödeme bildirimi/onayı engeli korunmuştur.
- Açık listelerde ad/soyad/telefon gizlilik formatı korunmuştur.

# SÜRÜM GEÇMİŞİ

## v2026.05.17-006 — 2026-05-17

**Özet:** Referans paylaşımı tam davet linkine çevrildi ve linkten gelen kullanıcıda referans kodunun otomatik dolması sağlandı.

### Yapılanlar
- Referans Sistemi bölümünde **Linki Kopyala** ve **Paylaş** butonları tam site davet linki üretir.
- Paylaşılan bağlantı `?ref=REFERANSKODU` formatındadır.
- Davet linkine tıklayan ziyaretçi otomatik olarak **Üye Ol** paneline yönlendirilir.
- Referans kodu üye ol formundaki referans alanına otomatik yazılır.
- Kullanıcı sitede gezinirse veya Üye Ol bölümünü tekrar açarsa referans alanı boşsa kod yeniden yazılır.
- Başarılı kayıt sonrası bekleyen referans kodu temizlenir.
- Footer sürümü, `VERSION.json` ve `/api/version` varsayılanı v2026.05.17-006 olarak güncellendi.

### Korunan kritik özellikler
- Profesyonel admin ve kullanıcı paneli tasarımı.
- Üye paneli akordeon sistemi.
- Supabase kalıcı veritabanı.
- Gizli film gateway ve premium kontrolü.
- Mükerrer ödeme bildirimi/onayı engeli.
- Açık veri tabanı gizlilik formatı.

# Sürüm Geçmişi

## v2026.05.17-005 — 2026-05-17

### Düzeltme
- Sitenin en altındaki görünür sürüm etiketi eski `v2026.05.17-003` değerinden `v2026.05.17-005` değerine güncellendi.
- Üye panelindeki akordeon davranışı korunmuştur.
- `/api/version`, `VERSION.json`, `SURUM-GECMISI.md` ve footer etiketi aynı sürüme senkronize edilmiştir.

### Korunan özellikler
- Profesyonel kullanıcı/admin paneli tasarımı.
- Üye paneli bölümlerinin kapalı başlayıp tıklayınca açılması.
- Supabase kalıcı veritabanı bağlantısı.
- Mükerrer ödeme onayı engeli.
- Premium kontrolü ve gizli film linki.
- Gizlilik formatı: isim görünür, soyisim ilk harf + yıldız, telefon ilk 5 hane.


## v2026.05.17-004 — 2026-05-17

**Özet:** Üye paneli bölümleri akordeon düzenine alındı.

### Yapılanlar
- Üye panelindeki işlem bölümleri tıklayınca aşağı doğru açılan akordeon kartlara çevrildi.
- Bildirimlerim, Alt Üyelerim, Üyelik Bilgilerim, Referans Sistemi, IBAN Ödeme Bildir, Çekim Talebi ve Destek Merkezi varsayılan olarak kapalı başlar.
- Kullanıcı hangi bölümle işlem yapacaksa sadece o bölümü açar.
- Bir bölüm açılınca diğer açık bölüm kapanır; panel daha temiz ve profesyonel görünür.
- Mobil uyumlu akordeon tasarım CSS’i eklendi.
- Cache sürümü `v20260517004`, görünür sürüm etiketi `v2026.05.17-004` yapıldı.

### Korunan kritik özellikler
- Profesyonel admin/kullanıcı panel tasarımı.
- Supabase kalıcı veritabanı.
- Gizli film gateway ve premium erişim kontrolü.
- Mükerrer ödeme bildirimi/onayı engeli.
- Açık listelerde ad/soyad/telefon gizlilik formatı.

# İzleKazan Sürüm Geçmişi

## v2026.05.17-003 — 2026-05-17

**Özet:** Canlı sitede görünür sürüm bilgisi eklendi ve cache sürümü güncellendi.

### Yapılanlar
- Sayfanın alt bölümüne görünür `İzleKazan v2026.05.17-003` sürüm etiketi eklendi.
- `VERSION.json` güncellendi.
- `/api/version` için varsayılan sunucu sürümü `v2026.05.17-003` olarak ayarlandı.
- `index.html` içindeki CSS/JS cache sürümleri `v20260517003` olarak güncellendi.

### Korunan kritik özellikler
- Profesyonel kullanıcı paneli ve admin paneli tasarımı korunmuştur.
- Supabase kalıcı veritabanı korunmuştur.
- Gizli film gateway ve premium erişim kontrolü korunmuştur.
- Mükerrer ödeme bildirimi/onayı engeli korunmuştur.
- Açık listelerde ad/soyad/telefon gizlilik formatı korunmuştur.

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

## v2026.05.17-008 — İzleKazan Tam Ekran Film Alanı

- Tam Ekran butonu premium üyelerde doğrudan film iframe alanını tam ekran yapacak şekilde güncellendi.
- Tam ekran modunda film alanı 100vw/100vh ölçüsünde ekranı komple kaplar.
- Üst kontrol barı tam ekran hedefinin dışında bırakıldı; film daha geniş görünür.
- Tam ekran API desteklemeyen mobil tarayıcılar için tam ekran görünüm fallback'i eklendi.
- Kapat/çıkış işlemlerinde tam ekran sınıfları temizlenerek sayfa kilitlenmesi engellendi.


## v2026.05.17-009 — Zorunlu ekranı kapla film modu

- Tam Ekran butonu requestFullscreen sonucuna bağlı kalmadan İzleKazan içinde film alanını viewport tamamına sabitler.
- Sağ üstte Normal Görünüm ve Kapat kontrolleri eklendi.
- Mobil ve PC’de gövde kaydırması kilitlenerek film alanının ekranı kaplaması güçlendirildi.
- Bu çözüm iframe içindeki yabancı player’ın kendi tam ekran butonunu garanti etmez; İzleKazan içi film alanını tam ekran benzeri kaplatır.
- Önceki premium kontrolü, gizli film linki, referans davet linki ve panel akordeon özellikleri korundu.
