create index if not exists meals_custom_food_id_idx on public.meals (custom_food_id);

alter function public.set_updated_at() set search_path = '';
