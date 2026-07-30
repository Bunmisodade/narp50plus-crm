-- Cooperative CRM — multi-tenant schema
-- Every table below carries cooperative_id so one Supabase project can serve
-- many cooperatives (NARP50+ is the first row in `cooperatives`).

create extension if not exists "uuid-ossp";

create table cooperatives (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,               -- e.g. 'narp50plus'
  created_at timestamptz default now()
);

-- Extends Supabase's built-in auth.users with a cooperative + role
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cooperative_id uuid references cooperatives(id) not null,
  role text not null default 'admin',      -- 'admin' | 'staff'
  full_name text,
  created_at timestamptz default now()
);

create table members (
  id uuid primary key default uuid_generate_v4(),
  cooperative_id uuid references cooperatives(id) not null,
  member_no text not null,                 -- e.g. 'NARP-0001', unique per cooperative
  name text not null,
  phone text,
  email text,
  join_date date,
  dues numeric default 0,
  last_payment date,
  renewal_date date,
  qbo_account_ref text,                    -- QuickBooks account ID once linked
  qbo_linked boolean default false,
  created_at timestamptz default now(),
  unique (cooperative_id, member_no)
);

create table member_notes (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade not null,
  cooperative_id uuid references cooperatives(id) not null,
  note_date date default current_date,
  text text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Row-level security: every table scoped to the caller's own cooperative
alter table cooperatives enable row level security;
alter table profiles enable row level security;
alter table members enable row level security;
alter table member_notes enable row level security;

create policy "own cooperative only" on profiles
  for select using (id = auth.uid());

create policy "read own cooperative" on cooperatives
  for select using (id in (select cooperative_id from profiles where id = auth.uid()));

create policy "members scoped to cooperative" on members
  for all using (cooperative_id in (select cooperative_id from profiles where id = auth.uid()))
  with check (cooperative_id in (select cooperative_id from profiles where id = auth.uid()));

create policy "notes scoped to cooperative" on member_notes
  for all using (cooperative_id in (select cooperative_id from profiles where id = auth.uid()))
  with check (cooperative_id in (select cooperative_id from profiles where id = auth.uid()));

-- Seed: NARP50+ as the first cooperative (tenant #1)
insert into cooperatives (name, slug) values ('NARP50+ Cooperative Society', 'narp50plus');
