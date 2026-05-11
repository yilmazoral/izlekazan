# İzleKazan - Supabase Kalıcı Veritabanı Sürümü

Bu sürümde üyeler, ödemeler, çekim talepleri, bildirimler, filmler, destek kayıtları ve şifre sıfırlama verileri Supabase üzerinde kalıcı şekilde saklanır. Render yeniden başlasa veya yeniden deploy yapılsa bile üyeler silinmez.

## 1. Supabase kurulumu

1. Supabase hesabınızda yeni proje oluşturun.
2. `supabase-setup.sql` dosyasındaki kodu Supabase > SQL Editor bölümünde çalıştırın.
3. Project Settings > API bölümünden `Project URL` ve backend için `service_role` / secret key değerini alın.

## 2. Render Environment ayarları

Render panelinde İzleKazan servisiniz için şu değişkenleri ekleyin:

```env
SUPABASE_URL=https://PROJE_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY_BURAYA
JWT_SECRET=çok_uzun_gizli_bir_yazi
ADMIN_EMAIL=yilmazoral@hotmail.com
ADMIN_PASS=059221
PUBLIC_URL=https://izlekazan.onrender.com
```

Önemli: `SUPABASE_SERVICE_ROLE_KEY` kesinlikle frontend dosyalarına yazılmamalıdır. Sadece Render Environment bölümünde kalmalıdır.

## 3. Çalıştırma

```bash
npm install
npm start
```

## 4. İlk giriş bilgileri

Varsayılan admin bilgisi:

- E-posta: `yilmazoral@hotmail.com`
- Şifre: `059221`
- İlk referans kodu: `ADMIN`

Admin şifresini sonradan panelden değiştirmeniz önerilir.

## 5. Sağlık kontrolü

Kurulumdan sonra şu adrese girerek veri kaynağını kontrol edebilirsiniz:

```text
/api/health
```

`storage: "supabase"` görünüyorsa kalıcı veritabanı bağlantısı aktif demektir.

## 6. Yapılan ana değişiklikler

- Render'da silinen `db.json` bağımlılığı yerine Supabase destekli kalıcı veri katmanı eklendi.
- Supabase bağlantısı yoksa sistem geçici olarak `db.json` ile çalışmaya devam eder.
- Admin bilgileri ve JWT anahtarı Environment Variable üzerinden yönetilebilir hale getirildi.
- Site görünümü modern kartlar, daha güçlü kontrast, mobil uyumlu düzen ve profesyonel panel tasarımıyla yenilendi.
- Üye olurken referans kodu alanı zorunlu olacak şekilde netleştirildi.
