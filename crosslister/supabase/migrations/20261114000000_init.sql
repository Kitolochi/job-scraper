-- Crosslister schema. Single user, but every row is still owner-scoped through RLS,
-- because the anon key ships inside the extension and anyone can read it.

create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sku text not null unique,
  title text not null default '',
  description text not null default '',
  brand text,
  category text,
  size text,
  color text,
  condition text check (condition in ('new_with_tags', 'new_without_tags', 'excellent', 'good', 'fair')),
  price_cents int check (price_cents >= 0),
  original_price_cents int check (original_price_cents >= 0), -- Poshmark requires "original price"
  cost_cents int check (cost_cents >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'sold', 'archived')),
  created_at timestamptz not null default now(),
  sold_at timestamptz
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  storage_path text not null,
  position int not null default 0
);
create index photos_item_idx on photos (item_id, position);

create table listings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  platform text not null check (platform in ('poshmark', 'depop')),
  external_id text,
  url text,
  status text not null default 'pending' check (status in ('pending', 'live', 'sold', 'delisted', 'error')),
  price_cents int check (price_cents >= 0),
  last_error text,
  updated_at timestamptz not null default now(),
  unique (item_id, platform)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  action text not null check (action in ('create', 'delist', 'update_price')),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  attempts int not null default 0,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index jobs_queue_idx on jobs (status, run_after);

create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger listings_touch before update on listings
  for each row execute function touch_updated_at();

-- Row level security ---------------------------------------------------------

alter table items enable row level security;
alter table photos enable row level security;
alter table listings enable row level security;
alter table jobs enable row level security;

create policy items_owner on items for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy photos_owner on photos for all to authenticated
  using (exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid()));

create policy listings_owner on listings for all to authenticated
  using (exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid()));

create policy jobs_owner on jobs for all to authenticated
  using (exists (
    select 1 from listings l join items i on i.id = l.item_id
    where l.id = listing_id and i.owner_id = auth.uid()))
  with check (exists (
    select 1 from listings l join items i on i.id = l.item_id
    where l.id = listing_id and i.owner_id = auth.uid()));

-- Photo storage: private bucket, objects stored under "<user id>/<item id>/<file>".

insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
  on conflict (id) do nothing;

create policy photos_bucket_owner on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
