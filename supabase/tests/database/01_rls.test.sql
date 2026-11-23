-- =====================================================================
-- Tes isolasi data (RLS), hak akses, dan perlindungan kolom.
-- Jalankan: npx supabase test db
-- Konvensi: UA = pengguna A, UB = pengguna B.
--   UA = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa   UB = bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
--   akun A = a1000000-...-001                    akun B = b1000000-...-001
--   trade A = a2000000-...-001                   trade B = b2000000-...-001
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------- Data uji (dibuat sebagai postgres) ----------
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rls-a@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'rls-b@test.local');

insert into public.trading_accounts (id, user_id, name, currency) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Akun A', 'USD'),
  ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Akun B', 'USD');

insert into public.strategies (id, user_id, name) values
  ('a3000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Strategi A'),
  ('b3000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Strategi B');

insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'deposit', 1000, '2026-11-01 00:00:00+00'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1000000-0000-0000-0000-000000000001', 'deposit', 2000, '2026-11-01 00:00:00+00');

insert into public.trades
  (id, user_id, account_id, symbol, direction, status, opened_at, closed_at, entry_price, exit_price, position_size, gross_pnl)
values
  ('a2000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'EURUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 10),
  ('b2000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1000000-0000-0000-0000-000000000001', 'GBPUSD', 'long', 'closed', '2026-11-02 00:00:00+00', '2026-11-02 01:00:00+00', 1, 1, 1, 20);

-- ---------- Struktur keamanan ----------
select is(
  (select count(*) from pg_tables
    where schemaname = 'public'
      and tablename in ('profiles', 'trading_accounts', 'strategies', 'cash_transactions', 'trades')
      and rowsecurity),
  5::bigint, 'RLS aktif di kelima tabel');

select is(
  (select count(*) from information_schema.table_privileges
    where grantee = 'anon' and table_schema = 'public'
      and table_name in ('profiles', 'trading_accounts', 'strategies', 'cash_transactions', 'trades')),
  0::bigint, 'role anon tidak punya hak apa pun pada tabel aplikasi');

select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'trades'),            4::bigint, 'trades: 4 policy');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'cash_transactions'), 4::bigint, 'cash_transactions: 4 policy');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'trading_accounts'),  4::bigint, 'trading_accounts: 4 policy');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'strategies'),        4::bigint, 'strategies: 4 policy');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'profiles'),          2::bigint, 'profiles: 2 policy (select, update)');

-- Profil dibuat otomatis oleh trigger saat pengguna baru terdaftar
select is((select count(*) from public.profiles where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')),
  2::bigint, 'profil dibuat otomatis untuk pengguna baru');
select is((select timezone from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Asia/Jakarta', 'zona waktu bawaan profil = Asia/Jakarta');

-- ---------- Role anon ----------
set local role anon;
select throws_ok($$select * from public.trades$$,            '42501', null, 'anon tidak dapat membaca trades');
select throws_ok($$select * from public.cash_transactions$$, '42501', null, 'anon tidak dapat membaca cash_transactions');
select throws_ok($$select * from public.trading_accounts$$,  '42501', null, 'anon tidak dapat membaca trading_accounts');
select throws_ok($$select * from public.profiles$$,          '42501', null, 'anon tidak dapat membaca profiles');
select throws_ok($$select public.get_account_balance('a1000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'anon tidak dapat memanggil fungsi analitik');
reset role;

-- ---------- Pengguna A ----------
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
set constraints all immediate;

select is((select count(*) from public.trades),            1::bigint, 'A hanya melihat trade miliknya');
select is((select count(*) from public.trading_accounts),  1::bigint, 'A hanya melihat akun miliknya');
select is((select count(*) from public.cash_transactions), 1::bigint, 'A hanya melihat kas miliknya');
select is((select count(*) from public.strategies),        1::bigint, 'A hanya melihat strategi miliknya');
select is((select count(*) from public.profiles),          1::bigint, 'A hanya melihat profil miliknya');

select is_empty($$select 1 from public.trades where id = 'b2000000-0000-0000-0000-000000000001'$$,
  'A tidak dapat membaca trade B');
select is_empty($$update public.trades set notes = 'hack' where id = 'b2000000-0000-0000-0000-000000000001' returning 1$$,
  'A tidak dapat mengubah trade B');
select is_empty($$delete from public.trades where id = 'b2000000-0000-0000-0000-000000000001' returning 1$$,
  'A tidak dapat menghapus trade B');

select lives_ok(
  $$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, entry_price, position_size)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1000000-0000-0000-0000-000000000001', 'XAUUSD', 'long', 'open', '2026-11-10 00:00:00+00', 1, 1)$$,
  'A dapat membuat trade di akunnya sendiri');

select throws_ok(
  $$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, entry_price, position_size)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1000000-0000-0000-0000-000000000001', 'XAUUSD', 'long', 'open', '2026-11-10 00:00:00+00', 1, 1)$$,
  '42501', null, 'A tidak dapat membuat trade atas nama B (RLS WITH CHECK)');

select throws_ok(
  $$insert into public.trades (user_id, account_id, symbol, direction, status, opened_at, entry_price, position_size)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1000000-0000-0000-0000-000000000001', 'XAUUSD', 'long', 'open', '2026-11-10 00:00:00+00', 1, 1)$$,
  '23503', null, 'A tidak dapat menautkan trade ke akun milik B (composite FK)');

select throws_ok(
  $$insert into public.cash_transactions (user_id, account_id, type, amount, occurred_at)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1000000-0000-0000-0000-000000000001', 'deposit', 1, '2026-11-10 00:00:00+00')$$,
  '23503', null, 'A tidak dapat mencatat kas ke akun milik B (composite FK)');

select throws_ok(
  $$update public.trades set user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'a2000000-0000-0000-0000-000000000001'$$,
  '23000', null, 'A tidak dapat memindahkan trade ke pengguna lain');

select throws_ok(
  $$update public.trades set net_pnl = 999 where id = 'a2000000-0000-0000-0000-000000000001'$$,
  '428C9', null, 'net_pnl tidak dapat ditulis klien (kolom generated)');

select throws_ok(
  $$update public.trades set result = 'win' where id = 'a2000000-0000-0000-0000-000000000001'$$,
  '428C9', null, 'result tidak dapat ditulis klien (kolom generated)');

-- Profil: hanya display_name dan timezone yang dapat diubah
select lives_ok($$update public.profiles set display_name = 'Trader A' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'A dapat mengubah nama tampilan');
select throws_ok($$update public.profiles set id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '42501', null, 'id profil tidak dapat diubah');
select throws_ok($$insert into public.profiles (id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  '42501', null, 'klien tidak dapat membuat profil');
select throws_ok($$delete from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '42501', null, 'klien tidak dapat menghapus profil');

-- Fungsi analitik mengikuti RLS
select is((select count(*) from public.get_account_summary('a1000000-0000-0000-0000-000000000001')),
  1::bigint, 'A dapat meringkas akunnya sendiri');
select throws_ok($$select * from public.get_account_summary('b1000000-0000-0000-0000-000000000001')$$,
  'P0002', null, 'A tidak dapat meringkas akun milik B');
select is((select count(*) from public.get_equity_curve('b1000000-0000-0000-0000-000000000001')),
  0::bigint, 'A tidak mendapat titik kurva dari akun B');
reset role;

-- ---------- Pengguna B ----------
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is((select count(*) from public.trades), 1::bigint, 'B hanya melihat trade miliknya (trade baru A tidak terlihat)');
select is((select t.symbol from public.trades t), 'GBPUSD', 'trade yang terlihat oleh B adalah miliknya');
select is((select count(*) from public.cash_transactions), 1::bigint, 'B hanya melihat kas miliknya');
select is((select p.display_name from public.profiles p), null::text, 'profil B tidak terpengaruh perubahan nama A');
reset role;

select * from finish();
rollback;
