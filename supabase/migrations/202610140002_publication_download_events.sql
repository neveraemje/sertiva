-- Keep individual download events for the owner's Published detail panel.
begin;

create table public.published_certificate_downloads (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.published_certificates(certificate_id) on delete cascade,
  entry_id uuid not null references public.published_certificate_entries(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index published_certificate_downloads_recent_idx
  on public.published_certificate_downloads (certificate_id, downloaded_at desc);

alter table public.published_certificate_downloads enable row level security;
revoke all on public.published_certificate_downloads from anon, authenticated;
grant select on public.published_certificate_downloads to authenticated;

create policy "Owners can read certificate downloads"
  on public.published_certificate_downloads for select to authenticated
  using (exists (
    select 1 from public.certificates c
    where c.id = certificate_id and c.user_id = (select auth.uid())
  ));

create or replace function public.record_published_certificate_download(p_slug text, p_token uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  entry_id uuid;
  publication_id uuid;
begin
  update public.published_certificate_entries e
  set download_count = e.download_count + 1,
      last_downloaded_at = now()
  from public.published_certificates p
  where e.download_token = p_token
    and e.certificate_id = p.certificate_id
    and p.slug = p_slug
  returning e.id, e.certificate_id into entry_id, publication_id;

  if entry_id is null then
    return false;
  end if;

  insert into public.published_certificate_downloads (certificate_id, entry_id)
  values (publication_id, entry_id);

  update public.published_certificates p
  set download_count = p.download_count + 1
  where p.certificate_id = publication_id;
  return true;
end;
$$;

commit;
