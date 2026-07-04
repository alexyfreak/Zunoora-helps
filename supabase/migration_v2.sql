-- Zunoora Phase 2: Schools, Directors, Classes, Pupils, Documents
-- Run this AFTER migration.sql in Supabase SQL Editor

-- 1. Schools
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  phone text,
  director_id uuid,
  created_at timestamptz default now()
);

alter table schools enable row level security;

create policy "Schools are readable by authenticated users"
  on schools for select to authenticated using (true);

create policy "Schools are insertable by authenticated users"
  on schools for insert to authenticated with check (true);

create policy "Schools are updatable by authenticated users"
  on schools for update to authenticated using (true);

-- 2. Directors
create table if not exists directors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  school_id uuid references schools(id) on delete set null,
  phone text,
  email text unique,
  position text default 'Direktor',
  created_at timestamptz default now()
);

alter table directors enable row level security;

create policy "Directors are readable by authenticated users"
  on directors for select to authenticated using (true);

create policy "Directors are insertable by authenticated users"
  on directors for insert to authenticated with check (true);

create policy "Directors are updatable by authenticated users"
  on directors for update to authenticated using (true);

-- 3. Classes
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school_id uuid references schools(id) on delete cascade,
  form_teacher_id uuid references teachers(id) on delete set null,
  academic_year text,
  unique(name, school_id, academic_year)
);

alter table classes enable row level security;

create policy "Classes are readable by authenticated users"
  on classes for select to authenticated using (true);

create policy "Classes are insertable by authenticated users"
  on classes for insert to authenticated with check (true);

create policy "Classes are updatable by authenticated users"
  on classes for update to authenticated using (true);

-- 4. Pupils
create table if not exists pupils (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_id uuid references classes(id) on delete set null,
  parent_name text,
  parent_phone text,
  created_at timestamptz default now()
);

alter table pupils enable row level security;

create policy "Pupils are readable by authenticated users"
  on pupils for select to authenticated using (true);

create policy "Pupils are insertable by authenticated users"
  on pupils for insert to authenticated with check (true);

create policy "Pupils are updatable by authenticated users"
  on pupils for update to authenticated using (true);

-- 5. Documents (replaces localStorage)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  shablon_id uuid references shablons(id) on delete set null,
  title text,
  content text,
  fields_used jsonb,
  created_at timestamptz default now()
);

alter table documents enable row level security;

create policy "Documents are readable by authenticated users"
  on documents for select to authenticated using (true);

create policy "Documents are insertable by authenticated users"
  on documents for insert to authenticated with check (true);

create policy "Documents are updatable by authenticated users"
  on documents for update to authenticated using (true);

-- 6. Add school_id to teachers
alter table teachers add column if not exists school_id uuid references schools(id) on delete set null;

-- 7. Seed: Extract distinct schools from teachers
insert into schools (name)
select distinct school from teachers where school is not null and school != '';

-- 8. Seed: Create directors from existing teachers with position='Direktor'
insert into directors (full_name, phone, email, position, school_id)
select t.full_name, t.phone, t.email, t.position, s.id
from teachers t
join schools s on s.name = t.school
where t.position = 'Direktor';

-- Link schools to their directors
update schools s
set director_id = d.id
from directors d
where d.school_id = s.id;

-- 9. Seed: Update teachers with school_id
update teachers t
set school_id = s.id
from schools s
where s.name = t.school;

-- 10. Remove directors from teachers table (they're now in directors table)
delete from teachers where position = 'Direktor';
