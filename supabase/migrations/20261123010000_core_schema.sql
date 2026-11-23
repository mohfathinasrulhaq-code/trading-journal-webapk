-- =====================================================================
-- Phase 02 / Migration 1: core schema
-- Tabel: profiles, trading_accounts, strategies, cash_transactions, trades
-- Prinsip: deposit/withdraw (cash_transactions) dan trading (trades)
-- disimpan di tabel TERPISAH dan tidak pernah dicampur (BR-01).
-- Bergantung pada skema `auth` milik Supabase (auth.users).
-- =====================================================================

-- ---------- Enum ----------
create type public.account_type          as enum ('real', 'demo');
create type public.market_type           as enum ('forex', 'crypto', 'stock', 'index', 'commodity', 'other');
create type public.trade_direction       as enum ('long', 'short');
create type public.trade_status          as enum ('open', 'closed');
create type public.trade_result          as enum ('win', 'loss', 'breakeven');
create type public.cash_transaction_type as enum ('deposit', 'withdraw');

-- ---------- Fungsi pembantu ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  timezone     text not null default 'Asia/Jakarta',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- trading_accounts ----------
create table public.trading_accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  broker       text check (broker is null or char_length(broker) <= 80),
  account_type public.account_type not null default 'real',
  currency     char(3) not null check (currency ~ '^[A-Z]{3}$'),
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id),     -- target composite FK: mencegah referensi lintas pengguna
  unique (user_id, name)
);

-- ---------- strategies ----------
create table public.strategies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

-- ---------- cash_transactions: HANYA deposit dan withdraw ----------
create table public.cash_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  account_id  uuid not null,
  type        public.cash_transaction_type not null,
  amount      numeric(18,2) not null check (amount > 0),  -- selalu positif; arah ditentukan `type`
  occurred_at timestamptz not null,
  note        text check (note is null or char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- DEFERRABLE INITIALLY DEFERRED: akun tidak bisa dihapus selama masih punya data,
  -- tetapi penghapusan pengguna (cascade dari auth.users) tetap berjalan karena
  -- pemeriksaan ditunda sampai akhir transaksi.
  constraint cash_transactions_account_fk
    foreign key (account_id, user_id)
    references public.trading_accounts (id, user_id)
    deferrable initially deferred
);

-- ---------- trades: HANYA transaksi trading ----------
create table public.trades (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  account_id    uuid not null,
  strategy_id   uuid,
  symbol        text not null check (char_length(symbol) between 1 and 30),
  market_type   public.market_type not null default 'other',
  direction     public.trade_direction not null,
  status        public.trade_status not null default 'open',
  opened_at     timestamptz not null,
  closed_at     timestamptz,
  entry_price   numeric(18,8) not null check (entry_price > 0),
  exit_price    numeric(18,8) check (exit_price > 0),
  stop_loss     numeric(18,8) check (stop_loss > 0),
  take_profit   numeric(18,8) check (take_profit > 0),
  position_size numeric(18,8) not null check (position_size > 0),
  risk_amount   numeric(18,2) check (risk_amount > 0),
  gross_pnl     numeric(18,2),
  commission    numeric(18,2) not null default 0 check (commission >= 0),  -- biaya, >= 0
  fee           numeric(18,2) not null default 0 check (fee >= 0),         -- biaya, >= 0
  swap          numeric(18,2) not null default 0,                          -- bertanda: negatif = biaya

  -- F-01: net_pnl = gross_pnl - commission - fee + swap
  net_pnl       numeric(18,2)
                generated always as (gross_pnl - commission - fee + swap) stored,

  -- F-02: hasil diturunkan dari net_pnl. Rumus diulang karena kolom generated
  -- tidak boleh merujuk kolom generated lain. Konsistensinya diuji di tes SQL.
  result        public.trade_result
                generated always as (
                  case
                    when status = 'closed' and gross_pnl is not null then
                      case
                        when (gross_pnl - commission - fee + swap) > 0 then 'win'::public.trade_result
                        when (gross_pnl - commission - fee + swap) < 0 then 'loss'::public.trade_result
                        else 'breakeven'::public.trade_result
                      end
                  end
                ) stored,

  notes         text check (notes is null or char_length(notes) <= 2000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint trades_account_fk
    foreign key (account_id, user_id)
    references public.trading_accounts (id, user_id)
    deferrable initially deferred,

  -- Hanya kolom strategy_id yang dikosongkan saat strategi dihapus (user_id tetap).
  constraint trades_strategy_fk
    foreign key (strategy_id, user_id)
    references public.strategies (id, user_id)
    on delete set null (strategy_id),

  constraint trades_state_consistency check (
    (status = 'open'
      and closed_at is null and exit_price is null and gross_pnl is null)
    or
    (status = 'closed'
      and closed_at is not null and exit_price is not null and gross_pnl is not null
      and closed_at >= opened_at)
  )
);

comment on table public.cash_transactions is
  'Deposit dan withdraw saja. Tidak pernah dihitung sebagai hasil trading (BR-01).';
comment on table public.trades is
  'Transaksi trading saja. Hasil (win/loss/breakeven) dan net_pnl dihitung database dari gross_pnl dan biaya.';

-- ---------- Index ----------
create index accounts_user_idx            on public.trading_accounts (user_id);
create index cash_account_occurred_idx    on public.cash_transactions (account_id, occurred_at desc);
create index trades_account_closed_idx    on public.trades (account_id, closed_at desc) where status = 'closed';
create index trades_account_opened_idx    on public.trades (account_id, opened_at desc);
create index trades_symbol_idx            on public.trades (account_id, symbol);
create index trades_strategy_idx          on public.trades (strategy_id) where strategy_id is not null;

-- ---------- Trigger updated_at ----------
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.trading_accounts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.strategies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cash_transactions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.trades
  for each row execute function public.set_updated_at();
