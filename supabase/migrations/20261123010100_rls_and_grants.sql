-- =====================================================================
-- Phase 02 / Migration 2: Row Level Security dan hak akses
-- Setiap pengguna hanya dapat mengakses barisnya sendiri.
-- Role `anon` tidak memiliki akses apa pun ke tabel aplikasi.
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.trading_accounts  enable row level security;
alter table public.strategies        enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.trades            enable row level security;

-- ---------- Hak akses tabel ----------
-- Supabase memberi hak penuh ke anon/authenticated lewat default privileges;
-- cabut semuanya lalu beri hanya yang dibutuhkan.
revoke all on table
  public.profiles, public.trading_accounts, public.strategies,
  public.cash_transactions, public.trades
from anon, authenticated;

-- profiles dibuat oleh trigger (bukan klien) dan hanya dua kolom yang boleh diubah.
grant select on public.profiles to authenticated;
grant update (display_name, timezone) on public.profiles to authenticated;

grant select, insert, update, delete on
  public.trading_accounts, public.strategies,
  public.cash_transactions, public.trades
to authenticated;

-- ---------- Policy: profiles ----------
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- Policy: trading_accounts ----------
create policy trading_accounts_select_own on public.trading_accounts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy trading_accounts_insert_own on public.trading_accounts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy trading_accounts_update_own on public.trading_accounts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trading_accounts_delete_own on public.trading_accounts
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Policy: strategies ----------
create policy strategies_select_own on public.strategies
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy strategies_insert_own on public.strategies
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy strategies_update_own on public.strategies
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy strategies_delete_own on public.strategies
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Policy: cash_transactions ----------
create policy cash_transactions_select_own on public.cash_transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy cash_transactions_insert_own on public.cash_transactions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy cash_transactions_update_own on public.cash_transactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cash_transactions_delete_own on public.cash_transactions
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Policy: trades ----------
create policy trades_select_own on public.trades
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy trades_insert_own on public.trades
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy trades_update_own on public.trades
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy trades_delete_own on public.trades
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Fungsi trigger bawaan: tidak boleh dipanggil klien ----------
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at()  from public, anon, authenticated;
