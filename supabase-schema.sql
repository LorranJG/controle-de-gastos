create table if not exists public.transactions (
  id text primary key,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null,
  category text not null,
  movement_type text,
  payment_method text,
  entered_by text,
  source text,
  import_batch_id text,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists movement_type text,
  add column if not exists payment_method text,
  add column if not exists entered_by text,
  add column if not exists source text,
  add column if not exists import_batch_id text;

update public.transactions
set movement_type = case when amount >= 0 then 'income' else 'expense' end
where movement_type is null;

update public.transactions
set source = 'manual'
where source is null;

create table if not exists public.goals (
  category text primary key,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.named_goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key,
  default_entered_by text,
  default_payment_method text,
  default_period_preset text not null default 'month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, default_period_preset)
values (1, 'month')
on conflict (id) do nothing;

alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.named_goals enable row level security;
alter table public.app_settings enable row level security;
