-- Create post_likes table
create table if not exists public.post_likes (
    post_id uuid references public.forum_posts(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (post_id, user_id)
);

-- Create post_reposts table
create table if not exists public.post_reposts (
    post_id uuid references public.forum_posts(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (post_id, user_id)
);

-- Create function to update post likes count
create or replace function public.update_post_likes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'DELETE') then
    update public.forum_posts
    set likes_count = likes_count - 1
    where id = OLD.post_id;
    return OLD;
  elsif (TG_OP = 'INSERT') then
    update public.forum_posts
    set likes_count = likes_count + 1
    where id = NEW.post_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Create function to update post reposts count
create or replace function public.update_post_reposts_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'DELETE') then
    update public.forum_posts
    set reposts_count = reposts_count - 1
    where id = OLD.post_id;
    return OLD;
  elsif (TG_OP = 'INSERT') then
    update public.forum_posts
    set reposts_count = reposts_count + 1
    where id = NEW.post_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Create triggers for likes and reposts count updates
create trigger post_likes_count_trigger
after insert or delete on public.post_likes
for each row
execute function public.update_post_likes_count();

create trigger post_reposts_count_trigger
after insert or delete on public.post_reposts
for each row
execute function public.update_post_reposts_count();

-- Add RLS policies
alter table public.post_likes enable row level security;
alter table public.post_reposts enable row level security;

-- Post likes policies
create policy "Post likes are viewable by everyone"
on public.post_likes for select
to public
using (true);

create policy "Authenticated users can like posts"
on public.post_likes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can remove their likes"
on public.post_likes for delete
to authenticated
using (user_id = auth.uid());

-- Post reposts policies
create policy "Post reposts are viewable by everyone"
on public.post_reposts for select
to public
using (true);

create policy "Authenticated users can repost posts"
on public.post_reposts for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can remove their reposts"
on public.post_reposts for delete
to authenticated
using (user_id = auth.uid());