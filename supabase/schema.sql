-- Run this once in Supabase dashboard > SQL Editor.

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  amount numeric not null check (amount > 0),
  category text not null,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  notes text,
  date timestamptz not null default now(),
  receipt_path text,
  mpesa_code text,
  updated_at timestamptz not null default now()
);

-- Safe to re-run on a database created before the M-Pesa import existed.
alter table public.expenses add column if not exists mpesa_code text;
alter table public.expenses add column if not exists kind text not null default 'expense';
alter table public.expenses add column if not exists notes text;

create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
create unique index if not exists expenses_user_mpesa_code_idx
  on public.expenses (user_id, mpesa_code) where mpesa_code is not null;

alter table public.expenses enable row level security;

create policy "Users read own expenses" on public.expenses
  for select using (auth.uid() = user_id);
create policy "Users insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "Users update own expenses" on public.expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at
  before update on public.expenses
  for each row execute function public.touch_updated_at();

-- Private bucket for receipt photos. Files live under "<user id>/...".
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Users read own receipts" on storage.objects
  for select using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users upload own receipts" on storage.objects
  for insert with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own receipts" on storage.objects
  for delete using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
