-- =====================================================================
-- Tes rumus keuangan (Lampiran A dokumen Phase 00).
-- Data uji A.2: deposit 1000, trade +50 / -30 / 0 / +80, withdraw 200, 1 trade open.
-- Jalankan: npx supabase test db
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------- Data uji (hanya di dalam transaksi ini; di-rollback di akhir) ----------
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'formulas@test.local');

insert into public.trading_accounts (id, user_id, name, currency) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main',        'USD'),
  ('a1000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TZ boundary',  'USD'),
  ('a1000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Empty',        'USD'),
  ('a1000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Only wins',    'USD'),
  ('a1000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Only BE',      'USD'),
  ('a1000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'No deposit',   'USD'),
  ('a1000000-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Peak time',    'USD'),
  ('a1000000-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Boundaries',   'USD');

-- Akun utama (Lampiran A.2)
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'deposit', 1000, '2026-11-01 09:00:00+00');

insert into public.trades
  (user_id, account_id, symbol, market_type, direction, status, opened_at, closed_at,
   entry_price, exit_price, position_size, gross_pnl, commission, fee, swap, risk_amount)
values
  -- net = 60 - 4 - 2 + (-4) = 50  (Win)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD',  'forex',  'long',  'closed', '2026-11-02 08:00:00+00', '2026-11-02 10:00:00+00', 1.10, 1.11, 1, 60, 4, 2, -4, 25),
  -- net = -20 - 5 - 3 + (-2) = -30 (Loss); simbol sengaja huruf kecil + spasi (dinormalisasi)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'eurusd ', 'forex',  'short', 'closed', '2026-11-03 08:00:00+00', '2026-11-03 10:00:00+00', 1.10, 1.11, 1, -20, 5, 3, -2, 30),
  -- net = 10 - 6 - 4 + 0 = 0 (Breakeven)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'BTCUSDT', 'crypto', 'long',  'closed', '2026-11-05 08:00:00+00', '2026-11-05 10:00:00+00', 100, 100, 1, 10, 6, 4, 0, null),
  -- net = 80 (Win)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD',  'forex',  'long',  'closed', '2026-11-06 08:00:00+00', '2026-11-06 10:00:00+00', 1.10, 1.12, 1, 80, 0, 0, 0, 40),
  -- trade open: tidak boleh masuk statistik
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD',  'forex',  'long',  'open',   '2026-11-07 08:00:00+00', null,                      1.10, null, 1, null, 0, 0, 0, null);

insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'withdraw', 200, '2026-11-04 12:00:00+00');

-- ---------- F-01, F-02: net_pnl dan hasil per trade ----------
select is(
  (select array_agg(t.net_pnl order by t.closed_at) from public.trades t
    where t.account_id = 'a1000000-0000-0000-0000-000000000001' and t.status = 'closed'),
  array[50, -30, 0, 80]::numeric[],
  'F-01: net_pnl = gross_pnl - commission - fee + swap');

select is(
  (select array_agg(t.result::text order by t.closed_at) from public.trades t
    where t.account_id = 'a1000000-0000-0000-0000-000000000001' and t.status = 'closed'),
  array['win', 'loss', 'breakeven', 'win']::text[],
  'F-02: hasil win/loss/breakeven diturunkan dari net_pnl');

select is(
  (select t.net_pnl from public.trades t where t.status = 'open'
    and t.account_id = 'a1000000-0000-0000-0000-000000000001'),
  null::numeric, 'trade open: net_pnl kosong');

select is(
  (select t.result::text from public.trades t where t.status = 'open'
    and t.account_id = 'a1000000-0000-0000-0000-000000000001'),
  null::text, 'trade open: result kosong');

select is(
  (select count(*) from public.trades t
    where t.account_id = 'a1000000-0000-0000-0000-000000000001' and t.symbol = 'EURUSD'),
  4::bigint, 'IR-04: simbol dinormalisasi (trim + huruf besar)');

-- ---------- Ringkasan akun utama (seluruh periode) ----------
select is((select s.total_deposit      from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 1000::numeric, 'F-03 total_deposit');
select is((select s.total_withdraw     from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 200::numeric,  'F-03 total_withdraw');
select is((select s.net_deposit        from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 800::numeric,  'F-03 net_deposit');
select is((select s.trading_pnl        from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 100::numeric,  'F-04 trading_pnl');
select is((select s.balance            from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 900::numeric,  'F-05 balance = net_deposit + trading_pnl');
select is((select s.closed_trades      from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 4::bigint,     'trade open tidak dihitung');
select is((select s.wins               from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 2::bigint,     'jumlah win');
select is((select s.losses             from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 1::bigint,     'jumlah loss');
select is((select s.breakevens         from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 1::bigint,     'jumlah breakeven');
select is((select round(s.winrate, 2)  from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 66.67::numeric, 'F-07 winrate = 2/(2+1): kas dan breakeven tidak ikut');
select is((select s.total_win_amount   from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 130::numeric,  'F-08 total_win_amount');
select is((select s.total_loss_amount  from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 30::numeric,   'F-08 total_loss_amount');
select is((select s.avg_win            from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 65::numeric,   'F-09 avg_win');
select is((select s.avg_loss           from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 30::numeric,   'F-09 avg_loss');
select is((select round(s.profit_factor, 2) from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 4.33::numeric, 'F-10 profit_factor');
select is((select round(s.expectancy, 2)    from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 33.33::numeric, 'F-11 expectancy');
select is((select round(s.avg_r, 2)         from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 1.00::numeric,  'F-12 avg_r = (2 - 1 + 2) / 3');
select is((select s.return_pct              from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 10::numeric,    'F-13 return_pct = 100 / 1000');
select is((select s.max_drawdown_abs        from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 30::numeric,    'F-15 max_drawdown_abs');
select is((select round(s.max_drawdown_pct, 2) from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 2.86::numeric, 'F-15 max_drawdown_pct = 30 / (1000 + 50)');
select is((select s.currency::text          from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 'USD', 'currency akun');

-- Konsistensi: fungsi saldo = saldo pada ringkasan
select is(public.get_account_balance('a1000000-0000-0000-0000-000000000001'), 900::numeric, 'get_account_balance = 900');
select is(public.get_account_balance('a1000000-0000-0000-0000-000000000001', '2026-11-06 00:00:00+00'), 820::numeric,
  'get_account_balance s.d. 6 Nov (eksklusif) = 1000 - 200 + 50 - 30 + 0');

-- ---------- F-14: equity curve ----------
select is(
  (select array_agg(e.cumulative_pnl order by e.point_no)
     from public.get_equity_curve('a1000000-0000-0000-0000-000000000001') e),
  array[50, 20, 20, 100]::numeric[], 'F-14 cumulative_pnl (kas tidak ikut)');
select is(
  (select array_agg(e.drawdown_abs order by e.point_no)
     from public.get_equity_curve('a1000000-0000-0000-0000-000000000001') e),
  array[0, 30, 30, 0]::numeric[], 'F-15 drawdown_abs per titik');

-- ---------- F-17: filter periode [p_from, p_to) ----------
select is(
  (select s.closed_trades from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  2::bigint, 'periode 3-6 Nov: trade closed 3 Nov dan 5 Nov saja (batas atas eksklusif)');
select is(
  (select s.wins from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  0::bigint, 'periode: tidak ada win');
select is(
  (select s.winrate from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  0::numeric, 'periode: winrate 0 (bukan NULL) karena ada 1 loss');
select is(
  (select s.period_pnl from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  -30::numeric, 'periode: period_pnl');
select is(
  (select s.balance from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  820::numeric, 'periode: saldo kumulatif sejak awal s.d. p_to');
select is(
  (select s.profit_factor from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  0::numeric, 'periode: profit factor 0 (tanpa win, ada loss)');
select is(
  (select s.avg_win from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  null::numeric, 'periode: avg_win N/A');
select is(
  (select round(s.max_drawdown_pct, 2) from public.get_account_summary('a1000000-0000-0000-0000-000000000001', '2026-11-03 00:00:00+00', '2026-11-06 00:00:00+00') s),
  3.00::numeric, 'periode: drawdown dari titik awal 0, basis = deposit s.d. trade pertama = 1000');

-- ---------- Kinerja per bulan dan per simbol ----------
select is(
  (select count(*) from public.get_monthly_performance('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta')),
  1::bigint, 'per bulan: satu baris (November)');
select is(
  (select m.net_pnl from public.get_monthly_performance('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta') m),
  100::numeric, 'per bulan: net_pnl');
select is(
  (select round(m.winrate, 2) from public.get_monthly_performance('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta') m),
  66.67::numeric, 'per bulan: winrate');

select is(
  (select p.closed_trades from public.get_symbol_performance('a1000000-0000-0000-0000-000000000001') p where p.symbol = 'EURUSD'),
  3::bigint, 'per simbol: EURUSD 3 trade closed');
select is(
  (select p.net_pnl from public.get_symbol_performance('a1000000-0000-0000-0000-000000000001') p where p.symbol = 'EURUSD'),
  100::numeric, 'per simbol: EURUSD net_pnl');
select is(
  (select round(p.winrate, 2) from public.get_symbol_performance('a1000000-0000-0000-0000-000000000001') p where p.symbol = 'EURUSD'),
  66.67::numeric, 'per simbol: EURUSD winrate');
select is(
  (select p.winrate from public.get_symbol_performance('a1000000-0000-0000-0000-000000000001') p where p.symbol = 'BTCUSDT'),
  null::numeric, 'per simbol: BTCUSDT hanya breakeven, winrate N/A');

-- ---------- Kurva saldo harian ----------
select is(
  (select count(*) from public.get_balance_curve('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta')),
  6::bigint, 'kurva saldo: 6 hari beraktivitas');
select is(
  (select b.balance from public.get_balance_curve('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta') b order by b.day desc limit 1),
  900::numeric, 'kurva saldo: saldo akhir = 900');
select is(
  (select b.cash_flow from public.get_balance_curve('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta') b where b.day = '2026-11-04'),
  -200::numeric, 'kurva saldo: arus kas (withdraw) dipisah dari P/L');
select is(
  (select b.trading_pnl from public.get_balance_curve('a1000000-0000-0000-0000-000000000001', null, null, 'Asia/Jakarta') b where b.day = '2026-11-04'),
  0::numeric, 'kurva saldo: P/L trading pada hari withdraw = 0');
select is(
  (select b.balance from public.get_balance_curve('a1000000-0000-0000-0000-000000000001', '2026-11-04 00:00:00+00', null, 'Asia/Jakarta') b order by b.day limit 1),
  820::numeric, 'kurva saldo: saldo pembuka periode dihitung dari riwayat sebelumnya');

-- ---------- Kasus tepi (A.3) ----------
-- Zona waktu: trade 30 Nov 20:00 UTC = 1 Des 03:00 WIB
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000003', 'deposit', 100, '2026-11-01 00:00:00+00');
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000003', 'EURUSD', 'long', 'closed', '2026-11-30 19:00:00+00', '2026-11-30 20:00:00+00', 1, 1, 1, 10);
select is(
  (select m.month_start from public.get_monthly_performance('a1000000-0000-0000-0000-000000000003', null, null, 'Asia/Jakarta') m),
  '2026-12-01'::date, 'zona waktu: dikelompokkan ke Desember menurut Asia/Jakarta');
select is(
  (select m.month_start from public.get_monthly_performance('a1000000-0000-0000-0000-000000000003', null, null, 'UTC') m),
  '2026-11-01'::date, 'zona waktu: dikelompokkan ke November menurut UTC');

-- Belum ada trade closed
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000004', 'deposit', 500, '2026-11-01 00:00:00+00');
select is((select s.balance          from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), 500::numeric,  'tanpa trade: saldo = net_deposit');
select is((select s.closed_trades    from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), 0::bigint,     'tanpa trade: closed_trades 0');
select is((select s.winrate          from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), null::numeric, 'tanpa trade: winrate N/A');
select is((select s.profit_factor    from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), null::numeric, 'tanpa trade: profit_factor N/A');
select is((select s.expectancy       from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), null::numeric, 'tanpa trade: expectancy N/A');
select is((select s.max_drawdown_abs from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), null::numeric, 'tanpa trade: drawdown N/A');
select is((select s.return_pct       from public.get_account_summary('a1000000-0000-0000-0000-000000000004') s), 0::numeric,    'tanpa trade: return_pct 0 (deposit ada)');

-- Hanya win
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000005', 'deposit', 100, '2026-11-01 00:00:00+00');
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000005', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 10),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000005', 'EURUSD', 'long', 'closed', '2026-11-03 00:00:00+00', '2026-11-03 01:00:00+00', 1, 1, 1, 20);
select is((select s.winrate       from public.get_account_summary('a1000000-0000-0000-0000-000000000005') s), 100::numeric,  'hanya win: winrate 100');
select is((select s.profit_factor from public.get_account_summary('a1000000-0000-0000-0000-000000000005') s), null::numeric, 'hanya win: profit_factor N/A (tidak ada loss)');
select is((select s.avg_loss      from public.get_account_summary('a1000000-0000-0000-0000-000000000005') s), null::numeric, 'hanya win: avg_loss N/A');
select is((select s.expectancy    from public.get_account_summary('a1000000-0000-0000-0000-000000000005') s), 15::numeric,   'hanya win: expectancy = 30/2');

-- Hanya breakeven (gross 5 - commission 5 = 0)
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000006', 'deposit', 100, '2026-11-01 00:00:00+00');
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl, commission) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000006', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 5, 5);
select is((select s.winrate    from public.get_account_summary('a1000000-0000-0000-0000-000000000006') s), null::numeric, 'hanya breakeven: winrate N/A');
select is((select s.breakevens from public.get_account_summary('a1000000-0000-0000-0000-000000000006') s), 1::bigint,     'hanya breakeven: dihitung sebagai jumlah');

-- Tanpa deposit
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000007', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 10);
select is((select s.return_pct from public.get_account_summary('a1000000-0000-0000-0000-000000000007') s), null::numeric, 'tanpa deposit: return_pct N/A');
select is((select s.balance    from public.get_account_summary('a1000000-0000-0000-0000-000000000007') s), 10::numeric,   'tanpa deposit: saldo = trading_pnl');

-- Basis drawdown memakai deposit pada WAKTU PEAK (deposit setelah peak tidak ikut)
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000008', 'deposit', 1000, '2026-11-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000008', 'deposit', 1000, '2026-11-03 00:00:00+00');
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000008', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 100),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000008', 'EURUSD', 'long', 'closed', '2026-11-04 00:00:00+00', '2026-11-04 01:00:00+00', 1, 1, 1, -50);
select is((select s.max_drawdown_abs from public.get_account_summary('a1000000-0000-0000-0000-000000000008') s), 50::numeric, 'drawdown abs = 100 - 50');
select is((select round(s.max_drawdown_pct, 2) from public.get_account_summary('a1000000-0000-0000-0000-000000000008') s), 4.55::numeric,
  'drawdown % = 50 / (1000 + 100) (deposit kedua setelah peak tidak ikut basis)');

-- Batas tanda net_pnl: +0.01 = win, -0.01 = loss
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl, commission) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000009', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 0.01, 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000009', 'EURUSD', 'long', 'closed', '2026-11-03 00:00:00+00', '2026-11-03 01:00:00+00', 1, 1, 1, 10, 10.01);
select is(
  (select array_agg(t.result::text order by t.closed_at) from public.trades t where t.account_id = 'a1000000-0000-0000-0000-000000000009'),
  array['win', 'loss']::text[], 'batas: net +0.01 = win, net -0.01 = loss');

-- Akun tidak ditemukan
select throws_ok(
  $$select * from public.get_account_summary('00000000-0000-0000-0000-000000000000')$$,
  'P0002', null, 'ringkasan akun yang tidak ada melempar galat');

-- ---------- PEMBUKTIAN PEMISAHAN: withdraw tidak memengaruhi statistik trading ----------
delete from public.cash_transactions
 where account_id = 'a1000000-0000-0000-0000-000000000001' and type = 'withdraw';

select is((select s.balance from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 1100::numeric,
  'tanpa withdraw: saldo menjadi 1100');
select is((select round(s.winrate, 2)    from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 66.67::numeric, 'tanpa withdraw: winrate TIDAK berubah');
select is((select s.trading_pnl          from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 100::numeric,   'tanpa withdraw: trading_pnl TIDAK berubah');
select is((select round(s.profit_factor, 2) from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 4.33::numeric, 'tanpa withdraw: profit_factor TIDAK berubah');
select is((select round(s.expectancy, 2)    from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 33.33::numeric, 'tanpa withdraw: expectancy TIDAK berubah');
select is((select s.max_drawdown_abs     from public.get_account_summary('a1000000-0000-0000-0000-000000000001') s), 30::numeric,    'tanpa withdraw: drawdown TIDAK berubah');

select * from finish();
rollback;
