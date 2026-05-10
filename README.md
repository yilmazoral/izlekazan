# İzleKazan V2 Full

Render:
- Build Command: npm install
- Start Command: npm start

Admin:
- yilmazoral@hotmail.com
- 059221


## Önemli Veri Notu

Render ücretsiz planda uygulama içindeki `db.json` kalıcı değildir. Yeni deploy veya servis yeniden başlatma sonrasında üyeler/ödemeler sıfırlanabilir.

Kalıcı çözüm:
- Supabase PostgreSQL
- Neon PostgreSQL
- Render Persistent Disk

Bir sonraki sürümde veritabanı dış servise taşınmalıdır.


## V3 Kazanç Takip Güncellemesi

- Alt üyeler artık paket, premium başlangıç ve premium bitiş bilgisiyle görünür.
- Tüm kazançlar önce bekleyen bakiyeye eklenir.
- 15 gün sonra otomatik çekilebilir bakiyeye aktarılır.
- Bekleyen bakiye ve çekilebilir bakiye kartları tıklanınca işlem detayları listelenir.


## V4 Güncellemesi

- Referans kodu zorunlu hale getirildi.
- İlk kayıtlar için geçerli referans kodu: ADMIN
- Paket satın alma bilgilendirme akışı eklendi.
- Şifremi unuttum / şifre sıfırlama endpointleri eklendi.
- Gerçek e-posta gönderimi için Render Environment Variables:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, PUBLIC_URL
- SMTP ayarı yoksa sistem test bağlantısını ekranda gösterir.
- Film platformu iframe modal içinde açılır. Kaynak site iframe engellerse tarayıcı güvenliği nedeniyle dış sekme gerekebilir.
