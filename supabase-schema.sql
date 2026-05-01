create table if not exists public.transactions (
  id text primary key,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  category text primary key,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.goals enable row level security;
