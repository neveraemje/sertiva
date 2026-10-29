-- Publishing preferences and an atomic claim for one-name links.
begin;

alter table public.published_certificates
  add column access_mode text not null default 'anyone'
    check (access_mode in ('anyone', 'restricted')),
  add column allowed_emails text[] not null default '{}',
  add column input_mode text not null default 'repeat'
    check (input_mode in ('single', 'repeat')),
  add column claimed_at timestamptz,
  add column claimed_name text,
  add constraint restricted_publication_needs_email
    check (access_mode = 'anyone' or cardinality(allowed_emails) > 0);

revoke select on public.published_certificates from anon;
drop policy "Anyone can read active published certificates" on public.published_certificates;

-- Public pages receive only the information needed to show the form.
create function public.published_certificate_status(p_slug text)
returns table (name text, access_mode text, input_mode text, available boolean)
language sql stable security definer set search_path = ''
as $$
  select p.name, p.access_mode, p.input_mode,
    (p.input_mode = 'repeat' or p.claimed_at is null)
  from public.published_certificates p
  where p.slug = p_slug
    and (p.expires_at is null or p.expires_at > now());
$$;

revoke all on function public.published_certificate_status(text) from public;
grant execute on function public.published_certificate_status(text) to anon, authenticated;

-- Lock the publication so concurrent visitors cannot claim the same single-use link.
create function public.claim_published_certificate(
  p_slug text,
  p_name text,
  p_email text default null
)
returns table (name text, design_path text, preview_path text, editor jsonb)
language plpgsql security definer set search_path = ''
as $$
declare
  publication public.published_certificates%rowtype;
begin
  if p_name is null or length(btrim(p_name)) = 0 or length(btrim(p_name)) > 100 then
    raise exception 'Enter a name of up to 100 characters.';
  end if;

  select p.* into publication
  from public.published_certificates p
  where p.slug = p_slug
  for update;

  if not found or (publication.expires_at is not null and publication.expires_at <= now()) then
    raise exception 'This certificate link is unavailable or has expired.';
  end if;

  if publication.access_mode = 'restricted'
    and (p_email is null or lower(btrim(p_email)) <> all(publication.allowed_emails)) then
    raise exception 'This email is not allowed for this certificate.';
  end if;

  if publication.input_mode = 'single' then
    if publication.claimed_at is not null then
      raise exception 'This certificate link has already been used.';
    end if;

    update public.published_certificates p
    set claimed_at = now(), claimed_name = btrim(p_name)
    where p.certificate_id = publication.certificate_id;
  end if;

  return query select publication.name, publication.design_path,
    publication.preview_path, publication.editor;
end;
$$;

revoke all on function public.claim_published_certificate(text, text, text) from public;
grant execute on function public.claim_published_certificate(text, text, text) to anon, authenticated;

-- Storage can sign active published assets, but cannot list the bucket through
-- this public policy. Asset paths are returned only after the email check.
create function public.is_active_published_asset(p_path text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.published_certificates p
    where coalesce(p.preview_path, p.design_path) = p_path
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

revoke all on function public.is_active_published_asset(text) from public;
grant execute on function public.is_active_published_asset(text) to anon, authenticated;

drop policy "Anyone can read active published certificate files" on storage.objects;
create policy "Anyone can sign active published certificate files"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'certificate-designs'
    and storage.allow_only_operation('object.sign')
    and public.is_active_published_asset(name)
  );

commit;
