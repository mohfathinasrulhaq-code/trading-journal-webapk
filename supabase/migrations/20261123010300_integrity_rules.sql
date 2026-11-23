-- =====================================================================
-- Phase 02 / Migration 4: aturan integritas data (trigger)
--   IR-01 user_id tidak dapat diubah
--   IR-02 account_id transaksi kas tidak dapat diubah
--   IR-03 mata uang akun terkunci setelah ada transaksi
--   IR-04 simbol trade dinormalisasi (trim + huruf besar)
--   IR-05 zona waktu profil harus valid
--   IR-06 deposit/withdraw tidak boleh membuat saldo menjadi negatif (D-07)
-- =====================================================================

-- IR-01
create function public.prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed' using errcode = '23000';
  end if;
  return new;
end;
$$;

create trigger prevent_owner_change before update on public.trading_accounts
  for each row execute function public.prevent_owner_change();
create trigger prevent_owner_change before update on public.strategies
  for each row execute function public.prevent_owner_change();
create trigger prevent_owner_change before update on public.cash_transactions
  for each row execute function public.prevent_owner_change();
create trigger prevent_owner_change before update on public.trades
  for each row execute function public.prevent_owner_change();

-- IR-02
create function public.prevent_cash_account_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.account_id is distinct from old.account_id then
    raise exception 'account_id of a cash transaction cannot be changed' using errcode = '23000';
  end if;
  return new;
end;
$$;

create trigger prevent_cash_account_change before update on public.cash_transactions
  for each row execute function public.prevent_cash_account_change();

-- IR-03
create function public.lock_account_currency()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.currency is distinct from old.currency
     and (
       exists (select 1 from public.trades t where t.account_id = old.id)
       or exists (select 1 from public.cash_transactions c where c.account_id = old.id)
     )
  then
    raise exception 'Account currency cannot be changed after transactions exist'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger lock_account_currency before update of currency on public.trading_accounts
  for each row execute function public.lock_account_currency();

-- IR-04
create function public.normalize_trade_symbol()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.symbol := upper(btrim(new.symbol));
  return new;
end;
$$;

create trigger normalize_trade_symbol before insert or update of symbol on public.trades
  for each row execute function public.normalize_trade_symbol();

-- IR-05
create function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Melempar galat 22023 bila nama zona waktu tidak dikenal.
  perform now() at time zone new.timezone;
  return new;
end;
$$;

create trigger validate_profile_timezone before insert or update of timezone on public.profiles
  for each row execute function public.validate_profile_timezone();

-- IR-06
-- Ditolak jika perubahan KAS mengurangi saldo DAN saldo setelahnya negatif.
-- Perubahan yang tidak mengurangi saldo (mis. deposit) selalu diizinkan, juga saat
-- saldo sudah negatif akibat kerugian trading. Yang diperiksa adalah saldo saat ini
-- (bukan urutan waktu historis). Akun dikunci (FOR UPDATE) agar dua withdraw
-- bersamaan tidak dapat sama-sama lolos.
create function public.guard_cash_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_account_id uuid;
  v_old_effect numeric := 0;
  v_new_effect numeric := 0;
  v_balance    numeric;
begin
  -- Penghapusan berantai (mis. hapus pengguna) tidak diperiksa.
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return null;
  end if;

  if tg_op = 'DELETE' then
    v_account_id := old.account_id;
  else
    v_account_id := new.account_id;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    v_old_effect := case when old.type = 'deposit' then old.amount else -old.amount end;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new_effect := case when new.type = 'deposit' then new.amount else -new.amount end;
  end if;

  if v_new_effect - v_old_effect >= 0 then
    return null;
  end if;

  perform 1 from public.trading_accounts a where a.id = v_account_id for update;
  if not found then
    return null;
  end if;

  v_balance := public.get_account_balance(v_account_id);
  if v_balance < 0 then
    raise exception 'Cash transaction would make the account balance negative (balance after change: %)', v_balance
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create trigger guard_cash_balance
  after insert or update or delete on public.cash_transactions
  for each row execute function public.guard_cash_balance();

-- Fungsi trigger tidak boleh dipanggil klien.
revoke all on function public.prevent_owner_change()        from public, anon, authenticated;
revoke all on function public.prevent_cash_account_change() from public, anon, authenticated;
revoke all on function public.lock_account_currency()       from public, anon, authenticated;
revoke all on function public.normalize_trade_symbol()      from public, anon, authenticated;
revoke all on function public.validate_profile_timezone()   from public, anon, authenticated;
revoke all on function public.guard_cash_balance()          from public, anon, authenticated;
