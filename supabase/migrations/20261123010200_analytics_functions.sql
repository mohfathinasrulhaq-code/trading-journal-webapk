-- =====================================================================
-- Phase 02 / Migration 3: fungsi analitik (SATU-SATUNYA sumber rumus)
-- Semua fungsi SECURITY INVOKER sehingga RLS tetap berlaku.
-- Definisi rumus: docs/PHASE_00_PROJECT_PLAN.md Lampiran A (F-01 s.d. F-17).
-- Periode memakai batas setengah-terbuka [p_from, p_to):
--   trade menurut closed_at, kas menurut occurred_at.
--   p_from / p_to NULL = tanpa batas.
-- =====================================================================

-- ---------- F-05: saldo ----------
-- balance = (total deposit - total withdraw) + Σ net_pnl trade closed, kumulatif s.d. p_to.
create function public.get_account_balance(
  p_account_id uuid,
  p_to timestamptz default null
)
returns numeric
language sql
stable
set search_path = ''
as $$
  select
    coalesce((
      select sum(case when ct.type = 'deposit' then ct.amount else -ct.amount end)
      from public.cash_transactions ct
      where ct.account_id = p_account_id
        and (p_to is null or ct.occurred_at < p_to)
    ), 0)
    +
    coalesce((
      select sum(t.net_pnl)
      from public.trades t
      where t.account_id = p_account_id
        and t.status = 'closed'
        and (p_to is null or t.closed_at < p_to)
    ), 0);
$$;

-- ---------- F-14, F-15: equity curve dan drawdown ----------
-- Kurva hanya berisi hasil trading (arus kas tidak ikut).
-- peak_pnl = max(0, cumulative_pnl sampai titik ini)
-- drawdown_abs = peak_pnl - cumulative_pnl
-- drawdown_pct = drawdown_abs / (deposit kumulatif pada waktu peak + peak_pnl) * 100
--   (waktu peak awal = waktu trade pertama pada periode); NULL jika penyebut <= 0.
create function public.get_equity_curve(
  p_account_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  point_no       integer,
  trade_id       uuid,
  closed_at      timestamptz,
  net_pnl        numeric,
  cumulative_pnl numeric,
  peak_pnl       numeric,
  drawdown_abs   numeric,
  drawdown_pct   numeric
)
language sql
stable
set search_path = ''
as $$
  with t as (
    select tr.id, tr.closed_at, tr.net_pnl,
           row_number() over (order by tr.closed_at, tr.created_at, tr.id) as rn
    from public.trades tr
    where tr.account_id = p_account_id
      and tr.status = 'closed'
      and (p_from is null or tr.closed_at >= p_from)
      and (p_to is null or tr.closed_at < p_to)
  ),
  c as (
    select t.*, sum(t.net_pnl) over (order by t.rn) as cum
    from t
  ),
  p as (
    select c.*,
           greatest(0, max(c.cum) over (order by c.rn)) as peak,
           coalesce(
             max(c.cum) over (order by c.rn rows between unbounded preceding and 1 preceding),
             0
           ) as prev_peak_raw
    from c
  ),
  q as (
    select p.*,
           max(case when p.cum > greatest(0, p.prev_peak_raw) then p.closed_at end)
             over (order by p.rn) as peak_closed_at,
           first_value(p.closed_at) over (order by p.rn) as first_closed_at
    from p
  )
  select
    q.rn::integer,
    q.id,
    q.closed_at,
    q.net_pnl,
    q.cum,
    q.peak,
    q.peak - q.cum,
    case when q.peak + d.deposits > 0
         then (q.peak - q.cum) / (q.peak + d.deposits) * 100
    end
  from q
  cross join lateral (
    select coalesce(sum(ct.amount), 0) as deposits
    from public.cash_transactions ct
    where ct.account_id = p_account_id
      and ct.type = 'deposit'
      and ct.occurred_at <= coalesce(q.peak_closed_at, q.first_closed_at)
  ) d
  order by q.rn;
$$;

-- ---------- Ringkasan akun ----------
-- Saldo, total deposit/withdraw, dan trading_pnl: KUMULATIF sejak awal sampai p_to.
-- Metrik kinerja (jumlah, winrate, profit factor, expectancy, avg R, drawdown):
-- hanya trade closed pada periode. Performance Set (F-06) = hasil win atau loss;
-- breakeven hanya dihitung sebagai jumlah.
-- Rasio yang penyebutnya nol dikembalikan NULL (UI menampilkan "N/A").
create function public.get_account_summary(
  p_account_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  currency           char(3),
  total_deposit      numeric,
  total_withdraw     numeric,
  net_deposit        numeric,
  trading_pnl        numeric,
  balance            numeric,
  period_pnl         numeric,
  closed_trades      bigint,
  wins               bigint,
  losses             bigint,
  breakevens         bigint,
  winrate            numeric,
  total_win_amount   numeric,
  total_loss_amount  numeric,
  avg_win            numeric,
  avg_loss           numeric,
  profit_factor      numeric,
  expectancy         numeric,
  avg_r              numeric,
  return_pct         numeric,
  max_drawdown_abs   numeric,
  max_drawdown_pct   numeric
)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_currency char(3);
begin
  select a.currency into v_currency
  from public.trading_accounts a
  where a.id = p_account_id;

  if not found then
    raise exception 'Trading account not found' using errcode = 'P0002';
  end if;

  return query
  with cash as (
    select
      coalesce(sum(ct.amount) filter (where ct.type = 'deposit'), 0)  as dep,
      coalesce(sum(ct.amount) filter (where ct.type = 'withdraw'), 0) as wd
    from public.cash_transactions ct
    where ct.account_id = p_account_id
      and (p_to is null or ct.occurred_at < p_to)
  ),
  tr_all as (
    select coalesce(sum(t.net_pnl), 0) as pnl
    from public.trades t
    where t.account_id = p_account_id
      and t.status = 'closed'
      and (p_to is null or t.closed_at < p_to)
  ),
  per as (
    select
      coalesce(sum(t.net_pnl), 0)                                          as pnl,
      count(*)                                                             as cnt,
      count(*) filter (where t.result = 'win')                             as wins,
      count(*) filter (where t.result = 'loss')                            as losses,
      count(*) filter (where t.result = 'breakeven')                       as bes,
      coalesce(sum(t.net_pnl)  filter (where t.result = 'win'), 0)         as win_amt,
      coalesce(sum(-t.net_pnl) filter (where t.result = 'loss'), 0)        as loss_amt,
      avg(t.net_pnl / t.risk_amount)
        filter (where t.result in ('win', 'loss') and t.risk_amount is not null) as avg_r
    from public.trades t
    where t.account_id = p_account_id
      and t.status = 'closed'
      and (p_from is null or t.closed_at >= p_from)
      and (p_to is null or t.closed_at < p_to)
  ),
  dd as (
    select max(e.drawdown_abs) as dd_abs, max(e.drawdown_pct) as dd_pct
    from public.get_equity_curve(p_account_id, p_from, p_to) e
  )
  select
    v_currency,
    cash.dep,
    cash.wd,
    cash.dep - cash.wd,
    tr_all.pnl,
    cash.dep - cash.wd + tr_all.pnl,
    per.pnl,
    per.cnt,
    per.wins,
    per.losses,
    per.bes,
    case when per.wins + per.losses > 0
         then per.wins::numeric / (per.wins + per.losses) * 100 end,
    per.win_amt,
    per.loss_amt,
    case when per.wins > 0   then per.win_amt  / per.wins   end,
    case when per.losses > 0 then per.loss_amt / per.losses end,
    case when per.loss_amt > 0 then per.win_amt / per.loss_amt end,
    case when per.wins + per.losses > 0
         then (per.win_amt - per.loss_amt) / (per.wins + per.losses) end,
    per.avg_r,
    case when cash.dep > 0 then tr_all.pnl / cash.dep * 100 end,
    dd.dd_abs,
    dd.dd_pct
  from cash, tr_all, per, dd;
end;
$$;

-- ---------- Kurva saldo harian (menyertakan arus kas, dipisah per jenis) ----------
-- Satu baris per hari lokal (zona waktu p_tz) yang memiliki aktivitas pada periode.
-- balance = saldo akhir hari (kumulatif sejak awal).
create function public.get_balance_curve(
  p_account_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_tz text default 'UTC'
)
returns table (
  day         date,
  cash_flow   numeric,
  trading_pnl numeric,
  balance     numeric
)
language sql
stable
set search_path = ''
as $$
  with ev as (
    select ct.occurred_at as ts,
           (ct.occurred_at at time zone p_tz)::date as d,
           'cash'::text as kind,
           case when ct.type = 'deposit' then ct.amount else -ct.amount end as amt
    from public.cash_transactions ct
    where ct.account_id = p_account_id
    union all
    select t.closed_at,
           (t.closed_at at time zone p_tz)::date,
           'trade'::text,
           t.net_pnl
    from public.trades t
    where t.account_id = p_account_id
      and t.status = 'closed'
  ),
  daily as (
    select ev.d,
           coalesce(sum(ev.amt) filter (where ev.kind = 'cash'), 0)  as cash_flow,
           coalesce(sum(ev.amt) filter (where ev.kind = 'trade'), 0) as trading_pnl
    from ev
    where (p_from is null or ev.ts >= p_from)
      and (p_to is null or ev.ts < p_to)
    group by ev.d
  ),
  opening as (
    select coalesce(sum(ev.amt), 0) as amt
    from ev
    where p_from is not null and ev.ts < p_from
  )
  select
    daily.d,
    daily.cash_flow,
    daily.trading_pnl,
    opening.amt + sum(daily.cash_flow + daily.trading_pnl) over (order by daily.d)
  from daily
  cross join opening
  order by daily.d;
$$;

-- ---------- Kinerja per bulan (hari/bulan menurut zona waktu p_tz) ----------
create function public.get_monthly_performance(
  p_account_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_tz text default 'UTC'
)
returns table (
  month_start   date,
  closed_trades bigint,
  wins          bigint,
  losses        bigint,
  breakevens    bigint,
  net_pnl       numeric,
  winrate       numeric
)
language sql
stable
set search_path = ''
as $$
  select
    date_trunc('month', t.closed_at at time zone p_tz)::date,
    count(*),
    count(*) filter (where t.result = 'win'),
    count(*) filter (where t.result = 'loss'),
    count(*) filter (where t.result = 'breakeven'),
    sum(t.net_pnl),
    case when count(*) filter (where t.result in ('win', 'loss')) > 0
         then (count(*) filter (where t.result = 'win'))::numeric
              / (count(*) filter (where t.result in ('win', 'loss'))) * 100
    end
  from public.trades t
  where t.account_id = p_account_id
    and t.status = 'closed'
    and (p_from is null or t.closed_at >= p_from)
    and (p_to is null or t.closed_at < p_to)
  group by 1
  order by 1;
$$;

-- ---------- Kinerja per simbol ----------
create function public.get_symbol_performance(
  p_account_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  symbol        text,
  closed_trades bigint,
  wins          bigint,
  losses        bigint,
  breakevens    bigint,
  net_pnl       numeric,
  winrate       numeric
)
language sql
stable
set search_path = ''
as $$
  select
    t.symbol,
    count(*),
    count(*) filter (where t.result = 'win'),
    count(*) filter (where t.result = 'loss'),
    count(*) filter (where t.result = 'breakeven'),
    sum(t.net_pnl),
    case when count(*) filter (where t.result in ('win', 'loss')) > 0
         then (count(*) filter (where t.result = 'win'))::numeric
              / (count(*) filter (where t.result in ('win', 'loss'))) * 100
    end
  from public.trades t
  where t.account_id = p_account_id
    and t.status = 'closed'
    and (p_from is null or t.closed_at >= p_from)
    and (p_to is null or t.closed_at < p_to)
  group by t.symbol
  order by sum(t.net_pnl) desc, t.symbol;
$$;

-- ---------- Hak eksekusi: hanya pengguna login ----------
revoke all on function public.get_account_balance(uuid, timestamptz)                    from public, anon;
revoke all on function public.get_equity_curve(uuid, timestamptz, timestamptz)          from public, anon;
revoke all on function public.get_account_summary(uuid, timestamptz, timestamptz)       from public, anon;
revoke all on function public.get_balance_curve(uuid, timestamptz, timestamptz, text)   from public, anon;
revoke all on function public.get_monthly_performance(uuid, timestamptz, timestamptz, text) from public, anon;
revoke all on function public.get_symbol_performance(uuid, timestamptz, timestamptz)    from public, anon;

grant execute on function public.get_account_balance(uuid, timestamptz)                    to authenticated;
grant execute on function public.get_equity_curve(uuid, timestamptz, timestamptz)          to authenticated;
grant execute on function public.get_account_summary(uuid, timestamptz, timestamptz)       to authenticated;
grant execute on function public.get_balance_curve(uuid, timestamptz, timestamptz, text)   to authenticated;
grant execute on function public.get_monthly_performance(uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.get_symbol_performance(uuid, timestamptz, timestamptz)    to authenticated;
