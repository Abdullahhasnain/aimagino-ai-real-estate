create extension if not exists pgcrypto;

create table if not exists public.workspace_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_slug text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_slug text not null,
  lead_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (workspace_slug, lead_id)
);

alter table public.workspace_members enable row level security;
alter table public.lead_submissions enable row level security;

drop policy if exists "members can read own membership" on public.workspace_members;
create policy "members can read own membership"
on public.workspace_members for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "public can submit leads" on public.lead_submissions;
create policy "public can submit leads"
on public.lead_submissions for insert
to anon, authenticated
with check (length(workspace_slug) between 3 and 80 and jsonb_typeof(payload) = 'object');

drop policy if exists "members can read workspace leads" on public.lead_submissions;
create policy "members can read workspace leads"
on public.lead_submissions for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members member
    where member.user_id = auth.uid()
      and member.workspace_slug = lead_submissions.workspace_slug
  )
);

create index if not exists lead_submissions_workspace_created_idx
on public.lead_submissions (workspace_slug, created_at desc);

-- After creating the agency user in Supabase Authentication, run:
-- insert into public.workspace_members (user_id, workspace_slug)
-- values ('USER_UUID_FROM_AUTH', 'your-agency-slug');
