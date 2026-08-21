-- 0001_base.sql
-- Schema base multi-tenant do Bix Platform Standard (organizations, profiles,
-- user_roles, invitations) + funções RLS de base + trigger genérico
-- touch_updated_at. Mantido por consistência de infraestrutura de Auth
-- (login Google OAuth exige `profiles`) mesmo em projetos com
-- `multiorg: false` — ver architecture.md deste projeto.

-- ============================================================================
-- Trigger genérico: mantém updated_at sempre atual em qualquer tabela que o
-- use. Reaproveitado pelas migrations seguintes (0002_planos.sql).
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Tabelas
-- ============================================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_touch_updated_at
  before update on public.organizations
  for each row
  execute function public.touch_updated_at();

-- Espelho de auth.users. Uma linha é criada automaticamente no signup
-- (trigger abaixo), para que login via Google OAuth já tenha perfil
-- disponível sem passo manual extra.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_bix_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_organization_id_idx on public.user_roles (organization_id);

create trigger user_roles_touch_updated_at
  before update on public.user_roles
  for each row
  execute function public.touch_updated_at();

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  token uuid not null default gen_random_uuid(),
  invited_by uuid not null references auth.users (id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token)
);

create index invitations_organization_id_idx on public.invitations (organization_id);
create index invitations_email_idx on public.invitations (email);

create trigger invitations_touch_updated_at
  before update on public.invitations
  for each row
  execute function public.touch_updated_at();

-- ============================================================================
-- Trigger: cria profile automaticamente quando um novo usuário é criado em
-- auth.users (necessário para o fluxo de login Google OAuth).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- Funções RLS de base
-- ============================================================================

create or replace function public.is_bix_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_bix_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.user_roles
  where user_id = auth.uid();
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and organization_id = org_id
  );
$$;

create or replace function public.has_org_role(org_id uuid, role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and organization_id = org_id
      and user_roles.role = has_org_role.role
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.invitations enable row level security;

-- organizations
create policy organizations_select on public.organizations
  for select
  using (public.is_org_member(id) or public.is_bix_admin());

create policy organizations_insert on public.organizations
  for insert
  with check (auth.uid() is not null);

create policy organizations_update on public.organizations
  for update
  using (
    public.has_org_role(id, 'owner')
    or public.has_org_role(id, 'admin')
    or public.is_bix_admin()
  )
  with check (
    public.has_org_role(id, 'owner')
    or public.has_org_role(id, 'admin')
    or public.is_bix_admin()
  );

create policy organizations_delete on public.organizations
  for delete
  using (public.has_org_role(id, 'owner') or public.is_bix_admin());

-- profiles
create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_bix_admin()
    or exists (
      select 1
      from public.user_roles mine
      join public.user_roles theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create policy profiles_insert on public.profiles
  for insert
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update
  using (id = auth.uid() or public.is_bix_admin())
  with check (id = auth.uid() or public.is_bix_admin());

create policy profiles_delete on public.profiles
  for delete
  using (public.is_bix_admin());

-- user_roles
create policy user_roles_select on public.user_roles
  for select
  using (
    user_id = auth.uid()
    or public.is_org_member(organization_id)
    or public.is_bix_admin()
  );

create policy user_roles_insert on public.user_roles
  for insert
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.is_bix_admin()
  );

create policy user_roles_update on public.user_roles
  for update
  using (
    public.has_org_role(organization_id, 'owner')
    or public.is_bix_admin()
  )
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.is_bix_admin()
  );

create policy user_roles_delete on public.user_roles
  for delete
  using (
    public.has_org_role(organization_id, 'owner')
    or public.is_bix_admin()
  );

-- invitations
create policy invitations_select on public.invitations
  for select
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.is_bix_admin()
    or email = (select email from public.profiles where id = auth.uid())
  );

create policy invitations_insert on public.invitations
  for insert
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.is_bix_admin()
  );

create policy invitations_update on public.invitations
  for update
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.is_bix_admin()
  )
  with check (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.is_bix_admin()
  );

create policy invitations_delete on public.invitations
  for delete
  using (
    public.has_org_role(organization_id, 'owner')
    or public.has_org_role(organization_id, 'admin')
    or public.is_bix_admin()
  );
