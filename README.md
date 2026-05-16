# İzleKazan

Bu paket İzleKazan sitesinin güncel dosyalarını içerir.

## Dosyalar

- `index.html`: Ana sayfa ve tüm ekranların HTML yapısı
- `style.css`: Profesyonel yeni tasarım
- `app.js`: Frontend işlem kodları
- `site-update.js`: Son istenen küçük yamalar
- `server.js`: Node.js / Express backend
- `assets/`: Görseller
- `supabase-setup.sql`: Supabase kalıcı veri tabanı kurulumu
- `package.json`: Render / Node.js bağımlılıkları

## Render ortam değişkenleri

Render > Environment bölümüne şunları ekleyin:

```env
SUPABASE_URL=https://PROJE_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY_BURAYA
JWT_SECRET=çok_uzun_gizli_bir_yazi
ADMIN_EMAIL=yilmazoral@hotmail.com
ADMIN_PASS=059221
PUBLIC_URL=https://izlekazan.onrender.com
```

`SUPABASE_SERVICE_ROLE_KEY` kesinlikle frontend dosyalarına yazılmamalıdır.

## Çalıştırma

```bash
npm install
npm start
```

## Admin

Varsayılan admin e-postası ve şifresi Render Environment üzerinden yönetilir. Yayına aldıktan sonra admin şifresini değiştirmeniz önerilir.
