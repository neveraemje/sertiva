-- Certificate designs and editor settings belong to the authenticated user.
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  design_name text not null,
  design_mime text not null,
  design_path text not null unique,
  preview_path text,
  width double precision not null check (width > 0),
  height double precision not null check (height > 0),
  editor jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certificates_user_updated_idx
  on public.certificates (user_id, updated_at desc);

alter table public.certificates enable row level security;
revoke all on public.certificates from anon;
grant select, insert, update, delete on public.certificates to authenticated;

create policy "Users can read their certificates"
  on public.certificates for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their certificates"
  on public.certificates for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their certificates"
  on public.certificates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their certificates"
  on public.certificates for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificate-designs',
  'certificate-designs',
  false,
  20971520,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;

create policy "Users can read their certificate files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'certificate-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their certificate files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'certificate-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their certificate files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'certificate-designs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
