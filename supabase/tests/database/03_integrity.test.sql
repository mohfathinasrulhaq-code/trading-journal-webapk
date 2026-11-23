-- =====================================================================
-- Tes aturan integritas: constraint, trigger, dan perilaku hapus.
-- Jalankan: npx supabase test db
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------- Data uji ----------
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'int-a@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'int-b@test.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'int-c@test.local');

insert into public.trading_accounts (id, user_id, name, currency) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kosong',      'USD'),
  ('a1000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kas',         'USD'),
  ('a1000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rugi',        'USD'),
  ('c1000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Akun C',      'USD');

insert into public.strategies (id, user_id, name) values
  ('a3000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Breakout'),
  ('b3000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Milik B');

-- ---------- Penghapusan pengguna berantai (perilaku DEFAULT: constraint ditunda) ----------
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c1000000-0000-0000-0000-000000000001', 'deposit',  500, '2026-11-01 00:00:00+00'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c1000000-0000-0000-0000-000000000001', 'withdraw', 100, '2026-11-02 00:00:00+00');
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 10);

select lives_ok($$delete from auth.users where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  'menghapus pengguna ikut menghapus akun, kas, trade, dan profil (tanpa terblokir guard saldo)');
set constraints all immediate;  -- memicu pemeriksaan FK yang tertunda; galat di sini = kegagalan tes
select is((select count(*) from public.trading_accounts where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0::bigint, 'akun pengguna terhapus');
select is((select count(*) from public.cash_transactions where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0::bigint, 'kas pengguna terhapus');
select is((select count(*) from public.trades where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0::bigint, 'trade pengguna terhapus');
select is((select count(*) from public.profiles where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0::bigint, 'profil pengguna terhapus');

-- Mulai di sini constraint bersifat immediate agar galat terlihat per statement.

-- ---------- Constraint nilai ----------
select throws_ok($$insert into public.trading_accounts (user_id, name, currency) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'x', 'usd')$$,
  '23514', null, 'mata uang huruf kecil ditolak');
select throws_ok($$insert into public.trading_accounts (user_id, name, currency) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'x', 'US')$$,
  '23514', null, 'mata uang 2 huruf ditolak');
select throws_ok($$insert into public.trading_accounts (user_id, name, currency) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kosong', 'USD')$$,
  '23505', null, 'nama akun unik per pengguna');

select throws_ok($$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'deposit', 0, '2026-11-01 00:00:00+00')$$,
  '23514', null, 'jumlah kas harus > 0');
select throws_ok($$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'withdraw', -5, '2026-11-01 00:00:00+00')$$,
  '23514', null, 'jumlah kas negatif ditolak (arah ditentukan oleh type)');

-- State trade
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, position_size)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'open', '2026-11-01 00:00:00+00', '2026-11-02 00:00:00+00', 1, 1)$$,
  '23514', null, 'trade open tidak boleh punya closed_at');
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'closed', '2026-11-01 00:00:00+00', '2026-11-02 00:00:00+00', 1, 1, 1)$$,
  '23514', null, 'trade closed wajib punya gross_pnl');
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, position_size, gross_pnl)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'closed', '2026-11-01 00:00:00+00', '2026-11-02 00:00:00+00', 1, 1, 5)$$,
  '23514', null, 'trade closed wajib punya exit_price');
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-01 00:00:00+00', 1, 1, 1, 5)$$,
  '23514', null, 'closed_at tidak boleh lebih awal dari opened_at');
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, entry_price, position_size, commission)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'open', '2026-11-01 00:00:00+00', 1, 1, -1)$$,
  '23514', null, 'commission negatif ditolak');
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, entry_price, position_size)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'open', '2026-11-01 00:00:00+00', 1, 0)$$,
  '23514', null, 'position_size 0 ditolak');
select throws_ok($$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, entry_price, position_size)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', '   ', 'long', 'open', '2026-11-01 00:00:00+00', 1, 1)$$,
  '23514', null, 'IR-04: simbol berisi spasi saja ditolak');

-- ---------- IR-05: zona waktu profil ----------
select throws_ok($$update public.profiles set timezone = 'Mars/Phobos' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '22023', null, 'IR-05: zona waktu tidak dikenal ditolak');
select lives_ok($$update public.profiles set timezone = 'America/New_York' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'IR-05: zona waktu valid diterima');

-- ---------- IR-06: guard saldo untuk kas ----------
insert into public.cash_transactions (id, user_id, account_id, type, amount, occurred_at) values
  ('a4000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000002', 'deposit', 100, '2026-11-01 00:00:00+00');

select throws_ok($$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000002', 'withdraw', 101, '2026-11-02 00:00:00+00')$$,
  '23514', null, 'IR-06: withdraw melebihi saldo ditolak');
select lives_ok($$insert into public.cash_transactions (id, user_id, account_id, type, amount, occurred_at)
  values ('a4000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000002', 'withdraw', 100, '2026-11-02 00:00:00+00')$$,
  'IR-06: withdraw sebesar saldo diterima');
select is(public.get_account_balance('a1000000-0000-0000-0000-000000000002'), 0::numeric, 'saldo setelah withdraw = 0');
select throws_ok($$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000002', 'withdraw', 1, '2026-11-03 00:00:00+00')$$,
  '23514', null, 'IR-06: withdraw saat saldo 0 ditolak');
select throws_ok($$delete from public.cash_transactions where id = 'a4000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'IR-06: menghapus deposit yang membuat saldo negatif ditolak');
select throws_ok($$update public.cash_transactions set amount = 50 where id = 'a4000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'IR-06: mengecilkan deposit hingga saldo negatif ditolak');
select lives_ok($$update public.cash_transactions set amount = 40 where id = 'a4000000-0000-0000-0000-000000000002'$$,
  'IR-06: mengecilkan withdraw (saldo naik) diterima');
select is(public.get_account_balance('a1000000-0000-0000-0000-000000000002'), 60::numeric, 'saldo setelah withdraw diperkecil = 60');
select lives_ok($$delete from public.cash_transactions where id = 'a4000000-0000-0000-0000-000000000002'$$,
  'IR-06: menghapus withdraw (saldo naik) diterima');
select is(public.get_account_balance('a1000000-0000-0000-0000-000000000002'), 100::numeric, 'saldo setelah withdraw dihapus = 100');

-- Saldo negatif akibat kerugian trading: deposit tetap boleh, withdraw tidak
insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000003', 'deposit', 100, '2026-11-01 00:00:00+00');
insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000003', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, -150);
select is(public.get_account_balance('a1000000-0000-0000-0000-000000000003'), -50::numeric, 'kerugian trading boleh membuat saldo negatif (tidak diblokir)');
select lives_ok($$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000003', 'deposit', 10, '2026-11-03 00:00:00+00')$$,
  'deposit tetap diterima saat saldo negatif');
select throws_ok($$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000003', 'withdraw', 1, '2026-11-04 00:00:00+00')$$,
  '23514', null, 'withdraw saat saldo negatif ditolak');

-- ---------- IR-01, IR-02: kolom yang tidak boleh berubah ----------
select throws_ok($$update public.trading_accounts set user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'a1000000-0000-0000-0000-000000000001'$$,
  '23000', null, 'IR-01: user_id akun tidak dapat diubah');
select throws_ok($$update public.cash_transactions set account_id = 'a1000000-0000-0000-0000-000000000001' where id = 'a4000000-0000-0000-0000-000000000001'$$,
  '23000', null, 'IR-02: account_id kas tidak dapat diubah');

-- ---------- IR-03: kunci mata uang ----------
select throws_ok($$update public.trading_accounts set currency = 'EUR' where id = 'a1000000-0000-0000-0000-000000000002'$$,
  '23514', null, 'IR-03: mata uang akun berisi transaksi tidak dapat diubah');
select lives_ok($$update public.trading_accounts set currency = 'EUR' where id = 'a1000000-0000-0000-0000-000000000001'$$,
  'IR-03: mata uang akun kosong dapat diubah');

-- ---------- Hapus akun: dibatasi bila masih ada data ----------
select throws_ok($$delete from public.trading_accounts where id = 'a1000000-0000-0000-0000-000000000003'$$,
  '23503', null, 'akun yang masih punya trade/kas tidak dapat dihapus');
select lives_ok($$delete from public.trading_accounts where id = 'a1000000-0000-0000-0000-000000000001'$$,
  'akun kosong dapat dihapus');

-- ---------- Strategi ----------
insert into public.trades (id, user_id, account_id, strategy_id, symbol, direction, status, opened_at, entry_price, position_size) values
  ('a2000000-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000002',
   'a3000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'open', '2026-11-05 00:00:00+00', 1, 1);

select throws_ok($$insert into public.trades (user_id, account_id, strategy_id, symbol, direction, status, opened_at, entry_price, position_size)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'open', '2026-11-05 00:00:00+00', 1, 1)$$,
  '23503', null, 'trade tidak dapat memakai strategi milik pengguna lain');

select lives_ok($$delete from public.strategies where id = 'a3000000-0000-0000-0000-000000000001'$$,
  'strategi dapat dihapus');
select is((select t.strategy_id from public.trades t where t.id = 'a2000000-0000-0000-0000-000000000009'),
  null::uuid, 'hapus strategi: trade tetap ada, strategy_id dikosongkan');
select is((select t.user_id from public.trades t where t.id = 'a2000000-0000-0000-0000-000000000009'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'hapus strategi: user_id trade tidak ikut dikosongkan');

-- ---------- updated_at ----------
select ok(
  (select t.updated_at >= t.created_at from public.trades t where t.id = 'a2000000-0000-0000-0000-000000000009'),
  'updated_at terisi');

select * from finish();
rollback;
