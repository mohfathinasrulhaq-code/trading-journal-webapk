-- =====================================================================
-- Phase 04 / Migration 5: Auth & Profile enhancements
-- Menambahkan avatar_url pada profiles dan memperkaya trigger handle_new_user
-- agar menangkap metadata pendaftaran (Google OAuth & Email sign-up).
-- =====================================================================

alter table public.profiles
  add column if not exists avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500);

-- Perbarui hak akses kolom untuk authenticated
grant update (display_name, timezone, avatar_url) on public.profiles to authenticated;

-- Perbarui trigger handle_new_user agar mengisi display_name dan avatar_url dari metadata OAuth / registrasi
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  if v_name is not null and char_length(v_name) > 80 then
    v_name := substring(v_name from 1 for 80);
  end if;

  v_avatar := new.raw_user_meta_data->>'avatar_url';
  if v_avatar is not null and char_length(v_avatar) > 500 then
    v_avatar := substring(v_avatar from 1 for 500);
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, v_name, v_avatar)
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;
