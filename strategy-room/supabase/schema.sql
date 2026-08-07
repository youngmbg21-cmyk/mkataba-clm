-- =====================================================================
-- HaTi Strategy Room — database schema
--
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor ->
-- New query -> paste -> Run). It is safe to re-run: every statement is
-- guarded with "if not exists" or "create or replace".
--
-- What it creates:
--   * one shared workspace that both partners edit
--   * a table per part of the model (prices, costs, growth, people...)
--   * an automatic edit history: who changed which number, when,
--     and from what to what
--   * a log of every copilot question and answer
--   * security rules so only workspace members can read or write
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Confidence tag: A = Assumed, E = Estimated, V = Verified
-- ---------------------------------------------------------------------
do $$ begin
  create domain confidence as char(1) check (value in ('A', 'E', 'V'));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Workspace + membership
-- ---------------------------------------------------------------------
create table if not exists workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'HaTi',
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text,
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------------------------------------------------------------------
-- Whole-business settings (one row per workspace)
-- ---------------------------------------------------------------------
create table if not exists settings (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null unique references workspaces(id) on delete cascade,
  fx                numeric not null default 13.5,   -- KES per 1 SEK
  fx_conf           confidence not null default 'A',
  target_arr        numeric not null default 3000000,
  target_arr_conf   confidence not null default 'A',
  target_month      numeric not null default 24,
  target_month_conf confidence not null default 'A',
  cash              numeric not null default 250000,
  cash_conf         confidence not null default 'V',
  buffer            numeric not null default 150000,
  buffer_conf       confidence not null default 'A',
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Per-market growth assumptions (one row per market, per workspace)
-- ---------------------------------------------------------------------
create table if not exists markets (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  code           text not null check (code in ('SE', 'KE')),
  name           text not null,
  start_customers numeric not null default 0,
  start_conf     confidence not null default 'V',
  new_per_month  numeric not null default 2,
  new_per_conf   confidence not null default 'A',
  churn          numeric not null default 2,          -- % per month
  churn_conf     confidence not null default 'A',
  cac            numeric not null default 9000,       -- in the market's own currency
  cac_conf       confidence not null default 'A',
  mix_ess        numeric not null default 50,
  mix_ess_conf   confidence not null default 'A',
  mix_pro        numeric not null default 40,
  mix_pro_conf   confidence not null default 'A',
  mix_ent        numeric not null default 10,
  mix_ent_conf   confidence not null default 'A',
  unique (workspace_id, code)
);

-- ---------------------------------------------------------------------
-- Prices per tier, per market
-- ---------------------------------------------------------------------
create table if not exists tiers (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tier_key     text not null check (tier_key in ('ess', 'pro', 'ent')),
  name         text not null,
  price_se     numeric not null default 0,   -- SEK / month
  price_se_conf confidence not null default 'A',
  price_ke     numeric not null default 0,   -- KES / month
  price_ke_conf confidence not null default 'A',
  sort         int not null default 0,
  unique (workspace_id, tier_key)
);

-- ---------------------------------------------------------------------
-- What sits in each tier (the upgrade fence)
-- ---------------------------------------------------------------------
create table if not exists features (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  ess          boolean not null default false,
  pro          boolean not null default false,
  ent          boolean not null default false,
  sort         int not null default 0
);

-- ---------------------------------------------------------------------
-- Costs: 'fixed' = per month regardless of customers
--        'variable' = per paying customer per month
-- ---------------------------------------------------------------------
create table if not exists costs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind         text not null check (kind in ('fixed', 'variable')),
  name         text not null,
  value        numeric not null default 0,   -- SEK
  confidence   confidence not null default 'A',
  sort         int not null default 0
);

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
create table if not exists roles (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null default 'New role',
  market       text not null default 'SE' check (market in ('SE', 'KE')),
  cost         numeric not null default 0,   -- SEK / month
  start_month  int not null default 12,
  sort         int not null default 0
);

-- ---------------------------------------------------------------------
-- Evidence log — what a real prospect actually said
-- ---------------------------------------------------------------------
create table if not exists evidence (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  who          text not null default '',
  market       text not null default 'SE' check (market in ('SE', 'KE')),
  said         text not null default '',
  affects      text not null default '',
  source       text not null default 'manual',  -- 'manual' | 'torque-os' later
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

-- ---------------------------------------------------------------------
-- Saved scenarios — a frozen copy of the prices plus the headline result
-- ---------------------------------------------------------------------
create table if not exists scenarios (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  snapshot        jsonb not null,
  revenue_month24 numeric,
  breakeven_month int,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

-- ---------------------------------------------------------------------
-- Every copilot question and answer, kept so you can look back at what
-- advice you were given and whether it held up.
-- ---------------------------------------------------------------------
create table if not exists copilot_log (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  question     text not null,
  briefing     text not null,   -- exactly what the model was told
  answer       text,
  model        text,
  error        text,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

-- ---------------------------------------------------------------------
-- Edit history — filled in automatically by the trigger below
-- ---------------------------------------------------------------------
create table if not exists change_log (
  id           bigserial primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  table_name   text not null,
  row_id       uuid,
  row_label    text,
  field        text not null,
  old_value    text,
  new_value    text,
  operation    text not null,
  changed_by   uuid references auth.users(id),
  changed_at   timestamptz not null default now()
);

create index if not exists change_log_workspace_time
  on change_log (workspace_id, changed_at desc);

-- =====================================================================
-- The history trigger.
--
-- On any insert, update or delete it writes one row per changed field
-- into change_log. Bookkeeping columns are skipped so the history stays
-- readable.
-- =====================================================================
create or replace function log_model_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ws      uuid;
  k       text;
  oldj    jsonb;
  newj    jsonb;
  ov      text;
  nv      text;
  label   text;
  skipped text[] := array['id', 'workspace_id', 'updated_at', 'created_at', 'created_by', 'sort'];
begin
  ws := coalesce(
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'workspace_id')
         else (to_jsonb(new) ->> 'workspace_id') end,
    null
  )::uuid;

  if tg_op = 'UPDATE' then
    oldj := to_jsonb(old);
    newj := to_jsonb(new);
    label := coalesce(newj ->> 'name', newj ->> 'tier_key', newj ->> 'code', tg_table_name);
    for k in select jsonb_object_keys(newj) loop
      if k = any(skipped) then continue; end if;
      ov := oldj ->> k;
      nv := newj ->> k;
      if ov is distinct from nv then
        insert into change_log (workspace_id, table_name, row_id, row_label,
                                field, old_value, new_value, operation, changed_by)
        values (ws, tg_table_name, (newj ->> 'id')::uuid, label,
                k, ov, nv, 'update', auth.uid());
      end if;
    end loop;
    return new;

  elsif tg_op = 'INSERT' then
    newj := to_jsonb(new);
    label := coalesce(newj ->> 'name', newj ->> 'tier_key', newj ->> 'code', tg_table_name);
    insert into change_log (workspace_id, table_name, row_id, row_label,
                            field, old_value, new_value, operation, changed_by)
    values (ws, tg_table_name, (newj ->> 'id')::uuid, label,
            '(row)', null, 'added', 'insert', auth.uid());
    return new;

  else -- DELETE
    oldj := to_jsonb(old);
    label := coalesce(oldj ->> 'name', oldj ->> 'tier_key', oldj ->> 'code', tg_table_name);
    insert into change_log (workspace_id, table_name, row_id, row_label,
                            field, old_value, new_value, operation, changed_by)
    values (ws, tg_table_name, (oldj ->> 'id')::uuid, label,
            '(row)', 'existed', null, 'delete', auth.uid());
    return old;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['settings', 'markets', 'tiers', 'features',
                           'costs', 'roles', 'evidence', 'scenarios']
  loop
    execute format('drop trigger if exists %I_history on %I', t, t);
    execute format(
      'create trigger %I_history after insert or update or delete on %I
       for each row execute function log_model_change()', t, t);
  end loop;
end $$;

-- =====================================================================
-- Security. Only members of a workspace can see or change its data.
-- =====================================================================

-- Helper: is the signed-in user a member of this workspace?
-- SECURITY DEFINER so it can read workspace_members without tripping
-- that table's own policy (which would recurse).
create or replace function is_member(ws uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['settings', 'markets', 'tiers', 'features', 'costs',
                           'roles', 'evidence', 'scenarios', 'copilot_log', 'change_log']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists members_all on %I', t);
    execute format(
      'create policy members_all on %I for all
         using (is_member(workspace_id))
         with check (is_member(workspace_id))', t);
  end loop;
end $$;

alter table workspaces enable row level security;
drop policy if exists members_read on workspaces;
create policy members_read on workspaces for select using (is_member(id));

alter table workspace_members enable row level security;
drop policy if exists members_read_own on workspace_members;
create policy members_read_own on workspace_members for select
  using (is_member(workspace_id));

-- The edit history and the copilot log are records. They must not shift
-- under a reader, so nobody can change or delete them.
drop policy if exists members_all on change_log;
create policy history_read on change_log for select using (is_member(workspace_id));
create policy history_write on change_log for insert with check (is_member(workspace_id));

drop policy if exists members_all on copilot_log;
create policy copilot_read on copilot_log for select using (is_member(workspace_id));
create policy copilot_write on copilot_log for insert with check (is_member(workspace_id));

-- Realtime: both partners see each other's edits without refreshing.
do $$
declare t text;
begin
  foreach t in array array['settings', 'markets', 'tiers', 'features', 'costs',
                           'roles', 'evidence', 'scenarios', 'change_log']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- Seed. Creates the workspace and fills it with the starting numbers
-- from the skeleton. Every one of them is tagged Assumed or Estimated —
-- that is the point.
--
-- Run this AFTER both people have signed in at least once, so their
-- accounts exist. It adds every existing user to the workspace.
-- =====================================================================
create or replace function seed_workspace(ws_name text default 'HaTi')
returns uuid language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  select id into ws from workspaces where name = ws_name;
  if ws is not null then
    raise notice 'Workspace already exists, skipping seed.';
    return ws;
  end if;

  insert into workspaces (name) values (ws_name) returning id into ws;

  insert into workspace_members (workspace_id, user_id, display_name)
    select ws, u.id, coalesce(u.email, 'member') from auth.users u
    on conflict do nothing;

  insert into settings (workspace_id) values (ws);

  insert into markets (workspace_id, code, name, new_per_month, churn, cac,
                       mix_ess, mix_pro, mix_ent) values
    (ws, 'SE', 'Sweden', 2, 2, 9000, 50, 40, 10),
    (ws, 'KE', 'Kenya',  3, 4, 2500, 70, 25,  5);

  insert into tiers (workspace_id, tier_key, name, price_se, price_ke, sort) values
    (ws, 'ess', 'Essentials',    2900, 12000, 1),
    (ws, 'pro', 'Professional',  7900, 35000, 2),
    (ws, 'ent', 'Enterprise',   18000, 90000, 3);

  insert into features (workspace_id, name, ess, pro, ent, sort) values
    (ws, 'Contract storage & search',                      true,  true,  true,  1),
    (ws, 'Template library',                               true,  true,  true,  2),
    (ws, 'Renewal & deadline alerts',                      true,  true,  true,  3),
    (ws, 'AI Copilot — clause review',                     false, true,  true,  4),
    (ws, 'AI Copilot — risk verdicts with citations',      false, true,  true,  5),
    (ws, 'Bilingual English / Swedish',                    false, true,  true,  6),
    (ws, 'Approval workflows',                             false, true,  true,  7),
    (ws, 'Supplier contract intelligence (ClearTerms)',    false, false, true,  8),
    (ws, 'Single sign-on & audit trail',                   false, false, true,  9),
    (ws, 'Named support contact',                          false, false, true, 10);

  insert into costs (workspace_id, kind, name, value, confidence, sort) values
    (ws, 'fixed',    'Hosting & database',            1200, 'E', 1),
    (ws, 'fixed',    'Claude API — platform baseline', 2500, 'A', 2),
    (ws, 'fixed',    'Tools & subscriptions',          1500, 'E', 3),
    (ws, 'fixed',    'Accounting, legal, insurance',   2500, 'A', 4),
    (ws, 'fixed',    'Marketing & content',            3000, 'A', 5),
    (ws, 'variable', 'Claude API per customer',         180, 'A', 1),
    (ws, 'variable', 'Support time per customer',       250, 'A', 2),
    (ws, 'variable', 'Payments & bank fees',             60, 'E', 3);

  insert into roles (workspace_id, name, market, cost, start_month, sort) values
    (ws, 'Founder (you) — part time', 'SE', 0, 1, 1),
    (ws, 'Partner — part time',       'SE', 0, 1, 2);

  return ws;
end $$;

-- =====================================================================
-- Add a second person to the workspace after they have signed in once:
--
--   select add_member('partner@example.com');
-- =====================================================================
create or replace function add_member(member_email text)
returns text language plpgsql security definer set search_path = public as $$
declare ws uuid; uid uuid;
begin
  select id into ws from workspaces order by created_at limit 1;
  if ws is null then return 'No workspace yet — run: select seed_workspace();'; end if;

  select id into uid from auth.users where lower(email) = lower(member_email);
  if uid is null then
    return member_email || ' has not signed in yet. Ask them to sign in once, then run this again.';
  end if;

  insert into workspace_members (workspace_id, user_id, display_name)
  values (ws, uid, member_email)
  on conflict (workspace_id, user_id) do nothing;

  return member_email || ' added to the workspace.';
end $$;
