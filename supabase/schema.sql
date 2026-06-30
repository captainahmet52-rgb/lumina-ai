-- ════════════════════════════════════════════════════════════════════
--  Lumina AI — Creator Studio · Supabase schema (spec §5)
--  Run this in the Supabase SQL editor (or via the CLI) once per project.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────── PROFILES ───────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free',                 -- 'free' | 'pro'
  credits int default 3,                     -- free kullanıcı için
  subscription_status text default 'inactive',
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- ─────────────────────────────── GENERATIONS ────────────────────────
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  product_image_url text not null,
  prompt text not null,
  style_preset text default 'cinematic_studio',
  aspect_ratio text default '1:1',           -- '1:1' | '16:9' | '9:16'
  status text default 'pending',             -- pending | processing | completed | failed
  video_url text,
  image_urls jsonb,                          -- varyasyon görselleri []
  metadata jsonb,                            -- { model, creativity, seed }
  error text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists generations_user_id_created_at_idx
  on generations (user_id, created_at desc);

-- ─────────────────────────────── RLS ────────────────────────────────
alter table profiles enable row level security;
alter table generations enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (auth.uid() = id);

drop policy if exists "own generations select" on generations;
create policy "own generations select" on generations
  for select using (auth.uid() = user_id);

drop policy if exists "own generations insert" on generations;
create policy "own generations insert" on generations
  for insert with check (auth.uid() = user_id);

-- NOTE: There is intentionally NO update/delete policy for generations.
-- Status / result updates are written by the callback route using the
-- service-role key (which bypasses RLS). See spec §7.2.

-- ───────────────── New user → profile otomatik (trigger) ────────────
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────── Realtime (frontend status dinler) ────────────────
-- generations tablosunda replication açık olsun (spec §5).
alter publication supabase_realtime add table generations;

-- ════════════════════════════════════════════════════════════════════
--  STORAGE BUCKETS (spec §5)
--  Bucket'ları Dashboard > Storage'dan da oluşturabilirsin. Aşağıdaki
--  SQL bunları idempotent şekilde kurar.
-- ════════════════════════════════════════════════════════════════════

-- products: public read, kullanıcı ürün görselleri
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- outputs (opsiyonel): webhook çıktıları burada saklanacaksa
insert into storage.buckets (id, name, public)
values ('outputs', 'outputs', true)
on conflict (id) do nothing;

-- characters: UGC video karakterleri (public read)
insert into storage.buckets (id, name, public)
values ('characters', 'characters', true)
on conflict (id) do nothing;

-- products bucket policies: herkes okuyabilir, sadece sahibi kendi
-- klasörüne yükleyebilir (path prefix = auth.uid()).
drop policy if exists "products public read" on storage.objects;
create policy "products public read" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "products owner upload" on storage.objects;
create policy "products owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'products'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "products owner update" on storage.objects;
create policy "products owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'products'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "products owner delete" on storage.objects;
create policy "products owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'products'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- outputs bucket: public read
drop policy if exists "outputs public read" on storage.objects;
create policy "outputs public read" on storage.objects
  for select using (bucket_id = 'outputs');

-- characters bucket: public read + owner upload
drop policy if exists "characters public read" on storage.objects;
create policy "characters public read" on storage.objects
  for select using (bucket_id = 'characters');

drop policy if exists "characters owner upload" on storage.objects;
create policy "characters owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'characters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
