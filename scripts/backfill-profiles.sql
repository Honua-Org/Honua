-- Backfill missing profiles for users in auth.users
-- This script inserts a profile row for every user in auth.users who does not have a corresponding row in profiles.

insert into profiles (id, full_name, username, created_at, updated_at)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.raw_user_meta_data->>'username', ''),
  timezone('utc', now()),
  timezone('utc', now())
from auth.users u
left join profiles p on u.id = p.id
where p.id is null;