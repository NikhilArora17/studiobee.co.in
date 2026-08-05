-- StudioBee Analytics — Supabase Schema
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  sid text,
  page text,
  referrer text,
  duration int default 0,
  country text,
  locale text,
  tz text,
  created_at timestamptz default now()
);

alter table analytics add column if not exists consented boolean not null default false;
alter table analytics add column if not exists city text;
alter table analytics add column if not exists region text;
alter table analytics add column if not exists utm_source text;
alter table analytics add column if not exists utm_medium text;
alter table analytics add column if not exists utm_campaign text;
alter table analytics add column if not exists event_type text not null default 'pageview';
alter table analytics add column if not exists event_label text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analytics_event_type_check'
  ) then
    alter table analytics add constraint analytics_event_type_check
      check (event_type in ('pageview', 'cta_click'));
  end if;
end $$;

-- Contact form submissions (mirrors fields inserted by api/contact.js)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  email text default '',
  phone text default '',
  city text default '',
  message text default '',
  created_at timestamptz default now()
);
