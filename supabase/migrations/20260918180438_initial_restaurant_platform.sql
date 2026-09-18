-- Mesa3D: access is enforced in PostgreSQL, including requests made outside the UI.
create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  tagline text not null default '' check (char_length(tagline) <= 120),
  description text not null default '' check (char_length(description) <= 500),
  address text not null default '' check (char_length(address) <= 200),
  hours text not null default '' check (char_length(hours) <= 160),
  accent text not null default '#c84924' check (accent ~ '^#[a-fA-F0-9]{6}$'),
  currency text not null default 'ARS' check (currency in ('ARS','USD','EUR')),
  categories text[] not null default array['Para empezar','Principales','Postres','Bebidas'] check (cardinality(categories) between 1 and 20),
  published boolean not null default false
);
create table public.restaurant_members (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (restaurant_id, user_id)
);
create index restaurant_members_user_idx on public.restaurant_members(user_id, restaurant_id);
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 600),
  price numeric(12,2) not null default 0 check (price >= 0 and price <= 10000000),
  category text not null check (char_length(category) between 1 and 60),
  image_url text not null default '' check (image_url = '' or image_url ~ '^(https://|/media/)'),
  model_url text not null default '' check (model_url = '' or model_url ~ '^(https://|/models/)'),
  usdz_url text not null default '' check (usdz_url = '' or usdz_url ~ '^(https://|/models/)'),
  available boolean not null default true,
  featured boolean not null default false,
  demo_model boolean not null default false,
  allergens text not null default '' check (char_length(allergens) <= 250),
  sort_order integer not null default 0 check (sort_order >= 0)
);
create index dishes_restaurant_order_idx on public.dishes(restaurant_id, sort_order);
alter table public.platform_admins enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.dishes enable row level security;

revoke all on public.platform_admins, public.restaurants, public.restaurant_members, public.dishes from anon, authenticated;
grant select on public.restaurants, public.dishes to anon;
grant select on public.platform_admins to authenticated;
grant select, insert, update, delete on public.restaurant_members, public.restaurants, public.dishes to authenticated;
grant all on public.platform_admins, public.restaurant_members, public.restaurants, public.dishes to service_role;

create policy own_admin_record on public.platform_admins for select to authenticated
using (user_id = (select auth.uid()));
create policy own_memberships on public.restaurant_members for select to authenticated
using (user_id = (select auth.uid()) or exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())));
create policy admin_manage_memberships on public.restaurant_members for all to authenticated
using (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())));

create policy read_published_restaurants on public.restaurants for select to anon, authenticated using (published);
create policy read_managed_restaurants on public.restaurants for select to authenticated
using (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid()))
  or exists(select 1 from public.restaurant_members m where m.restaurant_id = restaurants.id and m.user_id = (select auth.uid())));
create policy admin_create_restaurants on public.restaurants for insert to authenticated
with check (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())));
create policy manage_restaurants on public.restaurants for update to authenticated
using (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid()))
  or exists(select 1 from public.restaurant_members m where m.restaurant_id = restaurants.id and m.user_id = (select auth.uid())))
with check (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid()))
  or exists(select 1 from public.restaurant_members m where m.restaurant_id = restaurants.id and m.user_id = (select auth.uid())));
create policy admin_delete_restaurants on public.restaurants for delete to authenticated
using (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())));

create policy read_public_dishes on public.dishes for select to anon, authenticated
using (available and exists(select 1 from public.restaurants r where r.id = dishes.restaurant_id and r.published));
create policy manage_dishes on public.dishes for all to authenticated
using (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid()))
  or exists(select 1 from public.restaurant_members m where m.restaurant_id = dishes.restaurant_id and m.user_id = (select auth.uid())))
with check (exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid()))
  or exists(select 1 from public.restaurant_members m where m.restaurant_id = dishes.restaurant_id and m.user_id = (select auth.uid())));

-- Keep the restaurant URL/QR stable; prevent moving dishes between tenants.
create function public.protect_restaurant_identity() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.slug is distinct from old.slug then
    raise exception 'Restaurant identity and URL cannot be changed';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_restaurant_identity() from public, anon, authenticated;
create trigger restaurant_identity before update on public.restaurants for each row execute function public.protect_restaurant_identity();
create function public.protect_dish_identity() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.restaurant_id is distinct from old.restaurant_id then
    raise exception 'Dish identity and restaurant cannot be changed';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_dish_identity() from public, anon, authenticated;
create trigger dish_identity before update on public.dishes for each row execute function public.protect_dish_identity();

-- Catalog files are public by design. All writes are restricted by restaurant ID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-media', 'dish-media', true, 26214400,
  array['image/jpeg','image/png','image/webp','model/gltf-binary','model/vnd.usdz+zip'])
on conflict (id) do nothing;
create policy read_dish_media on storage.objects for select to anon, authenticated using (bucket_id = 'dish-media');
create policy manage_dish_media on storage.objects for all to authenticated
using (bucket_id = 'dish-media' and (
  exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())) or
  exists(select 1 from public.restaurant_members m where m.user_id = (select auth.uid()) and m.restaurant_id::text = (storage.foldername(name))[1])))
with check (bucket_id = 'dish-media' and (
  exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid())) or
  exists(select 1 from public.restaurant_members m where m.user_id = (select auth.uid()) and m.restaurant_id::text = (storage.foldername(name))[1])));
