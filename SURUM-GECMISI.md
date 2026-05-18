# Sürüm Geçmişi

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


## v2026.05.17-015 — 2026-05-18

**Özet:** Paket sistemi 3 pakete indirildi ve ana sayfaya haftalık/aylık liderlik tabloları eklendi.

### Yapılanlar
- Üyelik paketleri **Standart Üye**, **VIP Üye** ve **CEO Üye** olarak 3 pakete düşürüldü.
- Standart Üye: sadece 1. seviyeden %10 referans primi.
- VIP Üye: 1, 2 ve 3. seviyeden %20 referans primi.
- CEO Üye: 1, 2 ve 3. seviyeden %30 referans primi.
- Eski 4. ve 5. paketlerden gelen kullanıcılar veri kaybı olmadan CEO Üye paketine eşlenecek şekilde güvenli geçiş eklendi.
- Ana sayfaya herkese açık liderlik tabloları eklendi.
- Haftalık en çok üye getiren ilk 5 kişi listelenir; 1. 500 TL, 2. 250 TL, 3. 100 TL ödül alır.
- Aylık en çok üye getiren ilk 5 kişi listelenir; 1. 1000 TL, 2. 500 TL, 3. 250 TL ödül alır.
- Haftanın ve ayın en çok referans geliri kazananları listelenir; bu tablolara ödül verilmez.
- Geçen haftanın kazananları, geçen ayın kazananları ve geçen ayın en çok kazananları ayrı tabloda saklanır.
- Haftalık dönem pazartesi 00:01, aylık dönem ayın 1'i 00:01 esas alınarak yenilenir.

### Korunan kritik özellikler
- Supabase kalıcı veritabanı.
- Profesyonel panel tasarımları.
- Üye paneli ve paket akordeon sistemi.
- Referans davet linki.
- Mükerrer ödeme koruması.
- PWA mobil kullanım modu.
- Gizli film gateway.

# v2026.05.17-014 - Mobil Alt Boşluk Kesin Düzeltme

## Yapılanlar
- Mobilde eski `!important` padding kuralları daha güçlü yeni kurallarla ezildi.
- `body`, `main`, aktif sayfa ve footer boşlukları yeniden dengelendi.
- Veri tabanı, paketler, filmler ve kısa içerikli sayfalarda içerik bittikten sonra oluşan büyük boşluk azaltıldı.
- Alt sabit menünün içeriğin üstüne binmemesi için footer alt boşluğu kontrollü bırakıldı.
- Boş public tablo alanları mobilde görünmez hale getirildi.
- Sürüm etiketi, `VERSION.json`, `/api/version` ve cache sürümleri v2026.05.17-014 ile senkronlandı.

## Korunan Özellikler
- PWA zorunlu mobil kullanım modu korundu.
- Referans davet linki sistemi korundu.
- Paket akordeonları korundu.
- Film vitrini ve profesyonel metin değişiklikleri korundu.
- Supabase kalıcı veritabanı ve mükerrer ödeme engeli korundu.

# v2026.05.17-013 - Toplu Notlar / Paket Akordeon / Film Vitrini / Mobil Boşluk

- Referans paylaşımında linkin iki kez görünmesi düzeltildi.
- Mobil görünümde sayfa altındaki gereksiz boşluklar azaltıldı.
- Film Kataloğu bölümünde gereksiz Film Sitesini Aç butonu kaldırıldı.
- Film afişleri alanı En Çok İzlenen 10 Film yatay kaydırmalı vitrinine dönüştürüldü.
- Veri Tabanı gizlilik açıklaması profesyonel metinle değiştirildi.
- Paket yıllık/süre metinleri alt alta ve ortalı yapıldı.
- Standart Üye paketi için seçilen profesyonel açıklama eklendi.
- Paketler bölümü akordeon yapısına çevrildi.
- Kazanç garantisi metni yeni kurumsal uyarı metniyle değiştirildi.
- Render uyku ekranı için UPTIME-KURULUM.txt rehberi eklendi; bu ekran ücretsiz Render davranışı olduğu için site koduyla tamamen engellenemez.

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


## v2026.05.17-012 — PWA / Ana Ekran Adres Çubuğusuz Mod

- `manifest.json` ve `sw.js` eklendi.
- Site telefonda ana ekrana eklendiğinde uygulama gibi açılır ve adres çubuğu görünmez.
- Android/Chrome tarafında `Uygulama Olarak Kur` butonu ve kurulum bannerı eklendi.
- iPhone/Safari için `apple-mobile-web-app-*` meta etiketleri eklendi.
- Uygulama ikonları `assets/icon-192.png` ve `assets/icon-512.png` olarak eklendi.
- Önceki korumalı özellikler korunmuştur: Supabase, referans linki, üye paneli akordeon, premium kontrolü, gizli film linki, mükerrer ödeme engeli.

## v2026.05.17-016 — Paket fiyatları ve VIP komisyon düzeltmesi

- Paket fiyatları Standart Üye 100 TL, VIP Üye 500 TL, CEO Üye 1000 TL olarak güncellendi.
- VIP Üye artık yalnızca 1. ve 2. seviyeden %20 referans primi kazanır.
- VIP Üye için 3. seviye referans primi kaldırıldı.
- Standart Üye 1. seviyeden %10, CEO Üye 1, 2 ve 3. seviyeden %30 prim sistemi korunmuştur.
- Paket kartı rozetleri ve açıklama metinleri yeni sisteme göre güncellendi.
- Sürüm etiketi, VERSION.json, server fallback ve cache parametreleri v2026.05.17-016 olarak senkronlandı.
- Korunan özellikler: Supabase kalıcı veritabanı, PWA zorunlu kullanım modu, referans davet linki, liderlik tabloları, paket/üye paneli akordeonları, mükerrer ödeme koruması ve gizlilik maskelemesi.
