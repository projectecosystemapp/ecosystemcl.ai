-- ECOSYSTEMCL.AI V3 Autonomic Architecture - Persistent Units & Monitoring
-- Creates tables to support persistent cognitive units, their state, metrics,
-- and monitoring subscriptions. Adds bidding power column to jobs.

-- Persistent Cognitive Units (per user, per unit type)
create table if not exists public.cognitive_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  unit_type text not null, -- e.g., 'code_generator', 'security', 'orchestrator'
  status text not null default 'active', -- active|paused|error
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Continuous state snapshots for units (latest row is current)
create table if not exists public.cognitive_unit_state (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.cognitive_units(id) on delete cascade,
  version integer not null default 1,
  state jsonb not null default '{}'::jsonb,
  last_updated_at timestamptz not null default now()
);

-- Runtime and learning metrics per unit
create table if not exists public.cognitive_unit_metrics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.cognitive_units(id) on delete cascade,
  jobs_completed integer not null default 0,
  success_rate numeric not null default 0,
  avg_latency_ms integer not null default 0,
  last_job_at timestamptz,
  custom_metrics jsonb not null default '{}'::jsonb
);

-- Monitoring subscriptions for deployed resources
create table if not exists public.monitoring_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  resource_arn text not null,
  logs_group_name text,
  provider text not null default 'aws',
  status text not null default 'active', -- active|paused|error
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add bidding power to jobs for dynamic resource economy
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'bid_power'
  ) then
    alter table public.jobs add column bid_power numeric not null default 0;
  end if;
exception when others then
  -- ignore if table doesn't exist in this environment
  null;
end $$;

-- Updated at trigger for cognitive_units
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cognitive_units_updated_at on public.cognitive_units;
create trigger trg_cognitive_units_updated_at
before update on public.cognitive_units
for each row execute procedure public.set_updated_at();

