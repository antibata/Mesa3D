-- Contact details are private to platform administrators, never part of a public menu.
create table public.restaurant_clients (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  contact_name text not null default '' check (char_length(contact_name) <= 100),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 40),
  delivered_at timestamptz
);
alter table public.restaurant_clients enable row level security;
revoke all on public.restaurant_clients from anon, authenticated;
grant select, insert, update, delete on public.restaurant_clients to authenticated;
grant all on public.restaurant_clients to service_role;
create policy platform_manage_clients on public.restaurant_clients for all to authenticated
using (exists(select 1 from public.platform_admins where user_id = (select auth.uid())))
with check (exists(select 1 from public.platform_admins where user_id = (select auth.uid())));

-- Only the server's service role may resolve an exact email. No public user directory.
grant usage on schema auth to service_role;
grant select(id,email,email_confirmed_at) on auth.users to service_role;
create function public.lookup_onboarding_user(p_email text)
returns table(id uuid, confirmed boolean) language sql stable security invoker set search_path = '' as $$
  select id, email_confirmed_at is not null from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke all on function public.lookup_onboarding_user(text) from public, anon, authenticated;
grant execute on function public.lookup_onboarding_user(text) to service_role;
