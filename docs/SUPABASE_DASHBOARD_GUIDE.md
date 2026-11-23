# Panduan Konfigurasi Supabase Dashboard — Trading Journal

Panduan ini memandu Anda menghubungkan aplikasi **Trading Journal WebAPK** dengan project backend **Supabase**. Seluruh alur autentikasi, manajemen profil, dan isolasi data multi-pengguna (Row Level Security / RLS) ditangani di Supabase.

---

## 1. Membuat Proyek Supabase Baru

1. Buka [database.new](https://database.new) atau kunjungi [Supabase Dashboard](https://supabase.com/dashboard).
2. Klik **New project**.
3. Isi detail proyek:
   - **Name**: `trading-journal` (atau sesuai preferensi Anda).
   - **Database Password**: Buat password yang kuat dan simpan di tempat aman.
   - **Region**: Pilih wilayah terdekat (misal: `Singapore (ap-southeast-1)` untuk Indonesia).
   - **Pricing Plan**: Free tier sudah mencukupi untuk MVP dan penggunaan pribadi.
4. Klik **Create new project** dan tunggu proses inisialisasi selesai (sekitar 1-2 menit).

---

## 2. Mengambil Environment Variables (Kredensial API)

> [!CAUTION]
> **JANGAN PERNAH** memasukkan `service_role key` atau secret key (`sb_secret_...`) ke dalam aplikasi frontend atau file `.env.local`. Kunci tersebut memiliki hak istimewa melewati Row Level Security (RLS). Aplikasi frontend **hanya boleh** menggunakan `anon key` (kunci publik).

1. Di dashboard Supabase, buka menu **Project Settings** (ikon gerigi di bilah kiri bawah) > **API**.
2. Salin nilai berikut:
   - **Project URL** (contoh: `https://abcdefghijklmnop.supabase.co`)
   - **Project API keys** > Cari baris **anon** / **public** (kunci JWT panjang atau format baru `sb_publishable_...`).
3. Buka file `.env.local` di folder root proyek Anda dan masukkan nilainya:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

4. Simpan file `.env.local`. Aplikasi akan membaca kredensial ini secara otomatis saat diakses.

---

## 3. Menjalankan Database Migrations (Skema & RLS)

Aplikasi telah menyertakan 5 berkas migrasi SQL berurutan di dalam folder `supabase/migrations/`:

| No | Berkas Migrasi | Fungsi Utama |
|---|---|---|
| 1 | `20261123010000_core_schema.sql` | Tabel `profiles`, `trading_accounts`, `strategies`, `cash_transactions`, `trades`, enum tipe, dan trigger profil otomatis. |
| 2 | `20261123010100_rls_and_grants.sql` | Mengaktifkan RLS di semua tabel, mencabut hak `anon`, memberikan akses hanya ke `authenticated`. |
| 3 | `20261123010200_analytics_functions.sql` | Fungsi SQL analitik: ringkasan akun, saldo, equity curve, performa simbol & bulanan. |
| 4 | `20261123010300_integrity_rules.sql` | Trigger integritas bisnis (IR-01 s.d. IR-06): guard saldo withdraw, pembatasan mata uang, dll. |
| 5 | `20261123010400_auth_profiles_enhancement.sql` | Kolom `avatar_url` dan penangkapan otomatis metadata Google OAuth / Full Name saat sign up. |

### Cara Menjalankan di SQL Editor:

1. Di Supabase Dashboard, klik menu **SQL Editor** di bilah navigasi kiri.
2. Klik **New query**.
3. Buka berkas migrasi **secara berurutan (1 sampai 5)** dari folder `supabase/migrations/`:
   - Salin seluruh isi berkas **No. 1**, tempel ke SQL Editor, lalu klik tombol **Run** (Ctrl+Enter / Cmd+Enter). Pastikan muncul pesan `Success. No rows returned`.
   - Lakukan hal yang sama berturut-turut untuk **No. 2**, **No. 3**, **No. 4**, dan **No. 5**.
4. Setelah kelimanya dijalankan, buka menu **Table Editor** untuk memastikan tabel `profiles`, `trading_accounts`, `strategies`, `cash_transactions`, dan `trades` telah terbentuk dengan label **RLS enabled** (ikon gembok aktif).

---

## 4. Konfigurasi Autentikasi (Authentication Settings)

### A. URL Configuration (Redirect & Callback)
Agar redirect verifikasi email, reset password, dan Google OAuth kembali ke aplikasi lokal Anda dengan aman:

1. Buka menu **Authentication** > **URL Configuration**.
2. Atur kolom **Site URL**:
   ```
   http://localhost:5173
   ```
3. Di bagian **Redirect URLs**, klik **Add URL** dan tambahkan URL berikut:
   ```
   http://localhost:5173/**
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/reset-password
   ```
   *(Saat aplikasi dideploy ke domain produksi nanti, tambahkan juga domain produksi Anda di sini).*
4. Klik **Save**.

### B. Konfigurasi Email Provider
1. Buka menu **Authentication** > **Providers** > klik **Email**.
2. Pastikan **Enable Email provider** dalam kondisi **ON**.
3. **Confirm email**:
   - Jika Anda ingin mewajibkan pengguna mengklik tautan email sebelum bisa login, aktifkan opsi ini (**ON**).
   - Jika Anda ingin pengguna bisa langsung login seketika setelah register (mode cepat pengujian lokal), Anda dapat menonaktifkannya sementara (**OFF**).
4. Klik **Save**.

### C. Keamanan Pengguna Anonim
1. Buka menu **Authentication** > **Providers** > cari **Anonymous Sign-ins**.
2. Pastikan **Allow anonymous sign-ins** dalam kondisi **OFF** (mati). Hal ini memastikan hanya pengguna terverifikasi yang dapat mengakses tabel ber-RLS.

---

## 5. Verifikasi Isolasi Data (Row Level Security / RLS)

Sistem telah dilengkapi aturan RLS berlapis:
- Role `anon` dicabut dari semua hak `SELECT`, `INSERT`, `UPDATE`, `DELETE` pada tabel aplikasi.
- Role `authenticated` hanya diizinkan membaca dan memodifikasi baris miliknya sendiri (`user_id = auth.uid()`).
- Kolom generated (`net_pnl`, `result`) tidak dapat dimanipulasi oleh klien.

### Cara Menguji Isolasi Data:
1. Daftarkan **Akun A** (`userA@test.com`) melalui menu `/auth/register`.
2. Buka jendela browser **Incognito** (Samaran), lalu daftarkan **Akun B** (`userB@test.com`).
3. Pada masing-masing akun, buat data (misal: ubah nama profil di Pengaturan).
4. Amati bahwa **Akun A tidak akan pernah bisa melihat atau mengubah profil maupun data milik Akun B**.
