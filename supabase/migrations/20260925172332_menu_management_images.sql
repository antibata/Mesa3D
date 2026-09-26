-- Images are the only supported dish media. Existing photographs and dishes are preserved.
alter table public.dishes drop column model_url, drop column usdz_url, drop column demo_model;
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'dish-media';

create function public.manage_menu_sections(p_id uuid, p_categories text[], p_previous text[], p_from text default null, p_to text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare current_categories text[];
begin
  if not (exists(select 1 from public.platform_admins where user_id = auth.uid()) or
    exists(select 1 from public.restaurant_members where restaurant_id = p_id and user_id = auth.uid())) then
    raise exception 'Access denied';
  end if;
  select categories into current_categories from public.restaurants where id = p_id for update;
  if not found or current_categories is distinct from p_previous then raise exception 'Sections changed; reload'; end if;
  if p_categories is null or cardinality(p_categories) not between 1 and 20 or
    exists(select 1 from unnest(p_categories) c where c is null or char_length(btrim(c)) not between 1 and 60 or c <> btrim(c)) or
    (select count(distinct lower(c)) from unnest(p_categories) c) <> cardinality(p_categories) then
    raise exception 'Invalid sections';
  end if;
  if p_from is not null then
    if not p_from = any(current_categories) or p_to is null or not p_to = any(p_categories) then raise exception 'Invalid rename'; end if;
    update public.dishes set category = p_to where restaurant_id = p_id and category = p_from;
  end if;
  if exists(select 1 from public.dishes where restaurant_id = p_id and not category = any(p_categories)) then raise exception 'Move dishes before removing a section'; end if;
  update public.restaurants set categories = p_categories where id = p_id;
end;
$$;
revoke all on function public.manage_menu_sections(uuid,text[],text[],text,text) from public, anon;
grant execute on function public.manage_menu_sections(uuid,text[],text[],text,text) to authenticated;

create function public.reorder_menu_dishes(p_id uuid, p_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not (exists(select 1 from public.platform_admins where user_id = auth.uid()) or
    exists(select 1 from public.restaurant_members where restaurant_id = p_id and user_id = auth.uid())) then raise exception 'Access denied'; end if;
  perform 1 from public.restaurants where id = p_id for update;
  if not found or p_ids is null or cardinality(p_ids) <> (select count(*) from public.dishes where restaurant_id = p_id)
    or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id)
    or exists(select 1 from unnest(p_ids) as u(id) where not exists(select 1 from public.dishes d where d.id = u.id and d.restaurant_id = p_id))
    then raise exception 'Menu changed; reload'; end if;
  update public.dishes d set sort_order = ordering.ordinality - 1
    from unnest(p_ids) with ordinality ordering(id, ordinality)
    where d.id = ordering.id and d.restaurant_id = p_id;
end;
$$;
revoke all on function public.reorder_menu_dishes(uuid,uuid[]) from public, anon;
grant execute on function public.reorder_menu_dishes(uuid,uuid[]) to authenticated;

-- Deferred checks let a section rename update its dishes in the same transaction.
create function public.check_menu_sections() returns trigger language plpgsql security invoker set search_path = '' as $$
declare target uuid; names text[];
begin
  if tg_table_name = 'restaurants' then target := new.id; else target := new.restaurant_id; end if;
  select categories into names from public.restaurants where id = target for update;
  if names is not null and exists(select 1 from public.dishes where restaurant_id = target and not category = any(names)) then
    raise exception 'Dish category must belong to restaurant';
  end if;
  return null;
end;
$$;
revoke all on function public.check_menu_sections() from public, anon, authenticated;
create constraint trigger dish_section_consistency after insert or update on public.dishes deferrable initially deferred for each row execute function public.check_menu_sections();
create constraint trigger restaurant_section_consistency after update on public.restaurants deferrable initially deferred for each row execute function public.check_menu_sections();
