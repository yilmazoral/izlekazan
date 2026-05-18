## v2026.05.18-020 — Referans Liderliği 0 Alt Üye Düzeltmesi

Tarih: 2026-05-18

### Düzeltmeler
- Referans liderlik tablolarında `Alt Üye Sayısı` 0 olan satırların görünmesi engellendi.
- Eski backend/cache verisi yalnızca `amount` alanı döndürürse, bu veri referans liderliği satırı olarak gösterilmez.
- Referans liderliği tabloları yalnızca gerçek alt üye sayısı 1 ve üzeri olan kullanıcıları listeler.
- Referans liderliği sıralaması gerçek alt üye sayısına göre yüksekten düşüğe yapılır.
- Backend `/api/public/leaderboards` endpointi `sponsorId`, `sponsorUserId`, `referrerId`, `parentId`, `invitedBy`, `referredBy` alanlarını kontrol edecek şekilde güçlendirildi.
- Sponsor bilgisi referans kodu olarak tutulmuşsa `referralCode`, `refCode` veya `inviteCode` üzerinden kullanıcıya bağlanabilir.
- Frontend tarafında referans ve kazanç liderliği satırları ayrı ayrı temizlenir, filtrelenir ve güvenli şekilde sıralanır.

### Korunanlar
- Referans liderliği tablolarında `Tutar` gösterilmez; `Alt Üye Sayısı` gösterilir.
- Kazanç liderliği tablolarında `Tutar` gösterilmeye devam eder.
- Paket akordeon yapısı ve paket satın alma butonu korunmuştur.
- VIP Üye içinde 3. seviye bilgisi veya olumsuz uyarı cümlesi gösterilmez.
- v2026.05.18-018 mobil tablo/alt menü düzeltmeleri korunmuştur.
- Supabase kalıcı veritabanı ve mevcut gizlilik formatı korunmuştur.
- Cache sürümü `v20260518020` olarak güncellendi.
- Footer ve meta sürüm etiketi `v2026.05.18-020` olarak güncellendi.
