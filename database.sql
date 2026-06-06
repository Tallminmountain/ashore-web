-- ========================================
-- Ashore 上岸计划 · Supabase 数据库建表
-- 在 Supabase 控制台 → SQL Editor 里执行
-- ========================================

-- 1. 用户资料表（扩展 Supabase Auth）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  nickname text default '',
  created_at timestamptz default now()
);

-- 新用户注册自动创建 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. 任务表
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text default 'general',
  subject text default '',
  estimated_minutes int default 30,
  completed boolean default false,
  actual_seconds int default 0,
  task_date date default current_date,
  created_at timestamptz default now()
);

-- 3. 学习日志表
create table if not exists public.study_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text default 'general',
  subject text default '',
  seconds int not null,
  log_date date default current_date,
  created_at timestamptz default now()
);

-- 4. 番茄钟日志表
create table if not exists public.pomodoro_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  duration int not null,
  completed boolean default false,
  log_date date default current_date,
  created_at timestamptz default now()
);

-- 5. 考研计划表
create table if not exists public.exam_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id text not null,
  title text not null,
  completed boolean default false,
  task_date date default current_date,
  created_at timestamptz default now()
);

-- 6. 雅思计划表
create table if not exists public.ielts_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  skill_id text not null,
  title text not null,
  completed boolean default false,
  task_date date default current_date,
  created_at timestamptz default now()
);

-- 7. 用户设置表
create table if not exists public.user_settings (
  user_id uuid references auth.users on delete cascade primary key,
  exam_date date default '2026-12-20',
  ielts_exam_date date default '2026-09-15',
  ielts_target numeric(3,1) default 7.0,
  pomodoro_focus int default 25,
  pomodoro_break int default 5,
  pomodoro_long_break int default 15,
  pomodoro_long_break_interval int default 4
);

-- ========================================
-- 行级安全策略（RLS）— 每个用户只能看自己的数据
-- ========================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.study_logs enable row level security;
alter table public.pomodoro_logs enable row level security;
alter table public.exam_tasks enable row level security;
alter table public.ielts_tasks enable row level security;
alter table public.user_settings enable row level security;

-- profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- tasks
create policy "Users can manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- study_logs
create policy "Users can manage own study logs" on public.study_logs
  for all using (auth.uid() = user_id);

-- pomodoro_logs
create policy "Users can manage own pomodoro logs" on public.pomodoro_logs
  for all using (auth.uid() = user_id);

-- exam_tasks
create policy "Users can manage own exam tasks" on public.exam_tasks
  for all using (auth.uid() = user_id);

-- ielts_tasks
create policy "Users can manage own ielts tasks" on public.ielts_tasks
  for all using (auth.uid() = user_id);

-- user_settings
create policy "Users can manage own settings" on public.user_settings
  for all using (auth.uid() = user_id);
