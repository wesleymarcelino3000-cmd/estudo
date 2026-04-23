create extension if not exists pgcrypto;

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_key text not null,
  book text not null,
  chapter integer not null,
  verse integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, verse_key)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_key text not null,
  book text not null,
  chapter integer not null,
  verse integer not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, verse_key)
);

create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_index integer not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, day_index)
);

alter table public.favorites enable row level security;
alter table public.notes enable row level security;
alter table public.reading_progress enable row level security;

create policy "favorites_select_own" on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites_update_own" on public.favorites for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites for delete to authenticated using (auth.uid() = user_id);

create policy "notes_select_own" on public.notes for select to authenticated using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert to authenticated with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes for delete to authenticated using (auth.uid() = user_id);

create policy "progress_select_own" on public.reading_progress for select to authenticated using (auth.uid() = user_id);
create policy "progress_insert_own" on public.reading_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "progress_update_own" on public.reading_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_delete_own" on public.reading_progress for delete to authenticated using (auth.uid() = user_id);
