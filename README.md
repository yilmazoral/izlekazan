# İzleKazan - Kalıcı Veritabanı Sürümü

Bu paket, üyelerin, bakiyelerin, ödemelerin, çekim taleplerinin ve bildirimlerin Render yeniden başlasa bile silinmemesi için Supabase kalıcı veritabanı desteğiyle hazırlanmıştır.

## Önemli

Sadece dosyaları yüklemek tek başına yeterli değildir. Render Environment bölümüne Supabase değişkenleri eklenmelidir.

Kurulum için `KALICI-VERITABANI-KURULUM.txt` dosyasını takip edin.

## Dosyalar

- `index.html`
- `style.css`
- `app.js`
- `site-update.js`
- `server.js`
- `package.json`
- `supabase-setup.sql`
- `assets/`
- `.env.example`

## Kontrol

Kurulumdan sonra:

`https://izlekazan.onrender.com/api/health`

çıktısında `storage: "supabase"` görünmelidir.
