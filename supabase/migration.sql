-- Zunoora: Teachers + Shablons schema
-- Run this in Supabase SQL Editor

-- 1. Teachers (users/staff)
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age integer,
  subject text,
  classes text[] default '{}',
  phone text,
  email text,
  school text,
  position text,
  extra_info jsonb default '{}',
  created_at timestamptz default now()
);

-- Enable Row-Level Security
alter table teachers enable row level security;

-- Allow authenticated users to read teachers
create policy "Teachers are readable by authenticated users"
  on teachers for select
  to authenticated
  using (true);

-- Allow authenticated users to insert/update teachers
create policy "Teachers are insertable by authenticated users"
  on teachers for insert
  to authenticated
  with check (true);

create policy "Teachers are updatable by authenticated users"
  on teachers for update
  to authenticated
  using (true);

-- 2. Shablons (document templates)
create table if not exists shablons (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  label text not null,
  description text,
  keywords text[] default '{}',
  schema jsonb not null default '{"required":[],"optional":[]}',
  template text not null,
  created_at timestamptz default now()
);

alter table shablons enable row level security;

create policy "Shablons are readable by authenticated users"
  on shablons for select
  to authenticated
  using (true);

create policy "Shablons are insertable by authenticated users"
  on shablons for insert
  to authenticated
  with check (true);

-- 3. Chat sessions (optional, for persisting chat history server-side)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  title text not null default 'New Chat',
  messages jsonb default '[]',
  documents jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table chat_sessions enable row level security;

create policy "Users can CRUD their own chat sessions"
  on chat_sessions for all
  to authenticated
  using (teacher_id = auth.uid() OR teacher_id IS NULL)
  with check (true);
