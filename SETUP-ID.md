# DEAD PIXELS — Setup Google Whitelist

Website dan aturan database sudah siap. Sistem ini **tidak memakai connect wallet**.

## Aturan yang sudah dipaksa di database
- 1 akun Google = 1 aplikasi whitelist
- 1 wallet = 1 aplikasi whitelist
- akun Google yang sama tidak bisa submit wallet kedua
- wallet yang sudah dipakai akun lain tidak bisa dipakai lagi
- maksimum 10.000 aplikasi
- alamat wallet harus EVM `0x...` sepanjang 42 karakter
- user hanya bisa melihat aplikasi miliknya sendiri
- user tidak punya akses langsung untuk insert/update/delete tabel
- provider login harus Google, dicek lagi di database

## Yang perlu disambungkan agar LIVE
1. Supabase project.
2. Jalankan `supabase/setup.sql` di SQL Editor.
3. Aktifkan Google Provider di Supabase Auth.
4. Buat OAuth Client Web di Google Cloud, lalu masukkan Client ID + Client Secret ke Google Provider Supabase.
5. Masukkan Supabase Project URL + anon/public key ke `config.js`.
6. Tambahkan domain Vercel sebagai Site URL / Redirect URL Supabase.
7. Deploy folder ini ke Vercel.

**Jangan pernah memasukkan Supabase service-role key ke website.** Yang dipakai di `config.js` hanya anon/public key.

## Setelah aplikasi masuk
Admin bisa membuka tabel `whitelist_applications` di Supabase Dashboard.
Kolom penting:
- `application_no`
- `email`
- `wallet_address`
- `status`
- `created_at`

Ubah `status` menjadi `accepted` atau `rejected`, lalu export CSV dari dashboard bila diperlukan.
