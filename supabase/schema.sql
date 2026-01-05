-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enum types
create type user_role as enum ('collaborator', 'admin', 'super_admin');
create type user_status as enum ('active', 'on_leave', 'sick_leave', 'personal_emergency', 'terminated', 'collaboration_ended', 'paid_weekly', 'paid_biweekly', 'paid_monthly', 'suspended');
create type period_type as enum ('daily', 'monthly', 'quarterly', 'yearly');
create type schedule_status as enum ('scheduled', 'completed', 'cancelled');
create type payment_type as enum ('weekly', 'biweekly', 'monthly');
create type payment_status as enum ('pending', 'paid', 'failed');

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  address text,
  avatar_url text,
  role user_role default 'collaborator',
  status user_status default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Revenues table
create table revenues (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  date date not null,
  period_type period_type not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedules table
create table schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status schedule_status default 'scheduled',
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments table
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  payment_date date not null,
  payment_type payment_type not null,
  status payment_status default 'pending',
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Status History table
create table status_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  old_status text,
  new_status text,
  changed_by uuid references profiles(id),
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reason text
);

-- RLS Policies

-- Profiles
alter table profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Admins and Super Admins can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "Admins and Super Admins can update profiles" on profiles
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );
  
create policy "Users can update their own avatar" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id); -- Limit what they can update via app logic or separate function if needed

-- Revenues
alter table revenues enable row level security;

create policy "Users can view their own revenues" on revenues
  for select using (auth.uid() = user_id);
  
create policy "Admins can view all revenues" on revenues
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Storage (Buckets need to be created in dashboard, policies here for reference)
-- Bucket: avatars
-- Policy: Give select access to authenticated users
-- Policy: Give insert/update access to users for their own folder/file
