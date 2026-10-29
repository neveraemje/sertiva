-- Public links expose only the certificate data needed to render a named copy.
begin;

create table public.published_certificates (
  certificate_id uuid primary key references public.certificates(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  design_path text not null,
  preview_path text,
  width double precision not null check (width > 0),
  height double precision not null check (height > 0),
  editor jsonb not null,
  expires_at timestamptz,
  published_at timestamptz not null default now()
);

create index published_certificates_expires_idx
  on public.published_certificates (expires_at)
  where expires_at is not null;

alter table public.published_certificates enable row level security;
grant select on public.published_certificates to anon;
grant select, insert, update, delete on public.published_certificates to authenticated;

create policy "Anyone can read active published certificates"
  on public.published_certificates for select to anon, authenticated
  using (expires_at is null or expires_at > now());

create policy "Owners can read their publications"
  on public.published_certificates for select to authenticated
  using (exists (
    select 1 from public.certificates c
    where c.id = certificate_id and c.user_id = (select auth.uid())
  ));

create policy "Owners can publish their certificate files"
  on public.published_certificates for insert to authenticated
  with check (exists (
    select 1 from public.certificates c
    where c.id = certificate_id
      and c.user_id = (select auth.uid())
      and c.design_path = published_certificates.design_path
      and c.preview_path is not distinct from published_certificates.preview_path
  ));

create policy "Owners can update their publications"
  on public.published_certificates for update to authenticated
  using (exists (
    select 1 from public.certificates c
    where c.id = certificate_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.certificates c
    where c.id = certificate_id
      and c.user_id = (select auth.uid())
      and c.design_path = published_certificates.design_path
      and c.preview_path is not distinct from published_certificates.preview_path
  ));

create policy "Owners can remove their publications"
  on public.published_certificates for delete to authenticated
  using (exists (
    select 1 from public.certificates c
    where c.id = certificate_id and c.user_id = (select auth.uid())
  ));

-- The bucket remains private. Anonymous users can sign URLs only for assets
-- referenced by a live publication.
create policy "Anyone can read active published certificate files"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'certificate-designs'
    and exists (
      select 1 from public.published_certificates p
      where coalesce(p.preview_path, p.design_path) = objects.name
        and (p.expires_at is null or p.expires_at > now())
    )
  );

commit;
