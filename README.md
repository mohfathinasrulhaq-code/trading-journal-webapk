# Trading Journal WebAPK

Jurnal trading berbasis PWA: React + TypeScript + Vite, Tailwind CSS, Supabase, Recharts, Vite PWA.
Dokumen perencanaan: `docs/PHASE_00_PROJECT_PLAN.md`. Status proyek: `PROJECT_STATUS.md`.

**Status saat ini: Phase 02 (Database dan RLS) ditulis; Phase 01 (Foundation) menunggu konfirmasi build.** Belum ada autentikasi maupun fitur transaksi di UI. Aplikasi belum memanggil database.

## Prasyarat

- Node.js >= 20.19 (disarankan 22; lihat `.nvmrc`)
- npm >= 10
- Project Supabase (gratis cukup). Anda hanya membutuhkan **Project URL** dan **anon/publishable key**.

## Instalasi

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
```

Isi `.env.local` dengan nilai dari Supabase Dashboard > Project Settings > API:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key atau sb_publishable_...>
```

Jangan pernah memakai `service_role` atau `sb_secret_...`; aplikasi akan menolaknya.

## Menjalankan

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan di http://localhost:5173 |
| `npm run build` | Cek tipe (`tsc -b`) lalu build produksi ke `dist/` |
| `npm run preview` | Menjalankan hasil build di http://localhost:4173 |
| `npm run lint` | ESLint |
| `npm test` | Vitest (tes env dan tema) |

Setelah mengubah `.env.local`, hentikan lalu jalankan ulang `npm run dev`.

## Langkah Pengujian

1. `npm test` — semua tes lulus (16 tes).
2. `npm run lint` — tanpa error.
3. `npm run build` — selesai tanpa error TypeScript; folder `dist/` terbentuk.
4. `npm run dev`, buka http://localhost:5173:
   - Dashboard tampil. Klik Trades, Kas, Akun, Pengaturan: URL berubah tanpa reload.
   - Buka http://localhost:5173/abc: tampil "Halaman tidak ditemukan".
   - Lebar < 768 px: navigasi di bawah. Lebar >= 768 px: sidebar di kiri.
   - Pengaturan > Tema: pilih Gelap, refresh halaman; tema tetap gelap tanpa berkedip. Pilih Sistem lalu ubah tema OS; tampilan mengikuti.
   - Pengaturan > Tes koneksi: muncul "Server Supabase dapat dijangkau (... ms)".
5. Hapus nilai di `.env.local`, restart: tampil layar "Konfigurasi belum lengkap" berisi daftar masalah.

## Potensi Error

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Unsupported engine` / Vite gagal start | Node terlalu lama | Pakai Node >= 20.19 (`nvm use`) |
| Layar "Konfigurasi belum lengkap" | `.env.local` kosong, salah, atau masih nilai contoh | Isi sesuai `.env.example`, restart `npm run dev` |
| Tes koneksi: HTTP 401/403 | Key salah atau dari project lain | Salin ulang key dari Project Settings > API |
| Tes koneksi: tidak dapat dijangkau | Internet atau URL project salah | Periksa URL (`https://<ref>.supabase.co`) |
| Tailwind class tidak berefek | Plugin tidak aktif | Pastikan `@tailwindcss/vite` ada di `vite.config.ts` dan `src/styles/index.css` diimpor di `main.tsx` |
| Error `Cannot find module '@/...'` di editor | TS server belum memuat tsconfig | Restart TS server (VS Code: "TypeScript: Restart TS Server") |
| Refresh di `/trades` 404 pada hosting statis | SPA fallback belum diatur | Atur rewrite semua rute ke `index.html` (dibahas di Phase 10) |

## Struktur

```
src/
├─ app/          router, providers, ConfigGate, navigasi
├─ components/   ui/ (Card, Button, ikon, ...) dan layout/ (AppShell, Sidebar, BottomNav, TopBar)
├─ features/     dashboard, trades, cash, accounts, settings (tiap fitur satu folder)
├─ lib/          env (validasi), supabase (klien), cn, constants
├─ theme/        ThemeProvider, tombol dan pilihan tema
└─ styles/       index.css (Tailwind + token warna)
```

## Database (Phase 02)

Skema, RLS, fungsi analitik, dan tes SQL ada di `supabase/`. Penjelasan lengkap, cara menjalankan, dan cakupan tes: **`docs/DATABASE.md`**.

```bash
npx supabase init     # sekali saja (butuh Docker Desktop)
npm run db:start      # Supabase lokal + terapkan migrasi
npm run db:test       # tes pgTAP: RLS, rumus Lampiran A, integritas
npm run db:types      # hasilkan src/types/database.ts
```

Terapkan ke project Supabase (`npx supabase link` lalu `npx supabase db push`) hanya setelah `npm run db:test` lulus di lokal.
