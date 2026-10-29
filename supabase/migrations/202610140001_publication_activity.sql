-- Keep a private record of each submitted name and the downloads it generates.
begin;

alter table public.published_certificates
  add column submission_count bigint not null default 0,
  add column download_count bigint not null default 0;

-- Existing single-use claims have a known name. Older repeat uses and downloads
-- were not recorded, so they cannot be recovered.
create table public.published_certificate_entries (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.published_certificates(certificate_id) on delete cascade,
  recipient_name text not null check (length(btrim(recipient_name)) between 1 and 100),
  recipient_email text check (recipient_email is null or length(recipient_email) <= 254),
  created_at timestamptz not null default now(),
  download_token uuid not null default gen_random_uuid() unique,
  download_count bigint not null default 0,
  last_downloaded_at timestamptz
);

create index published_certificate_entries_recent_idx
  on public.published_certificate_entries (certificate_id, created_at desc);

insert into public.published_certificate_entries (certificate_id, recipient_name, created_at)
select certificate_id, claimed_name, claimed_at
from public.published_certificates
where claimed_at is not null and claimed_name is not null;

update public.published_certificates p
set submission_count = (
  select count(*) from public.published_certificate_entries e
  where e.certificate_id = p.certificate_id
);

alter table public.published_certificate_entries enable row level security;
revoke all on public.published_certificate_entries from anon, authenticated;
grant select on public.published_certificate_entries to authenticated;

create policy "Owners can read certificate entries"
  on public.published_certificate_entries for select to authenticated
  using (exists (
    select 1 from public.certificates c
    where c.id = certificate_id and c.user_id = (select auth.uid())
  ));

drop function public.claim_published_certificate(text, text, text);
create function public.claim_published_certificate(
  p_slug text,
  p_name text,
  p_email text default null
)
returns table (
  name text,
  design_path text,
  preview_path text,
  editor jsonb,
  download_token uuid
)
language plpgsql security definer set search_path = ''
as $$
declare
  publication public.published_certificates%rowtype;
  entry_token uuid;
  normalized_email text := nullif(lower(btrim(p_email)), '');
begin
  if p_name is null or length(btrim(p_name)) = 0 or length(btrim(p_name)) > 100 then
    raise exception 'Enter a name of up to 100 characters.';
  end if;
  if normalized_email is not null and length(normalized_email) > 254 then
    raise exception 'Enter a valid email address.';
  end if;

  select p.* into publication
  from public.published_certificates p
  where p.slug = p_slug
  for update;

  if not found or (publication.expires_at is not null and publication.expires_at <= now()) then
    raise exception 'This certificate link is unavailable or has expired.';
  end if;
  if publication.access_mode = 'restricted'
    and (normalized_email is null or normalized_email <> all(publication.allowed_emails)) then
    raise exception 'This email is not allowed for this certificate.';
  end if;
  if publication.input_mode = 'single' and publication.claimed_at is not null then
    raise exception 'This certificate link has already been used.';
  end if;

  if publication.input_mode = 'single' then
    update public.published_certificates p
    set claimed_at = now(), claimed_name = btrim(p_name), submission_count = p.submission_count + 1
    where p.certificate_id = publication.certificate_id;
  else
    update public.published_certificates p
    set submission_count = p.submission_count + 1
    where p.certificate_id = publication.certificate_id;
  end if;

  insert into public.published_certificate_entries (
    certificate_id, recipient_name, recipient_email
  ) values (
    publication.certificate_id, btrim(p_name),
    case when publication.access_mode = 'restricted' then normalized_email else null end
  ) returning published_certificate_entries.download_token into entry_token;

  return query select publication.name, publication.design_path,
    publication.preview_path, publication.editor, entry_token;
end;
$$;

revoke all on function public.claim_published_certificate(text, text, text) from public;
grant execute on function public.claim_published_certificate(text, text, text) to anon, authenticated;

create function public.record_published_certificate_download(p_slug text, p_token uuid)
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

  update public.published_certificates p
  set download_count = p.download_count + 1
  where p.certificate_id = publication_id;
  return true;
end;
$$;

revoke all on function public.record_published_certificate_download(text, uuid) from public;
grant execute on function public.record_published_certificate_download(text, uuid) to anon, authenticated;

commit;
