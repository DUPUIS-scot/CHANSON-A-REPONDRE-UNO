create table if not exists public.app_visitors (
  visitor_key uuid not null,
  visit_date date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  primary key (visitor_key, visit_date)
);

alter table public.app_visitors enable row level security;
revoke all on table public.app_visitors from anon, authenticated;

create or replace function public.record_app_visit(p_visitor_key uuid)
returns void
language sql
security definer
set search_path = pg_catalog
as $function$
  insert into public.app_visitors (visitor_key, visit_date)
  values (p_visitor_key, (now() at time zone 'utc')::date)
  on conflict (visitor_key, visit_date) do nothing;
$function$;

create or replace function public.get_app_visitor_stats()
returns table (
  visitors_7_days bigint,
  visitors_90_days bigint,
  visitors_365_days bigint
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select
    count(distinct visitor_key) filter (
      where visit_date >= (now() at time zone 'utc')::date - 6
    ),
    count(distinct visitor_key) filter (
      where visit_date >= (now() at time zone 'utc')::date - 89
    ),
    count(distinct visitor_key) filter (
      where visit_date >= (now() at time zone 'utc')::date - 364
    )
  from public.app_visitors;
$function$;

revoke all on function public.record_app_visit(uuid) from public;
revoke all on function public.get_app_visitor_stats() from public;
grant execute on function public.record_app_visit(uuid) to anon, authenticated;
grant execute on function public.get_app_visitor_stats() to anon, authenticated;
