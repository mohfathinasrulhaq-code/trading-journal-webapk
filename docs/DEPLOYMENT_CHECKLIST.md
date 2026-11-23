# Checklist Deployment & Konfigurasi Produksi — Trading Journal WebAPK

Dokumen ini adalah panduan resmi kesiapan produksi (*Production Readiness*) untuk memastikan aplikasi **Trading Journal WebAPK** memenuhi seluruh standar performa, keandalan PWA, keamanan data (RLS), dan kelancaran operasi di lingkungan produksi.

---

## 1. Ringkasan Kesiapan Produksi (Production Readiness)

| Komponen | Status | Verifikasi |
|---|---|---|
| **PWA Manifest** | ✅ Siap | Memenuhi spesifikasi W3C Web App Manifest (standalone, theme-color, multi-size & maskable icons, orientasi any). |
| **Service Worker & App Shell** | ✅ Siap | Cache otomatis untuk asset statis (HTML, JS, CSS, fonts, SVG) via Workbox. Mendukung navigasi offline. |
| **Pemisahan Cache Sensitif** | ✅ Teruji | **API Supabase (`/rest/v1/*`, `/auth/v1/*`) TIDAK PERNAH disimpan di CacheStorage publik.** |
| **Offline Sync & Perlindungan Transaksi** | ✅ Teruji | Antrean offline (`offlineSyncQueue`) menyimpan mutasi saat internet terputus dan otomatis sinkron saat online. |
| **Installable Desktop & Android** | ✅ Siap | Banner dan hook `usePwaInstall` menangkap `beforeinstallprompt` untuk instalasi 1-klik di Windows/Mac/Linux & Android APK/WebAPK. |
| **Penanganan Error Global** | ✅ Siap | `ErrorBoundary` global mencegah blank-screen pada error JavaScript tak terduga. |
| **Keamanan RLS & Isolasi Data** | ✅ Teruji | Kebijakan Row Level Security aktif di seluruh tabel; role `anon` dicabut; kunci `service_role` ditolak keras di frontend. |

---

## 2. Checklist Sebelum Deployment (Pre-Flight Checklist)

Pastikan semua butir berikut telah dicek sebelum menaikkan build ke server publik:

- [x] **1. Validasi Tipe & Build Bersih**:
  ```bash
  npm run typecheck    # 0 error TypeScript
  npm run lint         # 0 peringatan / error ESLint
  npm test             # Semua unit test lulus (34/34 tes)
  npm run build        # Folder dist/ berhasil dibentuk tanpa error
  ```

- [x] **2. Pemeriksaan Variabel Lingkungan**:
  - `VITE_SUPABASE_URL`: Diisi URL project Supabase resmi (`https://<project-ref>.supabase.co`).
  - `VITE_SUPABASE_ANON_KEY`: Hanya menggunakan **anon / publishable key**. Jangan pernah gunakan `service_role`.

- [ ] **3. Eksekusi 5 Berkas Migrasi Database di Supabase**:
  Jalankan di SQL Editor Supabase secara berurutan:
  1. `20261123010000_core_schema.sql`
  2. `20261123010100_rls_and_grants.sql`
  3. `20261123010200_analytics_functions.sql`
  4. `20261123010300_integrity_rules.sql`
  5. `20261123010400_auth_profiles_enhancement.sql`

- [ ] **4. Konfigurasi Auth di Supabase Dashboard**:
  - **Site URL**: Ubah dari `http://localhost:5173` menjadi domain produksi Anda (misal: `https://tradingjournal.com`).
  - **Redirect URLs**: Tambahkan `https://domain-anda.com/**`, `https://domain-anda.com/auth/callback`, `https://domain-anda.com/auth/reset-password`.
  - **Email Confirmations**: Pastikan status konfirmasi email sesuai preferensi Anda.

- [ ] **5. Pengaturan Google OAuth (Opsional jika mengaktifkan Google Login)**:
  - Di Google Cloud Console, tambahkan domain produksi pada **Authorized JavaScript Origins**.
  - Authorized Redirect URI tetap mengarah ke Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`.

---

## 3. Opsi Platform Deployment

Aplikasi ini adalah **SPA murni (Single Page Application)** statis. Dapat di-host di penyedia hosting modern mana pun dengan gratis atau biaya minimal:

### Opsi A: Vercel (Disarankan)
1. Hubungkan repositori Git Anda ke [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Masukkan Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
6. Buat berkas `vercel.json` di root proyek untuk rewrite SPA (sudah disertakan di bawah).

### Opsi B: Cloudflare Pages
1. Hubungkan repositori ke Cloudflare Pages.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Tambahkan Environment Variables di dashboard Pages.

### Opsi C: Netlify
1. Hubungkan repo ke Netlify.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Tambahkan redirect SPA di `_redirects` (`/* /index.html 200`).

---

## 4. Konfigurasi Rewrite SPA & Header Keamanan

### `vercel.json` (Untuk Vercel)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

### `public/_redirects` (Untuk Netlify / Cloudflare Pages)
```
/*    /index.html   200
```

---

## 5. Prosedur Audit & Monitoring Pasca-Deploy

1. **Tes Lighthouse / Audit PWA**:
   - Buka DevTools di Chrome > tab **Lighthouse** > pilih kategori **Progressive Web App** & **Performance**.
   - Pastikan tanda centang hijau untuk "Installable" dan "PWA Optimized".
2. **Uji Offline Shell**:
   - Buka DevTools > tab **Network** > pilih **Offline**.
   - Muat ulang halaman; pastikan antarmuka aplikasi tetap muncul dan banner mode offline aktif.
3. **Uji Isolasi Pengguna**:
   - Pastikan pengguna baru yang mendaftar tidak dapat melihat baris trade, akun, atau profil pengguna lain.
