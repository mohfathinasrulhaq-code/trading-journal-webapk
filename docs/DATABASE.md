# Database — Phase 02 (PostgreSQL + Supabase)

Dokumen ini menjelaskan skema yang diimplementasikan di `supabase/migrations/`, aturan integritas, fungsi analitik, cara menjalankan, dan cara menguji.
Rumus mengacu pada Lampiran A di `docs/PHASE_00_PROJECT_PLAN.md`.

## 1. Berkas

| Berkas | Isi |
|---|---|
| `supabase/migrations/20261123010000_core_schema.sql` | Enum, tabel, constraint, index, trigger `updated_at`, pembuatan profil otomatis |
| `supabase/migrations/20261123010100_rls_and_grants.sql` | RLS, policy, pencabutan hak `anon`, hak `authenticated` |
| `supabase/migrations/20261123010200_analytics_functions.sql` | Fungsi saldo, ringkasan, equity curve/drawdown, kurva saldo, per bulan, per simbol |
| `supabase/migrations/20261123010300_integrity_rules.sql` | Trigger aturan integritas IR-01 s.d. IR-06 |
| `supabase/tests/database/01_rls.test.sql` | Tes isolasi pengguna, hak akses, kolom generated |
| `supabase/tests/database/02_formulas.test.sql` | Tes rumus Lampiran A, kasus tepi, pemisahan kas dan trading |
| `supabase/tests/database/03_integrity.test.sql` | Tes constraint, trigger, perilaku hapus |

## 2. Model Data

| Tabel | Isi | Catatan |
|---|---|---|
| `profiles` | 1:1 dengan `auth.users` | Dibuat otomatis oleh trigger; klien hanya boleh mengubah `display_name` dan `timezone` |
| `trading_accounts` | Akun trading | Satu mata uang per akun (kode 3 huruf kapital) |
| `strategies` | Strategi buatan pengguna | Nama unik per pengguna |
| `cash_transactions` | **Hanya** deposit dan withdraw | `amount` selalu > 0, arah ditentukan `type` |
| `trades` | **Hanya** transaksi trading | `net_pnl` dan `result` adalah kolom generated |

Tidak ada relasi antara `cash_transactions` dan `trades` (BR-01). Modal awal adalah deposit pertama (BR-02).

Integritas lintas pengguna dijaga dua lapis: RLS (`user_id = auth.uid()`) dan composite FK `(account_id, user_id)` / `(strategy_id, user_id)` sehingga baris tidak dapat menunjuk akun atau strategi milik pengguna lain, meski RLS salah dikonfigurasi.

### Kolom generated pada `trades`

```
net_pnl = gross_pnl - commission - fee + swap          (F-01)
result  = win | loss | breakeven dari tanda net_pnl    (F-02), NULL jika trade open
```

`commission` dan `fee` adalah biaya (>= 0). `swap` bertanda (negatif = biaya). Klien tidak dapat menulis kedua kolom ini (SQLSTATE 428C9).

## 3. Aturan Integritas

| ID | Aturan | Penegakan | SQLSTATE |
|---|---|---|---|
| — | Trade open: `closed_at`, `exit_price`, `gross_pnl` kosong. Trade closed: ketiganya wajib, `closed_at >= opened_at` | CHECK `trades_state_consistency` | 23514 |
| — | Jumlah kas > 0; harga dan ukuran > 0; biaya >= 0 | CHECK | 23514 |
| IR-01 | `user_id` tidak dapat diubah | Trigger | 23000 |
| IR-02 | `account_id` transaksi kas tidak dapat diubah | Trigger | 23000 |
| IR-03 | Mata uang akun terkunci setelah ada trade atau kas | Trigger | 23514 |
| IR-04 | Simbol trade dinormalisasi: trim dan huruf besar | Trigger | — |
| IR-05 | Zona waktu profil harus valid | Trigger | 22023 |
| IR-06 | Perubahan **kas** yang mengurangi saldo ditolak bila saldo setelahnya negatif (D-07) | Trigger + kunci baris akun | 23514 |
| — | Akun tidak dapat dihapus selama punya trade/kas | FK `DEFERRABLE INITIALLY DEFERRED` | 23503 |
| — | Menghapus strategi mengosongkan `strategy_id` trade, trade tetap ada | FK `ON DELETE SET NULL (strategy_id)` | — |

Catatan IR-06:

- Yang diperiksa adalah saldo **saat ini**, bukan urutan waktu historis.
- Deposit selalu diterima, termasuk saat saldo sudah negatif akibat kerugian trading. Kerugian trading sendiri tidak diblokir.
- Penghapusan berantai (hapus pengguna) dikecualikan dari pemeriksaan.
- Akun dikunci (`FOR UPDATE`) selama pemeriksaan agar dua withdraw bersamaan tidak sama-sama lolos.

Catatan FK `DEFERRABLE`: pemeriksaan "akun masih punya data" terjadi di akhir transaksi, bukan di akhir statement. Untuk klien (satu statement = satu transaksi) hasilnya sama: galat 23503. Penundaan ini diperlukan agar penghapusan pengguna berantai dari `auth.users` tidak terblokir oleh urutan cascade.

## 4. Fungsi Analitik (satu-satunya sumber rumus)

Semua `SECURITY INVOKER` dan `STABLE`; RLS tetap berlaku. Hanya `authenticated` yang boleh memanggil. Frontend memanggil lewat `supabase.rpc(...)` dan tidak menghitung ulang.

**Konvensi periode:** setengah-terbuka `[p_from, p_to)`; trade menurut `closed_at`, kas menurut `occurred_at`; `NULL` = tanpa batas. (Lampiran A F-17 menulis `[p_from, p_to]`; implementasi memakai batas atas eksklusif agar periode berurutan tidak tumpang tindih. Klien mengirim awal periode berikutnya sebagai `p_to`.)

| Fungsi | Mengembalikan |
|---|---|
| `get_account_balance(p_account_id, p_to)` | Saldo (F-05) kumulatif s.d. `p_to` |
| `get_account_summary(p_account_id, p_from, p_to)` | Satu baris: `currency`, `total_deposit`, `total_withdraw`, `net_deposit`, `trading_pnl`, `balance` (semua kumulatif s.d. `p_to`); lalu untuk periode: `period_pnl`, `closed_trades`, `wins`, `losses`, `breakevens`, `winrate`, `total_win_amount`, `total_loss_amount`, `avg_win`, `avg_loss`, `profit_factor`, `expectancy`, `avg_r`, `return_pct`, `max_drawdown_abs`, `max_drawdown_pct` |
| `get_equity_curve(p_account_id, p_from, p_to)` | Per trade closed: `point_no`, `trade_id`, `closed_at`, `net_pnl`, `cumulative_pnl`, `peak_pnl`, `drawdown_abs`, `drawdown_pct`. Kas tidak ikut. Titik awal 0 ditambahkan oleh UI |
| `get_balance_curve(p_account_id, p_from, p_to, p_tz)` | Per hari lokal beraktivitas: `day`, `cash_flow`, `trading_pnl`, `balance` (saldo akhir hari). Kas dan P/L dipisah |
| `get_monthly_performance(p_account_id, p_from, p_to, p_tz)` | Per bulan lokal: jumlah, win/loss/BE, `net_pnl`, `winrate` |
| `get_symbol_performance(p_account_id, p_from, p_to)` | Per simbol: jumlah, win/loss/BE, `net_pnl`, `winrate` |

Perilaku penting:

- `get_account_summary` melempar `P0002` jika akun tidak ada atau bukan milik pemanggil.
- Rasio dengan penyebut nol bernilai `NULL` (UI menampilkan "N/A"): `winrate`, `profit_factor`, `avg_win`, `avg_loss`, `expectancy`, `return_pct`, `max_drawdown_*` (bila tidak ada trade).
- Winrate hanya dari trade Win/Loss; breakeven hanya masuk `breakevens`; trade open dan kas tidak pernah ikut.
- Tidak ada pembulatan di database (F-16); UI membulatkan saat tampil.

### Klarifikasi rumus yang diputuskan saat implementasi

| Hal | Definisi yang diimplementasikan |
|---|---|
| `return_pct` | `trading_pnl` kumulatif s.d. `p_to` dibagi `total_deposit` kumulatif s.d. `p_to` (konsisten dengan saldo; bukan hanya P/L periode) |
| `max_drawdown_pct` | Maksimum dari `drawdown_abs / (deposit kumulatif pada waktu peak + peak_pnl) × 100`. Untuk peak awal (0), "waktu peak" = waktu trade pertama pada periode. `NULL` jika penyebut <= 0 |
| `avg_r` | Rata-rata `net_pnl / risk_amount` pada trade win/loss yang `risk_amount`-nya terisi |

## 5. Keamanan

- RLS aktif di semua tabel; policy per operasi untuk role `authenticated` dengan `user_id = (select auth.uid())`.
- `anon` dicabut dari semua tabel dan fungsi analitik.
- `profiles`: klien hanya `SELECT` dan `UPDATE (display_name, timezone)`; tidak ada `INSERT`/`DELETE`.
- Fungsi trigger dicabut dari `public`, `anon`, `authenticated`. Satu-satunya `SECURITY DEFINER` adalah `handle_new_user` dengan `search_path = ''`.
- Semua fungsi memakai `search_path = ''` dan nama objek yang dikualifikasi.
- **Matikan "Allow anonymous sign-ins"** di Supabase Auth (bawaan: mati). Pengguna anonim berperan `authenticated` dan akan lolos policy.

## 6. Menjalankan Secara Lokal

Prasyarat: Docker Desktop berjalan.

```bash
npx supabase init          # sekali saja; jawab "N" untuk pengaturan VS Code/IntelliJ
npm run db:start           # menyalakan Supabase lokal dan menerapkan migrasi
npm run db:test            # menjalankan seluruh tes pgTAP
npm run db:types           # menghasilkan src/types/database.ts dari skema
npm run db:reset           # (opsional) membuat ulang DB lokal dari nol
npm run db:stop
```

`npx supabase init` membuat `supabase/config.toml`; folder `migrations/` dan `tests/` yang sudah ada tetap dipakai.

### Menerapkan ke project Supabase (remote)

Lakukan **hanya setelah** `npm run db:test` lulus di lokal.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Dampak: membuat 5 tabel, 6 enum, 14 fungsi, dan policy di schema `public` project tersebut. Project baru tanpa data tidak terdampak. Jika project sudah berisi tabel bernama sama, `db push` akan gagal dan tidak mengubah apa pun (tiap migrasi berjalan dalam transaksi). Setelah `db push`, jalankan `npm run db:types`.

## 7. Cakupan Tes

| Berkas | Yang dibuktikan |
|---|---|
| `01_rls` | RLS aktif; `anon` tertolak; A tidak dapat membaca/mengubah/menghapus data B; tidak dapat membuat data atas nama B atau menautkan ke akun B; `net_pnl`/`result` tidak dapat ditulis; profil dilindungi; fungsi analitik mengikuti RLS |
| `02_formulas` | Seluruh contoh Lampiran A.2 (saldo 900, winrate 66,67%, profit factor 4,33, expectancy 33,33, drawdown 30 / 2,86%); filter periode; per bulan, per simbol, kurva saldo; zona waktu; kasus tepi A.3; penghapusan withdraw tidak mengubah winrate, P/L, profit factor, expectancy, drawdown |
| `03_integrity` | Semua CHECK; IR-01 s.d. IR-06; hapus pengguna berantai; hapus akun dibatasi; hapus strategi |

## 8. Yang Belum Dikerjakan di Fase Ini

- Kinerja per strategi (`get_strategy_performance`): Phase 08.
- Frontend belum memanggil database. Klien Supabase di `src/lib/supabase.ts` belum diberi tipe `Database` sampai `src/types/database.ts` dihasilkan (Phase 03 memakainya).
